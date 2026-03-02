# Chicken Mob v0.2.2 Implementation Plan

## Feature 1: Real-time Score Display

### Overview
Display running chicken count during gameplay so players can see how many chickens have reached the fort in real-time.

### Files to Modify
- `src/data/types.ts` - Add score tracking fields (already partially done)
- `src/ui/Renderer.ts` - Add score display in drawHUD()
- `src/ui/HUD.ts` - Optional: add DOM-based score overlay

### Implementation Steps
1. **Check existing tracking** (lines 223-224 in types.ts):
   - `totalChickensFired` - already exists in GameState
   - `totalChickensReachedFort` - already exists in GameState

2. **Add current field chickens tracking** to GameState in types.ts:
   ```typescript
   // Add to GameState interface around line 225
   currentChickensOnField: number;  // chickens currently alive in lanes
   ```

3. **Update Simulation.ts** to track current field chickens:
   - In simulationTick(): Update `currentChickensOnField` after cleanup (line 171-173)
   - Count active chickens: `state.flocks.reduce((sum, f) => sum + (f.alive ? f.count : 0), 0)`

4. **Add score display to Renderer.ts drawHUD()** (line 436):
   - After drawing level name (line 444), add:
   ```typescript
   // Score display
   ctx.fillStyle = COLORS.corn;
   ctx.font = 'bold 14px monospace';
   ctx.textAlign = 'right';
   ctx.fillText(
       `🌽 ${state.totalChickensReachedFort}`,
       this.width - 10,
       8,
   );
   ```
   - Add `corn` to COLORS if not present (line 36 - already there)

5. **Optional**: Add in-game efficiency percentage:
   ```typescript
   const efficiency = state.totalChickensFired > 0 
       ? Math.round((state.totalChickensReachedFort / state.totalChickensFired) * 100)
       : 0;
   ctx.fillText(`${efficiency}%`, this.width - 10, 24);
   ```

### Code Patterns
- Follow existing HUD drawing in Renderer.ts:drawHUD() (lines 436-475)
- Use same positioning as level name (top-left) but align right
- Reuse existing `COLORS.corn` for consistency
- Use format helper from HUD.ts for large numbers

### Edge Cases
- Handle 0 chickens fired gracefully (show 0%, not NaN%)
- Large numbers should use formatting (1.2k, etc.) - can reuse HUD.format()
- Handle division by zero in efficiency calculation

### Complexity: Simple

---

## Feature 2: End-of-Level Summary

### Overview
Show detailed breakdown screen after level completes: deployed, remaining on field, efficiency %.

### Files to Modify
- `src/data/types.ts` - Add summary data structure
- `src/core/Simulation.ts` - Populate summary data on level end
- `src/ui/Renderer.ts` - Add summary overlay rendering
- `src/main.ts` - Pass summary data to renderer

### Implementation Steps
1. **Add LevelSummary type to types.ts** (around line 225):
   ```typescript
   export interface LevelSummary {
       deployed: number;           // total chickens fired
       reachedFort: number;        // chickens that damaged fort
       currentlyOnField: number;  // chickens still in lanes
       destroyed: number;         // chickens lost to foxes/traps/obstacles
       efficiency: number;         // percentage (0-100)
       timeElapsed: number;        // seconds
       stars: 1 | 2 | 3;
   }
   ```

2. **Add summary to GameState** (around line 225):
   ```typescript
   levelSummary?: LevelSummary;
   ```

3. **Create summary in Simulation.ts** - add new function:
   ```typescript
   export function generateLevelSummary(state: GameState): LevelSummary {
       const deployed = state.totalChickensFired;
       const reachedFort = state.totalChickensReachedFort;
       const onField = state.flocks.reduce((sum, f) => sum + (f.alive ? f.count : 0), 0);
       const destroyed = deployed - reachedFort - onField;
       const efficiency = deployed > 0 ? Math.round((reachedFort / deployed) * 100) : 0;
       
       return {
           deployed,
           reachedFort,
           currentlyOnField: onField,
           destroyed,
           efficiency,
           timeElapsed: state.elapsedTime,
           stars: calculateStars(state),
       };
   }
   ```

4. **Update main.ts onLevelEnd()** (line 173):
   ```typescript
   // Generate summary before clearing game state
   if (gameState.levelWon) {
       gameState.levelSummary = generateLevelSummary(gameState);
       // ... rest of win logic
   }
   ```

