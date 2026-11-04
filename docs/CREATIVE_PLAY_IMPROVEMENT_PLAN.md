# Creative Play and Parent Time Controls

Status: proposal for approval. Documentation only; no app changes authorized by this plan.

## Goal

Make the app useful and enjoyable for a four-year-old without reading, an account, AI, or a network connection. Children should quickly make something, see it respond, and choose what happens next. Parents should clearly see when time ends and have a reliable PIN-protected way to grant more time.

Success means independent creative play within a parent-chosen session, not longer screen time. No streaks, pressure timers, daily obligations, or endless rewards.

## Feedback and Evidence

Reported from device use: time expiry offers no obvious adult extension; Racetrack appears to be car coloring rather than play; local drawing choices feel thin; a four-year-old loses interest within five minutes. These observations are valid usability failures even where code already contains the intended feature.

| Area | Verified in repository | What still needs reproduction |
| --- | --- | --- |
| Time extension | [LockScreen](../src/screens/LockScreen.tsx) has a one-second hold control leading to Parent Gate. [UnlockSheet](../src/screens/lock/UnlockSheet.tsx) offers +15 minutes, +30 minutes, and End for today. | Whether the control is visible on the affected device; whether PIN return reliably opens the sheet. |
| Sheet return state | LockScreen initializes sheet visibility from the `unlock` route parameter and parent authorization in a state initializer. | Hypothesis: reusing the mounted screen after PIN entry leaves the sheet closed. Cheapest check: mount locked screen, complete gate, change route parameters without remounting, assert sheet opens. Also test a fresh mount. |
| Racetrack | [RacetrackScreen](../src/screens/kid/RacetrackScreen.tsx) implements a race, but disables Go! when no cars exist. [WorldScreen](../src/games/worlds/WorldScreen.tsx) offers Draw a new car. | Hypothesis: the empty-world creation funnel hides the play experience. Check a fresh local profile, then a profile with one saved car. This does not yet prove a motion or navigation bug. |
| Car creation | [WorldDrawScreen](../src/screens/kid/WorldDrawScreen.tsx) shows a ghost template, requires three strokes, then Send it!, then naming before entering the world. | Follow the full sequence on device; verify the saved car appears, moves, and can race after reopening. |
| Local breadth | [Coloring catalog](../src/content/coloringPages.json) contains cat, car, and fish only. [Content audit](CONTENT_TODO.md) records placeholder stamps, sounds, world scenes, and three guided lessons. | Review actual assets on device for appeal and quality, not just counts. Existing documents disagree on intended final counts; proposed targets below need approval. |
| AI prominence | [Activity catalog](../src/content/activities.ts) includes many local activities: Free Draw, Coloring, Kaleidoscope, Mixing Lab, Music Paint, and worlds. AI is not the whole architecture. | Check first-screen ordering, availability, and helper behavior with Magic disabled. Improve local depth and discovery rather than adding more menu tiles. |

## 1. Clear Time Expiry and Adult Extension

Priority: P0. Repair the existing flow before adding new time features.

### Proposed Experience

1. At expiry, save the current creation before showing the calm locked screen. Never show a saved confirmation until saving succeeds; handle save failure without silently losing work.
2. Show a short child-facing message such as "Time for a break" with an icon and optional voice. Explain the specific lock reason in the adult area.
3. Keep a clearly visible, reachable "Grown-up options" control on every supported screen size. It opens the existing parent gate, never grants time itself. Preserve required hold/PIN protections; avoid hiding the only route in crowded footer content.
4. After valid PIN entry, show extension choices reliably on both a fresh screen and a reused route. Existing +15/+30 choices are sufficient for the first repair. A shorter +5 option is a separate proposal requiring engine/type/spec changes.
5. Show which child receives the grant and how much additional playable time it permits. Offer "Keep locked" without changing rules. Keep "End for today" distinct from cancel.
6. Apply each confirmed grant once, persist it, then offer "Back to drawing" or Home. Resume the saved activity when supported; never discard unfinished art to navigate home.
7. When the added allowance ends, lock again. Keep configured daily/session rules unchanged and preserve actual usage history.

