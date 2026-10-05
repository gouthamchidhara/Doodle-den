// readClock() (A4 Clock rules): native uptime + boot id, device wall time, stored server offset.
import { getBootId, getUptimeMs } from '../../modules/lock-native';

import { getServerOffset } from './serverTime';
import type { ClockReading } from './types';

export { trustedWall } from './lockEngine';

// Current clock reading for tick().
export function readClock(): ClockReading {
  return { uptimeMs: getUptimeMs(), bootId: getBootId(), wallMs: Date.now(), serverOffsetMs: getServerOffset() };
}
