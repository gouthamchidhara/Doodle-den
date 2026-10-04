# A5 · Screens & games

Every screen below lists its route, layout, behavior rules and acceptance checks. Match the mockups on the "Doodle Den — App Screens" design canvas for look. AI Magic screens are specified in tab A7.

## Global rules for all kid screens

- Background `colors.bgKid`. Safe-area padding on all sides. Tablet padding 24–48, phone 16–20.
- Top-left: Home `IconButton` (except Kid Home). Top-center or right: `TimePill`.
- Every tap: scale press feedback + `tap.m4a` + light haptic (A2 motion tokens).
- First visit to each activity plays its intro voice prompt once (list at the end of this tab). A speaker `IconButton` replays it.
- `expo-keep-awake` active on all drawing screens.
- Little mode (3–5): bigger buttons (64 pt), fewer tools, tap-to-fill coloring, no text input. Big mode (6–8): 56 pt buttons, all tools.

## App start & routing (`app/index.tsx`)

1. Load fonts, open DB, run migrations, load lock state (A4).
2. If `app_meta.onboarding_done` is not `'true'` → `/onboarding/welcome`.
3. Else if locked → `/locked`.
4. Else if more than one kid profile and no `active_kid_id` → `/profiles`.
5. Else → `/(kid)/home`.

Splash screen stays until step 1 finishes (max 3 s, then continue anyway).

## Onboarding (parent-facing, `app/onboarding/*`)

Parent look (A2 parent tokens). One question per screen, big "Next" `ParentButton`, back arrow.

| Screen | Content | Saves |
| --- | --- | --- |
| `welcome` | App name, mascot, one line "Creative play that knows when to stop." Button "Set up for my child" | — |
| `create-pin` | Enter 4-digit PIN twice (number pad, dots). Mismatch → shake + "PINs don't match" | `dd.pin.salt`, `dd.pin.hash` (A3) |
| `add-kid` | Nickname (max 12 chars, hint "A nickname, not a full name"), pick avatar (8 built-in animal avatars), age: "3–5" or "6–8" | `kid_profile`, default `time_rule` |
| `time-rules` | Daily limit (stepper, default 45), per session (default 20), bedtime on/off + times (default 19:30–07:00) | `time_rule` |
| `device-lock-tips` | iOS: how to turn on Guided Access (3 short steps + "Open Settings" button via `Linking.openSettings()`), and the "Extra iOS lock" option if the flag is on (A4). Android: "Keep my child in the app" toggle → `startPinning()` | — |
| (end) | Optional: "Create a parent account" (needed for backup, Magic and Family Gallery) → Supabase email magic link; "Skip for now" allowed | `app_meta.onboarding_done = 'true'` |

Acceptance: completing onboarding twice is impossible; killing the app mid-onboarding resumes at the same screen (store `app_meta.onboarding_step`).

## Profile picker (`app/profiles.tsx`)

Big round avatar buttons (160 px tablet, 120 phone) with nickname under. Tap → sets `active_kid_id` → `/(kid)/home`. Small "Grown-ups" button bottom-right → Parent Gate. Switching profile from Kid Home always goes through the Parent Gate.

## Parent Gate (`app/parent/gate.tsx`)

Everything for adults sits behind this. Two steps:

1. **Hold** a button for 2 seconds (ring fills while holding; release early = reset). Kids under 5 rarely do this deliberately.
2. **PIN** — 4-digit pad. Correct → set an in-memory `parentUnlockedUntil = now + 5 min` and continue to the requested parent screen. Wrong → shake. 3 wrong in a row → 60 s cooldown (`dd.gate.failures`).

"Forgot PIN?" link → if a parent account exists, email magic link sign-in resets the PIN; otherwise show "Delete and reinstall the app to reset" (with warning that art is lost unless backed up).

Parent routes (`app/parent/_layout.tsx`) redirect to the gate when `parentUnlockedUntil` has passed. Leaving the parent zone clears it.

## Kid Home (`app/(kid)/home.tsx`) — mockup "Kid Home · iPad"

**Header:** avatar circle + "Hi, {nickname}!" + subline "What do you want to make?"; right side `TimePill` and "Grown-ups" button.

**Shelves:** a row of 5 big shelf tabs under the header, each an icon + one word, with a spoken name on tap: **Draw**, **Play**, **Learn**, **Magic**, **My Stuff**. Selected tab = tint fill + 4 px border. Default shelf: Draw. Remember last shelf per kid in `app_meta`.

