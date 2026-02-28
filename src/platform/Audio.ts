/**
 * Audio — Simple Web Audio API wrapper for SFX hooks.
 *
 * Uses procedurally generated sounds (oscillator-based) so
 * no external audio files are needed for v1.
 */

export class AudioManager {
    private ctx: AudioContext | null = null;
    private enabled = true;

    private getContext(): AudioContext {
        if (!this.ctx) {
            this.ctx = new AudioContext();
        }
        return this.ctx;
    }

    setEnabled(on: boolean): void {
        this.enabled = on;
    }

    /** Quick blip for firing chickens */
    playFire(): void {
        this.playTone(440, 0.08, 'square', 0.15);
    }

    /** Positive gate multiplier hit */
    playMultiply(): void {
        this.playTone(660, 0.12, 'sine', 0.2);
        setTimeout(() => this.playTone(880, 0.1, 'sine', 0.15), 60);
    }

    /** Negative gate / trap */
    playTrap(): void {
        this.playTone(220, 0.15, 'sawtooth', 0.2);
    }

    /** Fox combat collision */
    playCombat(): void {
        this.playTone(330, 0.1, 'square', 0.12);
    }

    /** Fort hit */
    playFortHit(): void {
        this.playTone(110, 0.2, 'triangle', 0.25);
    }

    /** Level win */
    playWin(): void {
        const notes = [523, 659, 784, 1047]; // C-E-G-C
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.15, 'sine', 0.2), i * 100);
        });
    }

    /** Level lose */
    playLose(): void {
        this.playTone(200, 0.3, 'sawtooth', 0.15);
        setTimeout(() => this.playTone(150, 0.4, 'sawtooth', 0.12), 200);
    }

    /** Button click */
    playClick(): void {
        this.playTone(800, 0.04, 'sine', 0.1);
    }

    /** Purchase upgrade */
    playUpgrade(): void {
        this.playTone(500, 0.1, 'sine', 0.15);
        setTimeout(() => this.playTone(700, 0.1, 'sine', 0.12), 80);
    }

    private playTone(
        frequency: number,
        duration: number,
        type: OscillatorType,
        volume: number,
    ): void {
        if (!this.enabled) return;
        try {
            const ctx = this.getContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = type;
            osc.frequency.value = frequency;
            gain.gain.value = volume;
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + duration);
        } catch {
            // Audio not supported or blocked
        }
    }

    /** Resume audio context (must be called from user gesture) */
    resume(): void {
        if (this.ctx?.state === 'suspended') {
            this.ctx.resume();
        }
    }
}

export const audio = new AudioManager();
