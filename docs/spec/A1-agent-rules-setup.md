# A1 · Agent rules & setup

Read this tab fully before writing any code. Every rule here is mandatory. If a rule and your own idea conflict, follow the rule.

## How to use this spec

1. Work on exactly ONE ticket from tab A6 at a time, in the order listed.
2. For each ticket, read only: this tab (A1), the ticket itself, and the tabs/sections the ticket names under "Read first".
3. Create or edit only the files the ticket lists. Do not touch other files.
4. When the ticket is done, run every command in "Definition of done" below. Fix all errors before saying the ticket is done.
5. Write a 3–5 line summary in `docs/PROGRESS.md`: ticket ID, files changed, what works, anything not finished.
6. If information is missing, do NOT guess. Use the default value written in the spec. If there is no default, write the question in `docs/OPEN_QUESTIONS.md` with the ticket ID and stop that part of the work.

## Golden rules (never break these)

1. **No new features.** Build only what the ticket says. Do not add screens, buttons, settings, animations or libraries that are not in the spec.
2. **No ads, no analytics, no tracking.** Never add Firebase Analytics, Google Analytics, Facebook SDK, Mixpanel, Amplitude, AdMob, or any ad or tracking SDK. Network calls are allowed ONLY to Supabase and RevenueCat. All AI goes through Supabase Edge Functions (tab A7) — the app never calls an AI provider directly and never contains an AI API key.
3. **Only allowed dependencies.** Use only the packages in the "Allowed dependencies" table. Need something else? Write it in `docs/OPEN_QUESTIONS.md` and stop.
4. **Install packages with `npx expo install <name>`**, never plain `npm install`, so versions match the Expo SDK.
5. **TypeScript strict mode.** No `any`. No `// @ts-ignore`. No `as unknown as`.
6. **Never lose a child's drawing.** Autosave every 10 seconds, when the app goes to background, and before the lock screen appears.
7. **Kid area never shows** purchase buttons, prices, external links, settings, or text the child must read to continue. All of those live behind the Parent Gate.
8. **Kid buttons are big.** Minimum touch size: 64×64 pt in Little mode (age 3–5), 56×56 pt in Big mode (age 6–8). Every kid button has an icon and an `accessibilityLabel`.
9. **No child personal data leaves the device** unless a parent has consented. Never store a child's real name, birthday, photo of the child, or location.
10. **No timers that pressure kids.** No streaks, no "come back tomorrow or lose it", no countdowns shown to kids except the soft time pill.
11. **One component per file. Max 300 lines per file.** Split if bigger.
12. **Do not use Expo Go.** This app needs a development build (`npx expo run:ios` / `npx expo run:android` or EAS Build) because it has native modules.
13. **Do not rename or move files** that earlier tickets created unless the ticket says so.
14. **Colors, fonts, sizes come only from `src/theme/tokens.ts`** (tab A2). Never type a hex color directly in a component.

## Tech baseline

| Item | Value |
| --- | --- |
| App name (placeholder) | Doodle Den |
| Bundle ID / package | `[YOUR_BUNDLE_ID]` (e.g. `com.yourcompany.doodleden`) — ask owner |
| Framework | Expo SDK 56 or newer (SDK 56 ships React Native 0.85 + React 19.2). New Architecture only. |
| Language | TypeScript, `"strict": true` |
| Navigation | Expo Router (file-based routes in `app/`) |
| Min OS | iOS 17.0, Android 8.0 (API 26) |
| Devices | iPad (primary, landscape), Android tablet (primary, landscape), iPhone and Android phone (portrait) |
| Orientation | Tablets: landscape only. Phones: portrait only. Set in `app.config.ts` and with `expo-screen-orientation` at runtime: tablet = shortest screen side ≥ 600 pt (see A2 Breakpoints) |
| State | Zustand (global app state), React state (screen-local) |
| Local DB | expo-sqlite |
| Backend | Supabase (parent auth, sync, server time) |
| Payments | RevenueCat (`react-native-purchases`) |
| Drawing | `@shopify/react-native-skia` |
| Animation | `react-native-reanimated` + Skia |
| Tests | Jest via `jest-expo`, `@testing-library/react-native` |

## Project setup commands (ticket T-001 runs these)

