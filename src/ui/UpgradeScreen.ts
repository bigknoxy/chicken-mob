/**
 * UpgradeScreen — Tabbed upgrade barn UI.
 */

import type { PlayerState, UpgradeDefinition } from '@/data/types';
import { UPGRADES, getUpgradeCost, getUpgradeValue } from '@/data/upgrades';
import { purchaseUpgrade, canAffordUpgrade } from '@/systems/UpgradeSystem';
import { audio } from '@/platform/Audio';
import { COLORS, SPACING, RADIUS, SHADOWS, TRANSITIONS } from './styles';

export class UpgradeScreen {
    private container: HTMLDivElement;
    private onClose: () => void;
    private playerState!: PlayerState;

    constructor(overlay: HTMLElement, onClose: () => void) {
        this.onClose = onClose;
        this.container = document.createElement('div');
        this.container.id = 'upgrade-screen';
        this.container.style.cssText = `
      position: absolute;
      inset: 0;
      display: none;
      flex-direction: column;
      background: linear-gradient(180deg, ${COLORS.bgDark} 0%, ${COLORS.bgMid} 100%);
      color: ${COLORS.uiText};
      font-family: 'Nunito', sans-serif;
      overflow-y: auto;
      padding: ${SPACING.lg};
      z-index: 200;
    `;
        overlay.appendChild(this.container);
    }

    show(playerState: PlayerState): void {
        this.playerState = playerState;
        this.container.style.display = 'flex';

        // Apply transition class
        requestAnimationFrame(() => {
            this.container.classList.add('screen-enter');
        });

        this.renderContent('cannon');
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

    private renderContent(activeTab: string): void {
        this.container.innerHTML = '';

        // Header
        const header = document.createElement('div');
        header.style.cssText = `display: flex; justify-content: space-between; align-items: center; margin-bottom: ${SPACING.lg};`;

        const title = document.createElement('h2');
        title.textContent = 'Upgrade Barn';
        title.style.cssText = 'font-size: 20px; margin: 0;';

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = `
      min-width: 44px;
      min-height: 44px;
      background: rgba(239,68,68,0.3);
      border: 1px solid ${COLORS.danger};
      color: ${COLORS.danger};
      border-radius: ${RADIUS.sm}px;
      cursor: pointer;
      font-size: 16px;
      transition: transform ${TRANSITIONS.fast};
    `;
        closeBtn.addEventListener('click', () => {
            audio.playClick();
            this.hide();
            setTimeout(() => {
                this.onClose();
            }, 260);
        });
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.transform = 'scale(1.05)';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.transform = 'scale(1)';
        });

        header.appendChild(title);
        header.appendChild(closeBtn);
        this.container.appendChild(header);

        // Corn display
        const cornDisplay = document.createElement('div');
        cornDisplay.textContent = `🌽 ${Math.floor(this.playerState.currencies.corn)}`;
        cornDisplay.style.cssText = `font-size: 16px; margin-bottom: ${SPACING.md}; color: ${COLORS.primary};`;
        this.container.appendChild(cornDisplay);

        // Tabs
        const tabs = document.createElement('div');
        tabs.style.cssText = `display: flex; gap: ${SPACING.sm}; margin-bottom: ${SPACING.lg};`;
        const tabNames = [
            { key: 'cannon', label: 'Cannons' },
            { key: 'chicken', label: 'Chickens' },
            { key: 'farm', label: 'Farm' },
        ];
        for (const t of tabNames) {
            const tab = document.createElement('button');
            tab.textContent = t.label;
            const isActive = t.key === activeTab;
            const tabBorder = isActive ? COLORS.secondary : '#374151';
            const tabBg = isActive ? 'rgba(99,102,241,0.3)' : 'rgba(55,65,81,0.2)';
            const tabColor = isActive ? COLORS.uiText : COLORS.uiMuted;
            tab.style.cssText = `
        flex: 1;
        min-height: 44px;
        padding: ${SPACING.sm};
        border: 2px solid ${tabBorder};
        border-radius: ${RADIUS.sm}px;
        background: ${tabBg};
        color: ${tabColor};
        font-family: monospace;
        font-size: 12px;
        cursor: pointer;
        transition: background ${TRANSITIONS.fast}, transform ${TRANSITIONS.fast};
      `;
            tab.addEventListener('mouseenter', () => {
                tab.style.transform = 'scale(1.03)';
            });
            tab.addEventListener('mouseleave', () => {
                tab.style.transform = 'scale(1)';
            });
            tab.addEventListener('click', () => {
                audio.playClick();
                this.renderContent(t.key);
            });
            tabs.appendChild(tab);
        }
        this.container.appendChild(tabs);

