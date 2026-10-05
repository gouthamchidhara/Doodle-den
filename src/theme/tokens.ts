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

// Added in build (not in A2): translucent ink layers for sheets and the wind-down dim.
export const overlays = {
  scrim: 'rgba(31, 42, 68, 0.45)',
  windDownDim: 'rgba(31, 42, 68, 0.10)',
} as const;
