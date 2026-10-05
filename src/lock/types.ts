// Lock system types (A4, copied exactly).
export type LockReason = 'none' | 'daily' | 'cooldown' | 'bedtime' | 'parent';

export type LockEvent =
  | 'SESSION_START'
  | 'WARN_5'        // 5 minutes left
  | 'WARN_1'        // 1 minute left
  | 'BREAK'         // optional stretch reminder
  | 'AUTOSAVE'      // save the drawing NOW, lock comes next
  | 'LOCK'
  | 'UNLOCK';

export interface ClockReading {
  uptimeMs: number;          // native monotonic clock, never goes backwards within one boot
  bootId: string;            // changes after every device reboot
  wallMs: number;            // Date.now()
  serverOffsetMs: number | null; // serverNow - Date.now(), null if never synced
}

export interface LockState {
  version: 1;
  kidId: string;
  dayKey: string;                 // 'YYYY-MM-DD' local, last day counted
  usedTodaySec: number;
  extraTodaySec: number;          // parent "+15 min" or finish-drawing grants today
  sessionActive: boolean;
  sessionUsedSec: number;
  extraSessionSec: number;
  extensionsThisSession: number;
  warned5: boolean;
  warned1: boolean;
  lastBreakAtSec: number;         // sessionUsedSec when last BREAK fired
  lock: { reason: LockReason; untilWallMs: number | null }; // null = until a parent unlocks
  lastTick: { uptimeMs: number; wallMs: number; bootId: string };
  maxWallSeenMs: number;          // highest believable wall time ever seen
}
