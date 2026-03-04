# Chicken Mob Release Notes

## [v0.2.1] - 2026-03-04

### UI Polish

- **Nunito font** — Consistent typography across all screens (HUD, menus, modals)
- **Design tokens** — Centralized `COLORS`, `SPACING`, `RADIUS`, `SHADOWS`, `TRANSITIONS` in `src/ui/styles.ts`
- **Screen transitions** — Smooth fade transitions between menu, gameplay, and popups
- **Button feedback** — Hover and click states with scale transforms

### Visual Effects

- **Gate glow** — Pulsing radial gradient effect on multiplier gates
- **Muzzle flash** — Cannon firing visual feedback with cooldown
- **Button hover/click** — Scale transforms for interactive feedback

### Code Quality

- **Centralized constants** — Game constants moved to `src/constants/game.ts` (`COLLISION_THRESHOLD`, `MAX_VISIBLE_PER_FLOCK`, `MUZZLE_FLASH_COOLDOWN`, etc.)
- **Combat system consolidation** — All combat resolution uses `resolveCombat` from `CombatSystem.ts`
- **Type safety** — Strict TypeScript with `noUnusedLocals`, `noUnusedParameters`

### Audio

- **Enhanced win/lose sounds** — Win: ascending C major arpeggio; Lose: descending minor sequence
- **Haptic feedback** — Vibration patterns for fire, win, and lose events on supported devices

### Testing

- **Playwright E2E tests** — Coverage for menu navigation, level start, and modal interactions
- **Test utilities** — Haptic pattern constants (`HAPTIC.fire`, `HAPTIC.win`, `HAPTIC.lose`)

---

## [v0.2.0] - Initial Public Release

- 15 hand-authored levels with progressive difficulty
- 5 chicken types and 3 fox enemy types
- 3 barn cannons with unique firing patterns
- Meta progression with upgrades
- Offline income system
- PWA support with portrait orientation
