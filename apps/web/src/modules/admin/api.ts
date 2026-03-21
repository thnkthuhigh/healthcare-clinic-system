import type {
  AdminAssetDto,
  AdminDoctorDto,
  AdminMedicationDto,
  AdminPatientDto,
  AdminPrescriptionTemplateDto,
  AdminRoomDto,
  AdminServiceDto,
  AdminSupplyDto,
  AdminShiftDto,
  AdminSlotDto,
  AuditLogDto,
  CashierBooking,
  FinanceLedgerEntryDto,
  FinanceSummaryDto,
  ManualFinanceEntryRequest,
  CreateVisitRequest,
  CreateVisitResponse,
  DispatchOptionDto,
  CreateDoctorRequest,
  CreateAssetRequest,
  CreateMedicationRequest,
  CreateRoomRequest,
  CreateServiceRequest,
  CreateSupplyRequest,
  CreateShiftRequest,
  BulkShiftRequest,
  BulkShiftResponse,
  SyncWeekShiftRequest,
  SyncWeekShiftResponse,
  DailyInvoiceDto,
  DashboardStats,
  DepartmentDto,
  DoctorVisitStatsDto,
  PatientRecordDto,
  PatientLookupResponse,
  ReceptionBooking,
  RetailSaleRequest,
  RetailSaleResponse,
  ReportSummaryDto,
  SavePrescriptionTemplateRequest,
  ShiftOverview,
  UpdateDoctorRequest,
  UpdateAssetRequest,
  UpdateMedicationRequest,
  UpdateRoomRequest,
  UpdateServiceRequest,
  UpdateSupplyRequest,
  WalkInRequest,
  WalkInResponse,
} from './types';

const API_BASE = 'http://localhost:4000/api/v1/admin';

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
    localStorage.removeItem('clinic_token');
    localStorage.removeItem('clinic_user');
    window.location.href = '/login';
    throw new Error('Phiên đăng nhập hết hạn');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'API Error' }));
    const apiError = new Error(error.message || 'API Error') as Error & { status?: number };
    apiError.status = response.status;
    throw apiError;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  const rawBody = await response.text();
  if (!rawBody) {
    return undefined as T;
  }

  try {
    return JSON.parse(rawBody) as T;
  } catch {
    return rawBody as T;
  }
}

// ========== Dashboard API ==========

