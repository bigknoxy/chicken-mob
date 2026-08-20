import { describe, it, expect, vi } from 'vitest';
import {
     generateDailyChallenge,
    getCurrentChallenge,
    utcDayKey,
    getChallengeProgress,
    isChallengeFreshToday,
    completeChallenge,
    MODIFIER_POOL,
     MAX_CHALLENGE_STREAK,
     DEFAULT_CHALLENGE_LEVEL_POOL,
     applyChallengeModifiers,
     HONORED_MODIFIERS,
     parseForceLevel,
} from '@/systems/ChallengeSystem';
import { getLevel, TOTAL_LEVELS } from '@/data/levels';
import { createDefaultPlayerState } from '@/platform/Persistence';
import type { PlayerState, LevelDefinition, ChallengeModifier } from '@/data/types';

/** Fixed UTC timestamps for deterministic, clock-free streak tests. */
const DAY = 86_400_000;
const day = (n: number) => Date.UTC(2026, 2, 5) + n * DAY;          // Mar 5 2026 + n days
const utcDateStr = (ms: number) => utcDayKey(ms);

function freshPlayer(overrides: Partial<PlayerState> = {}): PlayerState {
    return { ...createDefaultPlayerState(), ...overrides };
}

describe('P1-1 Daily Challenges', () => {
    // ── AC-1: Determinism ──
    describe('AC-1 determinism', () => {
        it('produces a byte-identical challenge for the same day', () => {
            const a = generateDailyChallenge('2026-03-04');
            const b = generateDailyChallenge('2026-03-04');
            expect(a).toEqual(b);
            expect(a.seed).toBe(b.seed);
            expect(a.modifiers).toEqual(b.modifiers);
            expect(a.levelIndex).toBe(b.levelIndex);
            expect(a.reward).toEqual(b.reward);
        });

        it('produces different ids for different days', () => {
            const a = generateDailyChallenge('2026-03-04');
            const b = generateDailyChallenge('2026-03-05');
            expect(a.id).not.toBe(b.id);
            expect(a.seed).not.toBe(b.seed);
        });

        it('does not leak the current clock into generation (no Date.now in the pure path)', () => {
            const spy = vi.spyOn(Date, 'now').mockReturnValue(0);
            try {
                const a = generateDailyChallenge('2026-03-04');
                expect(utcDateStr(a.expiresAtMs)).toBe('2026-03-04');
            } finally {
             spy.mockRestore();
          }
        });
    });

    // ── AC-2: Valid, non-throwing level selection ──
    describe('AC-2 valid level selection', () => {
        it('emits a level index that getLevel() accepts without throwing', () => {
            let bad = 0;
            for (let i = 0; i < 200; i++) {
                const c = generateDailyChallenge(`2026-03-${String((i % 28) + 1).padStart(2, '0')}`);
                if (c.levelIndex < 1 || c.levelIndex >= DEFAULT_CHALLENGE_LEVEL_POOL) bad++;
                expect(() => getLevel(c.levelIndex)).not.toThrow();
            }
            expect(bad).toBe(0);
        });
    });

    // ── AC-3: Non-empty, legal modifiers ──
    describe('AC-3 modifiers', () => {
        it('always includes at least one modifier', () => {
            for (let i = 0; i < 200; i++) {
                const c = generateDailyChallenge(`2026-04-${String((i % 25) + 1).padStart(2, '0')}`);
                expect(c.modifiers.length).toBeGreaterThanOrEqual(1);
            }
        });

        it('only uses modifiers from the legal pool, each with a defined value', () => {
            for (let i = 0; i < 200; i++) {
                const c = generateDailyChallenge(`2026-05-${String((i % 22) + 1).padStart(2, '0')}`);
                for (const m of c.modifiers) {
                    expect(MODIFIER_POOL).toContain(m.type);
                    expect(typeof m.value).toBe('number');
                    expect(Number.isFinite(m.value)).toBe(true);
                }
            }
        });
    });

    // ── AC-4: Meaningful reward ──
    describe('AC-4 rewards', () => {
        it('the base reward is always at least 1 corn', () => {
            for (let i = 0; i < 200; i++) {
                const c = generateDailyChallenge(`2026-06-${String((i % 27) + 1).padStart(2, '0')}`);
                expect(c.reward.corn).toBeGreaterThanOrEqual(1);
            }
        });

        it('the 7th consecutive completion grants a golden feather', () => {
            const state = freshPlayer();
            let result = null;
            for (let i = 0; i < MAX_CHALLENGE_STREAK; i++) {
                result = completeChallenge(state, generateDailyChallenge(utcDateStr(day(i))), day(i));
            }
            expect(result?.newStreak).toBe(MAX_CHALLENGE_STREAK);
            expect(result?.reward.goldenFeather).toBe(1);
        });
    });

    // ── AC-5: Idempotent per day ──
    describe('AC-5 idempotency', () => {
        it('completing twice the same day awards the reward exactly once', () => {
            const state = freshPlayer();
            const c = generateDailyChallenge(utcDateStr(day(0)));
            const first = state.currencies.corn;

            const r1 = completeChallenge(state, c, day(0));
            expect(r1).not.toBeNull();
            const afterFirst = state.currencies.corn;
            expect(afterFirst).toBeGreaterThan(first);

            const r2 = completeChallenge(state, c, day(0));
            expect(r2).toBeNull();
            expect(state.currencies.corn).toBe(afterFirst);    // no double-credit
            expect(state.challengeProgress?.completedToday).toBe(true);
            expect(state.challengeProgress?.totalCompleted).toBe(1); // counted once
        });
    });

    // ── AC-6: Streak extends on consecutive days ──
    describe('AC-6 streak extension', () => {
        it('a completion the next day extends the streak', () => {
            const state = freshPlayer();
            const r0 = completeChallenge(state, generateDailyChallenge(utcDateStr(day(0))), day(0));
            expect(r0?.newStreak).toBe(1);

            const r1 = completeChallenge(state, generateDailyChallenge(utcDateStr(day(1))), day(1));
            expect(r1?.newStreak).toBe(2);
            expect(state.challengeProgress?.longestStreak).toBe(2);
        });
    });

    // ── AC-7: Streak resets on a missed day ──
    describe('AC-7 streak reset', () => {
        it('a missed day breaks the streak and resets it to 1', () => {
            const state = freshPlayer();
            // complete day 0 and day 1 → streak 2
            completeChallenge(state, generateDailyChallenge(utcDateStr(day(0))), day(0));
            completeChallenge(state, generateDailyChallenge(utcDateStr(day(1))), day(1));
            expect(state.challengeProgress?.consecutiveCompletions).toBe(2);

            // jump to day 3 (skipped day 2) → streak reset
            const r = completeChallenge(state, generateDailyChallenge(utcDateStr(day(3))), day(3));
            expect(r?.newStreak).toBe(1);
            expect(r?.isStreakBroken).toBe(true);
        });
    });

    // ── AC-8: Streak wraps at the cap ──
    describe('AC-8 streak wrap', () => {
        it('the day after a full 7-streak begins a fresh cycle at 1', () => {
            const state = freshPlayer();
            for (let i = 0; i < MAX_CHALLENGE_STREAK; i++) {
                completeChallenge(state, generateDailyChallenge(utcDateStr(day(i))), day(i));
            }
            // full streak reached
            expect(state.challengeProgress?.consecutiveCompletions).toBe(MAX_CHALLENGE_STREAK);
            expect(state.challengeProgress?.longestStreak).toBe(MAX_CHALLENGE_STREAK);

            // next day wraps to 1
            const r = completeChallenge(state, generateDailyChallenge(utcDateStr(day(MAX_CHALLENGE_STREAK))), day(MAX_CHALLENGE_STREAK));
            expect(r?.newStreak).toBe(1);
            expect(r?.isCycleStart).toBe(true);
            // longest streak is preserved, not overwritten by the wrap
            expect(state.challengeProgress?.longestStreak).toBe(MAX_CHALLENGE_STREAK);
        });
    });

    // ── AC-9: UTC-day consistent id ──
    describe('AC-9 UTC id stability', () => {
        it('the day key is stable within a UTC day and changes after midnight', () => {
            const noon = Date.UTC(2026, 2, 10, 12, 0, 0);
            const late = Date.UTC(2026, 2, 10, 23, 59, 0);
            const nextDay = Date.UTC(2026, 2, 11, 0, 1, 0);
            expect(utcDayKey(noon)).toBe(utcDayKey(late));
            expect(utcDayKey(noon)).toBe('2026-03-10');
            expect(utcDayKey(nextDay)).toBe('2026-03-11');
            expect(utcDayKey(noon)).not.toBe(utcDayKey(nextDay));
        });

        it('getCurrentChallenge keys off the injected clock, not the real one', () => {
            const t = Date.UTC(2026, 2, 11, 6, 0, 0);
            expect(getCurrentChallenge(t).id).toBe(utcDateStr(t));
            expect(getCurrentChallenge(t + 1000).id).toBe(utcDateStr(t + 1000));
        });
    });

    // ── AC-10: Persistence / migration safety ──
    describe('AC-10 persistence', () => {
        it('a legacy save without challengeProgress loads a fresh default', () => {
            const legacy = createDefaultPlayerState();
            delete (legacy as PlayerState).challengeProgress;
            const p = getChallengeProgress(legacy);
            expect(p).toEqual({
                lastCompletedDate: null,
                consecutiveCompletions: 0,
                longestStreak: 0,
                totalCompleted: 0,
                completedToday: false,
             });
        });

        it('completion persists and reloads as completed', () => {
            // Fake a global localStorage (node test env has none)
            const store = new Map<string, string>();
            vi.stubGlobal('localStorage', {
                setItem: (k: string, v: string) => void store.set(k, v),
                getItem: (k: string) => store.get(k) ?? null,
                removeItem: (k: string) => void store.delete(k),
            });
            try {
                const state = createDefaultPlayerState();
                const c = generateDailyChallenge(utcDateStr(day(0)));
                const r = completeChallenge(state, c, day(0));
                expect(r).not.toBeNull();

                // round-trip through a "reload"
                const reloaded = { ...createDefaultPlayerState() };
                reloaded.challengeProgress = state.challengeProgress;
                expect(reloaded.challengeProgress?.completedToday).toBe(true);
                expect(isChallengeFreshToday(reloaded, day(0))).toBe(false);
                expect(isChallengeFreshToday(reloaded, day(1))).toBe(true);
            } finally {
                vi.unstubAllGlobals();
            }
        });
    });

describe('live modifier application (P1-1b)', () => {
    const makeLevel = (): LevelDefinition => ({
        id: 'test-lvl',
        name: 'Test Level',
        worldId: 'W1',
        laneCount: 3,
        length: 1000,
        gates: [],
        obstacles: [],
        enemySpawns: [
            { time: 1, lane: 0, foxTypeId: 'fox_red', count: 3 },
            { time: 2, lane: 1, foxTypeId: 'fox_red', count: 4 },
            { time: 3, lane: 2, foxTypeId: 'fox_blue', count: 5 },
        ],
        fort: { hp: 100, armorMultiplier: 1, rewardMultiplier: 1 },
        rewardCorn: 10,
        rewardFeathers: 1,
     });

     it('double_enemies multiplies every enemy spawn count', () => {
        const level = makeLevel();
        const mod: ChallengeModifier = { type: 'double_enemies', value: 2 };
        const result = applyChallengeModifiers(level, [mod]);
        expect(result.enemySpawns[0].count).toBe(6);
        expect(result.enemySpawns[1].count).toBe(8);
        expect(result.enemySpawns[2].count).toBe(10);
     });

     it('single_lane forces one lane and funnels all spawns to lane 0', () => {
        const level = makeLevel();
        const mod: ChallengeModifier = { type: 'single_lane', value: 0 };
        const result = applyChallengeModifiers(level, [mod]);
        expect(result.laneCount).toBe(1);
        expect(result.enemySpawns.every((s) => s.lane === 0)).toBe(true);
     });

     it('fast_enemies threads a per-level enemy speed multiplier', () => {
        const level = makeLevel();
        const result = applyChallengeModifiers(level, [{ type: 'fast_enemies', value: 1.5 }]);
        expect(result.enemySpeedMultiplier).toBe(1.5);
     });

     it('combined modifiers fold correctly and do not mutate the original', () => {
        const level = makeLevel();
        const before = JSON.parse(JSON.stringify(level));
        const result = applyChallengeModifiers(level, [
            { type: 'double_enemies', value: 2 },
            { type: 'single_lane', value: 0 },
            { type: 'fast_enemies', value: 1.5 },
          ]);
        expect(result.laneCount).toBe(1);
        expect(result.enemySpawns.every((s) => s.lane === 0)).toBe(true);
        expect(result.enemySpawns[0].count).toBe(6);      // 3 x 2
        expect(result.enemySpeedMultiplier).toBe(1.5);

         // purity: the original definition is untouched
        expect(level).toEqual(before);
        expect(level.laneCount).toBe(3);
        expect(level.enemySpawns[1].count).toBe(4);
        expect(level.enemySpeedMultiplier).toBeUndefined();
     });

     it('an un-honored modifier is a safe no-op', () => {
        const level = makeLevel();
        const result = applyChallengeModifiers(level, [{ type: 'precision_mode', value: 0.5 }]);
        expect(result).toEqual(level);              // no field changed
     });

     it('the generator only ever emits honored modifiers', () => {
        for (let i = 0; i < 300; i++) {
            const c = generateDailyChallenge(`2027-${String((i % 12) + 1).padStart(2, '0')}-10`);
            for (const m of c.modifiers) {
                expect(HONORED_MODIFIERS).toContain(m.type);
             }
        }
     });
});

});


