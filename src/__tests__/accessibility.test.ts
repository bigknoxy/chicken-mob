import { describe, it, expect } from 'vitest';
import { accessibility, createAccessibility } from '@/platform/Accessibility';
import { createDefaultPlayerState } from '@/platform/Persistence';

/**
 * P1-5a — reduced-motion accessibility.
 *
 * The `accessibility` singleton is created ONCE at import time in the node test
 * env (no DOM), so it is the NoOp service here — we assert that contract. The
 * DOM behavior is exercised with a minimal DOM stub + a FRESH `createAccessibility()`
 * (which reads the *current* global window), then proven in-browser by an E2E
 * (`tests/accessibility.spec.ts`) that emulates `prefers-reduced-motion`.
 */

describe('P1-5a — service contract (NoOp where there is no DOM)', () => {
 it('the singleton implements the AccessibilityService contract', () => {
        expect(accessibility).toBeDefined();
        expect(typeof accessibility.prefersReducedMotion).toBe('function');
        expect(typeof accessibility.applyReducedMotion).toBe('function');
       });

 it('is NoOp-safe: no motion, no throw, even when asked to enable it', () => {
        // In node there is no document, so the factory yields a NoOp.
        const svc = createAccessibility();
        expect(svc.prefersReducedMotion()).toBe(false);
        expect(() => svc.applyReducedMotion(true)).not.toThrow();
        expect(() => svc.applyReducedMotion(false)).not.toThrow();
       });
});

describe('P1-5a — DOM behavior (minimal DOM stub + fresh service)', () => {
     function stubDom(reduced: boolean) {
        const head: any[] = [];
        const documentStub: any = {
            getElementById(id: string) {
                return head.find((el) => el.id === id) ?? null;
              },
            createElement(_tag: string) {
                const el: any = { id: '', textContent: '' };
                el.remove = () => { const i = head.indexOf(el); if (i >= 0) head.splice(i, 1); };
                return el;
              },
            get head() {
                return { appendChild(el: any) { head.push(el); } };
              }
           };
        (globalThis as any).document = documentStub;
        (globalThis as any).window = {
            matchMedia: (q: string) => ({
                matches: q === '(prefers-reduced-motion: reduce)' ? reduced : false,
                media: q,
              }),
            location: { search: '' },
           };
        return { head };
       }

 it('reads the OS prefers-reduced-motion signal', () => {
        stubDom(true);
        expect(createAccessibility().prefersReducedMotion()).toBe(true);

        stubDom(false);
        expect(createAccessibility().prefersReducedMotion()).toBe(false);
       });

 it('injects the neutralizing style once (no double-inject) and removes it when disabled', () => {
        const { head } = stubDom(true);
        const svc = createAccessibility(); // BrowserAccessibility, reads current globals

        expect(svc.applyReducedMotion(true)).toBeUndefined();
        expect(head.filter((el: any) => el.id === 'cm-reduced-motion').length).toBe(1);

        // Applying again must not create a second block.
        svc.applyReducedMotion(true);
        expect(head.filter((el: any) => el.id === 'cm-reduced-motion').length).toBe(1);

        // Disabling removes the block.
        svc.applyReducedMotion(false);
        expect(head.filter((el: any) => el.id === 'cm-reduced-motion').length).toBe(0);
       });
});

describe('P1-5a — migration safety', () => {
 it('a fresh save has a settings object so the toggle always has a home', () => {
        const state = createDefaultPlayerState();
        expect(state.settings).toBeDefined();
        expect(typeof state.settings!.soundEnabled).toBe('boolean');
        expect(typeof state.settings!.musicEnabled).toBe('boolean');
        expect(typeof state.settings!.hapticsEnabled).toBe('boolean');
          // reducedMotion is intentionally absent by default => boot seeds it from the OS.
        expect('reducedMotion' in state.settings!).toBe(false);
       });
});
