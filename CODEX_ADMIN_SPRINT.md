# CODEX — BẢN CHỐT NGHIỆP VỤ MVP ADMIN
> Tài liệu yêu cầu chi tiết để implement. Đọc cùng với `CODEX_CONTEXT.md`.
> Cập nhật: 2026-03-12

---

## TỔNG QUAN THAY ĐỔI

Đây là danh sách **toàn bộ** thay đổi cần làm cho admin module theo thứ tự ưu tiên từ cao đến thấp.

---

## PHASE 0 — SỬA BUG NGAY (không phụ thuộc gì)

### 0.1 Fix Toa Thuốc Mẫu — không sửa/xóa được
**Vấn đề:** `PrescriptionTemplatePage` + `PrescriptionTemplateController` đang có bug không cho sửa hoặc xóa template.  
**Cần kiểm tra:**
- Frontend: `handleSubmit()` trong `TemplateModal` — payload PUT có đúng format không
- Backend: `updateTemplate()` và `deleteTemplate()` trong `PrescriptionTemplateController` / `PrescriptionTemplateService`
- Migration V8: `ON CONFLICT` và cascade delete có đúng không
- File: `apps/web/src/modules/admin/pages/PrescriptionTemplatePage.tsx`
- File: `apps/backend/.../modules/admin/PrescriptionTemplateController.java`

### 0.2 Show/Hide Password
**Vị trí:** Tất cả form có input password:
- `apps/web/src/modules/auth/login.page.tsx`
- `apps/web/src/modules/auth/register.page.tsx`
- `apps/web/src/modules/auth/forgot-password.page.tsx`
- Modal tạo/sửa bác sĩ trong `DoctorManagementPage.tsx`
- Modal reset mật khẩu trong `PatientManagementPage.tsx`
  
**Cách làm:** Thêm state `showPw: boolean`, icon mắt (toggle), type `password/text`.

---

## PHASE 1 — TÁI CẤU TRÚC DATA MODEL (cần làm trước khi code tính năng mới)

### 1.1 Migration V13 — Room (Phòng khám)
**Tạo bảng `rooms`:**
```sql
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,          -- "P01", "P02"
  name TEXT NOT NULL,                 -- "Phòng khám 1"
  area TEXT,                          -- "Tầng 1", "Khu A"
  room_type TEXT NOT NULL,            -- 'EXAMINATION', 'LAB', 'ULTRASOUND', ...
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'INACTIVE', 'MAINTENANCE'
  created_at TIMESTAMPTZ DEFAULT now()
);
-- Gán phòng cho ca làm việc:
ALTER TABLE shifts ADD COLUMN room_id UUID REFERENCES rooms(id);
-- Seed 4 phòng mẫu
```

### 1.2 Migration V14 — Service-Specialty relationship + Doctor-Service many-to-many
**Vấn đề hiện tại:** `services` chưa có `specialty_id`. `doctors` và `services` chưa có quan hệ nhiều-nhiều.

```sql
-- Gán specialty cho service
ALTER TABLE services ADD COLUMN specialty_id UUID REFERENCES departments(id);

-- Bảng quan hệ Doctor ↔ Service
CREATE TABLE doctor_services (
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (doctor_id, service_id)
);

-- Update seed: gán specialty cho các service đã có
-- Update seed: gán doctor-service relationships
```

