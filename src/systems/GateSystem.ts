/**
 * GateSystem — Gate detection and multiplier application.
 *
 * Note: Gate pass-throughs are currently handled inline in Simulation.ts
 * for performance. This module provides helpers for gate logic.
 */

import type { GateDefinition } from '@/data/types';

/** Apply a gate multiplier to a flock count */
export function applyGateMultiplier(
    currentCount: number,
    gate: GateDefinition,
): number {
    if (gate.isPositive) {
        return Math.floor(currentCount * gate.multiplier);
    } else {
        return Math.max(0, Math.floor(currentCount * gate.multiplier));
    }
}

/** Format a gate multiplier for display */
export function formatGateLabel(gate: GateDefinition): string {
    if (gate.isPositive) {
        return `×${gate.multiplier}`;
    } else if (gate.multiplier === 0) {
        return '☠';
    } else {
        return `×${gate.multiplier}`;
    }
}
