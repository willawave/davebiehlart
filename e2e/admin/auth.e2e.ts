import { expect, test } from '@playwright/test';
import { ADMIN, OUTSIDER, expectNoAxeViolations, signInWithGoogle } from './helpers';

// The emulator's popup relay iframe loads gapi from apis.google.com. Many sign-ins at once
// occasionally leave one of those requests unanswered, so run this file's tests in order
// on one worker instead of in parallel.
test.describe.configure({ mode: 'default' });

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
