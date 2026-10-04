# A4 · Lock system implementation

The lock is a pure function (`tick`) that takes the saved state, the rules and the current clock readings, and returns the new state plus a list of events. UI code only reacts to events. Build and fully test the pure engine first (ticket T-030) before any UI.

## Files

| File | Contains |
| --- | --- |
| `src/lock/types.ts` | `LockState`, `LockReason`, `LockEvent`, `ClockReading` |
| `src/lock/constants.ts` | All numbers below |
| `src/lock/clock.ts` | `readClock()` — reads native uptime, boot id, wall time, server offset |
| `src/lock/lockEngine.ts` | Pure functions: `createLockState`, `tick`, `requestFinishDrawing`, `parentUnlock`, `applyRulesChange`, `getRemaining`. NO imports from React, Expo, or storage |
| `src/lock/lockStorage.ts` | `loadLockState(kidId)`, `saveLockState(state)` via secure-store |
| `src/lock/lockStore.ts` | Zustand store: current state, `remainingSec`, `events` queue |
| `src/lock/useLockTimer.ts` | Hook: runs `tick` every second while app is active, persists, dispatches events |
| `src/lock/LockGate.tsx` | Mounted in `app/_layout.tsx`; redirects to `/locked` when locked |
| `src/lock/serverTime.ts` | Calls Supabase `server_now()` RPC and stores the offset |
| `modules/lock-native/` | Native uptime, boot id, Android pinning, iOS Guided Access check |
| `__tests__/lock/lockEngine.test.ts` | All tests listed at the bottom of this tab |

## `src/lock/types.ts` (copy exactly)

```ts
export type LockReason = 'none' | 'daily' | 'cooldown' | 'bedtime' | 'parent';

export type LockEvent =
  | 'SESSION_START'
  | 'WARN_5'        // 5 minutes left
  | 'WARN_1'        // 1 minute left
  | 'BREAK'         // optional stretch reminder
  | 'AUTOSAVE'      // save the drawing NOW, lock comes next
  | 'LOCK'
  | 'UNLOCK';

export interface ClockReading {
  uptimeMs: number;          // native monotonic clock, never goes backwards within one boot
  bootId: string;            // changes after every device reboot
  wallMs: number;            // Date.now()
  serverOffsetMs: number | null; // serverNow - Date.now(), null if never synced
}

export interface LockState {
  version: 1;
  kidId: string;
  dayKey: string;                 // 'YYYY-MM-DD' local, last day counted
  usedTodaySec: number;
  extraTodaySec: number;          // parent "+15 min" or finish-drawing grants today
  sessionActive: boolean;
  sessionUsedSec: number;
  extraSessionSec: number;
  extensionsThisSession: number;
  warned5: boolean;
  warned1: boolean;
  lastBreakAtSec: number;         // sessionUsedSec when last BREAK fired
  lock: { reason: LockReason; untilWallMs: number | null }; // null = until a parent unlocks
  lastTick: { uptimeMs: number; wallMs: number; bootId: string };
  maxWallSeenMs: number;          // highest believable wall time ever seen
}
```

## `src/lock/constants.ts` (copy exactly)

```ts
export const TICK_INTERVAL_MS = 1000;
export const MAX_TICK_DELTA_SEC = 5;          // never count more than 5 s from one tick
export const PERSIST_EVERY_SEC = 15;          // save state to secure-store at least this often
export const WARN_5_SEC = 300;
export const WARN_1_SEC = 60;
export const SESSION_GAP_SEC = 600;           // away 10+ min => next play is a new session
export const CLOCK_TOLERANCE_MS = 120_000;    // 2 min of clock drift allowed
export const AUTOSAVE_TIMEOUT_MS = 1500;      // wait max this long for drawing save before locking
export const SERVER_SYNC_EVERY_MS = 600_000;  // re-check server time every 10 min when online
```

## Native module `modules/lock-native` (v1)

Create with `npx create-expo-module@latest --local lock-native`. JS API (`modules/lock-native/index.ts`):

