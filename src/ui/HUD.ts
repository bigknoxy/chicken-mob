/**
 * HUD — Heads-up display for currency counters and level info.
 *
 * Renders as DOM overlay on top of the canvas for crisp text rendering.
 */

import type { PlayerState, GameState } from '@/data/types';
import { getChicken } from '@/data/chickens';
import { formatNumber } from '@/utils/format';
import { COLORS, RADIUS } from './styles';

export class HUD {
    private container: HTMLDivElement;
    private leftContainer: HTMLDivElement;
    private cornEl: HTMLSpanElement;
    private featherEl: HTMLSpanElement;
    private abilityBtn: HTMLButtonElement | null = null;
    private abilityCooldownEl: HTMLSpanElement | null = null;
    private onAbilityTrigger: (() => void) | null = null;
    private settingsBtn: HTMLButtonElement | null = null;
    private onSettingsClick: (() => void) | null = null;

    constructor(overlay: HTMLElement) {
        this.container = document.createElement('div');
        this.container.id = 'hud';
        this.container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      padding: 8px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: 'Nunito', sans-serif;
      font-size: 14px;
      font-weight: bold;
      color: ${COLORS.uiText};
      pointer-events: none;
      z-index: 10;
    `;

        this.leftContainer = document.createElement('div');
        this.leftContainer.style.cssText = `
            background: rgba(0,0,0,0.4);
            border-radius: 0 0 ${RADIUS.md}px 0;
            padding: 4px 10px;
            display: flex;
            gap: 16px;
            align-items: center;
        `;

        const rightContainer = document.createElement('div');
        rightContainer.style.cssText = `
            background: rgba(0,0,0,0.4);
            border-radius: 0 0 0 ${RADIUS.md}px;
            padding: 4px 10px;
        `;

        this.cornEl = document.createElement('span');
        this.featherEl = document.createElement('span');

        this.leftContainer.appendChild(this.cornEl);
        this.leftContainer.appendChild(this.featherEl);

        this.settingsBtn = document.createElement('button');
        this.settingsBtn.textContent = '⚙️';
        this.settingsBtn.style.cssText = `
            pointer-events: auto;
            border: none;
            background: transparent;
            font-size: 18px;
            cursor: pointer;
            padding: 4px 8px;
        `;
        this.settingsBtn.addEventListener('click', () => {
            if (this.onSettingsClick) this.onSettingsClick();
        });
        rightContainer.appendChild(this.settingsBtn);

        this.container.appendChild(this.leftContainer);
        this.container.appendChild(rightContainer);
        overlay.appendChild(this.container);
    }

    setAbilityCallback(callback: () => void): void {
        this.onAbilityTrigger = callback;
    }

    setSettingsCallback(callback: () => void): void {
        this.onSettingsClick = callback;
    }

    update(playerState: PlayerState): void {
        this.cornEl.textContent = `🌽 ${formatNumber(playerState.currencies.corn)}`;
        this.featherEl.textContent = `🪶 ${playerState.currencies.golden_feather}`;
    }

    updateAbilityUI(gameState: GameState, playerState: PlayerState): void {
        const chickenType = getChicken(playerState.equippedChickenId);
        
        if (!chickenType.activeAbility) {
            if (this.abilityBtn) {
                this.abilityBtn.remove();
                this.abilityBtn = null;
                this.abilityCooldownEl = null;
            }
            return;
        }

        if (!this.abilityBtn) {
            this.abilityBtn = document.createElement('button');
            this.abilityBtn.style.cssText = `
                pointer-events: auto;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                border: 3px solid ${COLORS.secondary};
                background: rgba(139, 92, 246, 0.3);
                font-size: 20px;
                cursor: pointer;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            this.abilityBtn.textContent = '💥';
            this.abilityBtn.id = 'ability-btn';
            this.abilityBtn.addEventListener('click', () => {
                if (this.onAbilityTrigger) {
                    this.onAbilityTrigger();
                }
            });
            
            this.abilityCooldownEl = document.createElement('span');
            this.abilityCooldownEl.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 14px;
                font-weight: bold;
                color: white;
                text-shadow: 0 1px 2px rgba(0,0,0,0.8);
            `;
            this.abilityBtn.appendChild(this.abilityCooldownEl);
            this.container.appendChild(this.abilityBtn);
        }

        const cooldown = gameState.abilityCooldown;
        const isReady = cooldown <= 0;
        const isActive = gameState.abilityActive;

        this.abilityBtn.disabled = !isReady;
        this.abilityBtn.style.opacity = isReady ? '1' : '0.5';
        this.abilityBtn.style.borderColor = isActive ? COLORS.success : (isReady ? COLORS.secondary : COLORS.uiMuted);
        
        if (isActive) {
            this.abilityBtn.style.background = 'rgba(34, 197, 94, 0.4)';
            const remaining = Math.ceil(gameState.abilityDurationRemaining);
            this.abilityCooldownEl!.textContent = remaining > 0 ? `${remaining}` : '';
        } else if (!isReady) {
            this.abilityBtn.style.background = 'rgba(139, 92, 246, 0.2)';
            this.abilityCooldownEl!.textContent = Math.ceil(cooldown).toString();
        } else {
            this.abilityBtn.style.background = 'rgba(139, 92, 246, 0.3)';
            this.abilityCooldownEl!.textContent = '';
        }
    }

    destroy(): void {
        this.container.remove();
    }
}
