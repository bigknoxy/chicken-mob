import { describe, it, expect } from 'vitest';
import { CHICKENS, getChicken } from '../data/chickens';
import { FOXES, getFox } from '../data/foxes';
import { CANNONS, getCannon } from '../data/cannons';
import { getLevel, TOTAL_LEVELS } from '../data/levels';
import { UPGRADES, getUpgradeCost, getUpgradeValue } from '../data/upgrades';
import { resolveCombat } from '../systems/CombatSystem';
import { applyGateMultiplier } from '../systems/GateSystem';
import { calculateOfflineEarnings } from '../systems/OfflineSystem';
import type { PlayerState, GateDefinition } from '../data/types';

// ── Data Integrity ──

describe('Data Integrity', () => {
    it('all chicken types have valid stats', () => {
        for (const c of CHICKENS) {
            expect(c.id).toBeTruthy();
            expect(c.name).toBeTruthy();
            expect(c.baseCountPerShot).toBeGreaterThan(0);
            expect(c.moveSpeed).toBeGreaterThan(0);
            expect(c.hpPerChicken).toBeGreaterThan(0);
            expect(c.damagePerChicken).toBeGreaterThan(0);
            expect(c.size).toBeGreaterThan(0);
        }
    });

    it('all fox types have valid stats', () => {
        for (const f of FOXES) {
            expect(f.id).toBeTruthy();
            expect(f.moveSpeed).toBeGreaterThan(0);
            expect(f.hpPerFox).toBeGreaterThan(0);
            expect(f.damagePerFox).toBeGreaterThan(0);
        }
    });

    it('all cannon definitions reference valid chicken types', () => {
        for (const c of CANNONS) {
            expect(() => getChicken(c.unitTypeId)).not.toThrow();
            expect(c.fireRate).toBeGreaterThan(0);
            expect(c.burstSize).toBeGreaterThan(0);
        }
    });

    it('all level definitions are valid', () => {
        expect(TOTAL_LEVELS).toBe(15);
        for (let i = 0; i < TOTAL_LEVELS; i++) {
            const level = getLevel(i);
            expect(level.id).toBeTruthy();
            expect(level.laneCount).toBeGreaterThan(0);
            expect(level.length).toBeGreaterThan(0);
            expect(level.fort.hp).toBeGreaterThan(0);
            expect(level.rewardCorn).toBeGreaterThan(0);

            // Gates should reference valid lanes
            for (const gate of level.gates) {
                expect(gate.lane).toBeGreaterThanOrEqual(0);
                expect(gate.lane).toBeLessThan(level.laneCount);
                expect(gate.position).toBeGreaterThanOrEqual(0);
                expect(gate.position).toBeLessThanOrEqual(1);
            }

            // Obstacles should reference valid lanes
            for (const obs of level.obstacles) {
                expect(obs.lane).toBeGreaterThanOrEqual(0);
                expect(obs.lane).toBeLessThan(level.laneCount);
            }

            // Enemy spawns should reference valid fox types and lanes
            for (const spawn of level.enemySpawns) {
                expect(() => getFox(spawn.foxTypeId)).not.toThrow();
                expect(spawn.lane).toBeGreaterThanOrEqual(0);
                expect(spawn.lane).toBeLessThan(level.laneCount);
                expect(spawn.count).toBeGreaterThan(0);
            }
        }
    });

    it('all upgrade definitions have valid cost curves', () => {
        for (const u of UPGRADES) {
            expect(u.baseCost).toBeGreaterThan(0);
            expect(u.costGrowthFactor).toBeGreaterThan(1);
            expect(u.maxLevel).toBeGreaterThan(0);

            // Verify costs don't produce NaN or Infinity up to max level
            for (let level = 0; level < u.maxLevel; level++) {
                const cost = getUpgradeCost(u, level);
                expect(cost).toBeGreaterThan(0);
                expect(Number.isFinite(cost)).toBe(true);
            }
        }
    });

    it('upgrade values increase over levels', () => {
        for (const u of UPGRADES) {
            const val0 = getUpgradeValue(u, 0);
            const val5 = getUpgradeValue(u, 5);
            expect(val5).toBeGreaterThan(val0);
        }
    });
});

// ── Combat System ──

