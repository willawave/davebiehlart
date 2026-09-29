import { expect, test } from '@playwright/test';
import { ADMIN, signInWithGoogle } from './helpers';

// Regression: a media date picked east of UTC was saved as local midnight, the previous UTC
// day, and the website (which shows dates in UTC) showed it a day early.
// Found by /codex:review on 2026-09-29
//
// Media dates are saved as the picked day at UTC midnight and shown in UTC everywhere.
// Checked east of UTC, and on older seed items saved at Nebraska midnight.
test.use({ timezoneId: 'Europe/Berlin' });

// One sign-in at a time (see auth.e2e.ts).
test.describe.configure({ mode: 'default' });

test('a media date picked east of UTC keeps its day', async ({ page }) => {
  await page.goto('/');
  await signInWithGoogle(page, ADMIN);
  await page.route(/i\.ytimg\.com/, (route) => route.abort());
  await page.goto('/media');
  // Seeded at Nebraska midnight (05:00Z), still on its own day.
  await expect(page.getByRole('row', { name: /On Air at the Foundry/ })).toContainText(
    'Sep 12, 2026',
  );

  await page.getByRole('link', { name: 'Add media' }).click();
  await page.getByRole('textbox', { name: 'Link' }).fill('https://example.com/e2e-berlin');
  await page.getByLabel('Title').fill('E2E Berlin Date');
  await page.getByLabel('Description').fill('Made by the admin E2E suite.');
  await page.getByLabel('Date').fill('9/12/2026');
  await page.getByRole('checkbox', { name: 'Visible on the website' }).uncheck();
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page).toHaveURL('/media');
  const row = page.getByRole('row', { name: /E2E Berlin Date/ });
  await expect(row).toContainText('Sep 12, 2026');

  // The edit form starts from the same day.
  await page.getByRole('link', { name: 'Edit E2E Berlin Date' }).click();
  await expect(page.getByRole('textbox', { name: 'Date' })).toHaveValue('9/12/2026');
  await page.getByRole('button', { name: 'Cancel' }).click();

  await page.getByRole('button', { name: 'Delete E2E Berlin Date' }).click();
  await page
    .getByRole('dialog', { name: 'Delete "E2E Berlin Date"?' })
    .getByRole('button', { name: 'Delete' })
    .click();
  await expect(row).toHaveCount(0);
});
