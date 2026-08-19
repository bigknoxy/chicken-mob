/**
 * CampaignLevelGenerator — Generates campaign levels (L37-108) using templates.
 */

import type { LevelDefinition, GateDefinition, EnemySpawn, ObstacleDefinition } from '@/data/types';
import { DIFFICULTY_TIERS, LEVEL_TEMPLATES, type LevelTemplateId } from '@/constants/game';

const MULTIPLIERS = [2, 3, 4, 5, 10];
const OBSTACLE_TYPES: Array<'fence' | 'hay_bale' | 'scarecrow'> = ['fence', 'hay_bale', 'scarecrow'];

function seededRandom(seed: number): () => number {
    return () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed / 0x7fffffff;
    };
}

export function getDifficultyTier(levelIndex: number): typeof DIFFICULTY_TIERS[0] {
    const level = levelIndex + 1;
    for (const tier of DIFFICULTY_TIERS) {
        if (level >= tier.levelRange[0] && level <= tier.levelRange[1]) {
            return tier;
        }
    }
    return DIFFICULTY_TIERS[DIFFICULTY_TIERS.length - 1];
}

export function getWorldForLevel(levelIndex: number): string {
    const level = levelIndex + 1;
    if (level <= 18) return 'W1';
    if (level <= 36) return 'W2';
    if (level <= 54) return 'W3';
    if (level <= 72) return 'W4';
    if (level <= 90) return 'W5';
    return 'W6';
}

export function getTemplateNameForLevel(levelIndex: number): LevelTemplateId {
    const level = levelIndex + 1;
    const templateOrder: LevelTemplateId[] = [
        'gauntlet', 'split_decision', 'swarm', 'obstacle_course', 'sniper_nest',
        'gauntlet', 'split_decision', 'swarm', 'boss_wave',
    ];
    const index = (level - 1) % templateOrder.length;
    return templateOrder[index];
}

export function generateCampaignLevel(levelIndex: number, seed?: number): LevelDefinition {
    const level = levelIndex + 1;
    const rng = seededRandom(seed ?? level * 54321);
    
    const tier = getDifficultyTier(levelIndex);
    const templateId = getTemplateNameForLevel(levelIndex);
    const template = LEVEL_TEMPLATES[templateId];
    const worldId = getWorldForLevel(levelIndex);
    
    const laneCount = typeof template.laneCount === 'number' 
        ? template.laneCount 
        : template.laneCount[0] + Math.floor(rng() * (template.laneCount[1] - template.laneCount[0] + 1));
    
    const gates: GateDefinition[] = [];
    const enemySpawns: EnemySpawn[] = [];
    const obstacles: ObstacleDefinition[] = [];
    
    const gateCount = tier.gateCount[0] + Math.floor(rng() * (tier.gateCount[1] - tier.gateCount[0] + 1));
    
    generateGates(gates, gateCount, laneCount, tier, template, rng);
    generateObstacles(obstacles, laneCount, tier, template, rng);
    generateEnemies(enemySpawns, laneCount, tier, template, rng);
    
    const tierLevel = level - tier.levelRange[0];
    const fortHp = Math.floor(tier.fortHpBase + tierLevel * tier.fortHpScale);
    
    const rewardCorn = Math.floor(tier.rewardCornBase + tierLevel * tier.rewardCornScale);
    const rewardFeathers = Math.floor(level / 5);
    
    const isBoss = level % 9 === 0;
    const bossMultiplier = isBoss ? 1.5 : 1;
    
    const levelNames: Record<LevelTemplateId, string[]> = {
        gauntlet: ['The Run', 'Sprint', 'Dash', 'Charge', 'Rush'],
        split_decision: ['Crossroads', 'Divide', 'Fork', 'Choice', 'Split Path'],
        swarm: ['Onslaught', 'Invasion', 'Swarm', 'Horde', 'Frenzy'],
        obstacle_course: ['Maze', 'Gauntlet', 'Course', 'Hurdles', 'Challenge'],
        sniper_nest: ['Sniper Alley', 'Hunter\'s Path', 'Kill Zone', 'Ambush', 'Sniper Den'],
        boss_wave: ['Boss Fight', 'Showdown', 'Final Stand', 'Boss Battle', 'Siege'],
    };
    const nameOptions = levelNames[templateId];
    const levelName = nameOptions[Math.floor(rng() * nameOptions.length)];
    
    return {
        id: `level_${String(level).padStart(2, '0')}`,
        name: levelName,
        worldId,
        laneCount,
        length: 800 + Math.min(600, level * 5),
        gates,
        obstacles,
        enemySpawns,
        fort: {
            hp: Math.floor(fortHp * bossMultiplier),
            armorMultiplier: 1 + level * 0.015,
            rewardMultiplier: 1 + level * 0.03,
        },
        rewardCorn: Math.floor(rewardCorn * bossMultiplier),
        rewardFeathers: Math.min(15, rewardFeathers),
        timeout: 60 + Math.floor(level / 10) * 5,
    };
}

