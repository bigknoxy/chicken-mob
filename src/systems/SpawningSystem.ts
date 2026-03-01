/**
 * SpawningSystem — Handles firing chicken flocks from the barn cannon.
 */

import type { GameState, Flock } from '@/data/types';
import { getChicken } from '@/data/chickens';
import { getCannon } from '@/data/cannons';
import { getUpgradeValue } from '@/data/upgrades';
import type { PlayerState } from '@/data/types';

/** Compute effective stats after upgrades */
export function getEffectiveFireRate(playerState: PlayerState): number {
    const level = playerState.upgrades['cannon_fire_rate'] ?? 0;
    return getUpgradeValue(
        { baseValue: 1.0, incrementPerLevel: 0.15 } as any, // inline for speed
        level,
    );
}

export function getEffectiveBurstSize(playerState: PlayerState): number {
    const level = playerState.upgrades['cannon_burst_size'] ?? 0;
    return Math.floor(getUpgradeValue(
        { baseValue: 5, incrementPerLevel: 1 } as any,
        level,
    ));
}

export function getEffectiveChickenSpeed(playerState: PlayerState): number {
    const level = playerState.upgrades['chicken_speed'] ?? 0;
    return getUpgradeValue(
        { baseValue: 200, incrementPerLevel: 15 } as any,
        level,
    );
}

/** Fire a flock from the cannon toward targetX (0-1 normalized horizontal position) */
export function fireChickens(
    state: GameState,
    playerState: PlayerState,
    targetX: number,
): void {
    const cannon = getCannon(playerState.equippedCannonId);
    const chickenType = getChicken(cannon.unitTypeId);

    const burstSize = getEffectiveBurstSize(playerState);
    const speed = getEffectiveChickenSpeed(playerState);
    const fireRate = getEffectiveFireRate(playerState);

    if (state.cannonCooldown > 0) return;

    // Clamp targetX to valid range and derive lane for visual purposes
    const clampedX = Math.max(0, Math.min(targetX, 1));
    const lane = Math.floor(clampedX * state.level.laneCount);

    const flock: Flock = {
        id: state.nextEntityId++,
        chickenTypeId: chickenType.id,
        count: burstSize,
        lane,
        x: clampedX,
        position: 0.0, // start at cannon
        speed,
        alive: true,
    };

    state.flocks.push(flock);
    state.cannonCooldown = 1.0 / fireRate;
}
