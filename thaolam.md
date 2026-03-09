PR1: AdminLayout + Dashboard — HOÀN THÀNH
Đã tạo mới (17 files)
Frontend — Types & API:

types.ts — Interfaces: DashboardStats, ShiftOverview, UserAccount, PatientAccount, v.v.
api.ts — getDashboardStats(), getTodayShifts() với JWT auth headers
Frontend — Layout (3 components):

AdminLayout.tsx — Sidebar + Header + Outlet
AdminSidebar.tsx — 11 nav items, logout, user info
AdminHeader.tsx — Page title + icon + ngày
Frontend — Pages (11 pages):

AdminDashboardPage.tsx — 6 stat cards, kênh Web/Walk-in, quick actions, ca trực hôm nay, auto-refresh 30s
10 placeholder pages: Reception, Cashier, DoctorManagement, PatientManagement, PatientRecords, ShiftManagement, ServiceManagement, MedicationManagement, PrescriptionTemplate, Reports
Frontend — Barrel exports:

components/index.ts, pages/index.ts
Backend (4 files):

AdminController.java — GET /api/v1/admin/dashboard/stats, GET /api/v1/admin/dashboard/shifts
AdminService.java — Native SQL queries cho stats + shifts
DashboardStatsResponse.java, ShiftOverviewDto.java
Đã sửa (2 files)
router.tsx — Thêm /admin/\* route block với RequireAuth allowedRoles={['ADMIN','OWNER']}, 11 child routes
home.page.tsx — Bật card Admin từ "Coming Soon" → link /admin
Frameworks & Tools sử dụng
React 18 + TypeScript + TailwindCSS (styling)
React Router v6 (routing, Outlet, NavLink)
TanStack Query (useQuery, auto-refresh 30s)
Axios (API calls với JWT Bearer token)
Material Symbols (icons)
Spring Boot 3.2 + JPA EntityManager (backend)
@PreAuthorize (role-based: ADMIN, OWNER)
Verification
npm run lint — 0 errors
npm run typecheck — 3/3 workspaces pass

---

Hotfix: Login redirect cho OWNER/ADMIN
Đã sửa (1 file)
login.page.tsx:

- getRedirectPath('OWNER') và getRedirectPath('ADMIN') → đổi từ /doctor/dashboard sang /admin
- Thêm dòng hint tài khoản Admin: 0903456789 / password123

Tài khoản để test trang Admin:
| Vai trò | SĐT | Mật khẩu |
|---------|------------|-------------|
| OWNER | 0900000000 | owner123 |
| ADMIN | 0903456789 | password123 |

---

PR2: Reception (Lễ tân) — HOÀN THÀNH

Đã tạo mới (5 backend files):

- ReceptionController.java — REST API `/api/v1/admin/reception` (5 endpoints: GET /bookings, GET /search, POST /check-in, POST /walk-in, POST /no-show/{id})
- ReceptionService.java — Business logic: getTodayBookings, searchByPhone, checkIn (BOOKED→CHECKED_IN, priority 50), walkIn (Logic A: COMMON→RESERVE→OVERRIDE slot allocation, auto-create patient+user §2.7), markNoShow (release slot)
- ReceptionBookingDto.java — DTO 15 fields (id, queueNumber, patientName, phone, doctorName, shiftId, shiftType, serviceName, status, channel, paymentStatus, checkInAt, createdAt, priorityScore)
- WalkInRequest.java — @NotBlank patientName, patientPhone; @NotNull shiftId; optional serviceId
- CheckInRequest.java — bookingId, phone

Đã sửa (3 frontend files):

- types.ts — Thêm interfaces: ReceptionBooking (14 fields), WalkInRequest (4 fields), WalkInResponse (booking + poolUsed + isOverride + queueNumber)
- api.ts — Thêm 5 API methods: getReceptionBookings, searchBookingsByPhone, checkIn, walkIn, markNoShow
- ReceptionPage.tsx — Thay placeholder bằng trang đầy đủ (~500 dòng): 3 tabs (Board/Check-in/Walk-in), 6 status cards có filter, shift dropdown, bảng bookings với actions (Check-in/No-show), tìm kiếm theo SĐT, form walk-in với shift card selector hiển thị COMMON/RESERVE availability, pool result feedback, auto-refresh 10s/30s

