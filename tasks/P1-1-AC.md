# P1-1 — Daily Challenges: Acceptance Criteria & Failure Cases

**Scope of this PR (P1-1a / "the engine"):** deterministic daily-challenge
generation, streak tracking, reward escalation, persistence + migration.
Mirrors the proven `DailyLoginSystem` idiom.

**Deferred to P1-1b:** live simulation-modifier application (`applyChallengeModifiers`
on the real sim loop) and the visible `ChallengeScreen` UI + boot wiring.
Rationale: those touch the deterministic, count-based sim and the canvas renderer —
the highest-risk surfaces — so they get their own tested PR. This PR ships the
retention *mechanics* (the engine that makes "come back tomorrow" true) with a
zero-runtime-cost seam.

**Design decisions (locked):**
- Challenge keyed by **UTC calendar day** (`YYYY-MM-DD`), seed = hash of that string.
  *Failure this guards:* timezone drift causing missed/double days.
- Generation is a **pure function of the (dateString, config)** — no `Math.random`,
  no clock, so it is fully deterministic and unit-testable.
- Level selection emits a **0-based flat index into `LEVELS`**; the caller validates
  via `getLevel()`/`getWorld()`.
- Streak mirrors daily-login: **max 7**, wraps to 1, golden feather on the 7th.

---

## AC-1 — Determinism
**Behavior:** `generateDailyChallenge(day, config)` returns an *identical* object for the
same `day` (+ same config).
**Failure case it guards:** any nondeterminism — an accidental `Math.random` call, a
`Date.now()` leak, or unstable RNG state. If these ever leak in, the "identical for same
day" test fails.
→ test: `generates a byte-identical challenge for the same day string`
→ test: `two different days produce different ids`

## AC-2 — Valid, non-throwing level selection
**Behavior:** the emitted `levelIndex` is always within `[1, levelPoolSize - 1]`, so
`getLevel(challenge.levelIndex)` **never throws**.
**Failure case it guards:** an out-of-range index (e.g. `levelIndex === 0`, or
`>= TOTAL_LEVELS`) crashing the game when a challenge level is loaded.
→ test: `level index is within the requested pool and getLevel() does not throw`

## AC-3 — Non-empty, legal modifiers
**Behavior:** every challenge has **≥ 1 modifier**, all from the allowed pool, with a
defined `value`.
**Failure case it guards:** an empty-modifier challenge (which would silently play as a
*normal* level — no challenge at all) or an unknown/`undefined` modifier type.
→ test: `always includes at least one legal modifier`
→ test: `every modifier is from the allowed pool`

## AC-4 — Meaningful reward (never zero)
**Behavior:** every challenge grants **≥ 1 corn**, and the 7th-day streak grants a golden
feather.
**Failure case it guards:** a zero/negative reward (free replayable grind, or a reward the
player never sees → no incentive).
→ test: `reward is always at least 1 corn`
→ test: `the 7th consecutive completion grants a golden feather`

## AC-5 — Idempotent per-day completion (no double-claim)
**Behavior:** completing today's challenge more than once awards **exactly one reward** and
sets `completedToday = true`.
**Failure case it guards:** double-awarding corn/feathers on a repeat claim (economic
exploitation; a "press the button twice" bug).
→ test: `completing twice the same day awards the reward exactly once`

## AC-6 — Streak increment on a consecutive day
**Behavior:** completing on `day N` after completing on `day N-1` (in any *other* gap)
increments `consecutiveCompletions` by one; the longest streak is tracked.
**Failure case it guards:** streak getting stuck at 1 (no progression incentive) or
incorrectly counting a missed day as a streak.
→ test: `a completion the next day extends the streak`
→ test: `longest streak is retained`

## AC-7 — Streak resets on a missed day
**Behavior:** a gap of ≥ 1 missed day (last completion older than yesterday) resets the
streak to 1.
**Failure case it guards:** a player carrying a "free" long streak across an arbitrary gap —
the streak would become exploitable/meaningless.
→ test: `a missed day breaks the streak and resets it to 1`

## AC-8 — Streak wraps at the cap (mirrors daily-login)
**Behavior:** after the 7th consecutive completion the streak wraps to 1 (a new cycle),
with the feather already granted at the 7th.
**Failure case it guards:** an unbounded/growing streak number (display/overflow, and a
reward multiplier that runs away).
→ test: `the 8th consecutive completion wraps the streak to 1`

## AC-9 — "New day" detection is UTC-consistent
**Behavior:** `challengeId` for any instant on the same UTC day is the same string, and
changes across a UTC midnight.
**Failure case it guards:** mixing `Date.now()` (local) and UTC, so two in-app sessions on
the "same day" see *different* challenges (or the same one).
→ test: `challenge id is stable within a UTC day and changes after midnight`

## AC-10 — Persistence / migration safety
**Behavior:** an old save (no `challengeProgress` field) loads cleanly and
`getChallengeProgress` returns a sane default; completing a challenge persists and
reloads with `completedToday = true` and the streak intact.
**Failure case it guards:** a `null`/`undefined` field crash on legacy saves, or
completion not persisting (so a returning player is asked to replay "their" challenge).
→ test: `legacy save without challengeProgress loads a fresh default`
→ test: `a completion persists and reloads as completed`

---

## Status
- [x] AC-1 .. AC-10 implemented + green in `src/__tests__/challenge.test.ts` (16 tests)
- [x] Boot seam consumes the engine (analytics `challenge_available`) so it is not dead code
- [x] Teeth-proven: breaking determinism → AC-1 RED; disabling the idempotency guard → AC-5 RED
- [x] **P1-1b landed**: pure `applyChallengeModifiers(level, mods)` (sim-safe — the 3 honored modifiers `double_enemies`/`single_lane`/`fast_enemies` map onto existing `LevelDefinition` fields) + visible Daily-Challenge menu card + PLAY → live game + completion wiring
- [x] **P1-1b browser-verified** in `tests/challenge.spec.ts` (3 Playwright tests): card renders, PLAY starts a real game with the modifiers *actually applied* (`data-cm-applied`), deterministic across reloads — 8/8 E2E green
- [ ] P1-1c tracked: remaining modifier set (`stunted_chickens`/`no_upgrades`/`blind_gates`/`precision_mode`) — needs player/render hooks + a forced-completion E2E

*P0-3-style precedent: a tested engine + seamless NoOp default; the visible layer follows.*
