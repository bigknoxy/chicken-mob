# Code Review & Simplification Plan

This document details the implementation of code simplification opportunities identified in the Chicken Mob codebase.

## Goals
- Reduce redundant data in level definitions
- Extract duplicated code patterns
- Improve performance and maintainability
- Create a more scalable codebase for future features

## Implementation Steps

### 1. Compute Lane Centers (Reducing Redundancy)

**Objective**: Eliminate redundant `x` position data by computing it from `lane` and `laneCount`

**Files to Modify**:
- `src/data/types.ts`
- `src/core/Simulation.ts`
- `src/data/levels.ts`

**Implementation Details**:
1. Add helper function in `types.ts`:
   ```typescript
   // src/data/types.ts
   export function getLaneCenter(lane: number, laneCount: number): number {
       return (lane + 0.5) / laneCount;
   }
   ```
2. Update `GateDefinition` and `ObstacleDefinition` interfaces to make `x` optional:
   ```typescript
   interface GateDefinition {
       id: string;
       position: number;        // 0..1 along lane length
       lane: number;            // lane index (0-based)
       x?: number;              // 0..1 normalized horizontal position (optional)
       width: number;           // visual width in game units
       multiplier: number;      // e.g. 2, 3, 5, 10; < 1 for traps; 0 = kill
       isPositive: boolean;     // true = multiply up, false = trap
   }
   
   interface ObstacleDefinition {
       id: string;
       type: ObstacleType;
       lane: number;
       position: number;
       x?: number;
       width: number;
       hp: number;
       movementPattern?: MovementPattern;
   }
   ```
3. In `Simulation.ts`, update gate and obstacle creation to use `getLaneCenter()` when `x` is not provided:
   ```typescript
   // In createGate() or similar function
   const x = gate.x !== undefined ? gate.x : getLaneCenter(gate.lane, state.level.laneCount);
   ```
4. Update all level definitions in `levels.ts` to remove `x` values where possible

**Verification**:
- ✅ Build passes (`npm run build`)
- ✅ Unit tests pass (`npm test`)
- ✅ Visual verification: All gates and obstacles render correctly

**Success Criteria**:
- At least 80% reduction in `x` position data across all levels
- No visual changes to game layout

### 2. Extract Fox Pack Creation (Eliminating Duplication)

**Objective**: Consolidate fox pack creation logic into a single helper function

**Files to Modify**:
- `src/core/Simulation.ts`
- `src/data/types.ts`

**Implementation Details**:
1. Add helper function in `Simulation.ts`:
   ```typescript
   // src/core/Simulation.ts
   function createFoxPack(
       state: GameState,
       foxTypeId: string,
       count: number,
       lane: number,
       position: number,
   ): FoxPack | null {
       try {
           const foxType = getFox(foxTypeId);
           return {
               id: state.nextEntityId++,
               foxTypeId,
               count,
               lane,
               x: (lane + 0.5) / state.level.laneCount,
               position,
               speed: foxType.moveSpeed,
               alive: true,
           };
       } catch {
           console.warn(`Unknown fox type: ${foxTypeId}`);
           return null;
       }
   }
   ```
2. Replace all instances of direct fox pack creation with `createFoxPack()`:
   - Replace line 111-121 (gate spawn)
   - Replace line 211-221 (scheduled spawn)

**Verification**:
- ✅ Build passes (`npm run build`)
- ✅ Unit tests pass (`npm test`)
- ✅ Visual verification: All fox packs appear correctly

**Success Criteria**:
- Duplicate fox pack creation code reduced by 100%
- No change in gameplay behavior

### 3. Optimize Array Filtering (Performance Improvement)

**Objective**: Replace array filtering operations with more efficient alternatives

**Files to Modify**:
- `src/core/Simulation.ts`

**Implementation Details**:
1. Identify array filtering operations in `simulationTick()`:
   - `state.flocks.filter(f => f.alive && f.count > 0)`
   - `state.foxPacks.filter(f => f.alive && f.count > 0)`
   - `state.obstacles.filter(o => o.alive)`

2. Implement swap-and-pop removal pattern:
   ```typescript
   // Instead of filter(), use swap-and-pop
   let writeIndex = 0;
   for (let i = 0; i < state.flocks.length; i++) {
       if (state.flocks[i].alive && state.flocks[i].count > 0) {
           if (writeIndex !== i) {
               state.flocks[writeIndex] = state.flocks[i];
           }
           writeIndex++;
       }
   }
   state.flocks.length = writeIndex;
   ```

3. Apply same pattern to foxPacks and obstacles arrays

**Verification**:
- ✅ Build passes (`npm run build`)
- ✅ Unit tests pass (`npm test`)
- ✅ Performance testing: Measure frame times before and after

**Success Criteria**:
- 20-30% improvement in array filtering performance
- No change in gameplay behavior

### 4. Move Magic Numbers to Constants (Maintainability Improvement)

**Objective**: Replace hardcoded magic numbers with named constants

**Files to Modify**:
- `src/constants/game.ts`

**Implementation Details**:
1. Add constants for magic numbers found in `Simulation.ts`:
   ```typescript
   // src/constants/game.ts
   export const FLOCK_DEATH_THRESHOLD = 0.2;
   export const MIN_FLOCK_COUNT = 1;
   export const SCREEN_SHAKE_INTENSITY = 0.15;
   ```
2. Replace hardcoded values with constants:
   - Replace `Math.max(1, Math.floor(flock.count * 0.2))` with `Math.max(MIN_FLOCK_COUNT, Math.floor(flock.count * FLOCK_DEATH_THRESHOLD))`
   - Replace `Math.max(state.screenShake, 0.15)` with `Math.max(state.screenShake, SCREEN_SHAKE_INTENSITY)`

**Verification**:
- ✅ Build passes (`npm run build`)
- ✅ Unit tests pass (`npm test`)
- ✅ Visual verification: No changes to gameplay

**Success Criteria**:
- All magic numbers replaced with named constants
- No change in gameplay behavior

## Success Metrics
- At least 75% reduction in redundant positioning data
- 100% reduction in duplicate fox pack creation code
- 20-30% improvement in array filtering performance
- All magic numbers replaced with named constants

## Timeline
- Phase 1 (Compute Lane Centers): 2 days
- Phase 2 (Extract Fox Pack Creation): 1 day
- Phase 3 (Optimize Array Filtering): 2 days
- Phase 4 (Move Magic Numbers): 1 day

Total: 6 days

## Verification
- Run all unit tests (`npm test`)
- Run build process (`npm run build`)
- Manual playtesting of various levels
- Performance benchmarking
