/**
 * Analytics & Crash Reporting — platform foundation (P0-3).
 *
 * A swappable, dependency-free event bus + crash reporter following the same
 * idiom as `Audio.ts` (interface + implementations + a factory + a singleton).
 *
 * Design goals:
 *  - Privacy-respecting: the DEFAULT service is `NoOp` — zero network, zero cost,
 *    safe in tests. A real transport (Sentry/Ably/custom HTTP) is plugged in via
 *    configuration later WITHOUT touching call sites.
 *  - Buffered: events are held in a bounded ring buffer and flushed in batches,
 *    so a slow/offline network never blocks the game loop.
 *  - Crash-safe: the reporter captures unhandled errors/rejections and queues
 *    them with the same transport, plus reports them synchronously.
 *  - Forward-compatible: the event taxonomy already includes `ad_show` /
 *    `ad_reward` so P0-1 (monetization) is instrumentable the moment it lands.
 *
 * Call sites co-locate with the existing audio SFX hooks in `main.ts` so
 * instrumentation reads as "another reaction to the same event."
 */

// ── Event taxonomy ──

/**
 * Closed set of first-class analytics events. Keep this narrow — free-form
 * property keys live in `AnalyticsProps`, not here, so dashboards stay tidy.
 */
export type AnalyticsEvent =
    | 'session_start'
    | 'session_end'
    | 'level_start'
    | 'level_result'
    | 'upgrade_purchased'
    | 'daily_login_claim'
    | 'challenge_start'
    | 'challenge_result'
    | 'challenge_available'   // a daily challenge is live for the player
    | 'ad_show'      // forward-compat for P0-1 (monetization)
    | 'ad_reward'    // forward-compat for P0-1 (monetization);
;

/** Property values kept to primitive, JSON-safe shapes. */
export type AnalyticsProps = Record<string, string | number | boolean | null>;

/** A single buffered event record (transport-agnostic). */
export interface AnalyticsEventRecord {
    name: AnalyticsEvent;
    ts: number;
    props?: AnalyticsProps;
}

// ── Service interface ──

export interface AnalyticsService {
    /** Record an event (queued; flushed in batches). */
    track(event: AnalyticsEvent, props?: AnalyticsProps): void;
    /** Mark the active UI screen (attached to subsequent events). */
    trackScreen(screen: string): void;
    /** Associate a (pseudo-anonymous) user id with subsequent events. */
    setUser(userId?: string): void;
    /** Flush the queued batch to the transport. */
    flush(): void | Promise<void>;
    /** Seconds since the session started (0 if not started). */
    startSession(): void;
    endSession(): void;
    /** Number of events queued but not yet flushed. */
    readonly pendingCount: number;
}

/**
 * A transport takes the flushed batch. Implemented later to POST to a backend
 * or hand off to Sentry/Ably. `undefined` = no-op (default).
 */
export type AnalyticsTransport = (batch: ReadonlyArray<AnalyticsEventRecord>) => void | Promise<void>;

// ── NoOp (default; privacy-safe, zero overhead) ──

const NOOP: AnalyticsService = {
    track() {},
    trackScreen() {},
    setUser() {},
    flush() {},
    startSession() {},
    endSession() {},
    get pendingCount() { return 0; },
};

/**
 * Buffered, swappable service. Holds events in a capped ring buffer and flushes
 * batches to the injected `transport` (no-op by default).
 */
export class BufferedAnalytics implements AnalyticsService {
    private buffer: AnalyticsEventRecord[] = [];
    private screen: string | null = null;
    private userId: string | null = null;
    private sessionStartedAt = 0;
    private inSession = false;
    private readonly cap: number;
    private readonly now: () => number;

    constructor(
        private readonly transport?: AnalyticsTransport,
        cap = 250,
        now: () => number = () => Date.now(),
    ) {
        this.cap = cap;
        this.now = now;
    }

    track(event: AnalyticsEvent, props?: AnalyticsProps): void {
        const record: AnalyticsEventRecord = {
            name: event,
            ts: this.now(),
            props: props ? { ...props } : undefined,
        };
        this.buffer.push(record);
        if (this.buffer.length > this.cap) {
            this.buffer.splice(0, this.buffer.length - this.cap);
        }
    }

    trackScreen(screen: string): void {
        this.screen = screen;
        // Attach the current screen to the most recent un-flushed event so
        // dashboards can segment by flow.
        const last = this.buffer[this.buffer.length - 1];
        if (last) { last.props = { ...last.props, __screen: this.screen }; }
    }

    setUser(userId?: string): void {
        this.userId = userId ?? null;
    }

