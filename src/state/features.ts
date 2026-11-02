// Built-feature flags: gallery buttons and tiles for later tickets stay hidden until their ticket ships (A6 T-047).
// T-096 adds Free vs Family gating next to this map.
export const FEATURES = {
  magicSketch: false, // T-081
  stickers: false, // T-059
  voices: false, // T-055
  worlds: true, // T-050–T-053
} as const;

export type FeatureKey = keyof typeof FEATURES;

// True when the feature's ticket is done.
export function isFeatureOn(key: FeatureKey): boolean {
  return FEATURES[key];
}
