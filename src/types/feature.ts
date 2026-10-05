// Types for v1 feature tables (A3 migration 2).
export type WorldKey = 'aquarium' | 'racetrack' | 'zoo' | 'arwall';
export type VoicePreset = 'normal' | 'chipmunk' | 'monster';
export type AiFeature = 'coloring_page' | 'magic_sketch' | 'story' | 'guess' | 'coach';

export interface WorldEntity {
  id: string;
  kidId: string;
  world: WorldKey;
  artworkId: string;
  name: string | null;
  voiceClipId: string | null;
  createdAt: number;
}

export interface VoiceClip {
  id: string;
  kidId: string;
  path: string;
  preset: VoicePreset;
  durationMs: number;
  createdAt: number;
}

export interface Flipbook {
  id: string;
  kidId: string;
  frameIds: string[];
  fps: 2 | 4 | 8;
  createdAt: number;
  updatedAt: number;
}

export interface MusicPaint {
  artworkId: string;
  notesPath: string;
}

export interface JigsawResult {
  kidId: string;
  artworkId: string;
  pieces: number;
  bestTimeSec: number;
  completedAt: number;
}

export interface MuseumExhibit {
  id: string;
  kidId: string;
  artworkIds: string[];
  createdAt: number;
}

export interface StoryPage {
  artIndex: number;
  text: string;
}

export interface Story {
  id: string;
  kidId: string;
  title: string;
  pages: StoryPage[];
  artworkIds: string[];
  createdAt: number;
}

export interface AiResult {
  id: string;
  kidId: string;
  feature: AiFeature;
  sourceArtworkId: string | null;
  outputArtworkId: string | null;
  createdAt: number;
}