**Tiles per shelf** (tablet: 4 columns, rows scroll vertically if more than 8; phone: 2 columns):

| Shelf | Tiles (in this order) | Tile tint |
| --- | --- | --- |
| Draw | Free Draw, Coloring, Guided Drawing (Big only), Kaleidoscope, Flipbook (Big only), Paper Comes Alive | tomato, sun, grape, pink, sky, orange |
| Play | Aquarium, Racetrack, Zoo, Ramps & Rollers, Music Paint, Jigsaw, AR Wall (Big only, hidden if device has no AR) | sky, tomato, leaf, orange, grape, pink, navy |
| Learn | Trace & Learn, Mixing Lab | leaf, grape |
| Magic | Coloring Page Maker, Magic Sketch, Story Maker | grape, pink, sun |
| My Stuff | My Gallery, Stories, Museum Night, Sticker Book | navy, sun, grape, orange |

Magic tiles are dimmed with a small cloud icon when `useAiStatus()` says offline, and show a small padlock when not consented (tap → Parent Gate → Magic settings).

**Bottom:** mascot (idle) + speech bubble with "Today's idea" (rotate daily from a list of 30 in `src/content/dailyIdeas.json`, each with a voice file). Tapping the bubble opens the matching activity.

Acceptance: all tiles reachable; Little mode hides Big-only tiles; shelf choice persists across app restarts; no text on screen longer than 6 words except the nickname greeting.

## Wind-down overlay (in `app/(kid)/_layout.tsx`) — mockup "Wind-down warning · phone"

- `WARN_5`: banner slides down from the top, mascot sleepy, "Getting sleepy… finish your drawing soon!", yawn sound, background dims 10% over 2 s. Auto-hides after 6 s. Touches still work.
- `WARN_1`: same banner, stays visible. On drawing screens adds button "Finish my drawing" (Big) / big moon button (Little) → `requestFinishDrawing`. If granted: "OK! 2 more minutes." If denied: button hides.
- `BREAK`: bubble "Stretch break! Wiggle your arms!" for 10 s with mascot stretching.

## Lock screen (`app/locked.tsx`) — mockup "Lock screen · iPad"

- Background `colors.night`, moon, stars, crayon box with sleeping crayons ("z z").
- Headline by reason: `cooldown` "Break time! The crayons are resting"; `daily` and `bedtime` "The crayons are sleeping now"; `parent` "A grown-up paused play".
- Subline: "Great art today, {nickname}! Time for some real-world play."
- Green check chip "Your drawing is saved in My Gallery" (only if an AUTOSAVE happened in the last 60 s).
- Three suggestion cards (rotate from 12 in `src/content/offScreenIdeas.json`): e.g. Draw on paper, Build a fort, Play outside.
- Bottom-left: when play returns — cooldown: "Back in {n} minutes"; daily: "Back tomorrow"; bedtime: "Back at {bedtimeEnd}".
- Bottom-right: "Grown-ups: hold to unlock" → Parent Gate → unlock sheet with `+15 min`, `+30 min`, `End for today` (A4 `parentUnlock`).
- `lullaby-loop.m4a` at volume 0.3 for 60 s, then silence.
- Android back button does nothing.

Acceptance: reachable only via LockGate; force-quit + reopen returns here while locked; unlock options work and return to Kid Home.

## Drawing engine (`src/canvas/`) — used by every drawing screen

One reusable component, `DrawingCanvas`, powers Free Draw, Coloring (brush mode), Guided Drawing, Kaleidoscope, Flipbook frames, world drawing screens (fish, car, animal), Music Paint and Ramps & Rollers. Build it once, test it, then reuse.

**Props:**

```ts
interface DrawingCanvasProps {
  doc: StrokeDoc;                         // current strokes (controlled)
  onChange: (doc: StrokeDoc) => void;     // called at end of each stroke
  tool: BrushType; color: string; size: 'S' | 'M' | 'L'; stampId?: string;
  symmetry?: 1 | 2 | 4 | 8;               // kaleidoscope; default 1
  ghost?: { image?: SkImage; pathSvg?: string; opacity: number }; // template / guided step / onion skin
  overlay?: SkImage;                      // line art drawn ON TOP (coloring)
  clipToSquare?: boolean;                 // kaleidoscope
  onStrokePoint?: (p: StrokePoint) => void; // Music Paint listens to this
  ref: Ref<DrawingCanvasHandle>;
}
interface DrawingCanvasHandle { undo(): void; redo(): void; clear(): void; exportPng(longEdge: number): Promise<string /* base64 */>; replay(durationMs: number): void }
```

