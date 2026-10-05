// Lock check used at startup: loads the kid's saved lock state and runs one non-counting tick.
import { lockController } from '@/lock/lockRuntime';

// Returns whether the kid is currently locked.
export async function startupLockCheck(kidId: string): Promise<boolean> {
  try {
    return await lockController.start(kidId);
  } catch (e) {
    console.warn('[startup] lock check failed', e);
    return false;
  }
}
