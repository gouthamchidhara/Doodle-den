# A6 · Task tickets

Build the app one ticket at a time, top to bottom. A ticket is done only when its "Done when" checks are true AND the A1 Definition of done passes. Never start a ticket before the tickets it depends on (all earlier tickets in the same track) are done.

## How to run the two agents

- **Two tracks can run in parallel after T-001:** Track APP (all tickets except the SERVER ones) and Track SERVER (T-070, T-072 to T-077, and the server parts of T-094, T-096 and T-097). Give each track to one agent so they never edit the same files.
- **Review step:** after each ticket, give the other agent the diff plus the ticket and ask: "Check this against tab A1 rules and the ticket's Done when list. Reply PASS, or FAIL with a numbered list of problems." Fix all FAIL items before moving on.
- Keep tickets small: if a ticket's work goes over \~600 changed lines, stop and split it into parts (a, b, c) noted in `docs/PROGRESS.md`.

## Prompt template (paste for every ticket)

```text
You are building the Doodle Den kids app. Follow every rule in spec tab A1 exactly.
Ticket: <ID> <title>
Read first: <sections from the ticket>
Only create or edit these files: <files from the ticket>
Task: <the ticket row>
Done when: <the ticket's Done when list>
When finished run: npx tsc --noEmit && npx expo lint && npx jest
Then report: files changed, command results, anything added to docs/OPEN_QUESTIONS.md.
If something is missing from the spec, use the spec default or write the question in docs/OPEN_QUESTIONS.md. Do not guess. Do not add features. Do not start the next ticket.
```

## M1 · Foundation

| ID | Build | Read first | Create / edit | Done when |
| --- | --- | --- | --- | --- |
| T-001 | Create the project, install all packages, create the full folder skeleton (empty files with a one-line comment), `docs/PROGRESS.md`, `docs/OPEN_QUESTIONS.md`, strict `tsconfig.json`, Jest config with `process.env.TZ = 'America/Chicago'` | A1 all | whole repo | App launches to a blank screen on iPad simulator and Android tablet emulator; `tsc`, `lint`, `jest` pass |
| T-002 | `app.config.ts`: name, `[YOUR_BUNDLE_ID]`, iOS 17 min, Android minSdk 26, orientation rules, plugins (router, font, sqlite, secure-store, camera, audio, speech-recognition, purchases), permission strings: camera "to bring your child's paper drawings to life", microphone "to give drawings a silly voice", speech "to turn your child's spoken idea into text on this device" | A1 Tech baseline | `app.config.ts`, `.env.example` | Dev build runs on both platforms; permission strings visible in native projects |
| T-003 | Copy `tokens.ts`; write `useLayout.ts`; load Fredoka + Nunito in `app/_layout.tsx`; set orientation per device class | A2 tokens, Breakpoints | `src/theme/*`, `app/_layout.tsx` | Fonts render; tablet locks landscape, phone portrait; unit test for `useLayout` breakpoint |
| T-004 | Kid components: `IconButton`, `PrimaryButton`, `TimePill`, `ActivityTile`, `SpeechBubble`, `ToolButton`, `ColorDot`, `BrushSizeButton` + icons used by them | A2 Shared kid components, Icons | `src/components/kid/**` | A temporary `app/dev-components.tsx` screen shows all of them in every state; snapshot tests |
| T-005 | `Mascot` with moods idle, happy, sleepy, sleeping (Reanimated) | A2 Mascot | `src/components/kid/Mascot.tsx` | All 4 moods visible on the dev screen |
| T-006 | Parent components: `ParentCard`, `SettingRow`, `StatRing`, `WeekBars`, `ParentButton` | A2 Shared parent components | `src/components/parent/**` | Shown on dev screen; snapshot tests |
| T-007 | SQLite open, migration runner, migrations 1 and 2, core repositories (kid, rules, usage, artwork, progress, reward, color, meta) | A3 all | `src/db/**`, `src/types/models.ts` | Jest tests (using an in-memory DB or a mock) for every repository function; migrations idempotent |
| T-008 | v1 repositories: world, voice, flipbook, music, jigsaw, museum, story, aiResult | A3 migration 2 | `src/db/repositories/*` | Tests for each |
| T-009 | `ids.ts`, `time.ts` (`localDayKey`, `nextLocalMidnight`, `isInBedtime`, `nextBedtimeEnd`), `hash.ts` + `pinService.ts` (set, verify, failures/cooldown) | A3 secure-store keys, A5 Parent Gate | `src/utils/*`, `src/services/pinService.ts` | Tests: bedtime across midnight, PIN verify, 3 failures → 60 s cooldown |
| T-010 | `audio.ts` (preload + play sound effects), `voice.ts` (`say(key)` file-or-speech fallback), `voiceLines.json` with every key from A5 Voice list, silent placeholder sound files | A2 Sounds, A5 Voice | `src/services/audio.ts`, `src/services/voice.ts`, `src/content/voiceLines.json`, `assets/sounds/*` | `say('intro_draw')` speaks via expo-speech when no file exists |
| T-011 | Every route file from the A1 tree as a placeholder screen (title + Home button); `app/index.tsx` routing logic | A1 Folder structure, A5 App start | `app/**`, `src/screens/**` | Every route opens; routing rules 1–5 work with seeded DB states |
| T-012 | Onboarding screens | A5 Onboarding | `app/onboarding/*`, `src/screens/onboarding/*` | Full flow saves PIN, kid, rules; resume after kill works |
| T-013 | Profile picker, Parent Gate (hold + PIN), parent `_layout` guard with 5-minute unlock | A5 Profile picker, Parent Gate | related screens + `src/state/parentStore.ts` | Gate cannot be skipped; wrong PIN ×3 → cooldown; leaving parent zone re-locks |
| T-014 | Kid Home: header, 5 shelves, tiles per shelf, Little/Big filtering, daily idea bubble, `dailyIdeas.json` | A5 Kid Home, mockup Kid Home · iPad | `src/screens/kid/HomeScreen.tsx` + content | Matches mockup on iPad; 2-column on phone; shelf persists |