5. **Add summary overlay to Renderer.ts drawHUD()** (after line 446):
   ```typescript
   // End-of-level summary overlay
   if (state.levelComplete && state.levelSummary) {
       const s = state.levelSummary;
       const boxW = 280;
       const boxH = 200;
       const boxX = (this.width - boxW) / 2;
       const boxY = (this.height - boxH) / 2 - 30;
       
       // Semi-transparent background
       ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
       ctx.fillRect(boxX, boxY, boxW, boxH);
       
       // Border
       ctx.strokeStyle = state.levelWon ? '#22c55e' : '#ef4444';
       ctx.lineWidth = 3;
       ctx.strokeRect(boxX, boxY, boxW, boxH);
       
       // Title
       ctx.fillStyle = state.levelWon ? '#22c55e' : '#ef4444';
       ctx.font = 'bold 20px monospace';
       ctx.textAlign = 'center';
       ctx.fillText(state.levelWon ? 'LEVEL COMPLETE' : 'LEVEL FAILED', this.width / 2, boxY + 30);
       
       // Stars
       if (state.levelWon) {
           ctx.fillStyle = '#fbbf24';
           ctx.font = '24px monospace';
           ctx.fillText('★'.repeat(s.stars), this.width / 2, boxY + 60);
       }
       
       // Stats
       ctx.fillStyle = '#e5e7eb';
       ctx.font = '14px monospace';
       ctx.textAlign = 'left';
       const statsX = boxX + 20;
       let statsY = boxY + 90;
       
       ctx.fillText(`Deployed:  ${s.deployed}`, statsX, statsY);
       ctx.fillText(`Reached:   ${s.reachedFort}`, statsX, statsY + 20);
       ctx.fillText(`On Field:  ${s.currentlyOnField}`, statsX, statsY + 40);
       ctx.fillText(`Lost:      ${s.destroyed}`, statsX, statsY + 60);
       
       // Efficiency bar
       const barW = boxW - 40;
       const barH = 16;
       const barX = statsX;
       const barY = statsY + 85;
       
       ctx.fillStyle = '#374151';
       ctx.fillRect(barX, barY, barW, barH);
       
       const effColor = s.efficiency >= 80 ? '#22c55e' : s.efficiency >= 50 ? '#fbbf24' : '#ef4444';
       ctx.fillStyle = effColor;
       ctx.fillRect(barX, barY, barW * (s.efficiency / 100), barH);
       
       ctx.fillStyle = '#fff';
       ctx.font = 'bold 12px monospace';
       ctx.textAlign = 'center';
       ctx.fillText(`${s.efficiency}% Efficiency`, boxX + boxW / 2, barY + 12);
       
       // Time
       ctx.fillStyle = '#9ca3af';
       ctx.font = '12px monospace';
       ctx.fillText(`Time: ${s.timeElapsed.toFixed(1)}s`, boxX + boxW / 2, boxY + boxH - 15);
       
       // Continue prompt
       ctx.fillStyle = '#6b7280';
       ctx.font = '12px monospace';
       ctx.fillText('Tap to continue', boxX + boxW / 2, boxY + boxH - 2);
   }
   ```

### Code Patterns
- Follow existing victory/defeat overlay in drawHUD() (lines 447-474)
- Use same box styling pattern
- Reuse `calculateStars()` from Simulation.ts
- Mirror the existing menu UI aesthetic

### Edge Cases
- Handle case where no chickens were fired (0% efficiency)
- Ensure summary displays even when level is failed (not won)
- Handle large numbers in display (use formatting)
- Prevent summary from showing during gameplay

### Complexity: Medium

---

## Feature 3: Enemy Spawn Gates

### Overview
Add red gates (like Mob Control) that spawn foxes continuously while chickens pass through them. This creates dynamic combat zones rather than single-wave spawns.

### Files to Modify
- `src/data/types.ts` - Add gate type enum and spawn gate definition
- `src/data/levels.ts` - Add spawn gates to appropriate levels
- `src/core/Simulation.ts` - Add spawn logic in gate pass-through
- `src/ui/Renderer.ts` - Visual distinction for spawn gates

### Implementation Steps

