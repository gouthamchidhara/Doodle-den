# Kids Creative App — Build Spec

Oct 4, 2026 · @Goutham Kumar

## Overview

An ad-free creative play app for kids aged 3 to 8 — drawing, painting and art games — with a built-in screen-time lock that ends sessions calmly and can't be bypassed by closing the app.

**For AI coding agents:** this tab is the product overview only. Build instructions live in tabs A1–A7. Start at A1 · Agent rules & setup and work tickets in order from A6 · Task tickets.

**Scope decision:** one release, no later phases. Every feature in this doc — including all AI features, the iOS Screen Time shield, AR Wall and Family Gallery — is built for v1.

- **Working title:** Doodle Den (placeholder, not trademark-checked)
- **Platforms:** iPad and Android tablets first, iPhone and Android phones second
- **Who pays:** parents. Who plays: kids 3 to 8, split into two modes (3–5 Little, 6–8 Big)
- **Core promise:** your kid makes things, not just consumes them — and the app stops itself when time is up
- **Positioning:** Pok Pok's calm, ad-free trust + Kids Doodle's creative tools + a real lock system no competitor builds in

## Market & differentiation

No major kids creative app combines rich art games with an enforced, tamper-resistant time limit — that is the wedge. Competitor details below are from general knowledge, not freshly verified; confirm pricing before launch.

| App | Strength | Gap we exploit |
| --- | --- | --- |
| Pok Pok | Calm, ad-free, parent trust | Little real drawing; no time lock |
| Sago Mini / Toca Boca | Sandbox play, huge brand | Drawing is minor; no time lock |
| Crayola Create & Play | Brand, many art activities | Subscription fatigue; no lock |
| Kids Doodle / Drawing Desk | Fun brushes, replay | Ad-heavy free tiers, low trust |
| Quiver | AR wow factor | Needs printed pages; narrow |
| Khan Academy Kids / PBS Kids | Free, educational | Art is a side feature |

**Differentiation pillars**

1. **Lock that works:** session limits, bedtime, wind-down — enforced across relaunch and clock changes.
2. **Drawings come alive:** what kids draw becomes characters, animations, puzzles and music.
3. **Grows with the child:** Little mode (3–5) and Big mode (6–8) with different tools and games.
4. **Parent value:** weekly art digest, gallery export, skill progress — the reason parents keep paying.
5. **Zero ads, zero tracking:** Apple Kids Category and Google Families compliant from day one.

## Feature set

v1 ships 28 features in five Kid Home shelves (Draw, Play, Learn, Magic, My Stuff) plus a parent zone. Build details for each live in tab A5 (screens and games) and A7 (AI).

| Feature | What the kid does | Shelf | Mode |
| --- | --- | --- | --- |
| Free Draw | Draw/paint with crayon, marker, watercolor, glitter, neon, rainbow; stamps, stickers, undo | Draw | Both |
| Coloring Pages | Tap-to-fill (Little) or brush coloring (Big) on 30 bundled pages | Draw | Both |
| Guided Drawing | Step-by-step "draw a cat" with ghost lines | Draw | Big |
| Kaleidoscope | One stroke mirrored 2, 4 or 8 ways | Draw | Both |
| Flipbook Studio | Draw 3–8 frames, play as animation | Draw | Big |
| Paper Comes Alive | Photograph a paper drawing; it joins the aquarium, zoo or racetrack | Draw | Both |
| Draw-to-Life Aquarium | Draw a fish, it swims in a shared tank | Play | Both |
| Draw-to-Life Racetrack | Draw a car, it drives around a track | Play | Both |
| Draw-to-Life Zoo | Draw an animal, it walks around a zoo | Play | Both |
| Ramps & Rollers | Draw ramps and slides; balls roll down them | Play | Both |
| Music Paint | Each color is a note; painting plays a song | Play | Both |
| My Art Jigsaw | Own drawing becomes a 4–24 piece puzzle | Play | Both |
| AR Wall | Place own drawings in the room through the camera | Play | Big |
| Trace & Learn | Trace letters, numbers, shapes | Learn | Little |
| Color Mixing Lab + Name Your Colors | Mix paints, discover and name new colors | Learn | Both |
| Coloring Page Maker (AI) | Pick or say an idea; AI makes a coloring page | Magic | Both |
| Magic Sketch (AI) | Doodle becomes a polished cartoon twin | Magic | Both |
| Story Maker (AI) | Own drawings become a narrated story and printable book | Magic | Both |
| Mascot Guesses (AI) | Mascot makes funny guesses about the drawing | In canvas | Both |
| Drawing Coach (AI) | Mascot offers one gentle idea ("add a sun?") | In canvas | Both |
| Drawings That Talk | Record a silly voice for a creature | In gallery / worlds | Both |
| Stickers From My Art | Turn a drawing into a sticker; parents print sheets | In gallery | Both |
| My Gallery | Saved art, drawing replay | My Stuff | Both |
| Museum Night | Gallery becomes a museum with an opening show | My Stuff | Both |
| Sticker Book | Earned stickers and brushes | My Stuff | Both |
| Parent AI Digest (AI) | Weekly written summary for the parent | Parent zone | — |
| Family Gallery | Private web link where grandparents see chosen art | Parent zone | — |
| Time lock + parent controls | Limits, bedtime, wind-down, lock screen | Everywhere | — |

