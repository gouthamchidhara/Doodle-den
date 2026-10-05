// The 19 required lock engine tests (A4). Jest runs with TZ=America/Chicago.
import { applyRulesChange, createLockState, getRemaining, parentUnlock, requestFinishDrawing, tick } from '@/lock/lockEngine';
import type { ClockReading, LockEvent, LockState } from '@/lock/types';
import type { TimeRules } from '@/types/models';

const MIN = 60_000;
const HOUR = 60 * MIN;

function makeClock(c: Partial<ClockReading> & { wallMs: number }): ClockReading {
  return { uptimeMs: 1_000_000, bootId: 'boot-1', serverOffsetMs: null, ...c };
}

const rules = (over: Partial<TimeRules> = {}): TimeRules => ({
  kidId: 'k1',
  dailyLimitMin: 45,
  sessionLimitMin: 20,
  cooldownMin: 30,
  bedtimeEnabled: false,
  bedtimeStart: '19:30',
  bedtimeEnd: '07:00',
  breakReminderMin: null,
  finishDrawingExtensionSec: 120,
  maxExtensionsPerSession: 1,
  ...over,
});

const at = (h: number, m = 0, day = 5) => new Date(2026, 9, day, h, m, 0, 0).getTime();

// Simulated device: advances uptime and wall together.
class Sim {
  clock: ClockReading;
  state: LockState;
  events: LockEvent[] = [];
  constructor(wallMs: number, public r: TimeRules = rules()) {
    this.clock = makeClock({ wallMs });
    this.state = createLockState('k1', this.clock);
  }
  advance(ms: number, wallMs = ms) {
    this.clock = { ...this.clock, uptimeMs: this.clock.uptimeMs + ms, wallMs: this.clock.wallMs + wallMs };
  }
  step(inKidArea = true, ms = 1000): LockEvent[] {
    this.advance(ms);
    const out = tick(this.state, this.r, this.clock, { inKidArea });
    this.state = out.state;
    this.events.push(...out.events);
    return out.events;
  }
  run(n: number, inKidArea = true) {
    for (let i = 0; i < n; i += 1) this.step(inKidArea);
  }
}