**Input rules:**

- `Gesture.Pan()` with `minDistance(0)` and `maxPointers(1)`. A second finger draws nothing.
- Pressure: use Apple Pencil / stylus pressure if the event provides it (RNGH `stylusData.pressure`), else `0.5`. Width multiplier = `0.6 + pressure * 0.8`.
- Store points normalized: `x / canvasWidth`, `y / canvasHeight`, `t` = ms since stroke start.
- Drop a point if it is closer than 2 px to the previous point.
- Smooth with quadratic curves through midpoints of consecutive points.
- A tap with no movement draws a dot, or places a stamp when the tool is `stamp`.

**Rendering rules:**

- Layers bottom → top: background color → finished strokes (cached) → live stroke → `overlay` (line art) → `ghost`.
- Cache finished strokes into one Skia `Picture` (re-record after each stroke end). Draw the live stroke as a `Path` on top.
- Performance target: 60 fps while drawing with 300 strokes on an iPad (9th gen) and a budget Android tablet (\~$100). If slower, flatten strokes older than the last 20 into an `SkImage` snapshot.

**Brushes** (base widths in px on tablet; phone = ×0.8):

| Brush | S / M / L width | Look (Skia) |
| --- | --- | --- |
| `crayon` | 6 / 14 / 28 | Opacity 0.95, round cap, `DiscretePathEffect(4, 1.5)` for a waxy rough edge |
| `marker` | 6 / 14 / 28 | Opacity 1.0, round cap, smooth |
| `watercolor` | 11 / 25 / 50 | Opacity 0.35, `BlurMaskFilter` sigma 3; overlaps build up color |
| `glitter` | 5 / 11 / 22 base | Base stroke at opacity 0.6, plus small star sprites every 14 px along the path in white and `sun`; size and rotation from a random generator seeded with the stroke id (so replay looks the same) |
| `neon` | glow 16 / 36 / 72, core 4 / 8 / 16 | Two passes: glow = color, opacity 0.35, blur sigma 8; core = color mixed 50% with white |
| `eraser` | 14 / 28 / 56 | `BlendMode.Clear` on the strokes layer only (background stays) |
| `stamp` | 48 / 96 / 160 px stamp | Tap = one stamp; drag = a stamp every 1.2× stamp size. 20 stamps in `assets/stamps/`: heart, star, flower, paw, smile, sun, cloud, car, fish, butterfly, leaf, music note, rainbow, moon, crown, balloon, apple, dino, rocket, dot |
| color `rainbow` | any brush | Hue changes along the stroke: `hue = (distance / 400 * 360 + seed) % 360`, drawn as short segments |

**Undo / redo / clear:** undo removes the last stroke (history 50). Redo until a new stroke starts. Clear: hold the trash button 1.5 s → mascot asks "Start fresh?" Yes/No. If the drawing has 3+ strokes it is saved to My Gallery before clearing.

**Saving (`src/canvas/saveArtwork.ts`):** autosave every 10 s if changed, on app background, on lock `AUTOSAVE`, and when leaving the screen. First save creates the `artwork` row; later saves overwrite the same files and `updated_at`. Files per A3. Export PNG at 2048 px long edge, thumb at 400.

**Replay:** draws strokes in order using their `t` values, total time = min(8 s, real time). Used in My Gallery and Museum Night.

## Free Draw (`app/(kid)/draw.tsx`) — mockups "Free Draw · iPad" and "Wind-down warning · phone"

- Tablet: left tool rail (crayon, marker, watercolor, glitter, neon, stamps, eraser at bottom), right rail (S/M/L sizes + background color button), bottom palette (10 colors + rainbow + any custom colors from Name Your Colors), top bar (Home, Undo, Redo, `TimePill`, "I'm done!").
- Phone: top bar (Home, Undo, `TimePill`, Done), canvas, bottom tray with 5 tools row + 7 colors row (swipe for more).
- Little mode tools: crayon, marker, glitter, stamps, eraser only; sizes M and L only.
- Mascot sits in the bottom-right corner of the canvas (48 px). Tap → Guess / Idea bubbles (A7 Features 4 and 5) and, if 10+ strokes, a "Magic" wand bubble (A7 Feature 2).
- "I'm done!" → save → sparkle + `save-sparkle.m4a` + mascot "Beautiful!" → sheet with 3 big choices: New drawing, My Gallery, Home.