## M2 · Drawing engine

| ID | Build | Read first | Create / edit | Done when |
| --- | --- | --- | --- | --- |
| T-020 | Stroke model utilities: normalize, thin (2 px), smooth to path, stroke bounds, seeded random | A5 Drawing engine (Input rules) | `src/canvas/strokeModel.ts` | Unit tests for each function |
| T-021 | `DrawingCanvas` core: pan input, pressure, crayon + marker, layers, Picture cache, controlled `doc` | A5 Drawing engine | `src/canvas/DrawingCanvas.tsx` + helpers | Smooth drawing at 60 fps with 300 strokes on iPad simulator and a budget Android tablet |
| T-022 | Brushes: watercolor, glitter (seeded sprites), neon, rainbow color, eraser | A5 Brushes table | `src/canvas/brushes/*` | Each brush matches its row; replay of glitter looks identical |
| T-023 | Stamps (20 placeholder stamp images), undo/redo (50), hold-to-clear with save-first | A5 Brushes, Undo | canvas files, `assets/stamps/*` | Tests for undo/redo stack; clear saves when 3+ strokes |
| T-024 | `saveArtwork.ts`: autosave timer, background save, PNG 2048 + thumb 400 + strokes JSON, file-then-DB order; `replay()` | A5 Saving, Replay; A3 File paths | `src/canvas/saveArtwork.ts`, `src/state/canvasStore.ts` | Force-quit mid-drawing → art in gallery folder; failed DB insert deletes files (test) |
| T-025 | Free Draw screen, tablet + phone layouts, Little mode tool limits, done sheet | A5 Free Draw; mockups Free Draw · iPad, Wind-down warning · phone | `src/screens/kid/DrawScreen.tsx` | Matches mockups; all acceptance lines in A5 Free Draw |

## M3 · Time lock

| ID | Build | Read first | Create / edit | Done when |
| --- | --- | --- | --- | --- |
| T-030 | Pure lock engine + constants + types + all 19 tests | A4 all sections up to "Hook useLockTimer" | `src/lock/types.ts`, `constants.ts`, `lockEngine.ts`, `__tests__/lock/lockEngine.test.ts` | All 19 tests pass; engine imports nothing from React/Expo |
| T-031 | `modules/lock-native` Expo module (uptime, bootId, isPinned, start/stopPinning) for Android + iOS | A4 Native module | `modules/lock-native/**` | Values print on both platforms in a dev screen; uptime increases, survives app restart |
| T-032 | `clock.ts`, `serverTime.ts`, `lockStorage.ts`, `lockStore.ts` | A4 Clock rules, Files | `src/lock/*` | Server offset stored; state round-trips through secure-store (test with mock) |
| T-033 | `useLockTimer` + `LockGate` + event handling table + usage writes every 60 s | A4 Hook, LockGate rules | `src/lock/useLockTimer.ts`, `LockGate.tsx`, `app/_layout.tsx` | With rules set to 2-minute session: warnings fire, lock appears, force-quit + reopen stays locked |
| T-034 | Wind-down overlay, break bubble, finish-drawing button | A5 Wind-down overlay | `src/components/kid/WindDownOverlay.tsx`, `app/(kid)/_layout.tsx` | Overlay never blocks drawing; extension granted once per session |
| T-035 | Lock screen + parent unlock sheet | A5 Lock screen; mockup Lock screen · iPad | `src/screens/LockScreen.tsx` | Matches mockup; all reasons show correct text; unlock options work |
| T-036 | Device lock parent screen: Android pinning toggle, iOS Guided Access steps | A5 Parent zone (Device lock), A4 Native module | `app/parent/device-lock.tsx`, screen file | Android: pinning starts/stops only after gate; iOS: Guided Access state shown |
| T-037 | iOS Screen Time shield behind `EXPO_PUBLIC_IOS_SCREEN_TIME` | A4 iOS Screen Time shield | `src/lock/screenTime.ts`, config plugin entries, device-lock screen | Flag false: nothing runs, setting hidden. Flag true on a real iPad with entitlement: manual checklist in A4 passes |

