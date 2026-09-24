import AxeBuilder from '@axe-core/playwright';
import { Page, expect, test } from '@playwright/test';

// Runs against the emulators seeded from emulator-data/: both accounts are Google users in
// the Auth emulator, and only admin@test.com has a users/{uid} document.
const ADMIN = 'admin@test.com';
const OUTSIDER = 'outsider@test.com';

// The emulator's popup relay iframe loads gapi from apis.google.com. Many sign-ins at once
// occasionally leave one of those requests unanswered, so run this file's tests in order
// on one worker instead of in parallel.
test.describe.configure({ mode: 'default' });

// signInWithPopup against the Auth emulator opens its fake Google account chooser, which
// lists the seeded accounts by email. The chooser hands the result back through a relay
// iframe the SDK adds to this page; if that frame hasn't loaded when an account is picked,
// the chooser finds no frame to post to and never closes. A person is never that fast, so
// wait for both pages to finish loading before clicking.
async function signInWithGoogle(page: Page, email: string): Promise<void> {
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Sign in with Google' }).click();
  const popup = await popupPromise;
  await popup.waitForLoadState('load');
  await expect
    .poll(() => page.frames().find((frame) => frame.url().includes('/emulator/auth/iframe')))
    .toBeDefined();
  await page
    .frames()
    .find((frame) => frame.url().includes('/emulator/auth/iframe'))
    ?.waitForLoadState('load');
  const closed = popup.waitForEvent('close', { timeout: 10_000 });
  await popup.getByText(email).click();
  await closed.catch(async (error: unknown) => {
    const shown = await popup
      .locator('body')
      .innerText()
      .catch(() => '(closed)');
    throw new Error(`Account chooser did not close; it shows: ${shown}`, { cause: error });
  });
}

// WCAG 2.1 A/AA. The SDK's hidden relay iframe belongs to the Auth emulator, not the app.
async function expectNoAxeViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .exclude('iframe[aria-hidden="true"]')
    .analyze();
  expect(results.violations).toEqual([]);
}

test('a signed-out visit to an admin route redirects to sign-in', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeFocused();
  await expectNoAxeViolations(page);
});

test('an admin signs in to the dashboard and signs out again', async ({ page }) => {
  await page.goto('/');
  await signInWithGoogle(page, ADMIN);

  await expect(page).toHaveURL('/dashboard');
  await expect(page).toHaveTitle('Dashboard');
  await expect(page.getByText(`Signed in as ${ADMIN}`)).toBeVisible();
  await expect(page.getByRole('banner')).toContainText(ADMIN);
  await expectNoAxeViolations(page);

  // The session survives a reload.
  await page.reload();
  await expect(page).toHaveURL('/dashboard');

  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeHidden();

  await page.goto('/dashboard');
  await expect(page).toHaveURL('/');
});

test('a signed-in admin skips the sign-in page', async ({ page }) => {
  await page.goto('/');
  await signInWithGoogle(page, ADMIN);
  await expect(page).toHaveURL('/dashboard');

  await page.goto('/');
  await expect(page).toHaveURL('/dashboard');
});

test('signing out in another tab returns an open admin page to sign-in', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await signInWithGoogle(page, ADMIN);
  await expect(page).toHaveURL('/dashboard');

  const otherTab = await context.newPage();
  await otherTab.goto('/dashboard');
  await expect(otherTab).toHaveURL('/dashboard');
  await otherTab.getByRole('button', { name: 'Sign out' }).click();
  await expect(otherTab).toHaveURL('/');

  await expect(page).toHaveURL('/');
});

test('a non-admin is denied and signed back out', async ({ page }) => {
  await page.goto('/');
  await signInWithGoogle(page, OUTSIDER);

  await expect(page).toHaveURL('/access-denied');
  await expect(page.getByRole('heading', { name: 'Access denied' })).toBeFocused();
  await expect(page.getByRole('banner')).not.toContainText(OUTSIDER);
  await expectNoAxeViolations(page);

  await page.goto('/dashboard');
  await expect(page).toHaveURL('/');

  await page.goto('/access-denied');
  await page.getByRole('link', { name: 'Sign in with another account' }).click();
  await expect(page).toHaveURL('/');
});
