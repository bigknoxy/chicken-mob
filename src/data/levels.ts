import type { LevelDefinition, WorldDefinition } from './types';
import { generateCampaignLevel } from '@/systems/CampaignLevelGenerator';

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
 *       Gates only multiply/kill flocks. Enemies enter solely via the level's `enemySpawns` array.
 */
const HANDAUTHED_LEVELS: LevelDefinition[] = [
    // ═══════════════════════════════════════════════════════════════
    // TUTORIAL ARC (L1–3) — 90%+ win rate
    // ═══════════════════════════════════════════════════════════════

    // ─── L1: First Steps ────────────────────────────────────────────
    {
        id: 'level_01',
        worldId: 'W1',
        name: 'First Steps',
        laneCount: 1,
        length: 800,
        gates: [
            { id: 'g1', position: 0.5, lane: 0, x: 0.5, width: 0.08, multiplier: 2, isPositive: true },
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
        worldId: 'W1',
        name: 'Double Up',
        laneCount: 1,
        length: 800,
        gates: [
            { id: 'g1', position: 0.35, lane: 0, x: 0.5, width: 0.08, multiplier: 2, isPositive: true },
            { id: 'g2', position: 0.65, lane: 0, x: 0.5, width: 0.08, multiplier: 2, isPositive: true },
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
        worldId: 'W1',
        name: 'Big Boost',
        laneCount: 1,
        length: 800,
        gates: [
            { id: 'g1', position: 0.5, lane: 0, x: 0.5, width: 0.08, multiplier: 3, isPositive: true },
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
        worldId: 'W1',
        name: 'Crossroads',
        laneCount: 2,
        length: 800,
        gates: [
            { id: 'g1', position: 0.45, lane: 0, x: 0.25, width: 0.08, multiplier: 2, isPositive: true },
            { id: 'g2', position: 0.45, lane: 1, x: 0.75, width: 0.08, multiplier: 3, isPositive: true },
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
        worldId: 'W1',
        name: 'Fox Alert',
        laneCount: 1,
        length: 900,
        gates: [
            { id: 'g1', position: 0.3, lane: 0, x: 0.5, width: 0.08, multiplier: 3, isPositive: true },
            { id: 'g2', position: 0.6, lane: 0, x: 0.5, width: 0.08, multiplier: 4, isPositive: true },
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
        worldId: 'W1',
        name: 'Trap Door',
        laneCount: 2,
        length: 900,
        gates: [
            { id: 'g1', position: 0.4, lane: 0, x: 0.25, width: 0.08, multiplier: 3, isPositive: true },
            { id: 'g2', position: 0.4, lane: 1, x: 0.75, width: 0.08, multiplier: 0.5, isPositive: false },
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
        worldId: 'W1',
        name: 'Fox Brute',
        laneCount: 1,
        length: 900,
        gates: [
            { id: 'g1', position: 0.3, lane: 0, x: 0.5, width: 0.08, multiplier: 3, isPositive: true },
            { id: 'g2', position: 0.6, lane: 0, x: 0.5, width: 0.08, multiplier: 3, isPositive: true },
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
        worldId: 'W1',
        name: 'Hay Day',
        laneCount: 1,
        length: 900,
        gates: [
            { id: 'g1', position: 0.25, lane: 0, x: 0.5, width: 0.08, multiplier: 2, isPositive: true },
            { id: 'g2', position: 0.55, lane: 0, x: 0.5, width: 0.08, multiplier: 4, isPositive: true },
            { id: 'g3', position: 0.8, lane: 0, x: 0.5, width: 0.08, multiplier: 2, isPositive: true },
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
        worldId: 'W1',
        name: 'Scarecrow Alley',
        laneCount: 1,
        length: 900,
        gates: [
            { id: 'g1', position: 0.4, lane: 0, x: 0.5, width: 0.08, multiplier: 4, isPositive: true },
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
        worldId: 'W1',
        name: 'Three Ways',
        laneCount: 3,
        length: 1000,
        gates: [
            { id: 'g1', position: 0.4, lane: 0, x: 1/6, width: 0.08, multiplier: 2, isPositive: true },
            { id: 'g2', position: 0.4, lane: 1, x: 0.5, width: 0.08, multiplier: 4, isPositive: true },
            { id: 'g3', position: 0.4, lane: 2, x: 5/6, width: 0.08, multiplier: 3, isPositive: true },
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
        worldId: 'W1',
        name: 'Fork',
        laneCount: 2,
        length: 1000,
        gates: [
            { id: 'g1', position: 0.25, lane: 0, x: 0.3, width: 0.08, multiplier: 2, isPositive: true },
            { id: 'g2', position: 0.25, lane: 1, x: 0.7, width: 0.08, multiplier: 5, isPositive: true },
            { id: 'g3', position: 0.55, lane: 0, x: 0.3, width: 0.08, multiplier: 0.5, isPositive: false },
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
        worldId: 'W1',
        name: 'Gauntlet',
        laneCount: 1,
        length: 1100,
        gates: [
            { id: 'g1', position: 0.2, lane: 0, x: 0.5, width: 0.08, multiplier: 2, isPositive: true },
            { id: 'g2', position: 0.45, lane: 0, x: 0.5, width: 0.08, multiplier: 3, isPositive: true },
            { id: 'g3', position: 0.7, lane: 0, x: 0.5, width: 0.08, multiplier: 2, isPositive: true },
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
        worldId: 'W1',
        name: 'Sniper Den',
        laneCount: 2,
        length: 1100,
        gates: [
            { id: 'g1', position: 0.35, lane: 0, x: 0.25, width: 0.08, multiplier: 5, isPositive: true },
            { id: 'g2', position: 0.35, lane: 1, x: 0.75, width: 0.08, multiplier: 2, isPositive: true },
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
        worldId: 'W1',
        name: 'Mixed Bag',
        laneCount: 2,
        length: 1100,
        gates: [
            { id: 'g1', position: 0.3, lane: 0, x: 0.3, width: 0.08, multiplier: 3, isPositive: true },
            { id: 'g2', position: 0.5, lane: 0, x: 0.3, width: 0.08, multiplier: 2, isPositive: true },
            { id: 'g3', position: 0.4, lane: 1, x: 0.7, width: 0.08, multiplier: 4, isPositive: true },
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
        worldId: 'W1',
        name: 'Pressure Cooker',
        laneCount: 1,
        length: 1200,
        gates: [
            { id: 'g1', position: 0.2, lane: 0, x: 0.5, width: 0.08, multiplier: 2, isPositive: true },
            { id: 'g2', position: 0.45, lane: 0, x: 0.5, width: 0.08, multiplier: 3, isPositive: true },
            { id: 'g3', position: 0.7, lane: 0, x: 0.5, width: 0.08, multiplier: 4, isPositive: true },
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
        worldId: 'W1',
        name: 'The Wall',
        laneCount: 2,
        length: 1200,
        gates: [
            { id: 'g1', position: 0.25, lane: 0, x: 0.3, width: 0.08, multiplier: 3, isPositive: true },
            { id: 'g2', position: 0.25, lane: 1, x: 0.7, width: 0.08, multiplier: 4, isPositive: true },
            { id: 'g3', position: 0.55, lane: 0, x: 0.3, width: 0.08, multiplier: 2, isPositive: true },
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
        worldId: 'W1',
        name: 'Swarm',
        laneCount: 3,
        length: 1300,
        gates: [
            { id: 'g1', position: 0.3, lane: 0, x: 1/6, width: 0.08, multiplier: 2, isPositive: true },
            { id: 'g2', position: 0.3, lane: 1, x: 0.5, width: 0.08, multiplier: 5, isPositive: true },
            { id: 'g3', position: 0.3, lane: 2, x: 5/6, width: 0.08, multiplier: 3, isPositive: true },
            { id: 'g4', position: 0.55, lane: 1, x: 0.5, width: 0.08, multiplier: 2, isPositive: true },
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
        worldId: 'W1',
        name: 'Henhouse Siege',
        laneCount: 3,
        length: 1400,
        gates: [
            { id: 'g1', position: 0.2, lane: 0, x: 1/6, width: 0.08, multiplier: 2, isPositive: true },
            { id: 'g2', position: 0.2, lane: 1, x: 0.5, width: 0.08, multiplier: 10, isPositive: true },
            { id: 'g3', position: 0.45, lane: 1, x: 0.5, width: 0.08, multiplier: 3, isPositive: true },
            { id: 'g4', position: 0.45, lane: 0, x: 1/6, width: 0.08, multiplier: 0.5, isPositive: false },
            { id: 'g5', position: 0.45, lane: 2, x: 5/6, width: 0.08, multiplier: 2, isPositive: true },
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
     
     // ══════════════════════════════════════════════════════════════════
     // WORLD 2: ADVANCED MASTERY (L19-36) — 35%→25% win rate
     // ═════════════════════════════════════════════════════════════════

     // ─── L19: Advanced Scout Pressure ──────────────────────────────────
     {
         id: 'level_19',
        worldId: 'W2',
         name: 'Scout Swarm',
         laneCount: 2,
         length: 900,
         gates: [
             { id: 'g1', position: 0.3, lane: 0, x: 0.25, width: 0.08, multiplier: 3, isPositive: true },
             { id: 'g2', position: 0.3, lane: 1, x: 0.75, width: 0.08, multiplier: 4, isPositive: true },
         ],
         obstacles: [],
         enemySpawns: [
             { time: 3, lane: 0, foxTypeId: 'fox_scout', count: 8 },
             { time: 5, lane: 1, foxTypeId: 'fox_scout', count: 8 },
             { time: 7, lane: 0, foxTypeId: 'fox_scout', count: 6 },
         ],
         fort: { hp: 225, armorMultiplier: 1, rewardMultiplier: 1 },
         rewardCorn: 350,
         rewardFeathers: 2,
     },

     // ─── L20: Brute Force ─────────────────────────────────────────────
     {
         id: 'level_20',
        worldId: 'W2',
         name: 'Brute Force',
         laneCount: 1,
         length: 1000,
         gates: [
             { id: 'g1', position: 0.4, lane: 0, x: 0.5, width: 0.08, multiplier: 2, isPositive: true },
             { id: 'g2', position: 0.6, lane: 0, x: 0.5, width: 0.08, multiplier: 3, isPositive: true },
         ],
         obstacles: [],
         enemySpawns: [
             { time: 4, lane: 0, foxTypeId: 'fox_brute', count: 4 },
             { time: 7, lane: 0, foxTypeId: 'fox_brute', count: 3 },
             { time: 9, lane: 0, foxTypeId: 'fox_scout', count: 5 },
         ],
         fort: { hp: 240, armorMultiplier: 1.1, rewardMultiplier: 1.2 },
         rewardCorn: 340,
         rewardFeathers: 2,
     },

     // ─── L21: Mixed Assault ───────────────────────────────────────────
     {
         id: 'level_21',
        worldId: 'W2',
         name: 'Mixed Assault',
         laneCount: 2,
         length: 1000,
         gates: [
             { id: 'g1', position: 0.35, lane: 0, x: 0.3, width: 0.08, multiplier: 4, isPositive: true },
             { id: 'g2', position: 0.35, lane: 1, x: 0.7, width: 0.08, multiplier: 2, isPositive: true },
             { id: 'g3', position: 0.6, lane: 0, x: 0.3, width: 0.08, multiplier: 0.5, isPositive: false },
         ],
         obstacles: [],
         enemySpawns: [
             { time: 3, lane: 0, foxTypeId: 'fox_scout', count: 4 },
             { time: 5, lane: 1, foxTypeId: 'fox_brute', count: 2 },
             { time: 7, lane: 0, foxTypeId: 'fox_scout', count: 5 },
             { time: 9, lane: 1, foxTypeId: 'fox_brute', count: 2 },
         ],
          fort: { hp: 220, armorMultiplier: 1.2, rewardMultiplier: 1.5 },
         rewardCorn: 380,
         rewardFeathers: 3,
     },

     // ═════════════════════════════════════════════════════════════════
     // WORLD 2: SNIPER INTRODUCTION (L22-24) — 30% win rate
     // ════════════════════════════════════════════════════════════════

     // ─── L22: Sniper Introduction ─────────────────────────────────────
     {
         id: 'level_22',
        worldId: 'W2',
         name: 'Sniper Nest',
         laneCount: 2,
         length: 1100,
         gates: [
             { id: 'g1', position: 0.4, lane: 0, x: 0.25, width: 0.08, multiplier: 5, isPositive: true },
             { id: 'g2', position: 0.4, lane: 1, x: 0.75, width: 0.08, multiplier: 2, isPositive: true },
         ],
         obstacles: [],
         enemySpawns: [
             { time: 5, lane: 0, foxTypeId: 'fox_sniper', count: 2 },
             { time: 8, lane: 1, foxTypeId: 'fox_scout', count: 6 },
         ],
          fort: { hp: 200, armorMultiplier: 1.3, rewardMultiplier: 1.8 },
          rewardCorn: 400,
         rewardFeathers: 3,
     },

     // ─── L23: Sniper and Brute Combo ──────────────────────────────────
     {
         id: 'level_23',
        worldId: 'W2',
         name: 'Sniper Brigade',
         laneCount: 2,
         length: 1100,
         gates: [
             { id: 'g1', position: 0.3, lane: 0, x: 0.3, width: 0.08, multiplier: 4, isPositive: true },
             { id: 'g2', position: 0.5, lane: 0, x: 0.3, width: 0.08, multiplier: 2, isPositive: true },
             { id: 'g3', position: 0.4, lane: 1, x: 0.7, width: 0.08, multiplier: 5, isPositive: true },
         ],
         obstacles: [],
         enemySpawns: [
             { time: 4, lane: 0, foxTypeId: 'fox_brute', count: 2 },
             { time: 6, lane: 1, foxTypeId: 'fox_sniper', count: 3 },
             { time: 8, lane: 0, foxTypeId: 'fox_scout', count: 4 },
         ],
          fort: { hp: 180, armorMultiplier: 1.4, rewardMultiplier: 2.0 },
          rewardCorn: 460,
         rewardFeathers: 3,
     },

     // ─── L24: Triple Threat ───────────────────────────────────────────
     {
         id: 'level_24',
        worldId: 'W2',
         name: 'Triple Threat',
         laneCount: 2,
         length: 1200,
         gates: [
             { id: 'g1', position: 0.25, lane: 0, x: 0.2, width: 0.08, multiplier: 3, isPositive: true },
             { id: 'g2', position: 0.5, lane: 0, x: 0.2, width: 0.08, multiplier: 4, isPositive: true },
             { id: 'g3', position: 0.4, lane: 1, x: 0.8, width: 0.08, multiplier: 2, isPositive: true },
         ],
         obstacles: [],
         enemySpawns: [
             { time: 3, lane: 0, foxTypeId: 'fox_scout', count: 3 },
             { time: 5, lane: 1, foxTypeId: 'fox_brute', count: 2 },
             { time: 7, lane: 0, foxTypeId: 'fox_sniper', count: 2 },
             { time: 9, lane: 1, foxTypeId: 'fox_scout', count: 4 },
         ],
         fort: { hp: 180, armorMultiplier: 1.5, rewardMultiplier: 2.2 },
         rewardCorn: 520,
         rewardFeathers: 4,
     },

     // ═════════════════════════════════════════════════════════════════
     // WORLD 2: COMPLEX GATES AND TIMING (L25-27) — 28% win rate
     // ════════════════════════════════════════════════════════════════

     // ─── L25: Gate Maze ───────────────────────────────────────────────
     {
         id: 'level_25',
        worldId: 'W2',
         name: 'Gate Maze',
         laneCount: 2,
         length: 1200,
         gates: [
             { id: 'g1', position: 0.2, lane: 0, x: 0.2, width: 0.08, multiplier: 2, isPositive: true },
             { id: 'g2', position: 0.4, lane: 0, x: 0.2, width: 0.08, multiplier: 0.5, isPositive: false },
             { id: 'g3', position: 0.6, lane: 0, x: 0.2, width: 0.08, multiplier: 3, isPositive: true },
             { id: 'g4', position: 0.3, lane: 1, x: 0.8, width: 0.08, multiplier: 4, isPositive: true },
             { id: 'g5', position: 0.5, lane: 1, x: 0.8, width: 0.08, multiplier: 2, isPositive: true },
             { id: 'g6', position: 0.7, lane: 1, x: 0.8, width: 0.08, multiplier: 5, isPositive: true },
         ],
         obstacles: [],
         enemySpawns: [
             { time: 4, lane: 0, foxTypeId: 'fox_scout', count: 4 },
             { time: 6, lane: 1, foxTypeId: 'fox_brute', count: 2 },
         ],
         fort: { hp: 200, armorMultiplier: 1.5, rewardMultiplier: 2.5 },
         rewardCorn: 580,
         rewardFeathers: 4,
     },

     // ─── L26: Timing Challenge ────────────────────────────────────────
     {
         id: 'level_26',
        worldId: 'W2',
         name: 'Timing Challenge',
         laneCount: 1,
         length: 1300,
         gates: [
             { id: 'g1', position: 0.3, lane: 0, x: 0.5, width: 0.08, multiplier: 4, isPositive: true },
             { id: 'g2', position: 0.5, lane: 0, x: 0.5, width: 0.08, multiplier: 2, isPositive: true },
             { id: 'g3', position: 0.7, lane: 0, x: 0.5, width: 0.08, multiplier: 3, isPositive: true },
         ],
         obstacles: [],
         enemySpawns: [
             { time: 3, lane: 0, foxTypeId: 'fox_scout', count: 5 },
             { time: 6, lane: 0, foxTypeId: 'fox_brute', count: 3 },
             { time: 9, lane: 0, foxTypeId: 'fox_scout', count: 4 },
         ],
         fort: { hp: 220, armorMultiplier: 1.6, rewardMultiplier: 2.8 },
         rewardCorn: 650,
         rewardFeathers: 5,
     },

     // ─── L27: Split Decision ──────────────────────────────────────────
     {
         id: 'level_27',
        worldId: 'W2',
         name: 'Split Decision',
         laneCount: 2,
         length: 1300,
         gates: [
             { id: 'g1', position: 0.35, lane: 0, x: 0.25, width: 0.08, multiplier: 5, isPositive: true },
             { id: 'g2', position: 0.35, lane: 1, x: 0.75, width: 0.08, multiplier: 2, isPositive: true },
             { id: 'g3', position: 0.6, lane: 0, x: 0.25, width: 0.08, multiplier: 0.5, isPositive: false },
             { id: 'g4', position: 0.6, lane: 1, x: 0.75, width: 0.08, multiplier: 3, isPositive: true },
         ],
         obstacles: [],
         enemySpawns: [
             { time: 4, lane: 0, foxTypeId: 'fox_scout', count: 4 },
             { time: 6, lane: 1, foxTypeId: 'fox_brute', count: 2 },
             { time: 8, lane: 0, foxTypeId: 'fox_sniper', count: 2 },
         ],
         fort: { hp: 240, armorMultiplier: 1.7, rewardMultiplier: 3.0 },
         rewardCorn: 720,
         rewardFeathers: 5,
     },

     // ═════════════════════════════════════════════════════════════════
     // WORLD 2: OBSTACLE HEAVY (L28-30) — 26% win rate
     // ═══════════════════════════════════════════════════════════════

     // ─── L28: Obstacle Course ───────────────────────────────────────
     {
         id: 'level_28',
        worldId: 'W2',
         name: 'Obstacle Course',
         laneCount: 2,
         length: 1400,
         gates: [
             { id: 'g1', position: 0.3, lane: 0, x: 0.3, width: 0.08, multiplier: 4, isPositive: true },
             { id: 'g2', position: 0.5, lane: 0, x: 0.3, width: 0.08, multiplier: 2, isPositive: true },
         ],
         obstacles: [
             { id: 'o1', type: 'fence', lane: 0, x: 0.3, width: 0.08, position: 0.25, hp: 15, movementPattern: 'static' },
             { id: 'o2', type: 'fence', lane: 0, x: 0.3, width: 0.08, position: 0.45, hp: 20, movementPattern: 'static' },
             { id: 'o3', type: 'fence', lane: 1, x: 0.7, width: 0.08, position: 0.35, hp: 18, movementPattern: 'static' },
             { id: 'o4', type: 'fence', lane: 1, x: 0.7, width: 0.08, position: 0.55, hp: 22, movementPattern: 'static' },
         ],
         enemySpawns: [
             { time: 5, lane: 0, foxTypeId: 'fox_scout', count: 4 },
             { time: 8, lane: 1, foxTypeId: 'fox_brute', count: 3 },
         ],
         fort: { hp: 260, armorMultiplier: 1.7, rewardMultiplier: 3.2 },
         rewardCorn: 780,
         rewardFeathers: 6,
     },

     // ─── L29: Scarecrow Field ───────────────────────────────────────
     {
         id: 'level_29',
        worldId: 'W2',
         name: 'Scarecrow Field',
         laneCount: 2,
         length: 1400,
         gates: [
             { id: 'g1', position: 0.4, lane: 0, x: 0.2, width: 0.08, multiplier: 3, isPositive: true },
             { id: 'g2', position: 0.6, lane: 0, x: 0.2, width: 0.08, multiplier: 5, isPositive: true },
         ],
         obstacles: [
             { id: 'o1', type: 'scarecrow', lane: 0, x: 0.3, width: 0.08, position: 0.4, hp: Infinity, movementPattern: 'rotate' },
             { id: 'o2', type: 'scarecrow', lane: 1, x: 0.7, width: 0.08, position: 0.5, hp: Infinity, movementPattern: 'rotate' },
         ],
         enemySpawns: [
             { time: 4, lane: 0, foxTypeId: 'fox_scout', count: 5 },
             { time: 7, lane: 1, foxTypeId: 'fox_brute', count: 3 },
         ],
         fort: { hp: 280, armorMultiplier: 1.8, rewardMultiplier: 3.5 },
         rewardCorn: 850,
         rewardFeathers: 6,
     },

     // ─── L30: Hay Bale Barrage ──────────────────────────────────────
     {
         id: 'level_30',
        worldId: 'W2',
         name: 'Hay Bale Barrage',
         laneCount: 2,
         length: 1500,
         gates: [
             { id: 'g1', position: 0.35, lane: 0, x: 0.4, width: 0.08, multiplier: 2, isPositive: true },
             { id: 'g2', position: 0.35, lane: 1, x: 0.6, width: 0.08, multiplier: 4, isPositive: true },
         ],
         obstacles: [
             { id: 'o1', type: 'hay_bale', lane: 0, x: 0.4, width: 0.08, position: 0.25, hp: 12, movementPattern: 'static' },
             { id: 'o2', type: 'hay_bale', lane: 0, x: 0.4, width: 0.08, position: 0.45, hp: 18, movementPattern: 'static' },
             { id: 'o3', type: 'hay_bale', lane: 1, x: 0.6, width: 0.08, position: 0.35, hp: 15, movementPattern: 'static' },
             { id: 'o4', type: 'hay_bale', lane: 1, x: 0.6, width: 0.08, position: 0.55, hp: 20, movementPattern: 'static' },
         ],
         enemySpawns: [
             { time: 4, lane: 0, foxTypeId: 'fox_scout', count: 4 },
             { time: 7, lane: 1, foxTypeId: 'fox_brute', count: 3 },
         ],
         fort: { hp: 300, armorMultiplier: 1.9, rewardMultiplier: 4.0 },
         rewardCorn: 860,
         rewardFeathers: 6,
     },

     // ════════════════════════════════════════════════════════════════
     // WORLD 2: HIGH PRESSURE DEFENSES (L31-33) — 25% win rate
     // ════════════════════════════════════════════════════════════════

     // ─── L31: Fort Knox ───────────────────────────────────────────────
     {
         id: 'level_31',
        worldId: 'W2',
         name: 'Fort Knox',
         laneCount: 2,
         length: 1500,
         gates: [
             { id: 'g1', position: 0.4, lane: 0, x: 0.5, width: 0.08, multiplier: 2, isPositive: true },
             { id: 'g2', position: 0.6, lane: 0, x: 0.5, width: 0.08, multiplier: 3, isPositive: true },
         ],
         obstacles: [],
         enemySpawns: [
             { time: 3, lane: 0, foxTypeId: 'fox_scout', count: 6 },
             { time: 6, lane: 1, foxTypeId: 'fox_brute', count: 4 },
             { time: 9, lane: 0, foxTypeId: 'fox_sniper', count: 2 },
         ],
         fort: { hp: 350, armorMultiplier: 2.0, rewardMultiplier: 4.5 },
         rewardCorn: 920,
         rewardFeathers: 7,
     },

     // ─── L32: Iron Fortress ───────────────────────────────────────────
     {
         id: 'level_32',
        worldId: 'W2',
         name: 'Iron Fortress',
         laneCount: 2,
         length: 1600,
         gates: [
             { id: 'g1', position: 0.3, lane: 0, x: 0.3, width: 0.08, multiplier: 4, isPositive: true },
             { id: 'g2', position: 0.5, lane: 0, x: 0.3, width: 0.08, multiplier: 2, isPositive: true },
         ],
         obstacles: [],
         enemySpawns: [
             { time: 4, lane: 0, foxTypeId: 'fox_scout', count: 6 },
             { time: 7, lane: 1, foxTypeId: 'fox_brute', count: 4 },
             { time: 10, lane: 0, foxTypeId: 'fox_sniper', count: 3 },
         ],
         fort: { hp: 400, armorMultiplier: 2.2, rewardMultiplier: 5.0 },
         rewardCorn: 980,
         rewardFeathers: 8,
     },

     // ─── L33: Bastion ───────────────────────────────────────────────
     {
         id: 'level_33',
        worldId: 'W2',
         name: 'Bastion',
         laneCount: 2,
         length: 1600,
         gates: [
             { id: 'g1', position: 0.35, lane: 0, x: 0.4, width: 0.08, multiplier: 3, isPositive: true },
             { id: 'g2', position: 0.35, lane: 1, x: 0.6, width: 0.08, multiplier: 2, isPositive: true },
         ],
         obstacles: [],
         enemySpawns: [
             { time: 3, lane: 0, foxTypeId: 'fox_scout', count: 8 },
             { time: 7, lane: 1, foxTypeId: 'fox_brute', count: 5 },
             { time: 11, lane: 0, foxTypeId: 'fox_sniper', count: 3 },
         ],
         fort: { hp: 450, armorMultiplier: 2.3, rewardMultiplier: 5.5 },
         rewardCorn: 1050,
         rewardFeathers: 9,
     },

     // ═════════════════════════════════════════════════════════════════
     // WORLD 2: ULTIMATE BOSS WAVE (L34-36) — 25% win rate
     // ═══════════════════════════════════════════════════════════════

     // ─── L34: The Gauntlet ───────────────────────────────────────────
     {
         id: 'level_34',
        worldId: 'W2',
         name: 'The Gauntlet',
         laneCount: 3,
         length: 1700,
         gates: [
             { id: 'g1', position: 0.25, lane: 0, x: 1/6, width: 0.08, multiplier: 4, isPositive: true },
             { id: 'g2', position: 0.25, lane: 1, x: 0.5, width: 0.08, multiplier: 2, isPositive: true },
             { id: 'g3', position: 0.25, lane: 2, x: 5/6, width: 0.08, multiplier: 5, isPositive: true },
             { id: 'g4', position: 0.5, lane: 1, x: 0.5, width: 0.08, multiplier: 3, isPositive: true },
         ],
         obstacles: [
             { id: 'o1', type: 'fence', lane: 0, x: 1/6, width: 0.08, position: 0.2, hp: 25, movementPattern: 'static' },
             { id: 'o2', type: 'fence', lane: 2, x: 5/6, width: 0.08, position: 0.8, hp: 30, movementPattern: 'static' },
         ],
         enemySpawns: [
             { time: 4, lane: 0, foxTypeId: 'fox_scout', count: 5 },
             { time: 6, lane: 1, foxTypeId: 'fox_brute', count: 4 },
             { time: 8, lane: 2, foxTypeId: 'fox_sniper', count: 3 },
             { time: 10, lane: 0, foxTypeId: 'fox_scout', count: 4 },
         ],
         fort: { hp: 500, armorMultiplier: 2.4, rewardMultiplier: 6.0 },
         rewardCorn: 1120,
         rewardFeathers: 10,
     },

     // ─── L35: Swarm Overload ────────────────────────────────────────
     {
         id: 'level_35',
        worldId: 'W2',
         name: 'Swarm Overload',
         laneCount: 3,
         length: 1800,
         gates: [
             { id: 'g1', position: 0.3, lane: 0, x: 1/6, width: 0.08, multiplier: 5, isPositive: true },
             { id: 'g2', position: 0.3, lane: 1, x: 0.5, width: 0.08, multiplier: 2, isPositive: true },
             { id: 'g3', position: 0.3, lane: 2, x: 5/6, width: 0.08, multiplier: 4, isPositive: true },
             { id: 'g4', position: 0.55, lane: 1, x: 0.5, width: 0.08, multiplier: 3, isPositive: true },
         ],
         obstacles: [
             { id: 'o1', type: 'scarecrow', lane: 0, x: 1/6, width: 0.08, position: 0.3, hp: Infinity, movementPattern: 'rotate' },
             { id: 'o2', type: 'scarecrow', lane: 2, x: 5/6, width: 0.08, position: 0.7, hp: Infinity, movementPattern: 'rotate' },
         ],
         enemySpawns: [
             { time: 3, lane: 0, foxTypeId: 'fox_scout', count: 6 },
             { time: 5, lane: 1, foxTypeId: 'fox_brute', count: 5 },
             { time: 7, lane: 2, foxTypeId: 'fox_sniper', count: 4 },
             { time: 9, lane: 0, foxTypeId: 'fox_scout', count: 6 },
             { time: 11, lane: 1, foxTypeId: 'fox_brute', count: 4 },
         ],
         fort: { hp: 550, armorMultiplier: 2.5, rewardMultiplier: 6.5 },
         rewardCorn: 1200,
         rewardFeathers: 11,
     },

     // ─── L36: Final Siege ───────────────────────────────────────────
     {
         id: 'level_36',
        worldId: 'W2',
         name: 'Final Siege',
         laneCount: 3,
         length: 2000,
         gates: [
             { id: 'g1', position: 0.2, lane: 0, x: 1/6, width: 0.08, multiplier: 6, isPositive: true },
             { id: 'g2', position: 0.2, lane: 1, x: 0.5, width: 0.08, multiplier: 3, isPositive: true },
             { id: 'g3', position: 0.2, lane: 2, x: 5/6, width: 0.08, multiplier: 4, isPositive: true },
             { id: 'g4', position: 0.45, lane: 1, x: 0.5, width: 0.08, multiplier: 5, isPositive: true },
             { id: 'g5', position: 0.45, lane: 0, x: 1/6, width: 0.08, multiplier: 0.5, isPositive: false },
             { id: 'g6', position: 0.45, lane: 2, x: 5/6, width: 0.08, multiplier: 2, isPositive: true },
         ],
         obstacles: [
             { id: 'o1', type: 'fence', lane: 0, x: 1/6, width: 0.08, position: 0.2, hp: 30, movementPattern: 'static' },
             { id: 'o2', type: 'fence', lane: 2, x: 5/6, width: 0.08, position: 0.8, hp: 35, movementPattern: 'static' },
             { id: 'o3', type: 'scarecrow', lane: 0, x: 1/6, width: 0.08, position: 0.35, hp: Infinity, movementPattern: 'rotate' },
             { id: 'o4', type: 'scarecrow', lane: 2, x: 5/6, width: 0.08, position: 0.65, hp: Infinity, movementPattern: 'rotate' },
         ],
         enemySpawns: [
             { time: 3, lane: 0, foxTypeId: 'fox_scout', count: 6 },
             { time: 5, lane: 1, foxTypeId: 'fox_brute', count: 5 },
             { time: 7, lane: 2, foxTypeId: 'fox_sniper', count: 4 },
             { time: 9, lane: 0, foxTypeId: 'fox_scout', count: 6 },
             { time: 11, lane: 1, foxTypeId: 'fox_brute', count: 4 },
             { time: 13, lane: 2, foxTypeId: 'fox_sniper', count: 3 },
         ],
         fort: { hp: 600, armorMultiplier: 2.6, rewardMultiplier: 7.0 },
         rewardCorn: 1280,
         rewardFeathers: 12,
     },
 ];

const GENERATED_LEVELS: LevelDefinition[] = [];
for (let i = 36; i < 108; i++) {
    GENERATED_LEVELS.push(generateCampaignLevel(i));
}

export const LEVELS: LevelDefinition[] = [...HANDAUTHED_LEVELS, ...GENERATED_LEVELS];

export function getLevel(index: number): LevelDefinition {
    if (index < 0 || index >= LEVELS.length) {
        throw new Error(`Level index out of range: ${index}`);
    }
    return LEVELS[index];
}

export const TOTAL_LEVELS = LEVELS.length;

export const WORLDS: WorldDefinition[] = [
    {
        id: 'W1',
        name: 'Spring Valley',
        levels: LEVELS.filter(l => l.worldId === 'W1').map(l => l.id),
        theme: 'grassland',
        unlocked: true,
    },
    {
        id: 'W2',
        name: 'Scorching Sands',
        levels: LEVELS.filter(l => l.worldId === 'W2').map(l => l.id),
        theme: 'desert',
        unlocked: false,
    },
    {
        id: 'W3',
        name: 'Frozen Peaks',
        levels: LEVELS.filter(l => l.worldId === 'W3').map(l => l.id),
        theme: 'snow',
        unlocked: false,
    },
    {
        id: 'W4',
        name: 'Volcanic Depths',
        levels: LEVELS.filter(l => l.worldId === 'W4').map(l => l.id),
        theme: 'lava',
        unlocked: false,
    },
    {
        id: 'W5',
        name: 'Mystic Grove',
        levels: LEVELS.filter(l => l.worldId === 'W5').map(l => l.id),
        theme: 'meadow_night',
        unlocked: false,
    },
    {
        id: 'W6',
        name: 'Shadow Realm',
        levels: LEVELS.filter(l => l.worldId === 'W6').map(l => l.id),
        theme: 'magma_cave',
        unlocked: false,
    },
];

export function getWorld(worldId: string): WorldDefinition | undefined {
    return WORLDS.find(w => w.id === worldId);
}

export function getLevelsForWorld(worldId: string): LevelDefinition[] {
    return LEVELS.filter(l => l.worldId === worldId);
}

export function getWorldForLevel(levelId: string): WorldDefinition | undefined {
    const level = LEVELS.find(l => l.id === levelId);
    return level ? getWorld(level.worldId) : undefined;
}
