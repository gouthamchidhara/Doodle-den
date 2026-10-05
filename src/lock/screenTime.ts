// iOS Screen Time shield (A4), only when EXPO_PUBLIC_IOS_SCREEN_TIME is 'true'. Filled in by T-037.
import { Platform } from 'react-native';

// True when the build flag is on and the device is iOS.
export function isScreenTimeEnabled(): boolean {
  return Platform.OS === 'ios' && process.env.EXPO_PUBLIC_IOS_SCREEN_TIME === 'true';
}
