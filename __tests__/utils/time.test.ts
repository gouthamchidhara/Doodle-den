// Time helper tests in America/Chicago (T-009).
import { isInBedtime, isoWeekKey, localDayKey, nextBedtimeEnd, nextLocalMidnight, parseHHMM, shiftDayKey } from '@/utils/time';

const at = (s: string) => new Date(s).getTime(); // local time strings (no Z)

describe('time utils', () => {
  it('local day key and midnight', () => {
    expect(localDayKey(at('2026-10-05T23:59:00'))).toBe('2026-10-05');
    expect(localDayKey(at('2026-10-06T00:00:00'))).toBe('2026-10-06');
    expect(nextLocalMidnight(at('2026-10-05T19:30:00'))).toBe(at('2026-10-06T00:00:00'));
    expect(nextLocalMidnight(at('2026-03-07T12:00:00'))).toBe(at('2026-03-08T00:00:00'));
  });
  it('shiftDayKey across months/years', () => {
    expect(shiftDayKey('2026-01-01', -1)).toBe('2025-12-31');
    expect(shiftDayKey('2026-02-28', 1)).toBe('2026-03-01');
  });
  it('bedtime across midnight (19:30-07:00)', () => {
    expect(isInBedtime(at('2026-10-05T19:29:00'), '19:30', '07:00')).toBe(false);
    expect(isInBedtime(at('2026-10-05T19:30:00'), '19:30', '07:00')).toBe(true);
    expect(isInBedtime(at('2026-10-06T02:00:00'), '19:30', '07:00')).toBe(true);
    expect(isInBedtime(at('2026-10-06T06:59:00'), '19:30', '07:00')).toBe(true);
    expect(isInBedtime(at('2026-10-06T07:00:00'), '19:30', '07:00')).toBe(false);
  });
  it('bedtime not crossing midnight (13:00-14:00)', () => {
    expect(isInBedtime(at('2026-10-05T12:59:00'), '13:00', '14:00')).toBe(false);
    expect(isInBedtime(at('2026-10-05T13:30:00'), '13:00', '14:00')).toBe(true);
    expect(isInBedtime(at('2026-10-05T14:00:00'), '13:00', '14:00')).toBe(false);
    expect(isInBedtime(at('2026-10-05T13:30:00'), '13:00', '13:00')).toBe(false);
  });
  it('next bedtime end', () => {
    expect(nextBedtimeEnd(at('2026-10-05T19:30:00'), '07:00')).toBe(at('2026-10-06T07:00:00'));
    expect(nextBedtimeEnd(at('2026-10-06T03:00:00'), '07:00')).toBe(at('2026-10-06T07:00:00'));
    expect(nextBedtimeEnd(at('2026-10-05T13:10:00'), '14:00')).toBe(at('2026-10-05T14:00:00'));
  });
  it('parseHHMM and ISO week', () => {
    expect(parseHHMM('19:30')).toBe(1170);
    expect(isoWeekKey(at('2026-10-05T10:00:00'))).toBe('2026-W41');
    expect(isoWeekKey(at('2027-01-01T10:00:00'))).toBe('2026-W53');
  });
});
