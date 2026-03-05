# Chicken Mob - Memory & Decisions Log

## 2026-03-05 14:30: Next Level Plan - Market Research Insights

### What Players LOVE (Crowd-Runner Games)
- Quick, satisfying gameplay loops (30-60 seconds)
- "Mindless fun" - easy to pick up, hard to master
- Satisfying crowd growth visual feedback
- Fits short play sessions or multitasking
- Simple one-touch controls

### What Players HATE
- Forced ads dominating the experience (we don't have this!)
- Repetitive levels with no variety
- Difficulty spikes that feel unfair
- No meaningful progression after early levels
- Bosses/obstacles feel recycled
- Game gets boring after 20-50 levels

### What Players WANT Added
- More levels and variety
- Meaningful upgrades (not just numbers)
- Customization (skins, colors, avatars)
- Different modes/maps
- Better rewards at milestones
- Clear difficulty progression

### Market Gap Analysis
- Competitors: Mob Control, Count Masters
- Typical level count: 100+ levels
- Average session: 15-30 minutes
- Players exhaust content in 1-2 hours
- Need continuous content updates

---

## 2026-03-05 14:45: Difficulty Expansion Plan

### Goal
Transform Chicken Mob from a 15-level demo into a 54-level experience with meaningful difficulty progression.

### Design Principles
1. **Start Easy** - L1-6 teach mechanics, 90%+ win rate
2. **First Challenge** - L7-9 introduce real obstacles, 70% win rate
3. **Skill Development** - L10-15 require strategy, 50-60% win rate
4. **Mastery Levels** - L16+ demand optimization, 30-40% win rate

### Level Structure (54 Total)
- **World 1 (L1-18)**: Onboarding + First Spike
- **World 2 (L19-36)**: Pressure Stacking
- **World 3 (L37-54)**: Mastery Challenge

### Implementation Batches
- Batch 1: L1-9 (Foundation) - IMMEDIATE
- Batch 2: L10-18 (First World Complete) - PHASE 2
- Batch 3: L19-36 (World 2) - PHASE 3
- Batch 4: L37-54 (World 3) - PHASE 4

### Difficulty Knobs (Existing Mechanics Only)
1. **Gate Complexity**: 1 gate → 2 gates → 3 gates → mixed (2x + 0.5x)
2. **Enemy Pressure**: 0 foxes → 1 pack → 2 packs → brutes
3. **Fort Scaling**: HP 15 → 30 → 50 → 80 → 120
4. **Lane Pressure**: 1 lane → 2 lanes → 3 lanes → trap lanes
5. **Timing**: Timeout 60s → 45s → 30s (hard levels)

### Technical Constraints
- MUST stay on GitHub Pages (no backend)
- MUST use current tech stack (Vite + TypeScript + Canvas)
- MUST be data-driven (levels.ts only)
- NO new assets (use existing sprites/shapes)
- MAINTAIN performance (fast load times)

---

## Steve Jobs Critique & Refinements

### Critique 1: "Where's the soul?"
- Problem: Pure difficulty curve is mechanical, not emotional
- Solution: Add narrative hooks between worlds ("The Fox King awakens...")
- Implementation: World names + transition text (minimal)

### Critique 2: "Too much, too fast"
- Problem: 54 levels overwhelming for solo dev
- Solution: Ship 18 levels first, validate, then expand
- Revised Plan: L1-18 as v0.3.0, then L19-36 as v0.4.0

### Critique 3: "What's the one thing?"
- Problem: Multiple objectives (difficulty + content + variety)
- Solution: Focus on ONE core improvement: MEANINGFUL CHALLENGE
- Success Metric: Levels 10+ should require 2+ attempts on average

### Critique 4: "Respect the player's time"
- Problem: Players hate grinding
- Solution: Every level should feel completable on first try with skill
- No "impossible without upgrades" levels

### Final Direction
**Ship 18 levels with airtight difficulty curve first.** Prove the core loop is satisfying, then expand. Quality over quantity.

---

## 2026-03-05 15:00: Implementation Plan

### Phase 1: Foundation (L1-9)
**Goal**: Replace current trivial levels with satisfying onboarding

**Levels**:
- L1: 1 gate, 1 lane, fort HP 15 (tutorial)
- L2: 1 gate, 1 lane, fort HP 20
- L3: 2 gates (choice), fort HP 25
- L4: 2 gates, 1 fox pack, fort HP 30
- L5: 2 gates, 2 lanes, fort HP 35
- L6: 3 gates, 2 lanes, fort HP 40
- L7: 3 gates + 0.5x trap, 2 fox packs, fort HP 50 (first spike)
- L8: Mixed gates (2x + 1.5x), 1 brute, fort HP 45
- L9: Choice gates, staggered foxes, fort HP 55 (checkpoint)

**Acceptance Criteria**:
- All 9 levels beatable with default upgrades
- Average completion time: 35-50 seconds
- First-try win rate: L1-6: 90%+, L7-9: 70%+

### Phase 2: Challenge (L10-18)
**Goal**: Require strategy and upgrade investment

**Levels**:
- L10: Consolidation - better gates, moderate pressure
- L11: 3 lanes, mixed gates
- L12: Spike - 2 brutes, narrow gates
- L13: High fort HP, no foxes (puzzle-like)
- L14: Timing pressure (45s timeout)
- L15: Major spike - 3 brutes, trap gates
- L16: Complex gate tree (3-4 choices)
- L17: All mechanics combined
- L18: Boss level - max difficulty for world 1

**Acceptance Criteria**:
- Require 1-2 upgrades to complete comfortably
- Average 2-3 attempts per level
- Clear sense of progression

### Technical Implementation
1. Update `levels.ts` with all 18 level definitions
2. Add level names/descriptions for UI
3. Adjust `TOTAL_LEVELS` constant
4. Add unit tests for level data integrity
5. Add Playwright tests for progression
6. Update version to 0.3.0

---

## Notes
- Keep this file updated as decisions are made
- Reference in PR descriptions
- Use for future planning sessions
