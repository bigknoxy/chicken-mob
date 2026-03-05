# Daily Challenges Implementation Plan

## Overview

Add a rotating daily challenge system that provides unique gameplay modifiers and rewards. This increases player retention by giving reasons to return each day.

## Feature Description

- New challenge available every 24 hours (resets at midnight UTC)
- Challenges have unique modifiers (double enemies, no upgrades, speed run, etc.)
- Completion rewards: bonus corn, exclusive stars, streak bonuses
- Seed-based generation for deterministic challenges
- Persistence tracks completion history and streaks

---

## Implementation Steps

### Step 1: Define Challenge Types in types.ts

**File:** `src/data/types.ts`

```typescript
export interface DailyChallenge {
    id: string;                    // Date-based: "2026-03-04"
    seed: number;                  // Deterministic seed for generation
    modifiers: ChallengeModifier[];
    levelId: number;               // Level to play
    targetScore?: number;          // Optional score target
    timeLimit?: number;            // Optional time limit
    rewards: ChallengeReward[];
    expiresAt: number;             // Unix timestamp
}

export interface ChallengeModifier {
    type: ModifierType;
    value: number | string;
}

export type ModifierType = 
    | 'double_enemies'       // All enemy counts x2
    | 'half_chickens'        // Chicken count /2
    | 'no_upgrades'          // Disable all upgrades
    | 'speed_run'            // Time limit
    | 'low_gravity'          // Slower fall
    | 'fast_enemies'         // Enemy speed x1.5
    | 'blind_gates'          // Hide gate multipliers
    | 'one_lane'             // Only one lane available
    | 'no_revives'           // No second chance
    | 'precision_mode';      // Smaller gate hitboxes

export interface ChallengeReward {
    type: 'corn' | 'stars' | 'streak_bonus';
    amount: number;
}

export interface ChallengeProgress {
    currentChallengeId: string | null;
    completedToday: boolean;
    currentStreak: number;
    longestStreak: number;
    totalChallengesCompleted: number;
    lastCompletionDate: string | null;
}
```

### Step 2: Create Challenge Generator

**File:** `src/systems/ChallengeGenerator.ts`

```typescript
import type { DailyChallenge, ChallengeModifier, ModifierType } from '@/data/types';

const MODIFIER_POOL: ModifierType[] = [
    'double_enemies',
    'half_chickens',
    'no_upgrades',
    'speed_run',
    'fast_enemies',
    'blind_gates',
    'one_lane',
    'precision_mode'
];

const MODIFIER_DIFFICULTY: Record<ModifierType, number> = {
    double_enemies: 2,
    half_chickens: 2,
    no_upgrades: 1.5,
    speed_run: 1.5,
    low_gravity: 0.5,
    fast_enemies: 1.5,
    blind_gates: 1,
    one_lane: 1,
    no_revives: 2,
    precision_mode: 1.5
};

export function generateDailyChallenge(date: Date): DailyChallenge {
    const dateStr = formatDate(date);
    const seed = hashString(dateStr);
    
    // Use seeded random for deterministic generation
    const rng = createSeededRandom(seed);
    
    // Select 1-3 modifiers based on difficulty target
    const targetDifficulty = 2 + Math.floor(rng() * 2); // 2-3
    const modifiers = selectModifiers(rng, targetDifficulty);
    
    // Select appropriate level (harder challenges = higher levels)
    const levelId = selectLevel(rng, targetDifficulty);
    
    // Generate rewards based on difficulty
    const rewards = generateRewards(targetDifficulty, rng);
    
    return {
        id: dateStr,
        seed,
        modifiers,
        levelId,
        timeLimit: modifiers.some(m => m.type === 'speed_run') ? 30 : undefined,
        rewards,
        expiresAt: getEndOfDay(date)
    };
}

function selectModifiers(rng: () => number, targetDifficulty: number): ChallengeModifier[] {
    const modifiers: ChallengeModifier[] = [];
    let currentDifficulty = 0;
    
    const available = [...MODIFIER_POOL];
    shuffle(available, rng);
    
    while (currentDifficulty < targetDifficulty && available.length > 0) {
        const type = available.shift()!;
        const difficulty = MODIFIER_DIFFICULTY[type];
        
        if (currentDifficulty + difficulty <= targetDifficulty + 0.5) {
            modifiers.push({
                type,
                value: getModifierValue(type, rng)
            });
            currentDifficulty += difficulty;
        }
    }
    
    return modifiers;
}

function getModifierValue(type: ModifierType, rng: () => number): number | string {
    switch (type) {
        case 'double_enemies':
        case 'fast_enemies':
            return 2;
        case 'half_chickens':
            return 0.5;
        case 'speed_run':
            return 30; // seconds
        default:
            return 0;
    }
}

function generateRewards(difficulty: number, rng: () => number): ChallengeReward[] {
    const baseCorn = 100;
    const cornBonus = Math.floor(difficulty * 50);
    const streakMultiplier = 1 + (rng() * 0.5); // 1.0-1.5x
    
    return [
        { type: 'corn', amount: Math.floor((baseCorn + cornBonus) * streakMultiplier) },
        { type: 'stars', amount: Math.ceil(difficulty / 2) }
    ];
}

// Seeded random number generator (Mulberry32)
function createSeededRandom(seed: number): () => number {
    return function() {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

function formatDate(date: Date): string {
    return date.toISOString().split('T')[0]; // "2026-03-04"
}

function getEndOfDay(date: Date): number {
    const end = new Date(date);
    end.setUTCHours(23, 59, 59, 999);
    return end.getTime();
}

function shuffle<T>(array: T[], rng: () => number): void {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function selectLevel(rng: () => number, difficulty: number): number {
    // Harder challenges use higher levels
    const minLevel = Math.max(1, Math.floor(difficulty * 2));
    const maxLevel = Math.min(15, minLevel + 5);
    return minLevel + Math.floor(rng() * (maxLevel - minLevel + 1));
}
```