1. **Extend GateDefinition in types.ts** (lines 39-47):
   ```typescript
   export type GateType = 'multiplier' | 'spawner';  // Add this
   
   export interface GateDefinition {
       id: string;
       position: number;
       lane: number;
       x?: number;
       width: number;
       multiplier: number;
       isPositive: boolean;
       type?: GateType;  // Add optional type field
       // Spawn gate specific:
       spawnInterval?: number;  // seconds between spawns
       spawnCount?: number;     // foxes per spawn
       spawnTypeId?: string;    // which fox to spawn
   }
   ```

2. **Add SpawnGate collision type to Collision.ts** (new function):
   ```typescript
   // New function to detect when flock is in spawn gate zone
   export function detectFlockInSpawnGate(
       flocks: Flock[],
       gates: LiveGate[],
   ): { flock: Flock; gate: LiveGate }[] {
       const results = [];
       for (const flock of flocks) {
           if (!flock.alive || flock.count <= 0 || flock.x === undefined) continue;
           for (const gate of gates) {
               if (gate.definition.type !== 'spawner') continue;
               if (gate.definition.spawnInterval === undefined) continue;
               
               const gateX = gate.definition.x ?? 0.5;
               const gateWidth = gate.definition.width ?? 0.06;
               if (!isXOverlap(flock.x, gateX, gateWidth)) continue;
               
               // Check if flock is in the gate's spawn zone
               const gatePos = gate.definition.position;
               if (Math.abs(flock.position - gatePos) < 0.05) {
                   results.push({ flock, gate });
               }
           }
       }
       return results;
   }
   ```

3. **Add spawn tracking to LiveGate** (types.ts line 191):
   ```typescript
   export interface LiveGate {
       id: number;
       definition: GateDefinition;
       triggered: boolean;
       lastSpawnTime?: number;   // Track last spawn for spawner gates
       activeFlockCount?: number; // Track chickens currently in gate
   }
   ```

4. **Update Simulation.ts gate pass-through** (lines 52-83):
   After the existing gate multiplier logic, add spawn gate handling:
   ```typescript
   // Handle spawn gates
   for (const gate of state.gates) {
       if (gate.definition.type !== 'spawner') continue;
       
       for (const flock of state.flocks) {
           if (!flock.alive || flock.count <= 0 || flock.x === undefined) continue;
           
           const gateX = gate.definition.x ?? 0.5;
           const gateWidth = gate.definition.width ?? 0.06;
           if (Math.abs(flock.x - gateX) >= gateWidth / 2) continue;
           
           const gatePos = gate.definition.position;
           // Check if flock is near gate position
           if (Math.abs(flock.position - gatePos) < 0.08) {
               // Spawn foxes while chickens are in gate zone
               const interval = gate.definition.spawnInterval ?? 1.0;
               const now = state.elapsedTime;
               
               if (!gate.lastSpawnTime || now - gate.lastSpawnTime >= interval) {
                   spawnFoxFromGate(state, gate, flock.lane);
                   gate.lastSpawnTime = now;
               }
           }
       }
   }
   ```

5. **Add spawnFoxFromGate function** (new function in Simulation.ts):
   ```typescript
   function spawnFoxFromGate(state: GameState, gate: LiveGate, lane: number): void {
       const foxTypeId = gate.definition.spawnTypeId ?? 'fox_scout';
       const count = gate.definition.spawnCount ?? 3;
       const foxType = getFox(foxTypeId);
       
       const pack: FoxPack = {
           id: state.nextEntityId++,
           foxTypeId,
           count,
           lane,
           x: gate.definition.x,
           position: 0.95, // Spawn near fort, move toward cannon
           speed: foxType.moveSpeed,
           alive: true,
       };
       state.foxPacks.push(pack);
   }
   ```

6. **Update Renderer.ts drawGate()** (line 152):
   Add visual distinction for spawn gates:
   ```typescript
   private drawGate(gate: LiveGate, geo: LaneGeometry): void {
       const def = gate.definition;
       
       // Different visual for spawn gates
       if (def.type === 'spawner') {
           this.drawSpawnGate(gate, geo);
           return;
       }
       // ... existing multiplier gate drawing
   }
   
   private drawSpawnGate(gate: LiveGate, geo: LaneGeometry): void {
       const ctx = this.ctx;
       const def = gate.definition;
       const x = def.x !== undefined ? def.x * this.width : laneX(geo, def.lane);
       const y = positionToY(geo, def.position);
       const w = (def.width ?? 0.08) * this.width;
       const h = 28;
       
       // Red portal appearance for spawn gates
       ctx.fillStyle = '#dc2626'; // red-600
       ctx.globalAlpha = 0.7;
       // ... rounded rect drawing similar to existing
       
       // Skull icon for spawn
       ctx.fillStyle = '#fff';
       ctx.font = 'bold 16px monospace';
       ctx.textAlign = 'center';
       ctx.fillText('💀', x, y);
       
       // Spawn indicator
       ctx.font = '10px monospace';
       ctx.fillText(`${def.spawnCount}x`, x + w/2 - 10, y);
   }
   ```

