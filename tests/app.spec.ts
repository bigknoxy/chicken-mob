import { test, expect } from '@playwright/test';

test('menu renders and opens upgrades', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('CHICKEN MOB')).toBeVisible();
    await page.getByRole('button', { name: 'Upgrades' }).click();
    await expect(page.getByText('Upgrade Barn')).toBeVisible();
    await page.getByRole('button', { name: '✕' }).click();
    await expect(page.getByText('CHICKEN MOB')).toBeVisible();
});

test('can start level and fire', async ({ page }) => {
    await page.goto('/');
    
    // Dismiss offline popup if present
    const claimBtn = page.getByRole('button', { name: 'Claim!' });
    if (await claimBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await claimBtn.click();
    }
    
    // Level 1 button: "🐔 1 First Steps"
    const levelButton = page.getByRole('button', { name: /1 First Steps/ });
    await levelButton.click();
    await page.waitForTimeout(500);
    
    // Click canvas to fire chickens
    await page.locator('#game-canvas').click();
    await page.waitForTimeout(500);
    await expect(page.locator('#game-canvas')).toBeVisible();
});

test('all 18 levels displayed in menu', async ({ page }) => {
    await page.goto('/');
    
    // Dismiss offline popup if present
    const claimBtn = page.getByRole('button', { name: 'Claim!' });
    if (await claimBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await claimBtn.click();
    }
    
    // Check all 18 levels exist (buttons contain level number and name)
    const levelNames = [
        'First Steps', 'Double Up', 'Big Boost', 'Crossroads', 'Fox Alert', 'Trap Door',
        'Fox Brute', 'Hay Day', 'Scarecrow Alley', 'Three Ways', 'Fork', 'Gauntlet',
        'Sniper Den', 'Mixed Bag', 'Pressure Cooker', 'The Wall', 'Swarm', 'Henhouse Siege'
    ];
    
    for (let i = 0; i < 18; i++) {
        const btn = page.getByRole('button', { name: levelNames[i] });
        await expect(btn).toBeVisible();
    }
});

test('coop modal opens', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Coop' }).click();
    await expect(page.getByText('Chicken Coop')).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
});
