# A3 · Data & types

The device is the source of truth. SQLite holds all app data, secure-store holds lock state and the PIN hash, the file system holds drawings. Supabase is an optional backup/sync that only runs when a parent account exists and is online.

## Where each kind of data lives

| Data | Storage | Why |
| --- | --- | --- |
| Lock state (time used, locked until) | `expo-secure-store` | Survives app kill; hard for a kid to tamper with |
| Parent PIN hash + salt | `expo-secure-store` | Secret |
| Profiles, rules, usage, artwork index, progress, rewards, custom colors | `expo-sqlite` file `doodleden.db` | Structured, offline |
| Drawing images (PNG) and strokes (JSON) | `expo-file-system` under `Paths.document/art/` | Large files |
| Content (coloring pages, trace paths, stickers, mix table) | JSON in `src/content/` bundled with the app | Read-only |
| Parent account, synced copies | Supabase | Backup + multi-device, only with parent consent |

## `src/types/models.ts` (copy exactly)

```ts
export type AgeMode = 'little' | 'big';          // little = 3–5, big = 6–8
export type BrushType = 'crayon' | 'marker' | 'watercolor' | 'glitter' | 'neon' | 'eraser' | 'stamp';
export type PaletteKey = 'tomato' | 'orange' | 'sun' | 'leaf' | 'sky' | 'grape' | 'pink' | 'brown' | 'black' | 'white';
export type ActivityKey = 'draw' | 'coloring' | 'guided' | 'kaleidoscope' | 'flipbook_frame' | 'paper' | 'world' | 'ramps' | 'music' | 'jigsaw' | 'arwall' | 'trace' | 'mixing' | 'magic' | 'story';

export interface KidProfile {
  id: string;              // uuid
  nickname: string;        // max 12 chars, NOT a real full name
  avatarId: string;        // one of the built-in avatar ids
  ageMode: AgeMode;
  createdAt: number;       // epoch ms
}

export interface TimeRules {
  kidId: string;
  dailyLimitMin: number;           // default 45, allowed 10–180 step 5
  sessionLimitMin: number;         // default 20, allowed 5–120 step 5, must be <= dailyLimitMin
  cooldownMin: number;             // default 30, allowed 0–240 step 15
  bedtimeEnabled: boolean;         // default true
  bedtimeStart: string;            // 'HH:MM' 24h, default '19:30'
  bedtimeEnd: string;              // 'HH:MM' 24h, default '07:00'
  breakReminderMin: number | null; // default null (off); options 15, 20, 30
  finishDrawingExtensionSec: number; // default 120
  maxExtensionsPerSession: number;   // default 1
}

export interface UsageDay {
  kidId: string;
  dayKey: string;          // 'YYYY-MM-DD' local date
  usedSec: number;
  sessions: number;
  extensionsUsed: number;
  perActivitySec: Partial<Record<ActivityKey, number>>;
}

export interface StrokePoint { x: number; y: number; p: number; t: number } // x,y normalized 0..1; p pressure 0..1; t ms since stroke start

export interface Stroke {
  id: string;
  tool: BrushType;
  color: PaletteKey | 'rainbow' | string; // string = custom hex from Name Your Colors
  size: 'S' | 'M' | 'L';
  stampId?: string;        // only when tool = 'stamp'
  points: StrokePoint[];
}

export interface StrokeDoc {
  version: 1;
  aspect: number;          // canvas width / height when drawn
  background: PaletteKey | 'white';
  strokes: Stroke[];
}

export interface Artwork {
  id: string;
  kidId: string;
  activity: ActivityKey;
  title: string | null;    // optional, set by kid voice/picker later
  pngPath: string;         // relative to Paths.document
  thumbPath: string;       // 400 px long edge
  strokesPath: string | null; // null for coloring tap-fill pages
  durationSec: number;
  createdAt: number;
  updatedAt: number;
  isFavorite: boolean;
  isSticker: boolean;      // true if turned into a sticker (Stickers From My Art)
  trashedAt: number | null; // kid can trash; only parent empties trash
}

export interface Progress { kidId: string; skill: string; level: number; updatedAt: number } // skill e.g. 'trace_A', 'color_purple'

export interface RewardEarned { kidId: string; rewardId: string; earnedAt: number }

export interface CustomColor { id: string; kidId: string; hex: string; name: string; createdAt: number }
```

## SQLite schema (`src/db/migrations.ts`, migration 1)

Run migrations in order on app start. Keep `PRAGMA user_version` equal to the latest migration number. Never edit an old migration; add a new one.

```sql
PRAGMA journal_mode = WAL;
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
); -- keys: 'onboarding_done', 'active_kid_id', 'parent_user_id', 'consent_sync'
```

### SQLite migration 2 (v1 feature tables)

```sql
ALTER TABLE artwork ADD COLUMN family_shared INTEGER NOT NULL DEFAULT 0; -- parent shared to Family Gallery
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
);
```

Repositories for these: `worldRepo.ts`, `voiceRepo.ts`, `flipbookRepo.ts`, `musicRepo.ts`, `jigsawRepo.ts`, `museumRepo.ts`, `storyRepo.ts`, `aiResultRepo.ts` — same style as above (list/get/save/delete).

## Repositories (`src/db/repositories/`)

One file per table. Each exports plain async functions, no classes. Required functions:

