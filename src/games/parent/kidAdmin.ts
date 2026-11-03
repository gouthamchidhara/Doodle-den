// Parent kid admin (T-092): full delete and trash emptying, including files.
import { emptyTrash } from '@/db/repositories/artworkRepo';
import { deleteKid } from '@/db/repositories/kidRepo';
import { clearLockState } from '@/lock/lockStorage';
import { deleteFiles } from '@/services/files';

// Deletes a kid: DB rows (cascade), art folder and saved lock state.
export async function removeKid(kidId: string): Promise<void> {
  await deleteKid(kidId);
  await clearLockState(kidId);
}

// Empties a kid's trash and deletes every file of those artworks; returns how many.
export async function emptyKidTrash(kidId: string): Promise<number> {
  const gone = await emptyTrash(kidId);
  deleteFiles(gone.flatMap((a) => [a.pngPath, a.thumbPath, a.strokesPath, a.stickerPath]));
  return gone.length;
}
