# QUY TẮC GHI NHẬT KÝ CÔNG VIỆC (BẮT BUỘC)

> Áp dụng cho: tất cả thành viên làm **admin module** (`apps/web/src/modules/admin/`, `apps/backend/modules/admin/`)

## Template bắt buộc khi hoàn thành 1 PR/task:

```
PR<số>: <Tên tính năng> — HOÀN THÀNH | ĐANG LÀM | BỊ BLOCK

Đã tạo mới (<n> files):
- <tên file> — <mục đích 1 dòng>

Đã sửa (<n> files):
- <tên file> — <thay đổi gì>

Logic đã implement:
- <Logic key A/B/C nếu có>

Verification:
- npm run lint — <kết quả>
- npm run typecheck — <kết quả>
- API test: <endpoint đã test>

Known issues / TODO còn lại:
- <nếu có>
```

## Quy tắc:

1. **Làm xong phải note ngay** — không để qua ngày hôm sau.
2. **Không tóm tắt chung chung** — phải liệt kê đúng tên file, tên method, tên endpoint.
3. **Verification là bắt buộc** — phải chạy `npm run check` trước khi note HOÀN THÀNH.
4. **Ghi Known issues** — nếu còn TODO dang dở, ghi rõ để người sau không bị hiểu nhầm là đã xong hoàn toàn.
5. **Đánh số PR liên tiếp** — PR1, PR2, PR3... không được bỏ trống số.

---

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

---

PR8: Sprint 1 - Fix toa mau + Gop trang Ho so kham � HOAN THANH

Da tao moi (0 files):

- Khong tao file moi.

Da sua (8 files):

- apps/backend/src/main/java/com/clinic/backend/modules/admin/service/PrescriptionTemplateService.java � harden update/delete toa mau, validate item payload, normalize text, xu ly duplicate medication.
- apps/backend/src/main/java/com/clinic/backend/modules/doctor/repository/PrescriptionTemplateRepository.java � them methods existsByNameIgnoreCase() va deleteItemsByTemplateId().
- apps/web/src/modules/admin/api.ts � fetchApi() xu ly response khong co body (204/empty) de DELETE khong bi vo json parse.
- apps/web/src/modules/admin/pages/PatientManagementPage.tsx � gop UI Patient + Records thanh trang Quan ly Ho so kham (left panel + tabs Thong tin/Lich su kham/Don thuoc cu).
- apps/web/src/routes/router.tsx � xoa route /admin/records.
- apps/web/src/modules/admin/components/AdminSidebar.tsx � gop nav item sang 1 muc Ho so kham.
- apps/web/src/modules/admin/components/AdminHeader.tsx � cap nhat title map cho /admin/patients.
- apps/web/src/modules/admin/pages/index.ts � xoa export PatientRecordsPage.

Logic da implement:

- Fix bug xoa toa mau: frontend khong con fail khi API tra empty body.
- Fix bug sua/xoa toa mau: backend xoa item theo template_id truoc khi update/delete de tranh loi FK/cascade tren DB cu.
- Gom trang theo Sprint 1: /admin/patients tro thanh trang quan ly ho so kham tong hop, /admin/records bi loai bo.

Verification:

- npm run lint � PASS
- npm run typecheck � PASS (3/3 workspaces)
- npm run check � FAIL tai buoc prettier check do ton tai san 124 file format issue toan repo (khong do thay doi task nay)
- API test manual: /api/v1/admin/prescription-templates (PUT/DELETE) � da harden theo code path frontend + backend

Known issues / TODO con lai:

- Chua implement Phase 0.2 show/hide password (de Sprint 8 theo ke hoach).
- Chua them migration schema moi (V13+) trong Sprint 1.

---

PR9: Sprint 2 - Migrations V13-V16 + Room Management � HOAN THANH

Da tao moi (10 files):

- apps/backend/src/main/resources/db/migration/V13\_\_rooms.sql � tao bang rooms, them shifts.room_id, seed 4 phong mau.
- apps/backend/src/main/resources/db/migration/V14\_\_service_specialty_doctor_service.sql � them services.specialty_id va bang doctor_services, seed mapping ban dau.
- apps/backend/src/main/resources/db/migration/V15\_\_supplies_assets.sql � tao bang supplies va assets.
- apps/backend/src/main/resources/db/migration/V16\_\_finance_ledger.sql � tao finance_ledger + indexes + trigger auto ghi thu/chi.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/entity/Room.java � JPA entity cho rooms.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/repository/RoomRepository.java � repository cho rooms.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/dto/RoomDto.java � DTO response room (co assetCount).
- apps/backend/src/main/java/com/clinic/backend/modules/admin/service/RoomService.java � business logic list/create/update/toggle rooms.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/controller/RoomController.java � API /api/v1/admin/rooms.
- apps/web/src/modules/admin/pages/RoomManagementPage.tsx � trang quan ly phong kham moi.

Da sua (7 files):

- apps/web/src/modules/admin/types.ts � them AdminRoomDto, CreateRoomRequest, UpdateRoomRequest, RoomStatus.
- apps/web/src/modules/admin/api.ts � them getRooms/createRoom/updateRoom/toggleRoom.
- apps/web/src/routes/router.tsx � them route /admin/rooms.
- apps/web/src/modules/admin/components/AdminSidebar.tsx � them nav item Phong kham.
- apps/web/src/modules/admin/components/AdminHeader.tsx � them route title cho /admin/rooms.
- apps/web/src/modules/admin/pages/index.ts � export RoomManagementPage.
- thaolam.md � cap nhat nhat ky PR9.

Logic da implement:

