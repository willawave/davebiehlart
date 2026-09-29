import { Page, expect, test } from '@playwright/test';
import { ADMIN, expectNoAxeViolations, signInWithGoogle } from './helpers';

// Runs against the emulator seed: past events, one of them hidden. The event this test
// creates stays hidden, so it never changes what the web suite sees on /events. Row counts
// aren't checked: the web suite briefly adds an upcoming event of its own.

// One sign-in at a time (see auth.e2e.ts).
test.describe.configure({ mode: 'default' });

// No OpenStreetMap tiles: the map still takes clicks, and the test stays offline-safe.
// Routed only after sign-in: request routing stalls the Auth emulator's relay iframe.
function blockTiles(page: Page) {
  return page.route(/tile\.openstreetmap\.org/, (route) => route.abort());
}

test('an admin adds, edits and deletes an event, setting its place on the map', async ({
  page,
}) => {
  await page.goto('/');
  await signInWithGoogle(page, ADMIN);
  await blockTiles(page);
  await page
    .getByRole('navigation', { name: 'Manage' })
    .getByRole('link', { name: 'Events' })
    .click();
  await expect(page).toHaveURL('/events');
  await expect(page.getByRole('heading', { name: 'Events' })).toBeFocused();
  const rows = page.locator('tr[mat-row]');
  await expect(rows.first()).toBeVisible();
  await expect(page.getByRole('row', { name: /Draft Studio Tour/ })).toContainText('Hidden');
  await expect(page.getByRole('row', { name: /Fall Open Studio/ })).toContainText('Past');
  await expectNoAxeViolations(page);

  // Add: an empty form says what is missing instead of saving.
  await page.getByRole('link', { name: 'Add event' }).click();
  await expect(page).toHaveURL('/events-add');
  await expect(page.getByRole('heading', { name: 'Add event' })).toBeFocused();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Enter a name.')).toBeVisible();
  await expect(page.getByText('Enter the start time.')).toBeVisible();

  const latitude = page.getByLabel('Latitude');
  const longitude = page.getByLabel('Longitude');
  // A new event starts at the studio.
  await expect(latitude).toHaveValue(/^41\.28/);
  await expect(page.getByLabel('City')).toHaveValue('Elkhorn');

  // Clicking the map moves the pin, and the coordinates follow.
  const map = page.getByRole('region', { name: 'Event location map' });
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

  await page.getByLabel('Name').fill('E2E Test Event');
  await page.getByLabel('Description').fill('Made by the admin E2E suite.');
  await page.getByLabel('Date').fill('12/5/2099');
  await page.getByLabel('Start time').fill('19:00');
  await page.getByRole('checkbox', { name: 'Visible on the website' }).uncheck();
  await page.getByLabel('Venue').fill('Test Hall');

  // The link must be a full web address.
  const link = page.getByLabel('Link (optional)');
  await link.fill('example.com/tickets');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Enter a full web address, starting with https://.')).toBeVisible();
  await expect(page).toHaveURL('/events-add');
  await link.fill('https://example.com/tickets');
  await expectNoAxeViolations(page);
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page).toHaveURL('/events');
  await expect(page.getByText('Added "E2E Test Event".')).toBeVisible();
  const added = page.getByRole('row', { name: /E2E Test Event/ });
  await expect(added).toContainText('Dec 5, 2099');
  await expect(added).toContainText('7:00 PM');
  await expect(added).toContainText('Test Hall, Elkhorn');
  await expect(added).toContainText('Upcoming');
  await expect(added).toContainText('Hidden');

  // Edit: the form starts from the saved event; typed coordinates are saved as typed.
  await page.getByRole('link', { name: 'Edit E2E Test Event' }).click();
  await expect(page.getByRole('heading', { name: 'Edit event' })).toBeFocused();
  await expect(page.getByLabel('Venue')).toHaveValue('Test Hall');
  await expect(page.getByLabel('Start time')).toHaveValue('19:00');
  await expect(link).toHaveValue('https://example.com/tickets');
  await expect(latitude).toHaveValue(String(clicked.latitude));
  await latitude.fill('40.8136');
  await longitude.fill('-96.7026');
  await page.getByLabel('City').fill('Lincoln');
  await link.fill('');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page).toHaveURL('/events');
  await expect(page.getByRole('row', { name: /E2E Test Event/ })).toContainText('Lincoln');

  await page.getByRole('link', { name: 'Edit E2E Test Event' }).click();
  await expect(latitude).toHaveValue('40.8136');
  await expect(longitude).toHaveValue('-96.7026');
  await expect(link).toHaveValue('');
  await page.getByRole('button', { name: 'Cancel' }).click();

  // Delete: after confirming, the event is gone.
  await page.getByRole('button', { name: 'Delete E2E Test Event' }).click();
  const confirm = page.getByRole('dialog', { name: 'Delete "E2E Test Event"?' });
  await confirm.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('Deleted "E2E Test Event".')).toBeVisible();
  await expect(page.getByRole('row', { name: /E2E Test Event/ })).toHaveCount(0);
  await expect(page.getByRole('row', { name: /Fall Open Studio/ })).toBeVisible();
});
