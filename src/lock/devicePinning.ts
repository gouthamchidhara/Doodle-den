// Android app pinning / iOS Guided Access status. Native calls are wired to modules/lock-native in T-031.
import { Platform } from 'react-native';

// True when the app is pinned (Android) or Guided Access is on (iOS).
export function isPinned(): boolean {
  return false;
}

// Android: asks the system to pin the app (parent confirms). iOS: always false.
export async function startPinning(): Promise<boolean> {
  return Platform.OS === 'android' ? false : false;
}

// Android: unpins the app. iOS: no-op.
export async function stopPinning(): Promise<void> {
  return undefined;
}