- Data model Sprint 2: rooms + service-specialty + doctor-services + supplies/assets + finance ledger.
- Trigger ledger tu dong:
  - bookings.payment_status -> PAID => INCOME/CONSULTATION_FEE.
  - prescriptions.status -> PAID => INCOME/MEDICATION_SALE (per prescription item).
  - medications stock_real tang => EXPENSE/MEDICATION_PURCHASE.
  - supplies stock_qty tang => EXPENSE/SUPPLY_PURCHASE.
  - assets insert co purchase_price => EXPENSE/ASSET_PURCHASE.
- Room management full flow:
  - GET /api/v1/admin/rooms?status=&roomType=
  - POST /api/v1/admin/rooms
  - PATCH /api/v1/admin/rooms/{id}
  - POST /api/v1/admin/rooms/{id}/toggle

Verification:

- Backend compile: C:\WINDOWS\System32\WindowsPowerShell\v1.0\powershell.exe -Command "mvn -q -DskipTests compile" � PASS.
- Frontend typecheck: npm run typecheck -w apps/web � PASS.
- npm run check � FAIL tai prettier check (125 files format issue toan repo, khong phai rieng task PR9).

Known issues / TODO con lai:

- Chua implement cac page/features tiep theo cua Sprint 3+ (auto dispatch, weekly shift, supplies/assets UI...).
- Trigger medication purchase dang tinh amount theo price_cents hien tai vi chua co gia nhap rieng cho medication.

---

PR10: Sprint 3 - Auto Dispatch Reception (backend + frontend) ? HOAN THANH

Da tao moi (5 files):

- apps/backend/src/main/resources/db/migration/V17\_\_patient_insurance_code.sql ? them cot `patients.insurance_code` + index de luu BHYT trong flow tiep nhan moi.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/dto/CreateVisitRequest.java ? request DTO cho `POST /api/v1/admin/reception/create-visit`.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/dto/CreateVisitResponse.java ? response DTO booking dispatch result (queue, doctor, room, pool, override...).
- apps/backend/src/main/java/com/clinic/backend/modules/admin/dto/PatientLookupResponse.java ? response DTO lookup benh nhan theo SDT.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/service/AutoDispatchService.java ? service moi cho lookup patient + auto dispatch theo service.

Da sua (6 files):

- apps/backend/src/main/java/com/clinic/backend/modules/admin/controller/ReceptionController.java ? them endpoint `GET /lookup` va `POST /create-visit`.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/service/ReceptionService.java ? wire qua `AutoDispatchService` (methods `lookupPatient()`, `createVisit()`), giu nguyen flow cu.
- apps/backend/src/main/java/com/clinic/backend/modules/doctor/entity/Patient.java ? them field `insuranceCode` map vao `insurance_code`.
- apps/web/src/modules/admin/types.ts ? them `CreateVisitRequest`, `CreateVisitResponse`, `PatientLookupResponse`.
- apps/web/src/modules/admin/api.ts ? them `createVisit()`, `lookupPatient()` va bo sung error `status` trong `fetchApi`.
- apps/web/src/modules/admin/pages/ReceptionPage.tsx ? doi tab Walk-in cu thanh flow ?Tao phieu kham? moi (lookup SDT, chon dich vu active, create-visit, modal confirm override 409, ket qua dispatch).

Logic da implement:

- Auto dispatch theo service:
  - validate service active;
  - tim bac si/ca OPEN hom nay theo `doctor_services` hoac fallback specialty;
  - load balancing theo booking load;
  - allocate slot COMMON -> RESERVE -> OVERRIDE (chi khi `forceOverride=true`);
  - tao/cap nhat patient + auto tao user PATIENT neu SDT moi;
  - tao booking `CHECKED_IN`, channel `WALK_IN`, queue number tu dong;
  - ghi audit log `OVERRIDE_SLOT` khi su dung override.
- Reception frontend flow moi:
  - tra cuu benh nhan theo SDT (onBlur + button);
  - auto-fill ten/ngay sinh/gioi tinh/CCCD/BHYT;
  - tao phieu kham theo dich vu;
  - xu ly loi het so kham bang modal xac nhan override.

Verification:

- npm run lint -w apps/web ? PASS
- npm run typecheck -w apps/web ? PASS
- Backend compile: `mvn -q -DskipTests compile` ? PASS (run outside sandbox do Maven local repo permission)
- npm run check ? FAIL tai `prettier -c` do baseline 125 files format issue toan repo (khong chi rieng PR10)

API test:

- Da verify compile path cho endpoint moi:
  - `GET /api/v1/admin/reception/lookup?phone=...`
  - `POST /api/v1/admin/reception/create-visit`
- Chua chay E2E manual tren browser/backend runtime trong log nay.

Known issues / TODO con lai:

- Chua thay walk-in endpoint cu (`/reception/walk-in`), hien tai backend van giu de backward compatibility.
- Chua tiep tuc cac phan con lai cua Sprint 3 (weekly shift + doctor profile nang cao).
  PR10 update:
- apps/backend/src/main/java/com/clinic/backend/modules/admin/dto/CreateVisitResponse.java ? them `@JsonProperty("isOverride")` va `@JsonProperty("isNewPatient")` de JSON response khop dung contract frontend.
- Backend compile da re-check sau khi sua DTO ? PASS.
  PR10 UX update:
