// ============================================================
// Chicken Mob — Core Data Types
// ============================================================

import type { LaneGeometry } from '@/core/Lane';

// ----- Helper Functions -----
export function getLaneCenter(lane: number, laneCount: number): number {
    return (lane + 0.5) / laneCount;
}

// ----- Currencies -----
export type CurrencyId = 'corn' | 'golden_feather';

// ----- Chicken Types -----
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface ChickenUnlockRequirement {
    type: 'level' | 'world' | 'stars';
    value: number | string;
}

export type ActiveAbilityType = 'aoe_blast' | 'rapid_fire';

export interface ActiveAbility {
    type: ActiveAbilityType;
    cooldown: number;        // seconds between uses
    damage?: number;         // for aoe_blast
    duration?: number;       // for rapid_fire
    multiplier?: number;     // for rapid_fire
}

export interface ChickenType {
    id: string;
    name: string;
    baseCountPerShot: number;
    moveSpeed: number;       // pixels per second
    hpPerChicken: number;
    damagePerChicken: number;
    size: number;            // visual scale multiplier (1.0 = normal)
    rarity: Rarity;
    specialAbility?: 'aoe_on_death' | 'bonus_corn';
    specialValue?: number;   // e.g. AoE damage or reward multiplier
    activeAbility?: ActiveAbility;
    unlockRequirement?: ChickenUnlockRequirement;
}

// ----- Barn Cannons -----
export type CannonAbility = 'haystorm' | 'sniper_nest';

export interface BarnCannonDefinition {
    id: string;
    name: string;
    unitTypeId: string;      // which ChickenType this cannon fires
    fireRate: number;        // shots per second
    burstSize: number;       // chickens per shot (before multipliers)
    projectileSpeed: number; // pixels per second
    spread: number;          // angle in degrees (0 = perfectly straight)
    specialAbility?: CannonAbility;
}

// ----- Gates -----

export interface GateDefinition {
    id: string;
    position: number;        // 0..1 along lane length
    lane: number;            // lane index (0-based)
    x?: number;              // 0..1 normalized horizontal position (optional for backwards compat)
    width: number;           // visual width in game units
    multiplier: number;      // e.g. 2, 3, 5, 10; < 1 for traps; 0 = kill
    isPositive: boolean;     // true = multiply up, false = trap
}

// ----- Obstacles -----
export type ObstacleType = 'fence' | 'hay_bale' | 'scarecrow';
export type MovementPattern = 'static' | 'back_and_forth' | 'rotate';

export interface ObstacleDefinition {
    id: string;
    type: ObstacleType;
    lane: number;
    x?: number;               // 0..1 normalized horizontal position (optional for backwards compat)
    width?: number;           // 0..1 collision width (optional for backwards compat)
    position: number;        // 0..1 along lane
    hp: number;              // 0 or Infinity for invincible (scarecrow)
    movementPattern: MovementPattern;
}

// ----- Fox Enemies -----
export interface FoxMobType {
    id: string;
    name: string;
    moveSpeed: number;       // pixels per second
    hpPerFox: number;
    damagePerFox: number;
}

export interface EnemySpawn {
    time: number;            // seconds from level start
    lane: number;
    foxTypeId: string;
    count: number;
}

// ----- Fox Fort -----
export interface FoxFortDefinition {
    hp: number;
    armorMultiplier: number;  // damage received = damage / armorMultiplier
    rewardMultiplier: number; // corn reward multiplied by this
}

// ----- Worlds -----
export type WorldTheme = 'grassland' | 'desert' | 'snow' | 'lava' | 'meadow_night' | 'magma_cave';

export interface WorldDefinition {
    id: string;              // e.g., 'W1', 'W2'
    name: string;
    levels: string[];        // array of level IDs in this world
    theme: WorldTheme;
    unlocked: boolean;       // initial unlock state
}

// ----- Levels -----
export interface LevelDefinition {
    id: string;
    name: string;
    worldId: string;         // which world this level belongs to
    laneCount: number;
    length: number;          // visual lane length in game units
    gates: GateDefinition[];
    obstacles: ObstacleDefinition[];
    enemySpawns: EnemySpawn[];
    fort: FoxFortDefinition;
    rewardCorn: number;
    rewardFeathers: number;
    timeout?: number;          // seconds before level fails (optional, defaults to 60)
    enemySpeedMultiplier?: number;  // daily-challenge modifier: per-level fox speed scale (1 = normal)
}

