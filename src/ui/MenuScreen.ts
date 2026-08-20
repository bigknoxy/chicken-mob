/**
 * MenuScreen — Main menu, level select, and farm map.
 *
 * Renders as a DOM overlay that replaces the canvas during menu state.
 */

import type { PlayerState } from '@/data/types';
import { LEVELS, WORLDS, getLevelsForWorld } from '@/data/levels';
import { audio } from '@/platform/Audio';
import { COLORS, SPACING, RADIUS, SHADOWS, TRANSITIONS } from './styles';
import {
     getCurrentChallenge,
    describeModifier,
    getChallengeProgress,
    isChallengeFreshToday,
} from '@/systems/ChallengeSystem';

export type MenuAction =
    | { type: 'play_level'; levelIndex: number }
    | { type: 'play_endless' }
    | { type: 'open_upgrades' }
    | { type: 'open_coop' }
    | { type: 'play_challenge' };

export class MenuScreen {
    private container: HTMLDivElement;
    private onAction: (action: MenuAction) => void;
    private selectedWorld: string = 'W1';

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
            color: ${COLORS.uiText};
            font-family: 'Nunito', sans-serif;
            overflow-y: auto;
            overflow-x: hidden;
            padding: ${SPACING.lg}px;
            padding-bottom: ${SPACING.xxl}px;
            z-index: 100;
            box-sizing: border-box;
        `;

        const bgLayer = document.createElement('div');
        bgLayer.style.cssText = `
            position: fixed;
            inset: 0;
            background: linear-gradient(180deg, ${COLORS.bgDark} 0%, ${COLORS.bgMid} 50%, ${COLORS.bgLight} 100%);
            z-index: -1;
            pointer-events: none;
        `;
        this.container.appendChild(bgLayer);
        overlay.appendChild(this.container);
    }

    show(playerState: PlayerState): void {
        this.container.innerHTML = '';
        
        const bgLayer = document.createElement('div');
        bgLayer.style.cssText = `
            position: fixed;
            inset: 0;
            background: linear-gradient(180deg, ${COLORS.bgDark} 0%, ${COLORS.bgMid} 50%, ${COLORS.bgLight} 100%);
            z-index: -1;
            pointer-events: none;
        `;
        this.container.appendChild(bgLayer);
        
        this.container.style.display = 'flex';

        if (!this.selectedWorld || !playerState.worldsUnlocked.includes(this.selectedWorld)) {
            this.selectedWorld = playerState.currentWorld || 'W1';
        }

        requestAnimationFrame(() => {
            this.container.classList.add('screen-enter');
        });

        const headerSection = document.createElement('div');
        headerSection.style.cssText = `
            text-align: center;
            margin-bottom: ${SPACING.lg}px;
            width: 100%;
            max-width: 360px;
        `;

        const title = document.createElement('h1');
        title.textContent = 'CHICKEN MOB';
        title.style.cssText = `
            font-size: 32px;
            font-weight: 800;
            margin: ${SPACING.lg}px 0 ${SPACING.xs}px;
            text-shadow: ${SHADOWS.md};
            background: linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent});
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            letter-spacing: 1px;
        `;
        headerSection.appendChild(title);

        const sub = document.createElement('p');
        sub.textContent = 'Launch your flock. Trample the fox fort!';
        sub.style.cssText = `
            color: ${COLORS.uiMuted};
            margin: 0 0 ${SPACING.md}px;
            font-size: 13px;
            font-weight: 500;
        `;
        headerSection.appendChild(sub);
        this.container.appendChild(headerSection);

        const actionRow = document.createElement('div');
        actionRow.style.cssText = `
            display: flex;
            gap: ${SPACING.sm}px;
            margin-bottom: ${SPACING.md}px;
            width: 100%;
            max-width: 360px;
        `;

        const upgradeBtn = this.createActionButton('🛠️ Upgrades', () => {
            audio.playClick();
            this.onAction({ type: 'open_upgrades' });
        });
        const coopBtn = this.createActionButton('🏠 Coop', () => {
            audio.playClick();
            this.onAction({ type: 'open_coop' });
        });
        actionRow.appendChild(upgradeBtn);
        actionRow.appendChild(coopBtn);
        this.container.appendChild(actionRow);

        const endlessBtn = document.createElement('button');
        const highScore = playerState.endlessHighScore ?? 0;
        endlessBtn.innerHTML = `
            <div style="font-size: 16px;">♾️ Endless Mode</div>
            <div style="font-size: 11px; color: ${COLORS.uiMuted}; margin-top: 2px;">
                ${highScore > 0 ? `Best: Wave ${highScore}` : 'Infinite waves!'}
            </div>
        `;
        endlessBtn.style.cssText = `
            width: 100%;
            max-width: 360px;
            min-height: 56px;
            padding: ${SPACING.sm}px ${SPACING.md}px;
            margin-bottom: ${SPACING.lg}px;
            border: 2px solid ${COLORS.accent};
            border-radius: ${RADIUS.lg}px;
            background: linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(234, 88, 12, 0.15));
            color: ${COLORS.uiText};
            font-family: 'Nunito', sans-serif;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition: all ${TRANSITIONS.fast};
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-shadow: ${SHADOWS.md};
        `;
        this.attachButtonHandlers(endlessBtn, () => {
            audio.playClick();
            this.onAction({ type: 'play_endless' });
        }, COLORS.accent, 'linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(234, 88, 12, 0.15))');
        this.container.appendChild(endlessBtn);

        // ── Daily Challenge (P1-1b): the retention hook ──
        this.buildDailyChallengeCard(playerState);

        const worldCard = document.createElement('div');
        worldCard.style.cssText = `
            background: ${COLORS.uiCard};
            border-radius: ${RADIUS.lg}px;
            padding: ${SPACING.md}px;
            margin-bottom: ${SPACING.lg}px;
            width: 100%;
            max-width: 360px;
            box-shadow: ${SHADOWS.card};
            backdrop-filter: blur(8px);
        `;

        const worldLabel = document.createElement('div');
        worldLabel.textContent = 'WORLD';
        worldLabel.style.cssText = `
            font-size: 10px;
            font-weight: 700;
            color: ${COLORS.uiMuted};
            letter-spacing: 1.5px;
            margin-bottom: ${SPACING.sm}px;
        `;
        worldCard.appendChild(worldLabel);

        const worldTabs = document.createElement('div');
        worldTabs.style.cssText = `
            display: flex;
            gap: ${SPACING.sm}px;
            flex-wrap: wrap;
        `;

        for (const world of WORLDS) {
            const isUnlocked = playerState.worldsUnlocked.includes(world.id);
            const isCompleted = playerState.worldsCompleted.includes(world.id);
            const isSelected = this.selectedWorld === world.id;

            const tab = document.createElement('button');
            const { border: borderColor, bg: bgColor } = this.getWorldTabColors(isCompleted, isSelected, isUnlocked);

            tab.style.cssText = `
                flex: 1;
                min-width: 100px;
                padding: ${SPACING.sm}px ${SPACING.md}px;
                border: 2px solid ${borderColor};
                border-radius: ${RADIUS.md}px;
                background: ${bgColor};
                color: ${isUnlocked ? COLORS.uiText : '#6b7280'};
                font-family: 'Nunito', sans-serif;
                font-size: 12px;
                font-weight: 700;
                cursor: ${isUnlocked ? 'pointer' : 'default'};
                opacity: ${isUnlocked ? '1' : '0.5'};
                transition: all ${TRANSITIONS.fast};
                display: flex;
                align-items: center;
                justify-content: center;
                gap: ${SPACING.xs}px;
            `;
            tab.innerHTML = `${isCompleted ? '⭐ ' : isUnlocked ? '' : '🔒 '}${world.name}`;

            if (isUnlocked) {
                tab.addEventListener('click', () => {
                    audio.playClick();
                    this.selectedWorld = world.id;
                    this.show(playerState);
                });
                tab.addEventListener('mouseenter', () => {
                    if (!isSelected) {
                        tab.style.borderColor = COLORS.accentLight;
                        tab.style.background = 'rgba(249, 115, 22, 0.1)';
                    }
                });
                tab.addEventListener('mouseleave', () => {
                    tab.style.borderColor = borderColor;
                    tab.style.background = bgColor;
                });
            }

            worldTabs.appendChild(tab);
        }

        worldCard.appendChild(worldTabs);
        this.container.appendChild(worldCard);

        const levelsCard = document.createElement('div');
        levelsCard.style.cssText = `
            background: ${COLORS.uiCard};
            border-radius: ${RADIUS.lg}px;
            padding: ${SPACING.md}px;
            width: 100%;
            max-width: 360px;
            box-shadow: ${SHADOWS.card};
            backdrop-filter: blur(8px);
        `;

        const levelsLabel = document.createElement('div');
        levelsLabel.textContent = 'LEVELS';
        levelsLabel.style.cssText = `
            font-size: 10px;
            font-weight: 700;
            color: ${COLORS.uiMuted};
            letter-spacing: 1.5px;
            margin-bottom: ${SPACING.sm}px;
        `;
        levelsCard.appendChild(levelsLabel);

        const worldLevels = getLevelsForWorld(this.selectedWorld);
        const levelGrid = document.createElement('div');
        levelGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: ${SPACING.sm}px;
        `;

        for (const level of worldLevels) {
            const globalIndex = LEVELS.findIndex(l => l.id === level.id);
            const unlocked = globalIndex < playerState.unlockedLevels;
            const stars = playerState.levelStars[globalIndex];

            const btn = document.createElement('button');
            const { border: borderColor, bg: bgColor } = this.getLevelButtonColors(!!stars, unlocked);

            btn.style.cssText = `
                min-height: 72px;
                padding: ${SPACING.sm}px;
                border: 2px solid ${borderColor};
                border-radius: ${RADIUS.md}px;
                background: ${bgColor};
                color: ${COLORS.uiText};
                font-family: 'Nunito', sans-serif;
                font-size: 11px;
                cursor: ${unlocked ? 'pointer' : 'default'};
                opacity: ${unlocked ? '1' : '0.4'};
                transition: all ${TRANSITIONS.fast};
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 2px;
            `;

            const iconDiv = document.createElement('div');
            iconDiv.style.cssText = `font-size: 16px; line-height: 1;`;
            iconDiv.textContent = stars ? '⭐'.repeat(Math.min(stars, 3)) : unlocked ? '🐔' : '🔒';
            btn.appendChild(iconDiv);

            const numDiv = document.createElement('div');
            numDiv.style.cssText = `font-size: 14px; font-weight: 700;`;
            numDiv.textContent = String(globalIndex + 1);
            btn.appendChild(numDiv);

            const nameDiv = document.createElement('div');
            nameDiv.style.cssText = `font-size: 9px; color: ${COLORS.uiMuted}; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 100%;`;
            nameDiv.textContent = level.name;
            btn.appendChild(nameDiv);

            if (unlocked) {
                btn.addEventListener('click', () => {
                    btn.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        btn.style.transform = 'scale(1)';
                    }, 100);
                    audio.playClick();
                    this.onAction({ type: 'play_level', levelIndex: globalIndex });
                });
                btn.addEventListener('mouseenter', () => {
                    btn.style.borderColor = COLORS.accent;
                    btn.style.background = 'rgba(249, 115, 22, 0.15)';
                });
                btn.addEventListener('mouseleave', () => {
                    btn.style.borderColor = borderColor;
                    btn.style.background = bgColor;
                });
            }

            levelGrid.appendChild(btn);
        }

        levelsCard.appendChild(levelGrid);
        this.container.appendChild(levelsCard);

        const versionEl = document.createElement('div');
        versionEl.textContent = `v${__APP_VERSION__}`;
        versionEl.style.cssText = `
            margin-top: ${SPACING.xl}px;
            font-size: 10px;
            color: ${COLORS.uiMuted};
            opacity: 0.5;
            font-weight: 500;
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

    private createActionButton(text: string, onClick: () => void): HTMLButtonElement {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.style.cssText = `
            flex: 1;
            min-height: 44px;
            padding: ${SPACING.sm}px ${SPACING.md}px;
            border: 2px solid ${COLORS.secondary};
            border-radius: ${RADIUS.md}px;
            background: rgba(139, 92, 246, 0.15);
            color: ${COLORS.uiText};
            font-family: 'Nunito', sans-serif;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: all ${TRANSITIONS.fast};
        `;
        
        this.attachButtonHandlers(btn, onClick, COLORS.secondary, 'rgba(139, 92, 246, 0.15)');
        return btn;
    }

    private attachButtonHandlers(
        btn: HTMLButtonElement,
        onClick: () => void,
        defaultBorder: string,
        defaultBg: string,
    ): void {
        btn.addEventListener('click', () => {
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                btn.style.transform = 'scale(1)';
            }, 100);
            onClick();
        });
        btn.addEventListener('mouseenter', () => {
            btn.style.borderColor = COLORS.accent;
            btn.style.background = 'rgba(249, 115, 22, 0.2)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.borderColor = defaultBorder;
            btn.style.background = defaultBg;
        });
    }

    destroy(): void {
        this.container.remove();
    }

    // ── Private Helpers ──
    private getWorldTabColors(isCompleted: boolean, isSelected: boolean, isUnlocked: boolean): { border: string; bg: string } {
        if (isCompleted) {
            return { border: COLORS.success, bg: 'rgba(34, 197, 94, 0.15)' };
        }
        if (isSelected) {
            return { border: COLORS.accent, bg: 'rgba(249, 115, 22, 0.2)' };
        }
        if (isUnlocked) {
            return { border: COLORS.secondary, bg: 'rgba(139, 92, 246, 0.15)' };
        }
        return { border: '#374151', bg: 'rgba(55, 65, 81, 0.3)' };
    }

    private getLevelButtonColors(hasStars: boolean, isUnlocked: boolean): { border: string; bg: string } {
        if (hasStars) {
            return { border: COLORS.success, bg: 'rgba(34, 197, 94, 0.12)' };
        }
        if (isUnlocked) {
            return { border: COLORS.secondary, bg: 'rgba(139, 92, 246, 0.12)' };
        }
        return { border: '#374151', bg: 'rgba(55, 65, 81, 0.25)' };
     }

      // ── Daily Challenge card (P1-1b) ──
    // Renders today's deterministic challenge (modifiers + reward + streak) and
     // a PLAY affordance. Exposes the challenge on document.body.dataset.cmToday
      // so E2E/dev tooling can inspect it without starting a game.
    private buildDailyChallengeCard(playerState: PlayerState): void {
        const challenge = getCurrentChallenge();
        const progress = getChallengeProgress(playerState);
        const fresh = isChallengeFreshToday(playerState);

        document.body.dataset.cmToday = JSON.stringify({
             id: challenge.id,
            modifiers: challenge.modifiers.map((m) => m.type),
         });

        const card = document.createElement('div');
        card.id = 'daily-challenge-card';
        card.style.cssText = `
            background: ${COLORS.uiCard};
            border: 1px solid ${COLORS.accent};
            border-radius: ${RADIUS.lg}px;
            padding: ${SPACING.md}px;
            margin-bottom: ${SPACING.lg}px;
            width: 100%;
            max-width: 360px;
            box-shadow: ${SHADOWS.card};
            backdrop-filter: blur(8px);
         `;

        const title = document.createElement('div');
        title.textContent = `\u23f3 DAILY CHALLENGE \u00b7 ${challenge.id}`;
        title.style.cssText = `
            font-size: 14px;
            font-weight: 800;
            color: ${COLORS.accent};
            margin-bottom: ${SPACING.xs}px;
         `;
        card.appendChild(title);

        const mods = document.createElement('div');
        mods.id = 'daily-challenge-mods';
        mods.textContent = challenge.modifiers.map((m) => describeModifier(m)).join(' \u00b7 ') || 'No modifiers';
        mods.style.cssText = `
            font-size: 12px;
            color: ${COLORS.uiText};
            margin-bottom: ${SPACING.xs}px;
         `;
        card.appendChild(mods);

        const streak = document.createElement('div');
        streak.textContent = `\u{1f525} Streak: ${progress.consecutiveCompletions} days \u00b7 Reward: \u{1f33d} ${challenge.reward.corn}`;
        streak.style.cssText = `
            font-size: 11px;
            color: ${COLORS.uiMuted};
            margin-bottom: ${SPACING.md}px;
         `;
        card.appendChild(streak);

        const btn = document.createElement('button');
        btn.id = 'daily-challenge-play';
        btn.style.cssText = `
            width: 100%;
            min-height: 44px;
            padding: ${SPACING.sm}px ${SPACING.md}px;
            border: 2px solid ${COLORS.accent};
            border-radius: ${RADIUS.md}px;
            background: linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(234, 88, 12, 0.15));
            color: ${COLORS.uiText};
            font-family: 'Nunito', sans-serif;
            font-size: 13px;
            font-weight: 700;
            transition: all ${TRANSITIONS.fast};
         `;
        if (fresh) {
             btn.textContent = '\u25b6 Play Challenge';
             btn.disabled = false;
             btn.style.cursor = 'pointer';
            this.attachButtonHandlers(
                 btn,
                 () => {
                     audio.playClick();
                     this.onAction({ type: 'play_challenge' });
                 },
                 COLORS.accent,
                 'linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(234, 88, 12, 0.15))',
            );
        } else {
             btn.textContent = '\u2713 Completed Today';
            btn.disabled = true;
            btn.style.cursor = 'default';
            btn.style.opacity = '0.6';
        }
        card.appendChild(btn);
        this.container.appendChild(card);
     }
}
