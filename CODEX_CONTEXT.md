# CODEX CONTEXT — Healthcare Clinic System

> File này để Codex đọc hiểu toàn bộ dự án trước khi code tiếp.
> Cập nhật: 2026-03-12

---

## 1. STACK & CẤU TRÚC MONOREPO

```
apps/
  backend/   → Spring Boot 3.2 (Java 21) — backend chính
  api/       → Node/Express (legacy, chỉ tham khảo)
  web/       → React 18 + Vite + TypeScript + TailwindCSS
packages/
  shared/    → TypeScript contracts dùng chung
```

**DB:** PostgreSQL (local qua docker-compose.yml)  
**Auth:** JWT (HMAC-signed), stateless, claim gồm `userId`, `phone`, `role`  
**API base:** `http://localhost:4000/api/v1`  
**Frontend dev port:** `http://localhost:3000`

**Roles:** `OWNER` > `ADMIN` > `DOCTOR` > `PATIENT`

---

## 2. BA LOGIC CỐT LÕI (BẮT BUỘC ĐỌC)

### Logic A — Slot "12 + 4"

- Mỗi ca (MORNING 7h–11h / AFTERNOON 13h–17h) của 1 bác sĩ = **16 slot**
  - `COMMON` (seq 1–12): dành cho Web + Vãng lai
  - `RESERVE` (seq 13–16): **chỉ** dành cho Vãng lai (Lễ tân)
  - `OVERRIDE`: tạo thêm khi cả 2 pool hết (cần quyền ghi đè)
- Web booking chỉ được lấy từ pool `COMMON`, hết 12 thì báo Full.
- Walk-in: ưu tiên COMMON → RESERVE → OVERRIDE

### Logic B — Hàng chờ thông minh (priority_score)

Thứ tự ưu tiên tự động:

1. Bệnh nhân có KQ xét nghiệm (`RESULTS_READY`) — điểm cao nhất
2. Khách đặt Web đến đúng giờ (`CHECKED_IN`, channel=WEB) — priority_score=50
3. Khách vãng lai — priority_score thấp hơn

Skip: bị đẩy xuống (giảm priority_score). Hệ thống chỉ tự chuyển `NO_SHOW` khi hết ca.

### Logic C — Kho thuốc 2 bước

- **Bước 1 (Bác sĩ kê đơn):** `prescription.status = HELD`, tăng `medications.stock_hold`
  - Validate: `stock_real - stock_hold >= qty`
- **Bước 2 (Thu ngân thanh toán):** `prescription.status = PAID`, giảm `stock_hold` và `stock_real`
- **Hủy/Expire (>2h chưa TT):** giảm `stock_hold`, `prescription.status = EXPIRED`

---

## 3. STATE MACHINE — BOOKING STATUS

```
BOOKED → CHECKED_IN → WAITING → IN_CONSULTATION → PENDING_LAB → RESULTS_READY → COMPLETED
                                                                               ↓
                                                                          NO_SHOW / CANCELED
```

Ai set trạng thái:

- Lễ tân: `BOOKED → CHECKED_IN`, đánh dấu `NO_SHOW`
- Bác sĩ: `WAITING → IN_CONSULTATION → PENDING_LAB → RESULTS_READY → COMPLETED`
- Admin/Lễ tân **KHÔNG** set IN_CONSULTATION hay COMPLETED

---

## 4. DATABASE SCHEMA — TÓM TẮT

**Migrations đã chạy: V1 → V12**

