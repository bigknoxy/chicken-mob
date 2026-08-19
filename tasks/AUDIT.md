# Chicken Mob — Professional Mobile Game Audit & Prioritized Backlog

**Date:** 2026-04 | **Version audited:** 0.12.0 | **Lens:** mobile game professional (retention, monetization, ASO, quality)

---

## 1. Executive Summary

Chicken Mob is a **technically strong, mobile-ready prototype with a professional codebase but zero monetization and zero social/retention infrastructure.** It is ~60% of the way to a shippable mobile product. The gap is not engineering quality — it is **business systems** (money, competition, engagement calendar) and **content/art depth.**

**The single biggest risk:** the game has a *dead premium currency* (`golden_feather` is rewarded but never spendable) and *no ad/monetization path*, yet it is positioned as a mobile product. A free-to-play lane/mob game that cannot generate revenue is not "professional" regardless of code quality.

**Verdict:** Ship a **Monetization & Retention Sprint** (P0–P1) before any further content expansion. Content (P3) is the cheapest axis to grow and should be *deferred* until the loop that makes players want more content exists.

---

## 2. Scorecard (0–5, where 5 = "shippable AAA-mobile polish")

| Pillar | Score | Note |
|--------|:---:|------|
| Core gameplay loop | 4.5 | Strong, juicy, deterministic. The product's greatest asset. |
| Onboarding | 2.5 | 3-step tutorial only; no tutorialized progression. |
| Retention (D1/D7) | 2.0 | Daily login exists; no daily challenges, events, seasons. |
| Social / competition | 0.5 | Leaderboards planned, not built. No friends. |
| Monetization | 0.0 | No ads, no IAP. Premium currency has no sink. **Critical.** |
| Content depth | 3.5 | 108 levels, 5 chickens, 6 foxes — good for a 0.12, thin vs. Battle Cats. |
| Art / audio | 2.0 | Procedural audio only; **worlds reuse themes** (visually duplicate). |
| Performance | 3.5 | Count-based rendering is smart; no adaptive quality for low-end. |
| Accessibility | 1.0 | No colorblind/reduced-motion/text scaling. |
| i18n | 0.0 | None. Blocks non-English markets (JP/KR/BR are top grossing mobile regions). |
| Analytics / QA | 1.0 | No telemetry, no crash reporting, no funnel instrumentation. |
| **Codebase quality** | **4.5** | Modular, stateless, 101+ tests, CI/CD, deterministic sim. Best-in-class. |
| **Average** | **~2.5** | "Strong prototype, not yet a product." |

---

## 3. Competitor & Market Read

| Benchmark | Rating / signal | What to steal | What to avoid |
|-----------|------|------|------|
| **Battle Cats** (closest genre) | 4.5★, 47k+ | F2P-friendly, cute IP, "easy to learn / hard to master," *frequent live-ops updates*, daily free rewards, **no interruptive pop-ups** | Grind can feel punishing; MT exists but is optional |
| **Dead Cells** (roguelite ref) | 4.8★ | Procedural variety, *earned* (not bought) progression, strong art/music, difficulty modes | Premium one-time, not a mobile loop |
| **Hybrid-casual mob games** (Mob Runner/Rush) | high installs | Simple tap loops, "grow your mob" fantasy, ad + skins monetization | Thin depth, ad fatigue |
| **Idle gacha** (AFK/Idle Heroes/Raid) | high ARPDAU | Deep meta-progression, *seasons & events | Heavy monetization friction, dark patterns |

**Key insight:** Chicken Mob's fantasy (*few chickens → massive flock → trample fort*) is a *hybrid-casual hook with a strategy-depth ceiling* — the exact profile that scores well on install **and** ARPDAU if monetized correctly. Battle Cats' #1 loved feature is **"frequent updates / live-ops"** and its #1 tolerated complaint is **grind.** The backlog should optimize for **live-ops cadence** and **a monetization layer that is present but not aggressive.**

---

## 4. Critical Findings (bugs / debt / risks)

