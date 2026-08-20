/**
 * ChallengeSystem — Deterministic daily-challenge generation + streak tracking.
 *
 * A new "daily challenge" is generated every UTC calendar day. Its `id` is the
 * UTC day string ('YYYY-MM-DD'); every field (seed, level, modifiers, reward)
 * derives deterministically from that id, so all players see the *same* challenge
 * for the same day and re-running the generator never drifts. This is the retention
 * hook: "come back tomorrow for a fresh challenge + a streak bonus."
 *
 * Mirrors the proven DailyLoginSystem idiom: pure functions, UTC day-keys,
 * streak capping/wrapping, and idempotent per-day completion.
 *
 * Deferred to P1-1b: applying modifiers to the live simulation and the visible
 * ChallengeScreen UI. This module ships the tested engine + a seam.
 */

import type {
    PlayerState,
    DailyChallenge,
    ChallengeModifier,
    ChallengeModifierType,
    ChallengeReward,
    ChallengeProgress,
} from '@/data/types';

export const MAX_CHALLENGE_STREAK = 7;
/** Default level pool for challenge selection — W1+W2 give 36 guaranteed-valid
 *  indices (0-based, into the flat LEVELS array), so the emitted index is always
 *  in range and getLevel() never throws. */
export const DEFAULT_CHALLENGE_LEVEL_POOL = 36;

/** Legal modifier pool with per-type difficulty weight and default value. */
const MODIFIER_TABLE: Record<ChallengeModifierType, number> = {
     // value is the modifier's effect magnitude (see ChallengeModifier.value in types.ts)
    double_enemies: 2,
    stunted_chickens: 0.5,
    no_upgrades: 1,
    fast_enemies: 1.5,
    blind_gates: 1,
    single_lane: 0,
    precision_mode: 0.5,
};

export const MODIFIER_POOL = Object.keys(MODIFIER_TABLE) as ChallengeModifierType[];

// ── Seeded RNG (Mulberry32) — deterministic, no Math.random in the hot path ──

function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
      }
    return Math.abs(hash);
}

