# P1-5 — Accessibility: reduced motion (P1-5a shipped, 5b tracked)

**Verdict:** P1-5a — **Done (browser-verified).** P1-5b (high-contrast/colorblind
palette + text scaling + the OS-override floor fix) — **Tracked.**

The audit rated Accessibility **1/10** ("No colorblind/reduced-motion/text
scaling"). P1-5a ships the non-invasive, high-value slice: `prefers-reduced-motion`.
The invasive slices (a `px → em` sweep for text scaling, a real colorblind-safe
palette design) are tracked as **P1-5b** to keep this increment testable + low-risk,
mirroring the P1-1a → b → c pattern.

## P1-5a — shipped

- **`src/platform/Accessibility.ts`** — platform idiom (interface + NoOp default +
  Browser impl + factory + singleton, mirroring `Audio.ts`/`Analytics.ts`).
  `prefersReducedMotion()` reads the OS signal; `applyReducedMotion(on)` injects/
  removes a dedicated `#cm-reduced-motion` style block (neutralizes transitions/
  animations/scroll globally; no double-inject; NoOp-safe in non-DOM envs).
- **`src/data/types.ts`** — `PlayerSettings.reducedMotion?: boolean` (optional ⇒
  migration-safe; absent ⇒ "defer to the OS on boot").
- **`src/main.ts`** — boot seam: seed the setting from the OS signal when a save
  predates the field, then apply the player's current choice.
- **`index.html`** — `@media (prefers-reduced-motion: reduce)` load-window safety
  floor (vestibular users) + a documented comment.
- **`src/ui/SettingsScreen.ts`** — a "🎬 Reduced Motion" toggle, applied live;
  also **fixes a latent gap** where *no* toggle was previously persisted
  (`savePlayerState` now runs on every toggle).
- **`src/__tests__/accessibility.test.ts`** — 5 unit tests (NoOp contract, DOM
  inject/once/remove, migration safety).
- **`tests/accessibility.spec.ts`** — 3 browser E2E tests proving the wiring is
  live: emulated reduced-motion ⇒ `#cm-reduced-motion` injected; the no-signal
  control ⇒ no injection (teeth); the in-game Settings screen exposes the toggle.

### Teeth record
- Disabling the DOM inject ⇒ the "injects once / removes" test goes RED (only a
  real `BrowserAccessibility` reading the stubbed DOM yields count === 1).
- The E2E control (no signal ⇒ count 0) guarantees the "emulated ⇒ injected"
  assertion is not a false positive.

### Known v1 limitation (disclosed, not hidden)
The unconditional `@media (prefers-reduced-motion: reduce)` rule means a user with
the OS signal set **cannot fully re-enable motion** via the in-game toggle
(the `@media` floor still applies). Dominant behavior (no-signal users + turning on
for others) is fully correct. **Tracked for P1-5b:** gate the `@media` rule on a
JS-set attribute so the user's choice is authoritative.

## P1-5b — tracked (not in scope for this PR)
- High-contrast / colorblind-safe palette (needs a palette design + a `COLORS` swap).
- Text scaling (needs a `px → em` sweep across the screens — font sizes are hardcoded).
- The `@media` override-floor fix (gate `@media` on a JS-set attribute).

## Validation
- 140 unit (was 135, +5) · 11 E2E (was 8, +3) · tsc 0 errors · build ok · CI green.
