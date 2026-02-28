/**
 * MenuScreen — Main menu, level select, and farm map.
 *
 * Renders as a DOM overlay that replaces the canvas during menu state.
 */

import type { PlayerState } from '@/data/types';
import { LEVELS } from '@/data/levels';
import { audio } from '@/platform/Audio';

export type MenuAction =
    | { type: 'play_level'; levelIndex: number }
    | { type: 'open_upgrades' }
    | { type: 'open_coop' };

export class MenuScreen {
    private container: HTMLDivElement;
    private onAction: (action: MenuAction) => void;

    constructor(
        overlay: HTMLElement,
        onAction: (action: MenuAction) => void,
    ) {
        this.onAction = onAction;
        this.container = document.createElement('div');
        this.container.id = 'menu-screen';
        this.container.style.cssText = `
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      color: #e5e7eb;
      font-family: monospace;
      overflow-y: auto;
      padding: 20px;
      z-index: 100;
    `;
        overlay.appendChild(this.container);
    }

    show(playerState: PlayerState): void {
        this.container.innerHTML = '';
        this.container.style.display = 'flex';

        // Title
        const title = document.createElement('h1');
        title.textContent = '🐔 CHICKEN MOB';
        title.style.cssText = `
      font-size: 28px;
      margin: 20px 0 8px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
      background: linear-gradient(135deg, #fbbf24, #f97316);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    `;
        this.container.appendChild(title);

        // Subtitle
        const sub = document.createElement('p');
        sub.textContent = 'Launch your flock. Trample the fox fort!';
        sub.style.cssText = 'color: #9ca3af; margin-bottom: 24px; font-size: 12px;';
        this.container.appendChild(sub);

        // Currency display
        const currencyRow = document.createElement('div');
        currencyRow.style.cssText = 'display: flex; gap: 20px; margin-bottom: 20px; font-size: 14px;';
        currencyRow.innerHTML = `
      <span>🌽 ${Math.floor(playerState.currencies.corn)}</span>
      <span>🪶 ${playerState.currencies.golden_feather}</span>
    `;
        this.container.appendChild(currencyRow);

        // Action buttons
        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'display: flex; gap: 12px; margin-bottom: 24px;';

        const upgradeBtn = this.createButton('🔧 Upgrades', () => {
            audio.playClick();
            this.onAction({ type: 'open_upgrades' });
        });
        const coopBtn = this.createButton('🐓 Coop', () => {
            audio.playClick();
            this.onAction({ type: 'open_coop' });
        });
        btnRow.appendChild(upgradeBtn);
        btnRow.appendChild(coopBtn);
        this.container.appendChild(btnRow);

        // Level grid
        const levelGrid = document.createElement('div');
        levelGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      width: 100%;
      max-width: 320px;
    `;

        for (let i = 0; i < LEVELS.length; i++) {
            const level = LEVELS[i];
            const unlocked = i < playerState.unlockedLevels;
            const completed = i < playerState.currentLevel;

            const btn = document.createElement('button');
            btn.style.cssText = `
        padding: 12px 8px;
        border: 2px solid ${completed ? '#22c55e' : unlocked ? '#6366f1' : '#374151'};
        border-radius: 10px;
        background: ${completed ? 'rgba(34,197,94,0.15)' : unlocked ? 'rgba(99,102,241,0.15)' : 'rgba(55,65,81,0.3)'};
        color: ${unlocked ? '#e5e7eb' : '#6b7280'};
        font-family: monospace;
        font-size: 12px;
        cursor: ${unlocked ? 'pointer' : 'default'};
        opacity: ${unlocked ? '1' : '0.5'};
        transition: transform 0.1s;
      `;
            btn.innerHTML = `
        <div style="font-size: 18px; margin-bottom: 4px;">${completed ? '⭐' : unlocked ? '🐔' : '🔒'}</div>
        <div>${i + 1}</div>
        <div style="font-size: 10px; color: #9ca3af;">${level.name}</div>
      `;

            if (unlocked) {
                btn.addEventListener('click', () => {
                    audio.playClick();
                    this.onAction({ type: 'play_level', levelIndex: i });
                });
                btn.addEventListener('touchstart', () => {
                    btn.style.transform = 'scale(0.95)';
                });
                btn.addEventListener('touchend', () => {
                    btn.style.transform = 'scale(1)';
                });
            }

            levelGrid.appendChild(btn);
        }

        this.container.appendChild(levelGrid);
    }

    hide(): void {
        this.container.style.display = 'none';
    }

    private createButton(text: string, onClick: () => void): HTMLButtonElement {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.style.cssText = `
      padding: 10px 20px;
      border: 2px solid #6366f1;
      border-radius: 10px;
      background: rgba(99,102,241,0.2);
      color: #e5e7eb;
      font-family: monospace;
      font-size: 13px;
      font-weight: bold;
      cursor: pointer;
      transition: background 0.15s, transform 0.1s;
    `;
        btn.addEventListener('click', onClick);
        btn.addEventListener('mouseenter', () => {
            btn.style.background = 'rgba(99,102,241,0.4)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.background = 'rgba(99,102,241,0.2)';
        });
        return btn;
    }

    destroy(): void {
        this.container.remove();
    }
}