| File | Functions |
| --- | --- |
| `kidRepo.ts` | `listKids()`, `getKid(id)`, `createKid(input)`, `updateKid(id, patch)`, `deleteKid(id)` |
| `rulesRepo.ts` | `getRules(kidId)` (returns defaults if missing), `saveRules(rules)` |
| `usageRepo.ts` | `getUsageDay(kidId, dayKey)`, `addUsage(kidId, dayKey, sec, activity)`, `incrementSessions(kidId, dayKey)`, `incrementExtensions(kidId, dayKey)`, `getWeek(kidId, endDayKey)` |
| `artworkRepo.ts` | `listArtworks(kidId, { favoritesOnly?, includeTrashed? })`, `getArtwork(id)`, `saveArtwork(a)`, `toggleFavorite(id)`, `trashArtwork(id)`, `restoreArtwork(id)`, `emptyTrash(kidId)` (parent only), `listStickers(kidId)` |
| `progressRepo.ts` | `getProgress(kidId)`, `setSkill(kidId, skill, level)` |
| `rewardRepo.ts` | `listRewards(kidId)`, `grantReward(kidId, rewardId)` (no-op if already earned; returns `true` if new) |
| `colorRepo.ts` | `listCustomColors(kidId)`, `addCustomColor(kidId, hex, name)` |
| `metaRepo.ts` | `getMeta(key)`, `setMeta(key, value)` |

Every write that should sync also inserts a row into `sync_queue`.

## Secure-store keys (exact names)

| Key | Value (JSON string) |
| --- | --- |
| `dd.lock.<kidId>` | `LockState` object (tab A4) |
| `dd.pin.hash` | hex SHA-256 of `salt + pin` |
| `dd.pin.salt` | 16 random bytes, hex |
| `dd.gate.failures` | `{ count: number, lockedUntilWall: number }` |

## File paths

- Folder per kid: `art/<kidId>/`
- Files per artwork: `art/<kidId>/<artworkId>.png` (max 2048 px long edge), `art/<kidId>/<artworkId>.thumb.png` (400 px), `art/<kidId>/<artworkId>.strokes.json` (`StrokeDoc`)
- Write files first, then insert the DB row. If the DB insert fails, delete the files.
- Deleting a kid profile deletes its whole folder.

## Supabase schema (save as supabase/migrations/0001\_core.sql; AI tables are in tab A7)

Only the parent has a Supabase account (email magic link). Kids never sign in. Sync is OFF until the parent turns on "Back up art" in Parent zone and accepts the consent screen.

```sql
create table public.family (
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid not null unique references auth.users(id) on delete cascade,
  plan text not null default 'free',
  created_at timestamptz not null default now()
);

create table public.kid_profile (
  id uuid primary key,
  family_id uuid not null references public.family(id) on delete cascade,
  nickname text not null,
  avatar_id text not null,
  age_mode text not null check (age_mode in ('little','big')),
  created_at timestamptz not null
);

create table public.time_rule (
  kid_id uuid primary key references public.kid_profile(id) on delete cascade,
  rules jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.usage_day (
  kid_id uuid not null references public.kid_profile(id) on delete cascade,
  day_key date not null,
  used_sec int not null,
  sessions int not null,
  extensions_used int not null,
  per_activity jsonb not null default '{}',
  primary key (kid_id, day_key)
);

create table public.artwork (
  id uuid primary key,
  kid_id uuid not null references public.kid_profile(id) on delete cascade,
  activity text not null,
  title text,
  storage_path text not null,
  created_at timestamptz not null,
  is_favorite boolean not null default false
);

alter table public.family enable row level security;
alter table public.kid_profile enable row level security;
alter table public.time_rule enable row level security;
alter table public.usage_day enable row level security;
alter table public.artwork enable row level security;

create policy "own family" on public.family
  for all using (parent_user_id = auth.uid()) with check (parent_user_id = auth.uid());

create policy "own kids" on public.kid_profile
  for all using (family_id in (select id from public.family where parent_user_id = auth.uid()))
  with check (family_id in (select id from public.family where parent_user_id = auth.uid()));

create policy "own rules" on public.time_rule
  for all using (kid_id in (select k.id from public.kid_profile k join public.family f on f.id = k.family_id where f.parent_user_id = auth.uid()));

create policy "own usage" on public.usage_day
  for all using (kid_id in (select k.id from public.kid_profile k join public.family f on f.id = k.family_id where f.parent_user_id = auth.uid()));

create policy "own art" on public.artwork
  for all using (kid_id in (select k.id from public.kid_profile k join public.family f on f.id = k.family_id where f.parent_user_id = auth.uid()));

-- server time for the lock engine
create or replace function public.server_now() returns timestamptz
  language sql stable as $$ select now() $$;
```

Storage: private bucket `art`, path `<family_id>/<kid_id>/<artwork_id>.png`, policy: only the owning parent can read/write. Always use signed URLs (60 min). Never make the bucket public.

## Sync rules (`src/services/sync.ts`)

1. Runs only if `app_meta.consent_sync = 'true'` AND a Supabase session exists AND device is online.
2. Runs on: app start, parent zone open, every 5 minutes while foreground.
3. Reads `sync_queue` oldest first, pushes each row, deletes the queue row on success. Stops at the first error and retries next run.
4. Conflict rule: last write wins by `updated_at`, except `usage_day` which takes the MAX of `used_sec` (so a kid cannot reduce used time by reinstalling).
5. Never sync stroke JSON, camera photos or voice clips. PNG artwork only.
