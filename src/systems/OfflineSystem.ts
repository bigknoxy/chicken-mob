/**
 * OfflineSystem — Chicken Coop income calculation.
 *
 * When the player opens the game, compute how much corn they
 * earned while away based on their coop stats and elapsed time.
 */

import type { PlayerState } from '@/data/types';

export interface OfflineEarnings {
    corn: number;
    elapsedSeconds: number;
    cappedSeconds: number;
    cornPerSecond: number;
}

/** Calculate offline earnings since last session */
export function calculateOfflineEarnings(playerState: PlayerState): OfflineEarnings {
    const now = Date.now();
    const elapsed = (now - playerState.lastSessionTimestamp) / 1000; // seconds
    const capped = Math.min(elapsed, playerState.coop.offlineCapSeconds);
    const corn = Math.floor(playerState.coop.cornPerSecond * capped);

    return {
        corn,
        elapsedSeconds: elapsed,
        cappedSeconds: capped,
        cornPerSecond: playerState.coop.cornPerSecond,
    };
}

/** Apply offline earnings to player state */
export function claimOfflineEarnings(
    playerState: PlayerState,
    earnings: OfflineEarnings,
): void {
    playerState.currencies.corn += earnings.corn;
    playerState.totalCornEarned += earnings.corn;
    playerState.lastSessionTimestamp = Date.now();
}

/** Format elapsed time for display */
export function formatElapsedTime(seconds: number): string {
    if (seconds < 60) return `${Math.floor(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
