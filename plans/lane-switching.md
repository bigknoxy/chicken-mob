# Lane Switching Implementation Plan

## Overview

Allow players to move chicken flocks between lanes mid-run by swiping left/right. This matches Mob Control's core mechanic and adds strategic depth.

## Feature Description

- Player swipes/drag left or right to move active flock to adjacent lane
- Visual: Smooth transition animation between lanes
- Restrictions: Cannot switch while in combat, gate, or obstacle
- Cooldown: Brief cooldown between switches to prevent spam

---

## Implementation Steps

### Step 1: Add Lane Switch State to Flock

**File:** `src/data/types.ts`

```typescript
export interface Flock {
    id: number;
    chickenTypeId: string;
    count: number;
    lane: number;
    position: number;
    speed: number;
    alive: boolean;
    // NEW: Lane switching
    targetLane?: number;           // Lane switching to (undefined = not switching)
    laneSwitchProgress?: number;   // 0-1 progress of lane switch animation
    laneSwitchCooldown?: number;   // Seconds until next switch allowed
}

// Add to GameState
export interface GameState {
    // ... existing fields
    laneSwitchEnabled: boolean;    // Feature toggle
}
```

### Step 2: Add Input Handling for Lane Switch

**File:** `src/platform/Input.ts`

Add swipe detection:
```typescript
export interface InputState {
    tap: { x: number; y: number } | null;
    swipe: { direction: 'left' | 'right'; magnitude: number } | null;  // NEW
}

// Swipe detection thresholds
const SWIPE_THRESHOLD = 50; // Minimum pixels for swipe
const SWIPE_TIME_LIMIT = 300; // Max ms for swipe gesture

let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;

canvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchStartTime = Date.now();
});

canvas.addEventListener('touchend', (e) => {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    const deltaTime = Date.now() - touchStartTime;
    
    // Check for horizontal swipe
    if (Math.abs(deltaX) > SWIPE_THRESHOLD && 
        Math.abs(deltaX) > Math.abs(deltaY) &&
        deltaTime < SWIPE_TIME_LIMIT) {
        
        inputState.swipe = {
            direction: deltaX > 0 ? 'right' : 'left',
            magnitude: Math.abs(deltaX)
        };
    }
});

// Also support keyboard for testing
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        inputState.swipe = { direction: 'left', magnitude: 100 };
    } else if (e.key === 'ArrowRight') {
        inputState.swipe = { direction: 'right', magnitude: 100 };
    }
});
```

### Step 3: Process Lane Switch in Simulation

**File:** `src/core/Simulation.ts`

Add lane switching logic:
```typescript
const LANE_SWITCH_COOLDOWN = 0.5; // Seconds between switches
const LANE_SWITCH_DURATION = 0.3; // Animation duration

export function processLaneSwitch(state: GameState, input: InputState, dt: number): void {
    if (!state.laneSwitchEnabled) return;
    
    // Check for swipe input
    if (input.swipe) {
        const activeFlock = getActiveFlock(state);
        if (activeFlock && canSwitchLane(activeFlock, state)) {
            const direction = input.swipe.direction === 'left' ? -1 : 1;
            const newLane = activeFlock.lane + direction;
            
            // Validate lane exists
            if (newLane >= 0 && newLane < state.level.lanes) {
                activeFlock.targetLane = newLane;
                activeFlock.laneSwitchProgress = 0;
            }
        }
        input.swipe = null; // Consume input
    }
    
    // Update active lane switches
    for (const flock of state.flocks) {
        if (flock.targetLane !== undefined) {
            flock.laneSwitchProgress = (flock.laneSwitchProgress || 0) + dt / LANE_SWITCH_DURATION;
            
            if (flock.laneSwitchProgress >= 1) {
                // Complete the switch
                flock.lane = flock.targetLane;
                flock.targetLane = undefined;
                flock.laneSwitchProgress = undefined;
                flock.laneSwitchCooldown = LANE_SWITCH_COOLDOWN;
            }
        }
        
        // Update cooldown
        if (flock.laneSwitchCooldown && flock.laneSwitchCooldown > 0) {
            flock.laneSwitchCooldown -= dt;
        }
    }
}

function canSwitchLane(flock: Flock, state: GameState): boolean {
    // Check cooldown
    if (flock.laneSwitchCooldown && flock.laneSwitchCooldown > 0) return false;
    
    // Cannot switch while already switching
    if (flock.targetLane !== undefined) return false;
    
    // Cannot switch while in combat
    const inCombat = state.foxPacks.some(fox => 
        fox.lane === flock.lane && 
        Math.abs(fox.position - flock.position) < 0.1
    );
    if (inCombat) return false;
    
    // Cannot switch while at obstacle
    const atObstacle = state.level.obstacles?.some(obs =>
        obs.lane === flock.lane &&
        Math.abs(obs.position - flock.position) < 0.1
    );
    if (atObstacle) return false;
    
    return true;
}

function getActiveFlock(state: GameState): Flock | undefined {
    // Return the frontmost alive flock
    return state.flocks
        .filter(f => f.alive && f.count > 0)
        .sort((a, b) => b.position - a.position)[0];
}
```

