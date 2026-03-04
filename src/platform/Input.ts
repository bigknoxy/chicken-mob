/**
 * Input — Touch and mouse input handling for cannon aiming.
 *
 * Supports both touch (mobile) and mouse (desktop) input.
 * The player drags horizontally to aim and holds to auto-fire.
 */

export interface InputState {
    /** Is the player currently pressing/touching? */
    isDown: boolean;
    /** Current X position (0..canvasWidth) */
    x: number;
    /** Current Y position */
    y: number;
    /** Was a new press started this frame? */
    justPressed: boolean;
    /** Was the press released this frame? */
    justReleased: boolean;
}

/** Haptic feedback utility - safe guard if not supported */
export function hapticFeedback(pattern: number | readonly number[]): void {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern as number | number[]);
    }
}

/** Predefined haptic patterns */
export const HAPTIC = {
    light: 10,
    medium: 25,
    heavy: 50,
    fire: [10, 30, 10],
    win: [50, 100, 50, 100, 100],
    lose: [100, 50, 100],
} as const;

export class InputManager {
    private state: InputState = {
        isDown: false,
        x: 0,
        y: 0,
        justPressed: false,
        justReleased: false,
    };

    constructor(private readonly canvas: HTMLCanvasElement) {
        this.bindEvents();
    }

    getState(): Readonly<InputState> {
        return this.state;
    }

    /** Call at end of each frame to clear one-shot flags */
    endFrame(): void {
        this.state.justPressed = false;
        this.state.justReleased = false;
    }

    private bindEvents(): void {
        // Touch events
        this.canvas.addEventListener('touchstart', this.onTouchStart, { passive: false });
        this.canvas.addEventListener('touchmove', this.onTouchMove, { passive: false });
        this.canvas.addEventListener('touchend', this.onTouchEnd, { passive: false });
        this.canvas.addEventListener('touchcancel', this.onTouchEnd, { passive: false });

        // Mouse events (for desktop testing)
        this.canvas.addEventListener('mousedown', this.onMouseDown);
        this.canvas.addEventListener('mousemove', this.onMouseMove);
        this.canvas.addEventListener('mouseup', this.onMouseUp);
        this.canvas.addEventListener('mouseleave', this.onMouseUp);
    }

    private getCanvasPos(clientX: number, clientY: number): { x: number; y: number } {
        const rect = this.canvas.getBoundingClientRect();
        // Return logical coordinates (CSS pixels) - Renderer handles DPR via ctx.scale()
        return {
            x: clientX - rect.left,
            y: clientY - rect.top,
        };
    }

    private onTouchStart = (e: TouchEvent): void => {
        e.preventDefault();
        const touch = e.touches[0];
        const pos = this.getCanvasPos(touch.clientX, touch.clientY);
        this.state.isDown = true;
        this.state.x = pos.x;
        this.state.y = pos.y;
        this.state.justPressed = true;
    };

    private onTouchMove = (e: TouchEvent): void => {
        e.preventDefault();
        const touch = e.touches[0];
        const pos = this.getCanvasPos(touch.clientX, touch.clientY);
        this.state.x = pos.x;
        this.state.y = pos.y;
    };

    private onTouchEnd = (e: TouchEvent): void => {
        e.preventDefault();
        this.state.isDown = false;
        this.state.justReleased = true;
    };

    private onMouseDown = (e: MouseEvent): void => {
        const pos = this.getCanvasPos(e.clientX, e.clientY);
        this.state.isDown = true;
        this.state.x = pos.x;
        this.state.y = pos.y;
        this.state.justPressed = true;
    };

    private onMouseMove = (e: MouseEvent): void => {
        const pos = this.getCanvasPos(e.clientX, e.clientY);
        this.state.x = pos.x;
        this.state.y = pos.y;
    };

    private onMouseUp = (): void => {
        this.state.isDown = false;
        this.state.justReleased = true;
    };

    destroy(): void {
        this.canvas.removeEventListener('touchstart', this.onTouchStart);
        this.canvas.removeEventListener('touchmove', this.onTouchMove);
        this.canvas.removeEventListener('touchend', this.onTouchEnd);
        this.canvas.removeEventListener('touchcancel', this.onTouchEnd);
        this.canvas.removeEventListener('mousedown', this.onMouseDown);
        this.canvas.removeEventListener('mousemove', this.onMouseMove);
        this.canvas.removeEventListener('mouseup', this.onMouseUp);
        this.canvas.removeEventListener('mouseleave', this.onMouseUp);
    }
}
