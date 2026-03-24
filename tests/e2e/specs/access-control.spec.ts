import { expect, test } from '@playwright/test';

import { ROLE_CREDENTIALS, loginAs } from '../support/auth';

test.describe('Access Control', () => {
  test('redirects unauthenticated users from doctor and admin routes', async ({ page }) => {
    await page.goto('/doctor/dashboard');
    await expect(page).toHaveURL(/\/login$/);

    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('blocks doctor from admin routes and redirects to home', async ({ page, request }) => {
    await loginAs(page, request, ROLE_CREDENTIALS.doctor, '/doctor/dashboard');
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('public-home-page')).toBeVisible();
  });

  test('allows admin to access doctor area', async ({ page, request }) => {
    await loginAs(page, request, ROLE_CREDENTIALS.admin, '/doctor/dashboard');
    await expect(page).toHaveURL(/\/doctor\/dashboard$/);
    await expect(page.getByTestId('doctor-layout')).toBeVisible();
  });
});

