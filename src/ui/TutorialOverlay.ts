/**
 * TutorialOverlay — Simple 3-step tutorial for first-time players.
 * Shows on Level 1 and dismisses after player completes the steps.
 */

import { COLORS, SPACING, RADIUS } from './styles';

type TutorialStep = 'aim' | 'fire' | 'gate';

export class TutorialOverlay {
    private container: HTMLDivElement;
    private currentStep: TutorialStep = 'aim';
    private onComplete: () => void;
    private isActive = false;

    constructor(overlay: HTMLElement, onComplete: () => void) {
        this.onComplete = onComplete;
        this.container = document.createElement('div');
        this.container.id = 'tutorial-overlay';
        this.container.style.cssText = `
            position: absolute;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.85);
            border: 2px solid ${COLORS.primary};
            border-radius: ${RADIUS.lg}px;
            padding: ${SPACING.md}px ${SPACING.lg}px;
            color: ${COLORS.uiText};
            font-family: 'Nunito', sans-serif;
            font-size: 14px;
            font-weight: 600;
            text-align: center;
            max-width: 280px;
            z-index: 150;
            pointer-events: none;
            display: none;
            box-shadow: 0 4px 20px rgba(251, 191, 36, 0.3);
        `;
        overlay.appendChild(this.container);
    }

    show(): void {
        this.currentStep = 'aim';
        this.isActive = true;
        this.render();
        this.container.style.display = 'block';
    }

    hide(): void {
        this.isActive = false;
        this.container.style.display = 'none';
    }

    advance(): void {
        if (!this.isActive) return;

        const steps: TutorialStep[] = ['aim', 'fire', 'gate'];
        const currentIndex = steps.indexOf(this.currentStep);
        
        if (currentIndex < steps.length - 1) {
            this.currentStep = steps[currentIndex + 1];
            this.render();
        } else {
            this.hide();
            this.onComplete();
        }
    }

    onAim(): void {
        if (this.currentStep === 'aim') {
            this.advance();
        }
    }

    onFire(): void {
        if (this.currentStep === 'fire') {
            this.advance();
        }
    }

    onGatePass(): void {
        if (this.currentStep === 'gate') {
            this.advance();
        }
    }

    private render(): void {
        const content: Record<TutorialStep, { icon: string; text: string }> = {
            aim: {
                icon: '👆',
                text: 'Touch and drag to aim your cannon!',
            },
            fire: {
                icon: '🐔',
                text: 'Hold to fire chickens automatically!',
            },
            gate: {
                icon: '✖️2',
                text: 'Pass through gates to multiply your flock!',
            },
        };

        const step = content[this.currentStep];
        const steps: TutorialStep[] = ['aim', 'fire', 'gate'];
        const stepNum = steps.indexOf(this.currentStep) + 1;

        this.container.innerHTML = `
            <div style="font-size: 24px; margin-bottom: ${SPACING.xs}px;">${step.icon}</div>
            <div style="margin-bottom: ${SPACING.xs}px;">${step.text}</div>
            <div style="font-size: 11px; color: ${COLORS.uiMuted};">Step ${stepNum} of 3</div>
        `;
    }
}
