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

## T-014 · Kid Home
- Files: `app/(kid)/home.tsx`, `src/screens/kid/HomeScreen.tsx`, `src/components/kid/ShelfTabs.tsx`, `src/content/activities.ts` (all 22 tiles: shelf, tint, route, Big-only, AR, Magic), `src/content/dailyIdea.ts`, 27 tile/shelf illustrations in `src/components/kid/icons/*Art.tsx` (8 copied from the mockup), `src/state/useActiveKid.ts`, stubs `src/lock/useRemainingMinutes.ts` (T-033), `src/services/useAiStatus.ts` (T-078), `src/games/arwall/arSupport.ts` (false until viro), `__tests__/screens/home.test.tsx`.
- Works: header (avatar + "Hi, {nickname}!", time pill, Grown-ups → gate), 5 shelves with spoken names, tablet 4 columns / phone 2 columns, Little mode hides Big-only tiles, AR Wall hidden without AR, Magic tiles padlocked until consent (→ gate → Magic settings) and dimmed with a cloud when offline, shelf remembered per kid in `app_meta`, daily idea rotates by local day and opens its activity. Avatar tap switches profile through the gate when there is more than one kid.

## T-020 · Stroke model
- Files: `src/canvas/strokeModel.ts`, `__tests__/canvas/strokeModel.test.ts`.
- Works (all unit-tested, no Skia): normalize/denormalize, 2 px thinning, pressure width (0.6 + p·0.8), quadratic midpoint smoothing to path commands, stroke/doc bounds, FNV hash + mulberry32 seeded random, polyline length, evenly spaced samples (glitter/stamps), rainbow hue formula.

## T-021 · DrawingCanvas core
- Files: `src/canvas/DrawingCanvas.tsx`, `src/canvas/useStrokeInput.ts`, `src/canvas/strokeTracker.ts`, `src/canvas/renderStroke.ts`, `src/canvas/exportPng.ts`, `src/canvas/replay.ts`, `src/canvas/brushes/brushSpecs.ts`, `src/canvas/color.ts`.
- Works: controlled `doc`; one-finger pan (`minDistance 0`, `maxPointers 1`), stylus pressure, 2 px thinning; layers Fill → underlay → stroke layer (cached finished-stroke Picture + live-stroke Picture, re-rendered at most once per frame) → overlay → ghost; ref handle `undo/redo/clear/exportPng/replay/canUndo/canRedo`; kaleidoscope symmetry 1/2/4/8; offscreen PNG export at any long edge.
- Deviation: A5 widths are treated as px at a 900 px long-edge reference canvas (`canvasUnit`) so 2048 px exports look like the screen. Device fps check (300 strokes on iPad/budget Android) still to run on hardware.

## T-022 · Brushes
- Files: `src/canvas/renderStroke.ts`, `src/canvas/brushes/brushSpecs.ts`, `src/canvas/color.ts`.
- Works: crayon (discrete path effect), marker, watercolor (35 % + blur 3), glitter (60 % base + seeded stars every 14 px, so replay is identical), neon (blurred glow + white-mixed core), rainbow color (hue by distance, seeded start), eraser (`BlendMode.Clear` inside the stroke layer, never erases the background).

## T-023 · Stamps, undo/redo, clear
- Files: `src/canvas/stamps.ts`, `src/canvas/history.ts`, `__tests__/canvas/engine.test.ts`.
- Works: 20 stamps placed along the stroke at 1.2 × size spacing; undo/redo with 50-step limit, redo cleared by a new stroke; `shouldSaveBeforeClear` (3+ strokes) used by hold-to-clear in T-025. Tests cover history, replay timing, colors, brush table, stamps.
- Deviation: stamps are vector placeholder shapes in code instead of `assets/stamps/*.png`; owner can swap art later (T-103).

## T-024 · Saving
- Files: `src/canvas/saveArtwork.ts` (`saveArtworkFiles`, `parseStrokeDoc`), `src/canvas/useAutosave.ts`, `src/state/canvasStore.ts` (tool/color/size/stamp + open-drawing saver registry, `saveAllOpenDrawings()` for lock `AUTOSAVE`), `src/services/files.ts` (expo-file-system wrapper, paths per A3), in-memory file-system mock `__tests__/helpers/mockFs.ts` (global in `jest.setup.ts`), `__tests__/canvas/saveArtwork.test.ts`.
- Works: PNG 2048 + thumb 400 + strokes JSON written first, then the `artwork` row; later saves overwrite the same files and keep `created_at`; failed first insert deletes the files (tested); autosave every 10 s when changed, on app background/inactive, on lock AUTOSAVE (registry) and on unmount; deleting a kid deletes `art/<kidId>/`. `replay()` lives on the canvas handle (T-021).
- Note: autosave exports from the stroke doc directly (not the on-screen ref) so the leave-screen save works after unmount. Force-quit check is a device test.

