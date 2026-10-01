import { Page, expect, test } from '@playwright/test';

// On iPhones, iOS quietly kills long-lived connections when the phone locks, a tab goes to the
// background, or the network changes. web therefore reads Firestore with one-off requests (the
// lite SDK), and if a read still stalls, loads the page from the server instead of hanging.
const FIRESTORE = '**/v1/projects/*/databases/**';

async function silenceFirestore(page: Page): Promise<void> {
  // Never answered: requests just hang, like a connection iOS dropped without telling anyone.
  await page.route(FIRESTORE, () => undefined);
}

test.use({ viewport: { width: 390, height: 844 } });

test('taps read Firestore with one-off requests, never a long-lived listen connection', async ({
  page,
}) => {
  const firestore: string[] = [];
  page.on('request', (request) => {
    if (/googleapis\.com|127\.0\.0\.1:8080|localhost:8080/.test(request.url())) {
      firestore.push(request.url());
    }
  });
  await page.goto('/bronzes');
  await page.getByRole('link', { name: /Mustang at Dawn/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Mustang at Dawn' })).toBeVisible();
  await page.goBack();
  await page.getByRole('link', { name: /Saddle Bronc Rider/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Saddle Bronc Rider' })).toBeVisible();

  expect(firestore.length).toBeGreaterThan(0);
  expect(firestore.filter((url) => url.includes('/Listen/channel'))).toEqual([]);
});

test('a detail page still opens when Firestore stops answering', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/bronzes');
  // One tap that works opens the browser's Firestore connection.
  await page.getByRole('link', { name: /Mustang at Dawn/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Mustang at Dawn' })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: 'Bronzes' })).toBeVisible();

  await silenceFirestore(page);
  await page.getByRole('link', { name: /Saddle Bronc Rider/ }).click();

  await expect(page.getByRole('heading', { level: 1, name: 'Saddle Bronc Rider' })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page).toHaveURL('/bronzes/seed-bronze-05');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toHaveCount(0);
});

test('a list page still loads when Firestore stops answering', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/bronzes');
  await expect(page.getByRole('heading', { level: 1, name: 'Bronzes' })).toBeVisible();

  await silenceFirestore(page);
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page
    .getByRole('navigation', { name: 'Menu' })
    .getByRole('link', { name: 'Kiln Glass' })
    .click();

  await expect(page).toHaveURL('/glass');
  await expect(page.locator('main a.card').first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Loading…')).toHaveCount(0);
});