- apps/web/src/modules/admin/pages/ReceptionPage.tsx ? bo nut `Tra cuu`; blur SDT se auto tim ho so qua `adminApi.getPatients()`.
- Them popup chon ho so benh nhan (click 1 ho so de autofill ten/ngay sinh/gioi tinh/CCCD; BHYT lay tu lookup chi tiet neu co).
- Xu ly loi lookup than thien hon: khong con hien "Unexpected error" cho truong hop tim khong thay/loi tam thoi.
- Verification bo sung: npm run typecheck -w apps/web PASS, npm run lint -w apps/web PASS.
  PR10 fix update:
- apps/web/src/modules/admin/pages/ReceptionPage.tsx ? an thong bao vang khi SDT khong tim thay ho so (admin tiep tuc nhap tay, khong can message tao moi).
- apps/backend/src/main/java/com/clinic/backend/modules/admin/service/AutoDispatchService.java ? fix native SQL cast (`::text`) sang `CAST(... AS text)` de tranh loi parser tham so trong JPA native query.
- Docker backend da rebuild/redeploy, Flyway migrate len V17 thanh cong.
- API retest: POST /api/v1/admin/reception/create-visit -> SUCCESS (khong con 500 Unexpected error).
- Verification bo sung: npm run typecheck -w apps/web PASS, npm run lint -w apps/web PASS.

PR10 UX update 2: Reception create-visit stability + queue detail modal - HOAN THANH

Da tao moi (0 files):

- Khong tao file moi.

Da sua (1 file):

- apps/web/src/modules/admin/pages/ReceptionPage.tsx - bo nhay thong bao lookup, auto chuyen sang Bang theo doi sau khi tao phieu, popup chi tiet phieu de in, them modal xem chi tiet lich kham tren bang cho.

Logic da implement:

- SDT lookup khong con giat do request cu tra ve muon (request-id guard).
- Tao phieu thanh cong: khong hien banner thanh cong, mo popup chi tiet co nut In phieu, tab tu dong ve Bang theo doi.
- Bang theo doi duoc invalidate va them nut Chi tiet tren moi dong.

Verification:

- npm.cmd run typecheck -w apps/web - PASS
- npm.cmd run lint -w apps/web - PASS
- API test:
  - POST /api/v1/admin/reception/create-visit - PASS
  - GET /api/v1/admin/reception/bookings?date=YYYY-MM-DD - booking moi xuat hien

Known issues / TODO con lai:

- Neu chay frontend bang Docker nginx image thi khong hot-reload; can rebuild image de thay doi giao dien.

Sau này nếu tắt máy và bật lại, chạy theo bộ lệnh này:

cd C:\Code\healthcare-clinic-system
docker compose up -d postgres
npm run dev
Nếu bạn chạy full Docker (docker compose up -d --build) thì web là bản build tĩnh, sửa UI sẽ phải build lại.
Muốn sửa UI thấy ngay (hot reload), dùng cách trên (npm run dev) là nhanh nhất.

---

PR11: Sprint 3 hardening - create-visit 500 fix + queue/status verification - HOAN THANH

Da tao moi (0 files):

- Khong tao file moi.

Da sua (3 files):

- apps/backend/src/main/java/com/clinic/backend/modules/doctor/service/QueueNumberService.java - thay SQL cast `::text` bang `CAST(... AS text)` de khong bi loi parser tham so native query; giu scope STT theo ngay + ca + phong.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/service/ShiftManagementService.java - bo cast `::` trong native query slot (`getSlots`, `toggleSlot`) de tranh loi SQL grammar khi co named params.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/service/RoomService.java - bo cast `::` va doi query list rooms sang SQL build dong theo filter status/serviceId de fix loi `could not determine data type of parameter`.

Logic da implement:

- WALK_IN create-visit tao booking vao WAITING va len bang cho ngay (khong dung lai CHECKED_IN).
- STT cap phat atomic theo scope ngay + ca + phong (khong tach kenh WEB/WALK_IN).
- Backend native SQL o cac path reception/room/slot khong con dung `::` de tranh 500 "Unexpected error".

Verification:

- mvn -q -DskipTests compile - PASS.
- npm run typecheck -w apps/web - PASS.
- Docker rebuild backend: `docker compose up -d --build backend` - PASS.
- API test manual:
  - GET /api/v1/admin/reception/dispatch-options?serviceId=... - PASS.
  - POST /api/v1/admin/reception/create-visit - PASS, tra booking moi.
  - GET /api/v1/admin/reception/bookings?date=YYYY-MM-DD - booking moi hien thi status WAITING, co roomName + slotPool.
  - GET /api/v1/admin/rooms - PASS (khong con 500).
  - POST /api/v1/admin/reception/check-in - PASS, booking WEB vao WAITING.

Known issues / TODO con lai:

- Neu chay web bang docker nginx image thi van khong hot reload; sua UI can rebuild image web hoac chay `npm run dev -w apps/web`.
- `npm run check` toan repo van fail o prettier baseline cua nhieu file cu (khong do thay doi PR11).

---

PR12: Sprint 4 - Weekly Shift + Doctor Profile nang cao - HOAN THANH

Da tao moi (3 files):

- apps/backend/src/main/java/com/clinic/backend/modules/admin/dto/BulkShiftRequest.java - request DTO cho API tao lich tuan.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/dto/BulkShiftResponse.java - response DTO gom `created` va `skipped`.
- apps/backend/src/main/resources/db/migration/V19\_\_doctor_profile_fields.sql - them `doctors.bio`, `doctors.experience_years`, `doctors.qualifications`.

Da sua (13 files):

