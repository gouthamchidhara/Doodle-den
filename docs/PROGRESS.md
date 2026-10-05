# Progress

One entry per ticket (A1 rule 5): ticket ID, files changed, what works, anything not finished.

## T-001 · Project setup
- Files: whole repo — Expo SDK 57 app at repo root (`package.json`, `app.json`, `tsconfig.json`, `jest.config.js`), A1 folder skeleton (`app/**` placeholder routes, `src/**`, `modules/`, `supabase/`, `assets/`), `docs/PROGRESS.md`, `docs/OPEN_QUESTIONS.md`.
- Works: all A1 packages installed via `npx expo install` except `@reactvision/react-viro` (see OPEN_QUESTIONS); `tsc --noEmit`, `expo lint`, `jest` pass; strict TypeScript; Jest pinned to `America/Chicago`; `expo export` builds the iOS and Android JS bundles cleanly. `eslint` + `eslint-config-expo` were added by `expo lint` (dev tooling for the A1 definition of done). `react-native-device-activity` config plugin is left out of `app.json` until T-002/T-037 (it needs the bundle-ID app group and only applies when `EXPO_PUBLIC_IOS_SCREEN_TIME=true`).
- Kept from the Expo template as required peers: `expo-constants`, `expo-linking` (expo-router), `react-native-worklets` (Reanimated), `react-dom` (pinned peer of expo/expo-router; not imported).
- Not done here: launching on an iPad simulator / Android tablet emulator — this cloud environment has neither; run `npx expo run:ios` / `npx expo run:android` locally to confirm.

## T-002 · App config
- Files: `app.config.ts` (replaces `app.json`), `.env.example`.
- Works: name "Sleepy Crayons", bundle/package `com.gpc.doodleden`, Apple team `KSD8FCH7C9`, iOS deployment target 17.0, Android `minSdkVersion` 26 (small inline `withGradleProperties` plugin, since `expo-build-properties` is not on the allowed list), iPhone portrait / iPad landscape via per-idiom Info.plist lists (`requireFullScreen`), plugins router, font, sqlite, secure-store, camera, audio, speech-recognition, with the A6 permission strings. Verified with `expo prebuild`: Info.plist strings, entitlements, `gradle.properties`, manifest.
- Privacy trims: no Face ID string, no background audio, no barcode scanner, Android storage + overlay permissions blocked.
- Screen Time (flag `EXPO_PUBLIC_IOS_SCREEN_TIME=true`): adds the `react-native-device-activity` plugin, family-controls entitlement and app group `group.com.gpc.doodleden.screentime`; prebuild creates `ActivityMonitorExtension`, `ShieldAction`, `ShieldConfiguration` targets (`com.gpc.doodleden.<Target>`) and copies them into `targets/` (removed again; T-037 decides whether to commit it).
- Not done: `react-native-purchases` has no config plugin (none needed). Android tablet landscape lock happens at runtime in T-003. Dev build on device not run here (no simulator/emulator).

## T-003 · Tokens, layout, fonts
- Files: `src/theme/tokens.ts` (copied from A2), `src/theme/useLayout.ts`, `src/state/sessionStore.ts` (active kid + age mode for `useLayout`), `src/types/models.ts` (AgeMode stub, full file in T-007), `app/_layout.tsx`, `__tests__/theme/useLayout.test.ts`.
- Works: Fredoka + Nunito load behind the splash (max 3 s); tablet (shortest side ≥ 600) locks landscape, phone portrait; breakpoint unit tests.

## T-004 · Kid components
- Files: `src/components/kid/{PressableScale,IconButton,PrimaryButton,TimePill,ActivityTile,SpeechBubble,ToolButton,ColorDot,BrushSizeButton}.tsx`, 24 icons in `src/components/kid/icons/`, `src/screens/DevComponentsScreen.tsx` + `app/dev-components.tsx` (temporary), `src/services/audio.ts` / `voice.ts` API stubs (filled in T-010), `src/types/models.ts` (full A3 copy, early for `BrushType`), `jest.setup.ts`, snapshot tests.
- Works: shared press feedback (0.94 scale / 120 ms, light haptic, sound); rainbow dot drawn as SVG slices (React Native has no conic gradient); locked tile routes to Parent Gate; Jest uses the worklets resolver so Reanimated runs in tests.

## T-005 · Mascot
- Files: `src/components/kid/Mascot.tsx` (SVG crayon from the Kid Home mockup), dev screen row, `__tests__/components/mascot.test.tsx`.
- Works: idle 2 s bob, happy jump loop, sleepy half-closed eyes with a yawn every 4 s, sleeping closed eyes + floating "z z" (Reanimated).

## T-006 · Parent components
- Files: `src/components/parent/{ParentCard,SettingRow,StatRing,WeekBars,ParentButton}.tsx`, dev screen section, `__tests__/components/parentComponents.test.tsx`.
- Works: ring/bar math unit-tested; rows have 44 pt+ targets; snapshots.