**Rewards without pressure:** kids earn stickers and new brushes for creating, never for time spent. No streaks, no loss mechanics, no timers that push "one more".

### Kid-brain magic

Seven features designed from a kid's point of view, all in v1.

| Feature | What the kid does | Build approach |
| --- | --- | --- |
| Name Your Colors | Discovers a new shade in Mixing Lab and names it ("dragon snot green"); it stays in their palette | Custom swatch per kid; name via picture-word picker (Little) or on-device speech (Big) |
| Paper Comes Alive | Draws on paper, snaps a photo, drawing moves in a world | `expo-camera` behind parent permission; white-paper keying in Skia (near-white pixels become transparent) + crop; photo never leaves device |
| Drawings That Talk | Records a silly voice for a creature | `expo-audio` recording + pitch presets; 10 s max; device only |
| Ramps & Rollers | Draws ramps; balls roll | Strokes become static bodies in `planck` (Box2D) physics, rendered with Skia |
| Museum Night | Gallery becomes a museum, creatures walk in, audience claps | Reuses gallery + Draw-to-Life animation |
| Stickers From My Art | Drawing becomes a sticker; parent prints sheets | Auto-trim to strokes → transparent PNG; sticker-sheet PDF via `expo-print` |
| Mascot Guesses | Mascot guesses what was drawn | AI vision call through the server (tab A7); spoken on device with `expo-speech` |

Guardrail for all seven: the kid's art is never changed without them asking, and every "magic" moment can be skipped.

### AI Magic

Six narrow AI features, free at launch, built so they can move to a paid tier by flipping one setting. There is no chat box for kids anywhere.

| Feature | Who sees it | Input → output | Safety shape |
| --- | --- | --- | --- |
| Coloring Page Maker | Kid | Picked or spoken idea → line-art coloring page | Idea built from allowlisted word tiles; spoken text moderated |
| Magic Sketch | Kid | Drawing → cartoon version | Original always kept; image output moderated |
| Story Maker | Kid + parent | 1–4 drawings → ≤120-word story, read aloud, printable | Text output moderated; fixed story template |
| Mascot Guesses | Kid | Drawing → 1–3 funny guesses | Output filtered against blocklist |
| Drawing Coach | Kid | Drawing → one idea from a fixed list of 40 | Model can only return an ID from the list |
| Parent AI Digest | Parent | Week's usage stats + artwork captions → short summary | Parent-facing only |

**Rules:** parent account + one-time AI consent required; all AI calls go through Supabase Edge Functions (keys never in the app); zero-retention providers; kid art never used for training; daily caps per family; `ai_magic` entitlement exists from day one with a server switch `ai_free_for_all = true` at launch. Full build spec: tab A7.

## Screen-time lock system

The lock is an in-app state machine on every platform, hardened against relaunch and clock tricks, with OS-level enforcement on iOS through Apple's Screen Time APIs. Apps cannot force-quit themselves on iOS (Apple rejects `exit()`), so "closing" always means showing the lock screen.

&#91;embedded content: lock flow · 5 states\]

Killing and reopening the app, rebooting, or changing the clock all land back on Locked, because the state lives in secure storage and time is counted on a monotonic clock.

**Three tiers**

| Tier | Platform | How it works |
| --- | --- | --- |
| 1. In-app lock | All | Timer → wind-down → full-screen lock; only a parent can unlock |
| 2. App pinning | Android | `startLockTask()` keeps the kid inside the app; parent PIN exits |
| 2. Guided Access prompt | iOS | Onboarding teaches parents to enable Guided Access; app detects it via `UIAccessibility.isGuidedAccessEnabled` |
| 3. Screen Time shield | iOS 17+ | `FamilyControls` + `ManagedSettings` + `DeviceActivity` shield the app at OS level when the budget is spent. Needs Apple's Family Controls entitlement: built in v1, switched on as soon as Apple approves it |

**Tamper resistance**

