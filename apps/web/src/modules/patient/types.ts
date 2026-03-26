// Patient / Customer-facing types

export interface DoctorSummary {
  id: string;
  displayName: string;
  specialty: string | null;
  avatarUrl: string | null;
  averageStars: number | null;
}

export interface AvailableShift {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'MORNING' | 'AFTERNOON';
  startTime: string; // ISO instant
  endTime: string;
  timeRange: string; // e.g. "07:00 - 12:00"
  status: 'OPEN' | 'CLOSED';
  availableSlots: number;
  isFull: boolean;
}

export interface ClinicService {
  id: string;
  name: string;
  priceCents: number;
}

export interface CreateBookingRequest {
  shiftId: string;
  serviceId?: string;
  fullName: string;
  phone: string;
  nationalId?: string;
  dateOfBirth?: string; // YYYY-MM-DD
  gender?: string;
  notes?: string;
}

export interface BookingTicket {
  bookingId: string;
  queueNumber: number | null;
  slotSequence: number;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  specialty: string | null;
  date: string; // YYYY-MM-DD
  shiftType: 'MORNING' | 'AFTERNOON';
  timeRange: string;
  serviceName: string | null;
  status: string;
  paymentStatus: 'UNPAID' | 'PAID' | 'VOID';
  createdAt: string; // ISO instant
  appointmentTime: string;
  currentServingQueueNumber: number | null;
  estimatedTurnAt: string;
  bookingFeeCents: number;
  bookingFeePaid: boolean;
  bookingFeePaidAt: string | null;
  bookingFeePaymentMethod: 'QR' | 'CASH' | null;
}

export interface PatientSummary {
  id: string;
  fullName: string;
  phone: string;
  nationalId: string | null;
}

export interface PrescriptionItem {
  id: string;
  medicationId: string;
  medicationName: string;
  unit: string;
  qty: number;
  dosage: string | null;
  note: string | null;
  unitPriceCents: number;
  totalCents: number;
}

export interface Prescription {
  id: string;
  bookingId: string;
  status: 'HELD' | 'PAID' | 'CANCELED' | 'EXPIRED';
  items: PrescriptionItem[];
  totalCents: number;
  createdAt: string;
}

export interface MedicalRecord {
  id: string;
  bookingId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  symptoms: string | null;
  diagnosis: string | null;
  conclusion: string | null;
  notes: string | null;
  serviceName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PatientBooking {
  bookingId: string;
  queueNumber: number | null;
  slotSequence: number;
  date: string;
  shiftType: 'MORNING' | 'AFTERNOON';
  timeRange: string;
  doctorName: string;
  specialty: string | null;
  serviceName: string | null;
  status: string;
  paymentStatus: 'UNPAID' | 'PAID' | 'VOID';
  servicePriceCents: number;
  labFeeCents: number;
  prescriptionAmountCents: number;
  totalBillCents: number;
  bookingFeeCents: number;
  bookingFeePaid: boolean;
  bookingFeePaidAt: string | null;
  bookingFeePaymentMethod: 'QR' | 'CASH' | null;
  followUp: boolean;
  followUpSourceBookingId: string | null;
  followUpScheduledAt: string | null;
  followUpNote: string | null;
  createdAt: string;
  appointmentTime: string;
  checkInAt: string | null;
  completedAt: string | null;
  currentServingQueueNumber: number | null;
  estimatedTurnAt: string;
  medicalRecord: MedicalRecord | null;
  prescription: Prescription | null;
  ratingStars: number | null;
  ratingComment: string | null;
}

export interface RatingRequest {
  stars: number;
  comment?: string;
}
