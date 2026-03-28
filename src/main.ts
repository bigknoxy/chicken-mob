/**
 * main.ts — Chicken Mob entry point.
 *
 * Wires together game loop, simulation, rendering, input, persistence,
 * and UI screens into a cohesive game application.
 */

import type { GameState, LiveObstacle, LiveGate, LevelDefinition, StarRating } from '@/data/types';
import { getLevel, TOTAL_LEVELS, WORLDS, getLevelsForWorld, LEVELS } from '@/data/levels';
import { CHICKENS, isChickenUnlocked, getChicken } from '@/data/chickens';
import { GameLoop } from '@/core/GameLoop';
import { simulationTick, calculateStars, generateLevelSummary, triggerAbility, spawnLaunchParticles, triggerCannonRecoil } from '@/core/Simulation';
import { createLaneGeometry, LaneGeometry } from '@/core/Lane';
import { fireChickens } from '@/systems/SpawningSystem';
import { calculateOfflineEarnings, claimOfflineEarnings } from '@/systems/OfflineSystem';
import { generateEndlessLevel } from '@/systems/ProceduralLevelGenerator';
import { shouldShowDailyLogin, checkDailyLogin, claimDailyReward } from '@/systems/DailyLoginSystem';
import { loadPlayerState, savePlayerState } from '@/platform/Persistence';
import { InputManager, hapticFeedback, HAPTIC } from '@/platform/Input';
import { audio } from '@/platform/Audio';
import { AUTOSAVE_INTERVAL_MS, MAX_AIM_ANGLE } from '@/constants/game';
import { Modal } from '@/ui/Modal';
import { Renderer } from '@/ui/Renderer';
import { HUD } from '@/ui/HUD';
import { MenuScreen } from '@/ui/MenuScreen';
import { UpgradeScreen } from '@/ui/UpgradeScreen';
import { OfflinePopup } from '@/ui/OfflinePopup';
import { TutorialOverlay } from '@/ui/TutorialOverlay';
import { SettingsScreen } from '@/ui/SettingsScreen';
import { DailyLoginPopup } from '@/ui/DailyLoginPopup';

// ── App State ──
type AppScreen = 'menu' | 'playing' | 'upgrades';

let currentScreen: AppScreen = 'menu';
let playerState = loadPlayerState();
let gameState: GameState | null = null;
let laneGeo: LaneGeometry | null = null;
let isEndlessMode = false;
let endlessWave = 0;
let endlessCornEarned = 0;

/** Unlock any chickens that meet their requirements */
function unlockChickens(): string[] {
    const newlyUnlocked: string[] = [];
    
    for (const chicken of CHICKENS) {
        if (playerState.ownedChickens.includes(chicken.id)) continue;
        
        if (isChickenUnlocked(chicken, playerState)) {
            playerState.ownedChickens.push(chicken.id);
            newlyUnlocked.push(chicken.name);
        }
    }
    
    return newlyUnlocked;
}

// ── DOM Elements ──
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const overlay = document.getElementById('ui-overlay') as HTMLDivElement;

// ── Modules ──
const renderer = new Renderer(canvas);
const input = new InputManager(canvas);
const hud = new HUD(overlay);
const offlinePopup = new OfflinePopup(overlay);
const dailyLoginPopup = new DailyLoginPopup(overlay);
const settingsScreen = new SettingsScreen(overlay);
const modal = new Modal();
const tutorial = new TutorialOverlay(overlay, () => {
    playerState.tutorialSeen = true;
});

hud.setAbilityCallback(() => {
    input.triggerAbility();
});

hud.setSettingsCallback(() => {
    settingsScreen.show(playerState, () => {
        savePlayerState(playerState);
    });
});

function playSound(soundFn: () => void): void {
    if (playerState.settings?.soundEnabled !== false) {
        soundFn();
    }
}

function doHaptic(pattern: number | number[] | readonly number[]): void {
    if (playerState.settings?.hapticsEnabled !== false) {
        hapticFeedback(pattern as number | number[]);
    }
}

