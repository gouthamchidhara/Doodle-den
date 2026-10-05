// SQLite migrations (A3). Never edit an old migration; append a new one.
import type { Db } from './types';

// Migration 1: core tables (A3, verbatim).
const MIGRATION_1 = `PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS kid_profile (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  avatar_id TEXT NOT NULL,
  age_mode TEXT NOT NULL CHECK (age_mode IN ('little','big')),
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS time_rule (
  kid_id TEXT PRIMARY KEY REFERENCES kid_profile(id) ON DELETE CASCADE,
  daily_limit_min INTEGER NOT NULL DEFAULT 45,
  session_limit_min INTEGER NOT NULL DEFAULT 20,
  cooldown_min INTEGER NOT NULL DEFAULT 30,
  bedtime_enabled INTEGER NOT NULL DEFAULT 1,
  bedtime_start TEXT NOT NULL DEFAULT '19:30',
  bedtime_end TEXT NOT NULL DEFAULT '07:00',
  break_reminder_min INTEGER,
  finish_drawing_extension_sec INTEGER NOT NULL DEFAULT 120,
  max_extensions_per_session INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS usage_day (
  kid_id TEXT NOT NULL REFERENCES kid_profile(id) ON DELETE CASCADE,
  day_key TEXT NOT NULL,
  used_sec INTEGER NOT NULL DEFAULT 0,
  sessions INTEGER NOT NULL DEFAULT 0,
  extensions_used INTEGER NOT NULL DEFAULT 0,
  per_activity_json TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (kid_id, day_key)
);

CREATE TABLE IF NOT EXISTS artwork (
  id TEXT PRIMARY KEY,
  kid_id TEXT NOT NULL REFERENCES kid_profile(id) ON DELETE CASCADE,
  activity TEXT NOT NULL,
  title TEXT,
  png_path TEXT NOT NULL,
  thumb_path TEXT NOT NULL,
  strokes_path TEXT,
  duration_sec INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  is_favorite INTEGER NOT NULL DEFAULT 0,
  is_sticker INTEGER NOT NULL DEFAULT 0,   -- 1 = turned into a sticker (Stickers From My Art)
  trashed_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_artwork_kid_created ON artwork(kid_id, created_at DESC);

CREATE TABLE IF NOT EXISTS progress (
  kid_id TEXT NOT NULL REFERENCES kid_profile(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (kid_id, skill)
);

CREATE TABLE IF NOT EXISTS reward_earned (
  kid_id TEXT NOT NULL REFERENCES kid_profile(id) ON DELETE CASCADE,
  reward_id TEXT NOT NULL,
  earned_at INTEGER NOT NULL,
  PRIMARY KEY (kid_id, reward_id)
);

CREATE TABLE IF NOT EXISTS custom_color (
  id TEXT PRIMARY KEY,
  kid_id TEXT NOT NULL REFERENCES kid_profile(id) ON DELETE CASCADE,
  hex TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  row_key TEXT NOT NULL,
  op TEXT NOT NULL CHECK (op IN ('upsert','delete')),
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
); -- keys: 'onboarding_done', 'active_kid_id', 'parent_user_id', 'consent_sync'`;

// Migration 2: v1 feature tables (A3, verbatim).
const MIGRATION_2 = `ALTER TABLE artwork ADD COLUMN family_shared INTEGER NOT NULL DEFAULT 0; -- parent shared to Family Gallery
ALTER TABLE artwork ADD COLUMN sticker_path TEXT;                     -- transparent PNG when is_sticker = 1

-- a drawing placed into a Draw-to-Life world
CREATE TABLE IF NOT EXISTS world_entity (
  id TEXT PRIMARY KEY,
  kid_id TEXT NOT NULL REFERENCES kid_profile(id) ON DELETE CASCADE,
  world TEXT NOT NULL CHECK (world IN ('aquarium','racetrack','zoo','arwall')),
  artwork_id TEXT NOT NULL REFERENCES artwork(id) ON DELETE CASCADE,
  name TEXT,                       -- e.g. 'Sunny'
  voice_clip_id TEXT,              -- Drawings That Talk
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_world_kid ON world_entity(kid_id, world);

CREATE TABLE IF NOT EXISTS voice_clip (
  id TEXT PRIMARY KEY,
  kid_id TEXT NOT NULL REFERENCES kid_profile(id) ON DELETE CASCADE,
  path TEXT NOT NULL,              -- art/<kidId>/voice/<id>.m4a
  preset TEXT NOT NULL CHECK (preset IN ('normal','chipmunk','monster')),
  duration_ms INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS flipbook (
  id TEXT PRIMARY KEY,
  kid_id TEXT NOT NULL REFERENCES kid_profile(id) ON DELETE CASCADE,
  frames_json TEXT NOT NULL,       -- JSON array of artwork ids in order (3–8)
  fps INTEGER NOT NULL DEFAULT 4,  -- 2, 4 or 8
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS music_paint (
  artwork_id TEXT PRIMARY KEY REFERENCES artwork(id) ON DELETE CASCADE,
  notes_path TEXT NOT NULL         -- JSON file of note events
);

CREATE TABLE IF NOT EXISTS jigsaw_result (
  kid_id TEXT NOT NULL REFERENCES kid_profile(id) ON DELETE CASCADE,
  artwork_id TEXT NOT NULL REFERENCES artwork(id) ON DELETE CASCADE,
  pieces INTEGER NOT NULL,
  best_time_sec INTEGER NOT NULL,
  completed_at INTEGER NOT NULL,
  PRIMARY KEY (kid_id, artwork_id, pieces)
);

CREATE TABLE IF NOT EXISTS museum_exhibit (
  id TEXT PRIMARY KEY,
  kid_id TEXT NOT NULL REFERENCES kid_profile(id) ON DELETE CASCADE,
  artwork_ids_json TEXT NOT NULL,  -- 3–6 artwork ids
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS story (
  id TEXT PRIMARY KEY,
  kid_id TEXT NOT NULL REFERENCES kid_profile(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,              -- AI text, max 120 words
  artwork_ids_json TEXT NOT NULL,  -- 1–4 artwork ids
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_result (
  id TEXT PRIMARY KEY,             -- same id the server returns
  kid_id TEXT NOT NULL REFERENCES kid_profile(id) ON DELETE CASCADE,
  feature TEXT NOT NULL CHECK (feature IN ('coloring_page','magic_sketch','story','guess','coach')),
  source_artwork_id TEXT,
  output_artwork_id TEXT,          -- for image features, the saved result
  created_at INTEGER NOT NULL
);`;

export const MIGRATIONS: readonly string[] = [MIGRATION_1, MIGRATION_2];

// Splits a migration into PRAGMA lines (run outside a transaction) and the rest.
export function splitPragmas(sql: string): { pragmas: string[]; body: string } {
  const pragmas: string[] = [];
  const body: string[] = [];
  for (const line of sql.split('\n')) {
    if (/^\s*PRAGMA\s/i.test(line)) pragmas.push(line.trim());
    else body.push(line);
  }
  return { pragmas, body: body.join('\n') };
}

// Applies every migration newer than PRAGMA user_version, each in its own transaction.
export async function runMigrations(db: Db): Promise<number> {
  const row = await db.get<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  for (let i = version; i < MIGRATIONS.length; i += 1) {
    const { pragmas, body } = splitPragmas(MIGRATIONS[i]);
    for (const p of pragmas) await db.exec(p);
    await db.transaction(async () => {
      await db.exec(body);
      await db.exec(`PRAGMA user_version = ${i + 1}`);
    });
    version = i + 1;
  }
  return version;
}