## M4 · Core activities

| ID | Build | Read first | Create / edit | Done when |
| --- | --- | --- | --- | --- |
| T-040 | Coloring picker + flood-fill engine + Little tap-fill + 3 placeholder pages + `coloringPages.json` | A5 Coloring | `src/games/coloring/*`, screens | Fill never leaks; < 300 ms on budget tablet; tests for flood fill on a small test image |
| T-041 | Coloring Big mode: brush under line art, bucket tool, save + resume with fill layer | A5 Coloring | same | Reopening a saved page restores colors |
| T-042 | Trace & Learn engine + `tracePaths.json` (A–Z, a–z, 0–9, 8 shapes) + `traceWords.json` | A5 Trace & Learn | `src/games/trace/*`, screen, content | Tolerance, stroke order, stars work; tests for coverage/stars math |
| T-043 | Mixing Lab, `mixTable.json`, OKLab mix, new-color detection, naming chips + mic, custom colors in all palettes | A5 Mixing Lab | `src/games/mixing/*`, screen | Tests for table lookup, OKLab round-trip, distance threshold; named color appears in Free Draw |
| T-044 | Kaleidoscope | A5 Kaleidoscope | screen + `symmetry` support in canvas | 2/4/8 symmetry correct; saves |
| T-045 | Guided Drawing engine + 3 sample lessons | A5 Guided Drawing | `src/games/guided/*`, screen, content | Ghost + hand hint + voice per step; progress + sticker on finish |
| T-046 | Flipbook Studio | A5 Flipbook Studio | `src/games/flipbook/*`, screen | 3–8 frames, onion skin, 3 speeds, saves as one gallery item |
| T-047 | My Gallery grid + detail (all buttons; buttons for later features hidden until their ticket is done via a feature flag map in `src/state/features.ts`) | A5 My Gallery | gallery screens, `src/state/features.ts` | Replay, favorite, trash work; trashed items hidden |
| T-048 | Reward engine, `rewards.json`, Sticker Book screen, decorate page, toasts | A5 Sticker Book & rewards | `src/games/rewards/*`, screen | Each event grants the right rewards once (tests); toast queue max one per 20 s |

## M5 · Worlds and play

| ID | Build | Read first | Create / edit | Done when |
| --- | --- | --- | --- | --- |
| T-050 | World engine (scene, sprites, tap/long-press, album drawer) + creature drawing flow (template ghost, transparent export, trim, naming) + `creatureNames.json` | A5 Draw-to-Life worlds | `src/games/worlds/*`, `world-draw` screen | Creature saved, named, appears in the chosen world; persists after restart |
| T-051 | Aquarium scene, swim movement, feed button | A5 worlds table; mockup Draw-to-Life Aquarium · iPad | `src/games/worlds/aquarium/*`, `aquarium.tsx` | Matches mockup; 20 fish at 60 fps on budget tablet |
| T-052 | Racetrack scene, path following, Go! race with confetti for all | A5 worlds table | `src/games/worlds/racetrack/*`, screen | 8 cars drive smoothly; race always ends with every car celebrated |
| T-053 | Zoo scene, depth lanes, idle hops, snack button | A5 worlds table | `src/games/worlds/zoo/*`, screen | 16 animals move without overlap glitches |
| T-054 | Paper Comes Alive: permission via gate, camera, resize, white-paper keying, crop, destination picker, delete photo | A5 Paper Comes Alive | `src/games/paper/*`, screen | Test for keying thresholds on a sample image; original photo file deleted (test checks file gone) |
| T-055 | Drawings That Talk: mic permission via gate, hold-to-record 10 s, 3 presets, save + link | A5 Drawings That Talk | `src/games/voice/*` | Voice plays on creature tap; nothing uploaded |
| T-056 | Ramps & Rollers with `planck` | A5 Ramps & Rollers | `src/games/ramps/*`, screen | Balls roll on drawn ramps; bucket celebration; physics step fixed 1/60 s |
| T-057 | Music Paint: color → note, note events file, synced replay | A5 Music Paint | `src/games/music/*`, screen, `assets/sounds/notes/*` (placeholders) | Notes play while drawing; replay plays same song |
| T-058 | My Art Jigsaw: tab/blank pieces, drag + snap, results | A5 My Art Jigsaw | `src/games/jigsaw/*`, screen | 4/9/16/24 pieces work; snap at 24 px; best time saved |
| T-059 | Stickers From My Art + "My stickers" in stamp tray | A5 Stickers From My Art | gallery detail, canvas stamp tray | Sticker from a stroke drawing and from a coloring page both work |
| T-060 | Museum Night | A5 Museum Night | `src/games/museum/*`, screen | Full 45 s show plays with spotlight, replays, creatures, applause |
| T-061 | AR Wall (Big mode, if device + library support) | A5 AR Wall | `src/games/arwall/*`, screen | Place, move, resize up to 6 drawings; tile hidden when unsupported; no camera data saved |

