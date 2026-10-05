// Adds rows to sync_queue so sync.ts can push them to Supabase later (A3).
import type { Db } from './types';

export type SyncTable = 'kid_profile' | 'time_rule' | 'usage_day' | 'artwork';

// Queues one upsert/delete for a synced table row.
export async function enqueueSync(db: Db, table: SyncTable, rowKey: string, op: 'upsert' | 'delete'): Promise<void> {
  await db.run('INSERT INTO sync_queue (table_name, row_key, op, created_at) VALUES (?, ?, ?, ?)', [table, rowKey, op, Date.now()]);
}
