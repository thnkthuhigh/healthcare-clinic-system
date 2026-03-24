import { expect, test } from '@playwright/test';

import { gotoAndExpect } from '../support/ui';

test.describe('Public Routes', () => {
  test('loads all public and patient-facing routes', async ({ page }) => {
    await gotoAndExpect(page, '/', 'public-home-page');
    await gotoAndExpect(page, '/about', 'public-about-page');
    await gotoAndExpect(page, '/doctors', 'public-doctors-page');
    await gotoAndExpect(page, '/services', 'public-services-page');
    await gotoAndExpect(page, '/booking', 'patient-booking-page');
    await gotoAndExpect(page, '/health-records', 'patient-health-records-page');
    await gotoAndExpect(page, '/appointments', 'patient-appointments-page');

    await page.goto('/profile');
    await expect(page).toHaveURL(/\/profile$/);
    const profilePage = page.getByTestId('patient-profile-page');
    if ((await profilePage.count()) > 0) {
      await expect(profilePage).toBeVisible();
    } else {
      await expect(page.locator('a[href="/login"]').first()).toBeVisible();
    }

    await page.goto('/health-profile');
    await expect(page).toHaveURL(/\/health-records$/);
  });

  test('redirects /mainpage to /', async ({ page }) => {
    await page.goto('/mainpage');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('public-home-page')).toBeVisible();
  });

  test('resets viewport to top when changing route', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('public-navbar')).toBeVisible();

    await page.evaluate(() => window.scrollTo(0, 1200));
    await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeGreaterThan(200);

    await page.goto('/about');
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.getByTestId('public-about-page')).toBeVisible();
    await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeLessThan(10);
  });

  test('supports quick lookup from home', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('public-home-page')).toBeVisible();

    await page.getByTestId('public-home-quick-lookup-phone').fill('0971234567');
    await page.getByTestId('public-home-quick-lookup-submit').click();

    await expect(page).toHaveURL(/\/health-records\?phone=0971234567$/);
    await expect(page.getByTestId('patient-health-records-page')).toBeVisible();
  });

  test('shows not-found page on unknown route', async ({ page }) => {
    await page.goto('/this-route-should-not-exist');
    await expect(page).toHaveURL(/\/this-route-should-not-exist$/);
    await expect(page.getByText('404')).toBeVisible();
    await expect(page.getByText('Page Not Found')).toBeVisible();
  });
});
