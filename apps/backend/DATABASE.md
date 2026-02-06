# Database Management Scripts

## Quick Start

### Run Migrations (Safe - No data loss)

```powershell
.\migrate.ps1
```

Chạy Flyway migrations để cập nhật schema mới nhất. An toàn, không xóa dữ liệu.

### Reset Database (⚠️ Deletes all data)

```powershell
.\reset-db.ps1
```

**CẢNH BÁO**: Xóa toàn bộ database và tạo lại từ đầu với sample data.

## Migration Files

Các file migration nằm trong `src/main/resources/db/migration/`:

1. **V1\_\_init.sql** - Schema ban đầu (users, doctors, patients, shifts, bookings, services)
2. **V2\_\_medical_records.sql** - Thêm medical records, prescriptions, medications
3. **V3\_\_seed_data.sql** - Dữ liệu mẫu cho testing

## Sample Data Summary

Sau khi chạy V3\_\_seed_data.sql, database sẽ có:

### Users & Doctors

- 2 Doctors: BS. Lê Văn Minh (Tim mạch), BS. Trần Thị Hương (Nội tổng quát)
- 1 Admin account

**Login credentials** (mock - for testing):

- Doctor 1: `bsle@clinic.com`
- Doctor 2: `bstran@clinic.com`
- Admin: `admin@clinic.com`

### Patients

- 5 bệnh nhân với thông tin đầy đủ (Nguyễn Văn A, Trần Thị B, Lê Chí C, Phạm Đức D, Hoàng Lan E)

### Services

- 4 dịch vụ: Khám nội tổng quát, Khám tim mạch, Tái khám, Xét nghiệm máu

### Shifts (Today)

- 3 ca làm việc hôm nay:
  - Ca sáng (07:00-11:00) - ACTIVE - BS. Lê Văn Minh
  - Ca chiều (13:00-17:00) - SCHEDULED - BS. Lê Văn Minh
  - Ca sáng (08:00-12:00) - ACTIVE - BS. Trần Thị Hương

### Bookings

- 11 lượt khám:
  - 4 đang chờ (WAITING)
  - 1 đang khám (IN_CONSULTATION)
  - 2 hoàn thành hôm nay (COMPLETED)
  - 4 lịch sử cũ (cho medical history)

### Medical Records

- 4 hồ sơ bệnh án (1 hôm nay + 3 lịch sử)

### Medications

- 6 loại thuốc phổ biến: Amoxicillin, Paracetamol, Ibuprofen, Omeprazole, Cetirizine, Vitamin C

### Prescriptions

- 1 đơn thuốc mẫu với 2 loại thuốc

## Flyway Commands

### Check migration status

```powershell
mvn flyway:info
```

### Validate migrations

```powershell
mvn flyway:validate
```

### Clean database (⚠️ Deletes all data)

```powershell
mvn flyway:clean
```

### Repair Flyway schema history

```powershell
mvn flyway:repair
```

## Troubleshooting

### Error: "Migration checksum mismatch"

Nếu bạn đã sửa một migration file đã chạy:

```powershell
mvn flyway:repair
mvn flyway:migrate
```

### Error: "Database not found"

Tạo database thủ công:

```powershell
psql -U postgres -c "CREATE DATABASE healthcare_clinic WITH ENCODING 'UTF8';"
```

### Start fresh

```powershell
.\reset-db.ps1
```

## Development Workflow

1. **Khi bắt đầu dự án hoặc cần reset:**

   ```powershell
   cd apps\backend
   .\reset-db.ps1
   ```

2. **Khi có migration mới:**

   ```powershell
   .\migrate.ps1
   ```

3. **Kiểm tra trạng thái:**

   ```powershell
   mvn flyway:info
   ```

4. **Start backend server:**
   ```powershell
   mvn spring-boot:run
   ```

## Notes

- Backend sẽ tự động chạy Flyway migrations khi start (nếu config `spring.flyway.enabled=true`)
- Scripts này hữu ích khi cần reset toàn bộ database về trạng thái mới nhất
- Dữ liệu mẫu được thiết kế cho testing UI và API flows
- Passwords trong seed data là dummy hashes - không dùng trong production!
