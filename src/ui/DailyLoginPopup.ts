/**
 * DailyLoginPopup — Shows daily login rewards and streak progress.
 */

import { DAILY_REWARDS, MAX_STREAK_DAYS } from '@/systems/DailyLoginSystem';
import { audio } from '@/platform/Audio';
import { COLORS, RADIUS, SPACING, SHADOWS } from './styles';

export class DailyLoginPopup {
    private container: HTMLDivElement;

    constructor(overlay: HTMLElement) {
        this.container = document.createElement('div');
        this.container.id = 'daily-login-popup';
        this.container.style.cssText = `
            position: absolute;
            inset: 0;
            display: none;
            justify-content: center;
            align-items: center;
            background: rgba(0,0,0,0.8);
            z-index: 350;
        `;
        overlay.appendChild(this.container);
    }

    show(
        consecutiveDays: number,
        reward: { corn: number; feathers: number },
        isStreakBroken: boolean,
        onClaim: () => void,
    ): void {
        this.container.style.display = 'flex';
        this.container.innerHTML = '';

        const card = document.createElement('div');
        card.style.cssText = `
            background: linear-gradient(135deg, ${COLORS.uiSurface}, #0f172a);
            border: 2px solid ${COLORS.primary};
            border-radius: ${RADIUS.lg}px;
            padding: ${SPACING.xl};
            max-width: 340px;
            font-family: 'Nunito', sans-serif;
            color: ${COLORS.uiText};
            box-shadow: ${SHADOWS.glow};
            text-align: center;
            animation: popIn 0.3s ease-out;
        `;

        if (isStreakBroken) {
            const brokenMsg = document.createElement('div');
            brokenMsg.innerHTML = '💔 Streak broken!<br>Starting fresh today';
            brokenMsg.style.cssText = `
                font-size: 12px;
                color: ${COLORS.uiMuted};
                margin-bottom: ${SPACING.sm};
            `;
            card.appendChild(brokenMsg);
        }

        const header = document.createElement('div');
        header.innerHTML = consecutiveDays === 7 
            ? '<span style="font-size: 32px;">🎉</span><br><span style="font-size: 14px; color: #fbbf24;">JACKPOT DAY!</span>'
            : consecutiveDays === 1 
                ? '<span style="font-size: 32px;">🌅</span><br><span style="font-size: 14px;">Welcome!</span>'
                : `<span style="font-size: 32px;">🔥</span><br><span style="font-size: 14px;">Day ${consecutiveDays} Streak!</span>`;
        header.style.cssText = `margin-bottom: ${SPACING.md};`;
        card.appendChild(header);

        const streakIndicator = document.createElement('div');
        streakIndicator.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 6px;
            margin-bottom: ${SPACING.md};
        `;
        
        for (let i = 0; i < MAX_STREAK_DAYS; i++) {
            const dot = document.createElement('div');
            const isCompleted = i < consecutiveDays;
            const isCurrent = i === consecutiveDays - 1;
            dot.style.cssText = `
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: ${isCompleted ? COLORS.primary : 'transparent'};
                border: 2px solid ${isCurrent ? COLORS.primary : COLORS.uiBorder};
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                font-weight: bold;
                color: ${isCompleted ? '#1a1a2e' : COLORS.uiMuted};
                ${isCurrent ? `box-shadow: 0 0 10px ${COLORS.primary};` : ''}
            `;
            dot.textContent = `${i + 1}`;
            streakIndicator.appendChild(dot);
        }
        card.appendChild(streakIndicator);

        const rewardBox = document.createElement('div');
        rewardBox.style.cssText = `
            background: rgba(251, 191, 36, 0.15);
            border: 1px solid ${COLORS.primary};
            border-radius: ${RADIUS.md}px;
            padding: ${SPACING.md};
            margin-bottom: ${SPACING.md};
        `;

        const cornReward = document.createElement('div');
        cornReward.textContent = `+${reward.corn} 🌽`;
        cornReward.style.cssText = `
            font-size: 24px;
            font-weight: bold;
            color: ${COLORS.primary};
        `;
        rewardBox.appendChild(cornReward);

        if (reward.feathers > 0) {
            const featherReward = document.createElement('div');
            featherReward.textContent = `+${reward.feathers} 🪶`;
            featherReward.style.cssText = `
                font-size: 18px;
                color: ${COLORS.secondary};
                margin-top: 4px;
            `;
            rewardBox.appendChild(featherReward);
        }
        card.appendChild(rewardBox);

        const nextRewardInfo = document.createElement('div');
        nextRewardInfo.style.cssText = `
            font-size: 11px;
            color: ${COLORS.uiMuted};
            margin-bottom: ${SPACING.lg};
        `;
        
        if (consecutiveDays < MAX_STREAK_DAYS) {
            const nextReward = DAILY_REWARDS[consecutiveDays];
            nextRewardInfo.textContent = `Tomorrow: +${nextReward.corn} 🌽${nextReward.feathers > 0 ? ` +${nextReward.feathers} 🪶` : ''}`;
        } else {
            nextRewardInfo.textContent = 'Tomorrow: Cycle resets to Day 1 (+100 🌽)';
        }
        card.appendChild(nextRewardInfo);

        const claimBtn = document.createElement('button');
        claimBtn.textContent = 'Claim Reward!';
        claimBtn.style.cssText = `
            width: 100%;
            min-height: 44px;
            padding: ${SPACING.sm} ${SPACING.lg};
            border: 2px solid ${COLORS.success};
            border-radius: ${RADIUS.md}px;
            background: rgba(34, 197, 94, 0.3);
            color: ${COLORS.success};
            font-family: 'Nunito', sans-serif;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
        `;
        claimBtn.addEventListener('click', () => {
            audio.playUpgrade();
            this.hide();
            onClaim();
        });
        card.appendChild(claimBtn);

        this.container.appendChild(card);
    }

    hide(): void {
        this.container.style.display = 'none';
    }

    destroy(): void {
        this.container.remove();
    }
}