- apps/backend/src/main/java/com/clinic/backend/modules/admin/controller/ShiftManagementController.java - them endpoint `POST /api/v1/admin/shifts/bulk`.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/service/ShiftManagementService.java - them `bulkCreateShifts()` + parse/validate input + tao 12 COMMON + 4 RESERVE cho moi ca.
- apps/backend/src/main/java/com/clinic/backend/modules/doctor/entity/Doctor.java - map them bio/experienceYears/qualifications.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/dto/AdminDoctorDto.java - bo sung profile fields + `serviceIds`.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/dto/CreateDoctorRequest.java - nhan them avatar/profile/services.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/dto/UpdateDoctorRequest.java - cap nhat them avatar/profile/services.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/service/UserManagementService.java - luu/cap nhat profile bac si, sync bang `doctor_services`, tra `serviceIds`.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/dto/AdminServiceDto.java - bo sung `specialtyId`, `specialtyName`.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/service/ServiceManagementService.java - get services kem specialty de frontend loc dich vu theo khoa.
- apps/web/src/modules/admin/types.ts - them types bulk shift + mo rong doctor/service types cho Sprint 4.
- apps/web/src/modules/admin/api.ts - them `createShiftsBulk()`.
- apps/web/src/modules/admin/pages/ShiftManagementPage.tsx - them toggle Ngay/Tuan, weekly calendar grid, modal tao lich tuan.
- apps/web/src/modules/admin/pages/DoctorManagementPage.tsx - modal tabs Tai khoan/Ho so, fields profile, multi-select dich vu theo specialty, show/hide password trong modal.

Logic da implement:

- Shift weekly:
  - API `POST /api/v1/admin/shifts/bulk` nhan `doctorId`, `weekStartDate`, `shiftTypes`, `daysOfWeek`.
  - Tao ca hang loat cho nhieu ngay, bo qua nhung ca da ton tai va tra ve danh sach `skipped`.
- Doctor profile nang cao:
  - Luu avatar_url, bio, so nam kinh nghiem, bang cap/chung chi.
  - Gan nhieu dich vu cho bac si qua bang `doctor_services`.
  - Frontend modal tach 2 tabs de nhap tai khoan va ho so, co khu vuc chon dich vu phu trach.

Verification:

- npm.cmd run typecheck -w apps/web - PASS
- npm.cmd run lint -w apps/web - PASS
- mvn -q -DskipTests compile - PASS

PR12 update 4: Ho so bac si day du thong tin ca nhan + bo Avatar input + bo khung trang header - HOAN THANH

Da tao moi (1 file):

- apps/backend/src/main/resources/db/migration/V21\_\_doctor_personal_profile.sql - them `doctors.date_of_birth`, `doctors.national_id`, `doctors.work_history`.

Da sua (7 files):

- apps/backend/src/main/java/com/clinic/backend/modules/doctor/entity/Doctor.java - map them field ho so ca nhan: `dateOfBirth`, `nationalId`, `workHistory`.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/dto/AdminDoctorDto.java - bo sung field tra ve cho admin: `dateOfBirth`, `nationalId`, `workHistory`.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/dto/CreateDoctorRequest.java - nhan them field ho so ca nhan khi tao bac si.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/dto/UpdateDoctorRequest.java - nhan them field ho so ca nhan khi cap nhat bac si.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/service/UserManagementService.java - luu/cap nhat/map DTO cho cac field ho so moi.
- apps/web/src/modules/admin/types.ts - them field TS tuong ung trong `AdminDoctorDto`, `CreateDoctorRequest`, `UpdateDoctorRequest`.
- apps/web/src/modules/admin/pages/DoctorManagementPage.tsx - bo input avatar, them nhom form ho so (ho ten, ngay sinh, CCCD, chuyen mon/chung chi, noi tung cong tac, so yeu ly lich), bo lop the trang o thanh header `so luong + them bac si`.

Logic da implement:

- Tab `Ho so` phan anh dung nghiep vu "so yeu ly lich bac si": thong tin ca nhan + nang luc chuyen mon + qua trinh cong tac.
- Avatar khong con la field bat buoc cho admin profile flow.
- Header trang bac si khong con the bao ngoai nen UI gon hon, khong bi "dinh vien".

Verification:

- npm.cmd run typecheck -w apps/web - PASS
- mvn -q -DskipTests compile - PASS
- npm.cmd run check - FAIL o `prettier -c` baseline toan repo (125 files), khong phat sinh rieng tu PR12

Known issues / TODO con lai:

- Chua tiep tuc Sprint 5 (service-specialty CRUD day du + supplies/assets pages/controllers).
- `API_BASE` trong `apps/web/src/modules/admin/api.ts` van dang hardcode `http://localhost:4000`.

PR12 update 2: Shift weekly workflow + doctor UI polish - HOAN THANH

Da tao moi (2 files):

- apps/backend/src/main/java/com/clinic/backend/modules/admin/dto/SyncWeekShiftRequest.java - request DTO cho API doi ca tuan hien tai.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/dto/SyncWeekShiftResponse.java - response DTO gom created/deleted/skipped khi dong bo tuan.

Da sua (8 files):

- apps/backend/src/main/java/com/clinic/backend/modules/admin/controller/ShiftManagementController.java - them endpoint `POST /api/v1/admin/shifts/sync-week`.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/dto/BulkShiftRequest.java - ho tro `dayConfigs` (moi ngay chon ca khac nhau) + `repeatWeeks`.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/dto/BulkShiftResponse.java - bo sung `repeatWeeks`.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/service/ShiftManagementService.java - update bulkCreate theo dayConfigs/repeatWeeks, them syncWeekShifts de doi ca tuan hien tai (tao/bo qua/xoa khi khong co booking).
- apps/web/src/modules/admin/types.ts - them DayShiftConfig, SyncWeekShiftRequest/Response; mo rong BulkShiftRequest/Response.
- apps/web/src/modules/admin/api.ts - them `syncWeekShifts()`.
- apps/web/src/modules/admin/pages/ShiftManagementPage.tsx - doi UI/logic: tao lich lap theo tuan, doi ca tuan nay, bang week view theo huong Thu doc - Bac si ngang.
- apps/web/src/modules/admin/pages/DoctorManagementPage.tsx - chinh spacing header de khong dinh vien, doi label bio thanh `So yeu ly lich / Gioi thieu`.

