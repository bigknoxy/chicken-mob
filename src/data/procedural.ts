/**
 * Procedural helpers for deterministic, seed-based content generation.
 * Provides seedable PRNG and array/number/shuffle utilities with full determinism.
 */

// --- PRNG base utils: cyrb128 hash + sfc32 generator ---

export function cyrb128(str: string): [number, number, number, number] {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    h1 ^= (h2 ^ h3 ^ h4), h2 ^= h1, h3 ^= h1, h4 ^= h1;
    return [h1>>>0, h2>>>0, h3>>>0, h4>>>0];
}

export function sfc32(a: number, b: number, c: number, d: number) {
    return function() {
        a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
        var t = (a + b) | 0;
        t = (t + d) | 0;
        d = (d + 1) | 0;
        a = b ^ (b >>> 9);
        b = (c + (c << 3)) | 0;
        c = (c << 21) | (c >>> 11);
        c = (c + t) | 0;
        return (t >>> 0) / 4294967296;
    };
}

export function getSeededPRNG(seed: string): () => number {
    const state = cyrb128(seed);
    return sfc32(state[0], state[1], state[2], state[3]);
}

// --- Helper utilities for deterministic content generation ---

export function randomInt(prng: () => number, min: number, max: number): number {
    // Return integer in [min, max]
    return Math.floor(prng() * (max - min + 1)) + min;
}

export function randomChoice<T>(prng: () => number, arr: T[]): T {
    return arr[Math.floor(prng() * arr.length)];
}