```ts
export function getUptimeMs(): number;            // synchronous
export function getBootId(): string;              // synchronous
export function isPinned(): boolean;              // Android: lock task active; iOS: Guided Access on
export function startPinning(): Promise<boolean>; // Android: startLockTask(); iOS: always resolves false
export function stopPinning(): Promise<void>;     // Android: stopLockTask(); iOS: no-op
```

| Function | Android (Kotlin) | iOS (Swift) |
| --- | --- | --- |
| `getUptimeMs` | `SystemClock.elapsedRealtime()` | `Double(clock_gettime_nsec_np(CLOCK_MONOTONIC)) / 1_000_000` |
| `getBootId` | `Settings.Global.getInt(contentResolver, Settings.Global.BOOT_COUNT, -1).toString()` | `sysctl` `kern.boottime` → `tv_sec` as string |
| `isPinned` | `ActivityManager.lockTaskModeState != LOCK_TASK_MODE_NONE` | `UIAccessibility.isGuidedAccessEnabled` |
| `startPinning` | `currentActivity?.startLockTask()` → true; catch → false | return false |
| `stopPinning` | `currentActivity?.stopLockTask()` | no-op |

Android pinning (non-device-owner) shows a system confirmation; that is expected. Only call `startPinning` when the parent taps "Keep my child in the app" in Parent zone, and `stopPinning` after Parent Gate passes.

## Clock rules (`src/lock/clock.ts`)

- `readClock()` returns a `ClockReading` from the native module + `Date.now()` + stored server offset.
- `trustedWall(reading) = reading.serverOffsetMs === null ? reading.wallMs : reading.wallMs + reading.serverOffsetMs`.
- Server offset: on launch and every 10 minutes while online, call `supabase.rpc('server_now')`. `offset = Date.parse(result) - Date.now()`. Store in `app_meta` key `server_offset_ms`. This RPC needs no login: run `grant execute on function public.server_now() to anon;` in Supabase.
- `localDayKey(wallMs)` = local date `YYYY-MM-DD` from the device time zone.

## `tick()` — exact algorithm

Signature: `tick(state: LockState, rules: TimeRules, clock: ClockReading, ctx: { inKidArea: boolean }): { state: LockState; events: LockEvent[] }`

`ctx.inKidArea` is true only on routes under `(kid)/`. It is false on the lock screen, parent zone, onboarding and profile picker — time is not counted there.

Never mutate the input; copy it (`const s = structuredClone(state)`).

