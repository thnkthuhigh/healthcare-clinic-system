import { expect, test } from '@playwright/test';

import { refreshDemoData, uniquePhone } from '../support/env';
import { requestJson } from '../support/http';
import { clickFirstAvailableShift } from '../support/ui';

interface DoctorLite {
  id: string;
}

interface ShiftLite {
  status: 'OPEN' | 'CLOSED';
  availableSlots: number;
  isFull: boolean;
}

function dateOffset(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

async function findBookableDoctorId(request: Parameters<typeof requestJson>[0]) {
  const doctors = await requestJson<DoctorLite[]>(request, {
    url: 'http://localhost:4000/api/customer/doctors',
  });

  for (const doctor of doctors) {
    for (let offset = 0; offset < 14; offset += 1) {
      const shifts = await requestJson<ShiftLite[]>(request, {
        url: `http://localhost:4000/api/customer/doctors/${doctor.id}/shifts`,
        params: { date: dateOffset(offset) },
      });
      const hasBookableShift = shifts.some(
        (shift) => shift.status === 'OPEN' && shift.availableSlots > 0 && !shift.isFull,
      );
      if (hasBookableShift) {
        return doctor.id;
      }
    }
  }

  throw new Error('No doctor with available shifts found in next 14 days');
}

test.describe.serial('Patient Core Flows', () => {
  let bookedPhone = '';

  test.beforeAll(() => {
    refreshDemoData();
  });

  test('completes booking flow and generates ticket with booking id and queue', async ({
    page,
    request,
  }) => {
    bookedPhone = uniquePhone('097');
    const doctorId = await findBookableDoctorId(request);

    await page.goto(`/booking?doctorId=${doctorId}`);
    await expect(page.getByTestId('patient-booking-page')).toBeVisible();

    await page.getByTestId('patient-booking-next-from-doctor').click();

    await expect(page.getByTestId('patient-booking-next-from-shift')).toBeVisible();
    await clickFirstAvailableShift(page);
    await page.getByTestId('patient-booking-next-from-shift').click();

    await expect(page.getByTestId('patient-booking-patient-form')).toBeVisible();
    await page.getByTestId('patient-booking-full-name').fill('E2E Booking Patient');
    await page.getByTestId('patient-booking-phone').fill(bookedPhone);

    const serviceOptions = await page
      .locator('[data-testid="patient-booking-service"] option')
      .evaluateAll((options) =>
        options
          .map((item) => ({ value: (item as HTMLOptionElement).value }))
          .filter((item) => Boolean(item.value)),
      );

    if (serviceOptions.length > 0) {
      await page.getByTestId('patient-booking-service').selectOption(serviceOptions[0].value);
    }

    await page.getByTestId('patient-booking-submit-info').click();

    await expect(page.getByTestId('patient-booking-payment-confirm')).toBeVisible();
    await page.getByTestId('patient-booking-payment-confirm').check();
    await page.getByTestId('patient-booking-pay').click();

    await expect(page.getByTestId('patient-booking-ticket')).toBeVisible();

    const ticketText = (await page.getByTestId('patient-booking-ticket-card').textContent()) ?? '';
    expect(ticketText).toContain('PK-');
    expect(ticketText).toMatch(/[0-9a-f]{8}-[0-9a-f-]{27}/i);
    expect(ticketText).toMatch(/#\d{3}/);
    expect(ticketText).not.toContain('#-');
  });

  test('looks up appointments and health records by phone after booking', async ({ page }) => {
    expect(bookedPhone).toMatch(/^0\d{9}$/);

    await page.goto('/appointments');
    await expect(page.getByTestId('patient-appointments-page')).toBeVisible();
    await page.getByTestId('patient-appointments-phone').fill(bookedPhone);
    await page.getByTestId('patient-appointments-submit').click();

    const appointmentCards = page.locator('[data-testid^="patient-appointments-card-"]');
    await expect(appointmentCards.first()).toBeVisible();

    const qrButtons = page.locator('[data-testid^="patient-appointments-open-qr-"]');
    if ((await qrButtons.count()) > 0) {
      await qrButtons.first().click();
      await expect(page.getByTestId('patient-booking-ticket')).toBeVisible();
      await page.locator('.clinic-modal-panel button').first().click();
    }

    await page.goto('/health-records');
    await expect(page.getByTestId('patient-health-records-page')).toBeVisible();
    await page.getByTestId('patient-health-records-phone').fill(bookedPhone);
    await page.getByTestId('patient-health-records-submit').click();

    await expect(page.getByTestId('patient-health-records-summary')).toBeVisible();
    await expect(page.getByTestId('patient-health-records-bookings')).toBeVisible();
  });

  test('supports booking deep-link with doctorId and serviceId preselect', async ({
    page,
    request,
  }) => {
    const services = await requestJson<Array<{ id: string }>>(request, {
      url: 'http://localhost:4000/api/customer/services',
    });

    test.skip(services.length === 0, 'No services available in demo data');

    const doctorId = await findBookableDoctorId(request);
    const serviceId = services[0].id;

    await page.goto(`/booking?doctorId=${doctorId}&serviceId=${serviceId}`);
    await expect(page.getByTestId('patient-booking-page')).toBeVisible();

    await page.getByTestId('patient-booking-next-from-doctor').click();
    await expect(page.getByTestId('patient-booking-next-from-shift')).toBeVisible();

    await clickFirstAvailableShift(page);
    await page.getByTestId('patient-booking-next-from-shift').click();

    await expect(page.getByTestId('patient-booking-patient-form')).toBeVisible();
    await expect(page.getByTestId('patient-booking-service')).toHaveValue(serviceId);
  });
});
