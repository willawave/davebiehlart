import { expect, test } from '@playwright/test';
import { ADMIN, expectNoAxeViolations, signInWithGoogle } from './helpers';

// Runs against the emulator seed: 23 gallery items, two of them hidden. The item this test
// creates stays hidden, so it never changes what the web suite sees on /bronzes or /glass.
const FIXTURE = 'e2e/fixtures/sculpture.jpg';
const SEEDED_ITEMS = 23;

// One sign-in at a time (see auth.e2e.ts).
test.describe.configure({ mode: 'default' });

test('an admin adds, edits and deletes a gallery item', async ({ page, request }) => {
  await page.goto('/');
  await signInWithGoogle(page, ADMIN);
  await expect(page).toHaveURL('/dashboard');

  // The table lists every item, hidden ones included.
  await page
    .getByRole('navigation', { name: 'Manage' })
    .getByRole('link', { name: 'Gallery' })
    .click();
  await expect(page).toHaveURL('/gallery');
  await expect(page.getByRole('heading', { name: 'Gallery' })).toBeFocused();
  const rows = page.locator('tr[mat-row]');
  await expect(rows).toHaveCount(SEEDED_ITEMS);
  await expect(page.getByRole('row', { name: /Hidden Draft Bronze/ })).toContainText('Hidden');
  await expectNoAxeViolations(page);

  // Add: an empty form says what is missing instead of saving.
  await page.getByRole('link', { name: 'Add item' }).click();
  await expect(page).toHaveURL('/gallery-add');
  await expect(page.getByRole('heading', { name: 'Add gallery item' })).toBeFocused();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Enter a name.')).toBeVisible();
  await expect(page.getByText('Upload at least one photo.')).toBeVisible();
  await expect(page).toHaveURL('/gallery-add');

  await page.getByLabel('Name').fill('E2E Test Piece');
  await page.getByLabel('Description').fill('Made by the admin E2E suite.');
  await page.getByRole('checkbox', { name: 'Visible on the website' }).uncheck();
  await page.getByRole('combobox', { name: 'Style' }).click();
  await page.getByRole('option', { name: 'Glass' }).click();
  await page.getByLabel('Height (in)').fill('12');
  await page.getByLabel('Width (in)').fill('8.5');
  await page.getByLabel('Depth (in)').fill('3');
  await page.locator('input[type="file"]').setInputFiles([FIXTURE, FIXTURE]);
  await expect(page.getByRole('img', { name: 'Photo 1 (cover)' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Photo 2' })).toBeVisible();
  await page.getByRole('button', { name: 'Remove photo 2' }).click();
  await expect(page.getByRole('img', { name: 'Photo 2' })).toHaveCount(0);
  await expectNoAxeViolations(page);

  const cover = await page.getByRole('img', { name: 'Photo 1 (cover)' }).getAttribute('src');
  expect(cover).toContain('127.0.0.1:9199');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page).toHaveURL('/gallery');
  await expect(page.getByText('Added "E2E Test Piece".')).toBeVisible();
  const added = page.getByRole('row', { name: /E2E Test Piece/ });
  await expect(added).toContainText('Glass');
  await expect(added).toContainText('Hidden');
  await expect(rows).toHaveCount(SEEDED_ITEMS + 1);

  // Edit: the form starts from the saved item.
  await page.getByRole('link', { name: 'Edit E2E Test Piece' }).click();
  await expect(page.getByRole('heading', { name: 'Edit gallery item' })).toBeFocused();
  await expect(page.getByLabel('Name')).toHaveValue('E2E Test Piece');
  await expect(page.getByLabel('Width (in)')).toHaveValue('8.5');
  await expect(page.getByRole('img', { name: 'Photo 1 (cover)' })).toHaveAttribute(
    'src',
    cover ?? '',
  );
  await page.getByLabel('Name').fill('E2E Renamed Piece');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page).toHaveURL('/gallery');
  await expect(page.getByRole('row', { name: /E2E Renamed Piece/ })).toBeVisible();
  await expect(page.getByRole('row', { name: /E2E Test Piece/ })).toHaveCount(0);

  // Delete: nothing happens until the admin confirms; then the photo goes too.
  await page.getByRole('button', { name: 'Delete E2E Renamed Piece' }).click();
  const confirm = page.getByRole('dialog', { name: 'Delete "E2E Renamed Piece"?' });
  await confirm.getByRole('button', { name: 'Keep it' }).click();
  await expect(confirm).toBeHidden();
  await expect(rows).toHaveCount(SEEDED_ITEMS + 1);

  await page.getByRole('button', { name: 'Delete E2E Renamed Piece' }).click();
  await confirm.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('Deleted "E2E Renamed Piece".')).toBeVisible();
  await expect(rows).toHaveCount(SEEDED_ITEMS);
  await expect.poll(async () => (await request.get(cover ?? '')).status()).toBe(404);
});

test('a large photo is stored as a JPEG under 1 MB', async ({ page, request }) => {
  await page.goto('/');
  await signInWithGoogle(page, ADMIN);
  await page.goto('/gallery-add');

  // Random noise barely compresses, so this PNG is several MB: the worst case for the
  // browser's shrink step.
  const png = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2000;
    canvas.height = 1500;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('no 2d context');
    const pixels = context.createImageData(canvas.width, canvas.height);
    for (let i = 0; i < pixels.data.length; i++) pixels.data[i] = (Math.random() * 256) | 0;
    context.putImageData(pixels, 0, 0);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  const buffer = Buffer.from(png, 'base64');
  expect(buffer.length).toBeGreaterThan(4 * 1024 * 1024);

  await page.locator('input[type="file"]').setInputFiles({
    name: 'noise.png',
    mimeType: 'image/png',
    buffer,
  });
  const photo = page.getByRole('img', { name: 'Photo 1 (cover)' });
  await expect(photo).toBeVisible({ timeout: 30_000 });

  // The download URL without alt=media returns the stored object's metadata.
  const url = new URL((await photo.getAttribute('src')) ?? '');
  url.searchParams.delete('alt');
  url.searchParams.delete('token');
  const metadata = (await (await request.get(url.toString())).json()) as {
    size: string;
    contentType: string;
    name: string;
  };
  expect(metadata.contentType).toBe('image/jpeg');
  expect(metadata.name).toMatch(/\.jpg$/);
  expect(Number(metadata.size)).toBeLessThan(1024 * 1024);
  test.info().annotations.push({
    type: 'stored size',
    description: `${buffer.length} byte PNG stored as ${metadata.size} byte JPEG`,
  });

  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page).toHaveURL('/gallery');
});

test('leaving the add page without saving deletes its uploads', async ({ page, request }) => {
  await page.goto('/');
  await signInWithGoogle(page, ADMIN);
  await page.goto('/gallery-add');
  await page.locator('input[type="file"]').setInputFiles(FIXTURE);
  const photo = page.getByRole('img', { name: 'Photo 1 (cover)' });
  await expect(photo).toBeVisible();
  const src = (await photo.getAttribute('src')) ?? '';
  expect((await request.get(src)).status()).toBe(200);

  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page).toHaveURL('/gallery');
  await expect.poll(async () => (await request.get(src)).status()).toBe(404);
});