Logic A (Slot 12+4) đã implement:

- allocateSlot(): COMMON (pool='COMMON', status='OPEN') → RESERVE (pool='RESERVE') → OVERRIDE (tạo slot mới sequence=max+1)
- Hiển thị kết quả pool sử dụng (COMMON/RESERVE/OVERRIDE) trên UI

Frameworks & Tools:

- React 18 + TypeScript + TailwindCSS
- TanStack Query (useQuery + useMutation + auto-refresh)
- Spring Boot 3.2 + JPA (EntityManager native queries)
- @PreAuthorize("hasAnyRole('OWNER','ADMIN')")

Verification:

- npm run lint — 0 errors
- npm run typecheck — 3/3 workspaces pass

---

PR3: Cashier (Thu ngân) — HOÀN THÀNH

Đã tạo mới (3 backend files):

- CashierBookingDto.java — DTO chính + nested PrescriptionItemDto (medicationName, unit, qty, dosage, note, unitPriceCents, totalCents). Bill breakdown: servicePriceCents + prescriptionTotalCents = totalBillCents
- CashierService.java — Business logic:
  - getCompletedBookings(date): Native SQL lấy COMPLETED bookings + prescription info
  - getBookingForPayment(bookingId): Chi tiết booking + đơn thuốc với items
  - processPayment(bookingId): Logic C Step 2 — UNPAID→PAID, prescription HELD→PAID, confirmDeduction() per item (stockReal-=qty, stockHold-=qty)
  - removePrescriptionItem(bookingId, itemId): Xóa thuốc khỏi đơn + releaseHold (cho khách không đủ tiền)
  - expireOldPrescriptions(): Hủy đơn thuốc HELD >2h, nhả kho (background job)
- CashierController.java — REST API `/api/v1/admin/cashier` (5 endpoints):
  - GET /bookings — danh sách COMPLETED
  - GET /bookings/{id} — chi tiết booking + đơn thuốc
  - POST /pay/{id} — thanh toán
  - DELETE /bookings/{id}/items/{itemId} — xóa thuốc
  - POST /expire-old — hủy đơn quá hạn

Đã sửa (3 frontend files):

- types.ts — Thêm 2 interfaces: CashierPrescriptionItem (8 fields), CashierBooking (16 fields incl. prescriptionItems[], totalBillCents)
- api.ts — Thêm 5 API methods: getCashierBookings, getCashierBookingDetail, processPayment, removePrescriptionItem, expireOldPrescriptions
- CashierPage.tsx — Thay placeholder bằng trang đầy đủ (~300 dòng):
  - Layout 2 cột: trái=danh sách bookings, phải=chi tiết hóa đơn
  - 3 summary cards: Chờ TT / Đã TT / Doanh thu
  - Filter tabs: UNPAID / PAID / ALL
  - Chi tiết hóa đơn: Phí khám + Đơn thuốc (bảng) + Tổng cộng
  - Xóa thuốc khỏi đơn (nếu khách không đủ tiền)
  - Nút THANH TOÁN (PAID) — Logic C Step 2
  - Nút hủy đơn quá hạn >2h
  - Auto-refresh 15s

Logic C (Kho Thuốc 2 Bước) đã implement:

- Step 1 (đã có từ Doctor module): Bác sĩ kê đơn → holdStock() → prescription.status=HELD
- Step 2 (PR3 mới): Thu ngân thanh toán → confirmDeduction() → prescription.status=PAID, booking.paymentStatus=PAID
- Auto-expire: >2h chưa TT → prescription.status=EXPIRED, releaseHold()

Frameworks & Tools:

- React 18 + TypeScript + TailwindCSS
- TanStack Query (useQuery + useMutation + auto-refresh 15s)
- Spring Boot 3.2 + JPA (EntityManager + Repository pattern)
- @PreAuthorize("hasAnyRole('OWNER','ADMIN')")

Verification:

- npm run lint — 0 errors
- npm run typecheck — 3/3 workspaces pass

---

PR5: Quản lý Ca trực + Dịch vụ khám — HOÀN THÀNH

Đã tạo mới (12 backend files):