describe('P1-1b review fix — parseForceLevel guards the ?cmForceLevel dev hook (#25 F1)', () => {
        // An out-of-range or non-numeric override must be ignored (return null),
        // not crash getLevel() at boot. The fix makes this explicit + testable.
    it('accepts a valid in-range index', () => {
        expect(parseForceLevel('0', TOTAL_LEVELS)).toBe(0);
        expect(parseForceLevel('42', TOTAL_LEVELS)).toBe(42);
        expect(parseForceLevel(String(TOTAL_LEVELS - 1), TOTAL_LEVELS)).toBe(TOTAL_LEVELS - 1);
      });

    it('rejects out-of-range indices', () => {
        expect(parseForceLevel(String(TOTAL_LEVELS), TOTAL_LEVELS)).toBeNull();
        expect(parseForceLevel(String(TOTAL_LEVELS + 100), TOTAL_LEVELS)).toBeNull();
        expect(parseForceLevel('-1', TOTAL_LEVELS)).toBeNull();
      });

    it('rejects non-numeric / empty / whitespace input', () => {
        expect(parseForceLevel('', TOTAL_LEVELS)).toBeNull();
        expect(parseForceLevel('     ', TOTAL_LEVELS)).toBeNull();
        expect(parseForceLevel('abc', TOTAL_LEVELS)).toBeNull();
      });

    it('tolerates surrounding whitespace but is otherwise strict', () => {
        expect(parseForceLevel(' 7 ', TOTAL_LEVELS)).toBe(7);
      });

});