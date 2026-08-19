// Centralized game constants
import type { WorldTheme } from '@/data/types';

export const COLLISION_THRESHOLD = 0.03;
export const DEFAULT_ENTITY_WIDTH = 0.06;
export const FORT_ZONE = 0.02;
export const MAX_VISIBLE_PER_FLOCK = 50;
export const SCREEN_SHAKE_MULTIPLIER = 12;
export const DEFAULT_TIMEOUT = 60;
export const SCARECROW_DAMAGE_RATE = 0.2;
export const OBSTACLE_DAMAGE_MULTIPLIER = 10;
export const AUTOSAVE_INTERVAL_MS = 25000;
export const MUZZLE_FLASH_COOLDOWN = 0.3;

// Code simplification constants
export const FLOCK_DEATH_THRESHOLD = 0.2;
export const MIN_FLOCK_COUNT = 1;
export const DEFAULT_GATE_WIDTH = 0.08;
export const SCREEN_SHAKE_INTENSITY = 0.15;

// Aiming constants
export const MAX_AIM_ANGLE = Math.PI / 3; // 60 degrees left/right

// ── Juice / Polish Constants ──
export const CANNON_RECOIL_DURATION = 0.12;
export const CANNON_RECOIL_DISTANCE = 8;
export const GATE_BURST_PARTICLE_COUNT = 20;
export const FORT_HIT_SHAKE_INTENSITY = 0.25;
export const FORT_HIT_PARTICLE_COUNT = 30;
export const MUZZLE_PARTICLE_COUNT = 8;
export const SPAWN_POP_PARTICLE_COUNT = 6;

// ── Difficulty Tiers (for procedural level generation) ──
export interface DifficultyTier {
    levelRange: [number, number];
    gateCount: [number, number];
    foxTypes: string[];
    obstacleHpRange: [number, number];
    fortHpBase: number;
    fortHpScale: number;
    rewardCornBase: number;
    rewardCornScale: number;
    trapChance: number;
    enemySpawnCount: [number, number];
}

export const DIFFICULTY_TIERS: DifficultyTier[] = [
    {
        levelRange: [1, 18],
        gateCount: [1, 3],
        foxTypes: ['fox_scout'],
        obstacleHpRange: [10, 15],
        fortHpBase: 12,
        fortHpScale: 8,
        rewardCornBase: 30,
        rewardCornScale: 15,
        trapChance: 0.1,
        enemySpawnCount: [0, 2],
    },
    {
        levelRange: [19, 36],
        gateCount: [2, 4],
        foxTypes: ['fox_scout', 'fox_brute'],
        obstacleHpRange: [15, 25],
        fortHpBase: 150,
        fortHpScale: 12,
        rewardCornBase: 300,
        rewardCornScale: 20,
        trapChance: 0.15,
        enemySpawnCount: [1, 3],
    },
    {
        levelRange: [37, 54],
        gateCount: [3, 5],
        foxTypes: ['fox_scout', 'fox_brute', 'fox_sniper'],
        obstacleHpRange: [20, 35],
        fortHpBase: 400,
        fortHpScale: 15,
        rewardCornBase: 600,
        rewardCornScale: 25,
        trapChance: 0.2,
        enemySpawnCount: [2, 4],
    },
    {
        levelRange: [55, 72],
        gateCount: [4, 6],
        foxTypes: ['fox_scout', 'fox_brute', 'fox_sniper', 'fox_tank'],
        obstacleHpRange: [25, 45],
        fortHpBase: 700,
        fortHpScale: 18,
        rewardCornBase: 1000,
        rewardCornScale: 30,
        trapChance: 0.25,
        enemySpawnCount: [3, 5],
    },
    {
        levelRange: [73, 108],
        gateCount: [4, 6],
        foxTypes: ['fox_scout', 'fox_brute', 'fox_sniper', 'fox_tank', 'fox_swarm', 'fox_bomber'],
        obstacleHpRange: [30, 50],
        fortHpBase: 1100,
        fortHpScale: 20,
        rewardCornBase: 1400,
        rewardCornScale: 35,
        trapChance: 0.3,
        enemySpawnCount: [4, 6],
    },
];