- ServiceRepository.java — JpaRepository<Service, UUID> với findAllByOrderByNameAsc(), existsByName()
- ShiftRepository.java — thêm findByDateWithDoctor(date), existsByDoctorIdAndDateAndType()
- CreateShiftRequest.java — doctorId, date (YYYY-MM-DD), type (MORNING|AFTERNOON)
- AdminShiftDto.java — id, doctorId, doctorName, doctorSpecialty, date, type, status, startTime, endTime, totalSlots, openSlots, bookedSlots, createdAt
- AdminSlotDto.java — id, sequence, pool (COMMON|RESERVE|OVERRIDE), status (OPEN|LOCKED)
- AdminServiceDto.java — id, name, durationMin, priceCents, isActive
- CreateServiceRequest.java — @NotBlank name, @Min(1) durationMin, @Min(0) priceCents
- UpdateServiceRequest.java — optional name, durationMin, priceCents
- ShiftManagementService.java — getShiftsForDate (native SQL subquery), createShift (Logic A: 12 COMMON + 4 RESERVE via gen_random_uuid()), setShiftStatus (open/close), deleteShift (guard bookings), getSlots, toggleSlot
- ServiceManagementService.java — getAllServices, createService, updateService, toggleActive
- ShiftManagementController.java — /api/v1/admin/shifts (GET?date, POST, POST/{id}/lock, POST/{id}/open, DELETE/{id}, GET/{id}/slots, POST/slots/{slotId}/toggle)
- ServiceManagementController.java — /api/v1/admin/services (GET, POST, PATCH/{id}, POST/{id}/toggle)

Đã sửa (4 frontend files):

- types.ts — +6 interfaces: AdminShiftDto, AdminSlotDto, CreateShiftRequest, AdminServiceDto, CreateServiceRequest, UpdateServiceRequest
- api.ts — +10 methods: getShifts, createShift, lockShift, openShift, deleteShift, getShiftSlots, toggleSlot, getServices, createService, updateService, toggleServiceActive
- ShiftManagementPage.tsx — Date picker + prev/next, grid ca theo ngày, ShiftCard (slot stats, collapsible SlotGrid 8×2, lock/open/delete), CreateShiftModal (chọn bác sĩ + ngày + buổi), slot circles click-to-toggle
- ServiceManagementPage.tsx — Table dịch vụ (tên/thời gian/giá/trạng thái), toggle hoạt động, ServiceModal create/edit

Frameworks & Tools:

- Logic A slot generation: 12 COMMON (seq 1-12) + 4 RESERVE (seq 13-16) per shift
- EntityManager native SQL: gen_random_uuid(), CAST AS slot_pool, CAST AS slot_status
- exactOptionalPropertyTypes: interface props dùng `?: T | undefined`

Verification:

- npm run lint — 0 errors
- npm run typecheck — 3/3 workspaces pass

Đã tạo mới (6 backend files):

- CreateDoctorRequest.java — @NotBlank phone (regex 0xxxxxxxxx), @Size(min=6) password, @NotBlank displayName, optional specialty
- UpdateDoctorRequest.java — optional displayName, specialty, newPassword
- AdminDoctorDto.java — id, userId, phone, displayName, specialty, status (ACTIVE/LOCKED), createdAt
- AdminPatientDto.java — id, fullName, phone, nationalId, dateOfBirth, gender, address, allergies, hasAccount, createdAt
- UserManagementService.java — getAllDoctors(), createDoctor() (tạo User DOCTOR + Doctor profile), updateDoctor(), lockDoctor(), unlockDoctor(), searchPatients() (PatientRepository.search()), resetPatientPassword() (BCrypt)
- UserManagementController.java — /api/v1/admin/doctors (GET, POST, PATCH /{id}, POST /{id}/lock, POST /{id}/unlock) + /api/v1/admin/patients (GET ?q=, POST /{id}/reset-password)

Đã sửa (4 frontend files):

- types.ts — +4 interfaces: AdminDoctorDto, CreateDoctorRequest, UpdateDoctorRequest, AdminPatientDto
- api.ts — +7 API methods: getDoctors, createDoctor, updateDoctor, lockDoctor, unlockDoctor, getPatients, resetPatientPassword
- DoctorManagementPage.tsx — Bảng danh sách, modal Thêm mới, modal Sửa (tên/chuyên khoa/mật khẩu), nút Khóa/Mở khóa
- PatientManagementPage.tsx — Tìm kiếm realtime, bảng danh sách, panel chi tiết, modal Reset mật khẩu

