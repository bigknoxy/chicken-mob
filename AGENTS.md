# AI Coding Agent Guidelines

Essential context for AI coding agents working in the Chicken Mob codebase.

---

## When Encountering Issues

**Read `tasks/lessons.md`** for documented failure modes, detection signals, and prevention rules. Add new entries when you discover novel issues.

---

## Project Overview

Chicken Mob is a lane-based crowd game built with TypeScript, Vite, and Canvas 2D. Players launch chicken flocks from barn cannons through multiplier gates to overwhelm fox defenses.

**Key Architecture:** Uses count-based aggregate mobs (`Flock`, `FoxPack`) instead of individual units for O(1) gate operations and bounded rendering.

---

## Build & Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (port 3000+)
npm run build        # Production build → dist/
npm test             # Run all tests (vitest run)
npm run test:watch   # Watch mode

# Run single test file
npx vitest run src/__tests__/game.test.ts

# Run tests matching pattern
npx vitest run -t "Combat System"
npx vitest run -t "chickens win when they have more power"

# E2E tests (requires dev server running)
npx playwright test
```

---

## TypeScript Configuration

- **Target:** ES2020 | **Strict mode:** Enabled
- **Key flags:** `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- **Path alias:** `@/*` → `./src/*`
- Always use `import type { ... }` for type-only imports

---

## Code Style

### Imports

```typescript
import type { GameState, Flock } from '@/data/types';  // Type imports first
import { getChicken } from '@/data/chickens';           // Runtime imports second
```

- Use `@/` path alias for `src/` imports
- Group: type imports first, then runtime imports
- Prefer named exports

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Types/Interfaces | PascalCase | `GameState`, `Flock` |
| Functions | camelCase | `simulationTick`, `resolveCombat` |
| Variables | camelCase | `flockCount`, `elapsedTime` |
| Constants | camelCase or SCREAMING_SNAKE | `TOTAL_LEVELS`, `defaultState` |
| Files | PascalCase.ts | `Simulation.ts`, `GameLoop.ts` |
| Test files | lowercase.test.ts | `game.test.ts` |

### Formatting

- **Indent:** 4 spaces | **Semicolons:** Required | **Quotes:** Single
- **Max line length:** 100 characters (soft limit)
- **DO NOT** add comments within code blocks unless absolutely necessary
- Use `// ── Section Name ──` dividers to organize large files

### Functions

- Prefer small, focused functions with early returns for guard clauses
- Use JSDoc headers for modules and complex functions only

### Error Handling

- **Throw** for programmer errors (invalid data, missing definitions)
- **Return null/undefined** for expected failure cases

---

## Project Structure

```
src/
├── main.ts               # Entry point
├── core/                 # Game engine (GameLoop, Simulation, Collision, Lane)
├── systems/              # Stateless game systems (Combat, Gate, Spawning, Upgrade, Offline)
├── data/                 # Types and game data definitions
├── ui/                   # Rendering and UI (Renderer, HUD, MenuScreen, styles.ts)
├── platform/             # Platform abstractions (Input, Audio, Persistence)
├── constants/            # Game constants
├── utils/                # Shared utilities
└── __tests__/            # Unit tests (Vitest)
tests/                    # E2E tests (Playwright)
```

---

## Key Patterns

### Count-Based Mob System

Mobs are aggregates with a `count` field, not individual entities:
- Gate operations: `flock.count = Math.floor(flock.count * gate.multiplier)`
- Combat: resolve based on aggregate power
- Rendering: draw `min(count, 50)` sprites

### Stateless System Functions

```typescript
// Good: pure function
export function resolveCombat(chickenCount: number, ...): CombatResult { }

// Bad: class with mutable state
class CombatSystem { resolve(...) { } }  // Avoid
```

### Fixed-Timestep Game Loop

60Hz simulation with accumulator pattern for deterministic behavior.

---

## Testing Conventions

- Tests live in `src/__tests__/*.test.ts`
- Use `describe`/`it` blocks with behavior-focused descriptions
- Structure: Arrange → Act → Assert

---

## Design Tokens

Use centralized tokens from `src/ui/styles.ts`:

```typescript
import { COLORS, SPACING, RADIUS, SHADOWS, TRANSITIONS } from '@/ui/styles';
```

---

## Haptic Feedback

Mobile vibration patterns in `src/platform/Input.ts`:
- `HAPTIC.light` (10ms), `HAPTIC.medium` (25ms), `HAPTIC.heavy` (50ms)
- `HAPTIC.fire`, `HAPTIC.win`, `HAPTIC.lose` (patterns)

---

## Validation Checklist

```bash
npm run build    # Must succeed with no errors
npm test         # All unit tests must pass
```

TypeScript strict mode catches most issues. Fix all warnings before committing.

---

## Release Process

Releases are triggered by git tags:

```bash
# Update version in package.json
# Update CHANGELOG.md with new version section
git commit -am "chore: bump version to X.Y.Z"
git tag vX.Y.Z
git push origin main --tags
```

GitHub Actions handles the release workflow automatically.