const menuScreen = new MenuScreen(overlay, (action) => {
    switch (action.type) {
        case 'play_level':
            startLevel(action.levelIndex);
            break;
        case 'play_endless':
            startEndlessMode();
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

        // Skip simulation when paused
        if (gameState.paused) {
            input.endFrame();
            return;
        }

        // Handle input → cannon aiming and firing
        const inputState = input.getState();

        if (inputState.isDown) {
            const canvasWidth = renderer.getWidth();
            const canvasHeight = renderer.getHeight();
            
            // Cannon stays at center (or last position)
            // Touch position determines aim target
            const cannonX = (gameState.cannonX ?? 0.5) * canvasWidth;
            const cannonY = canvasHeight - (laneGeo?.bottomMargin ?? 60) / 2;
            
            // Calculate aim angle from cannon to touch position
            // Angle: 0 = straight up, positive = right, negative = left
            const dx = inputState.x - cannonX;
            const dy = cannonY - inputState.y; // Positive when touching above cannon
            const rawAngle = Math.atan2(dx, dy);
            
            // Clamp angle to max range
            const prevAngle = gameState.cannonAngle;
            gameState.cannonAngle = Math.max(-MAX_AIM_ANGLE, Math.min(MAX_AIM_ANGLE, rawAngle));
            
            // Tutorial: detect aim change
            if (Math.abs(gameState.cannonAngle - prevAngle) > 0.1) {
                tutorial.onAim();
            }
            
            gameState.isFiring = true;

            // Auto-fire while holding
            if (gameState.cannonCooldown <= 0) {
                fireChickens(gameState, playerState, gameState.cannonAngle);
                playSound(() => audio.playFire());
                doHaptic(HAPTIC.fire);
                triggerCannonRecoil(gameState);
                const cannonX = (gameState.cannonX ?? 0.5) * renderer.getWidth();
                const cannonY = renderer.getHeight() - (laneGeo?.bottomMargin ?? 60) / 2;
                spawnLaunchParticles(gameState, cannonX, cannonY);
                tutorial.onFire();
            }
        } else {
            gameState.isFiring = false;
        }

        // Handle ability button press
        if (inputState.abilityPressed && gameState.abilityCooldown <= 0) {
            const chickenType = getChicken(playerState.equippedChickenId);
            if (chickenType.activeAbility) {
                triggerAbility(gameState, chickenType);
                doHaptic(HAPTIC.heavy);
            }
        }

        // Run simulation
        simulationTick(gameState, dt);

        // Tutorial: detect gate pass (Level 1 has gate at position 0.5)
        if (tutorial && gameState.level.id === 'level_01') {
            const passedGate = gameState.flocks.some(f => f.alive && f.position > 0.5);
            if (passedGate) {
                tutorial.onGatePass();
            }
        }

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
            hud.updateAbilityUI(gameState, playerState);
        }
    },
);

// ── Level Management ──
function startLevel(index: number): void {
    const levelDef = getLevel(index);
    laneGeo = createLaneGeometry(
        renderer.getWidth(),
        renderer.getHeight(),
        levelDef.laneCount,
    );
    gameState = createGameState(levelDef, laneGeo);
    currentScreen = 'playing';
    isEndlessMode = false;
    menuScreen.hide();
    upgradeScreen.hide();
    audio.resume();
    
    // Show tutorial on Level 1 for new players
    if (index === 0 && !playerState.tutorialSeen) {
        tutorial.show();
    } else {
        tutorial.hide();
    }
}

function startEndlessMode(): void {
    isEndlessMode = true;
    endlessWave = 1;
    endlessCornEarned = 0;
    startEndlessWave();
}

function startEndlessWave(): void {
    const levelDef = generateEndlessLevel(endlessWave);
    laneGeo = createLaneGeometry(
        renderer.getWidth(),
        renderer.getHeight(),
        levelDef.laneCount,
    );
    gameState = createGameState(levelDef, laneGeo);
    currentScreen = 'playing';
    menuScreen.hide();
    upgradeScreen.hide();
    audio.resume();
}

function createGameState(level: LevelDefinition, geo?: LaneGeometry): GameState {
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
        cannonRecoil: 0,
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
        abilityCooldown: 0,
        abilityActive: false,
        abilityDurationRemaining: 0,
        rapidFireMultiplier: 1,
        paused: false,
        laneGeometry: geo,
    };
}

