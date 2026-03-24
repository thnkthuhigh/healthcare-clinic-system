import { expect, test } from '@playwright/test';

import { ROLE_CREDENTIALS, loginAs } from '../support/auth';

test.describe('Doctor Module', () => {
  test.beforeEach(async ({ page, request }) => {
    await loginAs(page, request, ROLE_CREDENTIALS.doctor, '/doctor/dashboard');
    await expect(page.getByTestId('doctor-layout')).toBeVisible();
  });

  test('loads doctor routes and main navigation', async ({ page }) => {
    await expect(page.getByTestId('doctor-header')).toBeVisible();

    await page.getByTestId('doctor-nav-queue').click();
    await expect(page).toHaveURL(/\/doctor\/queue(?:\/[^/]+)?$/);
    await expect(page.getByTestId('doctor-header-title')).toBeVisible();

    await page.getByTestId('doctor-nav-schedule').click();
    await expect(page).toHaveURL(/\/doctor\/schedule$/);
    await expect(page.getByTestId('doctor-header-title')).toBeVisible();

    await page.getByTestId('doctor-nav-patients').click();
    await expect(page).toHaveURL(/\/doctor\/patients$/);
    await expect(page.getByTestId('doctor-patients-search')).toBeVisible();

    await page.getByTestId('doctor-nav-settings').click();
    await expect(page).toHaveURL(/\/doctor\/settings$/);
    await expect(page.getByTestId('doctor-header-title')).toBeVisible();
  });

  test('doctor can sign out from sidebar', async ({ page }) => {
    await page.getByTestId('doctor-signout').click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId('auth-login-form')).toBeVisible();
  });
});