| Bảng                          | Mô tả                                                                                                                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users`                       | id (UUID), phone UNIQUE, password_hash, role (OWNER/ADMIN/DOCTOR/PATIENT), status (ACTIVE/LOCKED), full_name                                                            |
| `doctors`                     | id, user_id FK, display_name, specialty, avatar_url                                                                                                                     |
| `patients`                    | id, user_id FK (nullable), full_name, phone, national_id, date_of_birth, gender, address, allergies                                                                     |
| `departments`                 | id, name UNIQUE — 15 khoa đã seed                                                                                                                                       |
| `services`                    | id, name, duration_min, price_cents, is_active                                                                                                                          |
| `shifts`                      | id, doctor_id FK, date, type (MORNING/AFTERNOON), status (OPEN/CLOSED)                                                                                                  |
| `slots`                       | id, shift_id FK, sequence (1–16), pool (COMMON/RESERVE/OVERRIDE), status (OPEN/LOCKED)                                                                                  |
| `bookings`                    | id, slot_id FK UNIQUE, patient_id FK, service_id FK, status, channel (WEB/WALK_IN), payment_status (UNPAID/PAID), queue_number, priority_score, check_in_at, skip_count |
| `medications`                 | id, name, unit, usage, default_dose, price_cents, stock_real, stock_hold, is_active                                                                                     |
| `prescriptions`               | id, booking_id FK, status (HELD/PAID/CANCELED/EXPIRED), created_at                                                                                                      |
| `prescription_items`          | id, prescription_id FK, medication_id FK, qty, dosage, note                                                                                                             |
| `prescription_templates`      | id, name UNIQUE, note, is_active                                                                                                                                        |
| `prescription_template_items` | id, template_id FK, medication_id FK, qty, dosage, note                                                                                                                 |
| `medical_records`             | id, booking_id FK, symptoms, diagnosis, notes                                                                                                                           |
| `ratings`                     | id, booking_id FK UNIQUE, doctor_id FK, patient_id FK, stars (1–5), comment                                                                                             |
| `audit_logs`                  | id, actor_user_id, action, entity_type, entity_id, meta_json, created_at                                                                                                |

**Utility:** `refresh_demo_data()` — PostgreSQL function, tự chạy lúc server khởi động để reset demo data về `CURRENT_DATE`.

---

## 5. BACKEND — API ENDPOINTS ĐÃ CÓ

### Auth (`/api/v1/auth`)

| Method | Endpoint    | Auth   | Mô tả                   |
| ------ | ----------- | ------ | ----------------------- |
| POST   | `/register` | Public | Đăng ký PATIENT         |
| POST   | `/login`    | Public | Trả `{token, user}`     |
| GET    | `/me`       | Bearer | Thông tin user hiện tại |

### Admin (`/api/v1/admin`) — `@PreAuthorize hasAnyRole('OWNER','ADMIN')`

| Method | Endpoint                                    | Mô tả                                   |
| ------ | ------------------------------------------- | --------------------------------------- |
| GET    | `/dashboard/stats`                          | 7 KPI cards                             |
| GET    | `/dashboard/shifts`                         | Ca trực hôm nay                         |
| GET    | `/reception/bookings`                       | Danh sách booking hôm nay               |
| GET    | `/reception/search?phone=`                  | Tìm booking theo SĐT                    |
| POST   | `/reception/check-in`                       | BOOKED → CHECKED_IN                     |
| POST   | `/reception/walk-in`                        | Tạo walk-in (Logic A)                   |
| POST   | `/reception/no-show/{id}`                   | Đánh dấu NO_SHOW                        |
| GET    | `/cashier/bookings`                         | COMPLETED bookings chưa TT              |
| GET    | `/cashier/bookings/{id}`                    | Chi tiết hóa đơn                        |
| POST   | `/cashier/pay/{id}`                         | Thanh toán (Logic C bước 2)             |
| DELETE | `/cashier/prescription-items/{itemId}`      | Xóa thuốc khỏi đơn                      |
| POST   | `/cashier/expire-old`                       | Hủy đơn quá 2h                          |
| GET    | `/shifts?date=`                             | Danh sách ca                            |
| POST   | `/shifts`                                   | Tạo ca (sinh 12 COMMON + 4 RESERVE)     |
| POST   | `/shifts/{id}/lock`                         | Khóa ca                                 |
| POST   | `/shifts/{id}/open`                         | Mở ca                                   |
| DELETE | `/shifts/{id}`                              | Xóa ca (guard: nếu có booking thì chặn) |
| GET    | `/shifts/{id}/slots`                        | Danh sách slot                          |
| POST   | `/shifts/slots/{slotId}/toggle`             | Toggle slot OPEN↔LOCKED                 |
| GET    | `/services`                                 | Danh sách dịch vụ                       |
| POST   | `/services`                                 | Tạo dịch vụ                             |
| PATCH  | `/services/{id}`                            | Sửa dịch vụ                             |
| POST   | `/services/{id}/toggle`                     | Toggle active                           |
| GET    | `/doctors`                                  | Danh sách bác sĩ                        |
| POST   | `/doctors`                                  | Tạo tài khoản bác sĩ                    |
| PATCH  | `/doctors/{id}`                             | Sửa bác sĩ                              |
| POST   | `/doctors/{id}/lock`                        | Khóa tài khoản                          |
| POST   | `/doctors/{id}/unlock`                      | Mở khóa                                 |
| GET    | `/patients?q=`                              | Tìm bệnh nhân                           |
| POST   | `/patients/{id}/reset-password`             | Reset mật khẩu                          |
| GET    | `/patients/{id}/records`                    | Hồ sơ khám của bệnh nhân                |
| GET    | `/medications?q=`                           | Danh mục thuốc                          |
| POST   | `/medications`                              | Tạo thuốc                               |
| PATCH  | `/medications/{id}`                         | Sửa thuốc                               |
| POST   | `/medications/{id}/toggle`                  | Toggle active                           |
| POST   | `/medications/{id}/restock`                 | Nhập thêm tồn kho                       |
| GET    | `/prescription-templates`                   | Danh sách toa mẫu                       |
| GET    | `/prescription-templates/{id}`              | Chi tiết toa mẫu                        |
| POST   | `/prescription-templates`                   | Tạo toa mẫu                             |
| PUT    | `/prescription-templates/{id}`              | Sửa toa mẫu                             |
| POST   | `/prescription-templates/{id}/toggle`       | Toggle active                           |
| DELETE | `/prescription-templates/{id}`              | Xóa toa mẫu                             |
| GET    | `/departments`                              | Danh sách khoa                          |
| POST   | `/departments`                              | Tạo khoa                                |
| PATCH  | `/departments/{id}`                         | Đổi tên khoa                            |
| DELETE | `/departments/{id}`                         | Xóa khoa                                |
| GET    | `/reports/summary?from=&to=`                | Báo cáo tổng hợp                        |
| GET    | `/reports/audit-logs?from=&to=&entityType=` | Audit log                               |

### Doctor (`/api/doctor`) — `@PreAuthorize hasAnyRole('DOCTOR','ADMIN','OWNER')`

| Method | Endpoint                                     | Mô tả                         |
| ------ | -------------------------------------------- | ----------------------------- |
| GET    | `/profile?userId=`                           | Profile bác sĩ                |
| GET    | `/{doctorId}/shifts?date=`                   | Ca làm của bác sĩ             |
| GET    | `/shifts/{shiftId}`                          | Chi tiết ca                   |
| GET    | `/shifts/{shiftId}/queue?status=`            | Hàng chờ (Logic B)            |
| GET    | `/shifts/{shiftId}/bookings`                 | Tất cả bookings trong ca      |
| GET    | `/{doctorId}/schedule?from=&to=`             | Lịch làm việc                 |
| GET    | `/consultation/bookings/{id}`                | Chi tiết booking              |
| POST   | `/consultation/shifts/{shiftId}/invite-next` | Mời người tiếp theo           |
| POST   | `/consultation/bookings/{id}/invite`         | Mời cụ thể                    |
| POST   | `/consultation/bookings/{id}/skip`           | Bỏ qua                        |
| POST   | `/consultation/bookings/{id}/send-to-lab`    | Gửi xét nghiệm → PENDING_LAB  |
| POST   | `/consultation/bookings/{id}/results-ready`  | Có KQ → RESULTS_READY         |
| POST   | `/consultation/bookings/{id}/medical-record` | Lưu hồ sơ khám                |
| POST   | `/consultation/bookings/{id}/prescription`   | Kê đơn (Logic C bước 1, HELD) |

### Customer (`/api/customer`)

| Method | Endpoint               | Auth   | Mô tả                      |
| ------ | ---------------------- | ------ | -------------------------- |
| GET    | `/doctors`             | Public | Danh sách bác sĩ           |
| GET    | `/doctors/{id}/shifts` | Public | Ca còn slot                |
| GET    | `/services`            | Public | Bảng giá dịch vụ           |
| POST   | `/bookings`            | Bearer | Đặt lịch (chỉ COMMON pool) |
| POST   | `/bookings/{id}/pay`   | Bearer | Thanh toán mock            |
| GET    | `/bookings/{id}`       | Bearer | Vé khám + QR               |
| POST   | `/checkin/qr/{id}`     | Bearer | Check-in bằng QR           |

### Owner (`/api/owner/accounts`) — `@PreAuthorize hasRole('OWNER')`

CRUD tài khoản tất cả roles, toggle lock, reset password, xóa (không xóa được OWNER).

---

## 6. FRONTEND — ADMIN MODULE

**Vị trí:** `apps/web/src/modules/admin/`

### Routes đã có (tất cả đều có page đầy đủ)

| Route                | Page                     | Trạng thái |
| -------------------- | ------------------------ | ---------- |
| `/admin/dashboard`   | AdminDashboardPage       | ✅ Đầy đủ  |
| `/admin/reception`   | ReceptionPage            | ✅ Đầy đủ  |
| `/admin/cashier`     | CashierPage              | ✅ Đầy đủ  |
| `/admin/doctors`     | DoctorManagementPage     | ✅ Đầy đủ  |
| `/admin/patients`    | PatientManagementPage    | ✅ Đầy đủ  |
| `/admin/records`     | PatientRecordsPage       | ✅ Đầy đủ  |
| `/admin/shifts`      | ShiftManagementPage      | ✅ Đầy đủ  |
| `/admin/services`    | ServiceManagementPage    | ✅ Đầy đủ  |
| `/admin/medications` | MedicationManagementPage | ✅ Đầy đủ  |
| `/admin/templates`   | PrescriptionTemplatePage | ✅ Đầy đủ  |
| `/admin/departments` | DepartmentManagementPage | ✅ Đầy đủ  |
| `/admin/reports`     | ReportsPage              | ✅ Đầy đủ  |

### Key files

- `types.ts` — Tất cả TypeScript interfaces cho admin
- `api.ts` — `adminApi` object với ~40 methods; auth qua `getAuthHeaders()` đọc `clinic_token` từ localStorage
- `components/AdminLayout.tsx` — Shell: Sidebar + Header + Outlet
- `components/AdminSidebar.tsx` — 12 nav items, role badge, logout
- `components/AdminHeader.tsx` — Title + ngày, notification bell (placeholder)

### Tài khoản test

| Role   | SĐT                 | Mật khẩu    |
| ------ | ------------------- | ----------- |
| OWNER  | 0900000000          | owner123    |
| ADMIN  | 0903456789          | password123 |
| DOCTOR | (xem V12 migration) | password123 |

---

## 7. NHỮNG GÌ CÒN THIẾU / CHƯA HOÀN CHỈNH

| Mục                                  | Mức độ | Chi tiết                                                                                                           |
| ------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------ |
| **Check-in QR scanner**              | Medium | ReceptionPage có Cách 2 (tìm SĐT) nhưng Cách 1 (quét QR camera) chưa implement — cần thư viện như `@zxing/browser` |
| **In hóa đơn PDF**                   | Medium | CashierPage có nút "In" nhưng chưa có logic print/PDF — cần `window.print()` hoặc react-to-print                   |
| **Notification bell**                | Low    | AdminHeader có icon chuông nhưng onClick trống — chưa có hệ thống thông báo                                        |
| **API_BASE hardcode**                | Low    | `api.ts` dùng `http://localhost:4000` cứng, nên chuyển sang `import.meta.env.VITE_API_URL`                         |
| **Dashboard fallback cứng**          | Low    | AdminDashboardPage khi API lỗi hiện fake data (`todayPatients: 24`...) — nên bỏ trước production                   |
| **Báo cáo OVERRIDE**                 | Low    | PRD yêu cầu báo cáo riêng số ca lễ tân "nhét thêm" vượt 16 slot — ReportsPage chưa có mục này                      |
| **Auto-create tài khoản vãng lai**   | Medium | PRD §2.7: khi tạo phiếu walk-in mới → tự tạo User=SĐT — cần verify trong ReceptionService                          |
| **Receptionist & Pharmacist routes** | Future | Router có comment `// Coming soon` cho `/receptionist/` và `/pharmacist/`                                          |
| **Realtime websocket**               | Future | Hiện dùng polling (10s–30s). PRD yêu cầu realtime khi lễ tân check-in → hiện ngay trên màn hình bác sĩ             |

