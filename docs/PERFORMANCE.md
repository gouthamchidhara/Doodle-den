# Performance (T-101)

This build container has no devices, so the A5 targets could not be measured here. Run these on a budget Android tablet (e.g. Galaxy Tab A8 / Fire HD 10) and an older iPad (9th gen) with a **preview** build (`eas build -p all --profile preview`) and fill in the table.

| Scenario | Target (A5) | Android tablet | Older iPad |
| --- | --- | --- | --- |
| Free Draw: 60 fps while drawing, 500+ strokes | 60 fps, no visible lag | | |
| Coloring tap-fill (1024 px page) | fill shows < 150 ms | | |
| Worlds: 20 creatures moving | ≥ 50 fps | | |
| Museum show | smooth fades, no stutter | | |
| Cold start to Home | < 3 s | | |
| Save artwork (PNG + thumb) | < 1 s | | |

What is already built for speed: strokes are recorded to a Skia picture and replayed (not re-rendered per point), coloring fill runs on a typed array with a scanline flood fill (tested), thumbnails are 400 px, world sprites use Reanimated on the UI thread, sounds are preloaded at start.

If a target is missed: profile with the React Native perf monitor first, then lower the canvas resolution on devices with < 3 GB RAM.