### Step 3: Apply Modifiers in Simulation

**File:** `src/core/Simulation.ts`

```typescript
export function applyChallengeModifiers(state: GameState, challenge: DailyChallenge): void {
    for (const modifier of challenge.modifiers) {
        switch (modifier.type) {
            case 'double_enemies':
                for (const fox of state.foxPacks) {
                    fox.count *= 2;
                }
                break;
                
            case 'half_chickens':
                for (const flock of state.flocks) {
                    flock.count = Math.floor(flock.count / 2);
                }
                break;
                
            case 'no_upgrades':
                // Disable upgrade effects
                state.tempUpgradeDisable = true;
                break;
                
            case 'speed_run':
                state.timeLimit = modifier.value as number;
                break;
                
            case 'fast_enemies':
                for (const fox of state.foxPacks) {
                    fox.speed *= 1.5;
                }
                break;
                
            case 'one_lane':
                // Block other lanes visually
                state.activeLanes = [0];
                break;
                
            case 'blind_gates':
                state.hideGateMultipliers = true;
                break;
                
            case 'precision_mode':
                state.gateHitboxScale = 0.5;
                break;
        }
    }
}
```

### Step 4: Create Challenge UI

**File:** `src/ui/ChallengeScreen.ts`

```typescript
import type { DailyChallenge, ChallengeProgress } from '@/data/types';

export function renderChallengeScreen(
    ctx: CanvasRenderingContext2D,
    challenge: DailyChallenge,
    progress: ChallengeProgress,
    canvasWidth: number,
    canvasHeight: number
): void {
    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Title
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('DAILY CHALLENGE', canvasWidth / 2, 80);
    
    // Date
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.fillText(challenge.id, canvasWidth / 2, 120);
    
    // Time remaining
    const remaining = getTimeRemaining(challenge.expiresAt);
    ctx.fillStyle = '#ff6b6b';
    ctx.font = '16px Arial';
    ctx.fillText(`Resets in: ${remaining}`, canvasWidth / 2, 150);
    
    // Modifiers
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Modifiers:', canvasWidth / 2, 200);
    
    ctx.font = '18px Arial';
    let y = 240;
    for (const mod of challenge.modifiers) {
        const text = formatModifier(mod);
        ctx.fillStyle = getModifierColor(mod.type);
        ctx.fillText(text, canvasWidth / 2, y);
        y += 30;
    }
    
    // Rewards
    y += 20;
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Rewards:', canvasWidth / 2, y);
    y += 40;
    
    ctx.font = '18px Arial';
    for (const reward of challenge.rewards) {
        const icon = reward.type === 'corn' ? '🌽' : '⭐';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${icon} ${reward.amount} ${reward.type}`, canvasWidth / 2, y);
        y += 30;
    }
    
    // Streak info
    ctx.fillStyle = '#ff9500';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(`🔥 Streak: ${progress.currentStreak} days`, canvasWidth / 2, y + 40);
    ctx.font = '16px Arial';
    ctx.fillStyle = '#888888';
    ctx.fillText(`Longest: ${progress.longestStreak} days`, canvasWidth / 2, y + 70);
    
    // Play button
    if (!progress.completedToday) {
        drawButton(ctx, canvasWidth / 2 - 100, canvasHeight - 150, 200, 60, 'PLAY', '#44aa44');
    } else {
        ctx.fillStyle = '#666666';
        ctx.font = '20px Arial';
        ctx.fillText('✓ Completed Today!', canvasWidth / 2, canvasHeight - 120);
    }
}

