import type {
  DoctorSummary,
  AvailableShift,
  ClinicService,
  CreateBookingRequest,
  BookingTicket,
  PatientSummary,
  PatientBooking,
  RatingRequest,
} from './types';

const API_BASE = 'http://localhost:4000/api/customer';

type FetchApiOptions = RequestInit & {
  withAuth?: boolean;
};

async function fetchApi<T>(url: string, options?: FetchApiOptions): Promise<T> {
  const token = options?.withAuth ? localStorage.getItem('clinic_token') : null;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Lỗi hệ thống' }));
    throw new Error(error.message || 'Lỗi hệ thống');
  }

  return response.json();
}

// ========== Doctors & Shifts ==========

export const customerApi = {
  getDoctors: () => fetchApi<DoctorSummary[]>(`${API_BASE}/doctors`),

  getAvailableShifts: (doctorId: string, date: string) =>
    fetchApi<AvailableShift[]>(`${API_BASE}/doctors/${doctorId}/shifts?date=${date}`),

  getServices: () => fetchApi<ClinicService[]>(`${API_BASE}/services`),

  // ========== Booking ==========

  createBooking: (data: CreateBookingRequest) =>
    fetchApi<BookingTicket>(`${API_BASE}/bookings`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  processPayment: (bookingId: string) =>
    fetchApi<BookingTicket>(`${API_BASE}/bookings/${bookingId}/pay`, {
      method: 'POST',
    }),

  getBookingTicket: (bookingId: string) =>
    fetchApi<BookingTicket>(`${API_BASE}/bookings/${bookingId}`),

  // ========== Check-in ==========

  checkInByQr: (bookingId: string) =>
    fetchApi<BookingTicket>(`${API_BASE}/checkin/qr/${bookingId}`, { method: 'POST' }),

  checkInByPhone: (phone: string) =>
    fetchApi<BookingTicket>(`${API_BASE}/checkin/phone?phone=${encodeURIComponent(phone)}`, {
      method: 'POST',
    }),

  // ========== Health Profile ==========

  lookupPatient: (phone: string) =>
    fetchApi<PatientSummary>(`${API_BASE}/patients/lookup?phone=${encodeURIComponent(phone)}`),

  getPatientBookings: (patientId: string) =>
    fetchApi<PatientBooking[]>(`${API_BASE}/patients/${patientId}/bookings`),

  submitRating: (bookingId: string, data: RatingRequest) =>
    fetchApi<{ message: string }>(`${API_BASE}/bookings/${bookingId}/rating`, {
      method: 'POST',
      withAuth: true,
      body: JSON.stringify(data),
    }),

  cancelBooking: (bookingId: string, phone: string) =>
    fetchApi<BookingTicket | { message: string }>(
      `${API_BASE}/bookings/${bookingId}/cancel?phone=${encodeURIComponent(phone)}`,
      {
        method: 'POST',
      },
    ),
};
