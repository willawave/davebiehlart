import { Page, expect, test } from '@playwright/test';
import { ADMIN, expectNoAxeViolations, signInWithGoogle } from './helpers';

// Runs against the emulator seed: 13 statues, one of them hidden. The statue this test
// creates stays hidden, so it never changes what the web suite sees on /statues.
const FIXTURE = 'e2e/fixtures/sculpture.jpg';
const SEEDED_STATUES = 13;

// One sign-in at a time (see auth.e2e.ts).
test.describe.configure({ mode: 'default' });

// No OpenStreetMap tiles: the map still takes clicks, and the test stays offline-safe.
// Routed only after sign-in: request routing stalls the Auth emulator's relay iframe.
function blockTiles(page: Page) {
  return page.route(/tile\.openstreetmap\.org/, (route) => route.abort());
}

test('an admin adds, edits and deletes a statue, setting its place on the map', async ({
  page,
  request,
}) => {
  await page.goto('/');
  await signInWithGoogle(page, ADMIN);
  await blockTiles(page);
  await page
    .getByRole('navigation', { name: 'Manage' })
    .getByRole('link', { name: 'Statues' })
    .click();
  await expect(page).toHaveURL('/statues');
  await expect(page.getByRole('heading', { name: 'Statues' })).toBeFocused();
  const rows = page.locator('tr[mat-row]');
  await expect(rows).toHaveCount(SEEDED_STATUES);
  await expect(page.getByRole('row', { name: /Unfinished Study/ })).toContainText('Hidden');
  await expectNoAxeViolations(page);

  // Add: an empty form says what is missing instead of saving.
  await page.getByRole('link', { name: 'Add statue' }).click();
  await expect(page).toHaveURL('/statues-add');
  await expect(page.getByRole('heading', { name: 'Add statue' })).toBeFocused();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Enter a name.')).toBeVisible();
  await expect(page.getByText('Upload at least one photo.')).toBeVisible();

  const latitude = page.getByLabel('Latitude');
  const longitude = page.getByLabel('Longitude');
  // A new statue starts at the studio.
  await expect(latitude).toHaveValue(/^41\.28/);
  await expect(page.getByLabel('City')).toHaveValue('Elkhorn');

  // Clicking the map moves the pin, and the coordinates follow.
  const map = page.getByRole('region', { name: 'Statue location map' });
  await expect(map.locator('.ol-viewport')).toBeVisible();
  const box = await map.boundingBox();
  if (!box) throw new Error('map has no box');
  const before = await longitude.inputValue();
  await page.mouse.click(box.x + box.width * 0.85, box.y + box.height * 0.3);
  await expect(longitude).not.toHaveValue(before);
  const clicked = {
    latitude: Number(await latitude.inputValue()),
    longitude: Number(await longitude.inputValue()),
  };
  expect(clicked.longitude).toBeGreaterThan(Number(before));
  expect(clicked.latitude).toBeGreaterThan(41.2828);

  await page.getByLabel('Name').fill('E2E Test Statue');
  await page.getByLabel('Description').fill('Made by the admin E2E suite.');
  await page.getByRole('checkbox', { name: 'Visible on the website' }).uncheck();
  await page.getByLabel('Venue').fill('Test Park');
  await page.locator('input[type="file"]').setInputFiles(FIXTURE);
  const photo = page.getByRole('img', { name: 'Photo 1 (cover)' });
  await expect(photo).toBeVisible();
  const cover = (await photo.getAttribute('src')) ?? '';
  expect(cover).toContain('statues%2F');
  await expectNoAxeViolations(page);
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page).toHaveURL('/statues');
  await expect(page.getByText('Added "E2E Test Statue".')).toBeVisible();
  const added = page.getByRole('row', { name: /E2E Test Statue/ });
  await expect(added).toContainText('Elkhorn, Nebraska');
  await expect(added).toContainText('Hidden');
  await expect(rows).toHaveCount(SEEDED_STATUES + 1);

  // Edit: the form starts from the saved statue; typed coordinates are saved as typed.
  await page.getByRole('link', { name: 'Edit E2E Test Statue' }).click();
  await expect(page.getByRole('heading', { name: 'Edit statue' })).toBeFocused();
  await expect(page.getByLabel('Venue')).toHaveValue('Test Park');
  await expect(latitude).toHaveValue(String(clicked.latitude));
  await latitude.fill('40.8136');
  await longitude.fill('-96.7026');
  await page.getByLabel('City').fill('Lincoln');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page).toHaveURL('/statues');
  await expect(page.getByRole('row', { name: /E2E Test Statue/ })).toContainText('Lincoln');

  await page.getByRole('link', { name: 'Edit E2E Test Statue' }).click();
  await expect(latitude).toHaveValue('40.8136');
  await expect(longitude).toHaveValue('-96.7026');
  await page.getByRole('button', { name: 'Cancel' }).click();

  // Delete: after confirming, the statue and its photo are gone.
  await page.getByRole('button', { name: 'Delete E2E Test Statue' }).click();
  const confirm = page.getByRole('dialog', { name: 'Delete "E2E Test Statue"?' });
  await confirm.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('Deleted "E2E Test Statue".')).toBeVisible();
  await expect(rows).toHaveCount(SEEDED_STATUES);
  await expect.poll(async () => (await request.get(cover)).status()).toBe(404);
});

test('the coordinates must be on the globe', async ({ page }) => {
  await page.goto('/');
  await signInWithGoogle(page, ADMIN);
  await blockTiles(page);
  await page.goto('/statues-add');
  await page.getByLabel('Latitude').fill('95');
  await page.getByLabel('Longitude').fill('');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Enter a latitude from -90 to 90.')).toBeVisible();
  await expect(page.getByText('Enter a longitude.')).toBeVisible();
  await expect(page).toHaveURL('/statues-add');
});