describe('Combat System', () => {
    it('chickens win when they have more power', () => {
        const chicken = getChicken('clucky');
        const fox = getFox('fox_scout');
        const result = resolveCombat(10, chicken, 3, fox);
        expect(result.chickensSurviving).toBeGreaterThan(0);
        expect(result.foxesSurviving).toBe(0);
    });

    it('foxes win when they have more power', () => {
        const chicken = getChicken('clucky');
        const fox = getFox('fox_brute');
        const result = resolveCombat(2, chicken, 5, fox);
        expect(result.chickensSurviving).toBe(0);
        expect(result.foxesSurviving).toBeGreaterThan(0);
    });

    it('tie eliminates both sides', () => {
        const chicken = getChicken('clucky');
        const fox = getFox('fox_scout');
        // clucky does 1 dmg, fox_scout does 1 dmg; equal counts = tie
        const result = resolveCombat(5, chicken, 5, fox);
        expect(result.chickensSurviving).toBe(0);
        expect(result.foxesSurviving).toBe(0);
    });
});

// ── Gate System ──

describe('Gate System', () => {
    it('positive gate multiplies flock count', () => {
        const gate: GateDefinition = {
            id: 'test', position: 0.5, lane: 0, width: 60,
            multiplier: 3, isPositive: true,
        };
        expect(applyGateMultiplier(5, gate)).toBe(15);
    });

    it('negative gate reduces flock count', () => {
        const gate: GateDefinition = {
            id: 'test', position: 0.5, lane: 0, width: 60,
            multiplier: 0.5, isPositive: false,
        };
        expect(applyGateMultiplier(10, gate)).toBe(5);
    });

    it('kill gate eliminates entire flock', () => {
        const gate: GateDefinition = {
            id: 'test', position: 0.5, lane: 0, width: 60,
            multiplier: 0, isPositive: false,
        };
        expect(applyGateMultiplier(20, gate)).toBe(0);
    });
});

// ── Offline System ──

describe('Offline System', () => {
    it('calculates correct offline earnings', () => {
        const playerState: PlayerState = {
            currencies: { corn: 100, golden_feather: 0 },
            ownedChickens: ['clucky'],
            ownedBarnCannons: ['barn_basic'],
            equippedCannonId: 'barn_basic',
            equippedChickenId: 'clucky',
            upgrades: {},
            currentLevel: 0,
            unlockedLevels: 1,
            coop: { cornPerSecond: 2.0, offlineCapSeconds: 3600 },
            lastSessionTimestamp: Date.now() - 1800_000, // 30 minutes ago
            totalCornEarned: 0,
            totalLevelsCompleted: 0,
            levelStars: {},
        };

        const earnings = calculateOfflineEarnings(playerState);
        expect(earnings.corn).toBe(3600); // 2.0 corn/sec × 1800 seconds
        expect(earnings.cornPerSecond).toBe(2.0);
    });

    it('caps offline earnings at offlineCapSeconds', () => {
        const playerState: PlayerState = {
            currencies: { corn: 0, golden_feather: 0 },
            ownedChickens: ['clucky'],
            ownedBarnCannons: ['barn_basic'],
            equippedCannonId: 'barn_basic',
            equippedChickenId: 'clucky',
            upgrades: {},
            currentLevel: 0,
            unlockedLevels: 1,
            coop: { cornPerSecond: 1.0, offlineCapSeconds: 3600 }, // 1 hour cap
            lastSessionTimestamp: Date.now() - 86400_000, // 24 hours ago
            totalCornEarned: 0,
            totalLevelsCompleted: 0,
            levelStars: {},
        };

        const earnings = calculateOfflineEarnings(playerState);
        expect(earnings.corn).toBe(3600); // Capped at 1 hour
        expect(earnings.cappedSeconds).toBe(3600);
    });

    it('returns 0 for no elapsed time', () => {
        const playerState: PlayerState = {
            currencies: { corn: 0, golden_feather: 0 },
            ownedChickens: ['clucky'],
            ownedBarnCannons: ['barn_basic'],
            equippedCannonId: 'barn_basic',
            equippedChickenId: 'clucky',
            upgrades: {},
            currentLevel: 0,
            unlockedLevels: 1,
            coop: { cornPerSecond: 1.0, offlineCapSeconds: 3600 },
            lastSessionTimestamp: Date.now(),
            totalCornEarned: 0,
            totalLevelsCompleted: 0,
            levelStars: {},
        };

        const earnings = calculateOfflineEarnings(playerState);
        expect(earnings.corn).toBe(0);
    });
});

// ── Cannon Lookup ──

describe('Cannon Lookup', () => {
    it('getCannon returns valid cannon', () => {
        const cannon = getCannon('barn_basic');
        expect(cannon.name).toBe('Old Barn');
    });

    it('getCannon throws on invalid id', () => {
        expect(() => getCannon('nonexistent')).toThrow();
    });
});