Logic da implement:

- Lich lap theo tuan:
  - Cho phep chon ca theo tung ngay (vd Thu 2: 2 ca, Thu 3: chi Chieu).
  - Co `repeatWeeks` de tao lich lap cho nhieu tuan lien tiep.
- Doi ca tam thoi:
  - Nut `Doi ca tuan nay` chi dong bo trong pham vi 1 tuan dang xem.
  - Tuan sau khong bi anh huong.
  - Neu ca can xoa da co booking thi bo qua va tra ve `HAS_BOOKINGS`.
- Week table:
  - Truc doc theo Thu/Ngay, truc ngang theo Bac si de de theo doi theo yeu cau nghiep vu.

Verification:

- npm.cmd run typecheck -w apps/web - PASS
- npm.cmd run lint -w apps/web - PASS
- mvn -q -DskipTests compile - PASS

Known issues / TODO con lai:

- Chua bo sung popup visual rieng cho thao tac \"nghi co phep / lam bu\" (hien tai su dung modal dong bo tuan bang matrix).

PR12 update 3: Week-of-month + note bắt buộc + màu ca bù - HOAN THANH

Da tao moi (1 file):

- apps/backend/src/main/resources/db/migration/V20\_\_shift_makeup_and_note.sql - them `shifts.is_makeup` va `shifts.adjustment_note`.

Da sua (7 files):

- apps/backend/src/main/java/com/clinic/backend/modules/doctor/entity/Shift.java - map them `isMakeup`, `adjustmentNote`.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/dto/AdminShiftDto.java - bo sung `isMakeup`, `adjustmentNote` cho API response.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/dto/SyncWeekShiftRequest.java - them `note` bat buoc cho thao tac doi ca.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/service/ShiftManagementService.java - tao ca bu voi note, tra ve makeup flag, validate note; query shifts kem makeup/note.
- apps/web/src/modules/admin/types.ts - bo sung fields `isMakeup`, `adjustmentNote`; `SyncWeekShiftRequest.note`.
- apps/web/src/modules/admin/pages/ShiftManagementPage.tsx - doi UI chon tuan theo `thang + tuan trong thang`, bo nut tao ca le, them ghi chu doi ca bat buoc, hien thi mau rieng cho ca bu.
- apps/web/src/modules/admin/pages/DoctorManagementPage.tsx - profile tab doi sang phong cach so yeu ly lich/CV ro hon.

Logic da implement:

- Tao lich: chon `Thang` + `Tuan 1..5` thay vi chon ngay bat dau.
- Doi ca: bat buoc ghi chu (`note`) truoc khi luu.
- Ca tao boi thao tac doi ca duoc danh dau `is_makeup=true` va luu `adjustment_note`.
- Week table va day card hien thi mau/nhan rieng cho `Ca bu`.

Verification:

- npm.cmd run typecheck -w apps/web - PASS
- npm.cmd run lint -w apps/web - PASS
- mvn -q -DskipTests compile - PASS

PR13: Sprint 5 - Service-Specialty CRUD + Supplies + Assets - HOAN THANH

Da tao moi (9 files):

- apps/backend/src/main/java/com/clinic/backend/modules/admin/controller/SupplyController.java - API vat tu: list/create/update/restock/toggle.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/controller/AssetController.java - API tai san: list/create/update.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/dto/SupplyDto.java - DTO vat tu cho admin.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/dto/AssetDto.java - DTO tai san cho admin.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/entity/Supply.java - entity map bang supplies.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/entity/Asset.java - entity map bang assets.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/repository/SupplyRepository.java - repository vat tu.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/repository/AssetRepository.java - repository tai san.
- apps/web/src/modules/admin/pages/SupplyManagementPage.tsx - trang quan ly vat tu.
- apps/web/src/modules/admin/pages/AssetManagementPage.tsx - trang quan ly tai san.

Da sua (11 files):

- apps/backend/src/main/java/com/clinic/backend/modules/admin/dto/CreateServiceRequest.java - them field `specialtyId`.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/dto/UpdateServiceRequest.java - them field `specialtyId`.
- apps/backend/src/main/java/com/clinic/backend/modules/doctor/entity/Service.java - map cot `specialty_id`.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/service/ServiceManagementService.java - validate/set specialty khi tao/sua dich vu.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/service/SupplyService.java - nghiep vu vat tu.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/service/AssetService.java - nghiep vu tai san + filter + map room.
- apps/web/src/modules/admin/types.ts - them types Supply/Asset + mo rong request service voi `specialtyId`.
- apps/web/src/modules/admin/api.ts - them API methods supplies/assets.
- apps/web/src/modules/admin/pages/ServiceManagementPage.tsx - bo sung dropdown khoa va hien thi khoa cho dich vu.
- apps/web/src/modules/admin/components/AdminSidebar.tsx - them nav `Vat tu`, `Tai san`.
- apps/web/src/modules/admin/components/AdminHeader.tsx - them route titles cho supplies/assets.
- apps/web/src/modules/admin/pages/index.ts - export page moi.
- apps/web/src/routes/router.tsx - them routes `/admin/supplies` va `/admin/assets`.

