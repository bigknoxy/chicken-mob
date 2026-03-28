/**
 * DailyLoginSystem — Manages daily login streaks and rewards.
 *
 * 7-day cycle with escalating rewards:
 * Day 1: 100 corn
 * Day 2: 150 corn
 * Day 3: 200 corn
 * Day 4: 300 corn
 * Day 5: 500 corn
 * Day 6: 750 corn
 * Day 7: 1000 corn + 1 golden feather (jackpot!)
 *
 * After Day 7, the cycle resets to Day 1.
 */

import type { PlayerState, DailyLoginState } from '@/data/types';

export const DAILY_REWARDS = [
    { corn: 100, feathers: 0 },   // Day 1
    { corn: 150, feathers: 0 },   // Day 2
    { corn: 200, feathers: 0 },   // Day 3
    { corn: 300, feathers: 0 },   // Day 4
    { corn: 500, feathers: 0 },   // Day 5
    { corn: 750, feathers: 0 },   // Day 6
    { corn: 1000, feathers: 1 },  // Day 7 (jackpot!)
] as const;

export const MAX_STREAK_DAYS = 7;

function getTodayDate(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getYesterdayDate(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
}

export function getDailyLoginState(playerState: PlayerState): DailyLoginState {
    return playerState.dailyLogin ?? {
        lastLoginDate: '',
        consecutiveDays: 0,
        totalDaysLoggedIn: 0,
        rewardsClaimedToday: false,
    };
}

export function shouldShowDailyLogin(playerState: PlayerState): boolean {
    const login = getDailyLoginState(playerState);
    const today = getTodayDate();
    
    if (login.lastLoginDate === today && login.rewardsClaimedToday) {
        return false;
    }
    
    return true;
}

export interface DailyLoginInfo {
    consecutiveDays: number;
    reward: { corn: number; feathers: number };
    isStreakBroken: boolean;
    isNewDay: boolean;
}

export function checkDailyLogin(playerState: PlayerState): DailyLoginInfo {
    const login = getDailyLoginState(playerState);
    const today = getTodayDate();
    const yesterday = getYesterdayDate();
    
    let consecutiveDays = login.consecutiveDays;
    let isStreakBroken = false;
    let isNewDay = false;
    
    if (login.lastLoginDate === '') {
        consecutiveDays = 1;
        isNewDay = true;
    } else if (login.lastLoginDate === today) {
        // Same day, no change to streak
        isNewDay = false;
    } else if (login.lastLoginDate === yesterday) {
        // Consecutive day - increment streak, reset after day 7
        const nextDay = login.consecutiveDays + 1;
        consecutiveDays = nextDay > MAX_STREAK_DAYS ? 1 : nextDay;
        isNewDay = true;
    } else {
        // Streak broken - reset to day 1
        consecutiveDays = 1;
        isStreakBroken = true;
        isNewDay = true;
    }
    
    const dayIndex = Math.max(0, Math.min(consecutiveDays - 1, DAILY_REWARDS.length - 1));
    const reward = DAILY_REWARDS[dayIndex];
    
    return {
        consecutiveDays,
        reward,
        isStreakBroken,
        isNewDay,
    };
}

export function claimDailyReward(playerState: PlayerState): { corn: number; feathers: number; consecutiveDays: number } | null {
    const login = getDailyLoginState(playerState);
    const today = getTodayDate();
    
    if (login.lastLoginDate === today && login.rewardsClaimedToday) {
        return null;
    }
    
    const info = checkDailyLogin(playerState);
    
    playerState.dailyLogin = {
        lastLoginDate: today,
        consecutiveDays: info.consecutiveDays,
        totalDaysLoggedIn: login.totalDaysLoggedIn + (info.isNewDay ? 1 : 0),
        rewardsClaimedToday: true,
    };
    
    playerState.currencies.corn += info.reward.corn;
    playerState.currencies.golden_feather += info.reward.feathers;
    playerState.totalCornEarned += info.reward.corn;
    
    return {
        corn: info.reward.corn,
        feathers: info.reward.feathers,
        consecutiveDays: info.consecutiveDays,
    };
}

export function getTomorrowReward(): { corn: number; feathers: number } {
    return DAILY_REWARDS[0]; // Day 1 reward (after cycle reset)
}

export function getNextDayReward(currentDay: number): { corn: number; feathers: number } {
    const nextDay = currentDay >= MAX_STREAK_DAYS ? 1 : currentDay + 1;
    return DAILY_REWARDS[nextDay - 1];
}