### Security and Time Semantics

- Reuse the lock controller/engine and persisted state; do not unlock by UI navigation alone.
- Enforce parent authorization at the command boundary, not just sheet visibility. A forged `unlock=1` parameter must not grant access or time.
- Reuse PIN retry limits. Cancel, expired authorization, app backgrounding, and repeated taps must not bypass the gate or duplicate grants.
- Specify grants against both session and daily limits so a parent-approved extension is not immediately blocked by the other exhausted limit. Test exact accounting without resetting usage.
- Keep session cooldown, daily limit, bedtime, and manual parent lock as distinct reasons. A break reminder alone is not a lock.
- For bedtime/manual locks, show the reason and require explicit adult confirmation for any override. Follow [A4 lock rules](spec/A4-lock-system.md); any changed override semantics require approval and updated tests first.
- This unlocks app play only. Do not promise to disable iOS Guided Access, OS Screen Time, or Android device restrictions.

### Acceptance

- Expire both 10-minute and 20-minute settings on a physical device. Parent can find the control, pass PIN, and add time without restarting the app.
- Test session-only expiry, daily-only expiry, simultaneous limits, cooldown expiry, bedtime, manual lock, and End for today.
- Wrong PIN, direct navigation, stale authorization, and child taps cannot extend time. PIN success opens the options exactly once; repeated confirmation cannot double-grant.
- Grant survives app restart without replaying or replenishing consumed time. Reboot, midnight, clock changes, and offline use preserve documented lock behavior.
- Drawing survives lock, cancel, extension, backgrounding, and resume. Phone safe areas, larger text, and landscape tablets never hide the adult control.

## 2. Racetrack Must Start With Play

Priority: P0. Deliver a small complete play loop, not a larger game engine.

### First Release

- Opening Racetrack on a fresh profile shows a local sample car already driving. Go! works immediately. Sample content must not create fake child artwork or achievements.
- Provide two clear actions: race with the current car and draw a car. Drawing remains optional, not a prerequisite for discovering the activity.
- A tap on a car gives immediate visible feedback, with optional sound. Keep the existing path-following race and celebrate every finisher; no rankings or losing state.
- In car creation, offer blank drawing or an optional outline. Any nonempty doodle can become a car; replace the unexplained three-stroke threshold only after updating the world-draw spec. Keep an empty-canvas guard.
- Use a local suggested name; skip mandatory naming for Little mode. After sending, visibly place the child's car on the track and make the next action obvious with a short voice cue and flag icon.
- Preserve the car in the world album across restarts. Let children return to drawing or make another car without losing existing work.
- Handle save/export failure visibly and preserve the draft; never leave Send it! apparently doing nothing.

### Later, Only After First Loop Works

- Add three local track scenes and a small set of car shapes.
- Try one interaction at a time: a garage repaint action, movable cones, or a puddle that makes a splash. Validate usefulness before adding all three.
- Repainting must have an explicit save/copy policy so the original drawing is never silently overwritten.
- Defer freeform road building and advanced vehicle physics. Current path-following behavior is enough for the first repair.

### Acceptance

- Fresh profile, airplane mode, no AI consent: a car moves on entry and Go! starts a visible race without drawing first.
- A four-year-old can draw, send, and see their own car move without spelling a name or receiving adult directions after the initial demonstration.
- Existing and newly created cars appear consistently; Go! state and rendered world agree. Race completes, can run again, and does not continue consuming active timers after leaving.
- Check touch response, sound-off mode, Reduce Motion, restart persistence, and eight-car performance against the existing T-052 target.

## 3. Local Drawing Comes First

Priority: P1. Strengthen existing canvas and content systems instead of building another parallel drawing engine.

### Home and Drawing Entry