Acceptance: draws with every brush; undo/redo work; drawing survives force-quit (reopen shows it in My Gallery); lock during drawing saves first.

## Coloring (`app/(kid)/coloring/index.tsx`, `[pageId].tsx`)

**Picker:** "My Pages" row first (AI pages, A7 Feature 1), then category rows: Animals, Vehicles, Fantasy, Nature, Food. 30 bundled pages listed in `src/content/coloringPages.json` (`{ id, title, category, file, ages: 'both' | 'little' | 'big' }`), files `assets/coloring/<id>.png` (black line art on white, 2048 px). Until the owner supplies art, create 3 simple placeholder pages and list the rest in `docs/OPEN_QUESTIONS.md`.

**Engine: bitmap flood fill** (works for bundled and AI pages):

1. Load line art, downscale to a 1024 px working copy. Build a `Uint8Array` mask: wall = luminance < 128.
2. Little mode: tap → scanline flood fill from the tap point on non-wall pixels into a fill layer with the selected color; show a small sparkle. Tap on a wall pixel → search 6 px around for the nearest non-wall pixel.
3. Big mode: brush coloring with `DrawingCanvas` under the line art (`overlay` = line art) plus a bucket tool that uses the same flood fill.
4. Line art always draws on top using `BlendMode.Multiply`.
5. Save: composite PNG as artwork (activity `coloring`), plus the fill layer PNG at `art/<kidId>/<artworkId>.fill.png` so the page can be continued later.

Acceptance: tap-fill never leaks through closed lines; fill completes in under 300 ms on a budget tablet (show sparkle while running).

## Guided Drawing (`app/(kid)/guided.tsx`, Big mode)

- Lesson picker: grid of lesson cards. Lessons in `src/content/guidedLessons.json`: `{ id, title, steps: [{ pathSvg /* normalized 0..1 */, voice }] }`.
- Each step: dashed ghost path (opacity 0.35) + a hand icon animates along it once; voice explains ("Draw a big circle for the head"). Kid draws freely on top — no accuracy check, no "wrong".
- Big arrow "Next" → next step. Last step: "Now color it!" and full palette.
- Saves as artwork (activity `guided`); finishing a lesson sets progress skill `guided_<id>` and grants that lesson's sticker.
- Build the engine + 3 sample lessons (cat, house, fish) from simple circles and lines. The other 17 (dog, rocket, flower, sun face, owl, butterfly, dinosaur, unicorn, robot, turtle, tree, boat, bunny, bear, castle, car, star friend) are owner content tasks.

## Kaleidoscope (`app/(kid)/kaleidoscope.tsx`)

- Square canvas centered. Segment picker: 2 (mirror), 4, 8 — three big icon buttons.
- Each stroke renders `symmetry` times: rotated by `360 / symmetry` degrees around the center; for 2, mirrored left/right instead.
- Background toggle black/white (Big mode). All brushes except stamp.
- Saves as artwork (activity `kaleidoscope`).

## Flipbook Studio (`app/(kid)/flipbook.tsx`, Big mode)

- Bottom strip: frame thumbnails (3–8) + "+" add frame (blank). Tap a thumbnail to edit it. Long-press → delete (with confirm).
- Onion skin: previous frame shown at 25% opacity as `ghost`.
- Speed: 2, 4, 8 frames per second (turtle, rabbit, cheetah icons). Play button shows a looping preview overlay.
- Save: each frame saved as artwork with activity `flipbook_frame` (hidden from the My Gallery grid), plus a `flipbook` row. My Gallery shows the flipbook as one item with a play badge.

## Paper Comes Alive (`app/(kid)/paper.tsx`)