- Lock state (`lockedUntil`, `usedTodaySec`, `sessionStartedAt`) lives in secure storage (Keychain / EncryptedSharedPreferences), not app state — killing and reopening the app lands back on the lock screen.
- Time is counted with a monotonic clock (`elapsedRealtime` on Android, `ProcessInfo.systemUptime` on iOS) and cross-checked with server time on launch when online. Changing the device clock does nothing.
- Usage accrues only while the app is foregrounded; backgrounding pauses the timer.
- Offline: local monotonic count is trusted; a reboot resets uptime, so the last known used-time is persisted every 15 seconds.

**Parent-set rules**

- Daily limit (e.g. 30, 45, 60 min), per-session limit, cooldown between sessions
- Bedtime window (app locked e.g. 7:30 pm – 7:00 am)
- Break reminders ("go stretch" every 20 min, optional)
- Grace: "finish my drawing" gives one 2-minute extension per session, auto-saves work

**Kid-facing UX**

Warnings at 5 minutes and 1 minute (mascot yawns, sky dims). At zero, the current drawing auto-saves to the gallery, the mascot tucks the crayons into bed, and the lock screen shows a calm scene with an off-screen suggestion ("Draw on real paper!"). No alarming red, no countdown pressure.

## Parent zone

Everything a kid shouldn't touch — settings, purchases, links, unlock — sits behind a parental gate, which Apple's Kids Category requires.

- **Gate:** hold-to-confirm plus a randomized adult task (e.g. "type the number seventy-four"), or a 4-digit parent PIN set at onboarding. PIN required to unlock an active lock.
- **Dashboard:** minutes used today and this week, time per activity, artworks created, skills practiced (tracing accuracy, colors discovered).
- **Controls:** daily/session limits, bedtime, break reminders, Little/Big mode, per-game on/off, sound/voice volume.
- **Profiles:** up to 4 kids per family, each with own limits, gallery and avatar.
- **Weekly art digest:** push or email summary with the week's best drawings — the main retention hook for the paying parent.
- **Gallery export:** save to Photos, print-ready PDF, share link (parent-initiated only).

## Screens & navigation map

Kids move between Kid Home and eight activities with no text menus; anything for adults sits behind the parent gate, and the lock screen can appear over any screen.

&#91;embedded content: navigation map · kid side and parent side\]

v1 groups activities into five Kid Home shelves (Draw, Play, Learn, Magic, My Stuff), so the real app has more tiles than this map; the full screen list is in tab A5. See the mockups canvas for visual direction.

## Tech stack & architecture

Expo React Native with Skia for the canvas covers all four device types from one codebase; two small native modules handle the lock.

| Layer | Choice | Why |
| --- | --- | --- |
| App framework | Expo (dev build, not Expo Go) + React Native, TypeScript | One codebase for iPad, iPhone, Android tablet and phone; needed for native modules |
| Canvas / drawing | `@shopify/react-native-skia` | GPU drawing at 60–120 fps, custom brush shaders, Apple Pencil pressure and tilt |
| Animation | `react-native-reanimated` + Skia | Draw-to-Life worlds, mascot, transitions |
| Audio | `expo-audio` | Brush sounds, voice prompts, Music Paint notes |
| Lock: iOS | Swift module + DeviceActivity Monitor extension (`FamilyControls`, `ManagedSettings`) via Expo config plugin | OS-level shield in Phase 2 |
| Lock: Android | Kotlin module: `startLockTask()`, `SystemClock.elapsedRealtime()` | Pinning + monotonic time |
| Secure state | `expo-secure-store` | Lock state survives kill/relaunch |
| Local data | SQLite (`expo-sqlite`) + file system for PNG + stroke JSON | Offline-first gallery |
| Backend | Supabase (Postgres, Auth for parent account, Storage, Edge Functions) | Parent accounts, sync, server time, digest emails |
| Payments | RevenueCat | iOS + Android subscriptions, family sharing |
| Crash / perf | Sentry (kid-safe config: no PII, no ad IDs) | Allowed under Kids Category when no tracking |

**Drawing data:** every artwork is saved as both a flattened PNG and a stroke list (points, pressure, brush, color). Strokes enable replay, flipbook frames, jigsaw cutting and future AI features.

**Layouts:** tablet-first. Canvas fills the screen; tools dock left (landscape) or bottom (portrait/phone). Touch targets at least 64 pt for Little mode.

## Data model

Seven tables; kid profiles hold no real names or birthdates — only a nickname, avatar and age band.

