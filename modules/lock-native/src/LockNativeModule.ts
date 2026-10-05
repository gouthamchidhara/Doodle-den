// Native binding; null in Jest, Expo Go and web so callers can fall back.
import { requireOptionalNativeModule } from 'expo-modules-core';

export interface LockNativeModuleType {
  getUptimeMs(): number;
  getBootId(): string;
  isPinned(): boolean;
  startPinning(): Promise<boolean>;
  stopPinning(): Promise<void>;
}

export const LockNative = requireOptionalNativeModule<LockNativeModuleType>('LockNative');
