# Open questions

Write the ticket ID with each question (A1 rule 6).

- **T-001 · `@reactvision/react-viro` not installed.** `npx expo install @reactvision/react-viro` (3.0.2, which supports Expo 57 / RN 0.86) fails with npm ERESOLVE: its optional peer `@reactvision/react-native-visionos@0.86.4` pins `@react-native/jest-preset@0.86.2`, while Expo 57 / `jest-expo` use `0.86.3`. Per the A1 fallback rule the AR Wall stays isolated to `src/games/arwall/` and is deferred to T-061. Options then: wait for a viro release that matches RN 0.86.3, or add an npm `overrides` entry. Owner to decide.
- **T-001 · Bundle ID.** `[YOUR_BUNDLE_ID]` still needed for T-002 (e.g. `com.yourcompany.doodleden`).