| Table | Key fields | Notes |
| --- | --- | --- |
| `family` | id, parent\_user\_id, pin\_hash, plan, created\_at | One per parent account |
| `kid_profile` | id, family\_id, nickname, avatar\_id, age\_band (`little` / `big`) | No DOB, no photo |
| `time_rule` | kid\_id, daily\_limit\_min, session\_limit\_min, cooldown\_min, bedtime\_start, bedtime\_end, break\_every\_min | Parent-set |
| `usage_day` | kid\_id, date, used\_sec, sessions, extensions\_used | Synced from device; device is source of truth offline |
| `artwork` | id, kid\_id, activity, png\_path, strokes\_path, duration\_sec, created\_at, is\_favorite | Files in Supabase Storage, private bucket |
| `progress` | kid\_id, skill (e.g. `trace_letter_A`, `color_purple`), level, updated\_at | Drives dashboard + unlocks |
| `reward` | kid\_id, reward\_id, earned\_at | Stickers, brushes |

On device, a `lock_state` record in secure storage holds `lockedUntil`, `usedTodaySec`, `sessionStartedAt`, `lastUptimeSnapshot`, `lastServerTime`.

## Compliance

Kids apps get rejected for compliance far more than for bugs, so these rules are built in from sprint 1, not bolted on. Verify current policy text before submission; get a privacy lawyer review before launch.

- **COPPA (US):** collect nothing personal from kids. Parent account holds the only PII (email). Verifiable parental consent before any data leaves the device.
- **Apple Kids Category:** no third-party advertising or analytics SDKs, parental gate before external links, purchases and settings, no data sent to third parties. Select age band 6–8 or "5 and under" in App Store Connect.
- **Google Play Families policy:** declare target audience, use only Families-certified SDKs, no ad IDs. Apply for Teacher Approved later for organic visibility.
- **GDPR-K / UK Age Appropriate Design Code:** privacy by default, data minimization, easy deletion — matters if launching outside the US.
- **AI features:** process on device or with zero-retention API; kid art never used for model training; output filtered for safety; parent opt-in.
- **Kid art storage:** private bucket, signed URLs, encryption at rest, parent can delete everything in one tap.

**Camera and kid voice:** a child's photo or voice recording counts as personal information under COPPA. Keep both on device by default; any upload or sync needs verifiable parental consent first.

## Monetization & pricing

Freemium with one family subscription, no ads ever: target $6.99/month or $49.99/year with a 7-day free trial.

| Tier | Includes | Price |
| --- | --- | --- |
| Free | Free Draw (basic brushes), 10 coloring pages, Aquarium, full lock system, 1 kid profile | $0 |
| Family | All games, all brushes, new content monthly, up to 4 profiles, dashboard, weekly digest, gallery export | $6.99/mo or $49.99/yr |
| Lifetime (launch promo) | Family forever, limited window | \~$99 one-time |

The lock system stays free on purpose: it is the trust hook that gets the app installed. Paywall sits behind the parental gate only — kids never see a purchase prompt. Option later: bundle with Sprout & Co under one family plan if audiences overlap.

**AI pricing path:** all AI Magic features are free for every family at launch (server switch `ai_free_for_all = true`, daily caps still apply). Later, set the switch to false and AI requires the `ai_magic` entitlement — sold either inside Family or as an add-on, price TBD from real cost data. No app update needed.

## Sprint roadmap

One release, built in eight milestones that follow the ticket order in tab A6. Duration depends on agent throughput; the lock engine comes early because every screen depends on it.

&#91;embedded content: roadmap · 8 milestones, one launch gate\]

Art and voice content runs in parallel from week 1 — it is the likeliest thing to slip, not the code.

## Risks & open questions

The two biggest risks are Apple's Family Controls entitlement timeline and art/animation content cost, not code.

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Family Controls entitlement delayed or denied | No OS-level lock on iOS | Ship MVP on Tier 1 + Guided Access; apply in week 1 |
| Art, animation and voice content is expensive | Slow content cadence, churn | Commission a small illustrator + voice pack early; procedural brushes and worlds |
| Kids Category rejection | Launch slip | Compliance checklist each sprint; no third-party SDKs except allowed |
| Skia performance on low-end Android tablets | Laggy drawing = instant uninstall | Test on a $80–100 tablet from sprint 2; cap canvas resolution |
| Kid finds a bypass (reinstall, airplane mode + reboot) | Parent trust lost | Server-side usage sync on reconnect; reinstall restores state from parent account |

AI adds two risks: cost spikes (mitigated by per-family daily caps and server-side cost logging) and unsafe output (mitigated by narrow tasks, allowlisted inputs, moderation on input and output, and no chat).

**Open questions**

- [ ] Confirm age range: 3–8 assumed
- [ ] Standalone app, or later bundle with Sprout & Co?
- [ ] Final name + trademark check
- [ ] Mascot and art style direction
- [ ] US-only launch, or include UK/EU (adds GDPR-K work)?