## T-007 · SQLite + core repositories
- Files: `src/db/{types,database,migrations,syncQueue}.ts`, `src/db/repositories/{kid,rules,usage,artwork,progress,reward,color,meta}Repo.ts`, `src/utils/ids.ts`, `src/utils/time.ts` (`shiftDayKey`), `__tests__/helpers/nodeDb.ts`, `__tests__/db/coreRepos.test.ts`.
- Works: migrations 1 + 2 stored verbatim from A3, applied per `PRAGMA user_version` (PRAGMA lines run outside the transaction), idempotent; every repository function tested against a real in-memory SQLite (Node 22 built-in `node:sqlite`, no extra package); synced tables write `sync_queue`; rules saved within A3 ranges.
- Notes: `artworkRepo` returns `ArtworkRecord` (= `Artwork` + `familyShared`, `stickerPath` from migration 2) so `models.ts` stays an exact copy.

## T-008 · v1 feature repositories
- Files: `src/db/repositories/{world,voice,flipbook,music,jigsaw,museum,story,aiResult}Repo.ts`, `src/types/feature.ts`, `src/db/json.ts`, `__tests__/db/featureRepos.test.ts`.
- Works: list/get/save/delete for each; jigsaw keeps the best time; JSON columns parsed defensively.

## T-009 · ids, time, hash, PIN service
- Files: `src/utils/{ids,time,hash}.ts`, `src/services/pinService.ts`, `__tests__/utils/time.test.ts`, `__tests__/services/pinService.test.ts`, `__tests__/helpers/mockNative.ts`.
- Works: `localDayKey`, `nextLocalMidnight`, `isInBedtime` (incl. across midnight), `nextBedtimeEnd`, `isoWeekKey`; PIN stored as SHA-256(salt + pin) with a 16-byte salt in secure-store; 3 wrong in a row → 60 s cooldown in `dd.gate.failures`; all tested.

## T-010 · Audio + voice
- Files: `src/services/audio.ts` (preload, `playSound`, `loopSound`, `playClip`, master volume), `src/services/voice.ts` (`say(key)`, `sayText`), `src/content/voiceFiles.ts` (recorded-file map, empty), `src/content/voiceLines.json` (210 lines: intros, mascot + AI messages, letters/numbers/shapes, 40 coach ideas, 30 daily ideas, 12 off-screen ideas), `coachIdeas.json`, `dailyIdeas.json`, `offScreenIdeas.json`, 21 silent placeholder `.m4a` files in `assets/sounds/` (lullaby 20 s), global audio/speech mocks in `jest.setup.ts`, tests.
- Works: `say('intro_draw')` speaks via expo-speech (rate 0.9, pitch 1.1) when no file exists; recorded files win when added to `voiceFiles.ts` (React Native needs static `require`, so a file must be registered there). Sounds preload at app start.
- Content note: daily ideas, off-screen ideas and example words are first drafts for the owner to review (listed again in T-103).

## T-011 · Routes + startup routing
- Files: every route in `app/**` now renders `src/screens/PlaceholderScreen.tsx` (title + Home); group layouts use a header-less Stack; `app/index.tsx` → `src/screens/StartupScreen.tsx`; `src/services/startup.ts` (`loadStartupState`, `decideStartRoute`); `src/screens/startupLockCheck.ts` (stub until T-033); `__tests__/services/startup.test.ts`.
- Works: rules 1-5 tested on seeded DB states (fresh → onboarding, resume saved onboarding step, locked → /locked, >1 kid and no active kid → /profiles, else /home; a single kid becomes active automatically). Android bundle builds.

## T-012 · Onboarding
- Files: `app/onboarding/{_layout,welcome,create-pin,add-kid,time-rules,device-lock-tips,finish}.tsx`, `src/screens/onboarding/*`, `src/services/onboarding.ts`, `src/components/parent/{PinPad,Stepper,OnboardingFrame,TimeRulesForm}.tsx`, `src/components/kid/Avatar.tsx` + `src/content/avatars.ts` (8 animals), `src/lock/devicePinning.ts` (stub until T-031), `src/content/app.ts`, router mock in `jest.setup.ts`, `__tests__/screens/onboarding.test.tsx`.
- Works: welcome → PIN twice (mismatch shakes, "PINs don't match") → nickname (max 12) / avatar / age → rules (defaults 45/20, bedtime 19:30–07:00) → device-lock tips (iOS Guided Access steps + Open Settings; Android pin toggle) → finish ("Skip for now"). Each screen saves `onboarding_step`; a killed app resumes there; onboarding screens bounce to "/" once done.
- Added `app/onboarding/finish.tsx` for the spec's "(end)" step. The "Create a parent account" button lands with T-071.

## T-013 · Profile picker, Parent Gate, parent guard
- Files: `app/profiles.tsx` + `src/screens/ProfilePickerScreen.tsx`, `app/parent/gate.tsx` + `src/screens/parent/ParentGateScreen.tsx`, `src/screens/parent/forgotPin.ts`, `app/parent/_layout.tsx` + `src/screens/parent/ParentZoneLayout.tsx`, `src/state/parentStore.ts`, `src/components/parent/HoldButton.tsx`, `__tests__/screens/parentGate.test.tsx`.
- Works: 2 s hold (release early resets) → PIN; correct → 5-minute in-memory unlock and the requested parent screen (`next`, parent routes only); wrong ×3 → 60 s cooldown with countdown; parent routes redirect to the gate when the window has passed (checked every 5 s); leaving the parent zone (layout unmount) clears the unlock. "Forgot PIN?" explains reinstall; the magic-link reset is added with the parent account in T-071.
