import type { ChickenType } from './types';

export const CHICKENS: ChickenType[] = [
    {
        id: 'clucky',
        name: 'Clucky',
        baseCountPerShot: 5,
        moveSpeed: 200,
        hpPerChicken: 2,
        damagePerChicken: 1,
        size: 1.0,
        rarity: 'common',
    },
    {
        id: 'hen_tank',
        name: 'Hen Tank',
        baseCountPerShot: 3,
        moveSpeed: 120,
        hpPerChicken: 8,
        damagePerChicken: 2,
        size: 1.8,
        rarity: 'rare',
    },
    {
        id: 'rooster_bomber',
        name: 'Rooster Bomber',
        baseCountPerShot: 4,
        moveSpeed: 180,
        hpPerChicken: 1,
        damagePerChicken: 1,
        size: 1.0,
        rarity: 'epic',
        specialAbility: 'aoe_on_death',
        specialValue: 5, // AoE damage on death
    },
    {
        id: 'speed_chick',
        name: 'Speed Chick',
        baseCountPerShot: 6,
        moveSpeed: 350,
        hpPerChicken: 1,
        damagePerChicken: 1,
        size: 0.7,
        rarity: 'rare',
    },
    {
        id: 'golden_goose',
        name: 'Golden Goose',
        baseCountPerShot: 2,
        moveSpeed: 150,
        hpPerChicken: 5,
        damagePerChicken: 3,
        size: 1.5,
        rarity: 'legendary',
        specialAbility: 'bonus_corn',
        specialValue: 2, // ×2 corn reward for surviving units
    },
];

export function getChicken(id: string): ChickenType {
    const c = CHICKENS.find(ch => ch.id === id);
    if (!c) throw new Error(`Unknown chicken type: ${id}`);
    return c;
}
