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

import type { GameState, FoxPack, Particle, LevelSummary, ActiveAbility, ChickenType } from '@/data/types';
import { getChicken } from '@/data/chickens';
import { getFox } from '@/data/foxes';
import { resolveCombat } from '@/systems/CombatSystem';
import { DEFAULT_ENTITY_WIDTH, DEFAULT_TIMEOUT, FLOCK_DEATH_THRESHOLD, MIN_FLOCK_COUNT, CANNON_RECOIL_DURATION, GATE_BURST_PARTICLE_COUNT, FORT_HIT_SHAKE_INTENSITY, FORT_HIT_PARTICLE_COUNT, SPAWN_POP_PARTICLE_COUNT } from '@/constants/game';
import { audio } from '@/platform/Audio';
import { laneX, positionToY } from '@/core/Lane';
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
    }

    // Check if ANY fox reached the cannon (instant loss)
    const anyFoxReachedCannon = state.foxPacks.some(fox => fox.alive && fox.position <= 0);
    if (anyFoxReachedCannon) {
        for (const fox of state.foxPacks) {
            fox.alive = false;
        }
        state.levelComplete = true;
        state.levelWon = false;
        state.screenShake = 0.3;
        state.levelSummary = generateLevelSummary(state);
        return;
    }

    // ── 3. Gate pass-through ──
    for (const gate of state.gates) {
        // Get gate x position with fallback to lane center
        const gateX = gate.definition.x ?? ((gate.definition.lane + 0.5) / state.level.laneCount);

        for (const flock of state.flocks) {
            if (!flock.alive || flock.count <= 0) continue;

            // Get flock x position with fallback to lane center
            const flockX = flock.x ?? ((flock.lane + 0.5) / state.level.laneCount);

            // X overlap check: flock.x overlaps with gate.x (using gate width)
            const gateWidth = gate.definition.width ?? DEFAULT_ENTITY_WIDTH;
            if (Math.abs(flockX - gateX) >= gateWidth / 2) continue;

            const gatePos = gate.definition.position;
            // Check if flock just crossed through the gate this tick
            const prevPos = flock.position - speedToPositionRate(flock.speed, state.level.length) * dt;
            if (prevPos < gatePos && flock.position >= gatePos) {
                // Handle enemy spawn gates differently
                if (gate.definition.type === 'enemy_spawn') {
                    processEnemySpawnGate(flock, gate.definition, state);
                } else {
                    // Standard multiply gate
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
                        audio.playMultiply();
                    } else if (flock.count < oldCount) {
                        spawnGateParticles(state, gate.definition.lane, gatePos, false);
                        audio.playTrap();
                    }
                    if (flock.count <= 0) {
                        flock.alive = false;
                    }
                }

                // Handle enemy spawn gate - spawn foxes when chickens pass through
                if (gate.definition.spawnEnemy) {
                    const spawn = gate.definition.spawnEnemy;
                    let spawnFoxType;
                    try {
                        spawnFoxType = getFox(spawn.foxTypeId);
                    } catch {
                        console.warn(`Unknown fox type in spawn gate: ${spawn.foxTypeId}`);
                    }

                    if (spawnFoxType) {
                        const spawnX = (spawn.lane + 0.5) / state.level.laneCount;
                        const foxPack: FoxPack = {
                            id: state.nextEntityId++,
                            foxTypeId: spawn.foxTypeId,
                            count: spawn.count,
                            lane: spawn.lane,
                            x: spawnX,
                            position: gatePos + 0.05, // spawn slightly ahead of the gate
                            speed: spawnFoxType.moveSpeed,
                            alive: true,
                        };
                        state.foxPacks.push(foxPack);
                        audio.playTrap(); // Use trap sound for enemy spawn
                    }
                }
            }
        }
    }

    // ── 4a. Flock vs Fox combat ──
    const foxCollisions = detectFlockVsFox(state.flocks, state.foxPacks);
    for (const { flock, foxPack } of foxCollisions) {
        const chickenType = getChicken(flock.chickenTypeId);
        const foxType = getFox(foxPack.foxTypeId);
        const result = resolveCombat(flock.count, chickenType, foxPack.count, foxType);

        flock.count = result.chickensSurviving;
        if (flock.count <= 0) {
            flock.alive = false;
        }

        foxPack.count = result.foxesSurviving;
        if (foxPack.count <= 0) {
            foxPack.alive = false;
        }

        if (result.counterDamage > 0) {
            for (const otherFox of state.foxPacks) {
                if (otherFox.id !== foxPack.id && otherFox.alive) {
                    const otherFoxType = getFox(otherFox.foxTypeId);
                    const damage = Math.min(result.counterDamage, otherFox.count * otherFoxType.hpPerFox * 0.3);
                    const foxesLost = Math.ceil(damage / otherFoxType.hpPerFox);
                    otherFox.count = Math.max(0, otherFox.count - foxesLost);
                    if (otherFox.count <= 0) otherFox.alive = false;
                }
            }
        }

        audio.playCombat();
    }

    // ── 4b. Flock vs Obstacle ──
    const obsCollisions = detectFlockVsObstacle(state.flocks, state.obstacles);
    for (const { flock, obstacle } of obsCollisions) {
        if (obstacle.definition.type === 'scarecrow') {
            // Scarecrow knocks out a portion of chickens each tick
            const killed = Math.max(MIN_FLOCK_COUNT, Math.floor(flock.count * FLOCK_DEATH_THRESHOLD));
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

        // Track chickens that reached the fort (for star calculation)
        state.totalChickensReachedFort += flock.count;

        // Spawn fort hit burst particles
        spawnFortHitParticles(state, flock.count);

        // All chickens are consumed on fort impact
        flock.count = 0;
        flock.alive = false;

        // Enhanced screen shake!
        state.screenShake = Math.max(state.screenShake, FORT_HIT_SHAKE_INTENSITY);
    }

    // ── 5. Enemy spawn schedule ──
    const readySpawns = state.pendingSpawns.filter(s => s.time <= state.elapsedTime);
    for (const spawn of readySpawns) {
        // Safe handling: skip spawn if unknown fox type
        let foxType;
        try {
            foxType = getFox(spawn.foxTypeId);
        } catch {
            console.warn(`Unknown fox type: ${spawn.foxTypeId}, skipping spawn`);
            continue;
        }

        const pack: FoxPack = {
            id: state.nextEntityId++,
            foxTypeId: spawn.foxTypeId,
            count: spawn.count,
            lane: spawn.lane,
            x: (spawn.lane + 0.5) / state.level.laneCount, // center of lane in 0-1 space
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

    // ── 6b. Cannon recoil decay ──
    if (state.cannonRecoil > 0) {
        state.cannonRecoil -= dt;
    }

    // ── 6b. Ability cooldown and duration ──
    if (state.abilityCooldown > 0) {
        state.abilityCooldown -= dt;
    }
    if (state.abilityDurationRemaining > 0) {
        state.abilityDurationRemaining -= dt;
        if (state.abilityDurationRemaining <= 0) {
            state.abilityActive = false;
            state.rapidFireMultiplier = 1;
        }
    }

    // ── 7. Update particles ──
    updateParticles(state.particles, dt);

    // ── 8. Screen shake decay ──
    if (state.screenShake > 0) {
        state.screenShake = Math.max(0, state.screenShake - dt);
    }

    // Victory flash decay
    if (state.victoryFlash > 0) {
        state.victoryFlash = Math.max(0, state.victoryFlash - dt * 2);
    }

    // ── 9. Clean up dead entities ──
    state.flocks = state.flocks.filter(f => f.alive && f.count > 0);
    state.foxPacks = state.foxPacks.filter(f => f.alive && f.count > 0);
    state.obstacles = state.obstacles.filter(o => o.alive);

    // Update current chickens on field count
    state.currentChickensOnField = state.flocks.reduce((sum, f) => sum + (f.alive ? f.count : 0), 0);

    // ── 10. Win/Loss check ──
    if (state.fort.currentHp <= 0) {
        state.levelComplete = true;
        state.levelWon = true;
        state.screenShake = 0.2;
        state.victoryFlash = 1.0;
        spawnConfetti(state);
        state.levelSummary = generateLevelSummary(state);
    } else {
        // Check timeout loss condition
        const levelTimeout = state.level.timeout ?? DEFAULT_TIMEOUT;
        if (state.elapsedTime >= levelTimeout) {
            state.levelComplete = true;
            state.levelWon = false;
            state.levelSummary = generateLevelSummary(state);
        }
    }
}

/** Spawn fort hit burst particles */
function spawnFortHitParticles(state: GameState, chickenCount: number): void {
    const count = Math.min(FORT_HIT_PARTICLE_COUNT, chickenCount * 3);
    const colors = ['#fbbf24', '#f97316', '#ef4444', '#dc2626', '#ffffff'];
    
    // Use lane geometry for correct positioning
    const geo = state.laneGeometry;
    const centerX = geo ? geo.canvasWidth / 2 : state.level.laneCount * 50;
    const fortY = geo ? positionToY(geo, 1.0) : 30;
    const spreadX = geo ? geo.canvasWidth * 0.3 : state.level.laneCount * 30;
    
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 150 + Math.random() * 250;
        state.particles.push({
            x: centerX + (Math.random() - 0.5) * spreadX,
            y: fortY + Math.random() * 40,
            vx: Math.cos(angle) * speed * 0.5,
            vy: Math.sin(angle) * speed + 100,
            life: 0.3 + Math.random() * 0.4,
            maxLife: 0.7,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 3 + Math.random() * 5,
        });
    }
}

/** Spawn pop particles when chickens are launched */
export function spawnLaunchParticles(state: GameState, x: number, y: number): void {
    const count = SPAWN_POP_PARTICLE_COUNT;
    const colors = ['#fbbf24', '#fcd34d', '#fef3c7'];
    
    for (let i = 0; i < count; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
        const speed = 80 + Math.random() * 120;
        state.particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.2 + Math.random() * 0.2,
            maxLife: 0.4,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 2 + Math.random() * 3,
        });
    }
}

