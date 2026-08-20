/**
 * Accessibility — platform foundation (P1-5a).
 *
 * Follows the `Audio.ts` / `Analytics.ts` idiom: an interface, a default
 * (NoOp-safe) implementation, a factory, and a module-level singleton.
 *
 * P1-5a ships `reduced-motion` only — the non-invasive, universally-valuable
 * slice of accessibility. It honors the OS `prefers-reduced-motion` signal and
 * lets the player override it in Settings; when enabled it neutralizes CSS
 * transitions/animations globally so motion-sensitive players aren't overloaded.
 *
 * Deferred to P1-5b (the invasive slices):
 *   - High-contrast / colorblind palette (needs a real, tested color design +
 *     a palette swap; the `COLORS` tokens are a `const` object).
 *   - Text scaling (needs a `px → em` sweep across the screens; font sizes are
 *     hardcoded `px` today).
 * This is intentionally scoped so the foundation is testable and low-risk.
 */

// ── Interface ────────────────────────────────────────────────────────────────

/**
 * The accessibility services the rest of the app depends on. Kept narrow so
 * the high-contrast/text-scale methods can be added in P1-5b without touching
 * call sites.
 */
export interface AccessibilityService {
    /** The OS `prefers-reduced-motion` signal. Default false when unknown. */
    prefersReducedMotion(): boolean;
    /**
     * Apply (or clear) reduced-motion globally. When `on`, a neutralizing
     * style block is injected that disables transitions/animations/
     * scroll-behavior so the player's choice is authoritative regardless of OS.
     */
    applyReducedMotion(on: boolean): void;
}

// ── Implementations ──────────────────────────────────────────────────────────

const REDUCED_MOTION_STYLE_ID = 'cm-reduced-motion';

/** NoOp: inert in environments without a DOM (e.g. unit harness / SSR). */
class NoOpAccessibility implements AccessibilityService {
    prefersReducedMotion(): boolean {
        return false;
    }
    applyReducedMotion(_on: boolean): void {
        // no-op
     }
}

/**
 * Browser implementation. Toggles a dedicated, removable `<style>` block so
 * turning motion off/on is cheap and non-destructive (no cascade churn).
 */
class BrowserAccessibility implements AccessibilityService {
    prefersReducedMotion(): boolean {
        if (typeof window === 'undefined' || !window.matchMedia) return false;
        try {
            return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
         } catch {
            // matchMedia can throw on malformed queries or in odd embeds
             return false;
         }
     }

    applyReducedMotion(on: boolean): void {
        if (typeof document === 'undefined') return;
        const existing = document.getElementById(REDUCED_MOTION_STYLE_ID);
        if (on) {
            // Disable all motion globally. The `!important` wins over the
            // per-element transitions the screens set inline.
            if (existing) return; // already applied — inject once
            const style = document.createElement('style');
            style.id = REDUCED_MOTION_STYLE_ID;
            style.textContent = `
    *, *::before, *::after {
      transition: none !important;
      animation: none !important;
      scroll-behavior: auto !important;
    }
  `;
            document.head.appendChild(style);
         } else if (existing) {
            existing.remove();
         }
     }
}

// ── Factory + singleton ──────────────────────────────────────────────────────

export function createAccessibility(): AccessibilityService {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
        return new NoOpAccessibility();
     }
    return new BrowserAccessibility();
}

/** The module-level singleton — import and use it anywhere. NoOp-safe. */
export const accessibility: AccessibilityService = createAccessibility();