export const adminApi = {
  getDashboardStats: (date?: string) => {
    const params = date ? `?date=${date}` : '';
    return fetchApi<DashboardStats>(`${API_BASE}/dashboard/stats${params}`);
  },

  getTodayShifts: (date?: string) => {
    const params = date ? `?date=${date}` : '';
    return fetchApi<ShiftOverview[]>(`${API_BASE}/dashboard/shifts${params}`);
  },

  // ========== Reception API ==========

  getReceptionBookings: (date?: string, shiftId?: string) => {
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    if (shiftId) params.set('shiftId', shiftId);
    const qs = params.toString();
    return fetchApi<ReceptionBooking[]>(`${API_BASE}/reception/bookings${qs ? '?' + qs : ''}`);
  },

  searchBookingsByPhone: (phone: string, date?: string) => {
    const params = new URLSearchParams({ phone });
    if (date) params.set('date', date);
    return fetchApi<ReceptionBooking[]>(`${API_BASE}/reception/search?${params.toString()}`);
  },

  checkIn: (bookingId: string) =>
    fetchApi<ReceptionBooking>(`${API_BASE}/reception/check-in`, {
      method: 'POST',
      body: JSON.stringify({ bookingId }),
    }),

  walkIn: (data: WalkInRequest) =>
    fetchApi<WalkInResponse>(`${API_BASE}/reception/walk-in`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createVisit: (data: CreateVisitRequest) =>
    fetchApi<CreateVisitResponse>(`${API_BASE}/reception/create-visit`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  lookupPatient: (phone: string) =>
    fetchApi<PatientLookupResponse | null>(
      `${API_BASE}/reception/lookup?phone=${encodeURIComponent(phone)}`,
    ),

  getDispatchOptions: (serviceId: string) =>
    fetchApi<DispatchOptionDto[]>(
      `${API_BASE}/reception/dispatch-options?serviceId=${encodeURIComponent(serviceId)}`,
    ),

  markNoShow: (bookingId: string) =>
    fetchApi<{ message: string }>(`${API_BASE}/reception/no-show/${bookingId}`, {
      method: 'POST',
    }),

  // ========== Cashier API ==========

  getCashierBookings: (date?: string) => {
    const params = date ? `?date=${date}` : '';
    return fetchApi<CashierBooking[]>(`${API_BASE}/cashier/bookings${params}`);
  },

  getCashierBookingDetail: (bookingId: string) =>
    fetchApi<CashierBooking>(`${API_BASE}/cashier/bookings/${bookingId}`),

  processPayment: (bookingId: string) =>
    fetchApi<CashierBooking>(`${API_BASE}/cashier/pay/${bookingId}`, {
      method: 'POST',
    }),

  removePrescriptionItem: (bookingId: string, itemId: string) =>
    fetchApi<CashierBooking>(`${API_BASE}/cashier/bookings/${bookingId}/items/${itemId}`, {
      method: 'DELETE',
    }),

  expireOldPrescriptions: () =>
    fetchApi<{ expiredCount: number; message: string }>(`${API_BASE}/cashier/expire-old`, {
      method: 'POST',
    }),

  retailSale: (data: RetailSaleRequest) =>
    fetchApi<RetailSaleResponse>(`${API_BASE}/cashier/retail-sale`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // ========== Doctor Management API ==========

  getDoctors: () => fetchApi<AdminDoctorDto[]>(`${API_BASE}/doctors`),

  createDoctor: (data: CreateDoctorRequest) =>
    fetchApi<AdminDoctorDto>(`${API_BASE}/doctors`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateDoctor: (id: string, data: UpdateDoctorRequest) =>
    fetchApi<AdminDoctorDto>(`${API_BASE}/doctors/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  lockDoctor: (id: string) =>
    fetchApi<AdminDoctorDto>(`${API_BASE}/doctors/${id}/lock`, { method: 'POST' }),

  unlockDoctor: (id: string) =>
    fetchApi<AdminDoctorDto>(`${API_BASE}/doctors/${id}/unlock`, { method: 'POST' }),

  // ========== Patient Management API ==========

  getPatients: (q?: string) => {
    const params = q ? `?q=${encodeURIComponent(q)}` : '';
    return fetchApi<AdminPatientDto[]>(`${API_BASE}/patients${params}`);
  },

  resetPatientPassword: (id: string, newPassword: string) =>
    fetchApi<{ message: string }>(`${API_BASE}/patients/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    }),

  // ========== Shift Management API ==========

  getShifts: (date?: string) => {
    const params = date ? `?date=${date}` : '';
    return fetchApi<AdminShiftDto[]>(`${API_BASE}/shifts${params}`);
  },

  createShift: (data: CreateShiftRequest) =>
    fetchApi<AdminShiftDto>(`${API_BASE}/shifts`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createShiftsBulk: (data: BulkShiftRequest) =>
    fetchApi<BulkShiftResponse>(`${API_BASE}/shifts/bulk`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  syncWeekShifts: (data: SyncWeekShiftRequest) =>
    fetchApi<SyncWeekShiftResponse>(`${API_BASE}/shifts/sync-week`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  lockShift: (id: string) =>
    fetchApi<AdminShiftDto>(`${API_BASE}/shifts/${id}/lock`, { method: 'POST' }),

  openShift: (id: string) =>
    fetchApi<AdminShiftDto>(`${API_BASE}/shifts/${id}/open`, { method: 'POST' }),

  deleteShift: (id: string) => fetchApi<void>(`${API_BASE}/shifts/${id}`, { method: 'DELETE' }),

  getShiftSlots: (shiftId: string) =>
    fetchApi<AdminSlotDto[]>(`${API_BASE}/shifts/${shiftId}/slots`),

  toggleSlot: (slotId: string) =>
    fetchApi<AdminSlotDto>(`${API_BASE}/shifts/slots/${slotId}/toggle`, { method: 'POST' }),

  // ========== Room Management API ==========

  getRooms: (status?: string, serviceId?: string) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (serviceId) params.set('serviceId', serviceId);
    const qs = params.toString();
    return fetchApi<AdminRoomDto[]>(`${API_BASE}/rooms${qs ? '?' + qs : ''}`);
  },

  createRoom: (data: CreateRoomRequest) =>
    fetchApi<AdminRoomDto>(`${API_BASE}/rooms`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateRoom: (id: string, data: UpdateRoomRequest) =>
    fetchApi<AdminRoomDto>(`${API_BASE}/rooms/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  toggleRoom: (id: string) =>
    fetchApi<AdminRoomDto>(`${API_BASE}/rooms/${id}/toggle`, { method: 'POST' }),

  // ========== Supply Management API ==========

  getSupplies: (active?: boolean, lowStock?: boolean) => {
    const params = new URLSearchParams();
    if (active !== undefined) params.set('active', String(active));
    if (lowStock !== undefined) params.set('lowStock', String(lowStock));
    const qs = params.toString();
    return fetchApi<AdminSupplyDto[]>(`${API_BASE}/supplies${qs ? '?' + qs : ''}`);
  },

  createSupply: (data: CreateSupplyRequest) =>
    fetchApi<AdminSupplyDto>(`${API_BASE}/supplies`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateSupply: (id: string, data: UpdateSupplyRequest) =>
    fetchApi<AdminSupplyDto>(`${API_BASE}/supplies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  restockSupply: (id: string, qty: number, unitCostCents?: number) =>
    fetchApi<AdminSupplyDto>(`${API_BASE}/supplies/${id}/restock`, {
      method: 'POST',
      body: JSON.stringify({
        qty,
        ...(unitCostCents !== undefined ? { unitCostCents } : {}),
      }),
    }),

  toggleSupply: (id: string) =>
    fetchApi<AdminSupplyDto>(`${API_BASE}/supplies/${id}/toggle`, { method: 'POST' }),

  // ========== Asset Management API ==========

  getAssets: (category?: string, status?: string, roomId?: string) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (status) params.set('status', status);
    if (roomId) params.set('roomId', roomId);
    const qs = params.toString();
    return fetchApi<AdminAssetDto[]>(`${API_BASE}/assets${qs ? '?' + qs : ''}`);
  },

  createAsset: (data: CreateAssetRequest) =>
    fetchApi<AdminAssetDto>(`${API_BASE}/assets`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateAsset: (id: string, data: UpdateAssetRequest) =>
    fetchApi<AdminAssetDto>(`${API_BASE}/assets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // ========== Service Management API ==========

  getServices: () => fetchApi<AdminServiceDto[]>(`${API_BASE}/services`),

  createService: (data: CreateServiceRequest) =>
    fetchApi<AdminServiceDto>(`${API_BASE}/services`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateService: (id: string, data: UpdateServiceRequest) =>
    fetchApi<AdminServiceDto>(`${API_BASE}/services/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  toggleServiceActive: (id: string) =>
    fetchApi<AdminServiceDto>(`${API_BASE}/services/${id}/toggle`, { method: 'POST' }),

  // ========== Medication Management API ==========

  getMedications: (q?: string) => {
    const params = q ? `?q=${encodeURIComponent(q)}` : '';
    return fetchApi<AdminMedicationDto[]>(`${API_BASE}/medications${params}`);
  },

  createMedication: (data: CreateMedicationRequest) =>
    fetchApi<AdminMedicationDto>(`${API_BASE}/medications`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateMedication: (id: string, data: UpdateMedicationRequest) =>
    fetchApi<AdminMedicationDto>(`${API_BASE}/medications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  toggleMedicationActive: (id: string) =>
    fetchApi<AdminMedicationDto>(`${API_BASE}/medications/${id}/toggle`, { method: 'POST' }),

  restockMedication: (id: string, qty: number) =>
    fetchApi<AdminMedicationDto>(`${API_BASE}/medications/${id}/restock`, {
      method: 'POST',
      body: JSON.stringify({ qty }),
    }),

  // ========== Prescription Template API ==========

  getPrescriptionTemplates: () =>
    fetchApi<AdminPrescriptionTemplateDto[]>(`${API_BASE}/prescription-templates`),

  getPrescriptionTemplate: (id: string) =>
    fetchApi<AdminPrescriptionTemplateDto>(`${API_BASE}/prescription-templates/${id}`),

  createPrescriptionTemplate: (data: SavePrescriptionTemplateRequest) =>
    fetchApi<AdminPrescriptionTemplateDto>(`${API_BASE}/prescription-templates`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updatePrescriptionTemplate: (id: string, data: SavePrescriptionTemplateRequest) =>
    fetchApi<AdminPrescriptionTemplateDto>(`${API_BASE}/prescription-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  togglePrescriptionTemplate: (id: string) =>
    fetchApi<AdminPrescriptionTemplateDto>(`${API_BASE}/prescription-templates/${id}/toggle`, {
      method: 'POST',
    }),

  deletePrescriptionTemplate: (id: string) =>
    fetchApi<void>(`${API_BASE}/prescription-templates/${id}`, { method: 'DELETE' }),

  // ── Departments ──
  getDepartments: () => fetchApi<DepartmentDto[]>(`${API_BASE}/departments`),

  createDepartment: (name: string) =>
    fetchApi<DepartmentDto>(`${API_BASE}/departments`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  renameDepartment: (id: string, name: string) =>
    fetchApi<DepartmentDto>(`${API_BASE}/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    }),

  deleteDepartment: (id: string) =>
    fetchApi<void>(`${API_BASE}/departments/${id}`, { method: 'DELETE' }),

  // ========== Patient Records API (PR7) ==========

  getPatientRecords: (patientId: string) =>
    fetchApi<PatientRecordDto>(`${API_BASE}/patients/${patientId}/records`),

  // ========== Reports API (PR7) ==========

  getReportSummary: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString();
    return fetchApi<ReportSummaryDto>(`${API_BASE}/reports/summary${qs ? '?' + qs : ''}`);
  },

  getFinanceLedger: (from?: string, to?: string, category?: string, type?: string) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (category) params.set('category', category);
    if (type) params.set('type', type);
    const qs = params.toString();
    return fetchApi<FinanceLedgerEntryDto[]>(`${API_BASE}/reports/finance${qs ? '?' + qs : ''}`);
  },

  getFinanceSummary: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString();
    return fetchApi<FinanceSummaryDto>(`${API_BASE}/reports/finance/summary${qs ? '?' + qs : ''}`);
  },

  createManualFinanceEntry: (data: ManualFinanceEntryRequest) =>
    fetchApi<FinanceLedgerEntryDto>(`${API_BASE}/reports/finance/manual`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getDailyInvoices: (date?: string) => {
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    const qs = params.toString();
    return fetchApi<DailyInvoiceDto[]>(`${API_BASE}/reports/daily-invoices${qs ? '?' + qs : ''}`);
  },

  getVisitsByDoctor: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString();
    return fetchApi<DoctorVisitStatsDto[]>(
      `${API_BASE}/reports/visits-by-doctor${qs ? '?' + qs : ''}`,
    );
  },

  getAuditLogs: (from?: string, to?: string, entityType?: string, action?: string) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (entityType) params.set('entityType', entityType);
    if (action) params.set('action', action);
    const qs = params.toString();
    return fetchApi<AuditLogDto[]>(`${API_BASE}/reports/audit${qs ? '?' + qs : ''}`);
  },
};
