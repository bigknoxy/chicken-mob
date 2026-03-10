# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.1] - 2026-03-10

### Added
- **Chicken favicon** — Custom SVG favicon with cute chicken design
- PWA icon support for mobile home screen installation

### Fixed
- 404 error for favicon.ico on production
- Theme color mismatch in manifest.json

## [0.4.0] - 2026-03-10

### Added
- **Cannon aiming control** — Touch position now determines aim angle, allowing players to direct chickens left or right
- Angled aim line visualization with target indicator
- `MAX_AIM_ANGLE` constant (60°) for tunable aim range

### Changed
- Transformed core loop from "hold to fire" to "aim and fire" for meaningful player agency
- Chickens now fire at target X based on `sin(angle) * spread` (max 40% horizontal spread)

### Technical
- Added `aimAngle` to `InputState` interface
- 5 new unit tests for aiming math
- All 60 tests passing

## [0.2.1] - 2026-03-04

### Added
- Star rating system — 1-3 stars based on chicken efficiency (chickens reaching fort / fired)
  - 3 stars: 80%+ efficiency
  - 2 stars: 50%+ efficiency
  - 1 star: complete level
- 4x gate multiplier — added to level 6
- Playwright E2E tests — coverage for menu navigation, level start, and modal interactions

### UI Polish
- **Nunito font** — Consistent typography across all screens (HUD, menus, modals)
- **Design tokens** — Centralized `COLORS`, `SPACING`, `RADIUS`, `SHADOWS`, `TRANSITIONS` in `src/ui/styles.ts`
- **Screen transitions** — Smooth fade transitions between menu, gameplay, and popups
- **Button feedback** — Hover and click states with scale transforms

### Visual Effects
- **Gate glow** — Pulsing radial gradient effect on multiplier gates
- **Muzzle flash** — Cannon firing visual feedback with cooldown
- **Button hover/click** — Scale transforms for interactive feedback

### Audio
- **Enhanced win/lose sounds** — Win: ascending C major arpeggio; Lose: descending minor sequence
- **Haptic feedback** — Vibration patterns for fire, win, and lose events on supported devices

### Code Quality
- **Centralized constants** — Game constants moved to `src/constants/game.ts` (`COLLISION_THRESHOLD`, `MAX_VISIBLE_PER_FLOCK`, `MUZZLE_FLASH_COOLDOWN`, etc.)
- **Combat system consolidation** — All combat resolution uses `resolveCombat` from `CombatSystem.ts`
- **Type safety** — Strict TypeScript with `noUnusedLocals`, `noUnusedParameters`

### Changed
- Reduced upgrade costs — growth factors changed from 1.5-2.0 to 1.3-1.5
- Level 9 scarecrow moved from center (x:0.5) to edge (x:0.2) so skilled players can avoid it
- Level 12 difficulty reduced: fence HP 20/25→12/15, removed scarecrow, reduced brutes 4→3
- Gate multipliers changed from 0.3x to 0.5x (less punishing)

### Fixed
- Gate visual/collision mismatch — gates now render at actual collision width instead of hardcoded 80%
- DPR coordinate bug — fixed cannon offset on high-DPR devices by removing DPR scaling
- Cumulative ctx.scale bug — added setTransform before scale to prevent exponential scaling on resize

### Added
- Loss condition — added 60-second timeout to levels

## [0.2.0] - 2026-03-01

### Added
- Horizontal cannon positioning — slide cannons left/right along X-axis to aim at different lanes
- Replaced angle-based aiming with horizontal position-based aiming for more intuitive controls

### Changed
- Cannon collision detection now uses X-axis range instead of angle-based cone
- Lane geometry updated to support X-based positioning with adjustable lane widths
- Level designs adjusted to leverage new horizontal aiming mechanic

### Fixed
- Cannon aim preview now correctly shows trajectory based on horizontal position

## [1.0.1] - 2026-02-28

### Fixed
- Unused import in tests causing CI/CD build failure

## [1.0.0] - 2026-02-28

### Added
- Core lane-based gameplay with cannon aiming, firing, and flock movement
- 15 hand-authored levels with progressive difficulty (tutorial → advanced)
- 5 chicken types: Clucky, Hen Tank, Rooster Bomber, Speed Chick, Golden Goose
- 3 fox enemy types: Scout, Brute, Sniper
- 3 barn cannon types: Old Barn, Haystorm Barn, Sniper Nest
- Multiplier gate system (positive ×2–×10 and negative traps)
- Obstacle system: Fences, Hay Bales, Scarecrows
- Fox Fort enemy base with HP, armor, and reward multipliers
- Count-based aggregate mob combat resolution
- Meta progression with 9 upgrade paths (cannon, chicken, farm)
- Offline income via Chicken Coop system
- Welcome-back popup showing offline earnings
- Canvas 2D renderer with count-based mob visualization
- Procedural audio via Web Audio API (no external sound files)
- Touch and mouse input support
- localStorage persistence with autosave
- PWA manifest for mobile installation
- GitHub Pages deployment via CI/CD
- Automated versioning and release pipeline
