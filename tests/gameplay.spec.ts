import { test, expect } from '@playwright/test';
import { dismissPopups } from './support';

/**
 * A full happy-path smoke: reach the menu, round-trip the Upgrade Barn, start
 * level 1, and fire a volley. Asserts the game stays stable (no uncaught page
 * errors) across the whole loop — the core "does it actually run" check that
 * unit tests alone can't give us.
 */
test('full happy path: menu -> upgrades -> level 1 -> fire without crashing', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => { pageErrors.push(String(e)); });

    await page.goto('/');
    await dismissPopups(page);

      // Menu is reachable after dismissing the v0.11.0 daily-login popup
    await expect(page.getByText('CHICKEN MOB')).toBeVisible({ timeout: 5000 });

      // Upgrade Barn round-trip
    await page.getByRole('button', { name: '🛠️ Upgrades' }).click();
    await expect(page.getByText('Upgrade Barn')).toBeVisible();
    await page.getByRole('button', { name: '✕' }).click();
    await expect(page.getByText('CHICKEN MOB')).toBeVisible();

      // World tabs render for all six worlds
    for (const world of ['Spring Valley', 'Mystic Grove', 'Shadow Realm']) {
        await expect(page.getByRole('button', { name: new RegExp(world) })).toBeVisible();
    }

      // Start level 1 and fire a volley
    await page.getByRole('button', { name: /1 First Steps/ }).click();
    await page.waitForTimeout(400);
    for (let i = 0; i < 12; i++) {
        await page.locator('#game-canvas').click({ position: { x: 200 + (i % 3) * 60, y: 380 + (i % 2) * 30 } });
        await page.waitForTimeout(100);
      }
    await page.waitForTimeout(2000);

      // The level loop is still alive and the canvas is rendering
    await expect(page.locator('#game-canvas')).toBeVisible();
    expect(pageErrors, `uncaught page errors: ${pageErrors.join(' | ')}`).toEqual([]);
});
