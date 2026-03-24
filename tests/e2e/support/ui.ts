import { expect, type Locator, type Page } from '@playwright/test';

export async function waitForAppReady(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('body')).toBeVisible();
}

export async function gotoAndExpect(page: Page, path: string, pageTestId?: string) {
  await page.goto(path);
  await waitForAppReady(page);
  await expect(page).toHaveURL(new RegExp(`${escapeRegExp(path)}$`));
  if (pageTestId) {
    await expect(page.getByTestId(pageTestId)).toBeVisible();
  }
}

export async function clickFirstAvailableShift(page: Page) {
  const dateButtons = page.locator('[data-testid^="patient-booking-date-"]');
  const dateCount = await dateButtons.count();
  for (let i = 0; i < dateCount; i += 1) {
    await dateButtons.nth(i).click();
    await page.waitForTimeout(150);

    const enabledShiftButtons = page.locator(
      '[data-testid^="patient-booking-shift-"]:not([disabled])',
    );
    const enabledShiftCount = await enabledShiftButtons.count();
    if (enabledShiftCount > 0) {
      await enabledShiftButtons.first().click();
      return;
    }
  }
  throw new Error('No available shift found in visible date range');
}

export async function firstVisible(locator: Locator) {
  const count = await locator.count();
  for (let i = 0; i < count; i += 1) {
    const candidate = locator.nth(i);
    if (await candidate.isVisible()) {
      return candidate;
    }
  }
  return null;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