### 1.3 Migration V15 — Supplies & Assets (Vật tư & Tài sản)
```sql
-- Vật tư tiêu hao (kim tiêm, găng tay, bông gạc...)
CREATE TABLE supplies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit TEXT NOT NULL,           -- 'hộp', 'thùng', 'cái', 'gói'
  stock_qty INTEGER NOT NULL DEFAULT 0,
  min_qty INTEGER NOT NULL DEFAULT 0,  -- ngưỡng cảnh báo sắp hết
  unit_cost_cents BIGINT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tài sản / máy móc
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  asset_code TEXT UNIQUE,
  category TEXT NOT NULL,       -- 'EQUIPMENT', 'FURNITURE', 'VEHICLE', ...
  room_id UUID REFERENCES rooms(id),
  purchase_date DATE,
  purchase_price_cents BIGINT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'MAINTENANCE', 'RETIRED'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.4 Migration V16 — Finance Ledger (Quản lý Thu Chi)
```sql
-- Bảng sổ cái thu-chi tổng hợp
CREATE TABLE finance_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date DATE NOT NULL,
  entry_type TEXT NOT NULL,         -- 'INCOME', 'EXPENSE'
  category TEXT NOT NULL,           -- 'MEDICATION_SALE', 'MEDICATION_PURCHASE',
                                    --  'SUPPLY_PURCHASE', 'ASSET_PURCHASE',
                                    --  'CONSULTATION_FEE', 'LAB_FEE', 'OVERRIDE'
  ref_type TEXT,                    -- 'BOOKING', 'SUPPLY', 'ASSET', 'MEDICATION'
  ref_id UUID,                      -- FK polymorphic
  description TEXT NOT NULL,
  qty NUMERIC,                      -- số lượng (nullable với income từ khám)
  unit TEXT,                        -- đơn vị (thùng/hộp/cái...)
  amount_cents BIGINT NOT NULL,     -- số tiền
  actor_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_finance_entry_date ON finance_ledger(entry_date);
CREATE INDEX idx_finance_category ON finance_ledger(category);
CREATE INDEX idx_finance_ref ON finance_ledger(ref_type, ref_id);
```

**Trigger tự động ghi ledger:**
- Khi `bookings.payment_status` → PAID: ghi `INCOME / CONSULTATION_FEE`
- Khi `prescriptions.status` → PAID: ghi `INCOME / MEDICATION_SALE` (per item)
- Khi nhập kho thuốc (`restock`): ghi `EXPENSE / MEDICATION_PURCHASE`
- Khi nhập vật tư: ghi `EXPENSE / SUPPLY_PURCHASE`
- Khi nhập tài sản: ghi `EXPENSE / ASSET_PURCHASE`

---

## PHASE 2 — GOM TRANG + TÁI CẤU TRÚC UI ADMIN

### 2.1 Gộp "Quản lý Bệnh Nhân" + "Hồ Sơ Bệnh Nhân" → "Quản lý Hồ Sơ Khám"

**Xóa route:** `/admin/records` (PatientRecordsPage)  
**Mở rộng route:** `/admin/patients` → đổi tên thành "Quản lý Hồ Sơ Khám"  
**File cần sửa:**
- `apps/web/src/routes/router.tsx` — xóa `/admin/records`, đổi label `/admin/patients`
- `apps/web/src/modules/admin/components/AdminSidebar.tsx` — gộp 2 nav items thành 1
- `apps/web/src/modules/admin/components/AdminHeader.tsx` — cập nhật `routeTitles` map
- `apps/web/src/modules/admin/pages/PatientManagementPage.tsx` — tích hợp tab/panel hồ sơ khám vào đây
- `apps/web/src/modules/admin/pages/index.ts` — xóa export PatientRecordsPage hoặc rename

**UI mới cho trang "Quản lý Hồ Sơ Khám":**
- Panel trái: danh sách bệnh nhân (search SĐT/tên/CCCD), nút tạo hồ sơ mới
- Panel phải tabs:
  - Tab "Thông tin": demographics + BHYT + allergies + reset PW
  - Tab "Lịch sử khám": danh sách visits, mỗi visit expand ra xem đơn thuốc, KQ xét nghiệm, chẩn đoán
  - Tab "Đơn thuốc cũ": list đơn có thể in lại

### 2.2 Chỉnh giao diện Quản lý Khoa (DepartmentManagementPage)
**Vấn đề hiện tại:** UI đơn giản, cần nâng cấp.  
**Yêu cầu mới:**
- Hiển thị số bác sĩ thuộc khoa, số dịch vụ thuộc khoa (badge)
- Khi hover/click khoa → pop-out/sidebar hiện danh sách bác sĩ + dịch vụ thuộc khoa đó
- Confirm modal trước khi xóa phải hiện cảnh báo nếu còn bác sĩ/dịch vụ gán vào

---

## PHASE 3 — TÍNH NĂNG MỚI CORE

### 3.1 Trang Tiếp Nhận Mới — Auto Dispatch (THAY THẾ Walk-in logic cũ)

**Đây là thay đổi lớn nhất.** Luồng mới hoàn toàn:

#### Luồng cũ (xóa bỏ):
Admin chọn ca → chọn bác sĩ → tạo walk-in → hệ thống cấp slot

#### Luồng mới (bắt buộc implement):
Admin chỉ nhập thông tin bệnh nhân + chọn dịch vụ → hệ thống tự dispatch

**Backend — API mới:** `POST /api/v1/admin/reception/create-visit`
```json
// Request
{
  "patientName": "Nguyễn Văn A",
  "patientPhone": "0901234567",
  "patientDob": "1990-01-15",           // optional
  "patientGender": "MALE",               // optional
  "patientNationalId": "123456789",      // optional
  "patientInsuranceCode": "DN4020...",   // optional (BHYT)
  "serviceId": "uuid-of-service"
}

