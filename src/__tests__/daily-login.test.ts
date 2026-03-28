import { describe, it, expect } from 'vitest';
import {
    DAILY_REWARDS,
    shouldShowDailyLogin,
    checkDailyLogin,
    claimDailyReward,
    getNextDayReward,
} from '@/systems/DailyLoginSystem';
import type { PlayerState } from '@/data/types';

function createMockPlayerState(overrides: Partial<PlayerState> = {}): PlayerState {
    return {
        currencies: { corn: 0, golden_feather: 0 },
        ownedChickens: ['clucky'],
        ownedBarnCannons: ['barn_basic'],
        equippedCannonId: 'barn_basic',
        equippedChickenId: 'clucky',
        upgrades: {},
        currentWorld: 'W1',
        currentLevel: 0,
        unlockedLevels: 1,
        worldsUnlocked: ['W1'],
        worldsCompleted: [],
        coop: { cornPerSecond: 1.0, offlineCapSeconds: 14400 },
        lastSessionTimestamp: Date.now(),
        totalCornEarned: 0,
        totalLevelsCompleted: 0,
        levelStars: {},
        endlessHighScore: 0,
        ...overrides,
    };
}

describe('DailyLoginSystem', () => {
    describe('DAILY_REWARDS', () => {
        it('should have 7 days of rewards', () => {
            expect(DAILY_REWARDS.length).toBe(7);
        });

        it('should have escalating corn rewards', () => {
            for (let i = 1; i < DAILY_REWARDS.length; i++) {
                expect(DAILY_REWARDS[i].corn).toBeGreaterThan(DAILY_REWARDS[i - 1].corn);
            }
        });

        it('should give golden feather only on day 7', () => {
            for (let i = 0; i < 6; i++) {
                expect(DAILY_REWARDS[i].feathers).toBe(0);
            }
            expect(DAILY_REWARDS[6].feathers).toBe(1);
        });
    });

    describe('shouldShowDailyLogin', () => {
        it('should return true for new players', () => {
            const state = createMockPlayerState();
            expect(shouldShowDailyLogin(state)).toBe(true);
        });

        it('should return false if already claimed today', () => {
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            
            const state = createMockPlayerState({
                dailyLogin: {
                    lastLoginDate: todayStr,
                    consecutiveDays: 1,
                    totalDaysLoggedIn: 1,
                    rewardsClaimedToday: true,
                },
            });
            
            expect(shouldShowDailyLogin(state)).toBe(false);
        });
    });

    describe('checkDailyLogin', () => {
        it('should start at day 1 for new players', () => {
            const state = createMockPlayerState();
            const info = checkDailyLogin(state);
            
            expect(info.consecutiveDays).toBe(1);
            expect(info.reward.corn).toBe(100);
            expect(info.isStreakBroken).toBe(false);
            expect(info.isNewDay).toBe(true);
        });

        it('should return correct reward for day 7', () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
            
            const state = createMockPlayerState({
                dailyLogin: {
                    lastLoginDate: yesterdayStr,
                    consecutiveDays: 6,
                    totalDaysLoggedIn: 6,
                    rewardsClaimedToday: false,
                },
            });
            
            const info = checkDailyLogin(state);
            expect(info.consecutiveDays).toBe(7);
            expect(info.reward.corn).toBe(1000);
            expect(info.reward.feathers).toBe(1);
        });
    });

    describe('claimDailyReward', () => {
        it('should add corn to player state', () => {
            const state = createMockPlayerState();
            const result = claimDailyReward(state);
            
            expect(result).not.toBeNull();
            expect(result!.corn).toBe(100);
            expect(state.currencies.corn).toBe(100);
        });

        it('should return null if already claimed today', () => {
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            
            const state = createMockPlayerState({
                dailyLogin: {
                    lastLoginDate: todayStr,
                    consecutiveDays: 1,
                    totalDaysLoggedIn: 1,
                    rewardsClaimedToday: true,
                },
            });
            
            const result = claimDailyReward(state);
            expect(result).toBeNull();
        });

        it('should set rewardsClaimedToday to true', () => {
            const state = createMockPlayerState();
            claimDailyReward(state);
            
            expect(state.dailyLogin?.rewardsClaimedToday).toBe(true);
        });
    });

    describe('getNextDayReward', () => {
        it('should return day 2 reward after day 1', () => {
            const reward = getNextDayReward(1);
            expect(reward.corn).toBe(150);
        });

        it('should reset to day 1 after day 7', () => {
            const reward = getNextDayReward(7);
            expect(reward.corn).toBe(100);
        });
    });
});