function createSeededRandom(seed: number): () => number {
    let state = seed >>> 0;
    return function () {
        state += 0x6d2b79f5;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
}

// ── Date helpers (UTC) ──

/** UTC calendar-day key for an epoch-millis timestamp, 'YYYY-MM-DD'. */
export function utcDayKey(ms: number): string {
    const d = new Date(ms);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** UTC calendar-day key for "now". */
export function todayUtdKey(nowMs: number = Date.now()): string {
    return utcDayKey(nowMs);
}

/** UTC calendar-day key `n` days before the given key's day. */
function dayKeyOffset(dayKey: string, n: number): string {
    const [y, m, d] = dayKey.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + n);
    return utcDayKey(dt.getTime());
}

/** End of the given UTC day (just before midnight), in epoch ms. */
function endOfDayMs(dayKey: string): number {
    const [y, m, d] = dayKey.split('-').map(Number);
    return Date.UTC(y, m - 1, d, 23, 59, 59, 999);
}

// ── Generation ──

function selectModifiers(rng: () => number): ChallengeModifier[] {
    const available = [...MODIFIER_POOL];
     // Fisher–Yates shuffle with the seeded RNG (deterministic)
     for (let i = available.length - 1; i > 0; i--) {
         const j = Math.floor(rng() * (i + 1));
         [available[i], available[j]] = [available[j], available[i]];
     }

     // Target difficulty scales the modifier count: 1–3 modifiers.
     const targetCount = 1 + Math.floor(rng() * 3);
    const count = Math.min(targetCount, available.length);

    const modifiers: ChallengeModifier[] = [];
    for (let i = 0; i < count; i++) {
         const type = available[i];
         modifiers.push({ type, value: MODIFIER_TABLE[type] });
      }
    return modifiers;
}

/** Pick a 0-based flat level index within `[1, poolSize)`, always in range. */
function selectLevelIndex(rng: () => number, levelPoolSize: number): number {
    const pool = Math.max(2, Math.floor(levelPoolSize));
    return 1 + Math.floor(rng() * (pool - 1));
}

/** Base reward by difficulty tier. */
function baseReward(tier: number): ChallengeReward {
    return { corn: 100 + (tier - 1) * 50, goldenFeather: 0 };
}

export interface GenerateOptions {
    levelPoolSize?: number;    // override the default 36 (W1+W2)
}

/**
 * Generate the deterministic daily challenge for a UTC day.
 * Pure: identical (dayKey) → identical output. No Math.random, no clock.
 */
export function generateDailyChallenge(dayKey: string, opts: GenerateOptions = {}): DailyChallenge {
    const levelPoolSize = opts.levelPoolSize ?? DEFAULT_CHALLENGE_LEVEL_POOL;
    const seed = hashString(dayKey);
    const rng = createSeededRandom(seed);

     // Difficulty tier 1..3
    const difficultyTier = 1 + Math.floor(rng() * 3);

     // Shuffle + select so each draw consumes RNG state in a stable order
    const modifiers = selectModifiers(rng);
    const levelIndex = selectLevelIndex(rng, levelPoolSize);

    return {
         id: dayKey,
        seed,
        levelIndex,
        difficultyTier,
        modifiers,
        reward: baseReward(difficultyTier),
        expiresAtMs: endOfDayMs(dayKey),
    };
}

/** The challenge for "now" (a thin, injectable wrapper for boot wiring). */
export function getCurrentChallenge(nowMs: number = Date.now()): DailyChallenge {
    return generateDailyChallenge(todayUtdKey(nowMs));
}

// ── Streak / progress (mirrors DailyLoginSystem) ──

export function getChallengeProgress(playerState: PlayerState): ChallengeProgress {
    return playerState.challengeProgress ?? {
         lastCompletedDate: null,
         consecutiveCompletions: 0,
         longestStreak: 0,
         totalCompleted: 0,
         completedToday: false,
    };
}

/** Is a completion of today's challenge still available (not yet done today)? */
export function isChallengeFreshToday(playerState: PlayerState, nowMs: number = Date.now()): boolean {
    const progress = getChallengeProgress(playerState);
    return !(progress.lastCompletedDate === todayUtdKey(nowMs) && progress.completedToday);
}

export interface ChallengeCompletion {
    reward: ChallengeReward;        // actual payout (streak-multiplied)
    newStreak: number;             // streak after this completion (1..7)
    longestStreak: number;
    isStreakBroken: boolean;       // the gap that reset the streak
    isCycleStart: boolean;         // this completion began a fresh streak/wrapped
}

/**
 * Award base + streak bonus. Idempotent per UTC day (AC-5). Mutates playerState.
 * Returns null if the challenge was already completed today.
 */
export function completeChallenge(
    playerState: PlayerState,
    challenge: DailyChallenge,
    nowMs: number = Date.now(),
): ChallengeCompletion | null {
    const progress = getChallengeProgress(playerState);
    const today = todayUtdKey(nowMs);
    const yesterday = dayKeyOffset(today, -1);

     // Idempotent: already completed today → no double reward (AC-5)
    if (progress.lastCompletedDate === today && progress.completedToday) {
        return null;
     }

     // Determine the new streak (mirrors checkDailyLogin's cadence)
    let isStreakBroken = false;
    let newStreak: number;
    if (progress.lastCompletedDate === null) {
        newStreak = 1;
     } else if (progress.lastCompletedDate === yesterday) {
        newStreak = progress.consecutiveCompletions + 1;
     } else {
        newStreak = 1;
        isStreakBroken = true;
     }

     // Wrap at the cap: 7th is the jackpot, then a fresh cycle begins
    let isCycleStart = newStreak === 1 && progress.lastCompletedDate !== null;
    if (newStreak > MAX_CHALLENGE_STREAK) {
        newStreak = 1;
      }
    isCycleStart = isCycleStart || (newStreak === 1 && progress.consecutiveCompletions >= MAX_CHALLENGE_STREAK);

     // Reward: base (by tier) + streak multiplier (up to +50% at a full 7-day streak),
     // plus exactly one golden feather on the 7th consecutive completion
    const streakMult = 1 + ((newStreak - 1) / MAX_CHALLENGE_STREAK) * 0.5;
    const reward: ChallengeReward = {
         corn: Math.floor(challenge.reward.corn * streakMult),
         goldenFeather: newStreak === MAX_CHALLENGE_STREAK ? 1 : 0,
    };

     // Persist
    playerState.challengeProgress = {
        lastCompletedDate: today,
        consecutiveCompletions: newStreak,
        longestStreak: Math.max(progress.longestStreak, newStreak),
        totalCompleted: progress.totalCompleted + 1,
        completedToday: true,
     };

     // Credit currencies
    playerState.currencies.corn += reward.corn;
    if (reward.goldenFeather > 0) {
        playerState.currencies.golden_feather += reward.goldenFeather;
    }
    playerState.totalCornEarned += reward.corn;

    return {
        reward,
        newStreak,
        longestStreak: playerState.challengeProgress.longestStreak,
        isStreakBroken,
        isCycleStart,
      };
}