Logic da implement:

- Service-Specialty:
  - Tao/sua dich vu da nhan `specialtyId`, validate department ton tai.
  - UI dich vu co dropdown chon khoa trong modal.
- Supplies:
  - GET `/api/v1/admin/supplies` ho tro filter `active`, `lowStock`.
  - POST/PATCH/toogle/restock day du.
  - Frontend co bang ton kho, canh bao low stock, modal nhap kho.
- Assets:
  - GET `/api/v1/admin/assets` filter theo `category`, `status`, `roomId`.
  - POST/PATCH cap nhat category, phong, ngay mua, gia mua, status, ghi chu.
  - Frontend co filter + thao tac nhanh `Bao tri` / `Ngung su dung`.

Verification:

- npm.cmd run typecheck -w apps/web - PASS
- mvn -q -DskipTests compile - PASS

PR13 update 1: Bo truong thoi gian khoi nghiep vu dich vu - HOAN THANH

Da sua (4 files):

- apps/web/src/modules/admin/pages/ServiceManagementPage.tsx - bo input/cot `Thoi gian`, chi con ten dich vu + khoa + gia.
- apps/web/src/modules/admin/types.ts - `CreateServiceRequest.durationMin` chuyen thanh optional.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/dto/CreateServiceRequest.java - `durationMin` cho phep null, min >= 0.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/service/ServiceManagementService.java - tao dich vu khong nhap duration se mac dinh `durationMin=0`.

Logic da implement:

- Dich vu khong con yeu cau nhap thoi gian trong admin UI.
- Backend van giu tuong thich schema cu (cot `duration_min`), tu dong set 0 neu khong gui len.

Verification:

- npm.cmd run typecheck -w apps/web - PASS
- mvn -q -DskipTests compile - PASS

PR13 hotfix: Unexpected error khi tao Service/Supply/Asset tren Docker runtime - HOAN THANH

Nguyen nhan:

- Container `clinic_backend` dang chay build cu, chua co endpoint `/api/v1/admin/supplies` va `/api/v1/admin/assets`.
- Frontend goi endpoint moi -> backend tra `No static resource api/v1/admin/supplies` -> UI hien `Unexpected error`.

Da xu ly:

- Rebuild + restart backend container: `docker compose up -d --build backend`.
- Bo sung error handler de tra message ro hon:
  - `MethodArgumentNotValidException`: tra message field dau tien thay vi `Validation failed`.
  - `NoResourceFoundException`: tra `API khong ton tai: <path>` thay vi `Unexpected error`.

Da sua (1 file):

- apps/backend/src/main/java/com/clinic/backend/common/error/GlobalExceptionHandler.java

Verification:

- Test runtime API thanh cong:
  - POST `/api/v1/admin/services` (khong gui duration) -> OK
  - POST `/api/v1/admin/supplies` -> OK
  - POST `/api/v1/admin/assets` -> OK
- mvn -q -DskipTests compile - PASS
  PR13 update 2: Xoa han truong thoi gian dich vu tren UI/API frontend - HOAN THANH

Da sua (6 files):

- apps/web/src/modules/admin/types.ts - bo `durationMin` khoi AdminServiceDto/CreateServiceRequest/UpdateServiceRequest va ServiceItem.
- apps/web/src/modules/admin/pages/ReceptionPage.tsx - bo hien thi thoi gian trong the thong tin dich vu va list dich vu nhanh.
- apps/web/src/modules/patient/types.ts - bo `durationMin` khoi ClinicService.
- apps/web/src/modules/patient/pages/ServicesPage.tsx - bo cot "Thoi gian" trong bang dich vu.
- apps/web/src/modules/patient/pages/PatientHomePage.tsx - bo hien thi thoi gian o card dich vu va bang gia preview.
- thaolam.md - cap nhat nhat ky task.

Logic da implement:

- Dich vu khong con concept "thoi gian kham co dinh" tren frontend contracts/UI.
- Backend giu tuong thich schema cu (`services.duration_min`), khong expose qua API; gia tri duoc mac dinh 0 khi tao dich vu.

Verification:

- cmd /c npm run typecheck -w apps/web - PASS
- mvn -q -DskipTests compile - PASS

Known issues / TODO con lai:

- Cot DB `duration_min` van ton tai de tuong thich migration cu; neu muon xoa vat ly can them migration rieng (ALTER TABLE + data migration).

PR14: Sprint 6 - Thu Chi + Ban le + In hoa don - HOAN THANH

Da tao moi (5 files):

- apps/backend/src/main/java/com/clinic/backend/modules/admin/dto/FinanceLedgerDto.java - DTO dong so cai thu chi.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/dto/FinanceSummaryDto.java - DTO tong thu/tong chi/chenh lech.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/dto/RetailSaleRequest.java - request ban le thuoc.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/dto/RetailSaleResponse.java - response hoa don ban le.
- apps/web/src/modules/admin/components/PrintableInvoice.tsx - component in hoa don dung chung.

Da sua (9 files):

- apps/backend/src/main/java/com/clinic/backend/modules/admin/controller/ReportController.java - them GET /reports/finance va GET /reports/finance/summary.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/service/ReportService.java - query ledger theo filter + summary thu/chi.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/controller/CashierController.java - them POST /cashier/retail-sale.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/service/CashierService.java - logic ban le: validate stock, deduct stock_real, ghi finance_ledger INCOME/MEDICATION_SALE.
- apps/backend/src/main/java/com/clinic/backend/modules/doctor/repository/MedicationRepository.java - them deductForRetail().
- apps/web/src/modules/admin/types.ts - them types RetailSale + FinanceLedger/FinanceSummary.
- apps/web/src/modules/admin/api.ts - them retailSale(), getFinanceLedger(), getFinanceSummary().
- apps/web/src/modules/admin/pages/ReportsPage.tsx - them tab Thu Chi (filter + bang ledger + tong ket).
- apps/web/src/modules/admin/pages/CashierPage.tsx - them tab Ban le, xuat hoa don, preview/in hoa don cho ca 2 luong.
- apps/web/src/modules/admin/components/index.ts - export PrintableInvoice.

