import { expect, test } from '@playwright/test';

import { ROLE_CREDENTIALS, registerPatient } from '../support/auth';
import { getLatestOtpForPhone, uniquePhone } from '../support/env';

test.describe('Auth Flows', () => {
  test('shows error when login credentials are invalid', async ({ page }) => {
    await page.goto('/login');

    await page.getByTestId('auth-login-phone').fill('0900000000');
    await page.getByTestId('auth-login-password').fill('wrong-password');
    await page.getByTestId('auth-login-submit').click();

    await expect(page.getByTestId('auth-login-error')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('registers a patient account from UI', async ({ page }) => {
    const phone = uniquePhone('096');
    const password = 'Patient@123';

    await page.goto('/register');
    await page.getByTestId('auth-register-full-name').fill('E2E Patient Register');
    await page.getByTestId('auth-register-phone').fill(phone);
    await page.getByTestId('auth-register-password').fill(password);
    await page.getByTestId('auth-register-confirm-password').fill(password);
    await page.getByTestId('auth-register-submit').click();

    await expect(page.getByTestId('auth-register-success')).toBeVisible();
  });

  test('forgot password flow with OTP from postgres works end-to-end', async ({ page, request }) => {
    const phone = uniquePhone('095');
    const oldPassword = 'Initial@123';
    const newPassword = 'Updated@123';

    await registerPatient(request, {
      fullName: 'E2E Patient OTP',
      phone,
      password: oldPassword,
    });

    await page.goto('/forgot-password');
    await page.getByTestId('auth-forgot-phone').fill(phone);
    await page.getByTestId('auth-forgot-send-otp').click();

    await expect(page.getByTestId('auth-forgot-otp-form')).toBeVisible();

    const otp = await getLatestOtpForPhone(phone);
    await page.getByTestId('auth-forgot-otp').fill(otp);
    await page.getByTestId('auth-forgot-verify-otp').click();

    await expect(page.getByTestId('auth-forgot-reset-form')).toBeVisible();
    await page.getByTestId('auth-forgot-new-password').fill(newPassword);
    await page.getByTestId('auth-forgot-confirm-password').fill(newPassword);
    await page.getByTestId('auth-forgot-reset-submit').click();

    await expect(page.getByTestId('auth-forgot-success')).toBeVisible();

    await page.goto('/login');
    await page.getByTestId('auth-login-phone').fill(phone);
    await page.getByTestId('auth-login-password').fill(newPassword);
    await page.getByTestId('auth-login-submit').click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('public-home-page')).toBeVisible();
  });

  test('login redirects internal users by role', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('auth-login-phone').fill(ROLE_CREDENTIALS.admin.phone);
    await page.getByTestId('auth-login-password').fill(ROLE_CREDENTIALS.admin.password);
    await page.getByTestId('auth-login-submit').click();

    await expect(page).toHaveURL(/\/admin(?:\/dashboard)?$/);
    await expect(page.getByTestId('admin-layout')).toBeVisible();
  });
});

