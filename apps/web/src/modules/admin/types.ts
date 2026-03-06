// Admin Module Types

export interface DashboardStats {
  todayPatients: number;
  waitingCount: number;
  inConsultationCount: number;
  completedCount: number;
  unpaidCount: number;
  revenue: number;
  webBookings: number;
  walkInBookings: number;
}

export interface ShiftOverview {
  id: string;
  doctorName: string;
  date: string;
  type: 'MORNING' | 'AFTERNOON';
  startTime: string;
  endTime: string;
  totalSlots: number;
  bookedSlots: number;
  commonAvailable: number;
  reserveAvailable: number;
  status: 'OPEN' | 'CLOSED';
}

export interface UserAccount {
  id: string;
  phone: string;
  role: string;
  status: string;
  fullName: string | null;
  createdAt: string;
}

export interface DoctorAccount {
  id: string;
  userId: string;
  displayName: string;
  specialty: string | null;
  phone: string;
  status: string;
}

export interface PatientAccount {
  id: string;
  fullName: string;
  phone: string;
  nationalId: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
}

export interface MedicationItem {
  id: string;
  name: string;
  unit: string;
  usage: string | null;
  defaultDose: string | null;
  priceCents: number;
  stockReal: number;
  stockHold: number;
  isActive: boolean;
}

export interface ServiceItem {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number;
  isActive: boolean;
}

export interface BookingOverview {
  id: string;
  queueNumber: number | null;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  serviceName: string | null;
  status: string;
  channel: 'WEB' | 'WALK_IN';
  paymentStatus: 'UNPAID' | 'PAID' | 'VOID';
  checkInAt: string | null;
  shiftType: 'MORNING' | 'AFTERNOON';
}

// ========== Reception Types ==========

export interface ReceptionBooking {
  id: string;
  queueNumber: number | null;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  shiftId: string;
  shiftType: string;
  serviceName: string | null;
  status: string;
  channel: 'WEB' | 'WALK_IN';
  paymentStatus: 'UNPAID' | 'PAID' | 'VOID';
  checkInAt: string | null;
  createdAt: string | null;
  priorityScore: number;
}

export interface WalkInRequest {
  patientName: string;
  patientPhone: string;
  shiftId: string;
  serviceId?: string;
}

export interface WalkInResponse {
  booking: ReceptionBooking;
  poolUsed: 'COMMON' | 'RESERVE' | 'OVERRIDE';
  isOverride: boolean;
  queueNumber: number;
}

// ========== Doctor & Patient Management Types ==========

export interface AdminDoctorDto {
  id: string;
  userId: string;
  phone: string;
  displayName: string;
  specialty: string | null;
  status: 'ACTIVE' | 'LOCKED';
  createdAt: string;
}

export interface CreateDoctorRequest {
  phone: string;
  password: string;
  displayName: string;
  specialty?: string | undefined;
}

export interface UpdateDoctorRequest {
  displayName?: string | undefined;
  specialty?: string | undefined;
  newPassword?: string | undefined;
}

export interface AdminPatientDto {
  id: string;
  fullName: string;
  phone: string;
  nationalId: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  allergies: string | null;
  hasAccount: boolean;
  createdAt: string;
}

// ========== Cashier Types ==========

export interface CashierPrescriptionItem {
  id: string;
  medicationName: string;
  unit: string;
  qty: number;
  dosage: string | null;
  note: string | null;
  unitPriceCents: number;
  totalCents: number;
}

export interface CashierBooking {
  bookingId: string;
  queueNumber: number | null;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  serviceName: string | null;
  servicePriceCents: number;
  status: string;
  channel: 'WEB' | 'WALK_IN';
  paymentStatus: 'UNPAID' | 'PAID' | 'VOID';
  completedAt: string | null;
  prescriptionId: string | null;
  prescriptionStatus: 'HELD' | 'PAID' | 'CANCELED' | 'EXPIRED' | null;
  prescriptionItems: CashierPrescriptionItem[] | null;
  prescriptionTotalCents: number | null;
  totalBillCents: number;
}

// ========== Shift Management Types ==========

export interface AdminShiftDto {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string | null;
  date: string;
  type: 'MORNING' | 'AFTERNOON';
  status: 'OPEN' | 'CLOSED';
  startTime: string;
  endTime: string;
  totalSlots: number;
  openSlots: number;
  bookedSlots: number;
  createdAt: string;
}

export interface AdminSlotDto {
  id: string;
  sequence: number;
  pool: 'COMMON' | 'RESERVE' | 'OVERRIDE';
  status: 'OPEN' | 'LOCKED';
}

export interface CreateShiftRequest {
  doctorId: string;
  date: string;
  type: 'MORNING' | 'AFTERNOON';
}

// ========== Service Management Types ==========

export interface AdminServiceDto {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number;
  active: boolean;
}

export interface CreateServiceRequest {
  name: string;
  durationMin: number;
  priceCents: number;
}

export interface UpdateServiceRequest {
  name?: string | undefined;
  durationMin?: number | undefined;
  priceCents?: number | undefined;
}

// ========== Medication Management Types ==========

export interface AdminMedicationDto {
  id: string;
  name: string;
  unit: string;
  usage: string | null;
  defaultDose: string | null;
  priceCents: number;
  stockReal: number;
  stockHold: number;
  availableStock: number;
  active: boolean;
}

export interface CreateMedicationRequest {
  name: string;
  unit: string;
  usage?: string | undefined;
  defaultDose?: string | undefined;
  priceCents: number;
  initialStock: number;
}

export interface UpdateMedicationRequest {
  name?: string | undefined;
  unit?: string | undefined;
  usage?: string | undefined;
  defaultDose?: string | undefined;
  priceCents?: number | undefined;
}

// ========== Prescription Template Types ==========

export interface PrescriptionTemplateItemDto {
  id: string;
  medicationId: string;
  medicationName: string;
  unit: string;
  qty: number;
  dosage: string | null;
  note: string | null;
  priceCents: number;
}

export interface AdminPrescriptionTemplateDto {
  id: string;
  name: string;
  note: string | null;
  active: boolean;
  createdAt: string;
  itemCount: number;
  items: PrescriptionTemplateItemDto[];
}

export interface SavePrescriptionTemplateItemRequest {
  medicationId: string;
  qty: number;
  dosage?: string | undefined;
  note?: string | undefined;
}

export interface SavePrescriptionTemplateRequest {
  name: string;
  note?: string | undefined;
  items: SavePrescriptionTemplateItemRequest[];
}

// ========== Department Types ==========

export interface DepartmentDto {
  id: string;
  name: string;
  createdAt: string;
}