/** Trigger cannon recoil animation */
export function triggerCannonRecoil(state: GameState): void {
    state.cannonRecoil = CANNON_RECOIL_DURATION;
}

/** Spawn particles at a gate position */
function spawnGateParticles(
    state: GameState,
    lane: number,
    position: number,
    positive: boolean,
): void {
    const count = positive ? GATE_BURST_PARTICLE_COUNT : 12;
    const colors = positive 
        ? ['#4ade80', '#22c55e', '#86efac', '#fbbf24'] 
        : ['#ef4444', '#f87171', '#fca5a5'];
    
    // Use lane geometry if available for correct positioning
    const geo = state.laneGeometry;
    const baseX = geo ? laneX(geo, lane) : (lane + 0.5) * 100;
    const baseY = geo ? positionToY(geo, position) : position * state.level.length;
    
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const speed = 100 + Math.random() * 200;
        state.particles.push({
            x: baseX,
            y: baseY,
            vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 100,
            vy: Math.sin(angle) * speed - (positive ? 100 : 50),
            life: 0.4 + Math.random() * 0.3,
            maxLife: 0.7,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: positive ? 4 + Math.random() * 5 : 3 + Math.random() * 3,
        });
    }
}

/** Process enemy spawn gate - spawns foxes when chickens pass through */
function processEnemySpawnGate(
    flock: { count: number; lane: number; position: number },
    gate: { multiplier: number; spawnEnemyType?: string; position: number; lane: number },
    state: GameState,
): void {
    // Calculate fox count to spawn based on chicken count and multiplier
    const foxCount = Math.floor(flock.count * gate.multiplier);

    if (foxCount > 0) {
        // Determine enemy type to spawn (default to fox_scout)
        const enemyTypeId = gate.spawnEnemyType || 'fox_scout';
        const foxType = getFox(enemyTypeId);

        // Create fox pack at position just past the gate
        const foxPack: FoxPack = {
            id: state.nextEntityId++,
            foxTypeId: enemyTypeId,
            count: foxCount,
            lane: gate.lane,
            x: undefined, // Will be calculated based on lane
            position: gate.position + 0.02, // Spawn just past gate (moving toward cannon)
            speed: foxType.moveSpeed,
            alive: true,
        };
        state.foxPacks.push(foxPack);

        // Spawn particle effects for enemy spawn
        spawnEnemySpawnParticles(state, gate.position, gate.lane, foxCount);
    }
}

