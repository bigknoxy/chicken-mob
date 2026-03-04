/**
 * main.ts — Chicken Mob entry point.
 *
 * Wires together game loop, simulation, rendering, input, persistence,
 * and UI screens into a cohesive game application.
 */

import type { GameState, LiveObstacle, LiveGate, LevelDefinition, StarRating } from '@/data/types';
import { getLevel, TOTAL_LEVELS } from '@/data/levels';
import { GameLoop } from '@/core/GameLoop';
import { simulationTick, calculateStars, generateLevelSummary } from '@/core/Simulation';
import { createLaneGeometry, LaneGeometry } from '@/core/Lane';
import { fireChickens } from '@/systems/SpawningSystem';
import { calculateOfflineEarnings, claimOfflineEarnings } from '@/systems/OfflineSystem';
import { loadPlayerState, savePlayerState } from '@/platform/Persistence';
import { InputManager, hapticFeedback, HAPTIC } from '@/platform/Input';
import { audio } from '@/platform/Audio';
import { AUTOSAVE_INTERVAL_MS } from '@/constants/game';
import { Modal } from '@/ui/Modal';
import { Renderer } from '@/ui/Renderer';
import { HUD } from '@/ui/HUD';
import { MenuScreen } from '@/ui/MenuScreen';
import { UpgradeScreen } from '@/ui/UpgradeScreen';
import { OfflinePopup } from '@/ui/OfflinePopup';

// ── App State ──
type AppScreen = 'menu' | 'playing' | 'upgrades';

let currentScreen: AppScreen = 'menu';
let playerState = loadPlayerState();
let gameState: GameState | null = null;
let laneGeo: LaneGeometry | null = null;

// ── DOM Elements ──
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const overlay = document.getElementById('ui-overlay') as HTMLDivElement;

// ── Modules ──
const renderer = new Renderer(canvas);
const input = new InputManager(canvas);
const hud = new HUD(overlay);
const offlinePopup = new OfflinePopup(overlay);
const modal = new Modal();

const menuScreen = new MenuScreen(overlay, (action) => {
    switch (action.type) {
        case 'play_level':
            startLevel(action.levelIndex);
            break;
        case 'open_upgrades':
            currentScreen = 'upgrades';
            menuScreen.hide();
            upgradeScreen.show(playerState);
            break;
        case 'open_coop':
            // Show coop as a simple alert-style popup for v1
            showCoopInfo();
            break;
    }
});

const upgradeScreen = new UpgradeScreen(overlay, () => {
    currentScreen = 'menu';
    savePlayerState(playerState);
    menuScreen.show(playerState);
});

// ── Autosave Timer ──
let lastSaveTime = 0;

// ── Game Loop ──
const loop = new GameLoop(
    // Update
    (dt: number) => {
        if (currentScreen !== 'playing' || !gameState || !laneGeo) return;

        // Handle input → cannon aiming and firing
        const inputState = input.getState();

        if (inputState.isDown) {
            // Map touch X to cannon horizontal position (0-1 normalized)
            const canvasWidth = renderer.getWidth();
            gameState.cannonX = Math.max(0, Math.min(1, inputState.x / canvasWidth));
            gameState.isFiring = true;

            // Auto-fire while holding
            if (gameState.cannonCooldown <= 0) {
                fireChickens(gameState, playerState, gameState.cannonX);
                audio.playFire();
                hapticFeedback(HAPTIC.fire);
            }
        } else {
            gameState.isFiring = false;
        }

        // Run simulation
        simulationTick(gameState, dt);

        // Handle level complete
        if (gameState.levelComplete && inputState.justPressed) {
            onLevelEnd();
        }

        // Autosave
        const now = performance.now();
        if (now - lastSaveTime > AUTOSAVE_INTERVAL_MS) {
            playerState.lastSessionTimestamp = Date.now();
            savePlayerState(playerState);
            lastSaveTime = now;
        }

        input.endFrame();
    },
    // Render
    (_interpolation: number) => {
        if (currentScreen === 'playing' && gameState && laneGeo) {
            renderer.render(gameState, laneGeo);
            hud.update(playerState);
        }
    },
);

