import { describe, it, expect, vi, beforeEach } from 'vitest';
import { simulationTick } from '../core/Simulation';
import type { GameState, GateDefinition, EnemySpawn } from '../data/types';
import { getFox } from '../data/foxes';

// Mock audio to avoid playing sounds during tests
vi.mock('../platform/Audio', () => ({
    audio: {
        playMultiply: vi.fn(),
        playTrap: vi.fn(),
        playCombat: vi.fn(),
    },
}));

import { audio } from '../platform/Audio';

// Helper to create a fresh game state for testing
function createTestState(overrides?: Partial<GameState>): GameState {
    const defaultState: GameState = {
        level: {
            id: 'test_level',
            name: 'Test Level',
            laneCount: 2,
            length: 800,
            gates: [],
            obstacles: [],
            enemySpawns: [],
            fort: { hp: 50, armorMultiplier: 1, rewardMultiplier: 1 },
            rewardCorn: 100,
            rewardFeathers: 0,
            timeout: 60,
        },
        flocks: [],
        foxPacks: [],
        obstacles: [],
        gates: [],
        fort: { currentHp: 50, maxHp: 50, armorMultiplier: 1 },
        elapsedTime: 0,
        cannonAngle: 0,
        cannonCooldown: 0,
        isFiring: false,
        nextEntityId: 1,
        levelComplete: false,
        levelWon: false,
        pendingSpawns: [],
        particles: [],
        screenShake: 0,
        victoryFlash: 0,
        totalChickensFired: 0,
        totalChickensReachedFort: 0,
        currentChickensOnField: 0,
    };

    return { ...defaultState, ...overrides } as GameState;
}

// Helper to create a test flock
function createTestFlock(overrides?: Record<string, unknown>) {
    return {
        id: 1,
        chickenTypeId: 'clucky',
        count: 10,
        lane: 0,
        x: 0.5,
        position: 0,
        speed: 200,
        alive: true,
        ...overrides,
    };
}

// Helper to create a test gate (returns LiveGate format)
function createTestGate(overrides?: Partial<GateDefinition>): { id: number; definition: GateDefinition; triggered: boolean } {
    return {
        id: 1,
        definition: {
            id: 'test_gate',
            position: 0.5,
            lane: 0,
            x: 0.5,
            width: 0.08,
            multiplier: 2,
            isPositive: true,
            ...overrides,
        },
        triggered: false,
    };
}

// Helper to create an enemy spawn definition
function createTestSpawn(overrides?: Partial<EnemySpawn>): EnemySpawn {
    return {
        time: 0,
        lane: 0,
        foxTypeId: 'fox_scout',
        count: 3,
        ...overrides,
    };
}