Frameworks & Tools:

- React 18 + TypeScript + TailwindCSS
- TanStack Query (useQuery + useMutation)
- Spring Boot 3.2 + JPA + BCryptPasswordEncoder
- exactOptionalPropertyTypes: dùng conditional spread {...(x ? {key: x} : {})}

Verification:

- npm run lint — 0 errors
- npm run typecheck — 3/3 workspaces pass

---

PR6: Danh mục Thuốc + Toa thuốc mẫu — HOÀN THÀNH

Đã tạo mới (15 backend files):

- V8\_\_prescription_templates.sql — Flyway migration tạo bảng `prescription_templates` (id, name UNIQUE, note, is_active, created_at) và `prescription_template_items` (id, template_id FK cascade, medication_id FK restrict, qty, dosage, note, UNIQUE template+medication)
- PrescriptionTemplate.java — Entity: id (UUID), name, note, isActive=true, createdAt, items (OneToMany cascade ALL orphanRemoval)
- PrescriptionTemplateItem.java — Entity: id, template (ManyToOne LAZY), medication (ManyToOne LAZY), qty, dosage, note
- PrescriptionTemplateRepository.java — findAllByOrderByNameAsc(), findByIdWithItems(id) JOIN FETCH, existsByName()
- AdminMedicationDto.java — id, name, unit, usage, defaultDose, priceCents, stockReal, stockHold, availableStock, isActive
- CreateMedicationRequest.java — @NotBlank name+unit, optional usage/defaultDose, @Min(0) priceCents, initialStock
- UpdateMedicationRequest.java — tất cả optional: name, unit, usage, defaultDose, priceCents
- RestockRequest.java — @Min(1) qty
- MedicationManagementService.java — getAllMedications(q), createMedication, updateMedication (partial), toggleActive, restock (stockReal += qty)
- MedicationManagementController.java — /api/v1/admin/medications (GET?q, POST, PATCH/{id}, POST/{id}/toggle, POST/{id}/restock)
- AdminPrescriptionTemplateDto.java — id, name, note, isActive, createdAt, items list; inner TemplateItemDto
- SavePrescriptionTemplateRequest.java — @NotBlank name, note, @NotEmpty List<TemplateItemRequest>
- PrescriptionTemplateService.java — getAllTemplates() summary, getTemplate(id) with items, createTemplate, updateTemplate (clear+re-apply), toggleActive, deleteTemplate
- PrescriptionTemplateController.java — /api/v1/admin/prescription-templates (GET, GET/{id}, POST, PUT/{id}, POST/{id}/toggle, DELETE/{id})

Đã sửa (2 frontend files, +2 pages mới):

- types.ts — +7 interfaces: AdminMedicationDto, CreateMedicationRequest, UpdateMedicationRequest, PrescriptionTemplateItemDto, AdminPrescriptionTemplateDto, SavePrescriptionTemplateItemRequest, SavePrescriptionTemplateRequest
- api.ts — +11 methods: getMedications, createMedication, updateMedication, toggleMedicationActive, restockMedication, getPrescriptionTemplates, getPrescriptionTemplate, createPrescriptionTemplate, updatePrescriptionTemplate, togglePrescriptionTemplate, deletePrescriptionTemplate
- MedicationManagementPage.tsx — Search bar + filter tabs (Tất cả/Sắp hết/Tắt), bảng thuốc với StockBar (green=available, orange=held), toggle active, MedicationModal (create/edit), RestockModal (nhập kho)
- PrescriptionTemplatePage.tsx — Grid cards (expandable items table), TemplateModal (medication picker + qty + liều dùng), toggle active, ConfirmDelete dialog

Frameworks & Tools:

- Logic C Stock: stockReal = tổng kho thực; stockHold = đang tạm giữ; availableStock = stockReal - stockHold
- V8 migration: prescription_templates + prescription_template_items (UNIQUE template+medication)
- exactOptionalPropertyTypes: conditional spread trong SavePrescriptionTemplateRequest payload

