import { expect, test } from '@playwright/test';

test('the sign-in page renders', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Sign In');
});

test('the admin app asks search engines not to index it', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});
