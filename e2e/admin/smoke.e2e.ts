import { expect, test } from '@playwright/test';

test('the sign-in page renders', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Sign In');
});