### Step 4: Update Rendering for Lane Switch Animation

**File:** `src/ui/Renderer.ts`

Add visual interpolation during lane switch:
```typescript
export function renderFlock(ctx: CanvasRenderingContext2D, flock: Flock, state: GameState): void {
    let x = getLaneX(flock.lane);
    
    // Interpolate X position during lane switch
    if (flock.targetLane !== undefined && flock.laneSwitchProgress !== undefined) {
        const targetX = getLaneX(flock.targetLane);
        const progress = easeInOutQuad(flock.laneSwitchProgress);
        x = lerp(x, targetX, progress);
    }
    
    const y = getPositionY(flock.position);
    
    // Draw flock at interpolated position
    drawChickenSprites(ctx, x, y, flock.count, flock.chickenTypeId);
}

// Easing function for smooth animation
function easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}
```

### Step 5: Add Visual Feedback

**File:** `src/ui/Renderer.ts`

Add lane indicators:
```typescript
export function renderLaneIndicators(ctx: CanvasRenderingContext2D, state: GameState): void {
    const activeFlock = getActiveFlock(state);
    if (!activeFlock) return;
    
    // Draw arrows on adjacent lanes to indicate switch possibility
    if (canSwitchLane(activeFlock, state)) {
        const leftLane = activeFlock.lane - 1;
        const rightLane = activeFlock.lane + 1;
        
        ctx.globalAlpha = 0.3;
        
        if (leftLane >= 0) {
            drawArrow(ctx, getLaneX(leftLane), 100, 'left');
        }
        if (rightLane < state.level.lanes) {
            drawArrow(ctx, getLaneX(rightLane), 100, 'right');
        }
        
        ctx.globalAlpha = 1;
    }
}

function drawArrow(ctx: CanvasRenderingContext2D, x: number, y: number, direction: 'left' | 'right'): void {
    ctx.save();
    ctx.translate(x, y);
    if (direction === 'left') ctx.scale(-1, 1);
    
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(0, -15);
    ctx.lineTo(0, 15);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    
    ctx.restore();
}
```

### Step 6: Update Collision Detection for Lane Switching

**File:** `src/core/Collision.ts`

Handle collisions during lane switch (use current interpolated lane):
```typescript
export function checkCollisions(state: GameState): void {
    for (const flock of state.flocks) {
        // Use effective lane for collision (interpolated position)
        let effectiveLane = flock.lane;
        
        if (flock.targetLane !== undefined && flock.laneSwitchProgress !== undefined) {
            // During switch, check collisions on both lanes
            effectiveLane = flock.laneSwitchProgress < 0.5 ? flock.lane : flock.targetLane;
        }
        
        // Check gates on effective lane
        checkGateCollision(flock, state.level.gates, effectiveLane);
        
        // Check obstacles on effective lane
        checkObstacleCollision(flock, state.level.obstacles, effectiveLane);
        
        // Check foxes on effective lane
        checkFoxCollision(flock, state.foxPacks, effectiveLane);
    }
}
```

---

## Testing Plan

### Unit Tests

**File:** `src/__tests__/lane-switch.test.ts`