---

## 8. CONVENTIONS BẮT BUỘC

### TypeScript / React

- `exactOptionalPropertyTypes: true` — dùng `?: T | undefined`, KHÔNG dùng optional omit tricks
- Conditional spread: `{...(value ? { key: value } : {})}` thay vì `key?: value`
- Tất cả API calls qua `adminApi.*` trong `api.ts`, KHÔNG gọi fetch trực tiếp trong pages
- TanStack Query: `useQuery` cho data, `useMutation` cho mutations, tự invalidate sau mutation
- Format tiền: cents (integer) trong database/API, × 10 để hiển thị VND (1 cent = 10 VND)

### Java / Spring Boot

- Native SQL qua `EntityManager` cho queries phức tạp nhiều join
- `@PreAuthorize("hasAnyRole('OWNER','ADMIN')")` trên tất cả admin controllers
- DTO riêng cho mỗi response (không dùng Entity trực tiếp)
- Flyway migration: `V{N}__short_description.sql`, phải idempotent (`ON CONFLICT DO NOTHING`)

### Git

- Branch: `feat/<tên>`, `fix/<tên>`, `chore/<tên>`, `docs/<tên>`
- Trước mỗi PR: `npm run check` (lint + typecheck 3 workspaces)
- **Không commit thẳng vào `main`**