export function shuffle<T>(prng: () => number, array: T[]): T[] {
    // Fisher-Yates shuffle (returns a new array)
    const a = array.slice();
    for(let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(prng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// --- Deterministic variant ID generator ---

export function getVariantSeed(baseSeed: string, variant: number): string {
    return `${baseSeed}::variant${variant}`;
}


// --- Procedural Level Generator System ---

/**
 * Procedural level shape generation for Chicken Mob.
 *
 * - Uses sfc32 w/ cyrb128 seeding for FULL determinism.
 * - Provides 7+ distinct, human-designed level variants (mutation templates).
 * - Each variant mutates gates, enemy packs, AND a dynamic modifier (obstacles or reward mods).
 * - Variants are rotated by session/run using (sessionSeed % NUM_VARIANTS) or cycling helper.
 * - Generated levels are always valid LevelDefinition.
 *
 * To add a variant: implement a generator in VARIANT_GENERATORS and update VARIANT_NAMES.
 **/

import type { LevelDefinition, GateDefinition, ObstacleDefinition, EnemySpawn, FoxFortDefinition } from './types';
import { FOXES } from './foxes';

export const VARIANT_NAMES = [
    'Gauntlet',
    'Multiplication Mayhem',
    'Trap Alley',
    'Fox Swarm',
    'Maze Gates',
    'Obstacle Overload',
    'Timed Blitz',
];

export const NUM_PROCEDURAL_VARIANTS = VARIANT_NAMES.length;

/**
 * Pick variant deterministically for a session (use session seed or run index)
 */
export function getProceduralVariantIdx(sessionSeed: string, levelNum: number): number {
    // Example: rotate variants per session and level
    // Using a PRNG for extra entropy so back-to-back runs feel different
    const prng = getSeededPRNG(getVariantSeed(sessionSeed, levelNum));
    return randomInt(prng, 0, NUM_PROCEDURAL_VARIANTS - 1);
}

/**
 * Main entry: generate procedural level
 * @param baseSeed unique string for the session or player
 * @param variantIdx which variant shape (0..N-1)
 * @param difficulty stage/difficulty tuning (optional, default 1)
 */
export function generateProceduralLevel(baseSeed: string, variantIdx: number, difficulty: number = 1): LevelDefinition {
    if (variantIdx < 0 || variantIdx >= NUM_PROCEDURAL_VARIANTS) {
        throw new Error(`Invalid variantIdx: ${variantIdx}`);
    }
    // Each variant must be deterministic by PRNG, accept seed and difficulty.
    return VARIANT_GENERATORS[variantIdx](baseSeed, difficulty);
}

// --- VARIANT GENERATOR REGISTRY ---
export type VariantGenerator = (seed: string, difficulty: number) => LevelDefinition;
export const VARIANT_GENERATORS: VariantGenerator[] = [
    generateGauntlet,
    generateMultiplicationMayhem,
    generateTrapAlley,
    generateFoxSwarm,
    generateMazeGates,
    generateObstacleOverload,
    generateTimedBlitz,
    // Add new variants here
];

/***********************************************************
 * 1. 'Gauntlet' Variant
 *    - Linear with escalating enemies, normal gates, sparse obstacles.
 *    - Difficulty controls enemy numbers/fort hp.
 ***********************************************************/
function generateGauntlet(seed: string, difficulty: number): LevelDefinition {
    const prng = getSeededPRNG(seed + ':gauntlet:' + difficulty);
    const laneCount = 1 + Math.floor(difficulty / 3);
    const length = 900 + 50 * difficulty;
    const gates: GateDefinition[] = [
        {
            id: 'g1',
            position: 0.2,
            lane: 0,
            width: 0.08,
            multiplier: randomInt(prng, 2, 3),
            isPositive: true,
        },
        {
            id: 'g2',
            position: 0.45,
            lane: 0,
            width: 0.08,
            multiplier: randomInt(prng, 2, 5),
            isPositive: true,
        }
    ];
    const obstacles: ObstacleDefinition[] = (
        prng() > 0.7 ? [{
            id: 'o1', type: 'fence', lane: 0, position: 0.6, width: 0.08, hp: 10 + 4 * difficulty, movementPattern: 'static',
        }] : []
    );
    const fox = randomChoice(prng, FOXES);
    const enemySpawns: EnemySpawn[] = [
        { time: 5, lane: 0, foxTypeId: fox.id, count: 3 + Math.ceil(difficulty * 1.3) },
        { time: 10, lane: 0, foxTypeId: fox.id, count: 2 + difficulty },
    ];
    const fort: FoxFortDefinition = { hp: 30 + 12 * difficulty, armorMultiplier: 1, rewardMultiplier: 1 };
    return {
        id: `p_gauntlet_${difficulty}`,
        name: `The Gauntlet v${difficulty}`,
        laneCount,
        length,
        gates,
        obstacles,
        enemySpawns,
        fort,
        rewardCorn: 40 + 8 * difficulty,
        rewardFeathers: (difficulty >= 3) ? 1 : 0,
    };
}

/***********************************************************
 * 2. 'Multiplication Mayhem' Variant
 *    - Many positive gates, short run, but some negative/trap gates appear.
 ***********************************************************/
function generateMultiplicationMayhem(seed: string, difficulty: number): LevelDefinition {
    const prng = getSeededPRNG(seed + ':mayhem:' + difficulty);
    const laneCount = 1 + ((difficulty > 4) ? 1 : 0);
    const length = 750 + 40 * difficulty;
    const gates: GateDefinition[] = [];
    for (let i = 0; i < 4; ++i) {
        gates.push({
            id: `g${i}`,
            position: 0.18 + 0.16 * i,
            lane: 0,
            width: 0.08,
            multiplier: (prng() > 0.2 ? randomInt(prng, 2, 5) : 0.5),
            isPositive: prng() > 0.2,
        });
    }
    if (laneCount > 1) {
        gates.push({ id: 'g5', position: 0.65, lane: 1, width: 0.08, multiplier: 2, isPositive: true });
    }
    // Very few enemies; just quick fun
    const fox = randomChoice(prng, FOXES);
    const enemySpawns: EnemySpawn[] = [{ time: 8, lane: 0, foxTypeId: fox.id, count: 3 + Math.ceil(0.9 * difficulty) }];
    const fort: FoxFortDefinition = { hp: 20 + 7 * difficulty, armorMultiplier: 1, rewardMultiplier: 1 };
    return {
        id: `p_mayhem_${difficulty}`,
        name: `Multiplication Mayhem v${difficulty}`,
        laneCount,
        length,
        gates,
        obstacles: [],
        enemySpawns,
        fort,
        rewardCorn: 24 + 7 * difficulty,
        rewardFeathers: (difficulty > 3) ? 1 : 0,
    };
}

/***********************************************************
 * 3. 'Trap Alley' Variant
 *    - Negative gates and heavy obstacles, beware the lane layout.
 ***********************************************************/
function generateTrapAlley(seed: string, difficulty: number): LevelDefinition {
    const prng = getSeededPRNG(seed + ':trapalley:' + difficulty);
    const laneCount = 2;
    const length = 800 + 25 * difficulty;
    const gates: GateDefinition[] = [
        {
            id: 'g1', position: 0.23, lane: 0, width: 0.08, multiplier: 3, isPositive: true,
        },
        {
            id: 'g2', position: 0.25, lane: 1, width: 0.08, multiplier: 0.5, isPositive: false,
        },
        {
            id: 'g3', position: 0.52, lane: 1, width: 0.08, multiplier: 2, isPositive: true,
        },
        {
            id: 'g4', position: 0.55, lane: 0, width: 0.08, multiplier: 0.5, isPositive: false,
        },
    ];
    // Obstacle variety and pattern
    const obstacles: ObstacleDefinition[] = [
        {
            id: 'o1', type: 'fence' as const, lane: 0, position: 0.68, width: 0.08, hp: 9 + 2 * difficulty, movementPattern: 'static' as const,
        },
        {
            id: 'o2', type: 'hay_bale' as const, lane: 1, position: 0.6, width: 0.08, hp: 7 + difficulty, movementPattern: 'static' as const,
        },
    ];
    const fox = randomChoice(prng, FOXES);
    const enemySpawns: EnemySpawn[] = [
        { time: 7, lane: 1, foxTypeId: fox.id, count: 4 + difficulty },
        { time: 13, lane: 0, foxTypeId: fox.id, count: 2 + Math.ceil(difficulty / 2) },
    ];
    const fort: FoxFortDefinition = { hp: 36 + 8 * difficulty, armorMultiplier: 1, rewardMultiplier: 1 };
    return {
        id: `p_trapalley_${difficulty}`,
        name: `Trap Alley v${difficulty}`,
        laneCount,
        length,
        gates,
        obstacles,
        enemySpawns,
        fort,
        rewardCorn: 44 + 9 * difficulty,
        rewardFeathers: (difficulty > 2) ? 1 : 0,
    };
}

/***********************************************************
 * 4. 'Fox Swarm' Variant
 *    - High enemy counts, fewer powerups, gating favors penalty or low multipliers.
 ***********************************************************/
function generateFoxSwarm(seed: string, difficulty: number): LevelDefinition {
    const prng = getSeededPRNG(seed + ':foxswarm:' + difficulty);
    const laneCount = 2 + (difficulty > 4 ? 1 : 0);
    const foxes = shuffle(prng, FOXES);
    const gates: GateDefinition[] = [
        { id: 'g1', position: 0.2, lane: 0, width: 0.08, multiplier: 2, isPositive: true },
        { id: 'g2', position: 0.45, lane: 1, width: 0.08, multiplier: 1, isPositive: true },
    ];
    if (laneCount > 2) {
        gates.push({ id: 'g3', position: 0.6, lane: 2, width: 0.08, multiplier: 0.5, isPositive: false });
    }
    const obstacles: ObstacleDefinition[] = (
        prng() > 0.4 ? [        { id: 'o1', type: 'hay_bale' as const, lane: 1, position: 0.65, width: 0.08, hp: 8 + 2 * difficulty, movementPattern: 'static' as const }] : []
    );
    const enemySpawns: EnemySpawn[] = [
        { time: 4, lane: 0, foxTypeId: foxes[0].id, count: 7 + 2 * difficulty },
        { time: 7, lane: 1, foxTypeId: foxes[1].id, count: 5 + 2 * difficulty },
        ...(laneCount > 2 ? [{ time: 10, lane: 2, foxTypeId: foxes[2].id, count: 5 + difficulty }] : []),
    ];
    const fort: FoxFortDefinition = { hp: 50 + 10 * difficulty, armorMultiplier: 1.1, rewardMultiplier: 1.3 };
    return {
        id: `p_foxswarm_${difficulty}`,
        name: `Fox Swarm v${difficulty}`,
        laneCount,
        length: 950 + 35 * difficulty,
        gates,
        obstacles,
        enemySpawns,
        fort,
        rewardCorn: 42 + 11 * difficulty,
        rewardFeathers: (difficulty > 2) ? 1 : 0,
    };
}

/***********************************************************
 * 5. 'Maze Gates' Variant
 *    - Many gates, mixed lanes; player must pick a path.
 ***********************************************************/
function generateMazeGates(seed: string, difficulty: number): LevelDefinition {
    const prng = getSeededPRNG(seed + ':mazegates:' + difficulty);
    const laneCount = 3;
    const length = 1050 + 40 * difficulty;
    const gates: GateDefinition[] = [];
    for (let i = 0; i < 3; ++i) {
        for (let lane = 0; lane < laneCount; ++lane) {
            gates.push({
                id: `g${i}_${lane}`,
                position: 0.21 + 0.19 * i,
                lane,
                width: 0.07 + 0.01 * difficulty,
                multiplier: (lane === i ? 5 : prng() > 0.45 ? 2 : 0.5),
                isPositive: lane === i || prng() > 0.45,
            });
        }
    }
    const obstacles: ObstacleDefinition[] = (
        prng() > 0.27 ? [{ id: 'o1', type: 'scarecrow' as const, lane: randomInt(prng, 0, 2), position: 0.58, width: 0.08, hp: Infinity, movementPattern: 'rotate' as const }] : []
    );
    const fox = randomChoice(prng, FOXES);
    const enemySpawns: EnemySpawn[] = [
        { time: 5, lane: 0, foxTypeId: fox.id, count: 6 + 2 * difficulty },
        { time: 10, lane: 2, foxTypeId: fox.id, count: 5 + difficulty },
    ];
    const fort: FoxFortDefinition = { hp: 60 + 8 * difficulty, armorMultiplier: 1.3, rewardMultiplier: 1.4 };
    return {
        id: `p_mazegates_${difficulty}`,
        name: `Maze Gates v${difficulty}`,
        laneCount,
        length,
        gates,
        obstacles,
        enemySpawns,
        fort,
        rewardCorn: 56 + 8 * difficulty,
        rewardFeathers: 1 + Math.floor(difficulty / 4),
    };
}

/***********************************************************
 * 6. 'Obstacle Overload' Variant
 *    - Many obstacles, moderate enemies, player must maneuver.
 ***********************************************************/
function generateObstacleOverload(seed: string, difficulty: number): LevelDefinition {
    const prng = getSeededPRNG(seed + ':obstacles:' + difficulty);
    const laneCount = 2 + (difficulty > 3 ? 1 : 0);
    const length = 1000 + 20 * difficulty;
    const gates: GateDefinition[] = [
        { id: 'g1', position: 0.22, lane: 0, width: 0.08, multiplier: 3, isPositive: true },
        { id: 'g2', position: 0.66, lane: 1, width: 0.08, multiplier: 2, isPositive: true },
    ];
    // Many obstacles, varying types
    const obstacles: ObstacleDefinition[] = [
        { id: 'o1', type: 'fence' as const, lane: 0, position: 0.33, width: 0.08, hp: 10 + 3 * difficulty, movementPattern: 'static' as const },
        { id: 'o2', type: 'hay_bale' as const, lane: 1, position: 0.72, width: 0.08, hp: 8 + 2 * difficulty, movementPattern: 'static' as const },
        ...(laneCount === 3 ? [{ id: 'o3', type: 'hay_bale' as const, lane: 2, position: 0.64, width: 0.08, hp: 8 + 2 * difficulty, movementPattern: 'static' as const }] : []),
    ];
    const fox = randomChoice(prng, FOXES);
    const enemySpawns: EnemySpawn[] = [
        { time: 6, lane: 0, foxTypeId: fox.id, count: 5 + 2 * difficulty },
        { time: 10, lane: 1, foxTypeId: fox.id, count: 3 + 2 * difficulty },
    ];
    const fort: FoxFortDefinition = { hp: 70 + 11 * difficulty, armorMultiplier: 1.1, rewardMultiplier: 1.3 };
    return {
        id: `p_obstacles_${difficulty}`,
        name: `Obstacle Overload v${difficulty}`,
        laneCount,
        length,
        gates,
        obstacles,
        enemySpawns,
        fort,
        rewardCorn: 60 + 6 * difficulty,
        rewardFeathers: 1 + (difficulty > 4 ? 1 : 0),
    };
}

/***********************************************************
 * 7. 'Timed Blitz' Variant
 *    - Short time limit, fewer gates, but aggressive rewards and spawns.
 ***********************************************************/
function generateTimedBlitz(seed: string, difficulty: number): LevelDefinition {
    const prng = getSeededPRNG(seed + ':timedblitz:' + difficulty);
    const laneCount = 1 + (difficulty > 3 ? 1 : 0);
    const length = 820 + 25 * difficulty;
    const gates: GateDefinition[] = [
        { id: 'g1', position: 0.18, lane: 0, width: 0.08, multiplier: 3, isPositive: true },
        { id: 'g2', position: 0.58, lane: 0, width: 0.08, multiplier: 3, isPositive: true },
    ];
    const obstacles: ObstacleDefinition[] = (
        prng() > 0.53 ? [{ id: 'o1', type: 'fence', lane: 0, position: 0.32, width: 0.08, hp: 12 + difficulty, movementPattern: 'static' }] : []
    );
    const fox = randomChoice(prng, FOXES);
    const enemySpawns: EnemySpawn[] = [
        { time: 2, lane: 0, foxTypeId: fox.id, count: 2 + Math.ceil(difficulty / 2) },
        { time: 8, lane: 0, foxTypeId: fox.id, count: 3 + difficulty },
    ];
    const fort: FoxFortDefinition = { hp: 24 + 6 * difficulty, armorMultiplier: 1, rewardMultiplier: 2.5 };
    return {
        id: `p_blitz_${difficulty}`,
        name: `Timed Blitz v${difficulty}`,
        laneCount,
        length,
        gates,
        obstacles,
        enemySpawns,
        fort,
        rewardCorn: 77 + 11 * difficulty,
        rewardFeathers: (difficulty > 2) ? 1 : 0,
        timeout: 24 + 2.5 * difficulty, // Aggressive time cap
    };
}

// --- END procedural helpers ---
