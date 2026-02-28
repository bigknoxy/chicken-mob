/**
 * GameLoop — Fixed-timestep simulation with variable-rate rendering.
 *
 * Runs at 60 fps target. Simulation ticks at a fixed 16.67ms step
 * to keep physics deterministic regardless of frame rate.
 */

export type UpdateFn = (dt: number) => void;
export type RenderFn = (interpolation: number) => void;

const TICK_RATE = 60;
const TICK_MS = 1000 / TICK_RATE;
const MAX_FRAME_SKIP = 5; // prevent spiral of death

export class GameLoop {
    private running = false;
    private rafId = 0;
    private lastTime = 0;
    private accumulator = 0;

    constructor(
        private readonly onUpdate: UpdateFn,
        private readonly onRender: RenderFn,
    ) { }

    start(): void {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        this.accumulator = 0;
        this.rafId = requestAnimationFrame(this.tick);
    }

    stop(): void {
        this.running = false;
        cancelAnimationFrame(this.rafId);
    }

    private tick = (now: number): void => {
        if (!this.running) return;

        const frameTime = Math.min(now - this.lastTime, TICK_MS * MAX_FRAME_SKIP);
        this.lastTime = now;
        this.accumulator += frameTime;

        let steps = 0;
        while (this.accumulator >= TICK_MS && steps < MAX_FRAME_SKIP) {
            this.onUpdate(TICK_MS / 1000); // pass delta in seconds
            this.accumulator -= TICK_MS;
            steps++;
        }

        // interpolation factor for smooth rendering between ticks
        const interpolation = this.accumulator / TICK_MS;
        this.onRender(interpolation);

        this.rafId = requestAnimationFrame(this.tick);
    };
}
