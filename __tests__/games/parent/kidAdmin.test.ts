import { emptyKidTrash, removeKid } from '@/games/parent/kidAdmin';

const mockRun = jest.fn();
jest.mock('@/db/repositories/artworkRepo', () => ({
  emptyTrash: jest.fn(async () => [{ pngPath: 'a.png', thumbPath: 'a_t.png', strokesPath: null, stickerPath: 's.png' }]),
}));
jest.mock('@/db/repositories/kidRepo', () => ({ deleteKid: jest.fn(async (id: string) => mockRun('deleteKid', id)) }));
jest.mock('@/lock/lockStorage', () => ({ clearLockState: jest.fn(async (id: string) => mockRun('clearLock', id)) }));
jest.mock('@/services/files', () => ({ deleteFiles: jest.fn((f: unknown) => mockRun('deleteFiles', f)) }));

describe('kidAdmin', () => {
  beforeEach(() => mockRun.mockClear());
  it('removes the kid and their lock state', async () => {
    await removeKid('k1');
    expect(mockRun.mock.calls).toEqual([
      ['deleteKid', 'k1'],
      ['clearLock', 'k1'],
    ]);
  });
  it('deletes the files of emptied trash', async () => {
    expect(await emptyKidTrash('k1')).toBe(1);
    expect(mockRun).toHaveBeenCalledWith('deleteFiles', ['a.png', 'a_t.png', null, 's.png']);
  });
});
