/**
 * HUD — Heads-up display for currency counters and level info.
 *
 * Renders as DOM overlay on top of the canvas for crisp text rendering.
 */

import type { PlayerState } from '@/data/types';
import { formatNumber } from '@/utils/format';
import { COLORS, RADIUS } from './styles';

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
      font-family: 'Nunito', sans-serif;
      font-size: 14px;
      font-weight: bold;
      color: ${COLORS.uiText};
      background: rgba(0,0,0,0.4);
      border-radius: 0 0 0 ${RADIUS.md}px;
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
        this.cornEl.textContent = `🌽 ${formatNumber(playerState.currencies.corn)}`;
        this.featherEl.textContent = `🪶 ${playerState.currencies.golden_feather}`;
    }

    destroy(): void {
        this.container.remove();
    }
}
