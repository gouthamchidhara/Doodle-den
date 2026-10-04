# Progress

One entry per ticket (A1 rule 5): ticket ID, files changed, what works, anything not finished.

## T-001 · Project setup
- Files: whole repo — Expo SDK 57 app at repo root (`package.json`, `app.json`, `tsconfig.json`, `jest.config.js`), A1 folder skeleton (`app/**` placeholder routes, `src/**`, `modules/`, `supabase/`, `assets/`), `docs/PROGRESS.md`, `docs/OPEN_QUESTIONS.md`.
- Works: all A1 packages installed via `npx expo install` except `@reactvision/react-viro` (see OPEN_QUESTIONS); `tsc --noEmit`, `expo lint`, `jest` pass; strict TypeScript; Jest pinned to `America/Chicago`; `expo export` builds the iOS and Android JS bundles cleanly. `eslint` + `eslint-config-expo` were added by `expo lint` (dev tooling for the A1 definition of done). `react-native-device-activity` config plugin is left out of `app.json` until T-002/T-037 (it needs the bundle-ID app group and only applies when `EXPO_PUBLIC_IOS_SCREEN_TIME=true`).
- Kept from the Expo template as required peers: `expo-constants`, `expo-linking` (expo-router), `react-native-worklets` (Reanimated), `react-dom` (pinned peer of expo/expo-router; not imported).
- Not done here: launching on an iPad simulator / Android tablet emulator — this cloud environment has neither; run `npx expo run:ios` / `npx expo run:android` locally to confirm.