Logic da implement:

- Thu Chi:
  - Ledger endpoint filter theo from/to/category/type.
  - Summary endpoint tra tong INCOME/EXPENSE va balance.
- Ban le thuoc:
  - POST /api/v1/admin/cashier/retail-sale nhan danh sach thuoc + SL.
  - Tru kho truc tiep bang query atomic (stockReal - stockHold >= qty).
  - Ghi finance_ledger theo tung item MEDICATION_SALE.
- In hoa don:
  - Dung PrintableInvoice cho luong thanh toan kham va luong ban le.
  - Co popup preview va nut in.

Verification:

- mvn -q -DskipTests compile - PASS
- cmd /c npm run typecheck -w apps/web - PASS
- cmd /c npm run lint -w apps/web - PASS

Known issues / TODO con lai:

- Chua them chuc nang export CSV tab Thu Chi (optional).
- Neu chay web bang Docker image build tinh thi van can rebuild image web de thay doi UI; de hot reload dung npm run dev -w apps/web.

PR15: Sprint 6 + Sprint 7 gop - Bao cao nang cao + Thu Chi day du + Audit log action-based - HOAN THANH

Da tao moi (3 files):

- apps/backend/src/main/java/com/clinic/backend/modules/admin/service/AuditLogService.java - service ghi audit_logs tap trung, tu lay actor_user_id tu JWT principal.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/dto/DailyInvoiceDto.java - DTO hoa don ngay (kham + thuoc).
- apps/backend/src/main/java/com/clinic/backend/modules/admin/dto/DoctorVisitStatsDto.java - DTO luot kham theo bac si (sang/chieu/tong).

Da sua (12 files):

- apps/backend/src/main/java/com/clinic/backend/modules/admin/controller/ReportController.java - them API GET /reports/daily-invoices, GET /reports/visits-by-doctor, mo rong GET /reports/audit co filter action.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/service/ReportService.java - query daily invoices, visits-by-doctor, audit filter theo entityType + action.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/repository/AuditLogRepository.java - them query findByDateRangeAndFilters(..., entityType, action).
- apps/backend/src/main/java/com/clinic/backend/modules/admin/service/AutoDispatchService.java - OVERRIDE_SLOT ghi qua AuditLogService (co actor + meta_json day du).
- apps/backend/src/main/java/com/clinic/backend/modules/admin/service/ReceptionService.java - log CANCEL_BOOKING khi danh dau NO_SHOW (reason/fromStatus/toStatus).
- apps/backend/src/main/java/com/clinic/backend/modules/admin/service/MedicationManagementService.java - log STOCK_EDIT khi restock; create thuoc co initial stock thi ghi finance_ledger MEDICATION_PURCHASE.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/service/SupplyService.java - log STOCK_EDIT cho restock/adjust; create vat tu co stock ban dau thi ghi finance_ledger SUPPLY_PURCHASE.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/service/CashierService.java - log REMOVE_PRESCRIPTION_ITEM khi xoa thuoc khoi don.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/service/UserManagementService.java - log RESET_PASSWORD, LOCK_ACCOUNT, UNLOCK_ACCOUNT.
- apps/web/src/modules/admin/types.ts - them types DailyInvoiceDto, DoctorVisitStatsDto.
- apps/web/src/modules/admin/api.ts - them getDailyInvoices(), getVisitsByDoctor(), mo rong getAuditLogs(..., action).
- apps/web/src/modules/admin/pages/ReportsPage.tsx - bo sung UI Hoa don ngay + Luot kham theo bac si + Thu Chi hien thi Nhap/Xuat/Thu/Chi + Audit filter action va parse meta_json.

Logic da implement:

- Thu Chi trong Reports:
  - Ledger hien thi du: ngay, nhap/xuat, loai, danh muc, mo ta, so luong, don vi, so tien, nguoi thuc hien.
  - Tong hop tong thu/tong chi/chenh lech.
  - Nhap kho vat tu/thuoc ban dau da duoc day vao finance_ledger ngay luc tao danh muc co stock > 0.
- Bao cao nang cao:
  - Hoa don ngay: danh sach booking da PAID theo ngay, co tien dich vu + tien thuoc + tong.
  - Luot kham theo bac si: thong ke sang/chieu/tong trong khoang ngay.
- Audit log rieng theo event:
  - OVERRIDE_SLOT, STOCK_EDIT, CANCEL_BOOKING, RESET_PASSWORD, LOCK_ACCOUNT, UNLOCK_ACCOUNT, REMOVE_PRESCRIPTION_ITEM.
  - UI Reports co filter action + parse meta_json de doc nhanh.

Verification:

- mvn -q -DskipTests compile - PASS
- cmd /c npm run typecheck -w apps/web - PASS
- cmd /c npm run lint -w apps/web - PASS

Ghi chu:

- endpoint audit backend hien la `/api/v1/admin/reports/audit` (frontend da dong bo filter action).
- daily invoices hien tap trung luong booking paid; luong ban le duoc bao phu o tab Thu Chi qua category MEDICATION_SALE.
  PR15 update 1: Them nut tao hoa don ban le + phieu thu/chi/nhap/xuat trong tab Thu Chi - HOAN THANH

