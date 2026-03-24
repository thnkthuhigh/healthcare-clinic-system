import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { ROLE_CREDENTIALS, loginAs } from '../support/auth';
import { refreshDemoData, uniquePhone } from '../support/env';
import { requestJson } from '../support/http';

interface DoctorSummary {
  id: string;
}

interface ShiftSummary {
  id: string;
  status: 'OPEN' | 'CLOSED';
  availableSlots: number;
  isFull: boolean;
}

interface ServiceSummary {
  id: string;
}

interface BookingTicketResponse {
  bookingId: string;
}

function dateOffset(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

async function findBookableShift(request: APIRequestContext, doctorId: string) {
  for (let offset = 0; offset < 14; offset += 1) {
    const date = dateOffset(offset);
    const shifts = await requestJson<ShiftSummary[]>(request, {
      url: `http://localhost:4000/api/customer/doctors/${doctorId}/shifts`,
      params: { date },
    });

    const shift = shifts.find(
      (item) => item.status === 'OPEN' && item.availableSlots > 0 && !item.isFull,
    );
    if (shift) {
      return shift;
    }
  }

  return null;
}

async function findBookableDoctorAndShift(request: APIRequestContext, doctors: DoctorSummary[]) {
  for (const doctor of doctors) {
    const shift = await findBookableShift(request, doctor.id);
    if (shift) {
      return { doctorId: doctor.id, shift };
    }
  }

  throw new Error('No doctor with available shifts found in next 14 days');
}

async function clearAuthStorage(page: Page) {
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.removeItem('clinic_token');
    window.localStorage.removeItem('clinic_user');
  });
}

test.describe.serial('Golden Path Cross Roles', () => {
  test('patient booking appears in cross-role views', async ({ page, request }) => {
    refreshDemoData();

    const doctors = await requestJson<DoctorSummary[]>(request, {
      url: 'http://localhost:4000/api/customer/doctors',
    });
    const services = await requestJson<ServiceSummary[]>(request, {
      url: 'http://localhost:4000/api/customer/services',
    });

    test.skip(doctors.length === 0, 'No doctors in demo data');

    const phone = uniquePhone('098');
    const { shift } = await findBookableDoctorAndShift(request, doctors);

    const created = await requestJson<BookingTicketResponse>(request, {
      url: 'http://localhost:4000/api/customer/bookings',
      method: 'POST',
      data: {
        shiftId: shift.id,
        fullName: 'E2E Golden Path Patient',
        phone,
        serviceId: services[0]?.id,
      },
    });

    await requestJson(request, {
      url: `http://localhost:4000/api/customer/bookings/${created.bookingId}/pay`,
      method: 'POST',
    });

    await clearAuthStorage(page);
    await loginAs(page, request, ROLE_CREDENTIALS.admin, '/admin/reception');
    await expect(page).toHaveURL(/\/admin\/reception$/);
    await expect(page.getByTestId('admin-layout')).toBeVisible();

    await clearAuthStorage(page);
    await loginAs(page, request, ROLE_CREDENTIALS.doctor, '/doctor/queue');
    await expect(page).toHaveURL(/\/doctor\/queue(?:\/[^/]+)?$/);
    await expect(page.getByTestId('doctor-layout')).toBeVisible();

    await clearAuthStorage(page);
    await page.goto('/appointments');
    await page.getByTestId('patient-appointments-phone').fill(phone);
    await page.getByTestId('patient-appointments-submit').click();
    await expect(page.locator('[data-testid^="patient-appointments-card-"]').first()).toBeVisible();
  });
});