1. Camera permission not granted → mascot "Ask a grown-up to let me use the camera" → Parent Gate → `requestCameraPermissionsAsync()`.
2. Camera screen (`expo-camera`, back camera): dashed frame overlay "Put your drawing inside", big shutter button, Home button.
3. After capture: resize to 1600 px long edge (`expo-image-manipulator`).
4. White-paper keying (Skia runtime shader or pixel loop): for each pixel compute luminance L and saturation S. If `L > 0.82 && S < 0.15` → alpha 0; if `L > 0.72 && S < 0.22` → alpha fades linearly; else alpha 1.
5. Crop to the bounding box of visible pixels + 4% padding. If visible area < 2% of the image → mascot "I can't see a drawing. Try darker colors!" and retry.
6. Show the result on a checkerboard. Kid chooses: Aquarium, Zoo, Racetrack, or Just save.
7. Delete the original photo file immediately. Save only the keyed PNG as artwork (activity `paper`). Never upload the photo.

## Draw-to-Life worlds (shared engine `src/games/worlds/`)

Aquarium, Racetrack and Zoo share one engine. A world = a Skia scene with a painted background + moving sprites made from the kid's drawings (`world_entity` rows).

**Making a creature (`app/(kid)/world-draw.tsx?world=aquarium|racetrack|zoo`):**

1. `DrawingCanvas` with a transparent background and a dashed ghost outline (fish / car / animal shape, `assets/worlds/<world>-template.png`) at opacity 0.3. Kid may draw outside it.
2. Big button "Send it!" (only after 3+ strokes) → export on transparent background → trim to the strokes' bounding box + 8 px → save as artwork (activity `world`).
3. Name it: Big mode shows 12 name chips from `src/content/creatureNames.json` (Sunny, Bubbles, Zoom, Pickle…) + a mic button (on-device speech, blocklist-checked, max 12 chars); Little mode picks a random name and the mascot says it.
4. Insert `world_entity`, open the world, play the entrance animation (splash / vroom / hop).

Paper Comes Alive results enter the same way (skip step 1–2).

**Shared world rules:** sprites keep their drawn colors; sprite height = 14–18% of screen height; tap a sprite → wiggle 400 ms + world sound + name label for 2 s + its voice clip if it has one; long-press 1 s → Drawings That Talk sheet. World top bar: Home, world title ("{nickname}'s Aquarium · 6 fish"), `TimePill`. Bottom: big tomato `PrimaryButton` "Draw a new {fish|car|animal}".

| World | Scene (mockup "Draw-to-Life Aquarium · iPad" for style) | Movement | Extra button | Max on screen |
| --- | --- | --- | --- | --- |
| Aquarium | Water `colors.water`, light wave band on top, sand, seaweed, rising bubbles | Each fish: horizontal speed 20–60 px/s, flips at edges, vertical bob `sin(t·f)·amp` (amp 10–30 px); values from a generator seeded with the entity id | Feed: food dots fall; the 3 nearest fish steer toward them for 5 s | 20 |
| Racetrack | Top-down grass + gray oval track with white dashes, start line, stands | Cars follow the track's center path at 80–160 px/s, rotated to the path direction, each in its own lane offset | Go!: 3-lap race, every car finishes, confetti for all, no winner shown | 8 |
| Zoo | Grass field, pond, trees, fence; three ground lines at different depths | Animals walk left/right along a ground line (scale 0.7 / 0.85 / 1.0 by depth), random 1–3 s idle stops with a little hop | Snack: animals hop toward a dropped treat | 16 |

Older creatures beyond the max move to an "Album" drawer (button top-right) and can be brought back (swapping out the oldest on screen). Nothing is ever deleted by the world.

Acceptance: 20 fish animate at 60 fps on a budget tablet; tap and long-press work on moving sprites; creatures persist across restarts.

## Drawings That Talk (`src/games/voice/VoiceSheet.tsx`)