/** Spawn particle effects when enemy spawn gate activates */
function spawnEnemySpawnParticles(
    state: GameState,
    _position: number,
    _lane: number,
    count: number,
): void {
    const particleCount = Math.min(count * 2, 30); // Cap at 30 particles

    for (let i = 0; i < particleCount; i++) {
        state.particles.push({
            x: 0, // will be positioned by renderer using lane/position
            y: 0,
            vx: (Math.random() - 0.5) * 150,
            vy: (Math.random() - 0.5) * 150,
            life: 0.6 + Math.random() * 0.4,
            maxLife: 1.0,
            color: '#ff6b6b', // Light red for enemy spawn
            size: 4 + Math.random() * 4,
        });
    }
}

/** Spawn confetti explosion on level win - enhanced with vibrant colors */
function spawnConfetti(state: GameState): void {
    const colors = [
        '#fbbf24', // golden yellow
        '#22c55e', // vibrant green
        '#3b82f6', // bright blue
        '#ec4899', // hot pink
        '#a855f7', // purple
        '#ffffff', // white
        '#f97316', // orange
        '#06b6d4', // cyan
    ];
    const count = 200; // more particles
    for (let i = 0; i < count; i++) {
        // Spawn from random positions across screen width
        const spawnX = Math.random() * state.level.laneCount * 100 + 50;
        state.particles.push({
            x: spawnX,
            y: -20 - Math.random() * 50, // start above screen
            vx: (Math.random() - 0.5) * 900, // wider spread
            vy: Math.random() * 300 + 200, // varied upward burst
            life: 2.5 + Math.random() * 2.5,
            maxLife: 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 3 + Math.random() * 8, // varied sizes
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 12,
            type: 'confetti',
        });
    }
}

