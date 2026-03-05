# Enemy Spawn Gates Implementation Plan

## Overview

Add red multiplier gates that spawn enemy foxes instead of multiplying chickens. This matches Mob Control's enemy gate mechanic and creates more strategic gameplay.

## Feature Description

- Red gates appear alongside green multiplier gates
- When chickens pass through a red gate, foxes spawn based on: `chicken_count * gate_multiplier`
- Visual: Red/orange gate with skull or fox icon, particle effects when spawning
- Balance: Higher multipliers spawn more foxes, creating risk/reward decisions

---

## Implementation Steps

### Step 1: Define Gate Types in types.ts

**File:** `src/data/types.ts`

```typescript
// Add to GateDefinition interface
export interface GateDefinition {
    id: string;
    multiplier: number;
    width: number;
    type: 'multiply' | 'enemy_spawn';  // NEW: gate type
    spawnEnemyType?: string;            // NEW: enemy type to spawn (e.g., 'fox_normal')
}

// Add to types
export type GateType = 'multiply' | 'enemy_spawn';
```

### Step 2: Add Enemy Spawn Gates to Levels

**File:** `src/data/levels.ts`

Example gate definition:
```typescript
{
    id: 'enemy_2x',
    multiplier: 2,
    width: 0.15,
    type: 'enemy_spawn',
    spawnEnemyType: 'fox_normal'
}
```

Add to selected levels (start with levels 5, 8, 11, 14):
- Level 5: One 1x enemy gate (tutorial)
- Level 8: One 2x enemy gate
- Level 11: Two 1x enemy gates
- Level 14: One 3x enemy gate + one 2x enemy gate

### Step 3: Update Gate Processing in Simulation

**File:** `src/core/Simulation.ts`

Locate the gate collision handling (around line 120-140 in `checkGateCollision` or similar function).

Add enemy spawning logic:
```typescript
function processGateCollision(flock: Flock, gate: GateDefinition, state: GameState): void {
    if (gate.type === 'enemy_spawn') {
        // Calculate fox count to spawn
        const foxCount = Math.floor(flock.count * gate.multiplier);
        
        if (foxCount > 0) {
            // Create fox pack
            const foxPack: FoxPack = {
                id: generateId(),
                foxTypeId: gate.spawnEnemyType || 'fox_normal',
                count: foxCount,
                lane: flock.lane,
                position: gate.position + 0.05, // Spawn just past gate
                speed: getFox(gate.spawnEnemyType || 'fox_normal').speed,
                alive: true
            };
            state.foxPacks.push(foxPack);
            
            // Visual feedback: spawn particles
            spawnEnemySpawnParticles(state, gate.position, flock.lane, foxCount);
        }
        
        // Don't modify flock count (chickens continue through)
    } else {
        // Existing multiply logic
        flock.count = Math.floor(flock.count * gate.multiplier);
    }
}
```

### Step 4: Add Visual Rendering for Enemy Gates

**File:** `src/ui/Renderer.ts`

Add rendering for enemy spawn gates:
```typescript
function drawGate(ctx: CanvasRenderingContext2D, gate: GateDefinition, laneY: number, x: number, width: number): void {
    const isEnemyGate = gate.type === 'enemy_spawn';
    
    // Gate color
    const color = isEnemyGate ? '#ff4444' : '#44ff44'; // Red for enemy, green for multiply
    
    // Draw gate frame
    ctx.fillStyle = color;
    ctx.fillRect(x - width/2, laneY - 30, width, 60);
    
    // Draw icon
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    
    if (isEnemyGate) {
        // Draw skull or fox face
        ctx.fillText('🦊', x, laneY + 8);
        // Draw multiplier below
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`${gate.multiplier}x`, x, laneY + 28);
    } else {
        ctx.fillText(`${gate.multiplier}x`, x, laneY + 8);
    }
    
    // Particle glow effect for enemy gates
    if (isEnemyGate) {
        drawEnemyGateGlow(ctx, x, laneY);
    }
}
```

### Step 5: Add Spawn Particle Effects

**File:** `src/core/Simulation.ts`