- Opened by long-pressing a world creature, or "Give it a voice" in My Gallery detail.
- First time per device: microphone permission behind the Parent Gate (`expo-audio` recording permission).
- Sheet: big red mic button — hold to record, release to stop, max 10 s (auto-stop with a soft beep). Then playback with 3 preset buttons: Normal (rate 1.0), Chipmunk (rate 1.6, pitch correction off), Monster (rate 0.7, pitch correction off). "Keep it!" saves.
- File `art/<kidId>/voice/<id>.m4a`, row in `voice_clip`, linked via `world_entity.voice_clip_id` (or stored on the artwork's entity in Gallery). Never uploaded, never sent to AI.

## Ramps & Rollers (`app/(kid)/ramps.tsx`)

- Two modes with a big toggle: **Draw** (pencil icon) and **Play** (ball icon).
- Draw mode: `DrawingCanvas`, marker only, size L. Each finished stroke becomes a static `planck` chain shape: convert points to meters (1 m = 50 px), keep a point every 12 px.
- Play mode: three drop spots at the top (arrows). Tap one → a ball (dynamic circle, radius 0.4 m, restitution 0.4, friction 0.3, gravity (0, 10)) drops. Ball skins rotate: ball, orange, round cat.
- A bucket sits at the bottom (random x per session). Ball lands in it → confetti + `star.m4a`. No failure state; balls leaving the screen are removed. Max 15 balls; "Reset balls" button.
- Physics: fixed timestep 1/60 s, 8 velocity / 3 position iterations; render with Skia.
- Saving stores the ramps drawing as artwork (activity `ramps`).

## Music Paint (`app/(kid)/music.tsx`)

- `DrawingCanvas` with all palette colors; each color plays one note (marimba samples `assets/sounds/notes/<note>.m4a`): tomato C4, orange D4, sun E4, leaf G4, sky A4, grape C5, pink D5, brown E5, black G5, white A5 (pentatonic: every combination sounds nice).
- While drawing, play the current color's note every 140 ms of movement (`onStrokePoint`), volume 0.4–1.0 by finger speed.
- Record note events `{ t, note, x, y }` to `art/<kidId>/<artworkId>.notes.json`.
- Play button: replays the drawing (`replay`) and its notes in sync.
- Save as artwork (activity `music`) + `music_paint` row.

## My Art Jigsaw (`app/(kid)/jigsaw.tsx`)

1. Pick one of your drawings (gallery grid, newest first).
2. Pick pieces: 4, 9, 16, 24 (Little mode: 4 and 9 only).
3. Pieces: grid cuts with classic tab/blank edges (each internal edge randomly tab-out or tab-in, seeded by artwork id + piece count), built as Skia paths that clip the image.
4. Board on the left/top (Little: faint full picture at 15% opacity as a guide), scattered pieces in a tray. Drag a piece; within 24 px of its spot → it snaps with a click.
5. Done → confetti, `star.m4a`, store `jigsaw_result` (best time), grant the jigsaw sticker for that size once.

## AR Wall (`app/(kid)/arwall.tsx`, Big mode)

- Show the tile only if the device supports AR (`@reactvision/react-viro` support check). If the library cannot run on the project's Expo SDK, hide the tile and record it in `docs/OPEN_QUESTIONS.md` — do not block other tickets.
- Camera permission behind the Parent Gate.
- Scene: detect horizontal and vertical planes. Bottom strip of the kid's drawings. Pick one, tap a detected surface → the drawing appears as a flat image 0.4 m wide. Drag to move, pinch to resize (0.2–1.2 m). Max 6 drawings.
- No photo capture, no recording, nothing saved from the camera. Leaving the screen clears the scene.
- Insert a `world_entity` row (world `arwall`) only as a "favorite to place" list; no camera data stored.

## Trace & Learn (`app/(kid)/trace.tsx`)

- Picker tabs: Letters (A–Z; Big mode also a–z), Numbers (0–9), Shapes (circle, square, triangle, star, heart, line, zigzag, spiral).
- Path data: `src/content/tracePaths.json` → `{ id, strokes: [[x, y][]] }`, normalized 0..1, strokes in standard school order and direction (e.g. A: left slant top→bottom-left, right slant top→bottom-right, crossbar left→right). Agents author this data from simple lines and arcs.
- Each stroke shows: thick dashed path (`tint.leaf.border`), green start dot, small arrow for direction. Finger within tolerance (28 px Little, 18 px Big) moves a progress fill along the path. Leaving tolerance pauses progress — no error sound, no red.
- A stroke completes at 90% coverage; then the next stroke's start dot appears.
- Stars: % of finger points inside tolerance → ≥ 90% = 3, ≥ 75% = 2, otherwise 1 (finishing always earns at least 1).
- Finish: voice "A! A is for apple!" with a picture card (`src/content/traceWords.json`), `star.m4a`, progress `trace_<id>` = best stars, sticker per rules below.

## Mixing Lab + Name Your Colors (`app/(kid)/mixing-lab.tsx`)

- Bottom: 5 paint pots (tomato red, sun yellow, sky blue, white, black) + a "My colors" pot that opens the kid's custom colors. Center: big mixing bowl.
- Drag a blob from a pot into the bowl (max 3 blobs). Bowl color animates with a swirl to the mix result. "Empty bowl" button.
- Mix rule: first look up `src/content/mixTable.json` (two-color pairs, order-free): red+yellow `#F58A2B`, yellow+blue `#3BAA6A`, blue+red `#8A5CD6`, red+white `#F4A0B5`, blue+white `#9CCBF5`, yellow+white `#FFE8A3`, black+white `#9AA0AA`, red+black `#7A2A2A`, blue+black `#1F3A6B`, yellow+black `#7A7A2A`. Anything else (3 blobs, custom colors): average the colors in OKLab space (Björn Ottosson's published sRGB↔OKLab formulas) and convert back.
- **New color:** if the result's OKLab distance is > 0.05 from every standard and saved custom color → confetti + `new-color.m4a` + "You made a new color!" → naming.
- **Naming:** two rows of picture-word chips; kid taps one from each: first word (dragon, unicorn, sunny, ocean, monster, rainbow, bubble, cookie, jelly, rocket, banana, frog), second word (green, splash, swirl, sparkle, goo, cloud, juice, dust) → e.g. "Dragon Goo". Big mode also has a mic button (on-device speech, blocklist-checked, max 20 chars).
- Save to `custom_color`. Custom colors appear after the standard palette in every drawing screen. Max 24 per kid; when full the mascot says "Your color box is full!" (parent can delete colors in Parent zone).

## My Gallery (`app/(kid)/gallery/index.tsx`, `[artworkId].tsx`)

- Grid newest first (tablet 4 columns, phone 2). Filter chips: All, Favorites. Hidden: `flipbook_frame` and trashed items. Badges: play (flipbook, music), sparkle (Magic), speaker (has a voice).
- Detail screen: big image + big icon buttons: Replay (if strokes exist), Favorite (heart), Magic Sketch (if AI ready), Make a sticker, Give it a voice, Put in a world (Aquarium / Zoo / Racetrack), Trash (hold 1.5 s → moves to trash; only parents empty trash).

## Stickers From My Art

- "Make a sticker" in Gallery detail: if strokes exist, export strokes on a transparent background trimmed to bounds; otherwise apply the white-paper keying from Paper Comes Alive. Save `sticker_path`, set `is_sticker = 1`.
- Stickers appear in the Free Draw stamp tray under "My stickers" and in the Sticker Book decorate pages.
- Parent zone → Print stickers: pick up to 12 → `expo-print` HTML page (US Letter, 3×4 grid, 2-inch cells, dashed cut lines) → `expo-sharing`.

## Stories (`app/(kid)/stories.tsx`)

Cards with title + first drawing, newest first. Tap → story player (A7 Feature 3). Kids cannot delete stories; parents can in Parent zone.

## Museum Night (`app/(kid)/museum.tsx`)

1. Kid picks 3–6 drawings (favorites shown first) or taps "Surprise me" (picks favorites, then newest).
2. "Open the museum!" → dark museum hall (Skia): frames on the wall light up one by one with a spotlight; each drawing replays inside its frame (or fades in if it has no strokes).
3. Then up to 5 of the kid's world creatures walk, drive or swim across the floor.
4. A small audience of round blob characters claps (`clap.m4a`), confetti, mascot says "Welcome to {nickname}'s museum!". About 45 s. Replay button.
5. Save a `museum_exhibit` row; grant the museum sticker once.

## Sticker Book & rewards (`app/(kid)/stickers.tsx`, `src/games/rewards/rewardEngine.ts`)

Rewards are earned only by creating, never by time spent or streaks. All tools are available from the start; rewards give stickers and 10 bonus stamps.

`checkRewards(kidId, event)` runs after these events and calls `grantReward` (no-op if already earned):

| Event | Rewards (ids in `src/content/rewards.json`) |
| --- | --- |
| `ARTWORK_SAVED` | `first_drawing`, `five_drawings`, `twenty_drawings`, `fifty_drawings`; `day_<yyyy-mm-dd>` (one rotating "today" sticker per day from a set of 30 designs) |
| `WORLD_ENTITY_ADDED` | `first_fish`, `first_car`, `first_animal`, `aquarium_ten`, `first_paper` |
| `TRACE_COMPLETED` | `letter_<X>`, `all_letters`, `all_numbers`, `all_shapes` |
| `COLOR_NAMED` | `first_color`, `three_colors`, `ten_colors` |
| `FLIPBOOK_SAVED` / `MUSIC_SAVED` | `first_flipbook` / `first_song` |
| `RAMPS_BUCKET` | `bucket_one`, `bucket_ten` |
| `JIGSAW_DONE` | `jigsaw_4`, `jigsaw_9`, `jigsaw_16`, `jigsaw_24` |
| `STORY_MADE` / `MAGIC_DONE` / `GUESS_YES` | `first_story` / `first_magic` / `mascot_friend` |
| `MUSEUM_OPENED` / `GUIDED_DONE` | `museum_night` / `guided_<id>` |

- Earned toast: the sticker flies into a book icon, `sticker-earned.m4a`; queue toasts, max one per 20 s.
- Sticker Book: pages of 12 slots; earned stickers in color, unearned as soft gray silhouettes (no "locked" text). A "Decorate" page lets the kid drag earned stickers and "My stickers" onto one of 3 background scenes; saved as artwork.

## Parent zone screens (`app/parent/*`) — mockup "Parent zone · phone"

All parent screens use parent tokens, standard 44 pt touch targets, plain text allowed.

| Screen | Contents |
| --- | --- |
| Dashboard `index.tsx` | Kid switcher; AI digest card (A7 Feature 6, only if Magic is on); today `StatRing` (used vs limit, sessions, extensions); `WeekBars`; time-rules summary rows; "New art this week" (3 thumbnails + See all); skills line (letters traced, colors named) |
| Time rules `time-rules.tsx` | Every `TimeRules` field with steppers/pickers and allowed ranges (A3); Save → `saveRules` + `applyRulesChange` + re-apply iOS shield monitoring |
| Kids `profiles.tsx` | List; add (max 4); edit nickname, avatar, age band; delete (two confirmations, deletes art folder); per-kid Trash: view, restore, empty |
| Art & sharing | Backup toggle (sync consent screen first, A3 sync rules); Family Gallery (A7); Print stickers; Stories (print book, delete); delete custom colors |
| Magic settings | AI consent on/off (A7 consent screen); "Use nickname in stories" toggle (default off); today's Magic uses per feature (from `ai_usage`) |
| Device lock | Android: "Keep my child in the app" (pinning). iOS: Guided Access steps; "Extra iOS lock" (A4, only when flag on) |
| Account | Sign in / sign out (Supabase email magic link); change PIN; "Delete all data" (local + Supabase rows + storage; required by both stores); privacy policy and support links (external links allowed only here) |
| Subscription `subscription.tsx` | RevenueCat offerings (never hardcode prices): Free vs Family comparison, monthly / yearly buttons, Restore purchases, family sharing note |

**Free vs Family gating** (RevenueCat entitlement `family`; check with `Purchases.getCustomerInfo()`, cache result, re-check on app start and after purchase):

| Free | Family |
| --- | --- |
| Free Draw (crayon, marker, eraser, stamps), 10 coloring pages, Aquarium, Trace letters A–E, Mixing Lab, My Gallery, Sticker Book, full time lock + parent controls, 1 kid profile | Everything else in this tab, all brushes, all pages, up to 4 kids, backup, Family Gallery, printing |

AI Magic gating is separate and server-controlled (A7): free for every family while `ai_free_for_all = true`. Gated tiles show a small padlock; tapping goes Parent Gate → Subscription. Kids never see a price.

## Voice & spoken text (`src/services/voice.ts`)

`say(key)` plays `assets/voice/<key>.m4a` if the file exists; otherwise speaks the text for that key from `src/content/voiceLines.json` with `expo-speech` (rate 0.9, pitch 1.1). This lets every screen work before real recordings exist. Keys to create in `voiceLines.json`:

- `intro_<activity>` for every tile (≈25): e.g. `intro_draw` "Let's draw anything you like!"
- Mascot lines (≈20): `mascot_beautiful`, `mascot_sleepy`, `mascot_break`, `mascot_sleeping`, `mascot_full_colors`, `mascot_no_drawing_seen`, `mascot_ask_grownup`, and all AI messages from A7.
- `letter_<X>`, `number_<n>`, `shape_<id>` with their example words.
- `coach_<id>` (40, from A7), `idea_<n>` (30 daily ideas), `offscreen_<n>` (12 lock-screen ideas).
