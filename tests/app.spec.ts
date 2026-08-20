import { test, expect } from '@playwright/test';
import { dismissPopups } from './support';

const W1_LEVEL_NAMES = [
     'First Steps', 'Double Up', 'Big Boost', 'Crossroads', 'Fox Alert', 'Trap Door',
     'Fox Brute', 'Hay Day', 'Scarecrow Alley', 'Three Ways', 'Fork', 'Gauntlet',
     'Sniper Den', 'Mixed Bag', 'Pressure Cooker', 'The Wall', 'Swarm', 'Henhouse Siege',
];

test('menu renders and opens upgrades', async ({ page }) => {
    await page.goto('/');
    await dismissPopups(page);
    await expect(page.getByText('CHICKEN MOB')).toBeVisible();
    await page.getByRole('button', { name: '🛠️ Upgrades' }).click();
    await expect(page.getByText('Upgrade Barn')).toBeVisible();
    await page.getByRole('button', { name: '✕' }).click();
    await expect(page.getByText('CHICKEN MOB')).toBeVisible();
});

test('can start level and fire', async ({ page }) => {
    await page.goto('/');
    await dismissPopups(page);

      // Level 1 button: "🐔 1 First Steps" (Playwright collapses the newlines)
    await page.getByRole('button', { name: /1 First Steps/ }).click();
    await page.waitForTimeout(500);

    await page.locator('#game-canvas').click();
    await page.waitForTimeout(500);
    await expect(page.locator('#game-canvas')).toBeVisible();
});

test('all 18 levels of the first world render in the menu', async ({ page }) => {
    await page.goto('/');
    await dismissPopups(page);

    for (const name of W1_LEVEL_NAMES) {
        const btn = page.getByRole('button', { name: new RegExp(name, 'i') });
        await expect(btn).toBeVisible();
     }
});

test('coop modal opens', async ({ page }) => {
    await page.goto('/');
    await dismissPopups(page);
    await page.getByRole('button', { name: '🏠 Coop' }).click();
    await expect(page.getByText('Chicken Coop')).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
});
