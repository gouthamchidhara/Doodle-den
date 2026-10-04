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
