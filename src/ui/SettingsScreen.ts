/**
 * SettingsScreen — Game settings UI with toggles and reset option.
 */

import type { PlayerState, PlayerSettings } from '@/data/types';
import { COLORS, RADIUS, SPACING, SHADOWS } from './styles';

export class SettingsScreen {
    private container: HTMLDivElement;
    private onClose: (() => void) | null = null;
    private playerState: PlayerState | null = null;

    constructor(overlay: HTMLElement) {
        this.container = document.createElement('div');
        this.container.id = 'settings-screen';
        this.container.style.cssText = `
            position: absolute;
            inset: 0;
            display: none;
            justify-content: center;
            align-items: center;
            background: rgba(0,0,0,0.8);
            z-index: 400;
        `;
        overlay.appendChild(this.container);
    }

    show(playerState: PlayerState, onClose: () => void): void {
        this.playerState = playerState;
        this.onClose = onClose;
        this.render();
        this.container.style.display = 'flex';
    }

    hide(): void {
        this.container.style.display = 'none';
    }

    private render(): void {
        if (!this.playerState) return;
        
        const settings = this.playerState.settings ?? {
            soundEnabled: true,
            musicEnabled: true,
            hapticsEnabled: true,
        };

        this.container.innerHTML = '';

        const card = document.createElement('div');
        card.style.cssText = `
            background: linear-gradient(135deg, ${COLORS.uiSurface}, #0f172a);
            border: 2px solid ${COLORS.secondary};
            border-radius: ${RADIUS.lg}px;
            padding: ${SPACING.xl};
            min-width: 300px;
            max-width: 90vw;
            font-family: 'Nunito', sans-serif;
            color: ${COLORS.uiText};
            box-shadow: ${SHADOWS.lg};
        `;

        const title = document.createElement('h2');
        title.textContent = '⚙️ Settings';
        title.style.cssText = `
            margin: 0 0 ${SPACING.lg}px 0;
            text-align: center;
            font-size: 20px;
        `;
        card.appendChild(title);

        const toggleRow = (label: string, key: keyof PlayerSettings, emoji: string): HTMLDivElement => {
            const row = document.createElement('div');
            row.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: ${SPACING.sm} 0;
                border-bottom: 1px solid ${COLORS.uiBorder};
            `;

            const labelEl = document.createElement('span');
            labelEl.textContent = `${emoji} ${label}`;
            labelEl.style.fontSize = '14px';

            const toggle = document.createElement('button');
            toggle.style.cssText = `
                width: 50px;
                height: 28px;
                border-radius: 14px;
                border: none;
                cursor: pointer;
                position: relative;
                transition: background 0.2s ease;
                background: ${settings[key] ? COLORS.success : COLORS.uiBorder};
            `;

            const knob = document.createElement('span');
            knob.style.cssText = `
                position: absolute;
                top: 2px;
                left: ${settings[key] ? '24px' : '2px'};
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: white;
                transition: left 0.2s ease;
            `;
            toggle.appendChild(knob);

            toggle.addEventListener('click', () => {
                if (!this.playerState || !this.playerState.settings) return;
                const settings = this.playerState.settings;
                if (key === 'soundEnabled') settings.soundEnabled = !settings.soundEnabled;
                else if (key === 'musicEnabled') settings.musicEnabled = !settings.musicEnabled;
                else if (key === 'hapticsEnabled') settings.hapticsEnabled = !settings.hapticsEnabled;
                const newValue = settings[key];
                toggle.style.background = newValue ? COLORS.success : COLORS.uiBorder;
                knob.style.left = newValue ? '24px' : '2px';
            });

            row.appendChild(labelEl);
            row.appendChild(toggle);
            return row;
        };

        card.appendChild(toggleRow('Sound Effects', 'soundEnabled', '🔊'));
        card.appendChild(toggleRow('Music', 'musicEnabled', '🎵'));
        card.appendChild(toggleRow('Haptic Feedback', 'hapticsEnabled', '📳'));

        const spacer = document.createElement('div');
        spacer.style.height = `${SPACING.lg}px`;
        card.appendChild(spacer);

        const resetBtn = document.createElement('button');
        resetBtn.textContent = '🗑️ Reset Progress';
        resetBtn.style.cssText = `
            width: 100%;
            padding: ${SPACING.sm} ${SPACING.md};
            border: 1px solid ${COLORS.danger};
            border-radius: ${RADIUS.md}px;
            background: rgba(239, 68, 68, 0.2);
            color: ${COLORS.danger};
            font-family: 'Nunito', sans-serif;
            font-size: 13px;
            cursor: pointer;
            margin-bottom: ${SPACING.md};
        `;
        resetBtn.addEventListener('click', () => {
            this.showResetConfirmation();
        });
        card.appendChild(resetBtn);

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.style.cssText = `
            width: 100%;
            padding: ${SPACING.md};
            border: 2px solid ${COLORS.secondary};
            border-radius: ${RADIUS.md}px;
            background: rgba(139, 92, 246, 0.2);
            color: ${COLORS.uiText};
            font-family: 'Nunito', sans-serif;
            font-size: 15px;
            font-weight: bold;
            cursor: pointer;
        `;
        closeBtn.addEventListener('click', () => {
            if (this.onClose) this.onClose();
            this.hide();
        });
        card.appendChild(closeBtn);

        this.container.appendChild(card);
    }

    private showResetConfirmation(): void {
        this.container.innerHTML = '';

        const card = document.createElement('div');
        card.style.cssText = `
            background: linear-gradient(135deg, ${COLORS.uiSurface}, #0f172a);
            border: 2px solid ${COLORS.danger};
            border-radius: ${RADIUS.lg}px;
            padding: ${SPACING.xl};
            text-align: center;
            font-family: 'Nunito', sans-serif;
            color: ${COLORS.uiText};
        `;

        card.innerHTML = `
            <h3 style="margin: 0 0 8px 0; color: ${COLORS.danger};">⚠️ Reset Progress?</h3>
            <p style="margin: 0 0 ${SPACING.lg}px; font-size: 13px; color: ${COLORS.uiMuted};">
                This will delete ALL your progress including:
                <br>• Corn and golden feathers
                <br>• Upgrades and unlocks
                <br>• Level progress and stars
                <br><br>This cannot be undone!
            </p>
        `;

        const btnRow = document.createElement('div');
        btnRow.style.cssText = `display: flex; gap: ${SPACING.sm};`;

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.cssText = `
            flex: 1;
            padding: ${SPACING.sm} ${SPACING.md};
            border: 1px solid ${COLORS.uiBorder};
            border-radius: ${RADIUS.md}px;
            background: transparent;
            color: ${COLORS.uiText};
            font-family: 'Nunito', sans-serif;
            cursor: pointer;
        `;
        cancelBtn.addEventListener('click', () => {
            if (this.playerState) this.render();
        });

        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = 'Reset';
        confirmBtn.style.cssText = `
            flex: 1;
            padding: ${SPACING.sm} ${SPACING.md};
            border: 1px solid ${COLORS.danger};
            border-radius: ${RADIUS.md}px;
            background: ${COLORS.danger};
            color: white;
            font-family: 'Nunito', sans-serif;
            cursor: pointer;
        `;
        confirmBtn.addEventListener('click', () => {
            localStorage.removeItem('chicken_mob_save');
            location.reload();
        });

        btnRow.appendChild(cancelBtn);
        btnRow.appendChild(confirmBtn);
        card.appendChild(btnRow);
        this.container.appendChild(card);
    }

    destroy(): void {
        this.container.remove();
    }
}
