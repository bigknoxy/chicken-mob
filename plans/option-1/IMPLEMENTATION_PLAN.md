# Option 1: World 2 Expansion (Levels 19-36) - Implementation Plan

## Overview
Add 18 new levels (19-36) to Chicken Mob to create a complete gameplay experience with progressive difficulty.

## Design Specifications

### Difficulty Progression Philosophy
- **World 1 (Levels 1-18)**: Learning curve from basics to mastery (90% → 40% win rate)
- **World 2 (Levels 19-36)**: Advanced mastery with strategic depth (35% → 25% win rate)
- Maintain 40-60 second average completion time per level
- Each level should feel distinct and introduce new strategic considerations

### World 2 Structure (Levels 19-36)
- **Levels 19-21**: Advanced Scout/Brute mechanics
- **Levels 22-24**: Sniper introduction and mixed compositions  
- **Levels 25-27**: Complex gate arrangements and timing challenges
- **Levels 28-30**: Obstacle-heavy levels with environmental challenges
- **Levels 31-33**: High-pressure fort defenses
- **Levels 34-36**: Ultimate boss wave with all mechanics combined

## Technical Implementation

### Files to Modify
1. `src/data/levels.ts` - Add levels 19-36
2. Update any hardcoded references to level count if needed

### Level Template Structure
Each level follows the exact same structure as existing levels:
```typescript
{
    id: 'level_XX',
    name: 'Level Name',
    laneCount: NUMBER,
    length: NUMBER (pixels),
    gates: [
        { id: 'gX', position: NUMBER (0-1), lane: NUMBER, x: NUMBER (0-1), width: NUMBER, multiplier: NUMBER, isPositive: BOOLEAN, type: 'multiply' },
    ],
    obstacles: [
        { id: 'oX', type: ObstacleType, lane: NUMBER, x: NUMBER, position: NUMBER (0-1), width: NUMBER, hp: NUMBER, movementPattern?: MovementPattern },
    ],
    enemySpawns: [
        { time: NUMBER (seconds), lane: NUMBER, foxTypeId: STRING, count: NUMBER },
    ],
    fort: { hp: NUMBER, armorMultiplier: NUMBER, rewardMultiplier: NUMBER },
    rewardCorn: NUMBER,
    rewardFeathers: NUMBER,
}
```

## Implementation Steps

### Phase 1: Level Design (Days 1-3)
1. Design levels 19-21: Advanced Scout/Brute mechanics
2. Design levels 22-24: Sniper introduction and mixed compositions
3. Design levels 25-27: Complex gate arrangements and timing challenges

### Phase 2: Level Design (Days 4-6)
1. Design levels 28-30: Obstacle-heavy levels with environmental challenges
2. Design levels 31-33: High-pressure fort defenses
3. Design levels 34-36: Ultimate boss wave with all mechanics combined

### Phase 3: Implementation (Days 7-9)
1. Implement levels 19-21 in levels.ts
2. Implement levels 22-24 in levels.ts
3. Implement levels 25-27 in levels.ts
4. Implement levels 28-30 in levels.ts
5. Implement levels 31-33 in levels.ts
6. Implement levels 34-36 in levels.ts

### Phase 4: Testing & Balancing (Days 10-12)
1. Playtest all new levels
2. Adjust difficulty based on win rates and completion times
3. Verify no regressions in existing levels
4. Performance testing

## Acceptance Criteria
- All 18 levels load correctly in the level selection screen
- All levels are completable with default upgrades
- Average completion time: 40-60 seconds per level
- Win rate progression: Levels 19-21 (~35%), Levels 22-24 (~30%), Levels 25-27 (~28%), Levels 28-30 (~26%), Levels 31-33 (~25%), Levels 34-36 (~25%)
- No visual or functional regressions in existing gameplay
- All unit tests pass
- All Playwright tests pass
- Build succeeds without warnings

## Risk Mitigation
- **Performance Impact**: New levels use same systems as existing levels - minimal impact
- **Difficulty Spikes**: Gradual progression with playtesting feedback
- **Regression Risk**: Comprehensive testing of existing levels
- **Scope Creep**: Strict adherence to level template structure

## Dependencies
- None - uses existing game systems and mechanics
- Leverages getLaneCenter() helper for position calculation (from code simplification)