### Sau khi làm xong task

→ **Cập nhật `thaolam.md`** theo template trong file đó (bắt buộc).

---

## 9. LỆNH THƯỜNG DÙNG

```bash
# Start dev (frontend + backend)
npm run dev

# Typecheck + lint toàn bộ
npm run check

# Typecheck + lint + build
npm run check:all

# Chỉ frontend
npm run dev -w apps/web

# Chỉ backend test
npm run test -w apps/backend

# Docker DB
docker-compose up -d
```

---

## 10. FILE QUAN TRỌNG CẦN ĐỌC KHI LÀM FEATURE MỚI

| File                                                           | Lý do                                       |
| -------------------------------------------------------------- | ------------------------------------------- |
| `apps/web/src/modules/admin/types.ts`                          | Thêm interface mới ở đây                    |
| `apps/web/src/modules/admin/api.ts`                            | Thêm API method mới ở đây                   |
| `apps/web/src/routes/router.tsx`                               | Thêm route mới ở đây                        |
| `apps/backend/src/main/resources/db/migration/`                | Thêm migration V{N+1} ở đây                 |
| `apps/backend/src/main/java/com/clinic/backend/modules/admin/` | Thêm Controller/Service/DTO mới ở đây       |
| `hd.md`                                                        | PRD gốc — đọc khi không chắc business logic |
| `thaolam.md`                                                   | Nhật ký công việc — cập nhật sau mỗi task   |
