// Tests for the tablet/phone breakpoint (A2).
import { computeLayout, isTabletSize } from '@/theme/useLayout';

describe('useLayout breakpoint', () => {
  it('treats shortest side >= 600 as tablet', () => {
    expect(isTabletSize(1194, 834)).toBe(true);
    expect(isTabletSize(600, 960)).toBe(true);
  });
  it('treats shortest side < 600 as phone', () => {
    expect(isTabletSize(390, 844)).toBe(false);
    expect(isTabletSize(844, 390)).toBe(false);
    expect(isTabletSize(599, 1200)).toBe(false);
  });
  it('passes through size and age mode', () => {
    expect(computeLayout(390, 844, 'little')).toEqual({ isTablet: false, width: 390, height: 844, ageMode: 'little' });
  });
});