## M6 · AI Magic

| ID | Track | Build | Read first | Create / edit | Done when |
| --- | --- | --- | --- | --- | --- |
| T-070 | SERVER | Supabase project setup: migrations `0001_core.sql` and `0002_ai.sql`, private `art` bucket + policies, `grant execute on function public.server_now() to anon`, document every secret in `supabase/README.md` | A3 Supabase schema, A7 tables | `supabase/**` | `supabase db reset` runs clean locally; RLS blocks a second test user from reading the first user's rows |
| T-071 | APP | Parent account: email magic-link sign-in from onboarding end and Parent zone → Account; create `family` row on first sign-in; persist session (secure-store adapter); `Purchases.logIn(family.id)` | A3 Supabase, A7 Paid-later switch | `src/services/supabase.ts`, `src/services/auth.ts`, account screen | Sign in, kill app, reopen: still signed in; family row exists |
| T-072 | SERVER | Edge shared modules: `guard.ts`, `validate.ts`, `blocklist.ts`, `moderation.ts`, `usage.ts`, provider adapters (anthropic text/vision, openai image, openai moderation) | A7 Architecture, Response contract, Guard logic, Providers, Blocklist | `supabase/functions/_shared/**` | Deno tests: every guard code, cap counting, whole-word blocklist |
| T-073 | SERVER | `ai-guess` and `ai-coach` (+ `coachIdeas.json` copy) | A7 Features 4, 5 | 2 function folders | Coach never returns an id outside the list (test with a mocked provider returning junk) |
| T-074 | SERVER | `ai-coloring-page` (+ `aiIdeaTiles.json` copy, spoken-text rewrite step) | A7 Feature 1 | function folder | Tile request returns a PNG; unknown tile → `BAD_INPUT`; blocked idea → `BLOCKED` |
| T-075 | SERVER | `ai-magic-sketch` | A7 Feature 2 | function folder | Returns PNG; output moderation runs |
| T-076 | SERVER | `ai-story` (two-step, JSON retry once) | A7 Feature 3 | function folder | Returns title + one page per drawing; word limits enforced (test) |
| T-077 | SERVER | `ai-digest` (weekly cap) | A7 Feature 6 | function folder | Second call in the same 7 days → `CAP_REACHED` |
| T-078 | APP | `src/services/ai.ts`, `useAiStatus`, waiting animation screen, error-to-mascot mapping, AI consent screen, Magic settings screen, Magic tile dimming/padlock | A7 App client, Response contract, Consent screen | `src/services/ai.ts`, `src/components/kid/MagicWaiting.tsx`, `app/parent/magic.tsx` | Jest: every error code → correct mascot line; consent stored locally and in `ai_consent` |
| T-079 | APP | Mascot Guess + Idea bubbles in Free Draw, Coloring, world-draw; rate limits 30 s / 60 s | A7 Features 4, 5 | canvas screens | Guess spoken; Yes grants `mascot_friend` once; coach plays local voice/text |
| T-080 | APP | Coloring Page Maker screen (WHO/DOING/WHERE tiles, Big-mode mic), threshold post-process, "My Pages" row | A7 Feature 1 | `app/(kid)/magic/coloring-maker.tsx`, `src/games/coloring/*` | Generated page opens in tap-fill and fills correctly |
| T-081 | APP | Magic Sketch screen (from Free Draw and Gallery), side-by-side reveal, saves new artwork | A7 Feature 2 | `app/(kid)/magic/sketch.tsx` | Original untouched; new artwork has sparkle badge |
| T-082 | APP | Story Maker picker, story player (`expo-speech`, auto page turn), Stories list | A7 Feature 3, A5 Stories | `app/(kid)/magic/story-maker.tsx`, `story/[storyId].tsx`, `stories.tsx` | Story plays and is saved; nickname only sent when the parent toggle is on |