// Response
{
  "bookingId": "...",
  "patientId": "...",
  "patientName": "...",
  "queueNumber": 5,
  "doctorName": "BS. Trần Văn B",
  "roomName": "Phòng khám 2",
  "shiftType": "MORNING",
  "isOverride": false,
  "poolUsed": "COMMON",
  "isNewPatient": true
}
```

**Backend — Dispatch Logic (AutoDispatchService.java):**
```
1. Xác định serviceId
2. Tìm specialty từ services.specialty_id
3. Tìm tất cả doctors trong specialty đó (JOIN doctor_specialties hoặc doctors.specialty)
4. Lọc doctors có shift OPEN hôm nay
5. Với mỗi doctor: đếm open_slots còn lại trong ca hôm nay
6. Sort: doctor ít bệnh nhân nhất (load balancing)
7. Chọn doctor có open_slots > 0
8. Gọi allocateSlot() (logic COMMON → RESERVE → OVERRIDE đã có)
9. Set booking.status = CHECKED_IN (không qua BOOKED vì walk-in đã ở đây rồi)
10. Set booking.priority_score theo Logic B
11. Tạo Patient + User nếu SĐT mới (Logic §10)
12. Ghi finance_ledger nếu cần
13. Return result

Nếu không tìm được doctor/slot:
- Response 409 với message "Hết số khám cho dịch vụ này hôm nay"
- Frontend hỏi Admin: "Bỏ qua" hoặc "Override"
- Nếu Override: gọi lại với flag `forceOverride: true`, ghi audit_log category='OVERRIDE'
```

**Frontend — Form Tiếp Nhận Mới:**

File: `apps/web/src/modules/admin/pages/ReceptionPage.tsx`  
Thêm tab hoặc modal "Tạo phiếu khám" với:
- Section 1 "Thông tin bệnh nhân":
  - Input SĐT (onBlur → auto-lookup: nếu tồn tại thì fill tên/ngày sinh/giới tính)
  - Input Họ tên (required)
  - Input Ngày sinh (date picker, optional)
  - Select Giới tính (MALE/FEMALE/OTHER, optional)
  - Input CCCD (optional)
  - Input Mã BHYT (optional)
- Section 2 "Dịch vụ khám":
  - Select dịch vụ (dropdown từ `adminApi.getServices()`, filter `isActive=true`)
  - Hiển thị: tên dịch vụ, thời lượng, giá tiền
- Nút "Tạo phiếu khám" → gọi API auto-dispatch
- Sau khi thành công: hiển thị thẻ kết quả (STT, bác sĩ, phòng, ca)
- Nếu API trả 409: hiển thị modal xác nhận Override

**API helper mới trong `api.ts`:**
```typescript
createVisit: (data: CreateVisitRequest) => fetchApi<CreateVisitResponse>('/reception/create-visit', { method: 'POST', body: JSON.stringify(data) }),
lookupPatient: (phone: string) => fetchApi<PatientLookupResponse | null>(`/reception/lookup?phone=${phone}`),
```

**Types mới trong `types.ts`:**
```typescript
interface CreateVisitRequest {
  patientName: string;
  patientPhone: string;
  patientDob?: string;
  patientGender?: 'MALE' | 'FEMALE' | 'OTHER';
  patientNationalId?: string;
  patientInsuranceCode?: string;
  serviceId: string;
  forceOverride?: boolean;
}

