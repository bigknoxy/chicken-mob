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
    const levelButton = page.getByRole('button', { name: /First Flock/ });
    await levelButton.click();
    await page.waitForTimeout(500);
    await page.mouse.click(640, 600);
    await page.waitForTimeout(500);
    await expect(page.locator('#game-canvas')).toBeVisible();
});

test('coop modal opens', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Coop' }).click();
    await expect(page.getByText('Chicken Coop')).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
});
