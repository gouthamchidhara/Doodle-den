// lock-native JS API (A4 Native module). Falls back to JS values when the native module is missing (tests, web).
import { LockNative } from './src/LockNativeModule';

const fallbackStart = Date.now();

// Monotonic uptime in ms (never goes backwards within one boot).
export function getUptimeMs(): number {
  if (LockNative) return LockNative.getUptimeMs();
  return typeof performance !== 'undefined' ? performance.now() : Date.now() - fallbackStart;
}

// Id that changes after every device reboot.
export function getBootId(): string {
  return LockNative ? LockNative.getBootId() : 'no-native';
}

// Android: lock task active. iOS: Guided Access on.
export function isPinned(): boolean {
  return LockNative ? LockNative.isPinned() : false;
}

// Android: startLockTask() (system asks the parent to confirm). iOS: always false.
export async function startPinning(): Promise<boolean> {
  return LockNative ? LockNative.startPinning() : false;
}

// Android: stopLockTask(). iOS: no-op.
export async function stopPinning(): Promise<void> {
  if (LockNative) await LockNative.stopPinning();
}

// True when the real native module is linked.
export function hasNativeLock(): boolean {
  return LockNative !== null;
}