// ── Level Templates ──
export type LevelTemplateId = 'gauntlet' | 'split_decision' | 'swarm' | 'obstacle_course' | 'sniper_nest' | 'boss_wave';

export interface LevelTemplate {
    id: LevelTemplateId;
    name: string;
    laneCount: number | [number, number];
    gatePattern: 'linear' | 'split' | 'clustered' | 'asymmetric';
    obstacleDensity: 'none' | 'light' | 'medium' | 'heavy';
    enemyDensity: 'none' | 'light' | 'medium' | 'heavy' | 'swarm';
}

export const LEVEL_TEMPLATES: Record<LevelTemplateId, LevelTemplate> = {
    gauntlet: {
        id: 'gauntlet',
        name: 'Gauntlet',
        laneCount: 1,
        gatePattern: 'linear',
        obstacleDensity: 'light',
        enemyDensity: 'medium',
    },
    split_decision: {
        id: 'split_decision',
        name: 'Split Decision',
        laneCount: 2,
        gatePattern: 'asymmetric',
        obstacleDensity: 'light',
        enemyDensity: 'medium',
    },
    swarm: {
        id: 'swarm',
        name: 'Swarm',
        laneCount: 3,
        gatePattern: 'clustered',
        obstacleDensity: 'none',
        enemyDensity: 'swarm',
    },
    obstacle_course: {
        id: 'obstacle_course',
        name: 'Obstacle Course',
        laneCount: [1, 2],
        gatePattern: 'linear',
        obstacleDensity: 'heavy',
        enemyDensity: 'light',
    },
    sniper_nest: {
        id: 'sniper_nest',
        name: 'Sniper Nest',
        laneCount: 2,
        gatePattern: 'split',
        obstacleDensity: 'medium',
        enemyDensity: 'medium',
    },
    boss_wave: {
        id: 'boss_wave',
        name: 'Boss Wave',
        laneCount: 3,
        gatePattern: 'clustered',
        obstacleDensity: 'medium',
        enemyDensity: 'heavy',
    },
};

// ── World Theme Palettes ──
// Exactly one palette per world so progression is visually distinct (issue P0-4).
export interface ThemePalette {
    bg: string;
    bgAccent: string;
    lane: string;
    laneBorder: string;
    fog: string;
}

export const WORLD_THEMES: Record<WorldTheme, ThemePalette> = {
    grassland: { bg: '#1a1a2e', bgAccent: '#2f4a2f', lane: '#2a3a2a', laneBorder: '#3f5e3f', fog: 'rgba(46, 74, 46, 0.08)' },
    desert: { bg: '#2e1f10', bgAccent: '#5a3d1f', lane: '#3a2a15', laneBorder: '#6b4e2a', fog: 'rgba(122, 84, 19, 0.10)' },
    snow: { bg: '#12233a', bgAccent: '#2f4e6b', lane: '#1f3350', laneBorder: '#3f6080', fog: 'rgba(148, 197, 231, 0.10)' },
    lava: { bg: '#2e1010', bgAccent: '#5a1a1a', lane: '#3a1515', laneBorder: '#6b2a2a', fog: 'rgba(201, 70, 33, 0.10)' },
    meadow_night: { bg: '#0d1b2a', bgAccent: '#1b3a4b', lane: '#15303f', laneBorder: '#2f5e6e', fog: 'rgba(29, 78, 91, 0.14)' },
    magma_cave: { bg: '#1a0d1a', bgAccent: '#3a1030', lane: '#2a1428', laneBorder: '#5e2a50', fog: 'rgba(123, 31, 86, 0.14)' },
};

export function getThemePalette(theme: string): ThemePalette {
    return WORLD_THEMES[theme as WorldTheme] ?? WORLD_THEMES.grassland;
}
