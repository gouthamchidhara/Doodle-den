# A2 · Design tokens & components

Copy the `tokens.ts` file below exactly into `src/theme/tokens.ts`. Every color, font, size and radius in the app must come from it. The values match the approved mockups on the "Doodle Den — App Screens" design canvas.

## Look in one sentence

Calm, bright, hand-made: mint-paper background, navy ink, chunky rounded shapes with thick borders, soft pastel tiles with one saturated drawing each. No gradients (except the rainbow color dot), no shadows, no emoji.

## `src/theme/tokens.ts` (copy exactly)

```ts
// All design values for Doodle Den. Never type hex colors anywhere else.
export const colors = {
  // grounds
  bgKid: '#EEF6F0',        // mint paper, kid screens
  bgParent: '#F5F7FA',     // parent screens
  surface: '#FFFFFF',
  surfaceMuted: '#F4F7F5', // unselected tool button
  // ink
  ink: '#1F2A44',          // main text + outlines
  inkMuted: '#4A5570',     // secondary text
  link: '#2F6FB5',         // parent screens only
  // borders
  borderSoft: '#D8F1E2',   // kid panels, time pill
  borderNeutral: '#C9D2E3',// icon buttons
  borderParent: '#E1E5EE',
  dividerParent: '#EEF1F5',
  // brand paints (also the drawing palette)
  tomato: '#EE5A36',
  sun: '#FFB81C',
  sky: '#3B8FE0',
  leaf: '#3BAA6A',
  grape: '#8A5CD6',
  pink: '#E8559A',
  orange: '#F58A2B',
  brown: '#9A6A45',
  black: '#1F2A44',
  white: '#FFFFFF',
  // pastel tile fills + their borders
  tint: {
    tomato: { fill: '#FFE0D6', border: '#F9C2B1' },
    sun:    { fill: '#FFF0C7', border: '#FFDD85' },
    sky:    { fill: '#DCEBFB', border: '#B5D3F5' },
    leaf:   { fill: '#D8F1E2', border: '#A9DFBF' },
    grape:  { fill: '#EBE1FA', border: '#D2BFF3' },
    pink:   { fill: '#FCDDEB', border: '#F5B5D2' },
    navy:   { fill: '#E1E5EE', border: '#C9D2E3' },
    orange: { fill: '#FFE6D0', border: '#FBC79A' },
  },
  // lock screen (night)
  night: '#1F2A44',
  nightRaised: '#2B3A5C',
  nightText: '#D5DCEB',
  nightMuted: '#AEB8CF',
  nightBorder: '#5A6A8E',
  moon: '#FFE7A3',
  // aquarium
  water: '#2F7FCF',
  waterLight: '#5BA5EE',
  sand: '#E9C98B',
  // parent charts
  chartBar: '#B5D3F5',
  chartBarToday: '#3B8FE0',
  chartTrack: '#E1E5EE',
} as const;

export const drawingPalette = [
  'tomato', 'orange', 'sun', 'leaf', 'sky', 'grape', 'pink', 'brown', 'black', 'white',
] as const; // + a special 'rainbow' brush color handled in canvas code

export const fonts = {
  display: 'Fredoka_600SemiBold',   // kid titles, tile labels, big buttons
  displayMedium: 'Fredoka_500Medium', // speech bubbles
  body: 'Nunito_700Bold',
  bodySemi: 'Nunito_600SemiBold',
  bodyHeavy: 'Nunito_800ExtraBold', // pills, labels
} as const;

export const fontSize = {
  kidHero: 52,     // lock screen headline
  tileLabel: 30,   // activity tile label (tablet)
  title: 26,       // screen titles, "Hi, Mia!"
  button: 24,      // primary button text
  bubble: 22,      // mascot speech bubble
  body: 18,
  label: 15,
  caption: 13,
} as const;

export const radius = {
  tile: 36,
  panel: 30,
  button: 22,
  pill: 28,
  chip: 18,
  card: 22,        // parent cards
  round: 999,
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

export const border = { thin: 1, normal: 3, thick: 4, selected: 5 } as const;

export const touch = { little: 64, big: 56, parent: 44 } as const; // minimum touch sizes

export const breakpoints = { tabletMinShortSide: 600 } as const;

export const motion = {
  tapScale: 0.94,      // pressed scale for kid buttons
  tapMs: 120,
  tileEnterMs: 260,
  windDownDimMs: 2000, // sky dims over 2 s at warning
} as const;
```

## Breakpoints & layout

| Device class | Rule | Orientation | Kid grid | Canvas tool rail |
| --- | --- | --- | --- | --- |
| Tablet | shortest side ≥ 600 pt | Landscape | 4 columns × 2 rows of tiles | Left rail (tools) + right rail (size) + bottom palette |
| Phone | shortest side < 600 pt | Portrait | 2 columns, scrolls vertically | Bottom tray: tools row + colors row |

`src/theme/useLayout.ts` returns `{ isTablet: boolean, width: number, height: number, ageMode: 'little' | 'big' }`. Every screen uses this hook to choose layout. Never check `Platform.isPad`.

