// Doctor Types - Frontend
export interface Doctor {
  id: string;
  displayName: string;
  specialty: string | null;
  avatarUrl: string | null;
  phone: string;
}

export interface Patient {
  id: string;
  fullName: string;
  phone: string;
  nationalId: string | null;
  dateOfBirth: string | null;
  age: number | null;
  gender: string | null;
  weightKg: number | null;
  heightCm: number | null;
  allergies: string | null;
  address: string | null;
}

export type ShiftType = 'MORNING' | 'AFTERNOON';
export type ShiftStatus = 'OPEN' | 'CLOSED';
export type SlotPool = 'COMMON' | 'RESERVE' | 'OVERRIDE';

export interface Shift {
  id: string;
  date: string;
  type: ShiftType;
  startTime: string;
  endTime: string;
  timeRange: string;
  status: ShiftStatus;
  totalPatients: number;
  waitingCount: number;
  checkedInCount: number;
  inConsultationCount: number;
  completedCount: number;
}

export interface ScheduleBooking {
  id: string;
  queueNumber: number | null;
  appointmentTime: string;
  slotSequence: number;
  slotPool: SlotPool | null;
  patient: Patient;
  serviceName: string | null;
  status: BookingStatus;
  channel: BookingChannel;
  checkInAt: string | null;
}

export interface ScheduleShift {
  id: string;
  date: string;
  type: ShiftType;
  startTime: string;
  endTime: string;
  timeRange: string;
  status: ShiftStatus;
  totalPatients: number;
  bookedCount: number;
  waitingCount: number;
  checkedInCount: number;
  inConsultationCount: number;
  completedCount: number;
  bookings: ScheduleBooking[];
}

export type BookingStatus =
  | 'BOOKED'
  | 'CHECKED_IN'
  | 'WAITING'
  | 'IN_CONSULTATION'
  | 'PENDING_LAB'
  | 'RESULTS_READY'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'CANCELED';

export type BookingChannel = 'WEB' | 'WALK_IN';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'VOID';

export interface QueueItem {
  id: string;
  queueNumber: number | null;
  appointmentTime: string;
  slotSequence: number;
  patient: Patient;
  serviceName: string | null;
  status: BookingStatus;
  channel: BookingChannel;
  checkInAt: string | null;
  priorityScore: number;
  skipCount: number;
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

export interface Medication {
  id: string;
  name: string;
  unit: string;
  usage: string | null;
  defaultDose: string | null;
  priceCents: number;
  availableStock: number;
}

export interface PrescriptionTemplateItem {
  medicationId: string;
  medicationName: string;
  unit: string;
  qty: number;
  dosage: string | null;
  note: string | null;
  priceCents: number;
}

export interface PrescriptionTemplate {
  id: string;
  name: string;
  note: string | null;
  items: PrescriptionTemplateItem[];
}

export type PrescriptionStatus = 'HELD' | 'PAID' | 'CANCELED' | 'EXPIRED';

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
  status: PrescriptionStatus;
  items: PrescriptionItem[];
  totalCents: number;
  createdAt: string;
}

export interface BookingDetail {
  id: string;
  queueNumber: number | null;
  patient: Patient;
  shift: Shift;
  doctor: Doctor;
  serviceName: string | null;
  status: BookingStatus;
  channel: BookingChannel;
  paymentStatus: PaymentStatus;
  checkInAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  medicalRecord: MedicalRecord | null;
  prescription: Prescription | null;
}

// Request types
export interface SaveMedicalRecordRequest {
  symptoms?: string;
  diagnosis?: string;
  conclusion?: string;
  notes?: string;
  weightKg?: number;
  heightCm?: number;
}

export interface SavePrescriptionRequest {
  items: {
    medicationId: string;
    qty: number;
    dosage?: string;
    note?: string;
  }[];
}
