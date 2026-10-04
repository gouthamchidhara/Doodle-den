// Tablet vs phone layout hook (A2 Breakpoints). Never use Platform.isPad.
import { useWindowDimensions } from 'react-native';

import { useSessionStore } from '@/state/sessionStore';
import type { AgeMode } from '@/types/models';

import { breakpoints } from './tokens';

export interface Layout {
  isTablet: boolean;
  width: number;
  height: number;
  ageMode: AgeMode;
}

// True when the device's shortest side is at least the tablet breakpoint.
export function isTabletSize(width: number, height: number): boolean {
  return Math.min(width, height) >= breakpoints.tabletMinShortSide;
}

// Pure layout calculation, used by the hook and by tests.
export function computeLayout(width: number, height: number, ageMode: AgeMode): Layout {
  return { isTablet: isTabletSize(width, height), width, height, ageMode };
}

// Returns the current layout class, size and the active kid's age mode.
export function useLayout(): Layout {
  const { width, height } = useWindowDimensions();
  const ageMode = useSessionStore((s) => s.ageMode);
  return computeLayout(width, height, ageMode);
}