// ----- Upgrades -----
export type UpgradeCategory = 'cannon' | 'chicken' | 'farm';
export type UpgradeStat =
    | 'fireRate'
    | 'burstSize'
    | 'projectileSpeed'
    | 'hp'
    | 'damage'
    | 'moveSpeed'
    | 'cornMultiplier'
    | 'offlineRate'
    | 'offlineCap';

export interface UpgradeDefinition {
    id: string;
    category: UpgradeCategory;
    targetId: string;        // cannonId, chickenTypeId, or 'global'
    stat: UpgradeStat;
    displayName: string;
    baseValue: number;
    incrementPerLevel: number;
    baseCost: number;
    costGrowthFactor: number;
    maxLevel: number;
}

// ----- Coop / Offline -----
export interface CoopState {
    cornPerSecond: number;
    offlineCapSeconds: number;
}

// ----- Daily Login -----
export interface DailyLoginState {
    lastLoginDate: string;           // ISO date string 'YYYY-MM-DD'
    consecutiveDays: number;         // current streak (1-7, resets after claim)
    totalDaysLoggedIn: number;       // lifetime stat
    rewardsClaimedToday: boolean;    // prevent re-claiming on same day
}

// ----- Daily Challenge -----
/** A gameplay modifier applied to a challenge run. */
export type ChallengeModifierType =
      | 'double_enemies'    // enemy counts x value (2)
      | 'stunted_chickens' // deployed chicken counts x value (0.5)
      | 'no_upgrades'       // upgrade effects disabled
      | 'fast_enemies'      // enemy speed x value (1.5)
      | 'blind_gates'       // gate multipliers hidden
      | 'single_lane'       // only one lane active
      | 'precision_mode';   // smaller gate hitboxes

export interface ChallengeModifier {
    type: ChallengeModifierType;
    value: number;
}

/** Reward for completing a challenge (base, pre-streak-multiplier). */
export interface ChallengeReward {
    corn: number;
    goldenFeather: number;
}

/** A deterministic daily challenge. All fields derive from its `id` (UTC day). */
export interface DailyChallenge {
    id: string;                  // UTC date string 'YYYY-MM-DD' (also the seed key)
    seed: number;                // deterministic seed (hash of `id`)
    levelIndex: number;          // 0-based flat index into LEVELS (validated by caller)
    difficultyTier: number;      // 1..3
    modifiers: ChallengeModifier[];
    reward: ChallengeReward;     // base reward by tier (streak bonus applied on completion)
    expiresAtMs: number;         // end of the UTC day, epoch ms
}

/** Persisted daily-challenge streak tracking (mirrors DailyLoginState). */
export interface ChallengeProgress {
    lastCompletedDate: string | null;   // UTC date string of last completion
    consecutiveCompletions: number;     // current streak (1..7, wraps)
    longestStreak: number;              // lifetime stat
    totalCompleted: number;             // lifetime stat
    completedToday: boolean;            // prevent re-completing the same day
}

// ----- Player Settings -----
export interface PlayerSettings {
    soundEnabled: boolean;
    musicEnabled: boolean;
    hapticsEnabled: boolean;
     // P1-5a accessibility. `undefined` on old saves = "defer to the OS
     // `prefers-reduced-motion` signal"; boot seeds it from that signal.
    reducedMotion?: boolean;
}

// ----- Player State -----
export type StarRating = 1 | 2 | 3;

export interface PlayerState {
    currencies: Record<CurrencyId, number>;
    ownedChickens: string[];
    ownedBarnCannons: string[];
    equippedCannonId: string;
    equippedChickenId: string;
    upgrades: Record<string, number>; // upgradeId → current level
    currentWorld: string;            // current world ID (e.g., 'W1')
    currentLevel: number;            // 1-based index into levels array
    unlockedLevels: number;          // how many levels unlocked
    worldsUnlocked: string[];        // array of unlocked world IDs
    worldsCompleted: string[];       // array of completed world IDs
    coop: CoopState;
    lastSessionTimestamp: number;    // epoch ms
    totalCornEarned: number;
    totalLevelsCompleted: number;
    levelStars: Record<number, StarRating>; // level index → star rating
    endlessHighScore: number;        // highest wave reached in endless mode
    tutorialSeen?: boolean;          // has the player seen the tutorial
    dailyLogin?: DailyLoginState;    // daily login streak tracking
    challengeProgress?: ChallengeProgress;     // daily challenge streak tracking
    settings?: PlayerSettings;       // user preferences
}

