import { describe, it, expect, vi, afterEach } from 'vitest';
import {
    BufferedAnalytics,
    BrowserCrashReporter,
    createAnalytics,
    createCrashReporter,
    type AnalyticsService,
    type AnalyticsTransport,
    type AnalyticsEventRecord,
    type AnalyticsProps,
} from '../platform/Analytics';

// A transport that records every batch it receives.
function captureTransport(): { batches: AnalyticsEventRecord[][]; fn: AnalyticsTransport } {
    const batches: AnalyticsEventRecord[][] = [];
    const fn: AnalyticsTransport = (batch) => { batches.push(batch.map(r => ({ ...r }))); };
    return { batches, fn };
}

describe('AnalyticsService — factory', () => {
    it('defaults to a NoOp service (zero-cost, privacy-safe)', () => {
        const svc: AnalyticsService = createAnalytics();
        svc.track('session_start');
        svc.trackScreen('menu');
        svc.setUser('foo');
        expect(svc.pendingCount).toBe(0);
        expect(typeof svc.flush()).toBe('undefined');
     });

    it('returns NoOp when noOp flag is set even with a transport', () => {
        const transport: AnalyticsTransport = vi.fn();
        const svc = createAnalytics({ transport, noOp: true });
        svc.track('level_start', { level: 'level_01' });
        svc.flush();
        expect(transport).not.toHaveBeenCalled();
        expect(svc.pendingCount).toBe(0);
     });

    it('returns a buffered service that forwards to the transport', async () => {
        const { fn, batches } = captureTransport();
        const svc = createAnalytics({ transport: fn });
        svc.track('level_start', { level: 'level_01', mode: 'campaign' });
        expect(svc.pendingCount).toBe(1);
        await svc.flush();
        expect(svc.pendingCount).toBe(0);
        expect(batches).toHaveLength(1);
        expect(batches[0][0].name).toBe('level_start');
     });
});

describe('BufferedAnalytics', () => {
    it('buffers events and reports pending count', () => {
        const svc = new BufferedAnalytics(undefined, 10, () => 0);
        svc.track('session_start');
        svc.track('level_result', { outcome: 'win' });
        expect(svc.pendingCount).toBe(2);
     });

    it('caps the ring buffer to the configured size', () => {
        const svc = new BufferedAnalytics(undefined, 3, () => 0);
        for (let i = 0; i < 5; i++) { svc.track('level_start'); }
        expect(svc.pendingCount).toBe(3);
     });

    it('flush forwards a snapshot copy and clears the buffer', async () => {
        const { fn, batches } = captureTransport();
        const svc = new BufferedAnalytics(fn, 10, () => 1000);
        svc.track('level_start', { level: 'level_01' });
        await svc.flush();
        expect(svc.pendingCount).toBe(0);
        expect(batches[0][0].name).toBe('level_start');
        expect(batches[0][0].ts).toBe(1000);
        expect(batches[0][0].props?.level).toBe('level_01');
     });

    it('snaps props on track (live mutation does not leak)', async () => {
        const { fn, batches } = captureTransport();
        const svc = new BufferedAnalytics(fn, 10, () => 0);
        const a: AnalyticsProps = { level: 'level_01' };
        svc.track('level_start', a);
        a.level = 'mutated';                       // live mutation after track
        await svc.flush();
        expect(batches[0][0].props?.level).toBe('level_01');  // snapshot preserved
     });

    it('scopes events to the current user on flush', async () => {
        const { fn, batches } = captureTransport();
        const svc = new BufferedAnalytics(fn, 10, () => 0);
        svc.setUser('player-42');
        svc.track('upgrade_purchased', { upgrade: 'barn_bonanza' });
        await svc.flush();
        expect(batches[0][0].props?.user).toBe('player-42');
        expect(batches[0][0].props?.upgrade).toBe('barn_bonanza');
     });

    it('survives a transport failure (drops the batch, no throw)', async () => {
        const svc = new BufferedAnalytics(() => { throw new Error('network down'); }, 10, () => 0);
        svc.track('level_start');
        await expect(svc.flush()).resolves.toBeUndefined();
        expect(svc.pendingCount).toBe(0);   // failed batch dropped, not retained
     });

    it('tracks session duration between start/end', async () => {
        let t = 0;
        const { fn, batches } = captureTransport();
        const svc = new BufferedAnalytics(fn, 10, () => t);
        svc.startSession();
        t = 53000;   // 53s later
        svc.endSession();
        const sessionEnd = batches.flat().find(r => r.name === 'session_end');
        expect(sessionEnd).toBeDefined();
        expect(sessionEnd!.props?.durationSec).toBe(53);
     });

    it('attaches the current screen to the next un-flushed event', () => {
        const svc = new BufferedAnalytics(undefined, 10, () => 0);
        svc.track('level_start');
        svc.trackScreen('playing');
        svc.track('level_result', { outcome: 'lose' });
        svc.trackScreen('menu');
        expect(svc.pendingCount).toBe(2);
     });
});

// endSession fires an async flush(); the capture transport records synchronously,
// so no microtask drain is needed — `batches` is populated when the call returns.

describe('CrashReporter', () => {
    afterEach(() => { vi.restoreAllMocks(); });

    it('queues reports and forwards them with a serializable message', () => {
        const seen: { e: unknown; ctx?: string }[] = [];
        const reporter = new BrowserCrashReporter((e, ctx) => { seen.push({ e, ctx }); });
        reporter.report(new TypeError('boom'), 'unit-test');
        expect(reporter.pendingCount).toBe(1);
        const entry = seen[0]!.e as { message: string };
        expect(entry.message).toBe('TypeError: boom');
        expect(seen[0]!.ctx).toBe('unit-test');
     });

    it('serializes non-Error values', () => {
        const seen: { e: unknown }[] = [];
        const reporter = new BrowserCrashReporter((e) => { seen.push({ e }); });
        reporter.report('something bad');
        expect((seen[0]!.e as { message: string }).message).toBe('something bad');
     });

    it('install() is a guarded no-op without a window (Node/tests)', () => {
        const reporter = new BrowserCrashReporter(undefined, undefined, undefined);
        expect(() => reporter.install()).not.toThrow();
        expect(() => reporter.uninstall()).not.toThrow();
        expect(reporter.pendingCount).toBe(0);
     });

    it('install() wires window handlers when a window is present', () => {
        const addSpy = vi.fn();
        const fakeWindow = {
            onerror: undefined,
            addEventListener: addSpy,
            removeEventListener: vi.fn(),
          } as unknown as Window & typeof globalThis;
        const reporter = new BrowserCrashReporter(undefined, undefined, fakeWindow);
        reporter.install();
        expect(addSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
        expect(typeof (fakeWindow.onerror as unknown)).toBe('function');
        reporter.uninstall();
     });

    it('createCrashReporter returns a reporter that queues via report()', () => {
        const reporter = createCrashReporter();
        reporter.report(new Error('x'));
        expect(reporter.pendingCount).toBe(1);
     });
});
