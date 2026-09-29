import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// The emulator seed's schedule: Mon–Thu 10–6, Fri–Sat 10–7, Sunday closed. The admin suite
// runs alongside and briefly opens Sunday and sets a special message, so this checks only
// the weekday rows.

test('the contact page shows the gallery hours, rendered on the server', async ({
  page,
  request,
}) => {
  const response = await request.get('/contact');
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('Visit the gallery');
  expect(html).toContain('10 AM – 6 PM');

  await page.goto('/contact');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Contact');
  await expect(page.getByRole('heading', { name: 'Visit the gallery' })).toBeVisible();
  await expect(page.locator('address')).toContainText('2610 North Main Street');

  const hours = page.getByRole('definition');
  await expect(page.getByRole('term').filter({ hasText: 'Mon – Thu' })).toBeVisible();
  await expect(hours.filter({ hasText: '10 AM – 6 PM' })).toHaveCount(1);
  await expect(page.getByRole('term').filter({ hasText: 'Fri – Sat' })).toBeVisible();
  await expect(hours.filter({ hasText: '10 AM – 7 PM' })).toHaveCount(1);
  await expect(page.locator('.kicker')).toHaveText(/^(Open today, .+ – .+|Closed today)$/);
  await expect(page.locator('.hours .today')).toHaveCount(1);

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});