// ============================================================
// Runtime Game Objects (not persisted — live during gameplay)
// ============================================================

/** Aggregate chicken flock moving through a lane */
export interface Flock {
    id: number;
    chickenTypeId: string;
    count: number;
    lane: number;
    x?: number;             // 0..1 normalized horizontal position (optional for backwards compat)
    position: number;        // 0..1 along lane (0 = cannon, 1 = fort)
    speed: number;           // effective speed after upgrades
    alive: boolean;
}

/** Aggregate fox pack moving through a lane */
export interface FoxPack {
    id: number;
    foxTypeId: string;
    count: number;
    lane: number;
    x?: number;             // 0..1 normalized horizontal position (optional for backwards compat)
    position: number;        // 0..1 along lane (1 = fort end, moving toward 0)
    speed: number;
    alive: boolean;
}

/** Live obstacle on the lane during gameplay */
export interface LiveObstacle {
    id: number;
    definition: ObstacleDefinition;
    currentHp: number;
    alive: boolean;
    phase: number;           // for movement animation
}

/** Live gate — tracks whether it's been consumed or is persistent */
export interface LiveGate {
    id: number;
    definition: GateDefinition;
    triggered: boolean;      // for single-use gates (optional)
}

/** Live fox fort */
export interface LiveFort {
    currentHp: number;
    maxHp: number;
    armorMultiplier: number;
}

/** End-of-level summary statistics */
export interface LevelSummary {
    deployed: number;           // total chickens fired
    reachedFort: number;         // chickens that damaged fort
    currentlyOnField: number;    // chickens still in lanes
    destroyed: number;          // chickens lost to foxes/traps/obstacles
    efficiency: number;         // 0-1 ratio
    timeElapsed: number;        // seconds to complete
    stars: 1 | 2 | 3;
    won: boolean;
}

/** Full runtime game state for a level in progress */
export interface GameState {
    level: LevelDefinition;
    flocks: Flock[];
    foxPacks: FoxPack[];
    obstacles: LiveObstacle[];
    gates: LiveGate[];
    fort: LiveFort;
    elapsedTime: number;      // seconds since level start
    cannonX?: number;        // 0..1 normalized horizontal position (optional for backwards compat)
    cannonAngle: number;       // current aim angle in radians
    cannonCooldown: number;    // seconds until next shot allowed
    cannonRecoil: number;      // seconds of recoil animation remaining
    isFiring: boolean;         // is the player holding fire?
    nextEntityId: number;      // auto-incrementing ID for flocks/packs
    levelComplete: boolean;
    levelWon: boolean;
    pendingSpawns: EnemySpawn[]; // spawns that haven't triggered yet
    particles: Particle[];     // visual-only effects
    screenShake: number;       // remaining shake duration
    victoryFlash: number;      // victory flash intensity (0-1, decays over time)
    totalChickensFired: number;    // total chickens fired this level
    totalChickensReachedFort: number; // chickens that successfully reached fort
    currentChickensOnField: number;  // chickens currently alive in lanes
    levelSummary?: LevelSummary;      // end-of-level statistics
    abilityCooldown: number;   // seconds until ability is ready
    abilityActive: boolean;    // is an ability currently active (e.g., rapid_fire)
    abilityDurationRemaining: number; // seconds left on active ability
    rapidFireMultiplier: number;      // current fire rate multiplier from ability
    paused: boolean;           // game is paused (mobile lifecycle)
    laneGeometry?: LaneGeometry;  // cached lane geometry for particle positioning
}

/** Simple particle for juice effects */
export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;    // remaining seconds
    maxLife: number;
    color: string;
    size: number;
    rotation?: number;        // for confetti rotation
    rotationSpeed?: number;    // for confetti rotation speed
    type?: 'confetti';       // particle type for special rendering
}
