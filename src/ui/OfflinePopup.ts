/**
 * OfflinePopup — "Welcome back!" popup showing offline coop earnings.
 */

import type { OfflineEarnings } from '@/systems/OfflineSystem';
import { formatElapsedTime } from '@/systems/OfflineSystem';
import { audio } from '@/platform/Audio';

export class OfflinePopup {
    private container: HTMLDivElement;

    constructor(overlay: HTMLElement) {
        this.container = document.createElement('div');
        this.container.id = 'offline-popup';
        this.container.style.cssText = `
      position: absolute;
      inset: 0;
      display: none;
      justify-content: center;
      align-items: center;
      background: rgba(0,0,0,0.7);
      z-index: 300;
    `;
        overlay.appendChild(this.container);
    }

    show(earnings: OfflineEarnings, onClaim: () => void): void {
        if (earnings.corn <= 0) {
            onClaim();
            return;
        }

        this.container.style.display = 'flex';
        this.container.innerHTML = '';

        const card = document.createElement('div');
        card.style.cssText = `
      background: linear-gradient(135deg, #1e293b, #0f172a);
      border: 2px solid #6366f1;
      border-radius: 16px;
      padding: 28px 32px;
      text-align: center;
      font-family: monospace;
      color: #e5e7eb;
      max-width: 280px;
      animation: popIn 0.3s ease-out;
    `;

        card.innerHTML = `
      <div style="font-size: 32px; margin-bottom: 8px;">🐓</div>
      <h2 style="font-size: 18px; margin: 0 0 8px;">Welcome Back!</h2>
      <p style="font-size: 12px; color: #9ca3af; margin-bottom: 16px;">
        Your coop worked hard for ${formatElapsedTime(earnings.cappedSeconds)}
      </p>
      <div style="font-size: 28px; color: #fbbf24; font-weight: bold; margin-bottom: 4px;">
        +${earnings.corn} 🌽
      </div>
      <p style="font-size: 10px; color: #6b7280; margin-bottom: 20px;">
        ${earnings.cornPerSecond.toFixed(1)} corn/sec
      </p>
    `;

        const claimBtn = document.createElement('button');
        claimBtn.textContent = '🌽 Claim!';
        claimBtn.style.cssText = `
      padding: 12px 32px;
      border: 2px solid #22c55e;
      border-radius: 10px;
      background: rgba(34,197,94,0.3);
      color: #22c55e;
      font-family: monospace;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      transition: background 0.15s;
    `;
        claimBtn.addEventListener('click', () => {
            audio.playUpgrade();
            this.hide();
            onClaim();
        });

        card.appendChild(claimBtn);
        this.container.appendChild(card);

        // Inject animation keyframes
        if (!document.getElementById('popup-animations')) {
            const style = document.createElement('style');
            style.id = 'popup-animations';
            style.textContent = `
        @keyframes popIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `;
            document.head.appendChild(style);
        }
    }

    hide(): void {
        this.container.style.display = 'none';
    }

    destroy(): void {
        this.container.remove();
    }
}