```bash
npx create-expo-app@latest doodle-den
cd doodle-den
npx expo install expo-dev-client expo-router expo-font expo-splash-screen expo-screen-orientation expo-secure-store expo-sqlite expo-file-system expo-audio expo-haptics expo-crypto expo-image expo-keep-awake expo-camera expo-speech expo-print expo-sharing expo-image-manipulator
npx expo install @shopify/react-native-skia react-native-reanimated react-native-gesture-handler react-native-safe-area-context react-native-screens react-native-svg
npx expo install @expo-google-fonts/fredoka @expo-google-fonts/nunito
npx expo install planck expo-speech-recognition react-native-device-activity @reactvision/react-viro
npx expo install @supabase/supabase-js react-native-purchases zustand zod
npx expo install jest-expo jest @testing-library/react-native @types/jest -- --save-dev
```

If `npx expo install` reports a missing peer dependency (for example `react-native-worklets` for Reanimated), install exactly what it names with `npx expo install`.

## Allowed dependencies

| Package | Use it for | Do NOT use it for |
| --- | --- | --- |
| `expo-router` | All navigation | — |
| `@shopify/react-native-skia` | Drawing canvas, brushes, aquarium rendering, kaleidoscope | Regular UI layout or icons (use react-native-svg for icons) |
| `react-native-reanimated` | Animations (mascot, tiles, fish swim) | — |
| `react-native-gesture-handler` | Touch drawing, drag in Mixing Lab, hold-to-unlock | — |
| `expo-secure-store` | Lock state, PIN hash | Large data (limit \~2 KB per key) |
| `expo-sqlite` | All local app data | Lock state |
| `expo-file-system` | Saving PNG and stroke JSON files | — |
| `expo-audio` | Sound effects, voice prompts, voice recording (Drawings That Talk), Music Paint notes | — |
| `expo-haptics` | Light tap feedback | — |
| `expo-crypto` | PIN hashing (SHA-256 + salt), random IDs | — |
| `expo-image` | Showing saved art thumbnails | — |
| `expo-font` + `@expo-google-fonts/fredoka` + `@expo-google-fonts/nunito` | Fonts | — |
| `expo-screen-orientation` | Lock orientation per device type | — |
| `expo-keep-awake` | Keep screen on while drawing | — |
| `@supabase/supabase-js` | Parent account, sync, server time | Anything kid-identifying without consent |
| `react-native-purchases` | Subscriptions | — |
| `zustand` | Global state | — |
| `zod` | Validating JSON loaded from disk/network | — |
| `jest-expo`, `@testing-library/react-native` | Tests | — |

Also allowed (v1 features):

| Package | Use it for | Notes |
| --- | --- | --- |
| `react-native-svg` | UI icons and tile illustrations only (tab A2, Icons) | — |
| `expo-camera` | Paper Comes Alive, AR Wall camera permission flow | Parent grants permission behind the Parent Gate |
| `expo-image-manipulator` | Resize/crop camera photos before keying | — |
| `expo-speech` | On-device read-aloud: stories, mascot guesses, coach ideas, voice prompts fallback | Free, offline |
| `expo-speech-recognition` | On-device speech-to-text for Coloring Page Maker and Name Your Colors (Big mode) | Set `requiresOnDeviceRecognition: true`; never record audio files |
| `expo-print` + `expo-sharing` | Story book PDF, sticker sheet PDF (parent zone only) | — |
| `planck` | 2D physics for Ramps & Rollers and Racetrack | Pure JS Box2D port |
| `react-native-device-activity` | iOS Screen Time shield (FamilyControls, ManagedSettings, DeviceActivity) with its Expo config plugin | First check it supports the project's Expo SDK. If not, write the same API in `modules/lock-native` and note it in `docs/OPEN_QUESTIONS.md` |
| `@reactvision/react-viro` | AR Wall (ARKit / ARCore) | Isolated to `src/games/arwall/`; check Expo SDK compatibility first, same fallback rule |

## Folder structure (create exactly this)

