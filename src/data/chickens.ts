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
        unlockRequirement: { type: 'level', value: 6 },
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
        specialValue: 5,
        activeAbility: {
            type: 'aoe_blast',
            cooldown: 8,
            damage: 15,
        },
        unlockRequirement: { type: 'level', value: 12 },
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
        activeAbility: {
            type: 'rapid_fire',
            cooldown: 12,
            duration: 5,
            multiplier: 3,
        },
        unlockRequirement: { type: 'world', value: 'W2' },
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
        specialValue: 2,
        unlockRequirement: { type: 'level', value: 36 },
    },
];

export function getChicken(id: string): ChickenType {
    const c = CHICKENS.find(ch => ch.id === id);
    if (!c) throw new Error(`Unknown chicken type: ${id}`);
    return c;
}

export function isChickenUnlocked(
    chicken: ChickenType,
    playerState: { unlockedLevels: number; worldsUnlocked: string[] }
): boolean {
    if (!chicken.unlockRequirement) return true;
    
    const req = chicken.unlockRequirement;
    switch (req.type) {
        case 'level':
            return playerState.unlockedLevels >= (req.value as number);
        case 'world':
            return playerState.worldsUnlocked.includes(req.value as string);
        case 'stars':
            return false;
        default:
            return false;
    }
}

export function getUnlockDescription(chicken: ChickenType): string {
    if (!chicken.unlockRequirement) return '';
    
    const req = chicken.unlockRequirement;
    switch (req.type) {
        case 'level':
            return `Unlock at Level ${req.value}`;
        case 'world':
            const worldNames: Record<string, string> = { W1: 'World 1', W2: 'World 2' };
            return `Unlock in ${worldNames[req.value as string] || req.value}`;
        case 'stars':
            return `Unlock with ${req.value} stars`;
        default:
            return '';
    }
}