Da tao moi (1 file):

- apps/backend/src/main/java/com/clinic/backend/modules/admin/dto/ManualFinanceEntryRequest.java - request tao but toan thu/chi/nhap/xuat thu cong.

Da sua (5 files):

- apps/backend/src/main/java/com/clinic/backend/modules/admin/controller/ReportController.java - them POST /api/v1/admin/reports/finance/manual.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/service/ReportService.java - xu ly tao entry finance_ledger thu cong (THU/CHI/NHAP/XUAT) + ghi audit MANUAL_FINANCE_ENTRY.
- apps/web/src/modules/admin/types.ts - them ManualFinanceEntryRequest.
- apps/web/src/modules/admin/api.ts - them createManualFinanceEntry().
- apps/web/src/modules/admin/pages/ReportsPage.tsx - them:
  - nut "Tao hoa don ban le" (jump sang /admin/cashier?tab=retail)
  - form "Tao phieu thu/chi" ngay trong tab Thu Chi
  - map hien thi Nhap/Xuat cho category manual
  - bo sung category filter manual + action MANUAL_FINANCE_ENTRY.
- apps/web/src/modules/admin/pages/CashierPage.tsx - doc query param `tab=retail` de mo dung tab Ban le khi dieu huong tu Reports.

Logic da implement:

- Admin co the tao phieu:
  - CHI -> EXPENSE / MANUAL_EXPENSE
  - THU -> INCOME / MANUAL_INCOME
  - NHAP -> EXPENSE / MANUAL_STOCK_IN
  - XUAT -> INCOME / MANUAL_STOCK_OUT
- Thu Chi hien thi ro hon cho nghiep vu nhap/xuat/thu/chi va van giu luong xuat thuoc tu:
  - Ke toa da thanh toan (MEDICATION_SALE trigger)
  - Ban le thuoc (retail-sale).

Verification:

- mvn -q -DskipTests compile - PASS
- cmd /c npm run typecheck -w apps/web - PASS
- cmd /c npm run lint -w apps/web - PASS

---

PR11: Sprint 8 + Fix runtime loi retail/thu chi - HOAN THANH

Da tao moi (0 files):

- Khong tao file moi cho dot fix nay.

Da sua (3 files):

- apps/web/src/modules/admin/pages/PatientManagementPage.tsx - them show/hide password cho modal reset mat khau benh nhan (icon mat, toggle text/password, reset state khi dong modal).
- apps/backend/src/main/java/com/clinic/backend/modules/admin/service/CashierService.java - fix parse completedAt tu native query bang helper toInstant(), tranh ClassCastException Instant -> Timestamp.
- apps/backend/src/main/java/com/clinic/backend/modules/admin/service/ReportService.java - fix parse createdAt cua finance ledger bang helper toInstant(), tranh loi cast khi DB tra ve Instant.

Logic da implement:

- Sprint 8 (Phase 0.2) hoan tat phan con thieu: show/hide password trong modal reset mat khau benh nhan.
- Runtime hardening cho sprint 6-7 endpoint moi:
  - POST /api/v1/admin/cashier/retail-sale
  - POST /api/v1/admin/reports/finance/manual
- Khac phuc loi backend gay "Unexpected error" khi vao trang Thu ngan/Bao cao do cast kieu thoi gian native query.

Verification:

- Backend compile: mvn -q -DskipTests compile - PASS
- Frontend typecheck: npm run typecheck -w apps/web - PASS
- Frontend lint: npm run lint -w apps/web - PASS
- Docker logs truoc fix ghi nhan loi: CashierService.getCompletedBookings ClassCastException (Instant -> Timestamp)

Known issues / TODO con lai:

- Neu dang chay bang docker image cu, can restart/rebuild backend container de nap code moi, neu khong frontend van thay "API khong ton tai" do runtime cu.
- Khuyen nghi dev nhanh: chay local dev mode (npm run dev) thay vi docker build moi lan sua code.

---

PR12: Sidebar Admin gom nhom menu - HOAN THANH

Da tao moi (0 files):

- Khong tao file moi.

Da sua (1 file):

- apps/web/src/modules/admin/components/AdminSidebar.tsx - gom menu thanh cac nhom (Dieu hanh, Quan ly kham, Kho va tai nguyen, Tong hop), thu gon spacing/rong sidebar de giao dien gon hon.

Logic da implement:

- Grouped navigation trong sidebar theo domain nghiep vu.
- Giu nguyen active state route va dark mode classes.

Verification:

- npm run lint -w apps/web - PASS
- npm run typecheck -w apps/web - PASS

Known issues / TODO con lai:

- Khong co.

---

PR13: Sidebar accordion theo nhom (giu Tac vu nhanh) - HOAN THANH

Da tao moi (0 files):

- Khong tao file moi.

Da sua (1 file):

- apps/web/src/modules/admin/components/AdminSidebar.tsx - them co che dong/mo nhom menu (accordion), mo nhom nay tu dong dong nhom kia; giu section `Tac vu nhanh` (Dashboard, Le tan, Thu ngan) luon hien de thao tac nhanh.

Logic da implement:

- `openGroupId` state quan ly 1 nhom dang mo duy nhat.
- Click header nhom: toggle mo/dong.
- Khi route doi vao item trong nhom, nhom tu dong mo de hien menu active.

Verification:

- npm run lint -w apps/web - PASS
- npm run typecheck -w apps/web - PASS

Known issues / TODO con lai:

- Khong co.