- Keep Free Draw prominent, with direct access to a blank canvas. Surface Continue Drawing for unfinished work.
- Give Little mode a small initial set of visual choices: blank drawing, local coloring, starter scene, and draw-to-play. Keep the rest reachable without overwhelming the first view.
- Use illustrated previews and actual saved art, not text-only choices or promotional AI examples. Pair short labels with familiar icons and optional voice.
- Starter scenes provide space to invent: an empty sky, a road, a garden, or an underwater background. Children can ignore prompts and draw freely.
- Make outline/background layers optional and separate from child strokes. Undo, clear, autosave, export, and resume must preserve the correct layers.
- Offer existing brushes, stamps, and colors progressively. Keep Little-mode controls large and few; preserve at least 64pt touch targets and labels of six words or fewer.

### Proposed Offline Content Targets

Counts describe final usable totals, not additional files promised by existing tickets. Licensing and commercial availability need owner approval before production.

| Content | First useful pack | Expanded pack | Quality requirement |
| --- | --- | --- | --- |
| Coloring pages | 12 total, replacing or retaining the current 3 after review | 30 total | Broad closed regions; few tiny details; fill works on every page. |
| Open starter scenes | 6 | 12 | Large blank space; removable background; never a tracing obligation. |
| Finish-a-doodle prompts | 6 | 12 | One local shape or partial picture with many valid outcomes. |
| Stamps | Review and finish the existing 20 | Expand only after testing | Recognizable previews, easy placement, no mandatory reward unlock. |
| World starter assets | At least one playable car; then fish and zoo creature | Small themed sets | Sample art clearly separate from the child's saved creations. |

Suggested coloring mix for 30 pages: 6 animals, 6 vehicles, 6 nature, 6 everyday objects, and 6 fantasy subjects. Include varied interests rather than gendered packs. Use original or properly licensed assets; avoid branded characters.

Suggested starter scenes: garden, ocean, space, town road, picnic, and playground. Suggested doodle seeds: turn circles into anything, finish a wiggly line, decorate an umbrella, add wheels, invent a flower, and fill an empty window.

Bundle the first pack locally with thumbnails. No download, login, AI quota, or purchase prompt may block the agreed core experience. Resolve Free/Family entitlement changes explicitly before implementation; do not silently remove current commercial rules.

### Content Pipeline

- Reuse existing catalog IDs, asset maps, canvas tools, and local repositories. Add metadata only where required for scenes/prompts.
- Maintain source/license provenance and age suitability for each asset. Validate missing IDs, duplicate IDs, missing files, thumbnail mappings, and category coverage.
- Standardize sizes and compression against the actual renderer; resolve conflicting dimensions in existing content notes before asset production.
- Test line-art fill boundaries, export quality, memory use, scrolling, and app package size on the lowest supported test device. Load full-resolution art only when opened.
- Acceptance: every first-pack item opens in airplane mode, accepts freehand marks, saves, and resumes correctly. No placeholder-only thumbnails or broken catalog entries.

## 4. More Creative Choices, Not More Screen-Time Pressure

Use existing activities to provide different kinds of agency. Implement the first two experiments after P0; defer the rest until observation shows a need.

| Experiment | Child action and response | Existing foundation |
| --- | --- | --- |
| Finish a doodle | Choose a small shape, invent the rest, keep or start another. No correct answer. | Free Draw plus local prompt pack. |
| Build a scene | Draw a garden, place stamps, move decorations, save the picture. | Canvas and stamp tools; movable-object editing needs separate scoping. |
| Draw and play | Scribble a car or creature, send it into a moving world, return to make another. | Existing world drawing and albums. |
| Paint a sound | Draw marks and hear notes, then replay the creation. | Existing Music Paint; polish its entry and local sound assets. |
| Mirror painting | Draw one line and see a symmetric pattern emerge. | Existing Kaleidoscope; simple Little-mode defaults. |
| My picture puzzle | Turn a saved creation into a four-piece puzzle. | Existing Jigsaw; verify Little-mode entry. |