    async flush(): Promise<void> {
        if (this.buffer.length === 0) return;
        const batch = this.buffer.splice(0, this.buffer.length);
        const decorated = this.userId
            ? batch.map(r => ({ ...r, props: { user: this.userId ?? null, ...r.props } }))
            : batch;
        try {
            await this.transport?.(decorated);
        } catch {
            // A failed flush must never crash the game; drop the batch.
        }
    }

    startSession(): void {
        this.inSession = true;
        this.sessionStartedAt = this.now();
        this.track('session_start');
    }

    endSession(): void {
        const durationSec = this.inSession ? Math.round((this.now() - this.sessionStartedAt) / 1000) : 0;
        this.inSession = false;
        this.track('session_end', { durationSec });
        void this.flush();
    }

    get pendingCount(): number {
        return this.buffer.length;
    }
}

// ── Crash reporting ──

/** Captures and forwards unhandled errors/rejections. */
export interface CrashReporter {
    /** Attach global handlers (no-op where window is unavailable). */
    install(): void;
    /** Report an error (queued + forwarded). */
    report(error: unknown, context?: string): void;
    /** Detach global handlers. */
    uninstall(): void;
    readonly pendingCount: number;
}

/**
 * Browsers crash reporter. Captures `window.onerror` + unhandledrejection into
 * a crash queue and forwards via the transport. Safe in non-browser envs
 * (Node/tests): `install()` is a guarded no-op.
 */
export class BrowserCrashReporter implements CrashReporter {
    private queue: { error: unknown; context: string; ts: number; message: string }[] = [];
    private installed = false;

    constructor(
        private readonly onError?: (error: unknown, context?: string) => void,
        private readonly now: () => number = () => Date.now(),
        private readonly window?: Window & typeof globalThis,
    ) {}

    get pendingCount(): number { return this.queue.length; }

    report(error: unknown, context = ''): void {
        const entry = {
            error,
            context,
            ts: this.now(),
            // Capture a serializable message for transport.
            message: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
        };
        this.queue.push(entry);
        if (this.onError) this.onError(entry, context);
    }

    install(): void {
        if (this.installed || !this.window) return;
        this.windowHandlers = {
            onerror: (msg, src, lineno, colno, err) => {
                this.report(err ?? `${msg} (${src?.toString()}:${lineno}:${colno})`, 'uncaught');
            },
            onunhandledrejection: (e: { reason: unknown }) => this.report(e.reason, 'unhandledrejection'),
        };
        this.window.onerror = this.windowHandlers.onerror;
        this.window.addEventListener('unhandledrejection', this.windowHandlers.onunhandledrejection);
        this.installed = true;
    }

    uninstall(): void {
        if (!this.installed || !this.window || !this.windowHandlers) return;
        this.window.removeEventListener('unhandledrejection', this.windowHandlers.onunhandledrejection);
        this.windowHandlers = undefined;
        this.installed = false;
    }

    private windowHandlers: {
        onerror: (msg: string | Event, src?: string, lineno?: number, colno?: number, err?: Error) => void;
        onunhandledrejection: (e: { reason: unknown }) => void;
    } | undefined;
}

// ── Factories ──

/**
 * Build an analytics service. `endpoint`-style config is the seam for a future
 * HTTP transport; it defaults to NoOp so production is zero-cost & safe until a
 * transport is explicitly configured (a one-line change, no call-site churn).
 */
export function createAnalytics(
    opts: { transport?: AnalyticsTransport; cap?: number; noOp?: boolean } = {},
): AnalyticsService {
    if (opts.noOp || !opts.transport) return NOOP;
    return new BufferedAnalytics(opts.transport, opts.cap ?? 250);
}

/**
 * Build a crash reporter. In a browser it wires `window.onerror` +
 * unhandledrejection to the reporter (with the given forward callback). Outside
 * a browser it returns a guarded no-op-ish reporter that still queues via report().
 */
export function createCrashReporter(
    onError?: (error: unknown, context?: string) => void,
): CrashReporter {
    return new BrowserCrashReporter(onError, undefined,
        typeof window !== 'undefined' ? window : undefined);
}

/**
 * Wire global crash handlers into the current window and forward reportable
 * errors to the console (override `onCrash` to route to a real backend later).
 * No-op in non-browser environments.
 */
export function installCrashReporting(onCrash?: (message: string, context: string) => void): void {
    createCrashReporter((entry, ctx) => {
        const record = entry as { message?: string; error?: unknown };
        const message = record.message ?? String(record.error ?? record);
        if (onCrash) { onCrash(message, ctx ?? ''); } else { console.warn('[chicken-mob crash]', ctx, message); }
    }).install();
}

// ── Singleton (mirrors `audio`) ──

/** The default service is NoOp — safe, zero-cost, swappable. */
export const analytics: AnalyticsService = createAnalytics();
