# AI Coding Agent Guidelines

This document provides essential context for AI coding agents working in the Chicken Mob codebase.

---

## Project Overview

Chicken Mob is a lane-based crowd game built with TypeScript, Vite, and Canvas 2D. Players launch chicken flocks from barn cannons through multiplier gates to overwhelm fox defenses.

**Key Architectural Decision:** Uses count-based aggregate mobs (`Flock`, `FoxPack`) instead of individual units for O(1) gate operations and bounded rendering.

---

## Build & Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server on port 3000
npm run build        # Production build (outputs to dist/)
npm run preview      # Preview production build
npm test             # Run all tests once (vitest run)
npm run test:watch   # Run tests in watch mode
```

### Running a Single Test

```bash
# Run specific test file
npx vitest run src/__tests__/game.test.ts

# Run tests matching a pattern
npx vitest run -t "Combat System"

# Run single test case by name
npx vitest run -t "chickens win when they have more power"
```

---

## TypeScript Configuration

- **Target:** ES2020
- **Strict mode:** Enabled
- **Key strict flags:** `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- **Path alias:** `@/*` maps to `./src/*`

Always use `import type { ... }` for type-only imports to satisfy `noUnusedLocals`.

---

## Code Style Guidelines

### Imports

```typescript
// Type-only imports first (use "import type")
import type { GameState, Flock, FoxPack } from '@/data/types';

// Runtime imports second
import { getChicken } from '@/data/chickens';
import { getFox } from '@/data/foxes';
```

- Use `@/` path alias for imports from `src/`
- Group imports: type imports first, then runtime imports
- Prefer named exports over default exports

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Types/Interfaces | PascalCase | `GameState`, `Flock`, `ChickenType` |
| Functions | camelCase | `simulationTick`, `resolveCombat` |
| Variables | camelCase | `flockCount`, `elapsedTime` |
| Constants | camelCase or SCREAMING_SNAKE | `TOTAL_LEVELS`, `defaultState` |
| Files | PascalCase.ts | `Simulation.ts`, `GameLoop.ts` |
| Test files | lowercase.test.ts | `game.test.ts` |

### Formatting

- **Indent:** 4 spaces (no tabs)
- **Semicolons:** Required
- **Quotes:** Single quotes for strings, double quotes only when necessary
- **Trailing commas:** None in type definitions, use in multi-line arrays/objects
- **Max line length:** 100 characters (soft limit)

### Comments

```typescript
/**
 * Module-level JSDoc header describing purpose.
 * May include multiple lines of explanation.
 */

// ── Section Headers ──
// Use section headers to organize long functions

// Inline comments: use sparingly, prefer self-documenting code
```

- **DO NOT** add comments within code blocks unless absolutely necessary
- Prefer clear variable/function names over comments
- Use JSDoc headers for modules and complex functions
- Use `// ── Section Name ──` dividers to organize large files

### Functions

```typescript
// Prefer small, focused functions
export function applyGateMultiplier(count: number, gate: GateDefinition): number {
    if (gate.multiplier === 0) return 0;
    return Math.floor(count * gate.multiplier);
}

// Use early returns for guard clauses
function processFlock(flock: Flock): void {
    if (!flock.alive || flock.count <= 0) return;
    // ... main logic
}
```

### Error Handling

```typescript
// Throw for programmer errors (invalid data, missing definitions)
export function getCannon(id: string): BarnCannonDefinition {
    const cannon = CANNONS.find(c => c.id === id);
    if (!cannon) {
        throw new Error(`Unknown cannon id: ${id}`);
    }
    return cannon;
}

// Return null/undefined for expected failure cases
function findFlock(id: number): Flock | undefined {
    return state.flocks.find(f => f.id === id);
}
```

---

## Project Structure

```
src/
├── main.ts               # Entry point, initialization
├── core/                 # Game engine: loop, simulation, collision
│   ├── GameLoop.ts       # Fixed-timestep loop (60Hz)
│   ├── Simulation.ts     # Per-tick update orchestrator
│   ├── Collision.ts      # Collision detection
│   └── Lane.ts           # Lane geometry utilities
├── systems/              # Game systems (stateless functions)
│   ├── CombatSystem.ts   # Combat resolution
│   ├── GateSystem.ts     # Gate multiplier logic
│   ├── SpawningSystem.ts # Enemy spawn handling
│   ├── UpgradeSystem.ts  # Upgrade calculations
│   └── OfflineSystem.ts  # Offline earnings
├── data/                 # Type definitions and game data
│   ├── types.ts          # All TypeScript interfaces/types
│   ├── chickens.ts       # Chicken type definitions
│   ├── foxes.ts          # Fox enemy definitions
│   ├── cannons.ts        # Barn cannon definitions
│   ├── levels.ts         # Level definitions
│   └── upgrades.ts       # Upgrade definitions
├── ui/                   # Rendering and UI components
│   ├── Renderer.ts       # Canvas 2D renderer
│   ├── HUD.ts            # In-game HUD overlay
│   ├── MenuScreen.ts     # Main menu
│   ├── UpgradeScreen.ts  # Upgrade shop UI
│   ├── OfflinePopup.ts   # Offline earnings popup
│   ├── Modal.ts          # Reusable modal component
│   └── styles.ts         # Design tokens (COLORS, SPACING, etc.)
├── platform/             # Platform abstractions
│   ├── Input.ts          # Touch/mouse input, haptic feedback
│   ├── Audio.ts          # Web Audio API wrapper
│   └── Persistence.ts    # localStorage save/load
├── constants/            # Centralized game constants
│   └── game.ts           # COLLISION_THRESHOLD, MAX_VISIBLE, etc.
├── utils/                # Shared utilities
│   └── format.ts         # Number formatting helpers
└── __tests__/            # Unit test files (Vitest)
    └── game.test.ts      # Core game tests
tests/                    # E2E tests (Playwright)
└── app.spec.ts           # Menu and gameplay tests
```

