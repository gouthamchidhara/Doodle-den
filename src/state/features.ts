// Built-feature flags (A6 T-047) and the Free vs Family gating map (A5, T-096).
import { initPurchases } from '@/services/purchases';

export const FEATURES = {
  magicSketch: true, // T-081
  stickers: true, // T-059
  voices: true, // T-055
  worlds: true, // T-050–T-053
} as const;

export type FeatureKey = keyof typeof FEATURES;

// True when the feature's ticket is done.
export function isFeatureOn(key: FeatureKey): boolean {
  return FEATURES[key];
}

// Home tiles that need the Family plan. Magic tiles are gated separately by the server (A7).
export const FAMILY_TILES: ReadonlySet<string> = new Set(['guided', 'kaleidoscope', 'flipbook', 'paper', 'racetrack', 'zoo', 'ramps', 'music', 'jigsaw', 'arwall', 'museum']);

// Parent features that need the Family plan.
export type FamilyFeature = 'extraKids' | 'backup' | 'familyGallery' | 'printing';

// True when a tile needs Family.
export function isFamilyTile(key: string): boolean {
  return FAMILY_TILES.has(key);
}

// Free coloring pages: the first 10 bundled pages (A5).
export const FREE_COLORING_PAGES = 10;

// True when a bundled coloring page needs Family (index in COLORING_PAGES order).
export function isFamilyColoringPage(index: number): boolean {
  return index >= FREE_COLORING_PAGES;
}

// Free trace items: letters A–E only (A5).
export function isFamilyTrace(kind: string, id: string): boolean {
  return !(kind === 'letter' && /^[A-E]$/i.test(id));
}

// Brushes on Free (A5): crayon, marker, eraser, stamps; the rest need Family.
export const FREE_BRUSHES: ReadonlySet<string> = new Set(['crayon', 'marker', 'eraser', 'stamp']);

// Free plan kid limit.
export const FREE_KIDS = 1;

// Gating applies only in builds with RevenueCat keys; without them everything stays open (dev / pre-launch).
export function paywallActive(): boolean {
  return initPurchases();
}
