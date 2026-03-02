# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2026-03-02

### Fixed
- Gate visual/collision mismatch — gates now render at actual collision width instead of hardcoded 80%
- DPR coordinate bug — fixed cannon offset on high-DPR devices by removing DPR scaling
- Cumulative ctx.scale bug — added setTransform before scale to prevent exponential scaling on resize

### Changed
- Level 9 scarecrow moved from center (x:0.5) to edge (x:0.2) so skilled players can avoid it
- Level 12 difficulty reduced: fence HP 20/25→12/15, removed scarecrow, reduced brutes 4→3
- Gate multipliers changed from 0.3x to 0.5x (less punishing)

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
