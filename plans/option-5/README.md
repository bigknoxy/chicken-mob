# Option 5: Cosmetic Unlocks

This document details the implementation of a cosmetic skin system for chickens and cannons.

## Goals
- Add visual variety through skins
- Create a progression system for unlocks
- Enhance player customization options
- Maintain gameplay balance while adding cosmetics

## Implementation Steps

### 1. Skin/System Design

**Objective**: Design the skin system with clear visual distinctions

**Chicken Skins**:
- Visual variants of existing chicken types (different colors, patterns)
- Unique visual effects for rare/legendary chickens
- Custom skins for premium chickens

**Cannon Skins**:
- Visual variants of existing cannons (different colors, designs)
- Special visual effects for premium cannons
- Cosmetic-only skins that don't affect gameplay

### 2. Progression System

**Objective**: Create a balanced system for earning unlocks

**Unlock Mechanism**:
- Earn unlocks through gameplay progression
- Unlock through level completion or milestone achievements
- Premium currency for direct purchases (if implemented)
- Tiered unlock system (common → rare → epic → legendary)

**Visual Indicators**:
- Visual badges for unlocked skins
- Preview system for upcoming skins
- Skin selection interface in upgrade screen
- Visual distinction between standard and custom skins

### 3. Technical Approach

**Objective**: Implement the skin system efficiently

**Files to Modify**:
- `src/data/types.ts`
- `src/data/chickens.ts`
- `src/data/cannons.ts`
- `src/platform/Persistence.ts`
- `src/ui/UpgradeScreen.ts`
- `src/ui/Renderer.ts`

**Implementation Details**:
1. **Skin Data Structure**:
   - Extend `ChickenType` interface with skin properties:
     ```typescript
     interface ChickenType {
         id: string;
         name: string;
         color: string;
         pattern?: string;
         rarity: 'common' | 'rare' | 'epic' | 'legendary';
         skins?: { [skinId: string]: SkinData };
     }
     ```
   - Extend `BarnCannonDefinition` interface with skin properties:
     ```typescript
     interface BarnCannonDefinition {
         id: string;
         name: string;
         color: string;
         design?: string;
         rarity: 'common' | 'rare' | 'epic' | 'legendary';
         skins?: { [skinId: string]: SkinData };
     }
     ```
   - Add `SkinData` interface:
     ```typescript
     interface SkinData {
         id: string;
         name: string;
         image: string;
         description?: string;
         rarity: 'common' | 'rare' | 'epic' | 'legendary';
         unlockCondition: string;
     }
     ```

2. **Player State Integration**:
   - Extend `PlayerState` with skin ownership tracking:
     ```typescript
     interface PlayerState {
         // ... existing properties ...
         ownedChickenSkins: { [chickenId: string]: Set<string> };
         ownedCannonSkins: { [cannonId: string]: Set<string> };
         equippedChickenSkin: { chickenId: string; skinId: string } | null;
         equippedCannonSkin: { cannonId: string; skinId: string } | null;
     }
     ```

3. **Persistence Layer**:
   - Update `Persistence.ts` to save/load skin data
   - Add skin-related key-value pairs to localStorage

4. **UI Implementation**:
   - Update `UpgradeScreen.ts` with skin selection interface
   - Add visual indicators for equipped skins
   - Implement preview system for skins

5. **Rendering Layer**:
   - Update `Renderer.ts` to apply skins during rendering
   - Add logic to handle different skin visuals
   - Implement visual effects for premium skins

### 4. File Changes Needed

**Primary Files**:
- `src/data/types.ts`: Extend interfaces with skin properties
- `src/data/chickens.ts`: Add skin data for chicken types
- `src/data/cannons.ts`: Add skin data for cannons
- `src/platform/Persistence.ts`: Add skin persistence
- `src/ui/UpgradeScreen.ts`: Enhanced skin selection interface
- `src/ui/Renderer.ts`: Skin rendering logic

**Secondary Files**:
- `src/constants/game.ts`: Add skin constants
- `src/data/levels.ts`: Add skin unlock conditions

### 5. Technical Challenges

**Challenges to Anticipate**:
- Separating cosmetic data from gameplay data
- Efficient skin rendering without performance impact
- Managing skin unlock progression
- Ensuring backward compatibility

**Mitigation Strategies**:
- Store skin data separately from core game data
- Use efficient rendering techniques
- Implement progressive loading
- Maintain backward compatibility with existing saves

### 6. Timeline Estimates

**Phase 1: Design and Planning**
- Skin system design: 2 days
- Data structure design: 2 days

**Phase 2: Implementation**
- Skin data implementation: 3 days
- Persistence layer: 2 days
- UI implementation: 3 days
- Rendering implementation: 3 days

**Phase 3: Testing and Refinement**
- Skin rendering verification: 2 days
- Unlock progression testing: 2 days
- Performance impact testing: 2 days
- Compatibility testing: 2 days

**Total Timeline**: 20 days

### 7. Testing Approaches

**Testing Methods**:
- Skin rendering verification
- Unlock progression testing
- Performance impact testing
- Compatibility testing with existing saves
- Playtesting across different devices

**Success Criteria**:
- All skins render correctly
- Unlock progression works as expected
- No performance impact on game
- Backward compatibility maintained
- No regression in existing functionality

## Success Metrics
- Complete skin system implemented
- Visual variety added to chickens and cannons
- Progression system for unlocks
- No impact on gameplay balance
- Smooth user experience

## Verification
- Run all unit tests (`npm test`)
- Run build process (`npm run build`)
- Manual playtesting of skin system
- Performance benchmarking
- Verify no regressions in existing functionality
