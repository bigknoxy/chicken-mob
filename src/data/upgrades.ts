import type { UpgradeDefinition } from './types';

export const UPGRADES: UpgradeDefinition[] = [
    // ── Cannon Upgrades ──
    {
        id: 'cannon_fire_rate',
        category: 'cannon',
        targetId: 'barn_basic',
        stat: 'fireRate',
        displayName: 'Fire Rate',
        baseValue: 1.0,
        incrementPerLevel: 0.15,
        baseCost: 50,
        costGrowthFactor: 1.4,
        maxLevel: 20,
    },
    {
        id: 'cannon_burst_size',
        category: 'cannon',
        targetId: 'barn_basic',
        stat: 'burstSize',
        displayName: 'Burst Size',
        baseValue: 5,
        incrementPerLevel: 1,
        baseCost: 80,
        costGrowthFactor: 1.45,
        maxLevel: 15,
    },
    {
        id: 'cannon_proj_speed',
        category: 'cannon',
        targetId: 'barn_basic',
        stat: 'projectileSpeed',
        displayName: 'Launch Speed',
        baseValue: 300,
        incrementPerLevel: 20,
        baseCost: 40,
        costGrowthFactor: 1.35,
        maxLevel: 20,
    },

    // ── Chicken Upgrades ──
    {
        id: 'chicken_hp',
        category: 'chicken',
        targetId: 'global',
        stat: 'hp',
        displayName: 'Chicken HP',
        baseValue: 2,
        incrementPerLevel: 1,
        baseCost: 60,
        costGrowthFactor: 1.4,
        maxLevel: 25,
    },
    {
        id: 'chicken_damage',
        category: 'chicken',
        targetId: 'global',
        stat: 'damage',
        displayName: 'Chicken Damage',
        baseValue: 1,
        incrementPerLevel: 0.5,
        baseCost: 70,
        costGrowthFactor: 1.45,
        maxLevel: 20,
    },
    {
        id: 'chicken_speed',
        category: 'chicken',
        targetId: 'global',
        stat: 'moveSpeed',
        displayName: 'Chicken Speed',
        baseValue: 200,
        incrementPerLevel: 15,
        baseCost: 50,
        costGrowthFactor: 1.35,
        maxLevel: 15,
    },

    // ── Farm / Global Upgrades ──
    {
        id: 'farm_corn_mult',
        category: 'farm',
        targetId: 'global',
        stat: 'cornMultiplier',
        displayName: 'Corn Multiplier',
        baseValue: 1.0,
        incrementPerLevel: 0.1,
        baseCost: 100,
        costGrowthFactor: 1.5,
        maxLevel: 30,
    },
    {
        id: 'farm_offline_rate',
        category: 'farm',
        targetId: 'global',
        stat: 'offlineRate',
        displayName: 'Coop Income',
        baseValue: 1.0,
        incrementPerLevel: 0.5,
        baseCost: 120,
        costGrowthFactor: 1.5,
        maxLevel: 25,
    },
    {
        id: 'farm_offline_cap',
        category: 'farm',
        targetId: 'global',
        stat: 'offlineCap',
        displayName: 'Offline Cap',
        baseValue: 4,
        incrementPerLevel: 0.5,
        baseCost: 150,
        costGrowthFactor: 1.5,
        maxLevel: 8,
    },
];

/** Compute the corn cost of upgrading from currentLevel → currentLevel+1 */
export function getUpgradeCost(def: UpgradeDefinition, currentLevel: number): number {
    return Math.floor(def.baseCost * Math.pow(def.costGrowthFactor, currentLevel));
}

/** Compute the stat value at a given level */
export function getUpgradeValue(def: UpgradeDefinition, level: number): number {
    return def.baseValue + def.incrementPerLevel * level;
}

export function getUpgrade(id: string): UpgradeDefinition {
    const u = UPGRADES.find(up => up.id === id);
    if (!u) throw new Error(`Unknown upgrade: ${id}`);
    return u;
}