---

## Testing Conventions

### Test File Location

- Tests live in `src/__tests__/*.test.ts`
- Pattern: `src/**/*.test.ts`

### Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import { functionUnderTest } from '../path/to/module';

describe('System or Module Name', () => {
    it('describes expected behavior', () => {
        // Arrange
        const input = createTestInput();
        
        // Act
        const result = functionUnderTest(input);
        
        // Assert
        expect(result).toBe(expected);
    });
});
```

### Test Naming

- Test descriptions should read as statements of behavior
- Use `it('does X when Y')` format
- Group related tests in `describe` blocks

---

## Design Tokens

UI components use centralized design tokens from `src/ui/styles.ts`:

```typescript
import { COLORS, SPACING, RADIUS, SHADOWS, TRANSITIONS } from '@/ui/styles';

// Example usage
element.style.cssText = `
  color: ${COLORS.uiText};
  padding: ${SPACING.md}px;
  border-radius: ${RADIUS.md}px;
  box-shadow: ${SHADOWS.md};
  transition: transform ${TRANSITIONS.fast};
`;
```

Available tokens:
- `COLORS` — Primary, secondary, background, UI colors
- `SPACING` — `xs: 4`, `sm: 8`, `md: 12`, `lg: 16`, `xl: 24`
- `RADIUS` — `sm: 6`, `md: 10`, `lg: 16`
- `SHADOWS` — `sm`, `md`, `glow` (pre-defined shadow strings)
- `TRANSITIONS` — `fast`, `normal`, `smooth` (timing strings)

---

## Platform Utilities

### Haptic Feedback

Mobile devices support vibration for tactile feedback:

```typescript
import { hapticFeedback, HAPTIC } from '@/platform/Input';

// Single vibration
hapticFeedback(HAPTIC.medium);

// Pattern: vibrate, pause, vibrate
hapticFeedback(HAPTIC.fire);  // [10, 30, 10]
```

Available patterns:
- `HAPTIC.light` — 10ms
- `HAPTIC.medium` — 25ms
- `HAPTIC.heavy` — 50ms
- `HAPTIC.fire` — Pattern for cannon fire
- `HAPTIC.win` — Celebratory pattern
- `HAPTIC.lose` — Defeat pattern

---

## Key Patterns

### Count-Based Mob System

Mobs are represented as aggregate objects:

```typescript
interface Flock {
    id: number;
    chickenTypeId: string;
    count: number;      // NOT individual entities
    lane: number;
    position: number;   // 0..1 normalized along lane
    speed: number;
    alive: boolean;
}
```

- Gate operations: `flock.count = Math.floor(flock.count * gate.multiplier)`
- Combat: resolve based on aggregate power, not individual units
- Rendering: draw `min(count, 50)` sprites with count badge

### Fixed-Timestep Game Loop

```typescript
const FIXED_TIMESTEP = 1000 / 60; // 60Hz
let accumulator = 0;

function frame(timestamp: number) {
    const dt = timestamp - lastTime;
    accumulator += dt;
    
    while (accumulator >= FIXED_TIMESTEP) {
        simulationTick(state, FIXED_TIMESTEP / 1000);
        accumulator -= FIXED_TIMESTEP;
    }
    
    render(state, accumulator / FIXED_TIMESTEP);
    requestAnimationFrame(frame);
}
```

### Stateless System Functions

Systems are pure functions that operate on state:

```typescript
// Good: stateless function
export function resolveCombat(
    chickenCount: number,
    chicken: ChickenType,
    foxCount: number,
    fox: FoxMobType
): CombatResult { ... }

// Bad: class with mutable state
class CombatSystem {
    resolve(...) { ... }  // Avoid
}
```

---

## Validation Checklist

Before submitting changes, run:

```bash
npm run build    # Must succeed with no errors
npm test         # All unit tests must pass
npx playwright test  # E2E tests (optional, requires dev server)
```

TypeScript strict mode catches most issues at compile time. Fix all warnings before committing.
