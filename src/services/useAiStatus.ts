// Magic (AI) availability for dimming tiles. Real checks land in T-078.
export interface AiStatus {
  online: boolean;
  consented: boolean;
  signedIn: boolean;
}

// Returns online / consent / sign-in status.
export function useAiStatus(): AiStatus {
  return { online: true, consented: false, signedIn: false };
}