function generateGates(
    gates: GateDefinition[],
    gateCount: number,
    laneCount: number,
    tier: typeof DIFFICULTY_TIERS[0],
    template: typeof LEVEL_TEMPLATES.gauntlet,
    rng: () => number
): void {
    const minGateGap = 0.18;
    const usedPositions: Map<number, Set<number>> = new Map();
    
    for (let lane = 0; lane < laneCount; lane++) {
        usedPositions.set(lane, new Set());
    }
    
    for (let i = 0; i < gateCount; i++) {
        let lane: number = 0;
        let position: number = 0.5;
        let attempts = 0;
        const maxAttempts = 100;
        let foundValid = false;
        
        while (attempts < maxAttempts && !foundValid) {
            switch (template.gatePattern) {
                case 'linear':
                    lane = Math.floor(rng() * laneCount);
                    position = 0.15 + rng() * 0.65;
                    break;
                case 'split':
                    lane = i % laneCount;
                    position = 0.15 + (Math.floor(i / laneCount) * 0.28) + rng() * 0.1;
                    break;
                case 'clustered':
                    lane = Math.floor(rng() * laneCount);
                    position = 0.25 + rng() * 0.45;
                    break;
                case 'asymmetric':
                    lane = Math.floor(rng() * 2) === 0 ? 0 : laneCount - 1;
                    position = 0.15 + rng() * 0.65;
                    break;
                default:
                    lane = Math.floor(rng() * laneCount);
                    position = 0.15 + rng() * 0.65;
            }
            position = Math.round(position * 100) / 100;
            attempts++;
            
            const hasOverlap = Array.from(usedPositions.get(lane) || []).some(p => Math.abs(p - position) < minGateGap);
            if (!hasOverlap) {
                foundValid = true;
            }
        }
        
        if (!foundValid) {
            continue;
        }
        
        usedPositions.get(lane)!.add(position);
        
        const multiplier = MULTIPLIERS[Math.floor(rng() * MULTIPLIERS.length)];
        const isTrap = rng() < tier.trapChance;
        
        gates.push({
            id: `g${i}`,
            position,
            lane,
            x: (lane + 0.5) / laneCount,
            width: 0.08,
            multiplier: isTrap ? 0.5 : multiplier,
            isPositive: !isTrap,
        });
    }
}

function generateObstacles(
    obstacles: ObstacleDefinition[],
    laneCount: number,
    tier: typeof DIFFICULTY_TIERS[0],
    template: typeof LEVEL_TEMPLATES.gauntlet,
    rng: () => number
): void {
    const densityMap = { none: 0, light: 1, medium: 2, heavy: 4 };
    const obstacleCount = densityMap[template.obstacleDensity];
    
    for (let i = 0; i < obstacleCount; i++) {
        const lane = Math.floor(rng() * laneCount);
        const position = 0.25 + rng() * 0.5;
        const type = OBSTACLE_TYPES[Math.floor(rng() * OBSTACLE_TYPES.length)];
        const hp = type === 'scarecrow' 
            ? Infinity 
            : tier.obstacleHpRange[0] + Math.floor(rng() * (tier.obstacleHpRange[1] - tier.obstacleHpRange[0]));
        
        obstacles.push({
            id: `o${i}`,
            type,
            lane,
            x: (lane + 0.5) / laneCount,
            width: 0.08,
            position: Math.round(position * 100) / 100,
            hp,
            movementPattern: type === 'scarecrow' ? 'rotate' : 'static',
        });
    }
}

function generateEnemies(
    enemySpawns: EnemySpawn[],
    laneCount: number,
    tier: typeof DIFFICULTY_TIERS[0],
    template: typeof LEVEL_TEMPLATES.gauntlet,
    rng: () => number
): void {
    const densityMap = { none: 0, light: 1, medium: 2, heavy: 4, swarm: 6 };
    let spawnCount = densityMap[template.enemyDensity];
    
    if (template.id === 'boss_wave') {
        spawnCount += 2;
    }
    
    spawnCount = Math.max(tier.enemySpawnCount[0], Math.min(tier.enemySpawnCount[1], spawnCount));
    
    const spawnInterval = 50 / spawnCount;
    
    for (let i = 0; i < spawnCount; i++) {
        const lane = Math.floor(rng() * laneCount);
        const time = 3 + i * spawnInterval + rng() * 2;
        const foxType = tier.foxTypes[Math.floor(rng() * tier.foxTypes.length)];
        
        let count: number;
        if (foxType === 'fox_swarm') {
            count = 8 + Math.floor(rng() * 8);
        } else if (foxType === 'fox_tank') {
            count = 1 + Math.floor(rng() * 2);
        } else if (foxType === 'fox_bomber') {
            count = 1 + Math.floor(rng() * 3);
        } else {
            count = 2 + Math.floor(rng() * 5);
        }
        
        if (template.id === 'boss_wave') {
            count = Math.ceil(count * 1.5);
        }
        
        enemySpawns.push({
            time: Math.round(time * 10) / 10,
            lane,
            foxTypeId: foxType,
            count,
        });
    }
}

export function generateAllCampaignLevels(): LevelDefinition[] {
    const levels: LevelDefinition[] = [];
    for (let i = 36; i < 108; i++) {
        levels.push(generateCampaignLevel(i));
    }
    return levels;
}