7. **Update levels.ts** - Add spawn gates to advanced levels:
   ```typescript
   // Example: Add to level 12
   {
       id: 'level_12',
       // ... existing gates
       gates: [
           // ... existing
           { 
               id: 'g4', 
               position: 0.55, 
               lane: 0, 
               x: 0.5, 
               width: 0.1, 
               multiplier: 1, 
               isPositive: true,
               type: 'spawner',
               spawnInterval: 2.0,
               spawnCount: 3,
               spawnTypeId: 'fox_scout',
           },
       ],
   }
   ```

### Code Patterns
- Follow existing GateDefinition structure
- Reuse LiveGate interface for state tracking
- Follow existing fox pack spawning pattern from enemy spawn schedule (lines 140-155)
- Use similar renderer drawing pattern for gates
- Reuse collision detection approach from multiplier gates

### Edge Cases
- Handle spawn gates with no spawn interval defined (use default 1s)
- Prevent infinite spawning if flock stays in gate too long (add max spawn cap per gate)
- Handle spawn gates at lane edges (ensure foxes spawn in valid position)
- Handle multiple flocks in same spawn gate (only spawn once per interval)

### Complexity: Medium-Hard

---

## Feature 4: Lane-Switching

### Overview
Allow players to switch flocks between lanes mid-run by tapping/swiping on a flock. This adds strategic depth similar to Mob Control.

### Files to Modify
- `src/data/types.ts` - Add lane switch tracking to Flock
- `src/core/Simulation.ts` - Add lane switch handling
- `src/core/Collision.ts` - Update collision for switched flocks
- `src/platform/Input.ts` - Add tap/drag detection for lane switching
- `src/ui/Renderer.ts` - Add visual feedback for lane-switchable flocks
- `src/main.ts` - Wire up lane switch input

### Implementation Steps

1. **Add lane-switch properties to Flock in types.ts** (line 158):
   ```typescript
   export interface Flock {
       id: number;
       chickenTypeId: string;
       count: number;
       lane: number;
       x?: number;
       position: number;
       speed: number;
       alive: boolean;
       canSwitchLane?: boolean;    // Whether this flock can switch lanes
       lastLaneSwitchTime?: number; // Cooldown tracking
   }
   ```

2. **Add GameState field for lane switch** (around line 225):
   ```typescript
   laneSwitchCooldown: number;  // seconds between lane switches
   ```

3. **Create LaneSwitchSystem** - new file `src/systems/LaneSwitchSystem.ts`:
   ```typescript
   import type { GameState, Flock } from '@/data/types';
   
   const LANE_SWITCH_COOLDOWN = 0.5; // seconds between switches
   const LANE_SWITCH_DURATION = 0.3;  // seconds to complete switch
   const LANE_SWITCH_SPEED = 400;     // pixels per second lateral movement
   
   export interface LaneSwitchRequest {
       flockId: number;
       targetLane: number;
   }
   
   /**
    * Process a lane switch request from input
    */
   export function requestLaneSwitch(
       state: GameState,
       flockId: number,
       targetLane: number,
   ): boolean {
       const flock = state.flocks.find(f => f.id === flockId);
       if (!flock || !flock.alive || flock.count <= 0) return false;
       if (flock.lane === targetLane) return false;
       if (targetLane < 0 || targetLane >= state.level.laneCount) return false;
       
       // Check cooldown
       const now = state.elapsedTime;
       if (flock.lastLaneSwitchTime !== undefined) {
           if (now - flock.lastLaneSwitchTime < LANE_SWITCH_COOLDOWN) return false;
       }
       
       // Initiate switch - update x to start moving to new lane
       const laneWidth = 1 / state.level.laneCount;
       const currentLaneCenter = (flock.lane + 0.5) * laneWidth;
       const targetLaneCenter = (targetLane + 0.5) * laneWidth;
       
       // Start the switch by setting up interpolation
       flock.x = currentLaneCenter;
       flock.lane = targetLane;
       flock.canSwitchLane = false; // Disable until switch completes
       flock.lastLaneSwitchTime = now;
       
       return true;
   }
   
   /**
    * Update lane-switching flocks (smooth transition)
    * Call this in simulationTick
    */
   export function updateLaneSwitches(state: GameState, dt: number): void {
       const laneWidth = 1 / state.level.laneCount;
       const switchSpeed = LANE_SWITCH_SPEED / state.level.length * dt;
       
       for (const flock of state.flocks) {
           if (!flock.alive || flock.count <= 0) continue;
           
           const targetX = (flock.lane + 0.5) * laneWidth;
           
           if (flock.x !== undefined && Math.abs(flock.x - targetX) > 0.01) {
               // Move toward target lane
               if (flock.x < targetX) {
                   flock.x = Math.min(targetX, flock.x + switchSpeed);
               } else {
                   flock.x = Math.max(targetX, flock.x - switchSpeed);
               }
           } else {
               // Switch complete - re-enable switching
               flock.x = targetX;
               flock.canSwitchLane = true;
           }
       }
   }
   ```

