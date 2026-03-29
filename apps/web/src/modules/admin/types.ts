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
  roomName: string | null;
  slotPool: 'COMMON' | 'RESERVE' | 'OVERRIDE' | null;
  serviceName: string | null;
  status: string;
  channel: 'WEB' | 'WALK_IN';
  paymentStatus: 'UNPAID' | 'PAID' | 'VOID';
  checkInAt: string | null;
  createdAt: string | null;
  priorityScore: number;
  followUp: boolean;
  followUpSourceBookingId: string | null;
  followUpScheduledAt: string | null;
  followUpNote: string | null;
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

export interface CreateVisitRequest {
  patientName: string;
  patientPhone: string;
  patientDob?: string | undefined;
  patientGender?: 'MALE' | 'FEMALE' | 'OTHER' | undefined;
  patientNationalId?: string | undefined;
  patientInsuranceCode?: string | undefined;
  serviceId: string;
  preferredDoctorId?: string | undefined;
  forceOverride?: boolean | undefined;
}

export interface CreateVisitResponse {
  bookingId: string;
  patientId: string;
  patientName: string;
  queueNumber: number;
  doctorName: string;
  roomName: string;
  shiftType: 'MORNING' | 'AFTERNOON';
  isOverride: boolean;
  poolUsed: 'COMMON' | 'RESERVE' | 'OVERRIDE';
  isNewPatient: boolean;
}

export interface PatientLookupResponse {
  patientId: string;
  fullName: string;
  phone: string;
  dateOfBirth?: string | undefined;
  gender?: string | undefined;
  nationalId?: string | undefined;
  insuranceCode?: string | undefined;
}

export interface DispatchOptionDto {
  shiftId: string;
  doctorId: string;
  doctorName: string;
  roomName: string;
  shiftType: 'MORNING' | 'AFTERNOON';
  openSlots: number;
  bookingLoad: number;
}

// ========== Doctor & Patient Management Types ==========

export interface AdminDoctorDto {
  id: string;
  userId: string;
  phone: string;
  displayName: string;
  specialty: string | null;
  avatarUrl: string | null;
  bio: string | null;
  experienceYears: number;
  qualifications: string | null;
  dateOfBirth: string | null;
  nationalId: string | null;
  workHistory: string | null;
  serviceIds: string[];
  status: 'ACTIVE' | 'LOCKED';
  totpProvisioned: boolean;
  totpConfirmed: boolean;
  createdAt: string;
}

export interface AdminDoctorTotpSetup {
  secret: string;
  manualEntryKey: string;
  otpAuthUri: string;
  confirmed: boolean;
  issuer: string;
  accountName: string;
}

export interface CreateDoctorRequest {
  phone: string;
  password: string;
  displayName: string;
  specialty?: string | undefined;
  avatarUrl?: string | undefined;
  bio?: string | undefined;
  experienceYears?: number | undefined;
  qualifications?: string | undefined;
  dateOfBirth?: string | undefined;
  nationalId?: string | undefined;
  workHistory?: string | undefined;
  serviceIds?: string[] | undefined;
}

export interface UpdateDoctorRequest {
  displayName?: string | undefined;
  specialty?: string | undefined;
  newPassword?: string | undefined;
  avatarUrl?: string | undefined;
  bio?: string | undefined;
  experienceYears?: number | undefined;
  qualifications?: string | undefined;
  dateOfBirth?: string | undefined;
  nationalId?: string | undefined;
  workHistory?: string | undefined;
  serviceIds?: string[] | undefined;
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
  labFeeCents: number;
  status: string;
  channel: 'WEB' | 'WALK_IN';
  paymentStatus: 'UNPAID' | 'PAID' | 'VOID';
  completedAt: string | null;
  paymentMethod: 'QR' | 'CASH' | 'VNPAY' | null;
  paidAt: string | null;
  billedByUserId: string | null;
  billedByName: string | null;
  bookingFeeCents: number | null;
  bookingFeePaidAt: string | null;
  bookingFeePaymentMethod: 'QR' | 'CASH' | 'VNPAY' | null;
  prescriptionId: string | null;
  prescriptionStatus: 'HELD' | 'PAID' | 'CANCELED' | 'EXPIRED' | null;
  prescriptionItems: CashierPrescriptionItem[] | null;
  prescriptionTotalCents: number | null;
  totalBillCents: number;
}

