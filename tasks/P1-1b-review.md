# P1-1b Code Review (PR #25: live daily-challenge modifiers + UI + browser verification)

Date: 2026-08-20 · Reviewer: agent · Scope: `git diff 88625be 047aa11`

A genuine (non-rubber-stamp) review of #25. Each candidate finding was verified
against the actual merged code before being acted on. Two candidate findings
were **rejected** after verification; the actionable ones were fixed in
`review/P1-1b-findings` and ship as a follow-up.

---

## Findings

### F1 — REAL · `?cmForceLevel` dev hook was unbounded → out-of-range crashed boot
**Severity:** medium (latent crash). A malformed `?cmForceLevel=N` with
`N ≥ TOTAL_LEVELS` (or negative) reached `getLevel(N)`, which **throws**
`Level index out of range` — an *uncaught* error during `boot()`, taking the
app down.

**Why it slipped through:** the boot hook only guarded `Number.isNaN(n)`; it
never range-checked `n`. No test exercised boot (only `startLevel`/`onLevelEnd`
via the engine).

**Fix:** added the pure, exported `parseForceLevel(raw, totalLevels)` to
`ChallengeSystem.ts` (rejects NaN, non-numeric, empty, and out-of-range →
`null`), used it in the boot hook, and added 4 unit tests covering valid /
out-of-range / non-numeric / whitespace input. Out-of-range is now logged +
ignored, never thrown.

**Teeth:** tests assert `parseForceLevel(String(TOTAL_LEVELS), TOTAL_LEVELS)`
and `'-1'` both → `null`; the only way to make the "rejects out-of-range" test
pass by accident is to also accept out-of-range, which would re-introduce the
crash.

### F3 — STYLE · misleading `_`-prefixed *used* locals
`const _q = …` / `const _forced = …` in `boot()` use the `_` "intentionally
unused" convention, but both are **used** in the same block. Replaced with
`params` / `forced` as part of the F1 fix (same lines). No functional change.

---

## Rejected findings (verified — not actionable)

### F2 — OFF-BY-ONE (REJECTED after inspection)
`selectLevelIndex` returns `[1, poolSize-1]` on a 0-based `LEVELS` array, so it
draws 35 of the named 36-pool and never selects `level_01` (index 0). On first
read this looks like an off-by-one bug — **but the function's own doc comment
documents the `[1, poolSize)` range as intentional** (index 0 is the
tutorial/intro level, correctly excluded from a challenge pool), and the test
suite enforces it. A daily challenge deliberately avoiding the trivial first
level is the *right* behavior. **No change** — but the doc comment now states
the exclusion explicitly to prevent a future "fix" that would re-include it.

### F4 — "fast_enemies multiplier unbounded" (REJECTED after inspection)
Considered adding a clamp around `enemySpeedMultiplier = mod.value || 1.5`.
Rejected: `mod.value` is **always** the fixed `MODIFIER_TABLE` value (1.5);
challenge *modifiers are not persisted or externally supplied* (only
`ChallengeProgress` is), so there is no untrusted source. Clamping a constant
would be dead defensiveness. **No change.**

---

## Outcome
- **F1 fixed + tested** (4 new unit tests, 131 → 135 passing; E2E 8/8; tsc clean; build ok).
- **F3 fixed** (cosmetic, bundled with F1).
- **F2, F4 rejected** with rationale documented above.

Net: a 2-file fix (`ChallengeSystem.ts` + `main.ts` boot) + a test addition,
zero behavioral change to normal play or to the challenge feature itself.
