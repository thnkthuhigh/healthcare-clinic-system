import { expect, test, type APIRequestContext } from '@playwright/test';

import { ROLE_CREDENTIALS, apiLogin, loginAs } from '../support/auth';
import { uniquePhone } from '../support/env';
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

async function loginAsOwnerWithFallback(request: APIRequestContext) {
  const candidates = [ROLE_CREDENTIALS.owner, { phone: '0905678901', password: 'admin123' }];

  let lastError: unknown;
  for (const credentials of candidates) {
    try {
      return await apiLogin(request, credentials);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Unable to log in as owner');
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

test.describe('Cashier Access', () => {
  test('cashier can open cashier screen and see prepaid web bookings', async ({
    page,
    request,
  }) => {
    const ownerAuth = await loginAsOwnerWithFallback(request);
    const cashierPhone = uniquePhone('091');
    const cashierPassword = 'Cashier@123';

    await requestJson(request, {
      url: 'http://localhost:4000/api/owner/accounts',
      method: 'POST',
      token: ownerAuth.token,
      data: {
        fullName: 'E2E Cashier Access',
        phone: cashierPhone,
        password: cashierPassword,
        role: 'CASHIER',
      },
    });

    const doctors = await requestJson<DoctorSummary[]>(request, {
      url: 'http://localhost:4000/api/customer/doctors',
    });
    const services = await requestJson<ServiceSummary[]>(request, {
      url: 'http://localhost:4000/api/customer/services',
    });

    test.skip(doctors.length === 0, 'No doctors in demo data');

    const patientPhone = uniquePhone('098');
    const { shift } = await findBookableDoctorAndShift(request, doctors);

    const created = await requestJson<BookingTicketResponse>(request, {
      url: 'http://localhost:4000/api/customer/bookings',
      method: 'POST',
      data: {
        shiftId: shift.id,
        fullName: 'E2E Cashier Patient',
        phone: patientPhone,
        serviceId: services[0]?.id,
      },
    });

    await requestJson(request, {
      url: `http://localhost:4000/api/customer/bookings/${created.bookingId}/pay`,
      method: 'POST',
    });

    await loginAs(page, request, { phone: cashierPhone, password: cashierPassword }, '/admin');

    await expect(page).toHaveURL(/\/admin\/cashier$/);
    await expect(page.getByTestId('admin-layout')).toBeVisible();
    await expect(page.getByText('Cashier')).toBeVisible();

    const bookingButton = page.locator('button').filter({ hasText: patientPhone }).first();
    await expect(bookingButton).toBeVisible({ timeout: 15_000 });
    await bookingButton.click();

    await expect(page.getByText(patientPhone)).toBeVisible();
    await expect(page.getByText('Đã thu phí đặt lịch')).toBeVisible();
  });
});
