/**
 * MenuScreen — Main menu, level select, and farm map.
 *
 * Renders as a DOM overlay that replaces the canvas during menu state.
 */

import type { PlayerState } from '@/data/types';
import { LEVELS } from '@/data/levels';
import { audio } from '@/platform/Audio';
import { COLORS, SPACING, RADIUS, SHADOWS, TRANSITIONS } from './styles';

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
      display: none;
      flex-direction: column;
      align-items: center;
      background: linear-gradient(180deg, ${COLORS.bgDark} 0%, ${COLORS.bgMid} 50%, ${COLORS.bgLight} 100%);
      color: ${COLORS.uiText};
      font-family: 'Nunito', sans-serif;
      overflow-y: auto;
      padding: ${SPACING.lg};
      z-index: 100;
    `;
        overlay.appendChild(this.container);
    }

    show(playerState: PlayerState): void {
        this.container.innerHTML = '';
        this.container.style.display = 'flex';

        // Apply transition class
        requestAnimationFrame(() => {
            this.container.classList.add('screen-enter');
        });

        // Title
        const title = document.createElement('h1');
        title.textContent = 'CHICKEN MOB';
        title.style.cssText = `
      font-size: 28px;
      margin: 20px 0 8px;
      text-shadow: ${SHADOWS.md};
      background: linear-gradient(135deg, ${COLORS.primary}, #f97316);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    `;
        this.container.appendChild(title);

        // Subtitle
        const sub = document.createElement('p');
        sub.textContent = 'Launch your flock. Trample the fox fort!';
        sub.style.cssText = `color: ${COLORS.uiMuted}; margin-bottom: ${SPACING.xl}; font-size: 12px;`;
        this.container.appendChild(sub);

        // Action buttons
        const btnRow = document.createElement('div');
        btnRow.style.cssText = `display: flex; gap: ${SPACING.md}; margin-bottom: 40px;`;

        const upgradeBtn = this.createButton('Upgrades', () => {
            audio.playClick();
            this.onAction({ type: 'open_upgrades' });
        });
        const coopBtn = this.createButton('Coop', () => {
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
            const borderColor = completed ? COLORS.success : unlocked ? COLORS.secondary : '#374151';
            const bgColor = completed ? 'rgba(34,197,94,0.15)' : unlocked ? 'rgba(99,102,241,0.15)' : 'rgba(55,65,81,0.3)';
            const textColor = unlocked ? COLORS.uiText : '#6b7280';
            btn.style.cssText = `
        min-width: 44px;
        min-height: 44px;
        padding: 12px 8px;
        border: 2px solid ${borderColor};
        border-radius: ${RADIUS.md}px;
        background: ${bgColor};
        color: ${textColor};
        font-family: 'Nunito', sans-serif;
        font-size: 12px;
        cursor: ${unlocked ? 'pointer' : 'default'};
        opacity: ${unlocked ? '1' : '0.5'};
        transition: transform ${TRANSITIONS.fast};
      `;
            btn.innerHTML = `
        <div style="font-size: 18px; margin-bottom: 4px;">${completed ? '⭐' : unlocked ? '🐔' : '🔒'}</div>
        <div>${i + 1}</div>
        <div style="font-size: 10px; color: ${COLORS.uiMuted};">${level.name}</div>
      `;

            if (unlocked) {
                btn.addEventListener('click', () => {
                    // Scale feedback
                    btn.style.transform = 'scale(1.03)';
                    setTimeout(() => {
                        btn.style.transform = 'scale(1)';
                    }, 100);
                    audio.playClick();
                    this.onAction({ type: 'play_level', levelIndex: i });
                });
                btn.addEventListener('mouseenter', () => {
                    btn.style.transform = 'scale(1.05)';
                });
                btn.addEventListener('mouseleave', () => {
                    btn.style.transform = 'scale(1)';
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

        // Version display
        const versionEl = document.createElement('div');
        versionEl.textContent = `v${__APP_VERSION__}`;
        versionEl.style.cssText = `
            margin-top: ${SPACING.xl};
            font-size: 11px;
            color: ${COLORS.uiMuted};
            opacity: 0.6;
        `;
        this.container.appendChild(versionEl);
    }

    hide(): void {
        this.container.classList.remove('screen-enter');
        this.container.style.cssText += `
      opacity: 0;
      transform: translateY(-10px);
      transition: opacity 0.25s ease, transform 0.25s ease;
    `;
        setTimeout(() => {
            this.container.style.display = 'none';
            this.container.style.cssText = this.container.style.cssText.replace(
                /opacity: 0;.*?transition.*?;/,
                ''
            );
        }, 250);
    }

    private createButton(text: string, onClick: () => void): HTMLButtonElement {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.style.cssText = `
      min-width: 44px;
      min-height: 44px;
      padding: 10px 20px;
      border: 2px solid ${COLORS.secondary};
      border-radius: ${RADIUS.md}px;
      background: rgba(99,102,241,0.2);
      color: ${COLORS.uiText};
      font-family: 'Nunito', sans-serif;
      font-size: 13px;
      font-weight: bold;
      cursor: pointer;
      transition: background ${TRANSITIONS.fast}, transform ${TRANSITIONS.fast};
    `;
        btn.addEventListener('click', () => {
            // Scale feedback
            btn.style.transform = 'scale(1.03)';
            setTimeout(() => {
                btn.style.transform = 'scale(1)';
            }, 100);
            onClick();
        });
        btn.addEventListener('mouseenter', () => {
            btn.style.background = 'rgba(99,102,241,0.4)';
            btn.style.transform = 'scale(1.05)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.background = 'rgba(99,102,241,0.2)';
            btn.style.transform = 'scale(1)';
        });
        return btn;
    }

    destroy(): void {
        this.container.remove();
    }
}