### F1. Dead premium currency — `golden_feather` ⚠️ HIGH
`golden_feather` is granted by Daily Login jackpot, level rewards, and Golden Goose chicken — but **no spend sink exists.** `rg golden_feather src` shows only *grants and display*, never a *purchase.* A premium currency with no sink signals unfinished economy and is a red flag to any reviewer.
- **Fix direction:** define a sink — e.g. unlock legendary chickens / exclusive cannons / cosmetic skins / offline-cap boosts with feathers. This also becomes the IAP bridge (P0).

### F2. No monetization at all ⚠️ CRITICAL
No AdMob/AppLovin/Unity Ads, no rewarded video, no IAP. For an F2P mobile product this is the #1 gap.
- **Direction:** start with **rewarded video** (revive after loss, 2× corn, extend offline cap) + **1 IAP** (remove ads / starter pack). Wire a `FeedStore`/ad facade behind a platform interface so it's swappable per store.

### F3. World themes visually duplicate
`W1=grassland, W5=grassland` and `W4=lava, W6=lava` → 4 of 6 worlds **reuse another world's theme.** New "worlds" look identical to old ones, undercutting a headline progression feature.
- **Fix:** add distinct palettes/backgrounds for the reused worlds (W5 e.g. "meadow/night", W6 e.g. "magma cave" vs "volcanic depths"). Cheap, high perceived-value.

### F4. Inconsistent / dead enemy-spawn mechanic
`GateType` includes `'enemy_spawn'`, but `levels.ts` header says *"DO NOT use enemy_spawn gate type — use enemySpawns array instead."* Simulation still branches on `gate.definition.type === 'enemy_spawn'`. Two systems for one concept = confusion + latent bug surface.
- **Fix:** pick one (prefer the `enemySpawns` array + time gate), delete the other, drop the dead branch.