```text
1. DELTA
   if clock.bootId == s.lastTick.bootId:
       uptimeDelta = clock.uptimeMs - s.lastTick.uptimeMs
   else:
       uptimeDelta = 0                      // device rebooted, cannot measure
   deltaSec = clamp(uptimeDelta / 1000, 0, MAX_TICK_DELTA_SEC)

2. WALL CLOCK (anti-tamper)
   wall = trustedWall(clock)
   if wall < s.maxWallSeenMs - CLOCK_TOLERANCE_MS:
       wall = s.maxWallSeenMs               // clock moved backwards: ignore
   if same boot AND clock.serverOffsetMs == null
      AND (wall - s.lastTick.wallMs) - uptimeDelta > CLOCK_TOLERANCE_MS:
       wall = s.lastTick.wallMs + uptimeDelta // clock jumped forward: ignore jump
   s.maxWallSeenMs = max(s.maxWallSeenMs, wall)

3. SESSION GAP
   if s.sessionActive AND (wall - s.lastTick.wallMs) > SESSION_GAP_SEC * 1000:
       end session (sessionActive = false)

4. NEW DAY
   today = localDayKey(wall)
   if today > s.dayKey:
       s.dayKey = today; s.usedTodaySec = 0; s.extraTodaySec = 0
       if s.lock.reason == 'daily': s.lock = none; events += UNLOCK

5. BEDTIME
   if rules.bedtimeEnabled AND isInBedtime(wall, rules.bedtimeStart, rules.bedtimeEnd)
      AND NOT (s.lock.reason == 'none' AND parent extra time is active):
       if s.lock.reason != 'bedtime':
           if s.sessionActive: events += AUTOSAVE
           s.lock = { reason: 'bedtime', untilWallMs: nextBedtimeEnd(wall, rules.bedtimeEnd) }
           end session; events += LOCK
       goto SAVE_TICK

6. EXPIRE TIMED LOCKS
   if s.lock.reason in ('cooldown','bedtime') AND s.lock.untilWallMs != null AND wall >= s.lock.untilWallMs:
       s.lock = none; events += UNLOCK
   if s.lock.reason != 'none': goto SAVE_TICK   // locked: count nothing

7. COUNT
   if ctx.inKidArea:
       if NOT s.sessionActive:
           s.sessionActive = true; s.sessionUsedSec = 0; s.extraSessionSec = 0
           s.extensionsThisSession = 0; s.warned5 = false; s.warned1 = false; s.lastBreakAtSec = 0
           events += SESSION_START
       s.usedTodaySec += deltaSec
       s.sessionUsedSec += deltaSec

8. CHECK LIMITS  (only if s.sessionActive)
   dailyLeft   = rules.dailyLimitMin*60   + s.extraTodaySec   - s.usedTodaySec
   sessionLeft = rules.sessionLimitMin*60 + s.extraSessionSec - s.sessionUsedSec
   left = min(dailyLeft, sessionLeft)
   if left <= WARN_5_SEC AND NOT s.warned5: s.warned5 = true; events += WARN_5
   if left <= WARN_1_SEC AND NOT s.warned1: s.warned1 = true; events += WARN_1
   if rules.breakReminderMin != null
      AND s.sessionUsedSec - s.lastBreakAtSec >= rules.breakReminderMin*60:
       s.lastBreakAtSec = s.sessionUsedSec; events += BREAK
   if left <= 0:
       events += AUTOSAVE, LOCK
       if dailyLeft <= 0:
           s.lock = { reason: 'daily', untilWallMs: nextLocalMidnight(wall) }
       else:
           s.lock = { reason: 'cooldown', untilWallMs: wall + rules.cooldownMin*60_000 }
       end session

SAVE_TICK:
   s.lastTick = { uptimeMs: clock.uptimeMs, wallMs: wall, bootId: clock.bootId }
   return { state: s, events }
```

"End session" always means: `sessionActive = false`, `sessionUsedSec = 0`, `extraSessionSec = 0`, `extensionsThisSession = 0`, `warned5 = false`, `warned1 = false`.

Bedtime + parent extra time: when a parent lifts a bedtime lock with `plus15`/`plus30`, store the granted seconds in `extraSessionSec`; step 5 is skipped while that session is active and still has time left. When it runs out, step 8 locks and the next tick re-applies the bedtime lock.

`isInBedtime` must handle windows that cross midnight (19:30 → 07:00): in bedtime if `now >= start OR now < end` when `start > end`; if `start < end`, in bedtime if `start <= now < end`.

## Other engine functions

| Function | Rule |
| --- | --- |
| `createLockState(kidId, clock)` | All counters 0, `lock = none`, `dayKey = localDayKey(trustedWall)`, `maxWallSeenMs = trustedWall`, `lastTick` from clock |
| `getRemaining(state, rules)` | Returns `{ dailyLeftSec, sessionLeftSec, leftSec }` (never negative). Used by the TimePill (show `ceil(leftSec/60)` minutes) |
| `requestFinishDrawing(state, rules)` | Allowed only if `leftSec <= WARN_1_SEC` AND `extensionsThisSession < rules.maxExtensionsPerSession` AND not locked. Adds `rules.finishDrawingExtensionSec` to BOTH `extraSessionSec` and `extraTodaySec`, increments `extensionsThisSession`. Returns `{ state, granted: boolean }` |
| `parentUnlock(state, option, clock)` | Only callable after Parent Gate passes. `option`: `'plus15'` (+900 s to both extras), `'plus30'` (+1800 s), `'endSession'` (lock cooldown now), `'endDay'` (lock daily until midnight). For plus options: `lock = none`, `warned5/warned1 = false`, emit `UNLOCK`. Bedtime lock can be lifted only with `plus15`/`plus30`, and re-locks when that extra time runs out |
| `applyRulesChange(state, oldRules, newRules, clock)` | Re-run limit check with new rules; if locked for `daily`/`cooldown` and the new limits leave time, unlock |

## Hook `useLockTimer` (UI wiring)

