/**
 * UpgradeScreen — Tabbed upgrade barn UI.
 */

import type { PlayerState, UpgradeDefinition } from '@/data/types';
import { UPGRADES, getUpgradeCost, getUpgradeValue } from '@/data/upgrades';
import { purchaseUpgrade, canAffordUpgrade } from '@/systems/UpgradeSystem';
import { audio } from '@/platform/Audio';

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
      background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
      color: #e5e7eb;
      font-family: 'Nunito', sans-serif;
      overflow-y: auto;
      padding: 16px;
      z-index: 200;
      transition: opacity 0.25s ease, transform 0.25s ease;
    `;
        overlay.appendChild(this.container);
    }

    show(playerState: PlayerState): void {
        this.playerState = playerState;
        this.container.style.display = 'flex';
        this.renderContent('cannon');
    }

    hide(): void {
        this.container.style.display = 'none';
    }

    private renderContent(activeTab: string): void {
        this.container.innerHTML = '';

        // Header
        const header = document.createElement('div');
        header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;';

        const title = document.createElement('h2');
        title.textContent = '🔧 Upgrade Barn';
        title.style.cssText = 'font-size: 20px; margin: 0;';

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = `
      background: rgba(239,68,68,0.3);
      border: 1px solid #ef4444;
      color: #ef4444;
      border-radius: 8px;
      width: 32px;
      height: 32px;
      cursor: pointer;
      font-size: 16px;
    `;
        closeBtn.addEventListener('click', () => {
            audio.playClick();
            this.hide();
            this.onClose();
        });

        header.appendChild(title);
        header.appendChild(closeBtn);
        this.container.appendChild(header);

        // Corn display
        const cornDisplay = document.createElement('div');
        cornDisplay.textContent = `🌽 ${Math.floor(this.playerState.currencies.corn)}`;
        cornDisplay.style.cssText = 'font-size: 16px; margin-bottom: 12px; color: #fbbf24;';
        this.container.appendChild(cornDisplay);

        // Tabs
        const tabs = document.createElement('div');
        tabs.style.cssText = 'display: flex; gap: 8px; margin-bottom: 16px;';
        const tabNames = [
            { key: 'cannon', label: '🏚️ Cannons' },
            { key: 'chicken', label: '🐔 Chickens' },
            { key: 'farm', label: '🌾 Farm' },
        ];
        for (const t of tabNames) {
            const tab = document.createElement('button');
            tab.textContent = t.label;
            const isActive = t.key === activeTab;
            tab.style.cssText = `
        flex: 1;
        padding: 8px;
        border: 2px solid ${isActive ? '#6366f1' : '#374151'};
        border-radius: 8px;
        background: ${isActive ? 'rgba(99,102,241,0.3)' : 'rgba(55,65,81,0.2)'};
        color: ${isActive ? '#e5e7eb' : '#9ca3af'};
        font-family: monospace;
        font-size: 12px;
        cursor: pointer;
      `;
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
      padding: 12px;
      margin-bottom: 8px;
      background: rgba(55,65,81,0.3);
      border-radius: 10px;
      border: 1px solid #374151;
    `;

        const info = document.createElement('div');
        info.innerHTML = `
      <div style="font-weight: bold; font-size: 13px;">${def.displayName}</div>
      <div style="font-size: 11px; color: #9ca3af;">
        Lv.${currentLevel}/${def.maxLevel} · ${currentValue.toFixed(1)} → ${nextValue.toFixed(1)}
      </div>
    `;

        const btn = document.createElement('button');
        if (isMax) {
            btn.textContent = 'MAX';
            btn.style.cssText = `
        padding: 6px 14px;
        border: 1px solid #22c55e;
        border-radius: 8px;
        background: rgba(34,197,94,0.2);
        color: #22c55e;
        font-family: monospace;
        font-size: 11px;
      `;
        } else {
            btn.textContent = `🌽 ${cost}`;
            btn.style.cssText = `
        padding: 6px 14px;
        border: 1px solid ${affordable ? '#6366f1' : '#4b5563'};
        border-radius: 8px;
        background: ${affordable ? 'rgba(99,102,241,0.3)' : 'rgba(75,85,99,0.2)'};
        color: ${affordable ? '#e5e7eb' : '#6b7280'};
        font-family: monospace;
        font-size: 11px;
        cursor: ${affordable ? 'pointer' : 'default'};
      `;
            if (affordable) {
                btn.addEventListener('click', () => {
                    const success = purchaseUpgrade(this.playerState, def.id);
                    if (success) {
                        audio.playUpgrade();
                        this.renderContent(def.category);
                    }
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