        // Upgrade list
        const upgrades = UPGRADES.filter(u => u.category === activeTab);
        for (const upgrade of upgrades) {
            this.container.appendChild(this.renderUpgradeRow(upgrade));
        }
    }

    private renderUpgradeRow(def: UpgradeDefinition): HTMLDivElement {
        const currentLevel = this.playerState.upgrades[def.id] ?? 0;
        const isMax = currentLevel >= def.maxLevel;
        const cost = isMax ? 0 : getUpgradeCost(def, currentLevel);
        const currentValue = getUpgradeValue(def, currentLevel);
        const nextValue = isMax ? currentValue : getUpgradeValue(def, currentLevel + 1);
        const affordable = canAffordUpgrade(this.playerState, def.id);

        const row = document.createElement('div');
        row.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: ${SPACING.md};
      margin-bottom: ${SPACING.sm};
      background: rgba(55,65,81,0.3);
      border-radius: ${RADIUS.md}px;
      border: 1px solid #374151;
      box-shadow: ${SHADOWS.sm};
    `;

        const info = document.createElement('div');
        info.innerHTML = `
      <div style="font-weight: bold; font-size: 13px;">${def.displayName}</div>
      <div style="font-size: 11px; color: ${COLORS.uiMuted};">
        Lv.${currentLevel}/${def.maxLevel} · ${currentValue.toFixed(1)} → ${nextValue.toFixed(1)}
      </div>
    `;

        const btn = document.createElement('button');
        if (isMax) {
            btn.textContent = 'MAX';
            btn.style.cssText = `
        min-width: 44px;
        min-height: 44px;
        padding: 6px 14px;
        border: 1px solid ${COLORS.success};
        border-radius: ${RADIUS.sm}px;
        background: rgba(34,197,94,0.2);
        color: ${COLORS.success};
        font-family: monospace;
        font-size: 11px;
        transition: transform ${TRANSITIONS.fast};
      `;
        } else {
            const btnBorder = affordable ? COLORS.secondary : '#4b5563';
            const btnBg = affordable ? 'rgba(99,102,241,0.3)' : 'rgba(75,85,99,0.2)';
            const btnColor = affordable ? COLORS.uiText : '#6b7280';
            btn.textContent = `🌽 ${cost}`;
            btn.style.cssText = `
        min-width: 44px;
        min-height: 44px;
        padding: 6px 14px;
        border: 1px solid ${btnBorder};
        border-radius: ${RADIUS.sm}px;
        background: ${btnBg};
        color: ${btnColor};
        font-family: monospace;
        font-size: 11px;
        cursor: ${affordable ? 'pointer' : 'default'};
        transition: transform ${TRANSITIONS.fast};
      `;
            if (affordable) {
                btn.addEventListener('click', () => {
                    // Scale feedback
                    btn.style.transform = 'scale(1.03)';
                    setTimeout(() => {
                        btn.style.transform = 'scale(1)';
                    }, 100);
                    const success = purchaseUpgrade(this.playerState, def.id);
                    if (success) {
                        audio.playUpgrade();
                        this.renderContent(def.category);
                    }
                });
                btn.addEventListener('mouseenter', () => {
                    btn.style.transform = 'scale(1.05)';
                });
                btn.addEventListener('mouseleave', () => {
                    btn.style.transform = 'scale(1)';
                });
            } else {
                // Shake feedback for unaffordable
                btn.addEventListener('click', () => {
                    let shakeCount = 0;
                    const shakeInterval = setInterval(() => {
                        const offset = shakeCount % 2 === 0 ? 3 : -3;
                        btn.style.transform = `translateX(${offset}px)`;
                        shakeCount++;
                        if (shakeCount >= 6) {
                            clearInterval(shakeInterval);
                            btn.style.transform = 'translateX(0)';
                        }
                    }, 30);
                });
            }
        }

        row.appendChild(info);
        row.appendChild(btn);
        return row;
    }

    destroy(): void {
        this.container.remove();
    }
}