1. On app start: load state for the active kid (or `createLockState`), `readClock()`, run `tick` with `inKidArea: false`, save. If locked → `router.replace('/locked')`.
2. While `AppState` is `active`: every `TICK_INTERVAL_MS` run `tick` with `inKidArea` = current route starts with `/(kid)`.
3. Save to secure-store when: 15 s passed since last save, OR any event fired, OR `AppState` changes to `background`/`inactive`.
4. On `AppState` → `active`: run one `tick` immediately.
5. Event handling:

| Event | Do this |
| --- | --- |
| `SESSION_START` | `usageRepo.incrementSessions` |
| `WARN_5` | Show `WindDownOverlay stage="warn5"`, play `yawn.m4a`, mascot mood `sleepy` |
| `WARN_1` | Show `WindDownOverlay stage="warn1"` with a "Finish my drawing" button (only on drawing screens) that calls `requestFinishDrawing` |
| `BREAK` | Show stretch-break bubble for 10 s (does not stop time) |
| `AUTOSAVE` | Call `canvasStore.saveNow()`; wait for it, max `AUTOSAVE_TIMEOUT_MS` |
| `LOCK` | After AUTOSAVE finished: `router.replace('/locked')` |
| `UNLOCK` | If on `/locked`: `router.replace('/(kid)/home')` |

6. Every 60 s also write `usedTodaySec` to `usage_day` via `usageRepo.addUsage` (the delta since last write) so the parent dashboard has data.

## `LockGate` rules

- Mounted once in `app/_layout.tsx`, renders nothing.
- If `lock.reason != 'none'` and current route is not `/locked` and does not start with `/parent`: `router.replace('/locked')`.
- Android hardware back button on `/locked`: does nothing (`BackHandler` returns true).
- Deep links into kid routes while locked are redirected the same way.

## Edge cases (all must behave like this)

| Situation | Expected result |
| --- | --- |
| Kid force-quits and reopens while locked | Opens straight to lock screen (state loaded from secure-store) |
| Kid changes device clock back 2 hours | Ignored (`maxWallSeenMs`); still locked |
| Kid changes clock forward to tomorrow, same boot, offline | Ignored (uptime check); still locked |
| Kid changes clock forward, reboots, offline | Cannot be detected offline. When the device next goes online, server time corrects `dayKey`. Accepted risk |
| Device reboots mid-session | Delta 0 for the first tick after reboot; counting resumes next tick |
| App in background 3 min | No time counted (no ticks); same session continues |
| App in background 15 min | Session ends; next play starts a new session (daily total still counts) |
| Time hits zero while drawing | AUTOSAVE completes, drawing appears in My Gallery, then lock screen |
| Parent changes daily limit from 45 to 60 while kid is locked (daily) | `applyRulesChange` unlocks; kid has 15 min |
| Midnight passes while locked for daily | Next tick: new day, unlock (unless bedtime) |
| Bedtime starts mid-session | AUTOSAVE, then bedtime lock until bedtime end |
| Two kid profiles | Each kid has its own `dd.lock.<kidId>` state. Switching profile requires Parent Gate |
| iOS app deleted and reinstalled | Keychain may keep `dd.lock.*`; if missing and a parent account exists, restore today's `used_sec` from Supabase (max rule) |
| Android app reinstalled | Secure-store is wiped; restore from Supabase if parent account exists, else starts fresh. Accepted risk |

## Required tests (`__tests__/lock/lockEngine.test.ts`)

Use a fake clock helper `makeClock({ uptimeMs, wallMs, bootId, serverOffsetMs })`. Use fixed local time zone `America/Chicago` in Jest config (`process.env.TZ`).

