// T-043: mix table lookup, OKLab round-trip, new-color threshold, color names, blocklist.
import { colorName } from '@/content/colorNames';
import { isTextAllowed } from '@/content/blocklist';
import { hexToOklab, isNewColor, mixBlobs, oklabDistance, oklabToHex, tableLookup } from '@/games/mixing/mixEngine';
import { colors } from '@/theme/tokens';

describe('mix engine', () => {
  it('looks pairs up in the table in any order', () => {
    expect(tableLookup('red', 'yellow')).toBe('#F58A2B');
    expect(tableLookup('yellow', 'red')).toBe('#F58A2B');
    expect(mixBlobs([{ pot: 'blue' }, { pot: 'yellow' }])).toBe('#3BAA6A');
    expect(mixBlobs([{ pot: 'black' }, { pot: 'white' }])).toBe('#9AA0AA');
  });

  it('round-trips through OKLab', () => {
    for (const hex of ['#EE5A36', '#3B8FE0', '#FFFFFF', '#1F2A44', '#7A7A2A']) expect(oklabToHex(hexToOklab(hex))).toBe(hex);
    expect(hexToOklab('#FFFFFF')[0]).toBeCloseTo(1, 3);
  });

  it('averages 3 blobs or custom colors in OKLab', () => {
    const r = mixBlobs([{ pot: 'red' }, { pot: 'yellow' }, { pot: 'white' }]);
    expect(r).toMatch(/^#[0-9A-F]{6}$/);
    expect(mixBlobs([{ hex: '#000000' }, { hex: '#FFFFFF' }])).toMatch(/^#/);
    expect(mixBlobs([])).toBeNull();
    expect(mixBlobs([{ pot: 'red' }, { pot: 'red' }])).toBe(colors.tomato.toUpperCase());
  });

  it('new color only beyond 0.05 from standard and saved colors', () => {
    expect(isNewColor('#F58A2B', [])).toBe(false);
    expect(isNewColor('#F4A0B5', [])).toBe(true);
    expect(isNewColor('#F4A0B5', ['#F4A0B6'])).toBe(false);
    expect(oklabDistance('#F4A0B5', '#F4A0B6')).toBeLessThan(0.05);
  });

  it('names and blocklist', () => {
    expect(colorName('dragon', 'goo')).toBe('Dragon Goo');
    expect(isTextAllowed('Sparkle Cloud')).toBe(true);
    expect(isTextAllowed('blood red')).toBe(false);
    expect(isTextAllowed('call 123456')).toBe(false);
    expect(isTextAllowed('Bloodhound')).toBe(true);
  });
});
