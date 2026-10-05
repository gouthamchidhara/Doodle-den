// Kid Home catalog: every activity tile, its shelf, tint, route and illustration (A5 Kid Home).
import type { ComponentType } from 'react';

import type { TintKey } from '@/components/kid/ActivityTile';
import { AquariumArt } from '@/components/kid/icons/AquariumArt';
import { ArWallArt } from '@/components/kid/icons/ArWallArt';
import { ColoringArt } from '@/components/kid/icons/ColoringArt';
import { ColoringMakerArt } from '@/components/kid/icons/ColoringMakerArt';
import { FlipbookArt } from '@/components/kid/icons/FlipbookArt';
import { FreeDrawArt } from '@/components/kid/icons/FreeDrawArt';
import { GalleryArt } from '@/components/kid/icons/GalleryArt';
import { GuidedArt } from '@/components/kid/icons/GuidedArt';
import type { IconProps } from '@/components/kid/icons/IconProps';
import { JigsawArt } from '@/components/kid/icons/JigsawArt';
import { KaleidoscopeArt } from '@/components/kid/icons/KaleidoscopeArt';
import { MagicSketchArt } from '@/components/kid/icons/MagicSketchArt';
import { MixingArt } from '@/components/kid/icons/MixingArt';
import { MuseumArt } from '@/components/kid/icons/MuseumArt';
import { MusicArt } from '@/components/kid/icons/MusicArt';
import { PaperArt } from '@/components/kid/icons/PaperArt';
import { RacetrackArt } from '@/components/kid/icons/RacetrackArt';
import { RampsArt } from '@/components/kid/icons/RampsArt';
import { ShelfDrawArt } from '@/components/kid/icons/ShelfDrawArt';
import { ShelfLearnArt } from '@/components/kid/icons/ShelfLearnArt';
import { ShelfMagicArt } from '@/components/kid/icons/ShelfMagicArt';
import { ShelfPlayArt } from '@/components/kid/icons/ShelfPlayArt';
import { ShelfStuffArt } from '@/components/kid/icons/ShelfStuffArt';
import { StickerBookArt } from '@/components/kid/icons/StickerBookArt';
import { StoriesArt } from '@/components/kid/icons/StoriesArt';
import { StoryMakerArt } from '@/components/kid/icons/StoryMakerArt';
import { TraceArt } from '@/components/kid/icons/TraceArt';
import { ZooArt } from '@/components/kid/icons/ZooArt';
import type { AgeMode } from '@/types/models';

export type ShelfKey = 'draw' | 'play' | 'learn' | 'magic' | 'stuff';

export type TileKey =
  | 'draw' | 'coloring' | 'guided' | 'kaleidoscope' | 'flipbook' | 'paper'
  | 'aquarium' | 'racetrack' | 'zoo' | 'ramps' | 'music' | 'jigsaw' | 'arwall'
  | 'trace' | 'mixing'
  | 'coloring_maker' | 'magic_sketch' | 'story_maker'
  | 'gallery' | 'stories' | 'museum' | 'stickers';

export interface TileDef {
  key: TileKey;
  title: string;
  shelf: ShelfKey;
  tint: TintKey;
  route: string;
  Art: ComponentType<IconProps>;
  bigOnly?: boolean;
  needsAr?: boolean;
  magic?: boolean;
}

export interface ShelfDef {
  key: ShelfKey;
  title: string;
  tint: TintKey;
  Art: ComponentType<IconProps>;
  voice: string;
}

export const SHELVES: ShelfDef[] = [
  { key: 'draw', title: 'Draw', tint: 'tomato', Art: ShelfDrawArt, voice: 'shelf_draw' },
  { key: 'play', title: 'Play', tint: 'sky', Art: ShelfPlayArt, voice: 'shelf_play' },
  { key: 'learn', title: 'Learn', tint: 'leaf', Art: ShelfLearnArt, voice: 'shelf_learn' },
  { key: 'magic', title: 'Magic', tint: 'grape', Art: ShelfMagicArt, voice: 'shelf_magic' },
  { key: 'stuff', title: 'My Stuff', tint: 'sun', Art: ShelfStuffArt, voice: 'shelf_stuff' },
];

