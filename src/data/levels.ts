import type { LevelDefinition } from './types';

/**
 * 18 hand-authored levels for Chicken Mob v2.
 *
 * Difficulty pacing:
 *   1–3   Tutorial (single lane, positive gates)                 ~90% win rate
 *   4–6   Mechanics Intro (multi-lane, traps, scouts)           ~85% win rate
 *   7–9   First Spike (brutes, hay bales, scarecrows)            ~70% win rate
 *   10–12 Multi-Lane (three lanes, mixed gates)                 ~60% win rate
 *   13–15 Sniper Intro (snipers, high armor, complex layouts)   ~50% win rate
 *   16–18 Boss Wave (heavy defenses, swarm mechanics)            ~40% win rate
 *
 * Note: Gate and obstacle widths are normalized (0-1) for collision detection.
 *       DO NOT use enemy_spawn gate type - use enemySpawns array instead.
 */
export const LEVELS: LevelDefinition[] = [
    // ═══════════════════════════════════════════════════════════════
    // TUTORIAL ARC (L1–3) — 90%+ win rate
    // ═══════════════════════════════════════════════════════════════

    // ─── L1: First Steps ────────────────────────────────────────────
    {
        id: 'level_01',
        name: 'First Steps',
        laneCount: 1,
        length: 800,
        gates: [
            { id: 'g1', position: 0.5, lane: 0, x: 0.5, width: 0.08, multiplier: 2, isPositive: true, type: 'multiply' },
        ],
        obstacles: [],
        enemySpawns: [],
        fort: { hp: 12, armorMultiplier: 1, rewardMultiplier: 1 },
        rewardCorn: 30,
        rewardFeathers: 0,
    },

    // ─── L2: Double Up ─────────────────────────────────────────────
    {
        id: 'level_02',
        name: 'Double Up',
        laneCount: 1,
        length: 800,
        gates: [
            { id: 'g1', position: 0.35, lane: 0, x: 0.5, width: 0.08, multiplier: 2, isPositive: true, type: 'multiply' },
            { id: 'g2', position: 0.65, lane: 0, x: 0.5, width: 0.08, multiplier: 2, isPositive: true, type: 'multiply' },
        ],
        obstacles: [],
        enemySpawns: [],
        fort: { hp: 18, armorMultiplier: 1, rewardMultiplier: 1 },
        rewardCorn: 40,
        rewardFeathers: 0,
    },

    // ─── L3: Big Boost ──────────────────────────────────────────────
    {
        id: 'level_03',
        name: 'Big Boost',
        laneCount: 1,
        length: 800,
        gates: [
            { id: 'g1', position: 0.5, lane: 0, x: 0.5, width: 0.08, multiplier: 3, isPositive: true, type: 'multiply' },
        ],
        obstacles: [],
        enemySpawns: [],
        fort: { hp: 25, armorMultiplier: 1, rewardMultiplier: 1 },
        rewardCorn: 50,
        rewardFeathers: 0,
    },

    // ═══════════════════════════════════════════════════════════════
    // MECHANICS INTRO (L4–6) — 85%+ win rate
    // ═══════════════════════════════════════════════════════════════

    // ─── L4: Crossroads ─────────────────────────────────────────────
    {
        id: 'level_04',
        name: 'Crossroads',
        laneCount: 2,
        length: 800,
        gates: [
            { id: 'g1', position: 0.45, lane: 0, x: 0.25, width: 0.08, multiplier: 2, isPositive: true, type: 'multiply' },
            { id: 'g2', position: 0.45, lane: 1, x: 0.75, width: 0.08, multiplier: 3, isPositive: true, type: 'multiply' },
        ],
        obstacles: [],
        enemySpawns: [],
        fort: { hp: 32, armorMultiplier: 1, rewardMultiplier: 1 },
        rewardCorn: 65,
        rewardFeathers: 0,
    },

    // ─── L5: Fox Alert ───────────────────────────────────────────────
    {
        id: 'level_05',
        name: 'Fox Alert',
        laneCount: 1,
        length: 900,
        gates: [
            { id: 'g1', position: 0.3, lane: 0, x: 0.5, width: 0.08, multiplier: 3, isPositive: true, type: 'multiply' },
            { id: 'g2', position: 0.6, lane: 0, x: 0.5, width: 0.08, multiplier: 4, isPositive: true, type: 'multiply' },
        ],
        obstacles: [],
        enemySpawns: [
            { time: 6, lane: 0, foxTypeId: 'fox_scout', count: 5 },
        ],
        fort: { hp: 40, armorMultiplier: 1, rewardMultiplier: 1 },
        rewardCorn: 80,
        rewardFeathers: 1,
    },

    // ─── L6: Trap Door ──────────────────────────────────────────────
    {
        id: 'level_06',
        name: 'Trap Door',
        laneCount: 2,
        length: 900,
        gates: [
            { id: 'g1', position: 0.4, lane: 0, x: 0.25, width: 0.08, multiplier: 3, isPositive: true, type: 'multiply' },
            { id: 'g2', position: 0.4, lane: 1, x: 0.75, width: 0.08, multiplier: 0.5, isPositive: false, type: 'multiply' },
        ],
        obstacles: [],
        enemySpawns: [],
        fort: { hp: 45, armorMultiplier: 1, rewardMultiplier: 1 },
        rewardCorn: 95,
        rewardFeathers: 1,
    },

    // ═══════════════════════════════════════════════════════════════
    // FIRST SPIKE (L7–9) — 70% win rate
    // ═══════════════════════════════════════════════════════════════

    // ─── L7: Fox Brute ───────────────────────────────────────────────
    {
        id: 'level_07',
        name: 'Fox Brute',
        laneCount: 1,
        length: 900,
        gates: [
            { id: 'g1', position: 0.3, lane: 0, x: 0.5, width: 0.08, multiplier: 3, isPositive: true, type: 'multiply' },
            { id: 'g2', position: 0.6, lane: 0, x: 0.5, width: 0.08, multiplier: 3, isPositive: true, type: 'multiply' },
        ],
        obstacles: [],
        enemySpawns: [
            { time: 8, lane: 0, foxTypeId: 'fox_brute', count: 3 },
        ],
        fort: { hp: 55, armorMultiplier: 1, rewardMultiplier: 1 },
        rewardCorn: 115,
        rewardFeathers: 1,
    },

    // ─── L8: Hay Day ─────────────────────────────────────────────────
    {
        id: 'level_08',
        name: 'Hay Day',
        laneCount: 1,
        length: 900,
        gates: [
            { id: 'g1', position: 0.25, lane: 0, x: 0.5, width: 0.08, multiplier: 2, isPositive: true, type: 'multiply' },
            { id: 'g2', position: 0.55, lane: 0, x: 0.5, width: 0.08, multiplier: 4, isPositive: true, type: 'multiply' },
            { id: 'g3', position: 0.8, lane: 0, x: 0.5, width: 0.08, multiplier: 2, isPositive: true, type: 'multiply' },
        ],
        obstacles: [
            { id: 'o1', type: 'hay_bale', lane: 0, x: 0.5, width: 0.08, position: 0.4, hp: 10, movementPattern: 'static' },
            { id: 'o2', type: 'hay_bale', lane: 0, x: 0.5, width: 0.08, position: 0.65, hp: 15, movementPattern: 'static' },
        ],
        enemySpawns: [
            { time: 5, lane: 0, foxTypeId: 'fox_scout', count: 6 },
        ],
        fort: { hp: 60, armorMultiplier: 1, rewardMultiplier: 1.2 },
        rewardCorn: 140,
        rewardFeathers: 1,
    },

    // ─── L9: Scarecrow Alley ─────────────────────────────────────────
    {
        id: 'level_09',
        name: 'Scarecrow Alley',
        laneCount: 1,
        length: 900,
        gates: [
            { id: 'g1', position: 0.4, lane: 0, x: 0.5, width: 0.08, multiplier: 4, isPositive: true, type: 'multiply' },
        ],
        obstacles: [
            // Scarecrow at edge - skilled players can dodge
            { id: 'o1', type: 'scarecrow', lane: 0, x: 0.2, width: 0.08, position: 0.55, hp: Infinity, movementPattern: 'rotate' },
        ],
        enemySpawns: [
            { time: 4, lane: 0, foxTypeId: 'fox_scout', count: 8 },
        ],
        fort: { hp: 70, armorMultiplier: 1, rewardMultiplier: 1 },
        rewardCorn: 165,
        rewardFeathers: 1,
    },

    // ═══════════════════════════════════════════════════════════════
    // MULTI-LANE (L10–12) — 60% win rate
    // ═══════════════════════════════════════════════════════════════

    // ─── L10: Three Ways ────────────────────────────────────────────
    {
        id: 'level_10',
        name: 'Three Ways',
        laneCount: 3,
        length: 1000,
        gates: [
            { id: 'g1', position: 0.4, lane: 0, x: 1/6, width: 0.08, multiplier: 2, isPositive: true, type: 'multiply' },
            { id: 'g2', position: 0.4, lane: 1, x: 0.5, width: 0.08, multiplier: 4, isPositive: true, type: 'multiply' },
            { id: 'g3', position: 0.4, lane: 2, x: 5/6, width: 0.08, multiplier: 3, isPositive: true, type: 'multiply' },
        ],
        obstacles: [],
        enemySpawns: [
            { time: 4, lane: 1, foxTypeId: 'fox_scout', count: 6 },
        ],
        fort: { hp: 80, armorMultiplier: 1, rewardMultiplier: 1 },
        rewardCorn: 195,
        rewardFeathers: 2,
    },

    // ─── L11: Fork ───────────────────────────────────────────────────
    {
        id: 'level_11',
        name: 'Fork',
        laneCount: 2,
        length: 1000,
        gates: [
            { id: 'g1', position: 0.25, lane: 0, x: 0.3, width: 0.08, multiplier: 2, isPositive: true, type: 'multiply' },
            { id: 'g2', position: 0.25, lane: 1, x: 0.7, width: 0.08, multiplier: 5, isPositive: true, type: 'multiply' },
            { id: 'g3', position: 0.55, lane: 0, x: 0.3, width: 0.08, multiplier: 0.5, isPositive: false, type: 'multiply' },
        ],
        obstacles: [],
        enemySpawns: [
            { time: 3, lane: 0, foxTypeId: 'fox_scout', count: 4 },
            { time: 3, lane: 1, foxTypeId: 'fox_scout', count: 4 },
        ],
        fort: { hp: 90, armorMultiplier: 1, rewardMultiplier: 1 },
        rewardCorn: 230,
        rewardFeathers: 2,
    },

    // ─── L12: Gauntlet ───────────────────────────────────────────────
    {
        id: 'level_12',
        name: 'Gauntlet',
        laneCount: 1,
        length: 1100,
        gates: [
            { id: 'g1', position: 0.2, lane: 0, x: 0.5, width: 0.08, multiplier: 2, isPositive: true, type: 'multiply' },
            { id: 'g2', position: 0.45, lane: 0, x: 0.5, width: 0.08, multiplier: 3, isPositive: true, type: 'multiply' },
            { id: 'g3', position: 0.7, lane: 0, x: 0.5, width: 0.08, multiplier: 2, isPositive: true, type: 'multiply' },
        ],
        obstacles: [
            { id: 'o1', type: 'fence', lane: 0, x: 0.5, width: 0.08, position: 0.35, hp: 12, movementPattern: 'static' },
            { id: 'o2', type: 'fence', lane: 0, x: 0.5, width: 0.08, position: 0.6, hp: 15, movementPattern: 'static' },
        ],
        enemySpawns: [
            { time: 6, lane: 0, foxTypeId: 'fox_brute', count: 3 },
        ],
        fort: { hp: 100, armorMultiplier: 1.2, rewardMultiplier: 1.5 },
        rewardCorn: 270,
        rewardFeathers: 2,
    },

    // ═══════════════════════════════════════════════════════════════
    // SNIPER INTRO (L13–15) — 50% win rate
    // ═══════════════════════════════════════════════════════════════

    // ─── L13: Sniper Den ─────────────────────────────────────────────
    {
        id: 'level_13',
        name: 'Sniper Den',
        laneCount: 2,
        length: 1100,
        gates: [
            { id: 'g1', position: 0.35, lane: 0, x: 0.25, width: 0.08, multiplier: 5, isPositive: true, type: 'multiply' },
            { id: 'g2', position: 0.35, lane: 1, x: 0.75, width: 0.08, multiplier: 2, isPositive: true, type: 'multiply' },
        ],
        obstacles: [],
        enemySpawns: [
            { time: 7, lane: 0, foxTypeId: 'fox_sniper', count: 3 },
        ],
        fort: { hp: 110, armorMultiplier: 1.2, rewardMultiplier: 1.5 },
        rewardCorn: 320,
        rewardFeathers: 2,
    },

    // ─── L14: Mixed Bag ──────────────────────────────────────────────
    {
        id: 'level_14',
        name: 'Mixed Bag',
        laneCount: 2,
        length: 1100,
        gates: [
            { id: 'g1', position: 0.3, lane: 0, x: 0.3, width: 0.08, multiplier: 3, isPositive: true, type: 'multiply' },
            { id: 'g2', position: 0.5, lane: 0, x: 0.3, width: 0.08, multiplier: 2, isPositive: true, type: 'multiply' },
            { id: 'g3', position: 0.4, lane: 1, x: 0.7, width: 0.08, multiplier: 4, isPositive: true, type: 'multiply' },
        ],
        obstacles: [
            { id: 'o1', type: 'fence', lane: 0, x: 0.3, width: 0.08, position: 0.4, hp: 18, movementPattern: 'static' },
            { id: 'o2', type: 'fence', lane: 0, x: 0.3, width: 0.08, position: 0.65, hp: 22, movementPattern: 'static' },
        ],
        enemySpawns: [
            { time: 4, lane: 0, foxTypeId: 'fox_brute', count: 2 },
            { time: 6, lane: 1, foxTypeId: 'fox_scout', count: 4 },
            { time: 9, lane: 0, foxTypeId: 'fox_scout', count: 3 },
        ],
        fort: { hp: 130, armorMultiplier: 1.3, rewardMultiplier: 1.8 },
        rewardCorn: 380,
        rewardFeathers: 3,
    },

    // ─── L15: Pressure Cooker ─────────────────────────────────────────
    {
        id: 'level_15',
        name: 'Pressure Cooker',
        laneCount: 1,
        length: 1200,
        gates: [
            { id: 'g1', position: 0.2, lane: 0, x: 0.5, width: 0.08, multiplier: 2, isPositive: true, type: 'multiply' },
            { id: 'g2', position: 0.45, lane: 0, x: 0.5, width: 0.08, multiplier: 3, isPositive: true, type: 'multiply' },
            { id: 'g3', position: 0.7, lane: 0, x: 0.5, width: 0.08, multiplier: 4, isPositive: true, type: 'multiply' },
        ],
        obstacles: [],
        enemySpawns: [
            { time: 5, lane: 0, foxTypeId: 'fox_brute', count: 3 },
            { time: 8, lane: 0, foxTypeId: 'fox_sniper', count: 3 },
        ],
        fort: { hp: 150, armorMultiplier: 1.4, rewardMultiplier: 2.0 },
        rewardCorn: 450,
        rewardFeathers: 3,
    },

    // ═══════════════════════════════════════════════════════════════
    // BOSS WAVE (L16–18) — 40% win rate
    // ═══════════════════════════════════════════════════════════════

    // ─── L16: The Wall ───────────────────────────────────────────────
    {
        id: 'level_16',
        name: 'The Wall',
        laneCount: 2,
        length: 1200,
        gates: [
            { id: 'g1', position: 0.25, lane: 0, x: 0.3, width: 0.08, multiplier: 3, isPositive: true, type: 'multiply' },
            { id: 'g2', position: 0.25, lane: 1, x: 0.7, width: 0.08, multiplier: 4, isPositive: true, type: 'multiply' },
            { id: 'g3', position: 0.55, lane: 0, x: 0.3, width: 0.08, multiplier: 2, isPositive: true, type: 'multiply' },
        ],
        obstacles: [
            { id: 'o1', type: 'fence', lane: 0, x: 0.3, width: 0.08, position: 0.4, hp: 25, movementPattern: 'static' },
            { id: 'o2', type: 'fence', lane: 1, x: 0.7, width: 0.08, position: 0.45, hp: 30, movementPattern: 'static' },
        ],
        enemySpawns: [
            { time: 5, lane: 0, foxTypeId: 'fox_brute', count: 3 },
            { time: 7, lane: 1, foxTypeId: 'fox_brute', count: 2 },
        ],
        fort: { hp: 180, armorMultiplier: 1.5, rewardMultiplier: 2.5 },
        rewardCorn: 520,
        rewardFeathers: 4,
    },

    // ─── L17: Swarm ──────────────────────────────────────────────────
    {
        id: 'level_17',
        name: 'Swarm',
        laneCount: 3,
        length: 1300,
        gates: [
            { id: 'g1', position: 0.3, lane: 0, x: 1/6, width: 0.08, multiplier: 2, isPositive: true, type: 'multiply' },
            { id: 'g2', position: 0.3, lane: 1, x: 0.5, width: 0.08, multiplier: 5, isPositive: true, type: 'multiply' },
            { id: 'g3', position: 0.3, lane: 2, x: 5/6, width: 0.08, multiplier: 3, isPositive: true, type: 'multiply' },
            { id: 'g4', position: 0.55, lane: 1, x: 0.5, width: 0.08, multiplier: 2, isPositive: true, type: 'multiply' },
        ],
        obstacles: [],
        enemySpawns: [
            { time: 3, lane: 0, foxTypeId: 'fox_scout', count: 4 },
            { time: 3, lane: 1, foxTypeId: 'fox_scout', count: 4 },
            { time: 3, lane: 2, foxTypeId: 'fox_scout', count: 4 },
            { time: 6, lane: 0, foxTypeId: 'fox_brute', count: 2 },
            { time: 6, lane: 2, foxTypeId: 'fox_brute', count: 2 },
            { time: 9, lane: 1, foxTypeId: 'fox_sniper', count: 2 },
        ],
        fort: { hp: 200, armorMultiplier: 1.6, rewardMultiplier: 3.0 },
        rewardCorn: 580,
        rewardFeathers: 4,
    },

    // ─── L18: Henhouse Siege ─────────────────────────────────────────
    {
        id: 'level_18',
        name: 'Henhouse Siege',
        laneCount: 3,
        length: 1400,
        gates: [
            { id: 'g1', position: 0.2, lane: 0, x: 1/6, width: 0.08, multiplier: 2, isPositive: true, type: 'multiply' },
            { id: 'g2', position: 0.2, lane: 1, x: 0.5, width: 0.08, multiplier: 10, isPositive: true, type: 'multiply' },
            { id: 'g3', position: 0.45, lane: 1, x: 0.5, width: 0.08, multiplier: 3, isPositive: true, type: 'multiply' },
            { id: 'g4', position: 0.45, lane: 0, x: 1/6, width: 0.08, multiplier: 0.5, isPositive: false, type: 'multiply' },
            { id: 'g5', position: 0.45, lane: 2, x: 5/6, width: 0.08, multiplier: 2, isPositive: true, type: 'multiply' },
        ],
        obstacles: [
            { id: 'o1', type: 'scarecrow', lane: 0, x: 1/6, width: 0.08, position: 0.35, hp: Infinity, movementPattern: 'rotate' },
            { id: 'o2', type: 'scarecrow', lane: 2, x: 5/6, width: 0.08, position: 0.6, hp: Infinity, movementPattern: 'rotate' },
        ],
        enemySpawns: [
            { time: 4, lane: 0, foxTypeId: 'fox_brute', count: 2 },
            { time: 5, lane: 1, foxTypeId: 'fox_brute', count: 2 },
            { time: 6, lane: 2, foxTypeId: 'fox_brute', count: 2 },
            { time: 8, lane: 1, foxTypeId: 'fox_sniper', count: 2 },
            { time: 10, lane: 0, foxTypeId: 'fox_sniper', count: 2 },
        ],
        fort: { hp: 250, armorMultiplier: 1.8, rewardMultiplier: 3.5 },
        rewardCorn: 600,
        rewardFeathers: 5,
    },
];

export function getLevel(index: number): LevelDefinition {
    if (index < 0 || index >= LEVELS.length) {
        throw new Error(`Level index out of range: ${index}`);
    }
    return LEVELS[index];
}

export const TOTAL_LEVELS = LEVELS.length;
