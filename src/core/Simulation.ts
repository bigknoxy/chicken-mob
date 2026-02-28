/**
 * Simulation — Per-tick update orchestrator.
 *
 * Each tick:
 * 1. Move all flocks forward
 * 2. Move all fox packs forward (toward cannon)
 * 3. Check gate pass-throughs
 * 4. Detect & resolve collisions (flock vs fox, flock vs obstacle, flock vs fort)
 * 5. Check enemy spawn schedule
 * 6. Handle auto-fire if player is holding
 * 7. Update particles and visual effects
 * 8. Check win/loss conditions
 */

import type { GameState, Flock, FoxPack, Particle } from '@/data/types';
import { getChicken } from '@/data/chickens';
import { getFox } from '@/data/foxes';
import {
    detectFlockVsFox,
    detectFlockVsFort,
    detectFlockVsObstacle,
} from './Collision';

/** Normalized position per second — converts pixels/sec relative to lane length */
function speedToPositionRate(pixelsPerSec: number, laneLength: number): number {
    return pixelsPerSec / laneLength;
}

export function simulationTick(state: GameState, dt: number): void {
    if (state.levelComplete) return;

    state.elapsedTime += dt;

    // ── 1. Move flocks forward ──
    for (const flock of state.flocks) {
        if (!flock.alive || flock.count <= 0) continue;
        const rate = speedToPositionRate(flock.speed, state.level.length);
        flock.position += rate * dt;
        if (flock.position > 1.0) flock.position = 1.0;
    }

    // ── 2. Move fox packs toward cannon ──
    for (const fox of state.foxPacks) {
        if (!fox.alive || fox.count <= 0) continue;
        const rate = speedToPositionRate(fox.speed, state.level.length);
        fox.position -= rate * dt; // foxes move toward 0
        if (fox.position < 0) {
            fox.alive = false; // foxes that reach cannon end are lost
        }
    }

    // ── 3. Gate pass-through ──
    for (const gate of state.gates) {
        for (const flock of state.flocks) {
            if (!flock.alive || flock.count <= 0) continue;
            if (flock.lane !== gate.definition.lane) continue;

            const gatePos = gate.definition.position;
            // Check if flock just crossed through the gate this tick
            const prevPos = flock.position - speedToPositionRate(flock.speed, state.level.length) * dt;
            if (prevPos < gatePos && flock.position >= gatePos) {
                const mult = gate.definition.multiplier;
                const oldCount = flock.count;
                if (gate.definition.isPositive) {
                    flock.count = Math.floor(oldCount * mult);
                } else {
                    flock.count = Math.max(0, Math.floor(oldCount * mult));
                }
                // Spawn particles at gate position
                if (flock.count > oldCount) {
                    spawnGateParticles(state, gate.definition.lane, gatePos, true);
                } else if (flock.count < oldCount) {
                    spawnGateParticles(state, gate.definition.lane, gatePos, false);
                }
                if (flock.count <= 0) {
                    flock.alive = false;
                }
            }
        }
    }

    // ── 4a. Flock vs Fox combat ──
    const foxCollisions = detectFlockVsFox(state.flocks, state.foxPacks);
    for (const { flock, foxPack } of foxCollisions) {
        resolveMobCombat(flock, foxPack);
    }

    // ── 4b. Flock vs Obstacle ──
    const obsCollisions = detectFlockVsObstacle(state.flocks, state.obstacles);
    for (const { flock, obstacle } of obsCollisions) {
        if (obstacle.definition.type === 'scarecrow') {
            // Scarecrow knocks out a portion of chickens each tick
            const killed = Math.max(1, Math.floor(flock.count * 0.2));
            flock.count -= killed;
            if (flock.count <= 0) {
                flock.count = 0;
                flock.alive = false;
            }
        } else {
            // Destructible obstacle: chickens chip HP
            const chickenType = getChicken(flock.chickenTypeId);
            const damage = flock.count * chickenType.damagePerChicken * dt * 10;
            obstacle.currentHp -= damage;
            // Chickens are consumed in the process
            const chickensLost = Math.ceil(damage / chickenType.hpPerChicken);
            flock.count -= chickensLost;
            if (obstacle.currentHp <= 0) {
                obstacle.alive = false;
            }
            if (flock.count <= 0) {
                flock.count = 0;
                flock.alive = false;
            }
        }
    }

    // ── 4c. Flock vs Fort ──
    const fortCollisions = detectFlockVsFort(state.flocks, state.fort);
    for (const { flock } of fortCollisions) {
        const chickenType = getChicken(flock.chickenTypeId);
        const rawDamage = flock.count * chickenType.damagePerChicken;
        const effectiveDamage = rawDamage / state.fort.armorMultiplier;
        state.fort.currentHp -= effectiveDamage;

        // All chickens are consumed on fort impact
        flock.count = 0;
        flock.alive = false;

        // Screen shake!
        state.screenShake = Math.max(state.screenShake, 0.15);
    }

    // ── 5. Enemy spawn schedule ──
    const readySpawns = state.pendingSpawns.filter(s => s.time <= state.elapsedTime);
    for (const spawn of readySpawns) {
        const foxType = getFox(spawn.foxTypeId);
        const pack: FoxPack = {
            id: state.nextEntityId++,
            foxTypeId: spawn.foxTypeId,
            count: spawn.count,
            lane: spawn.lane,
            position: 1.0, // spawn from fort end
            speed: foxType.moveSpeed,
            alive: true,
        };
        state.foxPacks.push(pack);
    }
    state.pendingSpawns = state.pendingSpawns.filter(s => s.time > state.elapsedTime);

    // ── 6. Cannon cooldown ──
    if (state.cannonCooldown > 0) {
        state.cannonCooldown -= dt;
    }

    // ── 7. Update particles ──
    updateParticles(state.particles, dt);

    // ── 8. Screen shake decay ──
    if (state.screenShake > 0) {
        state.screenShake = Math.max(0, state.screenShake - dt);
    }

    // ── 9. Clean up dead entities ──
    state.flocks = state.flocks.filter(f => f.alive && f.count > 0);
    state.foxPacks = state.foxPacks.filter(f => f.alive && f.count > 0);
    state.obstacles = state.obstacles.filter(o => o.alive);

    // ── 10. Win/Loss check ──
    if (state.fort.currentHp <= 0) {
        state.levelComplete = true;
        state.levelWon = true;
        state.screenShake = 0.4;
    } else if (
        state.flocks.length === 0 &&
        state.pendingSpawns.length === 0 &&
        !state.isFiring &&
        state.cannonCooldown <= 0
    ) {
        // No flocks on field, nothing to fire — check if player already used all shots
        // For simplicity: auto-fire means ammo is "infinite", so loss = no chickens on field for 3+ seconds
        // We'll use a softer approach: the player can always fire more
        // Loss only if fort has spawned all foxes and they've all been resolved and no flocks
        // In v1, we'll just let the player keep firing — no hard loss condition for now
    }
}