### F5. Dead type variant `heat_lamp`
`CannonAbility = 'haystorm' | 'sniper_nest' | 'heat_lamp'` — no cannon defines `heat_lamp`. Either implement it or remove the union member (TypeScript `noUnusedLocals` won't catch union members, so it hides).

### F6. Dual coordinate system debt
`Flock`, `FoxPack`, `GateDefinition`, `ObstacleDefinition` all carry `x?: number` marked *"optional for backwards compat"* alongside `position`/`lane`. Two horizontal-position models coexist. Legacy fields that outlive the migration create confusion and bug surface.
- **Fix:** confirm all consumers use `position`+`lane`; delete the `x?` fields and any backwards-compat read paths.

### F7. No telemetry / crash reporting
No analytics, no funnel instrumentation, no crash reporting. You cannot measure D1/D7, funnel drop-off, or crashes on a live product.
- **Fix:** add a lightweight, privacy-respecting event bus + a crash reporter (Sentry/Ably or open-source `@sentry/browser`). Instrument: level start/win/lose, upgrade purchase, ad show/reward, retention.

---

## 5. Prioritized Backlog

Effort: **S** ≤1d, **M** 1–3d, **L** 3–7d. Impact on the 5 pillars in brackets.

### 🔴 P0 — Ship-blocker / business-critical (do FIRST)
- **[P0-1] Monetization foundation** `L` [Monetization 0→3]
  Reward ads (revive, 2× corn, offline extend) via a platform `AdService` interface + 1 IAP (remove-ads / starter pack). This is the difference between "prototype" and "product."
- **[P0-2] Activate `golden_feather` sink** `M` [Monetization, Content]
  Feathers unlock a legendary chicken + cosmetic skins. Pairs with P0-1 (feathers = IAP currency bridge).
- **[P0-3] Analytics + crash reporting** `M` [Analytics 1→3]
  Event bus + Sentry. Instrument funnel + retention. *No decision-making is reliable without this.*
- **[P0-4] Fix F3 world-theme duplication** `S` [Art]
  Distinct palettes for W5/W6. Cheap, removes a visible "unfinished" tell.

### 🟠 P1 — Retention & quality (next 1–2 sprints)
- **[P1-1] Daily Challenges (implement the existing plan)** `L` [Retention 2→4]
  `plans/daily-challenges.md` already exists — ship it. Best D1/D7 lever.
- **[P1-2] Leaderboards (implement the existing plan)** `L` [Social 0.5→3]
  `plans/leaderboards.md` (Supabase/Firebase) exists — ship it. Competition is a top-3 retention driver.
- **[P1-3] Lane switching (implement the existing plan)** `M` [Gameplay 4.5→5]
  `plans/lane-switching.md` exists; core mechanic not yet wired. Deepens the strategy ceiling.
- **[P1-4] Tutorial depth / progression onboarding** `M` [Onboarding 2.5→4]
  Expand 3-step tutorial → context-sensitive hints per mechanic (gates, traps, abilities, upgrades).
- **[P1-5] Accessibility basics** `S` [Accessibility 1→3]
  Colorblind palette, `prefers-reduced-motion`, text scaling. Low effort, broadens audience + review scores.
- **[P1-6] Resolve F4 & F5** `S` [Quality]
  Delete the dead `enemy_spawn` gate branch and `heat_lamp` variant (or implement).

### 🟡 P2 — Growth & polish (after P1)
- **[P2-1] i18n foundation** `L` [i18n 0→3]
  Key all strings; ship EN + JP + KR + BR. Unblocks top-grossing mobile markets.
- **[P2-2] Achievements / milestones** `M` [Retention]
  One-time + tiered. Cheap dopamine, pairs with daily login.
- **[P2-3] Adaptive performance** `M` [Performance]
  FPS-based particle/cap down-scaling for low-end devices; cap DPR.
- **[P2-4] Live-ops / event calendar** `L` [Retention, Monetization]
  Season + rotating event (the #1 loved feature of Battle Cats). Needs analytics (P0-3) first.
- **[P2-5] Audio depth** `M` [Art/Audio]
  Layered SFX, a music bed per world theme, reward sting. Procedural-only is a mobile-review weak point.
- **[P2-6] Content cleanup (F6)** `S` [Quality]
  Delete legacy `x?` backwards-compat fields; one coordinate model.

### 🟢 P3 — Content expansion (defer until P1 loop exists)
- **[P3-1] More chickens / foxes / cannons** `M` [Content]
  New units are cheap and high-perceived-value *once a sink/monetization exists to attach them to.*
- **[P3-2] Boss campaign finale** `M` [Content]
  A narrative boss chain gives a long-term goal + shareable "boss defeated" moment.
- **[P3-3] Cosmetic skins store** `M` [Monetization, Content]
  Skins are the friendliest IAP for a cute-IP lane game.

---

## 6. 30-Day Roadmap (suggested)

- **Wk 1 — Business floor:** P0-1 (ads + IAP), P0-3 (analytics), P0-4 (themes), P1-6 (delete dead code). *Goal: revenue path + measurement live.*
- **Wk 2 — Retention:** P1-1 (daily challenges), P1-4 (onboarding), P1-5 (a11y). *Goal: D1/D7 up, lower funnel drop.*
- **Wk 3 — Competition + depth:** P1-2 (leaderboards), P1-3 (lane switching), P2-2 (achievements). *Goal: reason to return + reason to play better.*
- **Wk 4 — Growth + QA:** P0-2 (feather sink), P2-3 (adaptive perf), P2-5 (audio), start P2-1 (i18n). *Goal: review-ready quality + markets.*

---

## 7. What to PRESERVE (do not regress)
- **Deterministic fixed-timestep simulation** — enables replays, testing, and (future) server-side leaderboards/anti-cheat.
- **Count-based aggregate mobs (`Flock`/`FoxPack`)** — O(1) gates + bounded rendering. Do not "individualize" for the sake of it.
- **Stateless system functions** — keep systems pure; don't reintroduce class-with-state.
- **101+ unit tests + CI/CD + tag-driven release** — already better than most indie mobile titles. Extend to instrument analytics in CI.
- **Battle-Cats lesson:** keep monetization *present but non-aggressive* and updates *frequent.* Avoid dark patterns; they tank long-term ratings even when they lift short-term ARPDAU.

---

## 8. Open Questions for the Owner
1. **Revenue model target:** pure ad-supported, IAP-light, or hybrid? (Determines P0-1 shape.)
2. **Are leaderboards friend-based or anonymous?** (Affects Supabase vs. Firebase + auth scope.)
3. **i18n priority market** — JP/KR gacha appetite is highest; confirms P2-1 ordering.
4. **Is a native wrapper (Capacitor/Cordova) in scope**, or ship web-PWA + hybrid-casual store ad? This changes ad-network choices.
5. **Anti-cheat stance** for leaderboards — client-only vs. server-validated?
