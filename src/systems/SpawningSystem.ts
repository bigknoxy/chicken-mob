/**
 * SpawningSystem — Handles firing chicken flocks from the barn cannon.
 */

import type { GameState, Flock, PlayerState, UpgradeDefinition, UpgradeCategory, UpgradeStat } from '@/data/types';
import { getChicken } from '@/data/chickens';
import { getCannon } from '@/data/cannons';
import { getUpgradeValue } from '@/data/upgrades';

function fireRateValue(level: number): number {
    const def: UpgradeDefinition = {
        id: 'cannon_fire_rate',
        category: 'cannon' as UpgradeCategory,
        targetId: 'barn_basic',
        stat: 'fireRate' as UpgradeStat,
        displayName: 'Fire Rate',
        baseValue: 1.0,
        incrementPerLevel: 0.15,
        baseCost: 50,
        costGrowthFactor: 1.4,
        maxLevel: 20,
    };
    return getUpgradeValue(def, level);
}

function burstSizeValue(level: number): number {
    const def: UpgradeDefinition = {
        id: 'cannon_burst_size',
        category: 'cannon' as UpgradeCategory,
        targetId: 'barn_basic',
        stat: 'burstSize' as UpgradeStat,
        displayName: 'Burst Size',
        baseValue: 5,
        incrementPerLevel: 1,
        baseCost: 80,
        costGrowthFactor: 1.45,
        maxLevel: 15,
    };
    return Math.floor(getUpgradeValue(def, level));
}

function chickenSpeedValue(level: number): number {
    const def: UpgradeDefinition = {
        id: 'chicken_speed',
        category: 'chicken' as UpgradeCategory,
        targetId: 'global',
        stat: 'speed' as UpgradeStat,
        displayName: 'Chicken Speed',
        baseValue: 200,
        incrementPerLevel: 15,
        baseCost: 40,
        costGrowthFactor: 1.35,
        maxLevel: 20,
    };
    return getUpgradeValue(def, level);
}

/** Compute effective stats after upgrades */
export function getEffectiveFireRate(playerState: PlayerState): number {
    const level = playerState.upgrades['cannon_fire_rate'] ?? 0;
    return fireRateValue(level);
}

export function getEffectiveBurstSize(playerState: PlayerState): number {
    const level = playerState.upgrades['cannon_burst_size'] ?? 0;
    return burstSizeValue(level);
}

export function getEffectiveChickenSpeed(playerState: PlayerState): number {
    const level = playerState.upgrades['chicken_speed'] ?? 0;
    return chickenSpeedValue(level);
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

    // Track total chickens fired for star calculation
    state.totalChickensFired += burstSize;
}