4. **Update Simulation.ts** - Add lane switch update call:
   - Import `updateLaneSwitches` from LaneSwitchSystem
   - Call in simulationTick() after moving flocks (around line 40):
   ```typescript
   // After moving flocks
   updateLaneSwitches(state, dt);
   ```

5. **Update Input.ts** - Add lane switch detection:
   ```typescript
   // Add to InputState
   laneSwitchRequest?: { flockId: number; targetLane: number };
   
   // Add detection in handleInput or new method
   detectLaneSwitchTap(
       canvasWidth: number,
       canvasHeight: number,
       touchX: number,
       touchY: number,
       gameState: GameState,
   ): { flockId: number; targetLane: number } | null {
       // Convert touch to game coordinates
       // Check if tap is on a flock
       // Determine target lane from tap position
       return null;
   }
   ```

6. **Update main.ts** - Wire up lane switch input:
   In the update loop (line 72), add:
   ```typescript
   // Handle lane switching
   if (inputState.laneSwitchRequest && gameState) {
       const request = inputState.laneSwitchRequest;
       requestLaneSwitch(gameState, request.flockId, request.targetLane);
   }
   ```

7. **Update Renderer.ts** - Add visual feedback:
   In drawFlock() (around line 207), add indicator:
   ```typescript
   // Draw lane switch indicator for flocks that can switch
   if (flock.canSwitchLane && flock.count > 0) {
       ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
       ctx.font = '10px monospace';
       ctx.textAlign = 'center';
       ctx.fillText('↔', cx, cy + 25);
   }
   ```

8. **Update Collision.ts** - Handle lane-switching flocks:
   In detectFlockVsFox() and detectFlockVsObstacle(), the collision already uses flock.x, so it should work automatically once x is updated.

### Code Patterns
- Follow existing Flock structure and patterns
- Reuse speed/position update pattern from Simulation.ts
- Use similar visual feedback pattern to existing badges
- Follow Input.ts patterns for touch handling

### Edge Cases
- Prevent switching to invalid lanes (out of bounds)
- Handle cooldown to prevent spam switching
- Handle switching during combat (can be risky for player)
- Prevent switching when flock is at fort or cannon edge
- Handle multiple lanes (3+ lanes properly)
- Prevent switching during gate pass-through (avoid physics issues)

### Complexity: Hard

---

## Implementation Priority & Dependencies

| Feature | Complexity | Dependencies | Priority |
|---------|------------|--------------|----------|
| Real-time Score | Simple | None | 1 |
| End-of-Level Summary | Medium | Score tracking | 2 |
| Enemy Spawn Gates | Medium-Hard | None | 3 |
| Lane-Switching | Hard | None | 4 |

## Testing Recommendations

1. **Real-time Score**:
   - Test with 0 chickens fired
   - Test with large numbers (formatting)
   - Test efficiency calculation edge cases

2. **End-of-Level Summary**:
   - Test victory with all chickens reached
   - Test defeat with all chickens lost
   - Test display on various screen sizes

3. **Enemy Spawn Gates**:
   - Test spawn rate limiting
   - Test multiple flocks in same gate
   - Test performance with many spawns

4. **Lane-Switching**:
   - Test switching from edge lanes
   - Test rapid switching (cooldown)
   - Test switching during fox collision
