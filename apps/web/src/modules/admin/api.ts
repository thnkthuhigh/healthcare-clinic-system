import type { ReceptionBooking, ShiftOverview, WalkInRequest } from './types';

const API_BASE = 'http://localhost:4000/api/admin';

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('clinic_token');
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Lỗi hệ thống' }));
    throw new Error(err.message || 'Lỗi hệ thống');
  }

  return response.json();
}

export const adminApi = {
  getTodayShifts: (date: string) => fetchApi<ShiftOverview[]>(`${API_BASE}/shifts?date=${date}`),

  getReceptionBookings: (date: string, shiftId?: string) =>
    fetchApi<ReceptionBooking[]>(
      `${API_BASE}/reception/bookings?date=${date}${shiftId ? `&shiftId=${shiftId}` : ''}`,
    ),

  checkIn: (bookingId: string) => fetchApi<{ message: string }>(`${API_BASE}/bookings/${bookingId}/checkin`, { method: 'POST' }),

  walkIn: (data: WalkInRequest) => fetchApi<{ poolUsed: string; isOverride: boolean; queueNumber: number }>(
    `${API_BASE}/walkin`,
    { method: 'POST', body: JSON.stringify(data) },
  ),

  markNoShow: (bookingId: string) => fetchApi<{ message: string }>(`${API_BASE}/bookings/${bookingId}/no-show`, { method: 'POST' }),

  searchBookingsByPhone: (phone: string, date: string) =>
    fetchApi<ReceptionBooking[]>(`${API_BASE}/bookings/search?phone=${encodeURIComponent(phone)}&date=${date}`),
};
