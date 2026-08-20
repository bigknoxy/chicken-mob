import { test, expect } from '@playwright/test';
import { dismissPopups } from './support';

/**
 * P1-1b — Daily Challenge, verified in a REAL browser.
 *
 * Unit tests prove the engine (determinism, idempotency, streaks, the pure
 * modifier transform). These Playwright tests prove the *plumbing is live*:
 * the challenge actually renders on the menu, clicking PLAY starts a real game,
 * the engine's modifiers are actually applied to that game, and the day's
 * challenge is deterministic across reloads. This is the "does it actually
 * work end-to-end" check that unit tests alone can't give.
 */

test('daily challenge card renders on the menu with today\u2019s challenge', async ({ page }) => {
     const pageErrors: string[] = [];
     page.on('pageerror', (e) => { pageErrors.push(String(e)); });

     await page.goto('/');
     await dismissPopups(page);
     await expect(page.getByText('CHICKEN MOB')).toBeVisible({ timeout: 5000 });

       // The retention hook is visible on the main menu
    await expect(page.locator('#daily-challenge-card')).toBeVisible();
    await expect(page.getByText('DAILY CHALLENGE')).toBeVisible();
    await expect(page.getByText(/Streak:/)).toBeVisible();

       // Today\u2019s challenge is exposed for inspection (benign data attribute)
    const cmToday = await page.getAttribute('body', 'data-cm-today');
    expect(cmToday).toBeTruthy();
     const mods = JSON.parse(cmToday as string).modifiers as string[];
     expect(mods.length).toBeGreaterThan(0);

       // No uncaught errors while the challenge card is on screen
    expect(pageErrors).toEqual([]);
 });

 test('clicking PLAY starts a real game with the modifiers applied', async ({ page }) => {
      const pageErrors: string[] = [];
     page.on('pageerror', (e) => { pageErrors.push(String(e)); });

      await page.goto('/');
      await dismissPopups(page);
      await expect(page.getByText('CHICKEN MOB')).toBeVisible({ timeout: 5000 });

       // The PLAY affordance is present and enabled on a fresh profile
    const playBtn = page.locator('#daily-challenge-play');
    await expect(playBtn).toBeVisible();
    await expect(playBtn).toBeEnabled();

       // Start the challenge — the menu is replaced by the live game
    await playBtn.click();
    await page.waitForTimeout(500);

    await expect(page.locator('#game-canvas')).toBeVisible();

       // The engine\u2019s modifiers were actually applied to the running game
     const applied = await page.getAttribute('body', 'data-cm-applied');
     expect(applied).toBeTruthy();
      const appliedMods = JSON.parse(applied as string) as string[];
     expect(appliedMods.length).toBeGreaterThan(0);

    // A bit of play without a crash
    for (let i = 0; i < 6; i++) {
         await page.locator('#game-canvas').click({ position: { x: 160 + (i % 3) * 50, y: 360 + (i % 2) * 30 } });
          await page.waitForTimeout(100);
        }
    await page.waitForTimeout(800);
    await expect(page.locator('#game-canvas')).toBeVisible();
    expect(pageErrors, `uncaught page errors: ${pageErrors.join(' | ')}`).toEqual([]);
 });

 test('today\u2019s challenge is deterministic across reloads (same UTC day)', async ({ page, context }) => {
     await page.goto('/');
     await dismissPopups(page);
     await expect(page.getByText('CHICKEN MOB')).toBeVisible({ timeout: 5000 });
     const first = JSON.parse((await page.getAttribute('body', 'data-cm-today') as string) || '{}');

        // A fresh context / re-navigation on the same clock yields the same challenge
    await context.clearCookies();
    await page.reload();
     await page.waitForTimeout(500);
    await dismissPopups(page);
     await expect(page.getByText('CHICKEN MOB')).toBeVisible();
    const second = JSON.parse((await page.getAttribute('body', 'data-cm-today') as string) || '{}');

    expect(first.id).toBeTruthy();
     expect(first.id).toBe(second.id);
     expect(JSON.stringify(first.modifiers)).toBe(JSON.stringify(second.modifiers));
 });
