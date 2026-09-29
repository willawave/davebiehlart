import { expect, test } from '@playwright/test';
import { ADMIN, signInWithGoogle } from './helpers';

// Regression: ISSUE-001 — seeded winter events showed a day early in the admin table
// Found by /qa on 2026-09-29
// Report: .gstack/qa-reports/run-20260929T150431Z/qa-report-localhost-2026-09-29.md
//
// Seed dates must be midnight in Nebraska, as the admin's datepicker saves them: 06:00 UTC
// in winter (CST), not the 05:00 UTC of summer (CDT). Checked in Nebraska's time zone,
// where the admin works.
test.use({ timezoneId: 'America/Chicago' });

test('seeded winter events read on their own day in Nebraska', async ({ page }) => {
  await page.goto('/');
  await signInWithGoogle(page, ADMIN);
  await page.goto('/events');
  await expect(page.getByRole('row', { name: /Holiday Studio Sale/ })).toContainText('Dec 6, 2025');
  await expect(page.getByRole('row', { name: /Winter Glass Workshop/ })).toContainText(
    'Feb 15, 2025',
  );
  await expect(page.getByRole('row', { name: /Draft Studio Tour/ })).toContainText('Jan 10, 2026');
  // A summer date, unchanged.
  await expect(page.getByRole('row', { name: /Fall Open Studio/ })).toContainText('Sep 12, 2026');
});
