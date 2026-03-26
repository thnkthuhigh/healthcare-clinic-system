import type {
  AvailableShift,
  BookingTicket,
  ClinicService,
  CreateBookingRequest,
  DoctorSummary,
  PatientBooking,
  PatientSummary,
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
    const rawBody = await response.text();
    let message = 'Lỗi hệ thống';
    if (rawBody) {
      try {
        const parsed = JSON.parse(rawBody) as { message?: string; error?: string };
        message = parsed.message || parsed.error || message;
      } catch {
        message = rawBody.includes('<html') || rawBody.includes('<!doctype') ? message : rawBody;
      }
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const customerApi = {
  getDoctors: (serviceId?: string | null) =>
    fetchApi<DoctorSummary[]>(
      `${API_BASE}/doctors${serviceId ? `?serviceId=${encodeURIComponent(serviceId)}` : ''}`,
    ),

  getAvailableShifts: (doctorId: string, date: string) =>
    fetchApi<AvailableShift[]>(`${API_BASE}/doctors/${doctorId}/shifts?date=${date}`),

  getServices: () => fetchApi<ClinicService[]>(`${API_BASE}/services`),

  createBooking: (data: CreateBookingRequest) =>
    fetchApi<BookingTicket>(`${API_BASE}/bookings`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  processPayment: (bookingId: string, method: 'QR' | 'CASH' = 'QR') =>
    fetchApi<BookingTicket>(`${API_BASE}/bookings/${bookingId}/pay`, {
      method: 'POST',
      body: JSON.stringify({ method }),
    }),

  getBookingTicket: (bookingId: string) =>
    fetchApi<BookingTicket>(`${API_BASE}/bookings/${bookingId}`),

  checkInByQr: (bookingId: string) =>
    fetchApi<BookingTicket>(`${API_BASE}/checkin/qr/${bookingId}`, { method: 'POST' }),

  checkInByPhone: (phone: string) =>
    fetchApi<BookingTicket>(`${API_BASE}/checkin/phone?phone=${encodeURIComponent(phone)}`, {
      method: 'POST',
    }),

  lookupPatient: (phone: string) =>
    fetchApi<PatientSummary>(`${API_BASE}/patients/lookup?phone=${encodeURIComponent(phone)}`),

  getPatientBookings: (patientId: string) =>
    fetchApi<PatientBooking[]>(`${API_BASE}/patients/${patientId}/bookings`),

  submitRating: (bookingId: string, data: RatingRequest) =>
    fetchApi<{ message: string }>(`${API_BASE}/bookings/${bookingId}/rating`, {
      method: 'POST',
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
