# Content to make (T-103)

Everything below works today with placeholder content. Counts are what the spec asks for vs what ships now.

| Content | Where | Spec | Now | Notes |
| --- | --- | --- | --- | --- |
| Coloring pages (line art PNG, 1024 px, closed regions) | `assets/coloring/*.png` + `src/content/coloringPages.json` | 10 Free + more for Family (owner decides) | 3 (`car`, `cat`, `fish`) | Pure black lines on white, no gaps |
| Guided drawing lessons | `src/content/guidedLessons.json` | owner decides | 3 | Step paths + spoken step text |
| Voice recordings | `assets/voice/<key>.m4a` | 225 keys in `voiceLines.json` | 0 (all spoken by text-to-speech) | Missing files fall back to `expo-speech` |
| Sound effects | `assets/sounds/*.m4a` | 21 | 21 placeholder files (+ notes) | Replace with final mixes, same names |
| Music note samples | `assets/sounds/notes/` | per instrument | 10 placeholder files | Music activity |
| Stamps | `src/canvas/stamps.ts` | 20 | vector placeholders | SVG paths |
| Rewards / stickers art | `src/content/rewards.json` | 56 + 30 daily | names only, generic badge art | One PNG per reward |
| World templates (Aquarium, Racetrack, Zoo) | `src/games/worlds/` | 3 backgrounds + creature parts | simple vector scenes | |
| Avatars | `src/content/avatars.ts` | 8 (confirmed in code) | 8 vector faces | OK for v1 |
| AI idea tile pictures | `src/content/aiIdeaTiles.json` | 62 pictures | words only | Coloring Page Maker tiles |
| App icon, splash | `assets/images/icon.png`, `splash-icon.png`, `assets/expo.icon`, android icons | final art | Expo defaults | Also store screenshots (see SUBMISSION) |
| Privacy policy + support URLs | `src/content/links.ts` | real URLs | placeholders | Required before submission |
| Consent wording review | Magic consent, backup text | lawyer-reviewed | plain draft | |
