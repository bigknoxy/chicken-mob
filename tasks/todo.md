# Chicken Mob - Game Development Backlog

## Bug Fixes (Completed)

| Date | Issue | Fix |
|------|-------|-----|
| 2026-03-01 | Gate visual width 10x collision width | Use `gate.definition.width` in renderer |
| 2026-03-01 | DPR coordinate mismatch (cannon offset) | Remove DPR scaling in Input.ts |
| 2026-03-01 | Cumulative ctx.scale on resize | Add setTransform before scaling |

---

## P0 - Must Fix (Game-Breaking) ✅ COMPLETED

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 1 | Level 12 nearly impossible | `levels.ts:214-218` | Reduced fence HP 20/25 → 12/15, removed scarecrow, reduced brutes 4→3 |
| 2 | Unavoidable scarecrow L9 | `levels.ts:156` | Moved to edge position x:0.2 for skilled players |
| 3 | No loss condition | `Simulation.ts:172-182` | Added timeout check (60s default) |

### P0.1: Level 12 Difficulty ✅
- Reduced fence HP from 20/25 to 12/15
- Removed back_and_forth scarecrow
- Reduced fox brutes from 4 to 3

### P0.2: Level 9 Scarecrow ✅
- Moved from x:0.5 (center) to x:0.2 (edge)
- Players can now avoid by aiming to the right side of the lane

### P0.3: Loss Condition ✅
- Added timeout field to LevelDefinition
- Added check in Simulation.ts:172-182
- Default timeout: 60 seconds

---

## P1 - Should Fix (Major Impact) ✅ COMPLETED

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 1 | No star system | `types.ts`, `Simulation.ts`, `main.ts` | Added levelStars tracking, calculateStars() |
| 2 | 0.3x multiplier too harsh | `levels.ts:195,279` | Already fixed in P0 (→0.5x) |
| 3 | Aggressive upgrade costs | `upgrades.ts` | Reduced growth factors 1.5-2.0 → 1.3-1.5 |
| 4 | No 4x gate option | `levels.ts` | Added 4x gate to level 6 |

### P1.1: Star System ✅
- Added `StarRating` type (1|2|3) to PlayerState
- Track `totalChickensFired` and `totalChickensReachedFort`
- Calculate stars: 3★ (80%+), 2★ (50%+), 1★ (complete)
- Persisted per level in Persistence.ts

### P1.2: Upgrade Costs ✅
- Fire Rate: 1.6 → 1.4
- Burst Size: 1.7 → 1.45
- Launch Speed: 1.5 → 1.35
- Chicken HP: 1.6 → 1.4
- Chicken Damage: 1.7 → 1.45
- Chicken Speed: 1.5 → 1.35
- Corn Multiplier: 1.8 → 1.5
- Coop Income: 1.8 → 1.5
- Offline Cap: 2.0 → 1.5

### P1.3: 4x Gate ✅
- Added 4x multiplier gate to level 6

---

## P2 - Should Add (Engagement)

| # | Feature | Description |
|---|---------|-------------|
| 1 | Real-time score | Show running chicken count during play |
| 2 | End-of-level summary | Breakdown: deployed, remaining, efficiency % |
| 3 | Enemy spawn gates | Red gates that spawn foxes (like Mob Control) |
| 4 | Lane-switching | Allow moving flocks between lanes mid-run |

---

## P3 - Nice to Have

| # | Feature |
|---|---------|
| 1 | Daily challenges |
| 2 | Combo multiplier |
| 3 | Leaderboards |
| 4 | Unit ability indicators |

---

## Genre Gap Analysis (vs Mob Control)

| Feature | Chicken Mob | Mob Control |
|---------|-------------|-------------|
| Lane switching | ❌ | ✅ |
| Enemy multiplier gates | ❌ | ✅ |
| Boss enemies | ❌ (fort only) | ✅ |
| Power-ups during run | ❌ | ✅ |
| Combo multipliers | ❌ | ✅ |
| Running total score | ❌ | ✅ |
| Star ratings | ✅ | ✅ |
| Real-time score display | ❌ | ✅ |

---

## Level Balance Notes

| Level | Issue | Recommended Change |
|-------|-------|-------------------|
| L1 | Too easy | Increase fort HP to 15 |
| L3 | Trivially easy | Increase fort HP or add fox |
| L4 | Precise aiming frustrates | Widen gates |
| L9 | Unavoidable scarecrow | See P0.2 |
| L12 | Nearly impossible | See P0.1 |
| L15 | Very long | Reduce spawns |

---

*Last updated: 2026-03-01*

---

## 2026-03-04 - Next Level Plan (In Progress)

- [ ] Restate goal + acceptance criteria
- [ ] Market research: player loves/hates/wants for crowd-runner/gate games
- [ ] Audit current difficulty curve, economy, and level pacing
- [ ] Design: new difficulty curve + level batch plan (target 45-60 levels)
- [ ] Implement: level content + difficulty tuning + pacing changes
- [ ] Implement: progression hooks (stars → unlock flow, rewards)
- [ ] Add/adjust tests for new systems
- [ ] Run verification (build, tests, Playwright)
- [ ] Summarize changes + verification story
- [ ] Record decisions in docs/MEMORY.md