function onLevelEnd(): void {
    if (!gameState) return;

    gameState.levelSummary = generateLevelSummary(gameState);

    if (isEndlessMode) {
        if (gameState.levelWon) {
            const cornMult = playerState.upgrades['farm_corn_mult']
                ? 1.0 + 0.1 * playerState.upgrades['farm_corn_mult']
                : 1.0;
            const corn = Math.floor(gameState.level.rewardCorn * cornMult * gameState.level.fort.rewardMultiplier);
            playerState.currencies.corn += corn;
            playerState.currencies.golden_feather += gameState.level.rewardFeathers;
            playerState.totalCornEarned += corn;
            endlessCornEarned += corn;

            playerState.endlessHighScore = Math.max(playerState.endlessHighScore ?? 0, endlessWave);
            endlessWave++;
            savePlayerState(playerState);
            
            playSound(() => audio.playWin());
            doHaptic(HAPTIC.win);
            
            gameState = null;
            startEndlessWave();
        } else {
            const wavesCompleted = Math.max(0, endlessWave - 1);
            playerState.endlessHighScore = Math.max(playerState.endlessHighScore ?? 0, wavesCompleted);
            
            modal.show(
                'Endless Mode Complete!',
                `You reached Wave ${endlessWave}!\n\nCorn earned: ${endlessCornEarned}\nBest wave: ${playerState.endlessHighScore}`,
                [{ text: 'Continue', onClick: () => {} }],
            );
            
            playSound(() => audio.playLose());
            doHaptic(HAPTIC.lose);
            
            playerState.lastSessionTimestamp = Date.now();
            savePlayerState(playerState);
            gameState = null;
            laneGeo = null;
            isEndlessMode = false;
            currentScreen = 'menu';
            menuScreen.show(playerState);
        }
        return;
    }

    if (gameState.levelWon) {
        const cornMult = playerState.upgrades['farm_corn_mult']
            ? 1.0 + 0.1 * playerState.upgrades['farm_corn_mult']
            : 1.0;
        const corn = Math.floor(gameState.level.rewardCorn * cornMult * gameState.level.fort.rewardMultiplier);
        playerState.currencies.corn += corn;
        playerState.currencies.golden_feather += gameState.level.rewardFeathers;
        playerState.totalCornEarned += corn;
        playerState.totalLevelsCompleted++;

        const stars = calculateStars(gameState) as StarRating;
        const levelIndex = LEVELS.findIndex(l => l.id === gameState!.level.id);
        const existingStars = playerState.levelStars[levelIndex] ?? 1;
        playerState.levelStars[levelIndex] = Math.max(existingStars, stars) as StarRating;

        if (levelIndex === playerState.currentLevel && playerState.currentLevel < TOTAL_LEVELS - 1) {
            playerState.currentLevel = levelIndex + 1;
            playerState.unlockedLevels = Math.max(playerState.unlockedLevels, levelIndex + 2);
        }

        const currentLevelDef = getLevel(levelIndex);
        const currentWorldId = currentLevelDef.worldId;
        
        const worldLevels = getLevelsForWorld(currentWorldId);
        const allWorldLevelsCompleted = worldLevels.every((wl) => {
            const idx = LEVELS.findIndex((l) => l.id === wl.id);
            return playerState.levelStars[idx] !== undefined;
        });

        if (allWorldLevelsCompleted && !playerState.worldsCompleted.includes(currentWorldId)) {
            playerState.worldsCompleted.push(currentWorldId);
            
            const currentWorldIndex = WORLDS.findIndex(w => w.id === currentWorldId);
            if (currentWorldIndex < WORLDS.length - 1) {
                const nextWorld = WORLDS[currentWorldIndex + 1];
                if (!playerState.worldsUnlocked.includes(nextWorld.id)) {
                    playerState.worldsUnlocked.push(nextWorld.id);
                    playerState.currentWorld = nextWorld.id;
                }
            }
        }

        const newlyUnlockedChickens = unlockChickens();
        if (newlyUnlockedChickens.length > 0) {
            setTimeout(() => {
                modal.show(
                    '🐔 New Chicken Unlocked!',
                    `You've unlocked: ${newlyUnlockedChickens.join(', ')}!\n\nVisit the Upgrade Barn to equip your new chicken.`,
                    [{ text: 'Awesome!', onClick: () => {} }],
                );
            }, 1000);
        }

        playSound(() => audio.playWin());
        doHaptic(HAPTIC.win);
    } else {
        audio.playLose();
        hapticFeedback(HAPTIC.lose);
    }

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
    // Mobile lifecycle: pause on visibility change
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // App going to background - save and pause
            if (gameState && currentScreen === 'playing') {
                gameState.paused = true;
            }
            playerState.lastSessionTimestamp = Date.now();
            savePlayerState(playerState);
        } else {
            // App coming to foreground - resume
            if (gameState && currentScreen === 'playing') {
                gameState.paused = false;
            }
            audio.resume();
        }
    });

    // Check and show daily login reward
    if (shouldShowDailyLogin(playerState)) {
        const loginInfo = checkDailyLogin(playerState);
        dailyLoginPopup.show(
            loginInfo.consecutiveDays,
            loginInfo.reward,
            loginInfo.isStreakBroken,
            () => {
                claimDailyReward(playerState);
                savePlayerState(playerState);
                showOfflineEarnings();
            },
        );
    } else {
        showOfflineEarnings();
    }

    hud.update(playerState);
    loop.start();
}

function showOfflineEarnings(): void {
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
}

boot();
