// iOS Screen Time shield (A4), only when EXPO_PUBLIC_IOS_SCREEN_TIME is 'true'. The in-app lock stays the main lock.
import { Platform } from 'react-native';

import { hexToRgb } from '@/canvas/color';
import { getMeta, setMeta } from '@/db/repositories/metaRepo';
import { colors } from '@/theme/tokens';
import type { TimeRules } from '@/types/models';
import { parseHHMM } from '@/utils/time';

type DeviceActivity = typeof import('react-native-device-activity');

export const SELECTION_ID = 'dd.selection';
export const DAILY = 'dd.daily';
export const BEDTIME = 'dd.bedtime';
export const GRACE = 'dd.grace';
export const LIMIT_EVENT = 'dd.limit';
export const GRACE_MS = 120_000;
const GRACE_WINDOW_MS = 16 * 60_000; // Apple needs ≥15 min intervals; the shield returns at its start.
const META_ON = 'ios_screen_time_on';
const SELECTION = { activitySelectionId: SELECTION_ID };

// True when the build flag is on and the device is iOS.
export function isScreenTimeEnabled(): boolean {
  return Platform.OS === 'ios' && process.env.EXPO_PUBLIC_IOS_SCREEN_TIME === 'true';
}

// Loads the library only when the flag is on (nothing runs otherwise).
function lib(): DeviceActivity | null {
  if (!isScreenTimeEnabled()) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const m = require('react-native-device-activity') as DeviceActivity;
    return m.isAvailable() ? m : null;
  } catch (e) {
    console.warn('[screenTime] library unavailable', e);
    return null;
  }
}

// Runs a library call, logging failures.
function safely(label: string, fn: (m: DeviceActivity) => void): void {
  const m = lib();
  if (!m) return;
  try {
    fn(m);
  } catch (e) {
    console.warn(`[screenTime] ${label} failed`, e);
  }
}

const rgb = (hex: string) => {
  const [red, green, blue] = hexToRgb(hex);
  return { red, green, blue };
};

// Threshold for the daily usage event: dailyLimitMin + extra today.
export function dailyThreshold(rules: TimeRules, extraTodaySec: number): { hour: number; minute: number } {
  const total = Math.max(1, Math.round(rules.dailyLimitMin + extraTodaySec / 60));
  return { hour: Math.floor(total / 60), minute: total % 60 };
}

// Hour/minute components for 'HH:MM'.
export function hhmmComponents(hhmm: string): { hour: number; minute: number } {
  const m = parseHHMM(hhmm);
  return { hour: Math.floor(m / 60), minute: m % 60 };
}

// Whether the parent turned the extra lock on.
export async function isScreenTimeOn(): Promise<boolean> {
  return isScreenTimeEnabled() && (await getMeta(META_ON)) === 'true';
}

// Asks for Screen Time permission (owner's Face ID / passcode). Resolves true when approved.
export async function requestScreenTimeAuth(): Promise<boolean> {
  const m = lib();
  if (!m) return false;
  try {
    await m.requestAuthorization('individual');
    return m.getAuthorizationStatus() === 2;
  } catch (e) {
    console.warn('[screenTime] authorization failed', e);
    return false;
  }
}

// The system app picker component (persists the selection natively under SELECTION_ID); null when off.
export function selectionSheet(): DeviceActivity['DeviceActivitySelectionSheetViewPersisted'] | null {
  return lib()?.DeviceActivitySelectionSheetViewPersisted ?? null;
}

// True when the parent picked Doodle Den in the system app picker.
export function hasSelection(): boolean {
  const m = lib();
  return !!m && !!m.getFamilyActivitySelectionId(SELECTION_ID);
}