interface CreateVisitResponse {
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

interface PatientLookupResponse {
  patientId: string;
  fullName: string;
  phone: string;
  dateOfBirth?: string;
  gender?: string;
  nationalId?: string;
  insuranceCode?: string;
}
```

### 3.2 Quản lý Lịch Làm Theo Tuần (ShiftManagementPage)

**Yêu cầu:** Ngoài view ngày hiện tại, thêm chế độ xem và tạo lịch theo tuần.

**Backend API mới:** `POST /api/v1/admin/shifts/bulk`
```json
// Tạo ca cho nhiều ngày cùng lúc
{
  "doctorId": "uuid",
  "weekStartDate": "2026-03-16",   // Monday
  "shiftTypes": ["MORNING", "AFTERNOON"],
  "daysOfWeek": [1, 2, 3, 4, 5]   // 1=Mon..7=Sun
}
// Response: danh sách shifts created + skipped (nếu đã tồn tại)
```

**Frontend — thêm vào ShiftManagementPage.tsx:**
- Toggle: "Ngày" / "Tuần"
- Chế độ Tuần: calendar grid 7 cột × nhiều dòng (1 dòng / bác sĩ)
- Mỗi cell: badge SÁNG / CHIỀU nếu đã có ca, trống nếu chưa
- Bulk Create Modal: chọn bác sĩ, chọn tuần, chọn buổi, chọn ngày trong tuần
- Nút "Tạo lịch tuần" → gọi bulk API

### 3.3 Quản lý Bác Sĩ Nâng Cao (DoctorManagementPage)

**Thêm vào Doctor profile:**
- Ảnh đại diện (avatar_url — đã có trong DB)
- Sơ yếu lý lịch / Giới thiệu (bio text)
- Năm kinh nghiệm
- Bằng cấp / Chứng chỉ (text)
- Link doctor ↔ services (multi-select từ danh sách services)

**Migration cần:** Thêm columns vào `doctors`:
```sql
ALTER TABLE doctors ADD COLUMN bio TEXT;
ALTER TABLE doctors ADD COLUMN experience_years INTEGER DEFAULT 0;
ALTER TABLE doctors ADD COLUMN qualifications TEXT;
```

**Frontend — mở rộng modal Tạo/Sửa bác sĩ:**
- Tabs trong modal: "Tài khoản" (SĐT, mật khẩu, chuyên khoa) và "Hồ sơ" (bio, kinh nghiệm, bằng cấp)
- Section "Dịch vụ phụ trách": multi-select checkbox các services (lọc theo specialty)

### 3.4 Quản lý Dịch Vụ Nâng Cao (ServiceManagementPage)

**Thêm trường mới:**
- `specialty_id` → Select chuyên khoa (dropdown departments)
- `room_count` (số phòng thực hiện dịch vụ này) — optional

**Frontend — ServiceModal cần thêm:**
- Dropdown chọn Khoa (Specialty/Department)
- Input số phòng (optional)

**API update:** `createService` và `updateService` nhận thêm `specialtyId`

### 3.5 Quản lý Phòng Khám (trang mới: RoomManagementPage)

**Route mới:** `/admin/rooms`  
**Sidebar:** Thêm nav item "Phòng khám"

**Backend:** `RoomController.java` tại `/api/v1/admin/rooms`
- GET `/` — danh sách phòng (filter by status, room_type)
- POST `/` — tạo phòng
- PATCH `/{id}` — sửa phòng
- POST `/{id}/toggle` — toggle ACTIVE/INACTIVE

**Frontend:** `RoomManagementPage.tsx`
- Table: mã phòng, tên, khu vực, loại, trạng thái, tài sản trong phòng
- Modal tạo/sửa: code, name, area, room_type (select), status

---

## PHASE 4 — TÀI CHÍNH & BÁO CÁO NÂNG CAO

### 4.1 Quản lý Vật Tư (SupplyManagementPage)

**Route mới:** `/admin/supplies`  
**Backend:** `SupplyController.java` tại `/api/v1/admin/supplies`
- GET `/` — danh sách (filter active, low-stock)
- POST `/` — tạo vật tư
- PATCH `/{id}` — sửa
- POST `/{id}/restock` — nhập kho → ghi finance_ledger EXPENSE
- POST `/{id}/toggle`

**Frontend:** tương tự `MedicationManagementPage` (StockBar, RestockModal)  
**Cảnh báo sắp hết:** badge đỏ khi `stock_qty <= min_qty`

### 4.2 Quản lý Tài Sản / Máy Móc (AssetManagementPage)

**Route mới:** `/admin/assets`  
**Backend:** `AssetController.java` tại `/api/v1/admin/assets`
- GET `/` — danh sách (filter category, status, room)
- POST `/` — tạo tài sản → ghi finance_ledger EXPENSE (purchase_price)
- PATCH `/{id}` — sửa (bao gồm đổi phòng, đổi status)

**Frontend:** `AssetManagementPage.tsx`
- Table: mã, tên, loại, phòng, ngày mua, giá mua, trạng thái
- Filter by category, room, status
- Nút "Bảo trì" → status = MAINTENANCE, nút "Ngừng sử dụng" → RETIRED

### 4.3 Quản lý Thu Chi (ReportsPage — tab mới)

**Thêm tab "Thu Chi"** vào `ReportsPage.tsx` hiện tại.

**Backend API mới:**
- `GET /api/v1/admin/reports/finance?from=&to=&category=&type=` — lấy ledger entries
- `GET /api/v1/admin/reports/finance/summary?from=&to=` — tổng nhập/chi/xuất

**UI tab Thu Chi:**
- Filter: từ ngày – đến ngày, loại (INCOME/EXPENSE), danh mục (dropdown)
- Bảng: Ngày | Loại | Danh mục | Mô tả | Số lượng | Đơn vị | Số tiền | Người thực hiện
- Tổng kết cuối trang: Tổng thu / Tổng chi / Chênh lệch
- Export CSV (optional)

### 4.4 Hóa Đơn Bán Lẻ Thuốc (CashierPage — thêm tab)

**Yêu cầu:** Thu ngân tạo đơn thuốc thủ công cho khách không qua khám (mua lẻ).

**Backend API mới:** `POST /api/v1/admin/cashier/retail-sale`
```json
{
  "customerName": "Nguyễn Văn A",
  "customerPhone": "0901234567",  // optional
  "items": [
    { "medicationId": "uuid", "qty": 2 }
  ]
}
// Logic: validate stock, HELD → PAID ngay (không qua HELD vì không cần đợi bác sĩ)
// Ghi finance_ledger INCOME/MEDICATION_SALE
// Response: hóa đơn đầy đủ
```

**Frontend — tab mới "Bán Lẻ"** trong `CashierPage.tsx`:
- Form: tên khách (optional), SĐT (optional)
- Medication picker: search + select + qty
- Realtime tổng tiền
- Nút "Xuất hóa đơn" → gọi API + hiển thị hóa đơn để in

### 4.5 In Hóa Đơn (CashierPage + retail)

**Implement cho cả 2 luồng: thanh toán sau khám + bán lẻ**

**Cách làm:**
```typescript
// Dùng window.print() với CSS @media print
// Tạo component PrintableInvoice.tsx
// Nội dung: logo phòng khám, thông tin bệnh nhân, danh sách dịch vụ/thuốc, tổng tiền, ngày giờ, chữ ký
```

**File mới:** `apps/web/src/modules/admin/components/PrintableInvoice.tsx`

### 4.6 Báo Cáo Nâng Cao (ReportsPage)

**Thêm vào tab "Thống kê":**
- **Hóa đơn ngày**: list tất cả bookings PAID trong ngày, click xem chi tiết
- **Lượt khám theo bác sĩ**: bar chart hoặc table (bác sĩ | sáng | chiều | tổng)
- **Cảnh báo thuốc sắp hết**: section riêng hiển thị medications có `stock_real - stock_hold <= min_stock` (cần thêm `min_stock` column vào medications hoặc dùng ngưỡng cố định)

**Backend API mới:**
- `GET /api/v1/admin/reports/daily-invoices?date=` — hóa đơn trong ngày
- `GET /api/v1/admin/reports/visits-by-doctor?from=&to=` — lượt khám per bác sĩ
- `GET /api/v1/admin/medications/low-stock` — thuốc sắp hết (tốt nhất dùng ngưỡng `stock_real - stock_hold <= 10` hoặc thêm `min_stock` column)

### 4.7 Cảnh Báo Thuốc Sắp Hết

**Migration:** `ALTER TABLE medications ADD COLUMN min_stock INTEGER DEFAULT 10;`

**Backend:** Endpoint `GET /api/v1/admin/medications/low-stock` trả danh sách thuốc có `(stock_real - stock_hold) <= min_stock`

**Frontend:**
- Badge đỏ/amber số thuốc sắp hết trên AdminSidebar nav item "Thuốc"
- Section "Cảnh báo" trên AdminDashboardPage
- Filter "Sắp hết" trên MedicationManagementPage

---

## PHASE 5 — AUDIT LOG NÂNG CAO

### 5.1 Audit Log Chi Tiết Theo Loại Sự Kiện

**Hiện tại:** `audit_logs` ghi chung chung.  
**Yêu cầu:** Các sự kiện sau phải được ghi bắt buộc với đủ thông tin:

| Sự kiện | `action` | `entity_type` | `meta_json` |
|---------|----------|---------------|-------------|
| Override slot | `OVERRIDE_SLOT` | `BOOKING` | `{doctorName, shiftId, reason}` |
| Sửa kho thuốc | `STOCK_EDIT` | `MEDICATION` | `{medicationName, oldQty, newQty, type: 'RESTOCK'/'ADJUST'}` |
| Hủy lịch khám | `CANCEL_BOOKING` | `BOOKING` | `{patientName, doctorName, reason}` |
| Reset mật khẩu | `RESET_PASSWORD` | `USER` | `{targetPhone, targetRole}` |
| Khóa/mở tài khoản | `LOCK_ACCOUNT` / `UNLOCK_ACCOUNT` | `USER` | `{targetPhone}` |
| Xóa thuốc khỏi đơn | `REMOVE_PRESCRIPTION_ITEM` | `PRESCRIPTION` | `{medicationName, qty}` |

**Frontend — ReportsPage tab "Audit Log":**
- Thêm filter `action` dropdown (OVERRIDE_SLOT, STOCK_EDIT, CANCEL_BOOKING, ...)
- Hiển thị `meta_json` parsed ra columns riêng

---

## TÓM TẮT CÁC FILE CẦN TẠO MỚI

### Backend (Java)
```
apps/backend/src/main/java/com/clinic/backend/modules/admin/
  ├── AutoDispatchService.java          (Phase 3.1)
  ├── RoomController.java               (Phase 3.5)
  ├── RoomService.java                  (Phase 3.5)
  ├── SupplyController.java             (Phase 4.1)
  ├── SupplyService.java                (Phase 4.1)
  ├── AssetController.java              (Phase 4.2)
  ├── AssetService.java                 (Phase 4.2)
  └── dto/
      ├── CreateVisitRequest.java       (Phase 3.1)
      ├── CreateVisitResponse.java      (Phase 3.1)
      ├── PatientLookupResponse.java    (Phase 3.1)
      ├── BulkShiftRequest.java         (Phase 3.2)
      ├── RoomDto.java                  (Phase 3.5)
      ├── SupplyDto.java                (Phase 4.1)
      ├── AssetDto.java                 (Phase 4.2)
      ├── RetailSaleRequest.java        (Phase 4.4)
      └── FinanceLedgerDto.java         (Phase 4.3)

apps/backend/src/main/resources/db/migration/
  ├── V13__rooms.sql                    (Phase 1.1)
  ├── V14__service_specialty_doctor_service.sql  (Phase 1.2)
  ├── V15__supplies_assets.sql          (Phase 1.3)
  └── V16__finance_ledger.sql           (Phase 1.4)
```

### Frontend (TypeScript/React)
```
apps/web/src/modules/admin/pages/
  ├── RoomManagementPage.tsx            (Phase 3.5)
  ├── SupplyManagementPage.tsx          (Phase 4.1)
  └── AssetManagementPage.tsx          (Phase 4.2)

apps/web/src/modules/admin/components/
  └── PrintableInvoice.tsx              (Phase 4.5)
```

### Files cần SỬA

| File | Thay đổi |
|------|---------|
| `ReceptionPage.tsx` | Thêm form "Tạo phiếu khám" mới (Phase 3.1) |
| `PatientManagementPage.tsx` | Tích hợp hồ sơ khám (Phase 2.1) |
| `DoctorManagementPage.tsx` | Thêm bio/CV/services (Phase 3.3) |
| `ShiftManagementPage.tsx` | Thêm weekly view (Phase 3.2) |
| `ServiceManagementPage.tsx` | Thêm specialty field (Phase 3.4) |
| `CashierPage.tsx` | Thêm tab bán lẻ + in hóa đơn (Phase 4.4, 4.5) |
| `MedicationManagementPage.tsx` | Thêm min_stock + cảnh báo (Phase 4.7) |
| `PrescriptionTemplatePage.tsx` | Fix bug sửa/xóa (Phase 0.1) |
| `DepartmentManagementPage.tsx` | Nâng cấp UI (Phase 2.2) |
| `ReportsPage.tsx` | Thêm tabs thu chi, báo cáo nâng cao (Phase 4.3, 4.6) |
| `AdminSidebar.tsx` | Thêm nav Phòng khám, Vật tư, Tài sản; cảnh báo thuốc (Phase 3.5, 4.1, 4.2, 4.7) |
| `router.tsx` | Gộp records vào patients, thêm rooms/supplies/assets (Phase 2.1, 3.5) |
| `types.ts` | Thêm tất cả interfaces mới |
| `api.ts` | Thêm tất cả API methods mới |
| `login.page.tsx` + các form PW | Show/hide password (Phase 0.2) |
| `doctors` entity / migration | Thêm bio, experience_years, qualifications (Phase 3.3) |
| `medications` migration | Thêm min_stock (Phase 4.7) |
| `ReceptionService.java` | Thêm lookupPatient + createVisit (Phase 3.1) |
| `ShiftManagementService.java` | Thêm bulkCreate (Phase 3.2) |
| `CashierService.java` | Thêm retailSale (Phase 4.4) |
| `AdminService.java` | Thêm lowStockMedications, dailyInvoices, visitsByDoctor (Phase 4.6, 4.7) |

---

## THỨ TỰ THỰC HIỆN CHO CODEX

```
Sprint 1: Phase 0 (bug fix) → Phase 2.1 (gộp trang)
Sprint 2: Phase 1 (migrations V13-V16) → Phase 3.5 (rooms)
Sprint 3: Phase 3.1 (auto dispatch) — backend + frontend
Sprint 4: Phase 3.2 (weekly shift) + Phase 3.3 (doctor profile)
Sprint 5: Phase 3.4 (service-specialty) + Phase 4.1 (supplies) + Phase 4.2 (assets)
Sprint 6: Phase 4.3 (thu chi) + Phase 4.4 (bán lẻ) + Phase 4.5 (in hóa đơn)
Sprint 7: Phase 4.6 (báo cáo nâng cao) + Phase 4.7 (cảnh báo thuốc) + Phase 5.1 (audit log)
Sprint 8: Phase 2.2 (UI khoa) + Phase 0.2 (show/hide PW) + polishing
```

---

## QUAN TRỌNG — CONVENTION KHÔNG ĐỔI

- Tất cả số tiền: **cents (integer)** trong DB/API. 1 VND = 1 cent trong hệ thống này (hiển thị `× 10` là bug cần fix cùng lúc).
- Tất cả UUID: `gen_random_uuid()` trong PostgreSQL.
- Migration mới: đặt tên `V{N}__description.sql`, bắt đầu từ `V13`.
- Sau mỗi sprint: cập nhật `thaolam.md` theo template.
- Chạy `npm run check` trước khi commit.