Allow stopping after any creation. Do not use engagement rewards to compete with the time limit. Do not automatically start another activity when a session ends.

## 5. AI Is Optional Enrichment

- Keep Magic available as a separate, parent-enabled option, not the default route to coloring pages or creative ideas.
- Local drawing, worlds, prompts, and positive feedback work with Magic disabled. Audit in-canvas helpers as well as dedicated Magic screens.
- AI failures, missing keys, exhausted quotas, or no connection must never block saving, drawing, or playing. Offer a local alternative without suggesting it is AI-generated.
- Do not send child art, voice, or identifying data without the applicable parental consent. Verify provider privacy, retention, and moderation requirements before enabling live child-data flows.
- Provider changes and backend deployment are outside this improvement slice. No claim that current AI adapters are production-verified.

## Delivery Order

Proposed follow-up work under T-105 beta fixes, not newly approved A6 tickets. After approval, update the affected A4/A5/A6 sections and assign small scoped tickets in this order. Work one ticket at a time; split content work into manageable batches.

| Order | Work | Existing anchors | Exit condition |
| --- | --- | --- | --- |
| 1 | Reproduce and repair adult extension | T-013, T-030, T-033, T-035, T-091 | Route regression tests, exact grant accounting, physical-device expiry and PIN checks pass. |
| 2 | Repair Racetrack first-use and creation handoff | T-050, T-052 | Fresh profile can race; child's creation reaches the track and survives restart. |
| 3 | Ship first local pack and drawing entry improvements | T-014, T-025, T-040, T-041, T-103 | 12 usable pages, 6 scenes, 6 prompts, reviewed stamp set; offline save/resume checks pass. |
| 4 | Test first two creative-play experiments | T-023, T-025; new scope where needed | Child can choose, create, and change their creation with minimal help. |
| 5 | Expand content and polish proven activities | T-044, T-045, T-048, T-051, T-053, T-057, T-058 | Expansion follows observed preferences, not menu count. Guided Drawing remains Big-only unless explicitly redesigned. |
| 6 | Device/accessibility/content review, then beta release | T-100, T-101, T-102, T-104, T-105 | Release gates pass; owner reviews on-device experience before another upload. |

For every implementation ticket: run `npx tsc --noEmit`, `npx expo lint`, and `npx jest`; complete the A1 definition of done and A6 review step, then update [progress](PROGRESS.md). Add focused tests to existing suites before broader validation. No new dependency is expected for P0; any later package must follow the A1 allowlist and Expo installation rule.

## Device and Family Validation

- Test fresh and existing profiles on an iPad, a small iPhone, and a budget Android tablet; include airplane mode, sound off, larger text, and Reduce Motion.
- Use deterministic clock tests for edge cases, plus real 10-minute and 20-minute expiry runs on device. Mocking navigation alone does not validate gate behavior or footer visibility.
- Observe short, parent-supervised sessions with the four-year-old and, where practical, a few other children aged 3-5. No pressure to continue; no recording or telemetry required.
- Ask: Can the child make a mark within two taps of choosing Draw? Can they cause a visible response immediately in Racetrack? Can they find their saved creation? Can the parent extend time without instructions?
- Note confusion, adult interventions, lost work, and chosen activities locally. Treat voluntary exploration as useful evidence, not a requirement to remain engaged for a fixed duration.
- Release blockers: any child bypass, lost artwork, invisible adult control, empty/dead Racetrack first-use, or broken first-pack asset.

## Approval Decisions

Recommended next scope: adult extension repair and playable Racetrack first, followed by the first offline content pack. Preserve +15/+30 initially; consider +5 only after the current flow works.

Before implementation, approve the new starter-car/optional-template flow, content targets and Free/Family availability, and any bedtime-override behavior change. Decide who supplies and reviews final artwork. This document approves neither app code changes nor another build/upload.