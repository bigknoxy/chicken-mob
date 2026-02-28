/**
 * UpgradeSystem — Compute costs, apply upgrades, check affordability.
 */

import type { PlayerState, UpgradeDefinition } from '@/data/types';
import { UPGRADES, getUpgradeCost, getUpgradeValue } from '@/data/upgrades';

/** Check if the player can afford the next level of an upgrade */
export function canAffordUpgrade(
    playerState: PlayerState,
    upgradeId: string,
): boolean {
    const def = UPGRADES.find(u => u.id === upgradeId);
    if (!def) return false;
    const currentLevel = playerState.upgrades[upgradeId] ?? 0;
    if (currentLevel >= def.maxLevel) return false;
    const cost = getUpgradeCost(def, currentLevel);
    return playerState.currencies.corn >= cost;
}

/** Purchase one level of an upgrade */
export function purchaseUpgrade(
    playerState: PlayerState,
    upgradeId: string,
): boolean {
    const def = UPGRADES.find(u => u.id === upgradeId);
    if (!def) return false;

    const currentLevel = playerState.upgrades[upgradeId] ?? 0;
    if (currentLevel >= def.maxLevel) return false;

    const cost = getUpgradeCost(def, currentLevel);
    if (playerState.currencies.corn < cost) return false;

    playerState.currencies.corn -= cost;
    playerState.upgrades[upgradeId] = currentLevel + 1;

    // Refresh coop stats if it's a farm upgrade
    if (def.category === 'farm') {
        refreshCoopStats(playerState);
    }

    return true;
}

/** Get the current effective value for an upgrade */
export function getEffectiveValue(
    playerState: PlayerState,
    upgradeId: string,
): number {
    const def = UPGRADES.find(u => u.id === upgradeId);
    if (!def) return 0;
    const level = playerState.upgrades[upgradeId] ?? 0;
    return getUpgradeValue(def, level);
}

/** Refresh coop stats based on current farm upgrades */
export function refreshCoopStats(playerState: PlayerState): void {
    const offlineRateLevel = playerState.upgrades['farm_offline_rate'] ?? 0;
    const offlineCapLevel = playerState.upgrades['farm_offline_cap'] ?? 0;

    const rateUpgrade = UPGRADES.find(u => u.id === 'farm_offline_rate')!;
    const capUpgrade = UPGRADES.find(u => u.id === 'farm_offline_cap')!;

    playerState.coop.cornPerSecond = getUpgradeValue(rateUpgrade, offlineRateLevel);
    playerState.coop.offlineCapSeconds = getUpgradeValue(capUpgrade, offlineCapLevel) * 3600;
}

/** Get all upgrades for a given category */
export function getUpgradesByCategory(category: UpgradeDefinition['category']): UpgradeDefinition[] {
    return UPGRADES.filter(u => u.category === category);
}
