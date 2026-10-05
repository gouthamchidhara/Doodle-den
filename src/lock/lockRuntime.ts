// The app-wide LockController instance; LockGate installs the navigation effects.
import { saveAllOpenDrawings } from '@/state/canvasStore';

import { LockController } from './lockController';

export const lockController = new LockController({
  autosave: saveAllOpenDrawings,
  goLocked: () => undefined,
  goHome: () => undefined,
});