/** Resolve combat between a chicken flock and a fox pack */
function resolveMobCombat(flock: Flock, foxPack: FoxPack): void {
    const chickenType = getChicken(flock.chickenTypeId);
    const foxType = getFox(foxPack.foxTypeId);

    const chickenPower = flock.count * chickenType.damagePerChicken;
    const foxPower = foxPack.count * foxType.damagePerFox;

    if (chickenPower > foxPower) {
        // Chickens win — some survive
        const surviving = Math.max(1, Math.floor((chickenPower - foxPower) / chickenType.damagePerChicken));
        flock.count = surviving;
        foxPack.count = 0;
        foxPack.alive = false;
    } else if (foxPower > chickenPower) {
        // Foxes win
        const surviving = Math.max(1, Math.floor((foxPower - chickenPower) / foxType.damagePerFox));
        foxPack.count = surviving;
        flock.count = 0;
        flock.alive = false;
    } else {
        // Tie — both eliminated
        flock.count = 0;
        flock.alive = false;
        foxPack.count = 0;
        foxPack.alive = false;
    }
}

/** Spawn particles at a gate position */
function spawnGateParticles(
    state: GameState,
    _lane: number,
    _position: number,
    positive: boolean,
): void {
    const count = positive ? 12 : 6;
    const color = positive ? '#4ade80' : '#ef4444';
    for (let i = 0; i < count; i++) {
        state.particles.push({
            x: 0, // will be positioned by renderer using lane/position
            y: 0,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 200,
            life: 0.5 + Math.random() * 0.3,
            maxLife: 0.8,
            color,
            size: 3 + Math.random() * 4,
        });
    }
}

/** Update particle lifetimes and positions */
function updateParticles(particles: Particle[], dt: number): void {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 300 * dt; // gravity
        p.life -= dt;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}