describe('lockEngine', () => {
  it('1. counts 1 s per tick in kid area and 0 outside', () => {
    const sim = new Sim(at(10));
    sim.run(10);
    expect(sim.state.usedTodaySec).toBe(10);
    sim.run(10, false);
    expect(sim.state.usedTodaySec).toBe(10);
  });

  it('2. caps a 60 s uptime jump to 5 s', () => {
    const sim = new Sim(at(10));
    sim.step(true, 60_000);
    expect(sim.state.usedTodaySec).toBe(5);
  });

  it('3. fires SESSION_START once', () => {
    const sim = new Sim(at(10));
    sim.run(30);
    expect(sim.events.filter((e) => e === 'SESSION_START')).toHaveLength(1);
  });

  it('4. WARN_5 once at 5 min left, WARN_1 once at 1 min left', () => {
    const sim = new Sim(at(10));
    sim.run(15 * 60 - 1);
    expect(sim.events).not.toContain('WARN_5');
    sim.step();
    expect(sim.events.filter((e) => e === 'WARN_5')).toHaveLength(1);
    sim.run(4 * 60);
    expect(sim.events.filter((e) => e === 'WARN_1')).toHaveLength(1);
    sim.run(30);
    expect(sim.events.filter((e) => e === 'WARN_5')).toHaveLength(1);
    expect(sim.events.filter((e) => e === 'WARN_1')).toHaveLength(1);
  });

  it('5. session limit: AUTOSAVE then LOCK, cooldown 30 min', () => {
    const sim = new Sim(at(10));
    sim.run(20 * 60 - 1);
    const ev = sim.step();
    expect(ev.indexOf('AUTOSAVE')).toBeLessThan(ev.indexOf('LOCK'));
    expect(sim.state.lock.reason).toBe('cooldown');
    expect(sim.state.lock.untilWallMs).toBe(sim.state.lastTick.wallMs + 30 * MIN);
  });

  it('6. cooldown expires after 30 min of wall time', () => {
    const sim = new Sim(at(10));
    sim.run(20 * 60);
    sim.events = [];
    for (let i = 0; i < 30; i += 1) sim.step(false, MIN);
    expect(sim.events).toContain('UNLOCK');
    expect(sim.state.lock.reason).toBe('none');
  });

  it('7. daily limit locks until next local midnight', () => {
    const sim = new Sim(at(10), rules({ dailyLimitMin: 10, sessionLimitMin: 10 }));
    sim.run(10 * 60);
    expect(sim.state.lock.reason).toBe('daily');
    expect(sim.state.lock.untilWallMs).toBe(at(0, 0, 6));
  });

  it('8. new day unlocks daily and resets usedTodaySec', () => {
    const sim = new Sim(at(23, 40), rules({ dailyLimitMin: 10, sessionLimitMin: 10 }));
    sim.run(5 * 60);
    sim.run(5 * 60);
    expect(sim.state.lock.reason).toBe('daily');
    for (let i = 0; i < 12; i += 1) sim.step(false, MIN);
    expect(sim.events).toContain('UNLOCK');
    expect(sim.state.usedTodaySec).toBe(0);
    expect(sim.state.lock.reason).toBe('none');
  });

  it('9. bedtime 19:30–07:00 locks at 19:30 and unlocks at 07:00', () => {
    const sim = new Sim(at(19, 29), rules({ bedtimeEnabled: true }));
    sim.run(59);
    expect(sim.state.lock.reason).toBe('none');
    const ev = sim.step();
    expect(ev).toEqual(['AUTOSAVE', 'LOCK']);
    expect(sim.state.lock).toEqual({ reason: 'bedtime', untilWallMs: at(7, 0, 6) });
    for (let i = 0; i < 11 * 60 + 29; i += 1) sim.step(false, MIN);
    expect(sim.state.lock.reason).toBe('bedtime');
    sim.step(false, MIN);
    expect(sim.state.lock.reason).toBe('none');
    expect(sim.events).toContain('UNLOCK');
  });

  it('10. bedtime window not crossing midnight (13:00–14:00)', () => {
    const sim = new Sim(at(12, 59), rules({ bedtimeEnabled: true, bedtimeStart: '13:00', bedtimeEnd: '14:00' }));
    sim.step(false, MIN);
    expect(sim.state.lock).toEqual({ reason: 'bedtime', untilWallMs: at(14) });
    for (let i = 0; i < 60; i += 1) sim.step(false, MIN);
    expect(sim.state.lock.reason).toBe('none');
  });

  it('11. clock moved back 3 h: no unlock, maxWallSeenMs unchanged', () => {
    const sim = new Sim(at(10));
    sim.run(20 * 60);
    const max = sim.state.maxWallSeenMs;
    sim.advance(1000, -3 * HOUR);
    const out = tick(sim.state, sim.r, sim.clock, { inKidArea: true });
    expect(out.state.lock.reason).toBe('cooldown');
    expect(out.state.maxWallSeenMs).toBe(max);
    expect(out.events).not.toContain('UNLOCK');
  });

  it('12. clock forward 24 h, same boot, no server offset: ignored', () => {
    const sim = new Sim(at(10), rules({ dailyLimitMin: 10, sessionLimitMin: 10 }));
    sim.run(10 * 60);
    sim.advance(1000, 24 * HOUR);
    const out = tick(sim.state, sim.r, sim.clock, { inKidArea: true });
    expect(out.state.lock.reason).toBe('daily');
    expect(out.state.lastTick.wallMs).toBe(sim.state.lastTick.wallMs + 1000);
  });

  it('13. clock forward with server offset: server time wins', () => {
    const sim = new Sim(at(10));
    sim.clock = { ...sim.clock, serverOffsetMs: -24 * HOUR };
    sim.advance(1000, 24 * HOUR + 1000);
    const out = tick(sim.state, sim.r, sim.clock, { inKidArea: true });
    expect(out.state.lastTick.wallMs).toBe(at(10) + 1000);
    expect(out.state.dayKey).toBe('2026-10-05');
  });

  it('14. boot id change gives delta 0', () => {
    const sim = new Sim(at(10));
    sim.run(5);
    sim.clock = { ...sim.clock, bootId: 'boot-2', uptimeMs: 10_000 };
    sim.advance(1000);
    const out = tick(sim.state, sim.r, sim.clock, { inKidArea: true });
    expect(out.state.usedTodaySec).toBe(5);
  });

  it('15. away 11 min ends the session; next tick starts a new one', () => {
    const sim = new Sim(at(10));
    sim.run(60);
    sim.events = [];
    sim.step(true, 11 * MIN);
    expect(sim.events).toContain('SESSION_START');
    expect(sim.state.sessionUsedSec).toBe(5);
    expect(sim.state.usedTodaySec).toBe(65);
  });

  it('16. requestFinishDrawing: denied at 3 min, granted at 50 s, denied again', () => {
    const sim = new Sim(at(10));
    sim.run(17 * 60);
    expect(requestFinishDrawing(sim.state, sim.r).granted).toBe(false);
    sim.run(2 * 60 + 10);
    const first = requestFinishDrawing(sim.state, sim.r);
    expect(first.granted).toBe(true);
    expect(getRemaining(first.state, sim.r).leftSec).toBe(50 + 120);
    sim.state = first.state;
    sim.run(130);
    expect(requestFinishDrawing(sim.state, sim.r).granted).toBe(false);
  });

  it('17. parentUnlock plus15 from a daily lock gives 15 min', () => {
    const sim = new Sim(at(10), rules({ dailyLimitMin: 10, sessionLimitMin: 10 }));
    sim.run(10 * 60);
    const out = parentUnlock(sim.state, 'plus15', sim.clock, sim.r);
    expect(out.state.lock.reason).toBe('none');
    expect(out.events).toEqual(['UNLOCK']);
    expect(getRemaining(out.state, sim.r).leftSec).toBe(15 * 60);
  });

  it('18. applyRulesChange raising the daily limit unlocks', () => {
    const sim = new Sim(at(10), rules({ dailyLimitMin: 45, sessionLimitMin: 45 }));
    sim.run(45 * 60);
    expect(sim.state.lock.reason).toBe('daily');
    const next = rules({ dailyLimitMin: 60, sessionLimitMin: 45 });
    const out = applyRulesChange(sim.state, sim.r, next, sim.clock);
    expect(out.state.lock.reason).toBe('none');
    expect(out.events).toContain('UNLOCK');
    expect(getRemaining(out.state, next).dailyLeftSec).toBe(15 * 60);
  });

  it('19. tick does not mutate its input', () => {
    const sim = new Sim(at(10));
    sim.run(3);
    const before = JSON.stringify(sim.state);
    const frozen = sim.state;
    sim.advance(1000);
    tick(frozen, sim.r, sim.clock, { inKidArea: true });
    expect(JSON.stringify(frozen)).toBe(before);
  });
});
