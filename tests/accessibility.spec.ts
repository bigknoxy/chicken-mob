import { test, expect } from '@playwright/test';
import { dismissPopups } from './support';

/**
 * P1-5a — reduced-motion accessibility, verified in a REAL browser.
 *
 * The unit tests prove the accessibility module's *logic* (NoOp contract, DOM
 * inject/remove, migration-safe settings). These E2E tests prove the *wiring is
 * live end-to-end*: the boot seam actually reads the OS `prefers-reduced-motion`
 * signal and injects the neutralizing style, and the in-game Settings screen
 * exposes the toggle.
 */

test('boot injects the reduced-motion style when the OS prefers reduced motion', async ({ browser }) => {
    const pageErrors: string[] = [];
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', (e) => { pageErrors.push(String(e)); });

     // Simulate a saved profile first, then a fresh boot that must pick up the OS signal.
    await context.clearCookies();
    await page.goto('/');
    await dismissPopups(page);
    await expect(page.getByText('CHICKEN MOB')).toBeVisible({ timeout: 5000 });

        // The boot seam should have run applyReducedMotion(true) → neutralizing block injected.
    await expect(page.locator('#cm-reduced-motion')).toHaveCount(1);
    expect(pageErrors, `uncaught page errors: ${pageErrors.join(' | ')}`).toEqual([]);
    await context.close();
 });

 test('booting WITHOUT reduced-motion does NOT inject the style (control / teeth)', async ({ browser }) => {
     // No reduced-motion emulation → the default is 'no-preference' → no injection.
    const context = await browser.newContext({ reducedMotion: 'no-preference' });
    const page = await context.newPage();

    await context.clearCookies();
    await page.goto('/');
    await dismissPopups(page);
    await expect(page.getByText('CHICKEN MOB')).toBeVisible({ timeout: 5000 });

        // Control: `#cm-reduced-motion` only exists when the signal fired, so its absence
        // here confirms the test above is not a false positive.
    await expect(page.locator('#cm-reduced-motion')).toHaveCount(0);
    await context.close();
 });

 test('the in-game Settings screen exposes the Reduced Motion toggle', async ({ page }) => {
     await page.goto('/');
    await dismissPopups(page);
    await expect(page.getByText('CHICKEN MOB')).toBeVisible({ timeout: 5000 });

        // The Settings entry is on the in-game HUD — start a level to surface it.
    await page.getByRole('button', { name: /1 First Steps/ }).click();
    await page.waitForTimeout(400);

    await page.getByRole('button', { name: /⚙️/ }).click();
    await expect(page.getByText('⚙️ Settings')).toBeVisible();
    await expect(page.getByText(/Reduced Motion/)).toBeVisible();
    await expect(page.getByText('Sound Effects')).toBeVisible();
 });
