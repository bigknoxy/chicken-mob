/**
 * ProceduralLevelGenerator — Creates endless mode levels with increasing difficulty.
 */

import type { LevelDefinition, GateDefinition, EnemySpawn, ObstacleDefinition } from '@/data/types';

const MULTIPLIERS = [2, 3, 4, 5, 10];
const FOX_TYPES = ['fox_scout', 'fox_brute', 'fox_sniper'];
const OBSTACLE_TYPES: Array<'fence' | 'hay_bale' | 'scarecrow'> = ['fence', 'hay_bale', 'scarecrow'];

function seededRandom(seed: number): () => number {
    return () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed / 0x7fffffff;
    };
}

export function generateEndlessLevel(wave: number, seed?: number): LevelDefinition {
    const rng = seededRandom(seed ?? wave * 12345);
    
    const laneCount = Math.min(3, 1 + Math.floor(wave / 5));
    const gateCount = Math.min(6, 1 + Math.floor(wave / 3));
    const hasEnemies = wave >= 2;
    const hasObstacles = wave >= 4;
    const hasTraps = wave >= 3;
    
    const gates: GateDefinition[] = [];
    const enemySpawns: EnemySpawn[] = [];
    const obstacles: ObstacleDefinition[] = [];
    
    // Generate gates
    for (let i = 0; i < gateCount; i++) {
        const lane = Math.floor(rng() * laneCount);
        const position = 0.2 + (i / gateCount) * 0.6;
        const multiplier = MULTIPLIERS[Math.floor(rng() * MULTIPLIERS.length)];
        const isTrap = hasTraps && rng() < 0.25;
        
        gates.push({
            id: `g${i}`,
            position: Math.round(position * 100) / 100,
            lane,
            x: (lane + 0.5) / laneCount,
            width: 0.08,
            multiplier: isTrap ? 0.5 : multiplier,
            isPositive: !isTrap,
            type: 'multiply',
        });
    }
    
    // Generate enemy spawns
    if (hasEnemies) {
        const enemyCount = Math.min(4, 1 + Math.floor(wave / 4));
        for (let i = 0; i < enemyCount; i++) {
            const lane = Math.floor(rng() * laneCount);
            const time = 3 + i * 3 + rng() * 2;
            const foxIndex = Math.min(2, Math.floor(wave / 6));
            const foxType = FOX_TYPES[Math.floor(rng() * (foxIndex + 1))];
            const count = Math.min(8, 2 + Math.floor(wave / 3));
            
            enemySpawns.push({
                time: Math.round(time * 10) / 10,
                lane,
                foxTypeId: foxType,
                count,
            });
        }
    }
    
    // Generate obstacles
    if (hasObstacles) {
        const obstacleCount = Math.min(3, Math.floor((wave - 3) / 3));
        for (let i = 0; i < obstacleCount; i++) {
            const lane = Math.floor(rng() * laneCount);
            const position = 0.3 + rng() * 0.4;
            const type = OBSTACLE_TYPES[Math.floor(rng() * OBSTACLE_TYPES.length)];
            const hp = type === 'scarecrow' ? Infinity : 10 + wave * 2;
            
            obstacles.push({
                id: `o${i}`,
                type,
                lane,
                x: (lane + 0.5) / laneCount,
                width: 0.08,
                position: Math.round(position * 100) / 100,
                hp,
                movementPattern: 'static',
            });
        }
    }
    
    // Scale fort HP with wave
    const baseHp = 20;
    const hpScale = 1 + wave * 0.15;
    const fortHp = Math.floor(baseHp * hpScale);
    
    // Scale rewards
    const rewardCorn = 30 + wave * 10;
    const rewardFeathers = wave >= 5 ? 1 : 0;
    
    return {
        id: `endless_${wave}`,
        name: `Wave ${wave}`,
        worldId: 'endless',
        laneCount,
        length: 800 + Math.min(400, wave * 20),
        gates,
        obstacles,
        enemySpawns,
        fort: {
            hp: fortHp,
            armorMultiplier: 1 + wave * 0.02,
            rewardMultiplier: 1 + wave * 0.05,
        },
        rewardCorn,
        rewardFeathers,
        timeout: 45,
    };
}

export interface EndlessState {
    currentWave: number;
    highScore: number;
    totalCorn: number;
}

export function createDefaultEndlessState(): EndlessState {
    return {
        currentWave: 1,
        highScore: 0,
        totalCorn: 0,
    };
}
