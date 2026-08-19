import type { Page } from '@playwright/test';

/**
 * Fresh profiles (empty localStorage) boot into the v0.11.0 daily-login popup
 * — and optionally the offline-earnings popup — which overlay the main menu.
 * Dismiss both so menu-level assertions are deterministic. Safe to call when
 * neither popup is present.
 */
export async function dismissPopups(page: Page): Promise<void> {
    const dailyLogin = page.getByRole('button', { name: 'Claim Reward!' });
    if (await dailyLogin.isVisible({ timeout: 1500 }).catch(() => false)) {
        await dailyLogin.click();
        await page.waitForTimeout(300);
     }

    const offline = page.getByRole('button', { name: 'Claim!' });
    if (await offline.isVisible({ timeout: 1000 }).catch(() => false)) {
        await offline.click();
        await page.waitForTimeout(300);
     }
}