function formatModifier(mod: ChallengeModifier): string {
    const names: Record<string, string> = {
        double_enemies: '⚠️ Double Enemies',
        half_chickens: '⚠️ Half Chickens',
        no_upgrades: '🚫 No Upgrades',
        speed_run: '⏱️ Speed Run',
        fast_enemies: '⚡ Fast Enemies',
        blind_gates: '❓ Blind Gates',
        one_lane: '📏 Single Lane',
        precision_mode: '🎯 Precision Mode'
    };
    return names[mod.type] || mod.type;
}

function getModifierColor(type: string): string {
    const hard = ['#ff4444', '#ff6666'];
    const medium = ['#ffaa00', '#ffcc00'];
    const easy = ['#44ff44', '#66ff66'];
    
    if (['double_enemies', 'half_chickens', 'no_upgrades'].includes(type)) {
        return hard[0];
    }
    if (['speed_run', 'fast_enemies', 'precision_mode'].includes(type)) {
        return medium[0];
    }
    return easy[0];
}

function getTimeRemaining(expiresAt: number): string {
    const now = Date.now();
    const diff = expiresAt - now;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
}

function drawButton(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, text: string, color: string): void {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(text, x + w / 2, y + h / 2 + 8);
}
```

### Step 5: Update Persistence

**File:** `src/platform/Persistence.ts`

```typescript
const CHALLENGE_KEY = 'chicken_mob_challenge';

export function saveChallengeProgress(progress: ChallengeProgress): void {
    localStorage.setItem(CHALLENGE_KEY, JSON.stringify(progress));
}

export function loadChallengeProgress(): ChallengeProgress {
    const stored = localStorage.getItem(CHALLENGE_KEY);
    if (stored) {
        return JSON.parse(stored);
    }
    return {
        currentChallengeId: null,
        completedToday: false,
        currentStreak: 0,
        longestStreak: 0,
        totalChallengesCompleted: 0,
        lastCompletionDate: null
    };
}

export function completeChallenge(challenge: DailyChallenge): ChallengeProgress {
    let progress = loadChallengeProgress();
    const today = formatDate(new Date());
    
    // Check if already completed today
    if (progress.lastCompletionDate === today) {
        return progress;
    }
    
    // Update streak
    const yesterday = formatDate(new Date(Date.now() - 86400000));
    if (progress.lastCompletionDate === yesterday) {
        progress.currentStreak++;
    } else if (progress.lastCompletionDate !== today) {
        progress.currentStreak = 1; // Reset streak
    }
    
    progress.longestStreak = Math.max(progress.longestStreak, progress.currentStreak);
    progress.totalChallengesCompleted++;
    progress.completedToday = true;
    progress.lastCompletionDate = today;
    progress.currentChallengeId = challenge.id;
    
    saveChallengeProgress(progress);
    return progress;
}

export function checkNewDay(): boolean {
    const progress = loadChallengeProgress();
    const today = formatDate(new Date());
    return progress.lastCompletionDate !== today;
}

export function resetDailyProgress(): void {
    const progress = loadChallengeProgress();
    progress.completedToday = false;
    progress.currentChallengeId = null;
    saveChallengeProgress(progress);
}
```

### Step 6: Integrate with Main Game

**File:** `src/main.ts`

```typescript
import { generateDailyChallenge } from '@/systems/ChallengeGenerator';
import { loadChallengeProgress, completeChallenge, checkNewDay, resetDailyProgress } from '@/platform/Persistence';
import type { DailyChallenge } from '@/data/types';

let currentChallenge: DailyChallenge | null = null;
let challengeMode = false;

function initChallenge(): void {
    const today = new Date();
    currentChallenge = generateDailyChallenge(today);
    
    // Check if it's a new day
    if (checkNewDay()) {
        resetDailyProgress();
    }
}

function startChallengeGame(): void {
    if (!currentChallenge) return;
    
    challengeMode = true;
    const level = getLevel(currentChallenge.levelId);
    
    // Initialize game state with challenge level
    initState(level);
    
    // Apply modifiers after initialization
    applyChallengeModifiers(state, currentChallenge);
}

