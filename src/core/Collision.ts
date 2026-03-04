/**
 * Collision — Overlap detection between game entities.
 *
 * Uses X-based collision detection: checks if entities overlap in both
 * X (horizontal position) and Y (position along lane) dimensions.
 */

import type { Flock, FoxPack, LiveObstacle, LiveFort, GateDefinition } from '@/data/types';
import { COLLISION_THRESHOLD, DEFAULT_ENTITY_WIDTH, FORT_ZONE } from '@/constants/game';

export interface FlockVsFoxCollision {
    flock: Flock;
    foxPack: FoxPack;
}

export interface FlockVsObstacleCollision {
    flock: Flock;
    obstacle: LiveObstacle;
}

export interface FlockVsGateCollision {
    flock: Flock;
    gate: GateDefinition;
}

export interface FlockVsFortCollision {
    flock: Flock;
}

/** Check X overlap between two positions using width */
function isXOverlap(a: number, b: number, width: number): boolean {
    return Math.abs(a - b) < width / 2;
}

/** Detect all flock-vs-fox overlaps using X-based collision */
export function detectFlockVsFox(
    flocks: Flock[],
    foxPacks: FoxPack[],
): FlockVsFoxCollision[] {
    const results: FlockVsFoxCollision[] = [];
    for (const flock of flocks) {
        if (!flock.alive || flock.count <= 0 || flock.x === undefined) continue;
        for (const fox of foxPacks) {
            if (!fox.alive || fox.count <= 0 || fox.x === undefined) continue;

            // X overlap check (using flock.x and fox.x)
            if (!isXOverlap(flock.x, fox.x, DEFAULT_ENTITY_WIDTH)) continue;

            // Y overlap check (position along lane)
            if (Math.abs(flock.position - fox.position) < COLLISION_THRESHOLD) {
                results.push({ flock, foxPack: fox });
            }
        }
    }
    return results;
}

/** Detect all flock-vs-obstacle overlaps using X-based collision */
export function detectFlockVsObstacle(
    flocks: Flock[],
    obstacles: LiveObstacle[],
): FlockVsObstacleCollision[] {
    const results: FlockVsObstacleCollision[] = [];
    for (const flock of flocks) {
        if (!flock.alive || flock.count <= 0 || flock.x === undefined) continue;
        for (const obs of obstacles) {
            if (!obs.alive || obs.definition.x === undefined) continue;

            // X overlap check (using flock.x and obstacle.definition.x)
            const obsWidth = obs.definition.width ?? DEFAULT_ENTITY_WIDTH;
            if (!isXOverlap(flock.x, obs.definition.x, obsWidth)) continue;

            // Y overlap check (position along lane)
            if (Math.abs(flock.position - obs.definition.position) < COLLISION_THRESHOLD) {
                results.push({ flock, obstacle: obs });
            }
        }
    }
    return results;
}

/** Detect flocks that have reached the fort zone */
export function detectFlockVsFort(
    flocks: Flock[],
    _fort: LiveFort,
): FlockVsFortCollision[] {
    const results: FlockVsFortCollision[] = [];
    for (const flock of flocks) {
        if (!flock.alive || flock.count <= 0) continue;
        if (flock.position >= 1.0 - FORT_ZONE) {
            results.push({ flock });
        }
    }
    return results;
}