```text
doodle-den/
  app/                         # Expo Router routes ONLY (thin files, call screens from src/)
    _layout.tsx                # fonts, providers, LockGate overlay, orientation
    index.tsx                  # redirect: onboarding | profiles | (kid)/home
    profiles.tsx               # profile picker
    locked.tsx                 # lock screen
    onboarding/
      _layout.tsx
      welcome.tsx
      create-pin.tsx
      add-kid.tsx
      time-rules.tsx
      device-lock-tips.tsx
    (kid)/
      _layout.tsx              # kid shell, time pill, wind-down overlay
      home.tsx
      draw.tsx
      coloring/index.tsx
      coloring/[pageId].tsx
      aquarium.tsx
      trace.tsx
      mixing-lab.tsx
      kaleidoscope.tsx
      gallery/index.tsx
      gallery/[artworkId].tsx
      stickers.tsx
      guided.tsx
      flipbook.tsx
      paper.tsx
      world-draw.tsx           # ?world=aquarium|racetrack|zoo
      racetrack.tsx
      zoo.tsx
      ramps.tsx
      music.tsx
      jigsaw.tsx
      arwall.tsx
      stories.tsx
      story/[storyId].tsx
      museum.tsx
      magic/coloring-maker.tsx # tab A7
      magic/sketch.tsx
      magic/story-maker.tsx
    parent/
      gate.tsx
      _layout.tsx              # redirects to gate if not unlocked
      index.tsx                # dashboard
      time-rules.tsx
      profiles.tsx
      subscription.tsx
      art-sharing.tsx
      magic.tsx
      device-lock.tsx
      account.tsx
  src/
    theme/tokens.ts            # ALL colors, fonts, sizes (tab A2)
    theme/useLayout.ts         # tablet vs phone breakpoint hook
    components/kid/            # ActivityTile, IconButton, TimePill, ColorDot, ToolButton, Mascot, ...
    components/parent/         # ParentCard, SettingRow, StatRing, WeekBars, ...
    screens/                   # one file per screen, imported by app/ routes
    canvas/                    # DrawingCanvas, brushes, stroke model, replay, export
    lock/                      # lockEngine (pure), lockStore, useLockTimer, LockGate
    db/                        # sqlite open, migrations, repositories
    services/                  # supabase.ts, purchases.ts, sync.ts, audio.ts
    state/                     # zustand stores
    games/                     # aquarium/, trace/, mixing/, kaleidoscope/, coloring/
    content/                   # JSON: coloring pages, trace paths, stickers, mix table
    utils/                     # ids.ts, time.ts, hash.ts
  modules/lock-native/         # local Expo module (Swift + Kotlin), tab A4
  supabase/
    migrations/                # SQL files, tab A3 + A7
    functions/                 # Edge Functions (Deno + TypeScript), tab A7
      _shared/                 # auth, caps, moderation, providers
      ai-coloring-page/  ai-magic-sketch/  ai-story/  ai-guess/  ai-coach/  ai-digest/
      family-gallery/          # serves the grandparent web page
      rc-webhook/              # RevenueCat webhook -> entitlements
  assets/
    sounds/  voice/  coloring/  images/
  docs/
    PROGRESS.md
    OPEN_QUESTIONS.md
  __tests__/                   # mirrors src/ structure
```

## Coding conventions

- Files: `PascalCase.tsx` for components, `camelCase.ts` for logic.
- Exports: named exports only (no default exports), except Expo Router route files in `app/` which must default-export the screen.
- Route files in `app/` contain max 10 lines: import the screen from `src/screens/` and render it.
- IDs: use `newId()` from `src/utils/ids.ts` (wraps `Crypto.randomUUID()`).
- Time: never call `Date.now()` inside lock logic. Use the clock functions in `src/lock/clock.ts` (tab A4).
- Errors: wrap every DB and file call in try/catch; on error log with `console.warn('[module] message', error)` and show nothing scary to the kid.
- Text in the kid area: max 6 words, always paired with a voice clip or icon.
- Comments: one line above every exported function explaining what it does.

## Environment variables

Put these in `.env` (never commit it). Read them with `process.env.EXPO_PUBLIC_*`.

| Name | Value |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | from Supabase project settings |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | from Supabase project settings (anon key only, never the service key) |
| `EXPO_PUBLIC_RC_IOS_KEY` | RevenueCat iOS public SDK key |
| `EXPO_PUBLIC_RC_ANDROID_KEY` | RevenueCat Android public SDK key |

Also: `EXPO_PUBLIC_IOS_SCREEN_TIME` = `false` until Apple approves the Family Controls entitlement (A4). AI keys are never here — they are Supabase secrets (A7).

## Definition of done (run for every ticket)

```bash
npx tsc --noEmit
npx expo lint
npx jest
```

All three must pass with zero errors. Then:

- [ ] Every acceptance check in the ticket is true.
- [ ] App builds and launches on an iPad simulator AND an Android tablet emulator.
- [ ] No new package outside the allowed list.
- [ ] No hex colors or font sizes typed outside `tokens.ts`.
- [ ] `docs/PROGRESS.md` updated.