function onChallengeComplete(): void {
    if (!currentChallenge || !challengeMode) return;
    
    const progress = completeChallenge(currentChallenge);
    
    // Award rewards
    for (const reward of currentChallenge.rewards) {
        if (reward.type === 'corn') {
            state.player.corn += reward.amount;
        }
    }
    
    // Save player state
    saveState(state.player);
    
    // Show completion screen
    showChallengeCompleteScreen(progress, currentChallenge.rewards);
}
```

---

## Testing Plan

### Unit Tests

**File:** `src/__tests__/challenge.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { generateDailyChallenge } from '@/systems/ChallengeGenerator';

describe('Daily Challenge System', () => {
    it('generates deterministic challenge for same date', () => {
        const date = new Date('2026-03-04');
        const challenge1 = generateDailyChallenge(date);
        const challenge2 = generateDailyChallenge(date);
        
        expect(challenge1.seed).toBe(challenge2.seed);
        expect(challenge1.modifiers).toEqual(challenge2.modifiers);
    });
    
    it('generates different challenges for different dates', () => {
        const date1 = new Date('2026-03-04');
        const date2 = new Date('2026-03-05');
        const challenge1 = generateDailyChallenge(date1);
        const challenge2 = generateDailyChallenge(date2);
        
        expect(challenge1.id).not.toBe(challenge2.id);
    });
    
    it('expires at end of day UTC', () => {
        const date = new Date('2026-03-04T12:00:00Z');
        const challenge = generateDailyChallenge(date);
        
        const endOfDay = new Date('2026-03-04T23:59:59.999Z').getTime();
        expect(challenge.expiresAt).toBe(endOfDay);
    });
    
    it('includes at least one modifier', () => {
        const challenge = generateDailyChallenge(new Date());
        expect(challenge.modifiers.length).toBeGreaterThanOrEqual(1);
    });
    
    it('includes rewards', () => {
        const challenge = generateDailyChallenge(new Date());
        expect(challenge.rewards.length).toBeGreaterThanOrEqual(1);
        expect(challenge.rewards.some(r => r.type === 'corn')).toBe(true);
    });
});

describe('Challenge Progress', () => {
    beforeEach(() => {
        localStorage.clear();
    });
    
    it('tracks streak correctly', () => {
        const challenge = generateDailyChallenge(new Date());
        const progress = completeChallenge(challenge);
        
        expect(progress.currentStreak).toBe(1);
        expect(progress.completedToday).toBe(true);
    });
    
    it('does not increment streak twice in same day', () => {
        const challenge = generateDailyChallenge(new Date());
        completeChallenge(challenge);
        const progress = completeChallenge(challenge);
        
        expect(progress.currentStreak).toBe(1);
    });
});
```

### Manual Testing

1. Open game, verify daily challenge appears
2. Play challenge, complete it
3. Verify rewards added to player
4. Verify streak incremented
5. Change system date to tomorrow, verify new challenge
6. Complete new challenge, verify streak continues
7. Skip a day, verify streak resets

---

## Modifier Reference

| Modifier | Effect | Difficulty | Visual Indicator |
|----------|--------|------------|------------------|
| double_enemies | Enemy count x2 | Hard | Red skull icon |
| half_chickens | Chicken count /2 | Hard | Red chicken icon |
| no_upgrades | Disable upgrades | Medium | Locked icon |
| speed_run | 30 second limit | Medium | Timer icon |
| fast_enemies | Enemy speed x1.5 | Medium | Lightning icon |
| blind_gates | Hide multipliers | Easy | Question mark |
| one_lane | Only lane 0 active | Easy | Single arrow |
| precision_mode | Smaller gate hitboxes | Medium | Target icon |

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/data/types.ts` | Modify | Add challenge types |
| `src/systems/ChallengeGenerator.ts` | Create | Challenge generation logic |
| `src/core/Simulation.ts` | Modify | Apply modifiers to game state |
| `src/ui/ChallengeScreen.ts` | Create | Challenge UI rendering |
| `src/platform/Persistence.ts` | Modify | Save/load challenge progress |
| `src/main.ts` | Modify | Integrate challenge system |
| `src/__tests__/challenge.test.ts` | Create | Unit tests |

---

## Estimated Effort

- **Types & Generator:** 2 hours
- **Simulation Modifiers:** 1 hour
- **UI Implementation:** 2 hours
- **Persistence:** 1 hour
- **Integration:** 1 hour
- **Testing:** 2 hours

**Total:** 9 hours

---

## Status

- [ ] Define challenge types in types.ts
- [ ] Create ChallengeGenerator.ts
- [ ] Add modifier application to Simulation.ts
- [ ] Create ChallengeScreen.ts UI
- [ ] Update Persistence.ts
- [ ] Integrate with main.ts
- [ ] Write unit tests
- [ ] Manual testing
- [ ] Balance tuning

---

*Created: 2026-03-04*
