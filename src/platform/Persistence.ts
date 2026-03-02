/**
 * Persistence — Save/load PlayerState to localStorage.
 */

import type { PlayerState } from '@/data/types';

const STORAGE_KEY = 'chicken_mob_save';

/** Create a fresh default player state */
export function createDefaultPlayerState(): PlayerState {
    return {
        currencies: { corn: 0, golden_feather: 0 },
        ownedChickens: ['clucky'],
        ownedBarnCannons: ['barn_basic'],
        equippedCannonId: 'barn_basic',
        equippedChickenId: 'clucky',
        upgrades: {},
        currentLevel: 0,
        unlockedLevels: 1,
        coop: {
            cornPerSecond: 1.0,
            offlineCapSeconds: 4 * 3600, // 4 hours
        },
        lastSessionTimestamp: Date.now(),
        totalCornEarned: 0,
        totalLevelsCompleted: 0,
        levelStars: {},
    };
}

/** Save player state to localStorage */
export function savePlayerState(state: PlayerState): void {
    try {
        const json = JSON.stringify(state);
        localStorage.setItem(STORAGE_KEY, json);
    } catch (e) {
        console.warn('Failed to save player state:', e);
    }
}

/** Load player state from localStorage, or create default */
export function loadPlayerState(): PlayerState {
    try {
        const json = localStorage.getItem(STORAGE_KEY);
        if (json) {
            const parsed = JSON.parse(json) as PlayerState;
            // Ensure all required fields exist (migration safety)
            return { ...createDefaultPlayerState(), ...parsed };
        }
    } catch (e) {
        console.warn('Failed to load player state:', e);
    }
    return createDefaultPlayerState();
}

/** Delete saved state */
export function clearPlayerState(): void {
    localStorage.removeItem(STORAGE_KEY);
}
