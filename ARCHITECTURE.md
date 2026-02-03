# Architecture

## Tổng quan

Monorepo gồm 2 backend trong giai đoạn migrate:

- `apps/backend`: Spring Boot backend (mục tiêu dài hạn)
- `apps/api`: Node/Express API (legacy)

Frontend:

- `apps/web`: React + Vite

DB:

- PostgreSQL (local qua `docker-compose.yml`)

## Backend API (Spring Boot)

### API conventions

- Base path: `/api/v1`
- Health: `/api/v1/health`
- Error response (tạm thời): `{ code, message, timestamp }`

### CORS

- Config qua env: `CORS_ALLOWED_ORIGINS` (comma-separated)

### Observability

- Spring Boot Actuator: `/actuator/health`, `/actuator/info` (đã expose)

## Database model (baseline)

Flyway migration `V1__init.sql` tạo các nhóm bảng chính:

- Identity: `users`, `doctors`, `patients`
- Catalog: `specialties`, `doctor_specialties`, `services`, `medications`
- Scheduling/Booking: `shifts`, `slots`, `bookings`
- Pharmacy: `prescriptions`, `prescription_items`
- Audit: `audit_logs`

## Business logic outlines

### 1) Slot Management (Common/Reserve/Override)

Mục tiêu: kiểm soát capacity theo ca và đảm bảo kênh web không “ăn” hết slot.

- `shifts`: ca theo bác sĩ + ngày + buổi (MORNING/AFTERNOON)
- `slots`: slot theo `shift`, có `pool`:
  - `COMMON`: dành cho web
  - `RESERVE`: dành cho lễ tân/case đặc biệt
  - `OVERRIDE`: dành cho admin (nếu cần)

Gợi ý transaction khi đặt lịch:

- Use transaction.
- Lock slot theo thứ tự ưu tiên pool (tuỳ role/kênh).
- Đảm bảo `bookings.slot_id` unique để chống double-book.

### 2) Smart Queue (Skip / Status transitions)

Trạng thái booking (baseline):

- `BOOKED` -> `CHECKED_IN` -> `WAITING` -> `IN_CONSULTATION` -> `PENDING_LAB` -> `RESULTS_READY` -> `COMPLETED`
- `NO_SHOW` / `CANCELED`

Gợi ý vận hành:

- Check-in set `check_in_at`.
- Smart queue chọn “người tiếp theo” theo:
  - trạng thái `WAITING`
  - thời điểm check-in
  - `skip_count` (để giảm ưu tiên người bị skip nhiều lần)

Gợi ý về concurrency:

- Khi bác sĩ “call next”, cần transaction + lock booking row để tránh 2 client cùng pick một người.

### 3) Two-step Drug Inventory (Hold -> Paid)

Mục tiêu: giữ thuốc khi kê đơn nhưng chỉ trừ kho thật khi thanh toán.

- `medications.stock_real`: tồn kho thực
- `medications.stock_hold`: tồn kho đang giữ (reserved)
- `prescriptions.status`:
  - `HELD`: đã giữ thuốc
  - `PAID`: đã thanh toán và xuất thuốc
  - `CANCELED`/`EXPIRED`: trả hold

Gợi ý transaction:

- Khi tạo prescription (HELD):
  - validate `stock_real - stock_hold >= qty`
  - tăng `stock_hold`
- Khi thanh toán (PAID):
  - giảm `stock_hold`
  - giảm `stock_real`
- Khi huỷ/expire:
  - giảm `stock_hold`

## Notes / Future work

- AuthN/AuthZ (JWT + RBAC)
- Module boundaries rõ ràng theo domain (`scheduling`, `booking`, `queue`, `pharmacy`, `billing`)
- Test strategy: unit test + integration test với Testcontainers
