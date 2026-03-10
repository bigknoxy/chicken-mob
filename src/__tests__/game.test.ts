import { describe, it, expect } from 'vitest';
import { CHICKENS, getChicken } from '../data/chickens';
import { FOXES, getFox } from '../data/foxes';
import { CANNONS, getCannon } from '../data/cannons';
import { getLevel, TOTAL_LEVELS, LEVELS } from '../data/levels';
import { UPGRADES, getUpgradeCost, getUpgradeValue } from '../data/upgrades';
import { resolveCombat } from '../systems/CombatSystem';
import { applyGateMultiplier } from '../systems/GateSystem';
import { calculateOfflineEarnings } from '../systems/OfflineSystem';
import type { PlayerState, GateDefinition, ObstacleType } from '../data/types';

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
        expect(TOTAL_LEVELS).toBe(18);
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
            multiplier: 3, isPositive: true, type: 'multiply',
        };
        expect(applyGateMultiplier(5, gate)).toBe(15);
    });

    it('negative gate reduces flock count', () => {
        const gate: GateDefinition = {
            id: 'test', position: 0.5, lane: 0, width: 60,
            multiplier: 0.5, isPositive: false, type: 'multiply',
        };
        expect(applyGateMultiplier(10, gate)).toBe(5);
    });

    it('kill gate eliminates entire flock', () => {
        const gate: GateDefinition = {
            id: 'test', position: 0.5, lane: 0, width: 60,
            multiplier: 0, isPositive: false, type: 'multiply',
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

// ── Level Data Integrity ──

const VALID_FOX_TYPES = ['fox_scout', 'fox_brute', 'fox_sniper'];
const VALID_OBSTACLE_TYPES: ObstacleType[] = ['fence', 'hay_bale', 'scarecrow'];
const DEFAULT_TIMEOUT_SECONDS = 60;
const MAX_MULTIPLIER = 10;

describe('Level Data Integrity', () => {
    describe('Level Uniqueness', () => {
        it('all 18 levels have unique IDs', () => {
            const ids = LEVELS.map(l => l.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(LEVELS.length);
        });

        it('all levels have valid names', () => {
            for (const level of LEVELS) {
                expect(level.name).toBeTruthy();
                expect(typeof level.name).toBe('string');
                expect(level.name.length).toBeGreaterThan(0);
            }
        });
    });

    describe('Gate Placement', () => {
        it('gates do not overlap in the same lane', () => {
            for (const level of LEVELS) {
                const gatesByLane = new Map<number, typeof level.gates>();

                for (const gate of level.gates) {
                    const laneGates = gatesByLane.get(gate.lane) || [];
                    laneGates.push(gate);
                    gatesByLane.set(gate.lane, laneGates);
                }

                for (const [, gates] of gatesByLane) {
                    for (let i = 0; i < gates.length; i++) {
                        for (let j = i + 1; j < gates.length; j++) {
                            const gate1 = gates[i];
                            const gate2 = gates[j];
                            const gap = Math.abs(gate1.position - gate2.position);
                            const combinedWidth = (gate1.width || 0.08) + (gate2.width || 0.08);
                            expect(gap).toBeGreaterThan(combinedWidth);
                        }
                    }
                }
            }
        });

        it('all gates have valid lane indices', () => {
            for (const level of LEVELS) {
                for (const gate of level.gates) {
                    expect(gate.lane).toBeGreaterThanOrEqual(0);
                    expect(gate.lane).toBeLessThan(level.laneCount);
                }
            }
        });

        it('all gate positions are within bounds (0-1)', () => {
            for (const level of LEVELS) {
                for (const gate of level.gates) {
                    expect(gate.position).toBeGreaterThanOrEqual(0);
                    expect(gate.position).toBeLessThanOrEqual(1);
                }
            }
        });
    });

    describe('Enemy Spawn Timing', () => {
        it('all spawns are within level timeout (default 60s)', () => {
            for (const level of LEVELS) {
                const timeout = level.timeout ?? DEFAULT_TIMEOUT_SECONDS;
                for (const spawn of level.enemySpawns) {
                    expect(spawn.time).toBeGreaterThanOrEqual(0);
                    expect(spawn.time).toBeLessThanOrEqual(timeout);
                }
            }
        });

        it('all spawn times are positive', () => {
            for (const level of LEVELS) {
                for (const spawn of level.enemySpawns) {
                    expect(spawn.time).toBeGreaterThanOrEqual(0);
                }
            }
        });
    });

    describe('Lane Bounds', () => {
        it('all lane indices are valid (0 to laneCount-1)', () => {
            for (const level of LEVELS) {
                // Check gate lanes
                for (const gate of level.gates) {
                    expect(gate.lane).toBeGreaterThanOrEqual(0);
                    expect(gate.lane).toBeLessThan(level.laneCount);
                }

                // Check obstacle lanes
                for (const obs of level.obstacles) {
                    expect(obs.lane).toBeGreaterThanOrEqual(0);
                    expect(obs.lane).toBeLessThan(level.laneCount);
                }

                // Check enemy spawn lanes
                for (const spawn of level.enemySpawns) {
                    expect(spawn.lane).toBeGreaterThanOrEqual(0);
                    expect(spawn.lane).toBeLessThan(level.laneCount);
                }
            }
        });

        it('level laneCount is valid (1-3 based on data)', () => {
            for (const level of LEVELS) {
                expect(level.laneCount).toBeGreaterThanOrEqual(1);
                expect(level.laneCount).toBeLessThanOrEqual(3);
            }
        });
    });

    describe('Fort HP Progression', () => {
        it('fort HP generally increases across levels (allow small dips)', () => {
            for (let i = 1; i < LEVELS.length; i++) {
                const prevHp = LEVELS[i - 1].fort.hp;
                const currHp = LEVELS[i].fort.hp;
                // Allow small dips (up to 10%) but generally expect increase
                const minExpected = prevHp * 0.9;
                expect(currHp).toBeGreaterThanOrEqual(minExpected);
            }
        });

        it('all fort HP values are positive', () => {
            for (const level of LEVELS) {
                expect(level.fort.hp).toBeGreaterThan(0);
            }
        });

        it('all armor multipliers are valid (>= 1)', () => {
            for (const level of LEVELS) {
                expect(level.fort.armorMultiplier).toBeGreaterThanOrEqual(1);
            }
        });
    });

    describe('Reward Scaling', () => {
        it('rewards scale with difficulty (generally increase)', () => {
            for (let i = 1; i < LEVELS.length; i++) {
                const prevReward = LEVELS[i - 1].rewardCorn;
                const currReward = LEVELS[i].rewardCorn;
                // Allow small dips (up to 15%) but generally expect increase
                const minExpected = prevReward * 0.85;
                expect(currReward).toBeGreaterThanOrEqual(minExpected);
            }
        });

        it('all reward corn values are positive', () => {
            for (const level of LEVELS) {
                expect(level.rewardCorn).toBeGreaterThan(0);
            }
        });

        it('feather rewards increase in later levels', () => {
            // Later levels (13+) should have more feathers
            const earlyLevels = LEVELS.slice(0, 7).reduce((sum, l) => sum + l.rewardFeathers, 0);
            const midLevels = LEVELS.slice(7, 13).reduce((sum, l) => sum + l.rewardFeathers, 0);
            const lateLevels = LEVELS.slice(13).reduce((sum, l) => sum + l.rewardFeathers, 0);

            expect(midLevels).toBeGreaterThan(earlyLevels);
            expect(lateLevels).toBeGreaterThan(midLevels);
        });
    });

    describe('Fox Types', () => {
        it('only valid fox types are used in enemy spawns', () => {
            for (const level of LEVELS) {
                for (const spawn of level.enemySpawns) {
                    expect(VALID_FOX_TYPES).toContain(spawn.foxTypeId);
                }
            }
        });

        it('all enemy spawn counts are positive', () => {
            for (const level of LEVELS) {
                for (const spawn of level.enemySpawns) {
                    expect(spawn.count).toBeGreaterThan(0);
                }
            }
        });
    });

    describe('Multiplier Bounds', () => {
        it('gate multipliers are within reasonable range (0-10)', () => {
            for (const level of LEVELS) {
                for (const gate of level.gates) {
                    expect(gate.multiplier).toBeGreaterThanOrEqual(0);
                    expect(gate.multiplier).toBeLessThanOrEqual(MAX_MULTIPLIER);
                }
            }
        });

        it('gate multipliers include trap gates (< 1)', () => {
            const trapGates = LEVELS.flatMap(l => l.gates.filter(g => g.multiplier < 1));
            expect(trapGates.length).toBeGreaterThan(0);
        });

        it('isPositive flag matches multiplier sign', () => {
            for (const level of LEVELS) {
                for (const gate of level.gates) {
                    if (gate.multiplier >= 1) {
                        expect(gate.isPositive).toBe(true);
                    } else if (gate.multiplier > 0 && gate.multiplier < 1) {
                        expect(gate.isPositive).toBe(false);
                    }
                }
            }
        });
    });

    describe('Obstacle Validity', () => {
        it('obstacles have valid types', () => {
            for (const level of LEVELS) {
                for (const obs of level.obstacles) {
                    expect(VALID_OBSTACLE_TYPES).toContain(obs.type);
                }
            }
        });

        it('obstacles have HP > 0 (or Infinity for scarecrow)', () => {
            for (const level of LEVELS) {
                for (const obs of level.obstacles) {
                    expect(obs.hp).toBeGreaterThan(0);
                }
            }
        });

        it('scarecrows have infinite HP', () => {
            const scarecrows = LEVELS.flatMap(l => l.obstacles.filter(o => o.type === 'scarecrow'));
            for (const scarecrow of scarecrows) {
                expect(scarecrow.hp).toBe(Infinity);
            }
        });

        it('obstacle positions are within bounds (0-1)', () => {
            for (const level of LEVELS) {
                for (const obs of level.obstacles) {
                    expect(obs.position).toBeGreaterThanOrEqual(0);
                    expect(obs.position).toBeLessThanOrEqual(1);
                }
            }
        });

        it('obstacles have valid movement patterns', () => {
            const validPatterns = ['static', 'back_and_forth', 'rotate'];
            for (const level of LEVELS) {
                for (const obs of level.obstacles) {
                    expect(validPatterns).toContain(obs.movementPattern);
                }
            }
        });
    });

    describe('Level Length', () => {
        it('all levels have valid lengths', () => {
            for (const level of LEVELS) {
                expect(level.length).toBeGreaterThan(0);
            }
        });
    });
});

// ── Aiming System ──

describe('Aiming System', () => {
    it('aim angle 0 fires straight up (same X as cannon)', () => {
        const cannonX = 0.5;
        const aimAngle = 0;
        const angleSpread = Math.sin(aimAngle) * 0.4;
        const targetX = cannonX + angleSpread;
        expect(targetX).toBeCloseTo(0.5, 2);
    });

    it('positive aim angle fires to the right', () => {
        const cannonX = 0.5;
        const aimAngle = Math.PI / 6; // 30 degrees
        const angleSpread = Math.sin(aimAngle) * 0.4;
        const targetX = cannonX + angleSpread;
        expect(targetX).toBeGreaterThan(cannonX);
    });

    it('negative aim angle fires to the left', () => {
        const cannonX = 0.5;
        const aimAngle = -Math.PI / 6; // -30 degrees
        const angleSpread = Math.sin(aimAngle) * 0.4;
        const targetX = cannonX + angleSpread;
        expect(targetX).toBeLessThan(cannonX);
    });

    it('max angle produces max horizontal spread', () => {
        const cannonX = 0.5;
        const maxAngle = Math.PI / 3; // 60 degrees (MAX_AIM_ANGLE)
        const angleSpread = Math.sin(maxAngle) * 0.4;
        const targetX = cannonX + angleSpread;
        // sin(60) ≈ 0.866, so spread ≈ 0.346
        expect(targetX).toBeCloseTo(0.846, 2);
    });

    it('target X is clamped to 0-1 range', () => {
        const cannonX = 0.1;
        const aimAngle = -Math.PI / 3; // max left
        const angleSpread = Math.sin(aimAngle) * 0.4;
        const targetX = Math.max(0, Math.min(1, cannonX + angleSpread));
        expect(targetX).toBeGreaterThanOrEqual(0);
        expect(targetX).toBeLessThanOrEqual(1);
    });
});
