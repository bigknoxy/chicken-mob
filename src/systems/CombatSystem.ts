/**
 * CombatSystem — Mob vs mob power resolution helpers.
 */

import type { ChickenType, FoxMobType } from '@/data/types';

export interface CombatResult {
    chickensSurviving: number;
    foxesSurviving: number;
    counterDamage: number;
}

const COUNTER_DAMAGE_WIN_FACTOR = 0.5;
const COUNTER_DAMAGE_TIE_FACTOR = 0.3;
const MIN_COUNTER_DAMAGE = 1;

function computeCounterDamage(chickenCount: number, hpPerChicken: number, factor: number): number {
    return Math.max(MIN_COUNTER_DAMAGE, Math.floor(chickenCount * hpPerChicken * factor));
}

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
    }

    const foxesSurviving = foxPower > chickenPower
        ? Math.max(1, Math.floor((foxPower - chickenPower) / foxType.damagePerFox))
        : 0;

    const factor = foxPower > chickenPower ? COUNTER_DAMAGE_WIN_FACTOR : COUNTER_DAMAGE_TIE_FACTOR;
    const counterDamage = computeCounterDamage(chickenCount, chickenType.hpPerChicken, factor);

    return { chickensSurviving: 0, foxesSurviving, counterDamage };
}