export interface RetailSaleItemRequest {
  medicationId: string;
  qty: number;
}

export interface RetailSaleRequest {
  customerName?: string | undefined;
  customerPhone?: string | undefined;
  items: RetailSaleItemRequest[];
}

export interface RetailSaleItem {
  medicationId: string;
  medicationName: string;
  unit: string;
  qty: number;
  unitPriceCents: number;
  lineTotalCents: number;
}

export interface RetailSaleResponse {
  invoiceCode: string;
  customerName: string | null;
  customerPhone: string | null;
  totalCents: number;
  createdAt: string;
  billedByUserId: string | null;
  billedByName: string | null;
  items: RetailSaleItem[];
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
  isMakeup: boolean;
  adjustmentNote: string | null;
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

export interface BulkShiftRequest {
  doctorId: string;
  weekStartDate: string;
  shiftTypes?: Array<'MORNING' | 'AFTERNOON'> | undefined;
  daysOfWeek?: number[] | undefined;
  dayConfigs?: DayShiftConfig[] | undefined;
  repeatWeeks?: number | undefined;
}

export interface DayShiftConfig {
  dayOfWeek: number;
  shiftTypes: Array<'MORNING' | 'AFTERNOON'>;
}

export interface BulkShiftSkippedItem {
  date: string;
  type: 'MORNING' | 'AFTERNOON';
  reason: string;
}

export interface BulkShiftResponse {
  doctorId: string;
  weekStartDate: string;
  repeatWeeks?: number | undefined;
  created: AdminShiftDto[];
  skipped: BulkShiftSkippedItem[];
}

export interface SyncWeekShiftRequest {
  doctorId: string;
  weekStartDate: string;
  note: string;
  dayConfigs: DayShiftConfig[];
}

export interface SyncWeekShiftDeletedItem {
  date: string;
  type: 'MORNING' | 'AFTERNOON';
}

export interface SyncWeekShiftResponse {
  doctorId: string;
  weekStartDate: string;
  created: AdminShiftDto[];
  deleted: SyncWeekShiftDeletedItem[];
  skipped: BulkShiftSkippedItem[];
}

// ========== Service Management Types ==========

export interface AdminServiceDto {
  id: string;
  name: string;
  priceCents: number;
  active: boolean;
  specialtyId?: string | null;
  specialtyName?: string | null;
}

export interface CreateServiceRequest {
  name: string;
  priceCents: number;
  specialtyId?: string | undefined;
}

export interface UpdateServiceRequest {
  name?: string | undefined;
  priceCents?: number | undefined;
  specialtyId?: string | undefined;
}

// ========== Room Management Types ==========

export type RoomStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';

export interface AdminRoomDto {
  id: string;
  code: string;
  name: string;
  serviceId: string | null;
  serviceName: string | null;
  status: RoomStatus;
  assetCount: number;
  createdAt: string;
}

export interface CreateRoomRequest {
  code: string;
  name: string;
  serviceId: string;
  status?: RoomStatus | undefined;
}

export interface UpdateRoomRequest {
  code?: string | undefined;
  name?: string | undefined;
  serviceId?: string | undefined;
  status?: RoomStatus | undefined;
}

// ========== Supply Management Types ==========

export interface AdminSupplyDto {
  id: string;
  name: string;
  unit: string;
  stockQty: number;
  minQty: number;
  unitCostCents: number;
  active: boolean;
  lowStock: boolean;
  createdAt: string | null;
}

export interface CreateSupplyRequest {
  name: string;
  unit: string;
  stockQty?: number | undefined;
  minQty?: number | undefined;
  unitCostCents?: number | undefined;
  active?: boolean | undefined;
}

export interface UpdateSupplyRequest {
  name?: string | undefined;
  unit?: string | undefined;
  stockQty?: number | undefined;
  minQty?: number | undefined;
  unitCostCents?: number | undefined;
  active?: boolean | undefined;
}

// ========== Asset Management Types ==========

export type AssetStatus = 'ACTIVE' | 'MAINTENANCE' | 'RETIRED';

export interface AdminAssetDto {
  id: string;
  name: string;
  assetCode: string | null;
  category: string;
  roomId: string | null;
  roomName: string | null;
  purchaseDate: string | null;
  purchasePriceCents: number;
  status: AssetStatus;
  notes: string | null;
  createdAt: string | null;
}

export interface CreateAssetRequest {
  name: string;
  assetCode?: string | undefined;
  category: string;
  roomId?: string | undefined;
  purchaseDate?: string | undefined;
  purchasePriceCents?: number | undefined;
  status?: AssetStatus | undefined;
  notes?: string | undefined;
}

export interface UpdateAssetRequest {
  name?: string | undefined;
  assetCode?: string | undefined;
  category?: string | undefined;
  roomId?: string | undefined;
  purchaseDate?: string | undefined;
  purchasePriceCents?: number | undefined;
  status?: AssetStatus | undefined;
  notes?: string | undefined;
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

// ========== Patient Records Types (PR7) ==========

export interface PatientRecordPrescriptionItem {
  medicationName: string;
  unit: string;
  qty: number;
  dosage: string | null;
  note: string | null;
}

export interface VisitRecordDto {
  recordId: string;
  bookingId: string;
  doctorName: string;
  serviceName: string | null;
  symptoms: string | null;
  diagnosis: string | null;
  conclusion: string | null;
  notes: string | null;
  bookingStatus: string;
  paymentStatus: string;
  visitDate: string | null;
  prescriptionItems: PatientRecordPrescriptionItem[] | null;
  prescriptionStatus: string | null;
}

export interface PatientRecordDto {
  patientId: string;
  fullName: string;
  phone: string;
  nationalId: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  allergies: string | null;
  address: string | null;
  records: VisitRecordDto[];
}

// ========== Report Types (PR7) ==========

export interface ReportSummaryDto {
  totalBookings: number;
  completedBookings: number;
  canceledBookings: number;
  noShowBookings: number;
  webBookings: number;
  walkInBookings: number;
  paidBookings: number;
  unpaidBookings: number;
  totalRevenueCents: number;
  serviceRevenueCents: number;
  prescriptionRevenueCents: number;
  overrideCount: number;
}

export interface AuditLogDto {
  id: string;
  actorUserId: string | null;
  actorName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metaJson: string | null;
  createdAt: string;
}

export interface FinanceLedgerEntryDto {
  id: string;
  entryDate: string;
  entryType: 'INCOME' | 'EXPENSE' | string;
  category: string;
  refType: string | null;
  refId: string | null;
  description: string;
  qty: number | null;
  unit: string | null;
  amountCents: number;
  actorUserId: string | null;
  actorName: string | null;
  createdAt: string | null;
}

export interface FinanceSummaryDto {
  totalIncomeCents: number;
  totalExpenseCents: number;
  balanceCents: number;
}

export interface ManualFinanceEntryRequest {
  entryDate?: string | undefined;
  flowType: 'THU' | 'CHI' | 'NHAP' | 'XUAT';
  description: string;
  qty?: number | undefined;
  unit?: string | undefined;
  amountCents: number;
}

export interface DailyInvoiceDto {
  bookingId: string;
  queueNumber: number | null;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  serviceName: string | null;
  roomName: string | null;
  shiftType: string | null;
  channel: string;
  status: string;
  paymentStatus: string;
  invoiceAt: string | null;
  serviceAmountCents: number;
  labAmountCents: number;
  medicationAmountCents: number;
  totalAmountCents: number;
}

export interface DoctorVisitStatsDto {
  doctorId: string;
  doctorName: string;
  specialty: string | null;
  morningVisits: number;
  afternoonVisits: number;
  totalVisits: number;
}