## M7 · Parent zone and payments

| ID | Build | Read first | Create / edit | Done when |
| --- | --- | --- | --- | --- |
| T-090 | Parent dashboard (ring, week bars, rules summary, new art, skills) | A5 Parent zone; mockup Parent zone · phone | `app/parent/index.tsx` + screen | Matches mockup; data comes from `usage_day` and repositories |
| T-091 | Time rules screen with ranges + `applyRulesChange` + iOS shield re-apply | A5 Parent zone, A3 TimeRules ranges, A4 | `app/parent/time-rules.tsx` | Raising the limit while locked unlocks immediately |
| T-092 | Kids management (add max 4, edit, delete with two confirms) + per-kid trash | A5 Parent zone | `app/parent/profiles.tsx` | Delete removes DB rows and the art folder |
| T-093 | Sync service + backup consent screen + queue processing | A3 Sync rules | `src/services/sync.ts`, `app/parent/art-sharing.tsx` | Offline queue drains when online; usage uses MAX rule (test) |
| T-094 | Family Gallery. SERVER: `family-gallery` function. APP: create/revoke link, share toggle per artwork, upload shared PNGs | A7 Family Gallery | function folder + art-sharing screen | Link shows only shared art; revoked link shows "This link is turned off." |
| T-095 | Printing: sticker sheet PDF, story book PDF (`expo-print` + `expo-sharing`) | A5 Stickers From My Art, A7 Feature 3 | `src/services/print.ts` | Both PDFs open in the share sheet with correct layout |
| T-096 | RevenueCat: SDK init with platform keys, entitlements `family` and `ai_magic`, Subscription screen, gating map + padlock tiles. SERVER: `rc-webhook` | A5 Free vs Family gating, A7 Paid-later switch | `src/services/purchases.ts`, `app/parent/subscription.tsx`, `src/state/features.ts`, function folder | Sandbox purchase unlocks Family features; webhook sets `ai_entitled`; kids never see prices |
| T-097 | Account screen: change PIN, sign out, "Delete all data" (local wipe + SERVER `delete-account` function that removes rows, storage files and the auth user), privacy/support links | A5 Parent zone (Account) | `app/parent/account.tsx`, `supabase/functions/delete-account/` | After delete, app returns to onboarding and the Supabase user no longer exists |
| T-098 | AI digest card on dashboard with weekly cache + refresh | A7 Feature 6 | dashboard | Card appears once per week; hidden when Magic is off |

## M8 · Ship

| ID | Build | Read first | Create / edit | Done when |
| --- | --- | --- | --- | --- |
| T-100 | Accessibility pass: every button has `accessibilityLabel`; touch sizes per A1 rule 8; text contrast 4.5:1; respect Reduce Motion (shorter, calmer animations) | A1, A2 | all screens | Checklist in `docs/ACCESSIBILITY.md` all ticked |
| T-101 | Performance pass on a budget Android tablet and an older iPad: drawing, coloring fill, worlds, museum | A5 performance targets | as needed | All targets met; results written in `docs/PERFORMANCE.md` |
| T-102 | Compliance pass: dependency scan (no ads/analytics SDKs), iOS `PrivacyInfo.xcprivacy`, notes for Google Play Data safety and Families forms, Apple Kids Category checklist, parental gate on every external link/purchase/settings | Overview tab Compliance, A1 rule 2 | `docs/COMPLIANCE.md` | Every item checked; owner sign-off line at the bottom |
| T-103 | Content audit: list every placeholder (coloring pages, guided lessons, stamps, stickers, voice files, note samples, world templates) for the owner | — | `docs/CONTENT_TODO.md` | Complete list with file names and counts |
| T-104 | EAS Build profiles (development, preview, production), app icons/splash placeholders, TestFlight + Play internal testing upload | A1 Tech baseline | `eas.json`, assets | Preview builds install on test devices |
| T-105 | Beta fix loop and store submission checklist (screenshots list, age rating answers, review notes explaining the parental gate and Screen Time use) | — | `docs/SUBMISSION.md` | Both store submissions prepared for the owner to press Submit |