## Shared kid components (`src/components/kid/`)

| Component | Props | Look | States / behavior |
| --- | --- | --- | --- |
| `ActivityTile` | `title: string`, `tint: keyof colors.tint`, `icon: ReactNode`, `badge?: 'NEW'`, `locked?: boolean`, `onPress` | Fill `tint.fill`, 4 px border `tint.border`, radius 36, height 248 (tablet) / 180 (phone). Icon 120 px centered, label below in `fonts.display` 30 / 24 | Press: scale to 0.94 over 120 ms + haptic light + tap sound. `locked`: small padlock icon top-right; press opens Parent Gate (never a price) |
| `IconButton` | `icon`, `accessibilityLabel`, `onPress`, `size?: 64 \| 52` | White, 3 px `borderNeutral`, radius 22, icon 30 px `ink` | Same press feedback |
| `PrimaryButton` | `label`, `icon?`, `onPress`, `tone?: 'leaf' \| 'tomato'` | Height 64 (tablet) / 52 (phone), radius 22, fill `leaf`, white text `fonts.display` 24 | Used for "I'm done!" and "Draw a new fish" |
| `TimePill` | `minutesLeft: number` | White pill, 3 px `borderSoft`, sun icon, text `fonts.bodyHeavy` 18 "25 min of play left" | Under 5 min: text becomes "Getting sleepy…" and sun icon turns into moon. Never shows seconds. Never red |
| `ToolButton` | `tool: BrushType`, `selected: boolean`, `onPress` | 70×70 (tablet) / 54×54 (phone), radius 22. Unselected: fill `surfaceMuted`, no border. Selected: fill `tint.tomato.fill`, 4 px `tomato` border | Selecting plays a soft click |
| `ColorDot` | `color: PaletteKey \| 'rainbow'`, `selected`, `onPress` | Circle 56 (tablet) / 44 (phone). Unselected: 4 px white border. Selected: 5 px `ink` border | Rainbow uses a conic gradient (only allowed gradient) |
| `BrushSizeButton` | `size: 'S' \| 'M' \| 'L'`, `selected` | Circle 64, inner ink dot 10 / 22 / 36 px | Selected = tomato border + tomato tint fill |
| `Mascot` | `mood: 'idle' \| 'happy' \| 'sleepy' \| 'sleeping'`, `size` | Red crayon character, yellow tip, navy outline, two dot eyes, smile. Draw in Skia or SVG | idle: slow 2 s bob; happy: jump; sleepy: eyes half closed, yawn every 4 s; sleeping: eyes closed lines + "z z" floating |
| `SpeechBubble` | `text`, `voiceClip?` | White, 3 px `borderSoft`, radius 24, `fonts.displayMedium` 22 | Auto-plays `voiceClip` once when shown |
| `WindDownOverlay` | `stage: 'warn5' \| 'warn1'` | Banner at top: `tint.sun.fill` with 3 px `sun` border, mascot sleepy, text "Getting sleepy… finish your drawing soon!" | Does not block touches. Auto-hides after 6 s. Plays yawn sound |

## Shared parent components (`src/components/parent/`)

| Component | Props | Look |
| --- | --- | --- |
| `ParentCard` | `children`, `title?` | White, 1 px `borderParent`, radius 22, padding 18 |
| `SettingRow` | `label`, `value?`, `onPress?`, `toggle?: { value, onChange }` | Height 46, divider `dividerParent`, label `fonts.body` 15, value `fonts.bodyHeavy` 15 in `link` color with "›" |
| `StatRing` | `used: number`, `limit: number` | 88 px ring, 12 px stroke, track `chartTrack`, progress `leaf` |
| `WeekBars` | `days: { label: string; minutes: number; isToday: boolean }[]` | 7 bars, width 28, radius 8, color `chartBar`, today `chartBarToday`, max height 52 |
| `ParentButton` | `label`, `onPress`, `variant: 'primary' \| 'secondary'` | Height 48, radius 14, primary fill `ink` white text, secondary white with `borderNeutral` |

## Icons

Draw every UI icon and tile illustration with `react-native-svg` (`Svg`, `Path`, `Circle`, `Rect`), one component per icon in `src/components/kid/icons/` (e.g. `HomeIcon.tsx`, `UndoIcon.tsx`, `FishIcon.tsx`). Copy the shapes from the mockup artboards. Stroke width 3 for UI icons, 5 for tile illustrations, round caps and joins, `colors.ink` outlines. Never use emoji or an icon font. Use Skia only for the drawing canvas, aquarium and kaleidoscope, not for icons.

## Sounds (`assets/sounds/`, all `.m4a`, under 50 KB each)

`tap.m4a`, `tool-select.m4a`, `color-pick.m4a`, `undo.m4a`, `save-sparkle.m4a`, `yawn.m4a`, `bubble.m4a`, `new-color.m4a`, `star.m4a`, `sticker-earned.m4a`, `lullaby-loop.m4a` (lock screen, 20 s loop, volume 0.3). Voice prompts live in `assets/voice/` (tab A5 lists them). Until real audio exists, use short silent placeholder files with these exact names.
