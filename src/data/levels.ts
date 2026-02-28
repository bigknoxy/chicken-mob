import type { LevelDefinition } from './types';

/**
 * 15 hand-authored levels for Chicken Mob v1.
 *
 * Difficulty pacing:
 *   1–5   Tutorial (single lane, positive gates, no foxes) ~90% win rate
 *   6–10  Introduce foxes, traps, obstacles              ~75% win rate
 *   11–15 Multi-lane, complex layouts, boss waves         ~60% win rate
 */
export const LEVELS: LevelDefinition[] = [
    // ─── TUTORIAL ARC (1–5) ──────────────────────────────────────
    {
        id: 'level_01',
        name: 'First Flock',
        laneCount: 1,
        length: 800,
        gates: [
            { id: 'g1', position: 0.5, lane: 0, width: 60, multiplier: 2, isPositive: true },
        ],
        obstacles: [],
        enemySpawns: [],
        fort: { hp: 10, armorMultiplier: 1, rewardMultiplier: 1 },
        rewardCorn: 30,
        rewardFeathers: 0,
    },
    {
        id: 'level_02',
        name: 'Double Trouble',
        laneCount: 1,
        length: 800,
        gates: [
            { id: 'g1', position: 0.35, lane: 0, width: 60, multiplier: 2, isPositive: true },
            { id: 'g2', position: 0.65, lane: 0, width: 60, multiplier: 2, isPositive: true },
        ],
        obstacles: [],
        enemySpawns: [],
        fort: { hp: 15, armorMultiplier: 1, rewardMultiplier: 1 },
        rewardCorn: 40,
        rewardFeathers: 0,
    },
    {
        id: 'level_03',
        name: 'Big Boost',
        laneCount: 1,
        length: 800,
        gates: [
            { id: 'g1', position: 0.5, lane: 0, width: 60, multiplier: 3, isPositive: true },
        ],
        obstacles: [],
        enemySpawns: [],
        fort: { hp: 20, armorMultiplier: 1, rewardMultiplier: 1 },
        rewardCorn: 50,
        rewardFeathers: 0,
    },
    {
        id: 'level_04',
        name: 'Fork in the Road',
        laneCount: 2,
        length: 800,
        gates: [
            { id: 'g1', position: 0.45, lane: 0, width: 60, multiplier: 2, isPositive: true },
            { id: 'g2', position: 0.45, lane: 1, width: 60, multiplier: 3, isPositive: true },
        ],
        obstacles: [],
        enemySpawns: [],
        fort: { hp: 25, armorMultiplier: 1, rewardMultiplier: 1 },
        rewardCorn: 60,
        rewardFeathers: 0,
    },
    {
        id: 'level_05',
        name: 'First Fence',
        laneCount: 1,
        length: 800,
        gates: [
            { id: 'g1', position: 0.35, lane: 0, width: 60, multiplier: 3, isPositive: true },
        ],
        obstacles: [
            { id: 'o1', type: 'fence', lane: 0, position: 0.6, hp: 10, movementPattern: 'static' },
        ],
        enemySpawns: [],
        fort: { hp: 30, armorMultiplier: 1, rewardMultiplier: 1 },
        rewardCorn: 75,
        rewardFeathers: 1,
    },

    // ─── FOXES & TRAPS (6–10) ──────────────────────────────────
    {
        id: 'level_06',
        name: 'Fox Alert',
        laneCount: 1,
        length: 900,
        gates: [
            { id: 'g1', position: 0.3, lane: 0, width: 60, multiplier: 2, isPositive: true },
            { id: 'g2', position: 0.55, lane: 0, width: 60, multiplier: 3, isPositive: true },
        ],
        obstacles: [],
        enemySpawns: [
            { time: 6, lane: 0, foxTypeId: 'fox_scout', count: 5 },
        ],
        fort: { hp: 35, armorMultiplier: 1, rewardMultiplier: 1 },
        rewardCorn: 90,
        rewardFeathers: 1,
    },
    {
        id: 'level_07',
        name: 'Trap Lane',
        laneCount: 2,
        length: 900,
        gates: [
            { id: 'g1', position: 0.4, lane: 0, width: 60, multiplier: 3, isPositive: true },
            { id: 'g2', position: 0.4, lane: 1, width: 60, multiplier: 0.5, isPositive: false },
        ],
        obstacles: [
            { id: 'o1', type: 'fence', lane: 0, position: 0.65, hp: 15, movementPattern: 'static' },
        ],
        enemySpawns: [
            { time: 4, lane: 0, foxTypeId: 'fox_scout', count: 3 },
        ],
        fort: { hp: 40, armorMultiplier: 1, rewardMultiplier: 1 },
        rewardCorn: 110,
        rewardFeathers: 1,
    },
    {
        id: 'level_08',
        name: 'Hay Day',
        laneCount: 1,
        length: 900,
        gates: [
            { id: 'g1', position: 0.25, lane: 0, width: 60, multiplier: 2, isPositive: true },
            { id: 'g2', position: 0.55, lane: 0, width: 60, multiplier: 5, isPositive: true },
        ],
        obstacles: [
            { id: 'o1', type: 'hay_bale', lane: 0, position: 0.4, hp: 8, movementPattern: 'static' },
            { id: 'o2', type: 'hay_bale', lane: 0, position: 0.7, hp: 12, movementPattern: 'static' },
        ],
        enemySpawns: [
            { time: 5, lane: 0, foxTypeId: 'fox_scout', count: 4 },
        ],
        fort: { hp: 50, armorMultiplier: 1, rewardMultiplier: 1.2 },
        rewardCorn: 130,
        rewardFeathers: 1,
    },
    {
        id: 'level_09',
        name: 'Scarecrow Alley',
        laneCount: 1,
        length: 900,
        gates: [
            { id: 'g1', position: 0.35, lane: 0, width: 60, multiplier: 3, isPositive: true },
        ],
        obstacles: [
            { id: 'o1', type: 'scarecrow', lane: 0, position: 0.55, hp: Infinity, movementPattern: 'rotate' },
        ],
        enemySpawns: [
            { time: 4, lane: 0, foxTypeId: 'fox_scout', count: 6 },
        ],
        fort: { hp: 55, armorMultiplier: 1, rewardMultiplier: 1 },
        rewardCorn: 150,
        rewardFeathers: 1,
    },
    {
        id: 'level_10',
        name: 'Fox Brute',
        laneCount: 1,
        length: 1000,
        gates: [
            { id: 'g1', position: 0.3, lane: 0, width: 60, multiplier: 3, isPositive: true },
            { id: 'g2', position: 0.6, lane: 0, width: 60, multiplier: 2, isPositive: true },
        ],
        obstacles: [
            { id: 'o1', type: 'fence', lane: 0, position: 0.75, hp: 25, movementPattern: 'static' },
        ],
        enemySpawns: [
            { time: 8, lane: 0, foxTypeId: 'fox_brute', count: 3 },
        ],
        fort: { hp: 70, armorMultiplier: 1.2, rewardMultiplier: 1.5 },
        rewardCorn: 180,
        rewardFeathers: 2,
    },

    // ─── ADVANCED LEVELS (11–15) ──────────────────────────────
    {
        id: 'level_11',
        name: 'Three Lanes',
        laneCount: 3,
        length: 1000,
        gates: [
            { id: 'g1', position: 0.4, lane: 0, width: 60, multiplier: 2, isPositive: true },
            { id: 'g2', position: 0.4, lane: 1, width: 60, multiplier: 5, isPositive: true },
            { id: 'g3', position: 0.4, lane: 2, width: 60, multiplier: 0.3, isPositive: false },
        ],
        obstacles: [],
        enemySpawns: [
            { time: 3, lane: 1, foxTypeId: 'fox_scout', count: 8 },
        ],
        fort: { hp: 80, armorMultiplier: 1.2, rewardMultiplier: 1.5 },
        rewardCorn: 220,
        rewardFeathers: 2,
    },
    {
        id: 'level_12',
        name: 'Gauntlet',
        laneCount: 1,
        length: 1100,
        gates: [
            { id: 'g1', position: 0.2, lane: 0, width: 60, multiplier: 2, isPositive: true },
            { id: 'g2', position: 0.45, lane: 0, width: 60, multiplier: 3, isPositive: true },
            { id: 'g3', position: 0.7, lane: 0, width: 60, multiplier: 2, isPositive: true },
        ],
        obstacles: [
            { id: 'o1', type: 'fence', lane: 0, position: 0.35, hp: 20, movementPattern: 'static' },
            { id: 'o2', type: 'fence', lane: 0, position: 0.6, hp: 25, movementPattern: 'static' },
            { id: 'o3', type: 'scarecrow', lane: 0, position: 0.8, hp: Infinity, movementPattern: 'back_and_forth' },
        ],
        enemySpawns: [
            { time: 6, lane: 0, foxTypeId: 'fox_brute', count: 4 },
        ],
        fort: { hp: 100, armorMultiplier: 1.3, rewardMultiplier: 1.5 },
        rewardCorn: 270,
        rewardFeathers: 2,
    },
    {
        id: 'level_13',
        name: 'Fox Sniper Den',
        laneCount: 2,
        length: 1100,
        gates: [
            { id: 'g1', position: 0.35, lane: 0, width: 60, multiplier: 5, isPositive: true },
            { id: 'g2', position: 0.35, lane: 1, width: 60, multiplier: 2, isPositive: true },
        ],
        obstacles: [
            { id: 'o1', type: 'hay_bale', lane: 0, position: 0.55, hp: 15, movementPattern: 'static' },
        ],
        enemySpawns: [
            { time: 7, lane: 0, foxTypeId: 'fox_sniper', count: 3 },
        ],
        fort: { hp: 120, armorMultiplier: 1.4, rewardMultiplier: 1.8 },
        rewardCorn: 330,
        rewardFeathers: 3,
    },
    {
        id: 'level_14',
        name: 'Last Stand',
        laneCount: 2,
        length: 1200,
        gates: [
            { id: 'g1', position: 0.25, lane: 0, width: 60, multiplier: 3, isPositive: true },
            { id: 'g2', position: 0.5, lane: 0, width: 60, multiplier: 3, isPositive: true },
            { id: 'g3', position: 0.5, lane: 1, width: 60, multiplier: 0.5, isPositive: false },
        ],
        obstacles: [
            { id: 'o1', type: 'fence', lane: 0, position: 0.38, hp: 20, movementPattern: 'static' },
            { id: 'o2', type: 'fence', lane: 0, position: 0.65, hp: 25, movementPattern: 'static' },
            { id: 'o3', type: 'fence', lane: 1, position: 0.7, hp: 30, movementPattern: 'static' },
        ],
        enemySpawns: [
            { time: 5, lane: 0, foxTypeId: 'fox_brute', count: 5 },
            { time: 10, lane: 1, foxTypeId: 'fox_scout', count: 5 },
        ],
        fort: { hp: 150, armorMultiplier: 1.5, rewardMultiplier: 2.0 },
        rewardCorn: 400,
        rewardFeathers: 3,
    },
    {
        id: 'level_15',
        name: 'The Henhouse Boss',
        laneCount: 3,
        length: 1300,
        gates: [
            { id: 'g1', position: 0.2, lane: 0, width: 60, multiplier: 2, isPositive: true },
            { id: 'g2', position: 0.2, lane: 1, width: 60, multiplier: 5, isPositive: true },
            { id: 'g3', position: 0.45, lane: 1, width: 60, multiplier: 10, isPositive: true },
            { id: 'g4', position: 0.45, lane: 0, width: 60, multiplier: 0.3, isPositive: false },
            { id: 'g5', position: 0.45, lane: 2, width: 60, multiplier: 0.5, isPositive: false },
        ],
        obstacles: [
            { id: 'o1', type: 'scarecrow', lane: 0, position: 0.35, hp: Infinity, movementPattern: 'rotate' },
            { id: 'o2', type: 'scarecrow', lane: 2, position: 0.55, hp: Infinity, movementPattern: 'back_and_forth' },
            { id: 'o3', type: 'fence', lane: 1, position: 0.65, hp: 30, movementPattern: 'static' },
        ],
        enemySpawns: [
            { time: 4, lane: 0, foxTypeId: 'fox_brute', count: 5 },
            { time: 6, lane: 1, foxTypeId: 'fox_brute', count: 5 },
            { time: 8, lane: 2, foxTypeId: 'fox_sniper', count: 4 },
            { time: 12, lane: 1, foxTypeId: 'fox_sniper', count: 4 },
        ],
        fort: { hp: 250, armorMultiplier: 1.8, rewardMultiplier: 3.0 },
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
