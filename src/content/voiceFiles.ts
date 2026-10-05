// Recorded voice prompts that exist in assets/voice/ (key -> require). Empty until real recordings arrive;
// voice.ts falls back to on-device speech for every missing key.
export const voiceFiles: Record<string, number> = {};
