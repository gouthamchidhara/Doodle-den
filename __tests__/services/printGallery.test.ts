import { newShareToken } from '@/services/familyGallery';
import { stickerSheetHtml, storyBookHtml } from '@/services/print';
import { isFamilyTile } from '@/state/features';

jest.mock('@/services/supabase', () => ({ getSupabase: () => null }));
jest.mock('@/services/auth', () => ({ ensureFamily: async () => null }));
jest.mock('@/services/files', () => ({ readBase64: jest.fn() }));

describe('print + gallery + gating', () => {
  it('makes a 32-char url-safe token', () => {
    const t = newShareToken(new Uint8Array(24).fill(255));
    expect(t).toHaveLength(32);
    expect(t).toMatch(/^[A-Za-z0-9_-]{32}$/);
  });
  it('caps the sticker sheet at 12', () => {
    expect(stickerSheetHtml(Array(20).fill('AA')).match(/<img/g)).toHaveLength(12);
  });
  it('escapes story text and adds one page per page', () => {
    const html = storyBookHtml('A <b>', [{ image: null, text: 'x & y' }, { image: 'AA', text: 'z' }]);
    expect(html).toContain('A &lt;b&gt;');
    expect(html).toContain('x &amp; y');
    expect(html.match(/<section>/g)).toHaveLength(2);
  });
  it('gates family tiles only', () => {
    expect(isFamilyTile('music')).toBe(true);
    expect(isFamilyTile('draw')).toBe(false);
    expect(isFamilyTile('magic_sketch')).toBe(false);
  });
});
