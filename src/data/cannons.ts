import type { BarnCannonDefinition } from './types';

export const CANNONS: BarnCannonDefinition[] = [
    {
        id: 'barn_basic',
        name: 'Old Barn',
        unitTypeId: 'clucky',
        fireRate: 1.0,
        burstSize: 5,
        projectileSpeed: 300,
        spread: 0,
    },
    {
        id: 'barn_shotgun',
        name: 'Haystorm Barn',
        unitTypeId: 'clucky',
        fireRate: 0.6,
        burstSize: 8,
        projectileSpeed: 250,
        spread: 30,
        specialAbility: 'haystorm',
    },
    {
        id: 'barn_sniper',
        name: 'Sniper Nest',
        unitTypeId: 'speed_chick',
        fireRate: 0.4,
        burstSize: 3,
        projectileSpeed: 500,
        spread: 0,
        specialAbility: 'sniper_nest',
    },
];

export function getCannon(id: string): BarnCannonDefinition {
    const c = CANNONS.find(cn => cn.id === id);
    if (!c) throw new Error(`Unknown cannon: ${id}`);
    return c;
}
