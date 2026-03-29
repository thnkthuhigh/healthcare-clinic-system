import { expect, test, type Page } from '@playwright/test';

import { ROLE_CREDENTIALS, loginAs } from '../support/auth';

async function gotoAdminNav(page: Page, navId: string, path: RegExp) {
  await page.getByTestId(`admin-nav-${navId}`).click();
  await expect(page).toHaveURL(path);
  await expect(page.getByTestId('admin-header-title')).toBeVisible();
}

test.describe('Admin Module', () => {
  test.beforeEach(async ({ page, request }) => {
    await loginAs(page, request, ROLE_CREDENTIALS.admin, '/admin/dashboard');
    await expect(page.getByTestId('admin-layout')).toBeVisible();
  });

  test('covers all active admin routes', async ({ page }) => {
    await gotoAdminNav(page, 'dashboard', /\/admin\/dashboard$/);
    await gotoAdminNav(page, 'reception', /\/admin\/reception$/);
    await gotoAdminNav(page, 'cashier', /\/admin\/cashier$/);

    await page.getByTestId('admin-nav-group-clinic').click();
    await gotoAdminNav(page, 'shifts', /\/admin\/shifts$/);
    await gotoAdminNav(page, 'patients', /\/admin\/patients$/);
    await gotoAdminNav(page, 'doctors', /\/admin\/doctors$/);
    await gotoAdminNav(page, 'services', /\/admin\/services$/);
    await gotoAdminNav(page, 'departments', /\/admin\/departments$/);

    await page.getByTestId('admin-nav-group-inventory').click();
    await gotoAdminNav(page, 'rooms', /\/admin\/rooms$/);
    await gotoAdminNav(page, 'supplies', /\/admin\/supplies$/);
    await gotoAdminNav(page, 'assets', /\/admin\/assets$/);
    await gotoAdminNav(page, 'medications', /\/admin\/medications$/);
    await gotoAdminNav(page, 'templates', /\/admin\/templates$/);

    await page.getByTestId('admin-nav-group-report').click();
    await gotoAdminNav(page, 'reports', /\/admin\/reports$/);
  });

  test('admin can sign out from sidebar', async ({ page }) => {
    await page.getByTestId('admin-signout').click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId('auth-login-form')).toBeVisible();
  });
});
