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
    const levelButton = page.getByRole('button', { name: '1' });
    await levelButton.click();
    await page.waitForTimeout(500);
    
    // Click canvas to fire chickens
    await page.locator('#game-canvas').click();
    await page.waitForTimeout(500);
    await expect(page.locator('#game-canvas')).toBeVisible();
});

test('all 18 levels displayed in menu', async ({ page }) => {
    await page.goto('/');
    for (let i = 1; i <= 18; i++) {
        const btn = page.getByRole('button', { name: String(i) });
        await expect(btn).toBeVisible();
    }
});

test('coop modal opens', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Coop' }).click();
    await expect(page.getByText('Chicken Coop')).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
});