/** Update particle lifetimes and positions */
function updateParticles(particles: Particle[], dt: number): void {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        
        if (p.type === 'confetti') {
            p.vx *= 0.99;
            p.vy += 200 * dt;
            p.rotation = (p.rotation ?? 0) + (p.rotationSpeed ?? 0) * dt;
        } else {
            p.vy += 300 * dt;
        }
        
        p.life -= dt;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

/**
 * Calculate star rating based on chicken efficiency.
 * Stars are awarded as follows:
 * - 1 star: Complete level (minimum)
 * - 2 stars: 50%+ chickens reached the fort
 * - 3 stars: 80%+ chickens reached the fort
 */
export function calculateStars(state: GameState): 1 | 2 | 3 {
    if (state.totalChickensFired === 0) {
        return 1; // No chickens fired = just 1 star
    }

    const efficiency = state.totalChickensReachedFort / state.totalChickensFired;

    if (efficiency >= 0.8) {
        return 3;
    } else if (efficiency >= 0.5) {
        return 2;
    }
    return 1;
}

/**
 * Generate end-of-level summary with detailed statistics.
 */
export function generateLevelSummary(state: GameState): LevelSummary {
    const deployed = state.totalChickensFired;
    const reachedFort = state.totalChickensReachedFort;
    const currentlyOnField = state.currentChickensOnField;
    const destroyed = Math.max(0, deployed - reachedFort - currentlyOnField);
    // Efficiency based on deployed chickens (accounts for timeout - chickens on field still count as not destroyed)
    const totalAccounted = reachedFort + currentlyOnField + destroyed;
    const efficiency = totalAccounted > 0 ? reachedFort / totalAccounted : 0;

    return {
        deployed,
        reachedFort,
        currentlyOnField,
        destroyed,
        efficiency,
        timeElapsed: state.elapsedTime,
        stars: calculateStars(state),
        won: state.levelWon,
    };
}

export function triggerAbility(
    state: GameState,
    chickenType: ChickenType,
): boolean {
    if (state.abilityCooldown > 0) return false;
    if (!chickenType.activeAbility) return false;

    const ability = chickenType.activeAbility;
    state.abilityCooldown = ability.cooldown;

    switch (ability.type) {
        case 'aoe_blast':
            executeAoeBlast(state, ability);
            break;
        case 'rapid_fire':
            executeRapidFire(state, ability);
            break;
    }

    return true;
}

function executeAoeBlast(state: GameState, ability: ActiveAbility): void {
    const damage = ability.damage ?? 10;
    const cannonX = state.cannonX ?? 0.5;

    for (const fox of state.foxPacks) {
        if (!fox.alive || fox.count <= 0) continue;

        const foxX = fox.x ?? ((fox.lane + 0.5) / state.level.laneCount);
        const dist = Math.abs(foxX - cannonX);

        if (dist < 0.4) {
            const foxType = getFox(fox.foxTypeId);
            const foxesKilled = Math.min(fox.count, Math.ceil(damage / foxType.hpPerFox));
            fox.count -= foxesKilled;
            if (fox.count <= 0) {
                fox.count = 0;
                fox.alive = false;
            }
        }
    }

    for (const obs of state.obstacles) {
        if (!obs.alive || obs.currentHp === Infinity) continue;

        const obsX = obs.definition.x ?? ((obs.definition.lane + 0.5) / state.level.laneCount);
        const dist = Math.abs(obsX - cannonX);

        if (dist < 0.4) {
            obs.currentHp -= damage;
            if (obs.currentHp <= 0) {
                obs.alive = false;
            }
        }
    }

    state.screenShake = 0.25;
    spawnAoeBlastParticles(state);
    audio.playCombat();
}

function executeRapidFire(state: GameState, ability: ActiveAbility): void {
    state.abilityActive = true;
    state.abilityDurationRemaining = ability.duration ?? 5;
    state.rapidFireMultiplier = ability.multiplier ?? 2;
}

function spawnAoeBlastParticles(state: GameState): void {
    const cannonX = (state.cannonX ?? 0.5) * state.level.laneCount * 100;
    const cannonY = state.level.length;
    const colors = ['#fbbf24', '#f97316', '#ef4444', '#ffffff'];

    for (let i = 0; i < 40; i++) {
        const angle = (i / 40) * Math.PI * 2;
        const speed = 150 + Math.random() * 200;
        state.particles.push({
            x: cannonX,
            y: cannonY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 100,
            life: 0.4 + Math.random() * 0.3,
            maxLife: 0.7,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 4 + Math.random() * 6,
        });
    }
}
