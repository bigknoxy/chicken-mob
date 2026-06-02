/**
 * CombatSystem — Mob vs mob power resolution helpers.
 */

import type { ChickenType, FoxMobType } from '@/data/types';

export interface CombatResult {
    chickensSurviving: number;
    foxesSurviving: number;
    counterDamage: number;
}

/** Resolve a combat between a chicken flock and a fox pack */
export function resolveCombat(
    chickenCount: number,
    chickenType: ChickenType,
    foxCount: number,
    foxType: FoxMobType,
): CombatResult {
    const chickenPower = chickenCount * chickenType.damagePerChicken;
    const foxPower = foxCount * foxType.damagePerFox;

    if (chickenPower > foxPower) {
        return {
            chickensSurviving: Math.max(1, Math.floor((chickenPower - foxPower) / chickenType.damagePerChicken)),
            foxesSurviving: 0,
            counterDamage: 0,
        };
    } else if (foxPower > chickenPower) {
        const foxesSurviving = Math.max(1, Math.floor((foxPower - chickenPower) / foxType.damagePerFox));
        const counterDamage = Math.max(1, Math.floor(chickenCount * chickenType.hpPerChicken * 0.5));
        return {
            chickensSurviving: 0,
            foxesSurviving,
            counterDamage,
        };
    } else {
        const counterDamage = Math.max(1, Math.floor(chickenCount * chickenType.hpPerChicken * 0.3));
        return { chickensSurviving: 0, foxesSurviving: 0, counterDamage };
    }
}
