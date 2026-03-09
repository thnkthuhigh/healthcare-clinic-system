import type {
  Doctor,
  Shift,
  QueueItem,
  BookingDetail,
  MedicalRecord,
  Medication,
  Prescription,
  Patient,
  SaveMedicalRecordRequest,
  SavePrescriptionRequest,
} from './types';

const API_BASE = 'http://localhost:4000/api/doctor';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('clinic_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options?.headers,
    },
  });

  if (response.status === 401 || response.status === 403) {
    // Token expired or invalid, redirect to login
    localStorage.removeItem('clinic_token');
    localStorage.removeItem('clinic_user');
    window.location.href = '/login';
    throw new Error('Phiên đăng nhập hết hạn');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'API Error' }));
    throw new Error(error.message || 'API Error');
  }

  return response.json();
}

// ========== Doctor API ==========

export const doctorApi = {
  // Get doctor profile
  getProfile: (userId: string) => fetchApi<Doctor>(`${API_BASE}/profile?userId=${userId}`),

  // Get shifts for a date
  getShifts: (doctorId: string, date?: string) => {
    const params = date ? `?date=${date}` : '';
    return fetchApi<Shift[]>(`${API_BASE}/${doctorId}/shifts${params}`);
  },

  // Get shift details
  getShiftDetails: (shiftId: string) => fetchApi<Shift>(`${API_BASE}/shifts/${shiftId}`),

  // Get patient queue
  getQueue: (shiftId: string, status?: string) => {
    const params = status ? `?status=${status}` : '';
    return fetchApi<QueueItem[]>(`${API_BASE}/shifts/${shiftId}/queue${params}`);
  },

  // Get all bookings for a shift
  getAllBookings: (shiftId: string) =>
    fetchApi<QueueItem[]>(`${API_BASE}/shifts/${shiftId}/bookings`),

  // Get shifts by date range (for schedule page)
  getSchedule: (doctorId: string, from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<Shift[]>(`${API_BASE}/${doctorId}/schedule${qs}`);
  },

  // Search patients
  searchPatients: (query: string) =>
    fetchApi<Patient[]>(`${API_BASE}/patients/search?query=${encodeURIComponent(query)}`),
};

// ========== Consultation API ==========

export const consultationApi = {
  // Get booking details
  getBookingDetails: (bookingId: string) =>
    fetchApi<BookingDetail>(`${API_BASE}/consultation/bookings/${bookingId}`),

  // Invite next patient
  inviteNextPatient: (shiftId: string) =>
    fetchApi<QueueItem>(`${API_BASE}/consultation/shifts/${shiftId}/invite-next`, {
      method: 'POST',
    }),

  // Invite specific patient
  invitePatient: (bookingId: string) =>
    fetchApi<QueueItem>(`${API_BASE}/consultation/bookings/${bookingId}/invite`, {
      method: 'POST',
    }),

  // Skip patient
  skipPatient: (bookingId: string) =>
    fetchApi<{ message: string }>(`${API_BASE}/consultation/bookings/${bookingId}/skip`, {
      method: 'POST',
    }),

  // Send to lab
  sendToLab: (bookingId: string) =>
    fetchApi<{ message: string }>(`${API_BASE}/consultation/bookings/${bookingId}/send-to-lab`, {
      method: 'POST',
    }),

  // Mark results ready
  markResultsReady: (bookingId: string) =>
    fetchApi<{ message: string }>(`${API_BASE}/consultation/bookings/${bookingId}/results-ready`, {
      method: 'POST',
    }),

  // Save medical record
  saveMedicalRecord: (bookingId: string, data: SaveMedicalRecordRequest) =>
    fetchApi<MedicalRecord>(`${API_BASE}/consultation/bookings/${bookingId}/medical-record`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Save prescription
  savePrescription: (bookingId: string, data: SavePrescriptionRequest) =>
    fetchApi<Prescription>(`${API_BASE}/consultation/bookings/${bookingId}/prescription`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Complete consultation
  completeConsultation: (bookingId: string) =>
    fetchApi<{ message: string }>(`${API_BASE}/consultation/bookings/${bookingId}/complete`, {
      method: 'POST',
    }),

  // Get patient details
  getPatientDetails: (patientId: string) =>
    fetchApi<Patient>(`${API_BASE}/consultation/patients/${patientId}`),

  // Get patient history
  getPatientHistory: (patientId: string) =>
    fetchApi<MedicalRecord[]>(`${API_BASE}/consultation/patients/${patientId}/history`),

  // Search medications
  searchMedications: (query?: string) => {
    const params = query ? `?query=${encodeURIComponent(query)}` : '';
    return fetchApi<Medication[]>(`${API_BASE}/consultation/medications${params}`);
  },
};