```typescript
describe('Lane Switching', () => {
    it('switches flock to adjacent lane on swipe', () => {
        const state = createTestState({ laneSwitchEnabled: true });
        state.flocks.push({ id: 1, count: 10, lane: 1, position: 0.5, alive: true });
        
        const input = { swipe: { direction: 'left', magnitude: 100 } };
        processLaneSwitch(state, input, 1/60);
        
        expect(state.flocks[0].targetLane).toBe(0);
    });
    
    it('does not switch when cooldown active', () => {
        const state = createTestState({ laneSwitchEnabled: true });
        state.flocks.push({ 
            id: 1, count: 10, lane: 1, position: 0.5, alive: true,
            laneSwitchCooldown: 0.3
        });
        
        const input = { swipe: { direction: 'left', magnitude: 100 } };
        processLaneSwitch(state, input, 1/60);
        
        expect(state.flocks[0].targetLane).toBeUndefined();
    });
    
    it('does not switch when in combat', () => {
        const state = createTestState({ laneSwitchEnabled: true });
        state.flocks.push({ id: 1, count: 10, lane: 0, position: 0.5, alive: true });
        state.foxPacks.push({ id: 1, count: 5, lane: 0, position: 0.5, alive: true });
        
        const input = { swipe: { direction: 'right', magnitude: 100 } };
        processLaneSwitch(state, input, 1/60);
        
        expect(state.flocks[0].targetLane).toBeUndefined();
    });
    
    it('completes lane switch after animation duration', () => {
        const state = createTestState({ laneSwitchEnabled: true });
        state.flocks.push({ 
            id: 1, count: 10, lane: 0, position: 0.5, alive: true,
            targetLane: 1, laneSwitchProgress: 0.9
        });
        
        processLaneSwitch(state, { swipe: null }, 0.2);
        
        expect(state.flocks[0].lane).toBe(1);
        expect(state.flocks[0].targetLane).toBeUndefined();
    });
    
    it('does not switch to invalid lane', () => {
        const state = createTestState({ laneSwitchEnabled: true, lanes: 3 });
        state.flocks.push({ id: 1, count: 10, lane: 0, position: 0.5, alive: true });
        
        const input = { swipe: { direction: 'left', magnitude: 100 } };
        processLaneSwitch(state, input, 1/60);
        
        expect(state.flocks[0].targetLane).toBeUndefined();
    });
});
```

### Manual Testing

1. Load game, fire chickens
2. Swipe left/right to switch lanes
3. Verify smooth animation
4. Test keyboard arrows (left/right)
5. Verify cannot switch during combat
6. Verify cooldown prevents spam
7. Test edge lanes (cannot switch outside bounds)

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Swipe on leftmost lane left | No switch (lane -1 invalid) |
| Swipe on rightmost lane right | No switch (lane +1 invalid) |
| Switch during combat | Blocked until combat ends |
| Switch during gate collision | Blocked until past gate |
| Rapid swipes | Cooldown prevents spam |
| Multiple flocks | Only frontmost active flock can switch |

---

## Balance Considerations

| Parameter | Value | Reasoning |
|-----------|-------|-----------|
| Switch cooldown | 0.5s | Prevents spam, allows reaction |
| Animation duration | 0.3s | Fast enough to feel responsive |
| Combat lockout | Yes | Prevents escape from fights |
| Gate lockout | Yes | Prevents gate skipping |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/data/types.ts` | Add targetLane, laneSwitchProgress, laneSwitchCooldown to Flock |
| `src/platform/Input.ts` | Add swipe detection, keyboard support |
| `src/core/Simulation.ts` | Add processLaneSwitch function |
| `src/ui/Renderer.ts` | Interpolate position during switch, add lane indicators |
| `src/core/Collision.ts` | Handle collisions during lane switch |

---

## Estimated Effort

- **Implementation:** 3-4 hours
- **Testing:** 1-2 hours
- **Polish:** 1 hour

**Total:** 5-7 hours

---

## Status

- [ ] Add lane switch state to Flock type
- [ ] Implement swipe detection in Input.ts
- [ ] Add keyboard support (arrow keys)
- [ ] Process lane switch in Simulation.ts
- [ ] Add visual animation in Renderer.ts
- [ ] Add lane indicators
- [ ] Update collision handling
- [ ] Write unit tests
- [ ] Manual testing
- [ ] Balance tuning

---

*Created: 2026-03-04*
