// Parent-set time rules per kid (A3), with allowed ranges enforced on save.
import type { TimeRules } from '@/types/models';

import { getDb } from '../database';
import { enqueueSync } from '../syncQueue';

interface RuleRow {
  kid_id: string;
  daily_limit_min: number;
  session_limit_min: number;
  cooldown_min: number;
  bedtime_enabled: number;
  bedtime_start: string;
  bedtime_end: string;
  break_reminder_min: number | null;
  finish_drawing_extension_sec: number;
  max_extensions_per_session: number;
}

// Spec defaults (A3).
export function defaultRules(kidId: string): TimeRules {
  return {
    kidId,
    dailyLimitMin: 45,
    sessionLimitMin: 20,
    cooldownMin: 30,
    bedtimeEnabled: true,
    bedtimeStart: '19:30',
    bedtimeEnd: '07:00',
    breakReminderMin: null,
    finishDrawingExtensionSec: 120,
    maxExtensionsPerSession: 1,
  };
}

const stepClamp = (v: number, min: number, max: number, step: number) => Math.min(max, Math.max(min, Math.round(v / step) * step));
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

// Forces every field into its allowed range (A3 comments).
export function normalizeRules(r: TimeRules): TimeRules {
  const dailyLimitMin = stepClamp(r.dailyLimitMin, 10, 180, 5);
  const breakReminderMin = r.breakReminderMin !== null && [15, 20, 30].includes(r.breakReminderMin) ? r.breakReminderMin : null;
  return {
    ...r,
    dailyLimitMin,
    sessionLimitMin: Math.min(stepClamp(r.sessionLimitMin, 5, 120, 5), dailyLimitMin),
    cooldownMin: stepClamp(r.cooldownMin, 0, 240, 15),
    bedtimeStart: HHMM.test(r.bedtimeStart) ? r.bedtimeStart : '19:30',
    bedtimeEnd: HHMM.test(r.bedtimeEnd) ? r.bedtimeEnd : '07:00',
    breakReminderMin,
    finishDrawingExtensionSec: Math.max(0, Math.round(r.finishDrawingExtensionSec)),
    maxExtensionsPerSession: Math.max(0, Math.round(r.maxExtensionsPerSession)),
  };
}

const toRules = (r: RuleRow): TimeRules => ({
  kidId: r.kid_id,
  dailyLimitMin: r.daily_limit_min,
  sessionLimitMin: r.session_limit_min,
  cooldownMin: r.cooldown_min,
  bedtimeEnabled: r.bedtime_enabled === 1,
  bedtimeStart: r.bedtime_start,
  bedtimeEnd: r.bedtime_end,
  breakReminderMin: r.break_reminder_min,
  finishDrawingExtensionSec: r.finish_drawing_extension_sec,
  maxExtensionsPerSession: r.max_extensions_per_session,
});

// Gets a kid's rules, or the defaults when no row exists.
export async function getRules(kidId: string): Promise<TimeRules> {
  const db = await getDb();
  const row = await db.get<RuleRow>('SELECT * FROM time_rule WHERE kid_id = ?', [kidId]);
  return row ? toRules(row) : defaultRules(kidId);
}

// Saves (upserts) normalized rules and queues them for sync.
export async function saveRules(rules: TimeRules): Promise<TimeRules> {
  const db = await getDb();
  const r = normalizeRules(rules);
  await db.run(
    `INSERT INTO time_rule (kid_id, daily_limit_min, session_limit_min, cooldown_min, bedtime_enabled, bedtime_start, bedtime_end,
       break_reminder_min, finish_drawing_extension_sec, max_extensions_per_session)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(kid_id) DO UPDATE SET daily_limit_min = excluded.daily_limit_min, session_limit_min = excluded.session_limit_min,
       cooldown_min = excluded.cooldown_min, bedtime_enabled = excluded.bedtime_enabled, bedtime_start = excluded.bedtime_start,
       bedtime_end = excluded.bedtime_end, break_reminder_min = excluded.break_reminder_min,
       finish_drawing_extension_sec = excluded.finish_drawing_extension_sec, max_extensions_per_session = excluded.max_extensions_per_session`,
    [
      r.kidId,
      r.dailyLimitMin,
      r.sessionLimitMin,
      r.cooldownMin,
      r.bedtimeEnabled ? 1 : 0,
      r.bedtimeStart,
      r.bedtimeEnd,
      r.breakReminderMin,
      r.finishDrawingExtensionSec,
      r.maxExtensionsPerSession,
    ],
  );
  await enqueueSync(db, 'time_rule', r.kidId, 'upsert');
  return r;
}