Add particle spawning function:
```typescript
function spawnEnemySpawnParticles(state: GameState, position: number, lane: number, count: number): void {
    const particleCount = Math.min(count * 2, 30); // Cap at 30 particles
    
    for (let i = 0; i < particleCount; i++) {
        state.particles.push({
            x: position * LANE_WIDTH + (Math.random() - 0.5) * 40,
            y: getLaneY(lane) + (Math.random() - 0.5) * 40,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 1,
            decay: 0.02 + Math.random() * 0.02,
            size: 4 + Math.random() * 4,
            color: '#ff6666' // Light red
        });
    }
}
```

### Step 6: Update Collision Detection

**File:** `src/core/Collision.ts`

Ensure gate collision handles both types:
```typescript
export function checkGateCollision(flock: Flock, gates: GateDefinition[], laneIndex: number): GateDefinition | null {
    for (const gate of gates) {
        if (gate.lane === laneIndex) {
            const gateX = gate.position;
            const flockX = flock.position;
            
            // Check if flock crossed the gate
            if (flockX >= gateX && flockX < gateX + 0.05) {
                return gate;
            }
        }
    }
    return null;
}
```

---

## Testing Plan

### Unit Tests

**File:** `src/__tests__/enemy-gates.test.ts`

```typescript
describe('Enemy Spawn Gates', () => {
    it('spawns foxes when chickens pass through enemy gate', () => {
        const state = createTestState();
        state.flocks.push({ id: 1, count: 10, lane: 0, position: 0.5 });
        state.level.gates = [{ type: 'enemy_spawn', multiplier: 2, lane: 0, position: 0.5 }];
        
        simulationTick(state, 1/60);
        
        expect(state.foxPacks.length).toBe(1);
        expect(state.foxPacks[0].count).toBe(20); // 10 * 2
    });
    
    it('does not modify chicken count when passing enemy gate', () => {
        const state = createTestState();
        state.flocks.push({ id: 1, count: 10, lane: 0, position: 0.5 });
        state.level.gates = [{ type: 'enemy_spawn', multiplier: 2, lane: 0, position: 0.5 }];
        
        simulationTick(state, 1/60);
        
        expect(state.flocks[0].count).toBe(10);
    });
    
    it('spawns correct enemy type from gate definition', () => {
        const state = createTestState();
        state.flocks.push({ id: 1, count: 5, lane: 0, position: 0.5 });
        state.level.gates = [{ 
            type: 'enemy_spawn', 
            multiplier: 1, 
            spawnEnemyType: 'fox_brute',
            lane: 0, 
            position: 0.5 
        }];
        
        simulationTick(state, 1/60);
        
        expect(state.foxPacks[0].foxTypeId).toBe('fox_brute');
    });
});
```

### Manual Testing

1. Load level with enemy gate
2. Fire chickens through enemy gate
3. Verify foxes spawn and attack chickens
4. Check particle effects appear
5. Verify game balance (not too hard/easy)

---

## Balance Considerations

| Gate Multiplier | Chickens Through | Foxes Spawned | Risk Level |
|-----------------|------------------|---------------|------------|
| 1x              | 10               | 10            | Low        |
| 2x              | 10               | 20            | Medium     |
| 3x              | 10               | 30            | High       |

**Recommendations:**
- Start with 1x enemy gates in early levels
- Use sparingly (1-2 per level max)
- Place near player spawn to create early decisions
- Avoid placing near fort (too punishing)

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/data/types.ts` | Add gate type, spawnEnemyType fields |
| `src/data/levels.ts` | Add enemy spawn gates to levels |
| `src/core/Simulation.ts` | Add enemy spawning logic, particles |
| `src/core/Collision.ts` | Ensure gate collision handles both types |
| `src/ui/Renderer.ts` | Render enemy gates with red color, icons |

---

## Estimated Effort

- **Implementation:** 2-3 hours
- **Testing:** 1 hour
- **Balancing:** 1-2 hours

**Total:** 4-6 hours

---

## Status

- [ ] Define gate types in types.ts
- [ ] Add enemy gates to levels
- [ ] Update gate processing logic
- [ ] Add visual rendering
- [ ] Add particle effects
- [ ] Write unit tests
- [ ] Manual testing
- [ ] Balance tuning

---

*Created: 2026-03-04*