1. Counts 1 s per tick in kid area; counts 0 outside kid area.
2. Caps a 60 s uptime jump to 5 s.
3. Fires `SESSION_START` once at first kid-area tick.
4. Fires `WARN_5` exactly once at 5 min left, `WARN_1` exactly once at 1 min left.
5. At session limit (20 min, daily 45): emits `AUTOSAVE` then `LOCK`, reason `cooldown`, `untilWallMs = wall + 30 min`.
6. Cooldown expires after 30 min of wall time → `UNLOCK`.
7. At daily limit: reason `daily`, until next local midnight.
8. New day unlocks a `daily` lock and resets `usedTodaySec`.
9. Bedtime 19:30–07:00: at 19:30 locks with reason `bedtime`; at 07:00 unlocks.
10. Bedtime window that does not cross midnight (13:00–14:00) works.
11. Clock moved back 3 h: no unlock, `maxWallSeenMs` unchanged.
12. Clock moved forward 24 h on same boot with no server offset: ignored.
13. Clock forward with server offset present: server time wins.
14. Boot id change: delta 0 on that tick.
15. Away 11 min: session ends, next tick starts new session.
16. `requestFinishDrawing`: denied at 3 min left; granted at 50 s left; denied the second time in the same session.
17. `parentUnlock('plus15')` from daily lock: unlocked, 15 min available.
18. `applyRulesChange` raising daily limit unlocks.
19. `tick` does not mutate its input state object.

## iOS Screen Time shield (v1, iOS 17+)

A second wall on iOS: the operating system itself blocks the app when the budget is spent, so reinstalling or clock tricks cannot get around it. The in-app lock above stays the main lock and must work fully on its own; this shield only adds to it.

**Dependency:** Apple must grant the Family Controls entitlement to the owner's developer account. Build all of this now behind the flag `EXPO_PUBLIC_IOS_SCREEN_TIME=true|false`. While Apple has not approved, the flag is `false`, the parent setting is hidden, and nothing below runs. Approval = set flag to `true` and add the entitlement; no other code change.

**Library:** `react-native-device-activity` (with its Expo config plugin, which also creates the required DeviceActivityMonitor, ShieldConfiguration and ShieldAction app extensions). Read its README and use its equivalent for each step below. Do not invent function names; if the library lacks a step, write it in `docs/OPEN_QUESTIONS.md` and stop that step.

**Config (`app.config.ts`, iOS only, only when flag is true):** entitlement `com.apple.developer.family-controls: true`; the plugin's app group (e.g. `group.[YOUR_BUNDLE_ID].screentime`).

**Setup flow (Parent zone → "Extra iOS lock" row, iOS only):**

1. Explain in one sentence: "iPhone/iPad will also block Doodle Den when time is up."
2. Request Screen Time authorization for `.individual` (system prompt asks for the device owner's Face ID or passcode).
3. Show the system app picker. Instruction text: "Tap Doodle Den, then Done." Save the returned selection under id `dd.selection`.
4. Start monitoring (below). Show "Extra iOS lock is on."

**Monitoring rules (re-apply whenever time rules change):**

| Activity name | Schedule | Event | Action in extension |
| --- | --- | --- | --- |
| `dd.daily` | Every day 00:00–23:59 | `dd.limit` when the selected app's usage reaches `dailyLimitMin + extraToday` minutes | Shield `dd.selection` |
| `dd.daily` | (same) | interval start (midnight) | Remove shield |
| `dd.bedtime` | Every day `bedtimeStart`–`bedtimeEnd` (only if bedtime enabled) | interval start | Shield `dd.selection` |
| `dd.bedtime` | (same) | interval end | Remove shield |

**Shield screen (ShieldConfiguration):** background `colors.night`, title "The crayons are sleeping", subtitle "Ask a grown-up", primary button "OK" (closes), secondary button "Grown-up unlock".

**Grown-up unlock (ShieldAction, secondary button):** remove the shield for 2 minutes only (schedule a one-off `dd.grace` activity that re-shields at its end). The kid can press this too — that is fine, because opening the app lands on the in-app lock screen, which still needs the Parent Gate.

**In-app sync:**

- Engine `LOCK` → also shield `dd.selection` immediately.
- Parent unlock (`plus15`, `plus30`) after Parent Gate → remove shield, cancel `dd.grace`, restart `dd.daily` with the new threshold.
- `UNLOCK` at new day / end of bedtime / end of cooldown → remove shield.
- Parent turns the setting off → stop all monitoring, remove shield.

**Tests:** this part cannot run in Jest or the simulator reliably. Acceptance is a manual checklist on a real iPad: limit reached → shield appears even after force-quit; bedtime start → shield; grown-up unlock → 2-minute window → app opens to in-app lock; parent unlock removes shield.
