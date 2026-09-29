import { Page, expect, test } from '@playwright/test';
import { ADMIN, expectNoAxeViolations, signInWithGoogle } from './helpers';

// Runs against the emulator seed: 7 videos and 5 articles, plus the hidden
// "Unpublished Interview". The item this test creates stays hidden, so it never changes
// what the web suite sees on /media.

// One sign-in at a time (see auth.e2e.ts).
test.describe.configure({ mode: 'default' });

// No YouTube thumbnails: the seed's video IDs are made up, and the test stays offline-safe.
// Routed only after sign-in: request routing stalls the Auth emulator's relay iframe.
function blockThumbnails(page: Page) {
  return page.route(/i\.ytimg\.com/, (route) => route.abort());
}

test('an admin adds, edits and deletes media, and a wrong link is refused', async ({ page }) => {
  await page.goto('/');
  await signInWithGoogle(page, ADMIN);
  await blockThumbnails(page);
  await page
    .getByRole('navigation', { name: 'Manage' })
    .getByRole('link', { name: 'Media' })
    .click();
  await expect(page).toHaveURL('/media');
  await expect(page.getByRole('heading', { name: 'Media' })).toBeFocused();
  await expect(page.getByRole('row', { name: /On Air at the Foundry/ })).toContainText('Video');
  await expect(page.getByRole('row', { name: /The Sculptor Next Door/ })).toContainText(
    'Article · example.com',
  );
  await expect(page.getByRole('row', { name: /Unpublished Interview/ })).toContainText('Hidden');
  await expectNoAxeViolations(page);

  // Add: an empty form says what is missing instead of saving.
  await page.getByRole('link', { name: 'Add media' }).click();
  await expect(page).toHaveURL('/media-add');
  await expect(page.getByRole('heading', { name: 'Add media' })).toBeFocused();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Enter the link.')).toBeVisible();
  await expect(page.getByText('Enter a title.')).toBeVisible();

  await page.getByLabel('Title').fill('E2E Test Media');
  await page.getByLabel('Description').fill('Made by the admin E2E suite.');
  await page.getByLabel('Date').fill('9/1/2026');
  await page.getByRole('checkbox', { name: 'Visible on the website' }).uncheck();

  // Wrong links are refused with a reason.
  const link = page.getByRole('textbox', { name: 'Link' });
  const save = page.getByRole('button', { name: 'Save' });
  await link.fill('www.example.com/story');
  await save.click();
  await expect(page.getByText('Enter one full web address, starting with https://.')).toBeVisible();
  await link.fill('https://www.youtube.com/@davebiehl');
  await expect(page.getByText("That YouTube link isn't a single video.")).toBeVisible();
  // The seed's first video, pasted in another form, is already listed.
  await link.fill('https://youtu.be/Sd8Kq2LmN4a?t=30');
  await expect(page.getByText('This link is already on the Media page.')).toBeVisible();
  await save.click();
  await expect(page).toHaveURL('/media-add');

  // A new video: the preview shows the address it will be saved as.
  await link.fill('https://youtu.be/E2eTestVid0?si=share');
  await expect(page.getByText('YouTube video.')).toBeVisible();
  await expect(page.getByText('https://www.youtube.com/watch?v=E2eTestVid0')).toBeVisible();
  await expectNoAxeViolations(page);
  await save.click();

  await expect(page).toHaveURL('/media');
  await expect(page.getByText('Added "E2E Test Media".')).toBeVisible();
  const added = page.getByRole('row', { name: /E2E Test Media/ });
  await expect(added).toContainText('Video');
  await expect(added).toContainText('Hidden');
  await expect(added.getByRole('link', { name: /^E2E Test Media/ })).toHaveAttribute(
    'href',
    'https://www.youtube.com/watch?v=E2eTestVid0',
  );

  // Edit: the form starts from the saved item, and its own link isn't a duplicate.
  await page.getByRole('link', { name: 'Edit E2E Test Media' }).click();
  await expect(page.getByRole('heading', { name: 'Edit media' })).toBeFocused();
  await expect(link).toHaveValue('https://www.youtube.com/watch?v=E2eTestVid0');
  await expect(page.getByText('This link is already on the Media page.')).toHaveCount(0);
  await link.fill('https://news.example.com/e2e-story?ref=home');
  await expect(page.getByText('Article on news.example.com.')).toBeVisible();
  await save.click();
  await expect(page).toHaveURL('/media');
  await expect(page.getByRole('row', { name: /E2E Test Media/ })).toContainText(
    'Article · news.example.com',
  );

  // Delete: after confirming, the item is gone.
  await page.getByRole('button', { name: 'Delete E2E Test Media' }).click();
  const confirm = page.getByRole('dialog', { name: 'Delete "E2E Test Media"?' });
  await confirm.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('Deleted "E2E Test Media".')).toBeVisible();
  await expect(page.getByRole('row', { name: /E2E Test Media/ })).toHaveCount(0);
});