Verification:

- npm run lint — 0 errors
- npm run typecheck — 3/3 workspaces pass

---

PR7: Hồ sơ Bệnh nhân + Báo cáo & Audit — HOÀN THÀNH

Đã tạo mới (9 backend files):

- PatientRecordDto.java — DTO chính + nested VisitRecordDto (recordId, bookingId, doctorName, serviceName, symptoms, diagnosis, conclusion, notes, bookingStatus, paymentStatus, visitDate, prescriptionItems, prescriptionStatus) + PrescriptionItemDto (medicationName, unit, qty, dosage, note)
- ReportSummaryDto.java — DTO: totalBookings, completedBookings, canceledBookings, noShowBookings, webBookings, walkInBookings, paidBookings, unpaidBookings, totalRevenueCents, serviceRevenueCents, prescriptionRevenueCents, overrideCount
- AuditLogDto.java — DTO: id, actorUserId, actorName, action, entityType, entityId, metaJson, createdAt
- AuditLog.java — Entity cho bảng `audit_logs` (đã có từ V1): id (UUID), actorUser (ManyToOne User), action, entityType, entityId, metaJson (JSONB), createdAt
- AuditLogRepository.java — findByDateRange(from, to), findByDateRangeAndEntityType(from, to, entityType)
- PatientRecordService.java — getPatientRecords(patientId): lấy thông tin BN + native SQL lấy medical_records JOIN bookings/shifts/doctors/users/services + prescription items
- ReportService.java — getSummary(from, to): native SQL aggregate booking stats (FILTER WHERE), revenue (service + prescription), override count (slots pool='OVERRIDE'); getAuditLogs(from, to, entityType)
- PatientRecordController.java — GET /api/v1/admin/patients/{patientId}/records @PreAuthorize OWNER/ADMIN
- ReportController.java — GET /api/v1/admin/reports/summary?from&to, GET /api/v1/admin/reports/audit?from&to&entityType @PreAuthorize OWNER/ADMIN

Đã sửa (4 frontend files):

- types.ts — +5 interfaces: PatientRecordPrescriptionItem, VisitRecordDto, PatientRecordDto, ReportSummaryDto, AuditLogDto
- api.ts — +3 methods: getPatientRecords(patientId), getReportSummary(from, to), getAuditLogs(from, to, entityType)
- PatientRecordsPage.tsx — Thay placeholder bằng trang đầy đủ: layout 2 cột (trái=search BN theo SĐT/Tên/CCCD, phải=hồ sơ), patient info card (CCCD, ngày sinh, giới tính, dị ứng, địa chỉ), records timeline expandable (triệu chứng, chẩn đoán, kết luận, ghi chú, toa thuốc), status badges, payment badges
- ReportsPage.tsx — Thay placeholder bằng trang đầy đủ: 2 tabs (Thống kê/Audit Log), Tab 1: date range picker, 4 stat cards (tổng/hoàn thành/hủy/không đến), channel breakdown bars (Web vs Walk-in), payment breakdown, doanh thu (tổng/dịch vụ/thuốc), Override Log count; Tab 2: date range + entity type filter, bảng audit log (thời gian, người thực hiện, hành động, loại, ID, chi tiết)

PRD mapping:

- §2.7 Hồ sơ BN: Search SĐT/Tên/CCCD ✅, lịch sử y tế ✅, toa thuốc cũ ✅
- §2.12 Báo cáo: Lượt khám/Doanh thu/Web vs Walk-in ✅, Override log ✅, Audit log ✅

Frameworks & Tools:

- React 18 + TypeScript + TailwindCSS
- TanStack Query (useQuery, staleTime 30s/60s)
- Spring Boot 3.2 + JPA (EntityManager native SQL, PostgreSQL FILTER WHERE)
- @PreAuthorize("hasAnyRole('OWNER','ADMIN')")

Rủi ro:

- Bảng audit_logs có schema từ V1 nhưng chưa có service ghi log vào. Cần bổ sung audit logging ở các module khác (cashier, medication, shift) để có data hiển thị trên tab Audit. Không ảnh hưởng tới trang hiện tại.

Verification:

- npm run lint — 0 errors
- npm run typecheck — 3/3 workspaces pass
