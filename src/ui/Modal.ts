import { COLORS, RADIUS, SHADOWS, SPACING } from './styles';

export class Modal {
    private overlay: HTMLDivElement;

    constructor() {
        this.overlay = document.createElement('div');
        this.overlay.style.cssText = `
        position: absolute;
        inset: 0;
        display: none;
        justify-content: center;
        align-items: center;
        background: rgba(0,0,0,0.7);
        z-index: 1000;
    `;
        document.body.appendChild(this.overlay);
    }

    show(title: string, content: string, buttons: { text: string; onClick: () => void }[]): void {
        this.overlay.innerHTML = '';
        this.overlay.style.display = 'flex';

        const card = document.createElement('div');
        card.style.cssText = `
        background: linear-gradient(135deg, #0f172a, #111827);
        padding: ${SPACING.lg};
        border-radius: ${RADIUS.lg}px;
        min-width: 260px;
        color: ${COLORS.uiText};
        font-family: 'Nunito', sans-serif;
        box-shadow: ${SHADOWS.md};
        white-space: pre-line;
    `;

        const h = document.createElement('h3');
        h.textContent = title;
        h.style.margin = '0 0 8px 0';

        const p = document.createElement('p');
        p.textContent = content;
        p.style.margin = '0 0 12px 0';
        p.style.color = COLORS.uiMuted;

        const row = document.createElement('div');
        row.style.cssText = 'display:flex; gap:8px; justify-content:flex-end;';
        for (const b of buttons) {
            const btn = document.createElement('button');
            btn.textContent = b.text;
            btn.style.cssText = `
                min-width: 44px;
                min-height: 44px;
                padding: ${SPACING.sm} ${SPACING.md};
                border: 1px solid ${COLORS.secondary};
                border-radius: ${RADIUS.md}px;
                background: rgba(99,102,241,0.2);
                color: ${COLORS.uiText};
                font-family: 'Nunito', sans-serif;
                font-size: 13px;
                cursor: pointer;
            `;
            btn.addEventListener('click', () => { b.onClick(); this.hide(); });
            row.appendChild(btn);
        }

        card.appendChild(h);
        card.appendChild(p);
        card.appendChild(row);
        this.overlay.appendChild(card);
    }

    hide(): void { this.overlay.style.display = 'none'; }
}