## T-025 · Free Draw
- Files: `app/(kid)/draw.tsx`, `src/screens/kid/DrawScreen.tsx`, `src/screens/kid/draw/{DrawTabletLayout,DrawPhoneLayout,drawLayoutProps}.tsx`, `src/screens/kid/shared/{useDrawingSession,useIntroVoice}.ts` (reused by later drawing screens), `src/components/kid/{KidHeader,ChoiceBubble,MascotCorner,SparkleBurst}.tsx`, `src/components/kid/draw/{ToolRail,PaletteBar,SizePicker,StampTray,StampPreview}.tsx`, `overlays` tokens (scrim, wind-down dim) added to `tokens.ts`, `__tests__/screens/draw.test.tsx`.
- Works: tablet = top bar (Home, Undo, Redo, hold-1.5 s trash, time pill, speaker, "I'm done!"), left tool rail with eraser at the bottom, right S/M/L rail + background color button, bottom palette (10 + rainbow + custom colors) that turns into the stamp tray when stamps are picked. Phone = top bar (Home, Undo, pill, Done), canvas, tray (tools row + cycling size + trash, colors row scrolls). Little mode: 5 tools, sizes M/L. Keep-awake on; intro voice once per kid. Hold trash → "Start fresh?" (saves first with 3+ strokes). "I'm done!" → save + sparkle + `save-sparkle` → "Beautiful!" sheet: New drawing / My Gallery / Home. `?artworkId=` continues a saved drawing.
- Mascot tap shows a local coach idea for now; Guess / Idea / Magic bubbles join in T-079/T-080/T-076. Lock-time save goes through the canvasStore saver registry (wired in T-033).

## T-030 · Lock engine
- Files: `src/lock/types.ts`, `src/lock/constants.ts` (copied exactly from A4), `src/lock/lockEngine.ts` (`trustedWall`, `createLockState`, `tick`, `getRemaining`, `requestFinishDrawing`, `parentUnlock`, `applyRulesChange`), `__tests__/lock/lockEngine.test.ts` (all 19 required tests pass).
- Engine imports only `@/utils/time` (pure) and its own files.
- Decisions: `parentUnlock` takes `rules` as a 4th argument (needed for `endSession` cooldown length and bedtime grants). Lifting a bedtime lock with +15/+30 opens a session holding exactly the granted time, so bedtime re-locks when it runs out. `applyRulesChange` re-times a cooldown with the new cooldown length, turns it into a daily lock if the new daily limit is used up, and re-arms warnings when a running session gains time. State copy is a manual deep copy (Hermes-safe) instead of `structuredClone`.

## T-031 · lock-native module
- Files: `modules/lock-native/{expo-module.config.json,index.ts,src/LockNativeModule.ts}`, `android/build.gradle` + `LockNativeModule.kt` (`elapsedRealtime`, `BOOT_COUNT`, `lockTaskModeState`, `start/stopLockTask` on the main queue), `ios/LockNative.podspec` + `LockNativeModule.swift` (`CLOCK_MONOTONIC`, `kern.boottime`, `isGuidedAccessEnabled`), `src/lock/devicePinning.ts` now calls the module, `src/screens/LockNativeDebug.tsx` shown on `/dev-components`.
- Works: autolinking finds the module for Android and iOS. JS falls back to `performance.now()` / `'no-native'` when the module is missing (Jest, web), so tests and Expo Go keep working.
- Hand-written in the `create-expo-module --local` layout (the generator needs an interactive prompt). Still to check on hardware: values print on both platforms, uptime grows across app restarts.

## T-032 · Clock, server time, lock storage, lock store
- Files: `src/lock/clock.ts` (`readClock`), `src/lock/serverTime.ts` (`syncServerTime` via `server_now()` RPC → `app_meta.server_offset_ms`, `loadServerOffset`, in-memory `getServerOffset`), `src/lock/lockStorage.ts` (`dd.lock.<kidId>`, zod-validated), `src/lock/lockStore.ts` (state, rules, `remainingSec`, event queue), `src/services/supabase.ts` (client with chunked secure-store session storage; null when keys are missing), `__tests__/lock/lockStorage.test.ts`.
- Works: state round-trips through secure-store (mock), bad data is rejected, server offset stored and used by `readClock()`. Offset uses the midpoint of the request round trip.
