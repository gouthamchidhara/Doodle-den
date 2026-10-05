// Kid-named custom colors from the Mixing Lab (A3).
import type { CustomColor } from '@/types/models';
import { newId } from '@/utils/ids';

import { getDb } from '../database';

interface ColorRow {
  id: string;
  kid_id: string;
  hex: string;
  name: string;
  created_at: number;
}

export const MAX_CUSTOM_COLORS = 24;

const toColor = (r: ColorRow): CustomColor => ({ id: r.id, kidId: r.kid_id, hex: r.hex, name: r.name, createdAt: r.created_at });

// Lists a kid's colors, oldest first.
export async function listCustomColors(kidId: string): Promise<CustomColor[]> {
  const db = await getDb();
  return (await db.all<ColorRow>('SELECT * FROM custom_color WHERE kid_id = ? ORDER BY created_at ASC', [kidId])).map(toColor);
}

// Adds a color; returns null when the kid already has 24.
export async function addCustomColor(kidId: string, hex: string, name: string): Promise<CustomColor | null> {
  const db = await getDb();
  const count = await db.get<{ n: number }>('SELECT COUNT(*) AS n FROM custom_color WHERE kid_id = ?', [kidId]);
  if ((count?.n ?? 0) >= MAX_CUSTOM_COLORS) return null;
  const c: CustomColor = { id: newId(), kidId, hex: hex.toUpperCase(), name: name.trim().slice(0, 20), createdAt: Date.now() };
  await db.run('INSERT INTO custom_color (id, kid_id, hex, name, created_at) VALUES (?, ?, ?, ?, ?)', [c.id, c.kidId, c.hex, c.name, c.createdAt]);
  return c;
}

// Parent zone: deletes one custom color.
export async function deleteCustomColor(id: string): Promise<void> {
  const db = await getDb();
  await db.run('DELETE FROM custom_color WHERE id = ?', [id]);
}
