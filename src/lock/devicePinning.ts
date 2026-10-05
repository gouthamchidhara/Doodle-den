// Android app pinning / iOS Guided Access status, backed by modules/lock-native.
import * as LockNative from '../../modules/lock-native';

// True when the app is pinned (Android) or Guided Access is on (iOS).
export function isPinned(): boolean {
  try {
    return LockNative.isPinned();
  } catch (e) {
    console.warn('[pinning] isPinned failed', e);
    return false;
  }
}

// Android: asks the system to pin the app (parent confirms). iOS: always false.
export async function startPinning(): Promise<boolean> {
  try {
    return await LockNative.startPinning();
  } catch (e) {
    console.warn('[pinning] start failed', e);
    return false;
  }
}

// Android: unpins the app. iOS: no-op.
export async function stopPinning(): Promise<void> {
  try {
    await LockNative.stopPinning();
  } catch (e) {
    console.warn('[pinning] stop failed', e);
  }
}
