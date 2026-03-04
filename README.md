# Chicken Mob 🐔

A fast-paced, single-player, lane-based crowd game where you launch chicken mobs from barn cannons through multiplier gates to overwhelm fox defenses.

**Core Fantasy:** *Launch a few chickens, multiply them into a massive flock, and trample the fox fort!*

## 🎮 Play Now

👉 **[Play Chicken Mob](https://bigknoxy.github.io/chicken-mob/)**

## Features

- **Lane-based crowd gameplay** — Slide your barn cannon horizontally to aim across lanes, then fire chicken flocks through multiplier gates
- **15 hand-authored levels** — Progressive difficulty from tutorial to multi-lane boss battles
- **5 chicken types** — Clucky, Hen Tank, Rooster Bomber, Speed Chick, Golden Goose
- **3 fox enemy types** — Scout, Brute, Sniper with escalating difficulty
- **3 barn cannons** — Old Barn, Haystorm, Sniper Nest with unique firing patterns
- **Meta progression** — Upgrade cannons, chickens, and farm stats between levels
- **Offline income** — Chicken Coop generates corn while you're away
- **Polished visuals** — Gate glow effects, muzzle flash, screen transitions, and button feedback
- **Efficient mob rendering** — Count-based aggregate mobs handle hundreds of units at 60 fps
- **PWA support** — Install as a mobile web app with portrait orientation lock

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Language | TypeScript |
| Build Tool | Vite |
| Renderer | Canvas 2D (custom) |
| Audio | Web Audio API (procedural) |
| Unit Tests | Vitest |
| E2E Tests | Playwright |
| CI/CD | GitHub Actions |
| Hosting | GitHub Pages |

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run unit tests
npm test

# Run e2e tests (requires dev server running)
npx playwright test

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── main.ts               # Entry point
├── core/                  # Game loop, simulation, collision, lane logic
├── systems/               # Spawning, gates, combat, upgrades, offline
├── data/                  # Type definitions, chicken/fox/cannon/level data
├── ui/                    # Canvas renderer, HUD, menus, popups
├── platform/              # Persistence, input handling, audio
├── constants/             # Centralized game constants
└── utils/                 # Shared utilities (formatting, etc.)
tests/                     # Playwright e2e tests
```

## Game Architecture

### Count-Based Mob Simulation

Instead of simulating individual chicken/fox units, flocks and packs are represented as **aggregate objects** with a `count` field. This enables:

- **O(1) gate operations** — multiply the count directly
- **O(n) combat** — where n is the number of flock/pack pairs, not individual units
- **Bounded rendering** — draw `min(count, 50)` sprites per group with a count badge

### Fixed-Timestep Game Loop

The game loop uses a fixed 60Hz simulation step with variable-rate rendering for deterministic physics and smooth visuals on any display.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

All PRs require passing CI checks before merging.

## License

MIT License — see [LICENSE](LICENSE) for details.
