import { expect, test } from '@playwright/test';

import { ROLE_CREDENTIALS, loginAs } from '../support/auth';
import { uniquePhone } from '../support/env';

type CreateRole = 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'CASHIER';

const ROLES: Array<{ role: CreateRole; fullName: string; seed: string }> = [
  { role: 'ADMIN', fullName: 'E2E Admin Account', seed: '093' },
  { role: 'DOCTOR', fullName: 'E2E Doctor Account', seed: '094' },
  { role: 'RECEPTIONIST', fullName: 'E2E Reception Account', seed: '092' },
  { role: 'CASHIER', fullName: 'E2E Cashier Account', seed: '091' },
];

test.describe('Owner Account Management', () => {
  test.beforeEach(async ({ page, request }) => {
    await loginAs(page, request, ROLE_CREDENTIALS.owner, '/doctor/accounts');
    await expect(page.getByTestId('owner-accounts-page')).toBeVisible();
  });

  test('owner can create, lock, reset password, and delete temporary accounts', async ({ page }) => {
    for (const roleData of ROLES) {
      const phone = uniquePhone(roleData.seed);
      const password = 'OwnerTemp@123';

      await page.getByTestId('owner-create-account-open').click();
      await expect(page.getByTestId('owner-create-account-modal')).toBeVisible();

      await page.getByTestId('owner-create-account-role').selectOption(roleData.role);
      await page.getByTestId('owner-create-account-full-name').fill(roleData.fullName);
      await page.getByTestId('owner-create-account-phone').fill(phone);
      await page.getByTestId('owner-create-account-password').fill(password);

      if (roleData.role === 'DOCTOR') {
        await page.getByTestId('owner-create-account-specialty').fill('N?i t?ng quát');
      }

      await page.getByTestId('owner-create-account-submit').click();
      await expect(page.getByTestId('owner-create-account-modal')).toBeHidden();

      await page.getByTestId('owner-account-search').fill(phone);

      const row = page.locator('tr', { hasText: phone });
      await expect(row).toBeVisible();

      const rowTestId = await row.getAttribute('data-testid');
      expect(rowTestId).toBeTruthy();

      const accountId = rowTestId!.replace('owner-account-row-', '');
      const toggleButton = page.getByTestId(`owner-account-toggle-lock-${accountId}`);
      const resetButton = page.getByTestId(`owner-account-open-reset-${accountId}`);
      const deleteButton = page.getByTestId(`owner-account-delete-${accountId}`);

      await toggleButton.click();
      await expect(toggleButton).toBeVisible();
      await toggleButton.click();
      await expect(toggleButton).toBeVisible();

      await resetButton.click();
      await expect(page.getByTestId('owner-reset-password-modal')).toBeVisible();
      await page.getByTestId('owner-reset-password-input').fill('Reset@123');
      await page.getByTestId('owner-reset-password-submit').click();
      await page.getByTestId('owner-reset-password-close').click();
      await expect(page.getByTestId('owner-reset-password-modal')).toBeHidden();

      page.once('dialog', async (dialog) => {
        await dialog.accept();
      });
      await deleteButton.click();
      await expect(row).toBeHidden();

      await page.getByTestId('owner-account-search').clear();
    }
  });

  test('owner account row does not expose destructive actions', async ({ page }) => {
    await page.getByTestId('owner-account-search').fill(ROLE_CREDENTIALS.owner.phone);

    const ownerRow = page.locator('tr', { hasText: ROLE_CREDENTIALS.owner.phone });
    await expect(ownerRow).toBeVisible();

    const rowTestId = await ownerRow.getAttribute('data-testid');
    expect(rowTestId).toBeTruthy();

    const ownerId = rowTestId!.replace('owner-account-row-', '');

    await expect(page.locator(`[data-testid="owner-account-toggle-lock-${ownerId}"]`)).toHaveCount(0);
    await expect(page.locator(`[data-testid="owner-account-open-reset-${ownerId}"]`)).toHaveCount(0);
    await expect(page.locator(`[data-testid="owner-account-delete-${ownerId}"]`)).toHaveCount(0);
  });
});

