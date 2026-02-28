/**
 * HUD — Heads-up display for currency counters and level info.
 *
 * Renders as DOM overlay on top of the canvas for crisp text rendering.
 */

import type { PlayerState } from '@/data/types';

export class HUD {
    private container: HTMLDivElement;
    private cornEl: HTMLSpanElement;
    private featherEl: HTMLSpanElement;

    constructor(overlay: HTMLElement) {
        this.container = document.createElement('div');
        this.container.id = 'hud';
        this.container.style.cssText = `
      position: absolute;
      top: 0;
      right: 0;
      padding: 8px 14px;
      display: flex;
      gap: 16px;
      font-family: monospace;
      font-size: 14px;
      font-weight: bold;
      color: #e5e7eb;
      background: rgba(0,0,0,0.4);
      border-radius: 0 0 0 12px;
      pointer-events: none;
      z-index: 10;
    `;

        this.cornEl = document.createElement('span');
        this.featherEl = document.createElement('span');

        this.container.appendChild(this.cornEl);
        this.container.appendChild(this.featherEl);
        overlay.appendChild(this.container);
    }

    update(playerState: PlayerState): void {
        this.cornEl.textContent = `🌽 ${this.format(playerState.currencies.corn)}`;
        this.featherEl.textContent = `🪶 ${playerState.currencies.golden_feather}`;
    }

    private format(n: number): string {
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
        if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
        return Math.floor(n).toString();
    }

    destroy(): void {
        this.container.remove();
    }
}
