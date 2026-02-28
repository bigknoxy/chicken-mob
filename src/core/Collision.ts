/**
 * Collision — Overlap detection between game entities.
 *
 * Since mobs are aggregate objects at a single position, collisions
 * are detected by checking whether two entities on the same lane
 * are close enough in position space (0..1).
 */

import type { Flock, FoxPack, LiveObstacle, LiveFort } from '@/data/types';

/** How close (in position units) two mobs must be to collide */
const COLLISION_THRESHOLD = 0.03;

/** Fort collision zone — flock must be within this range of position 1.0 */
const FORT_ZONE = 0.02;

export interface FlockVsFoxCollision {
    flock: Flock;
    foxPack: FoxPack;
}

export interface FlockVsObstacleCollision {
    flock: Flock;
    obstacle: LiveObstacle;
}

export interface FlockVsFortCollision {
    flock: Flock;
}

/** Detect all flock-vs-fox overlaps on the same lane */
export function detectFlockVsFox(
    flocks: Flock[],
    foxPacks: FoxPack[],
): FlockVsFoxCollision[] {
    const results: FlockVsFoxCollision[] = [];
    for (const flock of flocks) {
        if (!flock.alive || flock.count <= 0) continue;
        for (const fox of foxPacks) {
            if (!fox.alive || fox.count <= 0) continue;
            if (flock.lane !== fox.lane) continue;
            if (Math.abs(flock.position - fox.position) < COLLISION_THRESHOLD) {
                results.push({ flock, foxPack: fox });
            }
        }
    }
    return results;
}

/** Detect all flock-vs-obstacle overlaps */
export function detectFlockVsObstacle(
    flocks: Flock[],
    obstacles: LiveObstacle[],
): FlockVsObstacleCollision[] {
    const results: FlockVsObstacleCollision[] = [];
    for (const flock of flocks) {
        if (!flock.alive || flock.count <= 0) continue;
        for (const obs of obstacles) {
            if (!obs.alive) continue;
            if (flock.lane !== obs.definition.lane) continue;
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
