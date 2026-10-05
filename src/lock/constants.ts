// Lock system numbers (A4, copied exactly).
export const TICK_INTERVAL_MS = 1000;
export const MAX_TICK_DELTA_SEC = 5;          // never count more than 5 s from one tick
export const PERSIST_EVERY_SEC = 15;          // save state to secure-store at least this often
export const WARN_5_SEC = 300;
export const WARN_1_SEC = 60;
export const SESSION_GAP_SEC = 600;           // away 10+ min => next play is a new session
export const CLOCK_TOLERANCE_MS = 120_000;    // 2 min of clock drift allowed
export const AUTOSAVE_TIMEOUT_MS = 1500;      // wait max this long for drawing save before locking
export const SERVER_SYNC_EVERY_MS = 600_000;  // re-check server time every 10 min when online
