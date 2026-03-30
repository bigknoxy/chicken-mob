import type { FoxMobType } from './types';

export const FOXES: FoxMobType[] = [
    {
        id: 'fox_scout',
        name: 'Fox Scout',
        moveSpeed: 180,
        hpPerFox: 2,
        damagePerFox: 1,
    },
    {
        id: 'fox_brute',
        name: 'Fox Brute',
        moveSpeed: 100,
        hpPerFox: 6,
        damagePerFox: 3,
    },
    {
        id: 'fox_sniper',
        name: 'Fox Sniper',
        moveSpeed: 80,
        hpPerFox: 3,
        damagePerFox: 5,
    },
    {
        id: 'fox_tank',
        name: 'Fox Tank',
        moveSpeed: 60,
        hpPerFox: 15,
        damagePerFox: 2,
    },
    {
        id: 'fox_swarm',
        name: 'Fox Swarm',
        moveSpeed: 220,
        hpPerFox: 1,
        damagePerFox: 1,
    },
    {
        id: 'fox_bomber',
        name: 'Fox Bomber',
        moveSpeed: 120,
        hpPerFox: 4,
        damagePerFox: 6,
    },
];

export function getFox(id: string): FoxMobType {
    const f = FOXES.find(fx => fx.id === id);
    if (!f) throw new Error(`Unknown fox type: ${id}`);
    return f;
}