// ── Level Management ──
function startLevel(index: number): void {
    const levelDef = getLevel(index);
    gameState = createGameState(levelDef);
    laneGeo = createLaneGeometry(
        renderer.getWidth(),
        renderer.getHeight(),
        levelDef.laneCount,
    );
    currentScreen = 'playing';
    menuScreen.hide();
    upgradeScreen.hide();
    audio.resume();
}

function createGameState(level: LevelDefinition): GameState {
    return {
        level,
        flocks: [],
        foxPacks: [],
        obstacles: level.obstacles.map((def, i): LiveObstacle => ({
            id: i,
            definition: def,
            currentHp: def.hp,
            alive: true,
            phase: 0,
        })),
        gates: level.gates.map((def, i): LiveGate => ({
            id: i,
            definition: def,
            triggered: false,
        })),
        fort: {
            currentHp: level.fort.hp,
            maxHp: level.fort.hp,
            armorMultiplier: level.fort.armorMultiplier,
        },
        elapsedTime: 0,
        cannonX: 0.5,     // default to center (0.5)
        cannonAngle: 0,
        cannonCooldown: 0,
        isFiring: false,
        nextEntityId: 100,
        levelComplete: false,
        levelWon: false,
        pendingSpawns: [...level.enemySpawns],
        particles: [],
        screenShake: 0,
        victoryFlash: 0,
        totalChickensFired: 0,
        totalChickensReachedFort: 0,
        currentChickensOnField: 0,
    };
}

function onLevelEnd(): void {
    if (!gameState) return;

    // Generate summary before clearing game state (show on both win and loss)
    gameState.levelSummary = generateLevelSummary(gameState);

    if (gameState.levelWon) {
        // Award rewards
        const cornMult = playerState.upgrades['farm_corn_mult']
            ? 1.0 + 0.1 * playerState.upgrades['farm_corn_mult']
            : 1.0;
        const corn = Math.floor(gameState.level.rewardCorn * cornMult * gameState.level.fort.rewardMultiplier);
        playerState.currencies.corn += corn;
        playerState.currencies.golden_feather += gameState.level.rewardFeathers;
        playerState.totalCornEarned += corn;
        playerState.totalLevelsCompleted++;

        // Calculate and save stars
        const stars = calculateStars(gameState) as StarRating;
        const levelIndex = playerState.currentLevel;
        const existingStars = playerState.levelStars[levelIndex] ?? 1;
        playerState.levelStars[levelIndex] = Math.max(existingStars, stars) as StarRating;

        // Unlock next level
        const currentIndex = playerState.currentLevel;
        if (currentIndex < TOTAL_LEVELS - 1) {
            playerState.currentLevel = currentIndex + 1;
            playerState.unlockedLevels = Math.max(playerState.unlockedLevels, currentIndex + 2);
        }

        audio.playWin();
        hapticFeedback(HAPTIC.win);
    } else {
        audio.playLose();
        hapticFeedback(HAPTIC.lose);
    }

    // Save and return to menu
    playerState.lastSessionTimestamp = Date.now();
    savePlayerState(playerState);
    gameState = null;
    laneGeo = null;
    currentScreen = 'menu';
    menuScreen.show(playerState);
}

function showCoopInfo(): void {
    const coop = playerState.coop;
    modal.show(
        'Chicken Coop',
        `Corn/sec: ${coop.cornPerSecond.toFixed(1)}\n` +
        `Offline Cap: ${(coop.offlineCapSeconds / 3600).toFixed(1)} hours\n\n` +
        'Upgrade in the Farm tab to earn more while away!',
        [{ text: 'Close', onClick: () => {} }],
    );
}

// ── Boot ──
function boot(): void {
    // Check offline earnings
    const earnings = calculateOfflineEarnings(playerState);
    if (earnings.corn > 0) {
        offlinePopup.show(earnings, () => {
            claimOfflineEarnings(playerState, earnings);
            savePlayerState(playerState);
            menuScreen.show(playerState);
        });
    } else {
        playerState.lastSessionTimestamp = Date.now();
        menuScreen.show(playerState);
    }

    hud.update(playerState);
    loop.start();
}

boot();
