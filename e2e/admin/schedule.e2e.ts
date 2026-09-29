import { expect, test } from '@playwright/test';
import { ADMIN, expectNoAxeViolations, signInWithGoogle } from './helpers';

// Runs against the emulator seed's schedule (Mon–Thu 10–6, Fri–Sat 10–7, Sunday closed). The
// web suite runs alongside and checks the weekday rows, so this test edits only Sunday and
// the special message, and puts both back at the end.

// One sign-in at a time (see auth.e2e.ts).
test.describe.configure({ mode: 'default' });

test('an admin edits the weekly hours and the special message', async ({ page }) => {
  await page.goto('/');
  await signInWithGoogle(page, ADMIN);
  await page
    .getByRole('navigation', { name: 'Manage' })
    .getByRole('link', { name: 'Schedule' })
    .click();
  await expect(page).toHaveURL('/schedule');
  await expect(page.getByRole('heading', { name: 'Schedule' })).toBeFocused();

  const sundayClosed = page.getByRole('checkbox', { name: 'Sunday closed' });
  const sundayOpens = page.getByLabel('Sunday opens');
  const sundayCloses = page.getByLabel('Sunday closes');
  const message = page.getByRole('textbox', { name: 'Special message' });
  const save = page.getByRole('button', { name: 'Save' });

  // The seed: Sunday closed, its times locked; Monday open.
  await expect(sundayClosed).toBeChecked();
  await expect(sundayOpens).toBeDisabled();
  await expect(page.getByLabel('Monday opens')).toHaveValue('10:00');
  await expect(page.getByLabel('Friday closes')).toHaveValue('19:00');
  await expectNoAxeViolations(page);

  // Open Sunday; a closing time before the opening time is refused.
  await sundayClosed.uncheck();
  await expect(sundayOpens).toBeEnabled();
  await sundayOpens.fill('12:00');
  await sundayCloses.fill('11:00');
  await save.click();
  await expect(page.getByText('Closing time must be after opening time.')).toBeVisible();
  await expect(page).toHaveURL('/schedule');

  await sundayCloses.fill('16:00');
  await message.fill('Closed Thanksgiving Day');
  await save.click();
  await expect(page.getByText('Saved the schedule.')).toBeVisible();
  await expect(page).toHaveURL('/dashboard');

  // The saved values come back after a reload.
  await page.goto('/schedule');
  await expect(sundayClosed).not.toBeChecked();
  await expect(sundayOpens).toHaveValue('12:00');
  await expect(sundayCloses).toHaveValue('16:00');
  await expect(message).toHaveValue('Closed Thanksgiving Day');

  // Put the seed back.
  await sundayClosed.check();
  await message.fill('');
  await save.click();
  await expect(page).toHaveURL('/dashboard');
  await page.goto('/schedule');
  await expect(sundayClosed).toBeChecked();
  await expect(message).toHaveValue('');
});