// Night shield with "OK" and "Grown-up unlock" (2-minute grace, then the shield returns).
function configureShield(m: DeviceActivity): void {
  m.updateShield(
    {
      backgroundColor: rgb(colors.night),
      title: 'The crayons are sleeping',
      titleColor: rgb(colors.white),
      subtitle: 'Ask a grown-up',
      subtitleColor: rgb(colors.nightText),
      primaryButtonLabel: 'OK',
      primaryButtonLabelColor: rgb(colors.ink),
      primaryButtonBackgroundColor: rgb(colors.moon),
      secondaryButtonLabel: 'Grown-up unlock',
      secondaryButtonLabelColor: rgb(colors.nightText),
    },
    {
      primary: { behavior: 'close' },
      secondary: {
        behavior: 'defer',
        actions: [
          { type: 'unblockSelection', familyActivitySelectionId: SELECTION_ID },
          { type: 'startMonitoring', activityName: GRACE, deviceActivityEvents: [], intervalStartDelayMs: GRACE_MS, intervalEndDelayMs: GRACE_MS + GRACE_WINDOW_MS },
        ],
      },
    },
  );
  m.configureActions({ activityName: GRACE, callbackName: 'intervalDidStart', actions: [{ type: 'blockSelection', familyActivitySelectionId: SELECTION_ID }] });
}

// (Re)starts dd.daily and dd.bedtime for the rules; call after setup and whenever rules or extra time change.
export async function applyScreenTimeMonitoring(rules: TimeRules, extraTodaySec: number): Promise<void> {
  if (!(await isScreenTimeOn())) return;
  const m = lib();
  if (!m) return;
  const token = m.getFamilyActivitySelectionId(SELECTION_ID);
  if (!token) return;
  try {
    m.stopMonitoring([DAILY, BEDTIME]);
    configureShield(m);
    const block = [{ type: 'blockSelection' as const, familyActivitySelectionId: SELECTION_ID }];
    const unblock = [{ type: 'unblockSelection' as const, familyActivitySelectionId: SELECTION_ID }];
    m.configureActions({ activityName: DAILY, callbackName: 'eventDidReachThreshold', eventName: LIMIT_EVENT, actions: block });
    m.configureActions({ activityName: DAILY, callbackName: 'intervalDidStart', actions: unblock });
    await m.startMonitoring(DAILY, { intervalStart: { hour: 0, minute: 0 }, intervalEnd: { hour: 23, minute: 59 }, repeats: true }, [
      { familyActivitySelection: token, threshold: dailyThreshold(rules, extraTodaySec), eventName: LIMIT_EVENT },
    ]);
    if (rules.bedtimeEnabled) {
      m.configureActions({ activityName: BEDTIME, callbackName: 'intervalDidStart', actions: block });
      m.configureActions({ activityName: BEDTIME, callbackName: 'intervalDidEnd', actions: unblock });
      await m.startMonitoring(BEDTIME, { intervalStart: hhmmComponents(rules.bedtimeStart), intervalEnd: hhmmComponents(rules.bedtimeEnd), repeats: true }, []);
    }
  } catch (e) {
    console.warn('[screenTime] monitoring failed', e);
  }
}

// Turns the extra lock on (after auth + selection) and starts monitoring.
export async function enableScreenTime(rules: TimeRules, extraTodaySec: number): Promise<boolean> {
  if (!hasSelection()) return false;
  await setMeta(META_ON, 'true');
  await applyScreenTimeMonitoring(rules, extraTodaySec);
  return true;
}

// Parent turned the setting off: stop all monitoring and remove the shield.
export async function disableScreenTime(): Promise<void> {
  await setMeta(META_ON, 'false');
  safely('disable', (m) => {
    m.stopMonitoring([DAILY, BEDTIME, GRACE]);
    m.unblockSelection(SELECTION);
  });
}

// Engine LOCK → shield right away.
export function shieldNow(): void {
  safely('shield', (m) => m.blockSelection(SELECTION));
}

// Engine UNLOCK or parent unlock → remove the shield and cancel any grace re-shield.
export function removeShield(): void {
  safely('unshield', (m) => {
    m.stopMonitoring([GRACE]);
    m.unblockSelection(SELECTION);
  });
}