export const TILES: TileDef[] = [
  { key: 'draw', title: 'Free Draw', shelf: 'draw', tint: 'tomato', route: '/draw', Art: FreeDrawArt },
  { key: 'coloring', title: 'Coloring', shelf: 'draw', tint: 'sun', route: '/coloring', Art: ColoringArt },
  { key: 'guided', title: 'Guided Drawing', shelf: 'draw', tint: 'grape', route: '/guided', Art: GuidedArt, bigOnly: true },
  { key: 'kaleidoscope', title: 'Kaleidoscope', shelf: 'draw', tint: 'pink', route: '/kaleidoscope', Art: KaleidoscopeArt },
  { key: 'flipbook', title: 'Flipbook', shelf: 'draw', tint: 'sky', route: '/flipbook', Art: FlipbookArt, bigOnly: true },
  { key: 'paper', title: 'Paper Comes Alive', shelf: 'draw', tint: 'orange', route: '/paper', Art: PaperArt },
  { key: 'aquarium', title: 'Aquarium', shelf: 'play', tint: 'sky', route: '/aquarium', Art: AquariumArt },
  { key: 'racetrack', title: 'Racetrack', shelf: 'play', tint: 'tomato', route: '/racetrack', Art: RacetrackArt },
  { key: 'zoo', title: 'Zoo', shelf: 'play', tint: 'leaf', route: '/zoo', Art: ZooArt },
  { key: 'ramps', title: 'Ramps & Rollers', shelf: 'play', tint: 'orange', route: '/ramps', Art: RampsArt },
  { key: 'music', title: 'Music Paint', shelf: 'play', tint: 'grape', route: '/music', Art: MusicArt },
  { key: 'jigsaw', title: 'Jigsaw', shelf: 'play', tint: 'pink', route: '/jigsaw', Art: JigsawArt },
  { key: 'arwall', title: 'AR Wall', shelf: 'play', tint: 'navy', route: '/arwall', Art: ArWallArt, bigOnly: true, needsAr: true },
  { key: 'trace', title: 'Trace & Learn', shelf: 'learn', tint: 'leaf', route: '/trace', Art: TraceArt },
  { key: 'mixing', title: 'Mixing Lab', shelf: 'learn', tint: 'grape', route: '/mixing-lab', Art: MixingArt },
  { key: 'coloring_maker', title: 'Page Maker', shelf: 'magic', tint: 'grape', route: '/magic/coloring-maker', Art: ColoringMakerArt, magic: true },
  { key: 'magic_sketch', title: 'Magic Sketch', shelf: 'magic', tint: 'pink', route: '/magic/sketch', Art: MagicSketchArt, magic: true },
  { key: 'story_maker', title: 'Story Maker', shelf: 'magic', tint: 'sun', route: '/magic/story-maker', Art: StoryMakerArt, magic: true },
  { key: 'gallery', title: 'My Gallery', shelf: 'stuff', tint: 'navy', route: '/gallery', Art: GalleryArt },
  { key: 'stories', title: 'Stories', shelf: 'stuff', tint: 'sun', route: '/stories', Art: StoriesArt },
  { key: 'museum', title: 'Museum Night', shelf: 'stuff', tint: 'grape', route: '/museum', Art: MuseumArt },
  { key: 'stickers', title: 'Sticker Book', shelf: 'stuff', tint: 'orange', route: '/stickers', Art: StickerBookArt },
];

// Voice key for a tile's intro prompt.
export function introVoiceKey(key: TileKey): string {
  return `intro_${key}`;
}

// Tiles shown on a shelf for an age mode (Little hides Big-only; AR only when supported).
export function visibleTiles(shelf: ShelfKey, ageMode: AgeMode, opts: { arSupported: boolean }): TileDef[] {
  return TILES.filter((t) => t.shelf === shelf && (ageMode === 'big' || !t.bigOnly) && (!t.needsAr || opts.arSupported));
}

// Route for an activity key used by daily ideas.
export function routeForActivity(activity: string): string {
  return TILES.find((t) => t.key === activity)?.route ?? '/draw';
}

// Narrows a stored string to a shelf key (default Draw).
export function toShelfKey(v: string | null): ShelfKey {
  return SHELVES.some((s) => s.key === v) ? (v as ShelfKey) : 'draw';
}
