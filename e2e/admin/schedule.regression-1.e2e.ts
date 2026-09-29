import { expect, test } from '@playwright/test';
import { ADMIN, signInWithGoogle } from './helpers';

// Regression: ISSUE-001 — the special message field was squeezed to the time inputs' 150px,
// its hint running into the "Weekly hours" legend. ISSUE-002 — on a phone the whole page
// scrolled sideways: a fieldset is as wide as its content, so the hours table never scrolled
// inside its own box.
// Found by /qa on 2026-09-29
// Report: .gstack/qa-reports/run-20260929T221229Z/qa-report-localhost-2026-09-29.md

// One sign-in at a time (see auth.e2e.ts).
test.describe.configure({ mode: 'default' });

test('the schedule form fits its fields, on a desktop and on a phone', async ({ page }) => {
  await page.goto('/');
  await signInWithGoogle(page, ADMIN);
  await page.goto('/schedule');
  const message = page.getByRole('textbox', { name: 'Special message' });
  await expect(message).toBeVisible();

  // The whole outlined field, not just the input inside its padding.
  const field = page.locator('mat-form-field').filter({ has: message });
  const width = async () => (await field.boundingBox())?.width ?? 0;
  expect(await width()).toBeGreaterThan(400);

  await page.setViewportSize({ width: 375, height: 812 });
  const overflow = () =>
    page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
  await expect.poll(overflow).toBe(0);
  // The table scrolls inside its box instead.
  const scroller = page.locator('.scroll');
  expect(await scroller.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  // The message still fills its fieldset.
  const room = await page
    .locator('fieldset')
    .first()
    .evaluate((el) => {
      const style = getComputedStyle(el);
      return el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    });
  expect(await width()).toBeGreaterThanOrEqual(room - 1);
});