describe('Enemy Spawn Gates', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Gate with spawnEnemy', () => {
        it('spawns foxes when chickens pass through enemy spawn gate', () => {
            const spawnDef = createTestSpawn({ foxTypeId: 'fox_scout', count: 3, lane: 0 });
            const gate = createTestGate({
                spawnEnemy: spawnDef,
                isPositive: false,
                multiplier: 1, // neutral - just spawns enemies
            });

            // Start flock at 0.49, gate at 0.5, speed 200, dt 0.05 -> crosses gate
            const state = createTestState({
                gates: [gate],
                flocks: [createTestFlock({ position: 0.49, x: 0.5, lane: 0, count: 10, speed: 200 })],
            });

            // Simulate tick where flock crosses the gate
            simulationTick(state, 0.05);

            // Should have spawned a fox pack
            expect(state.foxPacks).toHaveLength(1);
            expect(state.foxPacks[0].foxTypeId).toBe('fox_scout');
            expect(state.foxPacks[0].count).toBe(3);
            expect(state.foxPacks[0].lane).toBe(0);
            expect(state.foxPacks[0].alive).toBe(true);
        });

        it('spawns foxes in the correct lane when gate has multiple lanes', () => {
            const spawnDef = createTestSpawn({ foxTypeId: 'fox_brute', count: 2, lane: 1 });
            const gate = createTestGate({
                spawnEnemy: spawnDef,
                lane: 1,
                x: 0.75,
            });

            const state = createTestState({
                gates: [gate],
                flocks: [createTestFlock({ position: 0.49, x: 0.75, lane: 1, count: 10, speed: 200 })],
            });

            simulationTick(state, 0.05);

            expect(state.foxPacks).toHaveLength(1);
            expect(state.foxPacks[0].foxTypeId).toBe('fox_brute');
            expect(state.foxPacks[0].lane).toBe(1);
            expect(state.foxPacks[0].count).toBe(2);
        });

        it('skips spawn if fox type is unknown', () => {
            const spawnDef = createTestSpawn({ foxTypeId: 'unknown_fox', count: 3 });
            const gate = createTestGate({
                spawnEnemy: spawnDef,
            });

            const state = createTestState({
                gates: [gate],
                flocks: [createTestFlock({ position: 0.49, x: 0.5, count: 10, speed: 200 })],
            });

            // Should not throw and should not spawn any foxes
            expect(() => simulationTick(state, 0.05)).not.toThrow();
            expect(state.foxPacks).toHaveLength(0);
        });

        it('plays trap sound when enemy spawn gate is triggered', () => {
            const spawnDef = createTestSpawn();
            const gate = createTestGate({ spawnEnemy: spawnDef });

            const state = createTestState({
                gates: [gate],
                flocks: [createTestFlock({ position: 0.49, x: 0.5, count: 10, speed: 200 })],
            });

            simulationTick(state, 0.05);

            expect(audio.playTrap).toHaveBeenCalled();
        });
    });

    describe('Gate processing with missing x property', () => {
        it('uses lane center when gate.x is undefined', () => {
            const gate = createTestGate({
                x: undefined,
                lane: 0,
            });

            const state = createTestState({
                gates: [gate],
                flocks: [createTestFlock({ position: 0.49, x: undefined, lane: 0, count: 10, speed: 200 })],
            });

            // Should not throw and should process normally
            expect(() => simulationTick(state, 0.05)).not.toThrow();
        });

        it('uses lane center when flock.x is undefined', () => {
            const gate = createTestGate({
                x: 0.5,
            });

            const state = createTestState({
                gates: [gate],
                flocks: [createTestFlock({ position: 0.49, x: undefined, lane: 0, count: 10, speed: 200 })],
            });

            // Should not throw
            expect(() => simulationTick(state, 0.05)).not.toThrow();
        });

        it('processes gates with both gate.x and flock.x undefined', () => {
            const gate = createTestGate({
                x: undefined,
                lane: 0,
            });

            const state = createTestState({
                gates: [gate],
                flocks: [createTestFlock({ position: 0.49, x: undefined, lane: 0, count: 10, speed: 200 })],
            });

            // Should not throw - uses lane center fallback
            expect(() => simulationTick(state, 0.05)).not.toThrow();
        });
    });

    describe('Audio feedback', () => {
        it('plays multiply sound for positive gate pass-through', () => {
            const gate = createTestGate({
                isPositive: true,
                multiplier: 2,
            });

            const state = createTestState({
                gates: [gate],
                flocks: [createTestFlock({ position: 0.49, count: 10, speed: 200 })],
            });

            simulationTick(state, 0.05);

            expect(audio.playMultiply).toHaveBeenCalled();
        });

        it('plays trap sound for negative gate pass-through', () => {
            const gate = createTestGate({
                isPositive: false,
                multiplier: 0.5,
            });

            const state = createTestState({
                gates: [gate],
                flocks: [createTestFlock({ position: 0.49, count: 10, speed: 200 })],
            });

            simulationTick(state, 0.05);

            expect(audio.playTrap).toHaveBeenCalled();
        });

        it('plays combat sound when flock collides with fox pack', () => {
            const foxType = getFox('fox_scout');

            const state = createTestState({
                flocks: [createTestFlock({ position: 0.5, count: 10, lane: 0 })],
                foxPacks: [
                    {
                        id: 1,
                        foxTypeId: 'fox_scout',
                        count: 3,
                        lane: 0,
                        x: 0.5,
                        position: 0.5,
                        speed: foxType.moveSpeed,
                        alive: true,
                    },
                ],
            });

            simulationTick(state, 0.01);

            expect(audio.playCombat).toHaveBeenCalled();
        });
    });

    describe('Safe getFox handling', () => {
        it('handles unknown fox type in scheduled spawns gracefully', () => {
            const state = createTestState({
                pendingSpawns: [
                    {
                        time: 0,
                        lane: 0,
                        foxTypeId: 'nonexistent_fox',
                        count: 5,
                    },
                ],
            });

            // Should not throw and should skip the spawn
            expect(() => simulationTick(state, 0.01)).not.toThrow();
            expect(state.foxPacks).toHaveLength(0);
        });

        it('continues processing other spawns when one fails', () => {
            const state = createTestState({
                pendingSpawns: [
                    {
                        time: 0,
                        lane: 0,
                        foxTypeId: 'nonexistent_fox',
                        count: 5,
                    },
                    {
                        time: 0,
                        lane: 1,
                        foxTypeId: 'fox_scout',
                        count: 3,
                    },
                ],
            });

            simulationTick(state, 0.01);

            // Should have spawned only the valid fox
            expect(state.foxPacks).toHaveLength(1);
            expect(state.foxPacks[0].foxTypeId).toBe('fox_scout');
            expect(state.foxPacks[0].count).toBe(3);
        });
    });
});
