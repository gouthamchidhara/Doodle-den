// T-037: with the flag off nothing runs; threshold math for the daily event.
import { dailyThreshold, hasSelection, hhmmComponents, isScreenTimeEnabled, removeShield, shieldNow } from '@/lock/screenTime';
import { defaultRules } from '@/db/repositories/rulesRepo';

jest.mock('react-native-device-activity', () => {
  throw new Error('must not load while the flag is off');
});

describe('screenTime', () => {
  it('is off without the flag and never loads the library', () => {
    expect(isScreenTimeEnabled()).toBe(false);
    expect(hasSelection()).toBe(false);
    expect(() => shieldNow()).not.toThrow();
    expect(() => removeShield()).not.toThrow();
  });

  it('computes the usage threshold and bedtime components', () => {
    const rules = { ...defaultRules('k'), dailyLimitMin: 45 };
    expect(dailyThreshold(rules, 0)).toEqual({ hour: 0, minute: 45 });
    expect(dailyThreshold(rules, 1800)).toEqual({ hour: 1, minute: 15 });
    expect(hhmmComponents('19:30')).toEqual({ hour: 19, minute: 30 });
  });
});
