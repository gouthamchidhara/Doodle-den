// Shared data model types (A3, copied exactly).
export type AgeMode = 'little' | 'big';          // little = 3–5, big = 6–8
export type BrushType = 'crayon' | 'marker' | 'watercolor' | 'glitter' | 'neon' | 'eraser' | 'stamp';
export type PaletteKey = 'tomato' | 'orange' | 'sun' | 'leaf' | 'sky' | 'grape' | 'pink' | 'brown' | 'black' | 'white';
export type ActivityKey = 'draw' | 'coloring' | 'guided' | 'kaleidoscope' | 'flipbook_frame' | 'paper' | 'world' | 'ramps' | 'music' | 'jigsaw' | 'arwall' | 'trace' | 'mixing' | 'magic' | 'story';

export interface KidProfile {
  id: string;              // uuid
  nickname: string;        // max 12 chars, NOT a real full name
  avatarId: string;        // one of the built-in avatar ids
  ageMode: AgeMode;
  createdAt: number;       // epoch ms
}

export interface TimeRules {
  kidId: string;
  dailyLimitMin: number;           // default 45, allowed 10–180 step 5
  sessionLimitMin: number;         // default 20, allowed 5–120 step 5, must be <= dailyLimitMin
  cooldownMin: number;             // default 30, allowed 0–240 step 15
  bedtimeEnabled: boolean;         // default true
  bedtimeStart: string;            // 'HH:MM' 24h, default '19:30'
  bedtimeEnd: string;              // 'HH:MM' 24h, default '07:00'
  breakReminderMin: number | null; // default null (off); options 15, 20, 30
  finishDrawingExtensionSec: number; // default 120
  maxExtensionsPerSession: number;   // default 1
}

export interface UsageDay {
  kidId: string;
  dayKey: string;          // 'YYYY-MM-DD' local date
  usedSec: number;
  sessions: number;
  extensionsUsed: number;
  perActivitySec: Partial<Record<ActivityKey, number>>;
}

export interface StrokePoint { x: number; y: number; p: number; t: number } // x,y normalized 0..1; p pressure 0..1; t ms since stroke start

export interface Stroke {
  id: string;
  tool: BrushType;
  color: PaletteKey | 'rainbow' | string; // string = custom hex from Name Your Colors
  size: 'S' | 'M' | 'L';
  stampId?: string;        // only when tool = 'stamp'
  points: StrokePoint[];
}

export interface StrokeDoc {
  version: 1;
  aspect: number;          // canvas width / height when drawn
  background: PaletteKey | 'white';
  strokes: Stroke[];
}

export interface Artwork {
  id: string;
  kidId: string;
  activity: ActivityKey;
  title: string | null;    // optional, set by kid voice/picker later
  pngPath: string;         // relative to Paths.document
  thumbPath: string;       // 400 px long edge
  strokesPath: string | null; // null for coloring tap-fill pages
  durationSec: number;
  createdAt: number;
  updatedAt: number;
  isFavorite: boolean;
  isSticker: boolean;      // true if turned into a sticker (Stickers From My Art)
  trashedAt: number | null; // kid can trash; only parent empties trash
}

export interface Progress { kidId: string; skill: string; level: number; updatedAt: number } // skill e.g. 'trace_A', 'color_purple'

export interface RewardEarned { kidId: string; rewardId: string; earnedAt: number }

export interface CustomColor { id: string; kidId: string; hex: string; name: string; createdAt: number }
