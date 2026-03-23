/**
 * SpawningSystem — Handles firing chicken flocks from the barn cannon.
 */

import type { GameState, Flock, PlayerState } from '@/data/types';
import { getChicken } from '@/data/chickens';
import { getUpgrade, getUpgradeValue } from '@/data/upgrades';

function fireRateValue(level: number): number {
    return getUpgradeValue(getUpgrade('cannon_fire_rate'), level);
}

function burstSizeValue(level: number): number {
    return Math.floor(getUpgradeValue(getUpgrade('cannon_burst_size'), level));
}

function chickenSpeedValue(level: number): number {
    return getUpgradeValue(getUpgrade('chicken_speed'), level);
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

/** Fire a flock from the cannon at the given aim angle (radians).
 *  Angle: 0 = straight up, positive = right, negative = left
 *  Uses playerState.equippedChickenId to determine which chicken type to fire.
 */
export function fireChickens(
    state: GameState,
    playerState: PlayerState,
    aimAngle: number,
): void {
    const chickenType = getChicken(playerState.equippedChickenId);

    const burstSize = getEffectiveBurstSize(playerState);
    const speed = getEffectiveChickenSpeed(playerState);
    const fireRate = getEffectiveFireRate(playerState);
    const rapidFireMult = state.rapidFireMultiplier ?? 1;

    if (state.cannonCooldown > 0) return;

    const cannonX = state.cannonX ?? 0.5;
    const angleSpread = Math.sin(aimAngle) * 0.4;
    const targetX = Math.max(0, Math.min(1, cannonX + angleSpread));

    const lane = Math.floor(targetX * state.level.laneCount);

    const count = burstSize * rapidFireMult;
    const flock: Flock = {
        id: state.nextEntityId++,
        chickenTypeId: chickenType.id,
        count,
        lane,
        x: targetX,
        position: 0.0,
        speed,
        alive: true,
    };

    state.flocks.push(flock);
    state.cannonCooldown = 1.0 / (fireRate * rapidFireMult);

    state.totalChickensFired += count;
}
