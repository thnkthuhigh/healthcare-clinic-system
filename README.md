# 🏥 Healthcare Clinic System

## ✅ Quick Start Summary

### Prerequisites (cài 1 lần)

| Tool       | Version | Download                                          |
| ---------- | ------- | ------------------------------------------------- |
| **Java**   | 17+     | https://adoptium.net/temurin/releases/?version=17 |
| **Maven**  | 3.8+    | https://maven.apache.org/download.cgi             |
| **Docker** | Desktop | https://www.docker.com/products/docker-desktop/   |
| **Node**   | 20+ LTS | https://nodejs.org/                               |

```powershell
# Kiểm tra nhanh
java -version; mvn -version; docker --version; node -v
```

### Lần đầu clone về

```powershell
git clone https://github.com/thnkthuhigh/healthcare-clinic-system.git
cd healthcare-clinic-system
npm install          # Cài tất cả dependencies (root + apps + packages)
docker compose up -d # Khởi PostgreSQL container
npm run dev          # Chạy Backend (port 4000) + Frontend (port 3000)
```

### Lần sau (đã clone rồi)

```powershell
cd healthcare-clinic-system
git pull                 # Kéo code mới
npm install              # Cài thêm dependencies nếu có thay đổi
docker compose up -d     # Đảm bảo PostgreSQL đang chạy
npm run dev              # Chạy ứng dụng
```

### Tài khoản đăng nhập mặc định

| Vai trò    | Số điện thoại | Mật khẩu    |
| ---------- | ------------- | ----------- |
| **Owner**  | 0900000000    | owner123    |
| **Doctor** | 0901234567    | password123 |
| **Doctor** | 0902345678    | password123 |
| **Admin**  | 0903456789    | password123 |

> Owner được tạo tự động khi backend khởi động lần đầu. Các tài khoản khác là seed data từ migration V3.

### Access

- 🌐 Frontend: http://localhost:3000
- 🔧 Backend API: http://localhost:4000/api/v1/health
- 📚 Swagger UI: http://localhost:4000/swagger-ui
- 🗄 PostgreSQL: `localhost:5432` — db: `clinic_dev`, user: `postgres`, pass: `postgres`

---

Hệ thống quản lý phòng khám đa chức năng với kiến trúc Monorepo, hỗ trợ quản lý đặt lịch khám, hàng đợi thông minh, khám bệnh và kê đơn thuốc.

## 📋 Mục Lục

- [Tổng Quan](#-tổng-quan)
- [Tính Năng](#-tính-năng)
- [Tech Stack](#-tech-stack)
- [Kiến Trúc Hệ Thống](#-kiến-trúc-hệ-thống)
- [Yêu Cầu Hệ Thống](#-yêu-cầu-hệ-thống)
- [Hướng Dẫn Cài Đặt](#-hướng-dẫn-cài-đặt)
- [Chạy Ứng Dụng](#-chạy-ứng-dụng)
- [Database Management](#-database-management)
- [API Documentation](#-api-documentation)
- [Navigation & Routing](#-navigation--routing)
- [Cấu Trúc Thư Mục](#-cấu-trúc-thư-mục)
- [Scripts Có Sẵn](#-scripts-có-sẵn)
- [Development Workflow](#-development-workflow)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Tổng Quan

Healthcare Clinic System là một hệ thống quản lý phòng khám toàn diện được xây dựng theo kiến trúc Monorepo, hỗ trợ nhiều vai trò người dùng khác nhau:

- **Bác sĩ**: Quản lý ca làm việc, hàng đợi bệnh nhân, khám bệnh và kê đơn
- **Lễ tân**: Đặt lịch khám, check-in bệnh nhân
- **Dược sĩ**: Quản lý kho thuốc và phát thuốc
- **Admin**: Quản lý hệ thống, người dùng và cấu hình

---

## ✨ Tính Năng

### 🩺 Module Bác Sĩ (Doctor Module)

#### 1. Dashboard - Tổng Quan Ca Làm Việc

- Thống kê real-time: tổng appointments, waiting room, completed
- Danh sách ca làm việc trong ngày với progress bar
- Status badges cho từng ca (SCHEDULED, ACTIVE, COMPLETED)
- Navigate nhanh đến queue management

#### 2. Patient Queue Management - Hàng Đợi Thông Minh

- Hiển thị danh sách bệnh nhân theo ca làm việc
- **Smart Priority Queue** (Logic B):
  - Tự động ưu tiên: RESULTS_READY (100 điểm)
  - Kênh web (WEB): 50 điểm
  - Walk-in (WALK_IN): 0 điểm
  - Tự động giảm ưu tiên người bị skip nhiều lần
- Filter theo trạng thái: All, Waiting, In Consultation, Completed
- Search theo tên/ID bệnh nhân
- Real-time status badges với animation
- Actions: Start/Continue consultation

#### 3. Consultation Page - Khám Bệnh & Kê Đơn

- **Patient Info Card**: Hiển thị thông tin cơ bản, vitals, allergies
- **Medical History Timeline**:
  - Tab History: Lịch sử khám bệnh
  - Tab Lab Results: Kết quả xét nghiệm
  - Tab Vitals: Chỉ số sinh tồn
- **Examination Form**: Nhập triệu chứng, chẩn đoán, kết luận
- **Prescription Builder**:
  - Add/remove medications động
  - Tự động hold thuốc khi save (Logic C)
  - Validation stock availability
- **Actions**: Cancel, Send to Lab, Save Draft, Save & Complete

### 🎫 Slot Management System

#### Smart Slot Pooling

- **COMMON Pool**: Dành cho đặt lịch web (kênh công khai)
- **RESERVE Pool**: Dành cho lễ tân và trường hợp đặc biệt
- **OVERRIDE Pool**: Dành cho admin khi cần thiết
- Đảm bảo web không "ăn" hết slot, luôn giữ reserve cho walk-in

#### Slot Lifecycle

- Auto-generate slots theo shift configuration
- Lock mechanism chống double-booking
- Transaction-safe booking process

### 💊 Two-Step Drug Inventory (Logic C)

#### Hold → Paid Workflow

1. **HELD**: Khi tạo đơn thuốc
   - Validate: `stock_real - stock_hold >= quantity`
   - Tăng `medications.stock_hold`
   - Giữ thuốc cho bệnh nhân
2. **PAID**: Khi thanh toán
   - Giảm `stock_hold`
   - Giảm `stock_real` (xuất thuốc thực tế)
3. **CANCELED/EXPIRED**: Trả lại hold
   - Giảm `stock_hold`
   - Giữ nguyên `stock_real`

#### Benefits

- Tránh overselling thuốc
- Theo dõi inventory real-time
- Tự động release hold sau timeout

---

## 🛠 Tech Stack

### Frontend

- **Framework**: React 18 với TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: TanStack Query (React Query)
- **Styling**: Tailwind CSS với custom design system
- **UI Components**: Material Icons, custom components
- **HTTP Client**: Axios

### Backend (Primary - Spring Boot)

- **Language**: Java 17
- **Framework**: Spring Boot 3.2
- **ORM**: Spring Data JPA + Hibernate
- **Database Migrations**: Flyway
- **Database**: PostgreSQL 15
- **API Documentation**: Swagger/OpenAPI
- **Validation**: Jakarta Validation
- **Monitoring**: Spring Boot Actuator

### Backend (Legacy - Node.js)

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **ORM**: Prisma
- **Language**: TypeScript

### DevOps & Tools

- **Package Manager**: npm workspaces
- **Containerization**: Docker + Docker Compose
- **Code Quality**: ESLint, Prettier, TypeScript
- **Git Hooks**: Husky v9
- **Concurrency**: concurrently (để chạy nhiều process)

---

## 🏗 Kiến Trúc Hệ Thống

### Monorepo Structure

```
healthcare-clinic-system/
├── apps/
│   ├── web/          # React Frontend (Vite)
│   ├── backend/      # Spring Boot API (Primary)
│   └── api/          # Node.js API (Legacy)
├── packages/
│   └── shared/       # Shared TypeScript types & contracts
└── docker-compose.yml
```

### Backend Architecture (Spring Boot)

```
backend/
├── src/main/java/com/clinic/backend/
│   ├── common/           # Common utilities, exceptions
│   ├── config/           # Spring configuration (CORS, Swagger)
│   ├── modules/
│   │   ├── health/       # Health check endpoints
│   │   ├── doctor/       # Doctor module (shifts, queue)
│   │   └── consultation/ # Consultation & prescription
│   └── entity/           # JPA Entities
│       ├── User, Doctor, Patient
│       ├── Shift, Slot, Booking
│       ├── Service, Medication
│       └── MedicalRecord, Prescription
└── src/main/resources/
    ├── application.yml
    └── db/migration/     # Flyway migrations
        ├── V1__init.sql
        ├── V2__medical_records.sql
        └── V3__seed_data.sql
```

### Frontend Architecture

```
web/src/
├── modules/
│   ├── auth/         # Authentication (Login)
│   ├── doctor/       # Doctor module
│   │   ├── api.ts           # API service layer
│   │   ├── types.ts         # TypeScript interfaces
│   │   ├── components/      # DoctorLayout, Sidebar, Header
│   │   └── pages/           # Dashboard, Queue, Consultation
│   └── home/         # Home page
├── routes/           # Router configuration
├── lib/              # React Query setup
└── styles/           # Global styles
```

### API Conventions

- **Base Path**: `/api/v1`
- **Health Check**: `/api/v1/health`
- **Actuator**: `/actuator/health`, `/actuator/info`
- **Swagger UI**: `/swagger-ui`
- **Error Response**:
  ```json
  {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "timestamp": "2026-03-04T10:30:00Z"
  }
  ```

---

## 💻 Yêu Cầu Hệ Thống

### Bắt Buộc

- **Node.js**: >= 20.x (LTS recommended)
- **Java**: JDK 17 (Temurin/Adoptium recommended)
- **Maven**: >= 3.8.x
- **Docker**: Desktop for Windows (để chạy PostgreSQL)
- **Git**: Latest version

### Optional

- **IDE Recommended**:
  - Frontend: VS Code với extensions (ESLint, Prettier, Tailwind CSS IntelliSense)
  - Backend: IntelliJ IDEA hoặc VS Code với Extension Pack for Java

---

## 🚀 Hướng Dẫn Cài Đặt

### Bước 1: Kiểm Tra Prerequisites

#### 1.1. Kiểm tra Java

```powershell
java -version
```

**Kết quả mong đợi**: Java version 17.x.x

**Nếu chưa có hoặc version < 17:**

1. Tải Java 17 từ: https://adoptium.net/temurin/releases/?version=17
2. Chọn Windows x64 MSI installer
3. Cài đặt và **chọn "Add to PATH"** trong quá trình cài
4. Khởi động lại PowerShell và kiểm tra lại

#### 1.2. Kiểm tra Maven

```powershell
mvn -version
```

**Kết quả mong đợi**: Apache Maven 3.8.x hoặc cao hơn

**Nếu lỗi "mvn is not recognized":**

1. **Tải Maven**:
   - Link: https://maven.apache.org/download.cgi
   - Chọn file `apache-maven-3.9.x-bin.zip`
   - Giải nén vào: `C:\Program Files\Apache\maven`

2. **Cấu hình Environment Variables**:
   - Nhấn `Win + X` → chọn "System"
   - Chọn "Advanced system settings" → "Environment Variables"

   **Tạo MAVEN_HOME**:
   - Trong "System variables", nhấn "New"
   - Variable name: `MAVEN_HOME`
   - Variable value: `C:\Program Files\Apache\maven`

   **Thêm vào PATH**:
   - Tìm biến `Path` trong "System variables"
   - Nhấn "Edit" → "New"
   - Thêm: `%MAVEN_HOME%\bin`
   - Nhấn "OK" để lưu

3. **Verify**:
   - **Đóng tất cả cửa sổ PowerShell**
   - Mở PowerShell mới
   - Chạy: `mvn -version`

#### 1.3. Kiểm tra Docker

```powershell
docker --version
```

**Kết quả mong đợi**: Docker version 20.x.x hoặc cao hơn

**Nếu chưa có Docker:**

1. Tải Docker Desktop: https://www.docker.com/products/docker-desktop/
2. Cài đặt và khởi động Docker Desktop
3. Đảm bảo Docker đang chạy (icon Docker ở system tray phải màu xanh)

#### 1.4. Kiểm tra Node.js

```powershell
node -v
npm -v
```

**Kết quả mong đợi**: Node v20.x.x hoặc cao hơn

**Nếu chưa có hoặc version cũ:**

- Tải từ: https://nodejs.org/ (chọn LTS version)

---

### Bước 2: Clone Repository

```powershell
git clone https://github.com/thnkthuhigh/healthcare-clinic-system.git
cd healthcare-clinic-system
```

---

### Bước 3: Cài Đặt Dependencies

```powershell
npm install
```

Lệnh này sẽ:

- Cài đặt dependencies cho root workspace
- Cài đặt dependencies cho tất cả apps (web, backend, api)
- Cài đặt dependencies cho packages (shared)
- Setup Husky git hooks

**Thời gian**: ~2-5 phút tùy connection

---

### Bước 4: Cấu Hình Environment Variables

> **Không cần config gì** nếu dùng Docker Compose mặc định. Tất cả default values trong `application.yml` đã khớp với `docker-compose.yml`.

Chỉ cần set biến môi trường nếu muốn **override** giá trị mặc định:

| Biến             | Default              | Mô tả                |
| ---------------- | -------------------- | -------------------- |
| `DB_HOST`        | `localhost`          | PostgreSQL host      |
| `DB_PORT`        | `5432`               | PostgreSQL port      |
| `DB_NAME`        | `clinic_dev`         | Database name        |
| `DB_USER`        | `postgres`           | Database user        |
| `DB_PASSWORD`    | `postgres`           | Database password    |
| `SERVER_PORT`    | `4000`               | Backend port         |
| `JWT_SECRET`     | _(built-in default)_ | JWT signing key      |
| `OWNER_PHONE`    | `0900000000`         | Owner login phone    |
| `OWNER_PASSWORD` | `owner123`           | Owner login password |

```powershell
# Tạo file apps/api/.env
cd apps/api
cp .env.example .env
# Edit .env theo nhu cầu
```

---

### Bước 5: Khởi Động Database

```powershell
npm run db:up
```

Lệnh này sẽ:

- Start PostgreSQL container qua Docker Compose
- Expose port 5432
- Tạo database: `clinic_dev`
- User: `postgres`, Password: `postgres`

**Verify database đang chạy:**

```powershell
docker ps
```

Phải thấy container tên `healthcare-clinic-system-postgres-1` với status `Up`

**Xem logs database:**

```powershell
npm run db:logs
```

---

## 🚀 Chạy Ứng Dụng

### Option 1: Chạy Cả Backend & Frontend (Recommended)

```powershell
npm run dev
```

Lệnh này sẽ start:

- ✅ Spring Boot backend (port 4000)
- ✅ React frontend (port 3000)

**Flyway migrations** sẽ tự động chạy khi backend start lần đầu.

**Access points:**

- 🌐 **Frontend**: http://localhost:3000
- 🔧 **Backend API**: http://localhost:4000/api/v1/health
- 📊 **Actuator**: http://localhost:4000/actuator/health
- 📚 **Swagger UI**: http://localhost:4000/swagger-ui

---

### Option 2: Chạy Từng Module (Để Debug)

#### Chạy Backend Only

```powershell
npm run dev:backend
```

Hoặc chạy trực tiếp trong backend folder:

```powershell
cd apps/backend
mvn spring-boot:run
```

#### Chạy Frontend Only

```powershell
npm run dev:web
```

Hoặc chạy trực tiếp trong web folder:

```powershell
cd apps/web
npm run dev
```

#### Chạy Legacy API (Optional)

```powershell
npm run dev:api
```

**⚠️ Lưu ý Port Conflict:**

`apps/api` và `apps/backend` mặc định đều dùng port `4000`. Nếu cần chạy song song:

- Node API: set `PORT=4001` trong `apps/api/.env`
- Spring Boot: set env `SERVER_PORT=4001`

---

## 🗄 Database Management

### Database Schema

Database `clinic_dev` gồm các bảng chính:

#### Identity Tables

- `users`: Tài khoản người dùng
- `doctors`: Thông tin bác sĩ
- `patients`: Thông tin bệnh nhân

#### Catalog Tables

- `specialties`: Chuyên khoa
- `doctor_specialties`: Mapping bác sĩ - chuyên khoa
- `services`: Dịch vụ khám
- `medications`: Danh mục thuốc (với stock management)

#### Scheduling & Booking

- `shifts`: Ca làm việc của bác sĩ
- `slots`: Slot khám bệnh (với pool: COMMON/RESERVE/OVERRIDE)
- `bookings`: Đặt lịch khám (với priority scoring)

#### Clinical Records

- `medical_records`: Hồ sơ bệnh án
- `prescriptions`: Đơn thuốc (với status: HELD/PAID/CANCELED)
- `prescription_items`: Chi tiết đơn thuốc

#### Audit

- `audit_logs`: Nhật ký hệ thống

### Flyway Migrations

**Migrations tự động chạy** khi start Spring Boot app lần đầu.

#### Available migrations:

- **V1\_\_init.sql**: Schema ban đầu
- **V2\_\_medical_records.sql**: Medical records, prescriptions, medications
- **V3\_\_seed_data.sql**: Sample data cho testing
- **V4\_\_add_prescription_items_columns.sql**: Mở rộng prescription_items

#### Migration Commands

**Check migration status:**

```powershell
cd apps/backend
mvn flyway:info
```

**Validate migrations:**

```powershell
mvn flyway:validate
```

**⚠️ Reset database (XÓA TẤT CẢ DỮ LIỆU):**

```powershell
cd apps/backend
.\reset-db.ps1
```

Script này sẽ:

1. Drop database `clinic_dev`
2. Tạo lại database mới
3. Chạy tất cả migrations
4. Load sample data

**Run migrations manually:**

```powershell
cd apps/backend
.\migrate.ps1
```

An toàn, không xóa dữ liệu.

### Sample Data

Sau khi chạy V3\_\_seed_data.sql, database có:

#### 👨‍⚕️ Doctors (2)

- BS. Lê Văn Minh (Chuyên khoa Tim mạch)
- BS. Trần Thị Hương (Nội tổng quát)

#### 🧑‍🤝‍🧑 Patients (5)

- Nguyễn Văn A, Trần Thị B, Lê Chí C, Phạm Đức D, Hoàng Lan E

#### 🏥 Services (4)

- Khám nội tổng quát (200,000đ)
- Khám tim mạch (300,000đ)
- Tái khám (150,000đ)
- Xét nghiệm máu (100,000đ)

#### 📅 Shifts (Today)

- 3 ca làm việc được tạo cho hôm nay (MORNING/AFTERNOON)

#### 📋 Bookings (11)

- 4 đang chờ (WAITING)
- 1 đang khám (IN_CONSULTATION)
- 2 hoàn thành (COMPLETED)
- 4 lịch sử cũ

#### 💊 Medications (6)

- Amoxicillin, Paracetamol, Ibuprofen, Omeprazole, Cetirizine, Vitamin C

**Login credentials (mock - for testing):**

- Doctor 1: `bsle@clinic.com`
- Doctor 2: `bstran@clinic.com`
- Admin: `admin@clinic.com`

---

## 📡 API Documentation

### Health Check Endpoints

```
GET /api/v1/health
Response: { status: "ok", timestamp: "..." }
```

```
GET /actuator/health
Response: { status: "UP" }
```

### Doctor Endpoints

**Get active shifts for doctor:**

```
GET /api/v1/doctor/shifts/active
Response: [
  {
    id: 1,
    doctorId: 1,
    shiftDate: "2026-03-04",
    period: "MORNING",
    status: "ACTIVE",
    totalSlots: 15,
    bookedSlots: 8
  }
]
```

**Get queue for shift:**

```
GET /api/v1/doctor/shifts/{shiftId}/queue
Response: [
  {
    id: 1,
    patientName: "Nguyễn Văn A",
    patientAge: 35,
    appointmentTime: "08:00",
    status: "WAITING",
    priority: 50,
    skipCount: 0
  }
]
```

### Consultation Endpoints

**Get booking details:**

```
GET /api/v1/consultation/bookings/{bookingId}
Response: {
  bookingId: 1,
  patient: { ... },
  service: { ... },
  medicalHistory: [ ... ]
}
```

**Save examination:**

```
POST /api/v1/consultation/bookings/{bookingId}/examinations
Body: {
  symptoms: "...",
  diagnosis: "...",
  conclusion: "...",
  prescription: {
    items: [
      { medicationId: 1, quantity: 10, dosage: "1 viên x 2 lần/ngày" }
    ]
  }
}
Response: { recordId: 1, prescriptionId: 2 }
```

**Swagger UI (Full documentation):**

Truy cập http://localhost:4000/swagger-ui sau khi start backend để xem full API docs và test endpoints interactively.

---

## 🧭 Navigation & Routing

### Available Routes

#### Public Routes

- `/` - Homepage với role selection cards
- `/login` - Login page với role-based authentication

#### Doctor Routes (Protected)

- `/doctor` - Auto-redirect to dashboard
- `/doctor/dashboard` - Dashboard: Shift overview & statistics
- `/doctor/queue/:shiftId?` - Patient queue management với smart priority
- `/doctor/consultation/:bookingId` - Consultation & prescription page
- `/doctor/schedule` - Schedule management (Coming soon)
- `/doctor/patients` - Patient records browser (Coming soon)
- `/doctor/settings` - Account settings (Coming soon)

#### Future Routes (Planned)

- `/receptionist/*` - Receptionist portal
- `/pharmacist/*` - Pharmacist portal
- `/admin/*` - Admin portal

### Navigation Flow

**Typical Doctor Workflow:**

```
Login (/login)
  → Select "Doctor" role
  → Doctor Dashboard (/doctor/dashboard)
      → Click shift card
      → Patient Queue (/doctor/queue/123)
          → Click "Start Consultation"
          → Consultation Page (/doctor/consultation/456)
              → Save & Complete
              → Back to Queue
```

### Using Navigation Hooks

**Doctor Navigation Hook:**

```tsx
import { useDoctorNavigation } from './hooks/useNavigation';

function MyComponent() {
  const { goToDashboard, goToQueue, goToConsultation } = useDoctorNavigation();

  return (
    <div>
      <button onClick={goToDashboard}>Dashboard</button>
      <button onClick={() => goToQueue(123)}>View Queue #123</button>
      <button onClick={() => goToConsultation(456)}>Consultation #456</button>
    </div>
  );
}
```

**App Navigation Hook:**

```tsx
import { useAppNavigation } from './hooks/useNavigation';

function MyComponent() {
  const { goToHome, goToLogin, goToDoctorPortal } = useAppNavigation();

  return (
    <div>
      <button onClick={goToHome}>Home</button>
      <button onClick={goToLogin}>Login</button>
      <button onClick={goToDoctorPortal}>Doctor Portal</button>
    </div>
  );
}
```

### Navigation Components

**NavLinkButton with Icon:**

```tsx
import { NavLinkButton } from './components/Navigation';

<NavLinkButton to="/doctor/queue" icon="list_alt" label="View Queue" variant="primary" size="md" />;
```

**Back Button:**

```tsx
import { BackButton } from './components/Navigation';

<BackButton label="Back to Queue" />;
```

### Direct Access URLs (Development)

| URL                                    | Description       |
| -------------------------------------- | ----------------- |
| http://localhost:3000/                 | Homepage          |
| http://localhost:3000/login            | Login page        |
| http://localhost:3000/doctor/dashboard | Doctor dashboard  |
| http://localhost:3000/doctor/queue     | Patient queue     |
| http://localhost:4000/swagger-ui       | API documentation |

**📖 Xem thêm**: [apps/web/ROUTES.md](apps/web/ROUTES.md) và [apps/web/NAVIGATION_GUIDE.md](apps/web/NAVIGATION_GUIDE.md)

---

## 📂 Cấu Trúc Thư Mục Chi Tiết

```
healthcare-clinic-system/
│
├── apps/
│   ├── web/                          # React Frontend
│   │   ├── src/
│   │   │   ├── main.tsx              # Entry point
│   │   │   ├── app.tsx               # Root component
│   │   │   ├── components/           # Shared components
│   │   │   │   └── Navigation.tsx    # Navigation components (NavLinkButton, BackButton)
│   │   │   ├── hooks/                # Custom hooks
│   │   │   │   └── useNavigation.ts  # Navigation hooks (useDoctorNavigation, useAppNavigation)
│   │   │   ├── modules/              # Feature modules
│   │   │   │   ├── auth/             # Authentication module
│   │   │   │   │   └── login.page.tsx
│   │   │   │   ├── common/           # Common/shared module
│   │   │   │   │   └── NotFound.page.tsx  # 404 page
│   │   │   │   ├── doctor/           # Doctor module
│   │   │   │   │   ├── api.ts        # API service
│   │   │   │   │   ├── types.ts      # TypeScript types
│   │   │   │   │   ├── components/   # Module components
│   │   │   │   │   │   ├── DoctorLayout.tsx
│   │   │   │   │   │   ├── DoctorSidebar.tsx  # Sidebar with navigation
│   │   │   │   │   │   └── DoctorHeader.tsx   # Header with breadcrumbs & back button
│   │   │   │   │   └── pages/        # Page components
│   │   │   │   │       ├── index.ts  # Page exports
│   │   │   │   │       ├── DoctorDashboardPage.tsx
│   │   │   │   │       ├── PatientQueuePage.tsx
│   │   │   │   │       ├── ConsultationPage.tsx
│   │   │   │   │       ├── DoctorSchedulePage.tsx   # Coming soon
│   │   │   │   │       ├── DoctorPatientsPage.tsx   # Coming soon
│   │   │   │   │       └── DoctorSettingsPage.tsx   # Coming soon
│   │   │   │   └── home/             # Home module
│   │   │   │       └── home.page.tsx
│   │   │   ├── routes/               # Routing configuration
│   │   │   │   └── router.tsx        # React Router setup
│   │   │   ├── lib/                  # Libraries setup
│   │   │   │   └── queryClient.ts    # React Query config
│   │   │   └── styles/               # Global styles
│   │   │       └── index.css
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   ├── package.json
│   │   ├── ROUTES.md                 # Route documentation
│   │   └── NAVIGATION_GUIDE.md       # Navigation hooks/components guide
│   │
│   ├── backend/                      # Spring Boot Backend
│   │   ├── src/
│   │   │   ├── main/
│   │   │   │   ├── java/com/clinic/backend/
│   │   │   │   │   ├── BackendApplication.java
│   │   │   │   │   ├── common/       # Common utilities
│   │   │   │   │   │   ├── exception/
│   │   │   │   │   │   └── response/
│   │   │   │   │   ├── config/       # Configuration
│   │   │   │   │   │   ├── CorsConfig.java
│   │   │   │   │   │   └── SwaggerConfig.java
│   │   │   │   │   ├── entity/       # JPA Entities
│   │   │   │   │   │   ├── User.java
│   │   │   │   │   │   ├── Doctor.java
│   │   │   │   │   │   ├── Patient.java
│   │   │   │   │   │   ├── Shift.java
│   │   │   │   │   │   ├── Slot.java
│   │   │   │   │   │   ├── Booking.java
│   │   │   │   │   │   ├── Service.java
│   │   │   │   │   │   ├── Medication.java
│   │   │   │   │   │   ├── MedicalRecord.java
│   │   │   │   │   │   ├── Prescription.java
│   │   │   │   │   │   └── PrescriptionItem.java
│   │   │   │   │   ├── repository/   # JPA Repositories
│   │   │   │   │   │   ├── UserRepository.java
│   │   │   │   │   │   ├── DoctorRepository.java
│   │   │   │   │   │   ├── PatientRepository.java
│   │   │   │   │   │   ├── ShiftRepository.java
│   │   │   │   │   │   ├── BookingRepository.java
│   │   │   │   │   │   ├── MedicationRepository.java
│   │   │   │   │   │   ├── MedicalRecordRepository.java
│   │   │   │   │   │   └── PrescriptionRepository.java
│   │   │   │   │   └── modules/      # Feature modules
│   │   │   │   │       ├── health/
│   │   │   │   │       │   ├── HealthController.java
│   │   │   │   │       │   └── dto/
│   │   │   │   │       ├── doctor/
│   │   │   │   │       │   ├── DoctorController.java
│   │   │   │   │       │   ├── DoctorService.java
│   │   │   │   │       │   └── dto/
│   │   │   │   │       └── consultation/
│   │   │   │   │           ├── ConsultationController.java
│   │   │   │   │           ├── ConsultationService.java
│   │   │   │   │           └── dto/
│   │   │   │   └── resources/
│   │   │   │       ├── application.yml      # Main config
│   │   │   │       └── db/migration/        # Flyway migrations
│   │   │   │           ├── V1__init.sql
│   │   │   │           ├── V2__medical_records.sql
│   │   │   │           ├── V3__seed_data.sql
│   │   │   │           └── V4__add_prescription_items_columns.sql
│   │   │   └── test/                        # Tests
│   │   ├── pom.xml
│   │   ├── DATABASE.md                      # Database docs
│   │   └── package.json
│   │
│   └── api/                          # Legacy Node.js API
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.ts
│       │   ├── config/
│       │   ├── db/
│       │   └── modules/
│       ├── prisma/
│       │   └── schema.prisma
│       └── package.json
│
├── packages/
│   └── shared/                       # Shared TypeScript Package
│       ├── src/
│       │   ├── index.ts
│       │   └── contracts/            # API contracts
│       │       ├── auth.ts
│       │       ├── booking.ts
│       │       ├── common.ts
│       │       ├── inventory.ts
│       │       └── shift.ts
│       └── package.json
│
├── .husky/                           # Git hooks
├── docker-compose.yml                # PostgreSQL setup
├── package.json                      # Root package.json
├── tsconfig.base.json               # Base TypeScript config
├── README.md                        # This file
├── ARCHITECTURE.md                  # Architecture overview
├── SETUP_CHECKLIST.md              # Setup troubleshooting
├── DOCTOR_MODULE_GUIDE.md          # Doctor module docs
└── CONTRIBUTING.md                  # Contribution guide
```

---

## 📜 Scripts Có Sẵn

### Development

| Script                | Description                                    |
| --------------------- | ---------------------------------------------- |
| `npm run dev`         | Chạy backend (Spring Boot) + frontend cùng lúc |
| `npm run dev:web`     | Chỉ chạy frontend (port 3000)                  |
| `npm run dev:backend` | Chỉ chạy backend (port 4000)                   |
| `npm run dev:api`     | Chạy legacy Node API (port 4000)               |

### Database

| Script            | Description                   |
| ----------------- | ----------------------------- |
| `npm run db:up`   | Start PostgreSQL container    |
| `npm run db:down` | Stop PostgreSQL container     |
| `npm run db:logs` | Xem logs PostgreSQL real-time |

### Code Quality

| Script                 | Description                            |
| ---------------------- | -------------------------------------- |
| `npm run check`        | Chạy lint + typecheck + prettier check |
| `npm run check:all`    | Chạy check + build tất cả workspaces   |
| `npm run lint`         | Chạy ESLint                            |
| `npm run lint:fix`     | Chạy ESLint với auto-fix               |
| `npm run typecheck`    | TypeScript type checking               |
| `npm run format`       | Format code với Prettier               |
| `npm run format:check` | Check Prettier formatting              |

### Build

| Script          | Description                   |
| --------------- | ----------------------------- |
| `npm run build` | Build tất cả apps và packages |

### Git Hooks

| Script            | Description           |
| ----------------- | --------------------- |
| `npm run prepare` | Setup Husky git hooks |

**Pre-commit hook** sẽ tự động chạy `npm run check` trước mỗi commit.

---

## 👨‍💻 Development Workflow

### 1. Tạo Feature Mới

```powershell
# 1. Tạo branch mới
git checkout -b feature/ten-tinh-nang

# 2. Start development servers
npm run dev

# 3. Code your feature
# ... make changes ...

# 4. Check code quality
npm run check

# 5. Commit (Husky hook sẽ tự động chạy check)
git add .
git commit -m "feat: mô tả feature"

# 6. Push
git push origin feature/ten-tinh-nang
```

### 2. Thêm Database Migration

```powershell
# 1. Tạo file migration mới
# apps/backend/src/main/resources/db/migration/V5__ten_migration.sql

# 2. Viết SQL DDL
# CREATE TABLE, ALTER TABLE, etc.

# 3. Stop backend nếu đang chạy
# Ctrl+C

# 4. Start lại để chạy migration
npm run dev:backend

# 5. Verify migration
cd apps/backend
mvn flyway:info
```

### 3. Thêm Entity mới (JPA)

```java
// apps/backend/src/main/java/com/clinic/backend/entity/TenEntity.java

@Entity
@Table(name = "ten_bang")
public class TenEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ... fields, getters, setters
}
```

### 4. Thêm Repository

```java
// apps/backend/src/main/java/com/clinic/backend/repository/TenEntityRepository.java

import org.springframework.data.jpa.repository.JpaRepository;

public interface TenEntityRepository extends JpaRepository<TenEntity, Long> {
    // Custom queries nếu cần
}
```

### 5. Thêm Service & Controller

- Tạo service class trong `modules/[module-name]/`
- Tạo controller với `@RestController` và `@RequestMapping`
- Inject dependencies qua constructor
- Follow error handling conventions

### 6. Testing Frontend Changes

```powershell
# Start dev server với hot reload
npm run dev:web

# Mở browser: http://localhost:3000
# Thay đổi code sẽ auto-refresh
```

---

## 🧪 Testing

### Backend Testing

```powershell
cd apps/backend
mvn test
```

### Frontend Testing

```powershell
cd apps/web
npm run test
```

_(Note: Test setup cần được cấu hình thêm)_

### Integration Testing

**Recommended**: Sử dụng Swagger UI để test endpoints:

- http://localhost:4000/swagger-ui
- Try out các endpoints trực tiếp
- Xem request/response examples

---

## 🐛 Troubleshooting

### ❌ Lỗi: "mvn is not recognized"

**Nguyên nhân**: Maven chưa được cài hoặc chưa có trong PATH.

**Giải pháp**: Xem [Bước 1.2: Kiểm tra Maven](#12-kiểm-tra-maven)

**Kiểm tra PATH:**

```powershell
$env:Path -split ';' | Select-String maven
```

Phải thấy đường dẫn đến `Maven\bin`

**Nếu vẫn không được**: Khởi động lại máy tính để Windows nhận biến môi trường mới.

---

### ❌ Lỗi: "Docker daemon is not running"

**Nguyên nhân**: Docker Desktop chưa được khởi động.

**Giải pháp**:

1. Mở Docker Desktop application
2. Đợi icon Docker ở system tray chuyển sang màu xanh
3. Chạy lại `npm run db:up`

---

### ❌ Lỗi: "Port 4000 is already in use"

**Nguyên nhân**: Có process khác đang dùng port 4000.

**Giải pháp Option 1 - Kill process:**

```powershell
# Tìm process đang dùng port 4000
netstat -ano | findstr :4000

# Kill process (thay <PID> bằng số PID tìm được)
taskkill /PID <PID> /F
```

**Giải pháp Option 2 - Đổi port:**

```powershell
# Set environment variable
$env:SERVER_PORT="4001"

# Hoặc edit application.yml
# server.port: 4001
```

---

### ❌ Lỗi: "Connection to database failed"

**Kiểm tra:**

1. **Docker container có đang chạy?**

   ```powershell
   docker ps
   ```

   Phải thấy container PostgreSQL với status `Up`

2. **Xem logs database:**

   ```powershell
   npm run db:logs
   ```

3. **Verify connection config trong application.yml:**

   ```yaml
   spring:
     datasource:
       url: jdbc:postgresql://localhost:5432/clinic_dev
       username: postgres
       password: postgres
   ```

4. **Test connection thủ công:**
   ```powershell
   docker exec -it healthcare-clinic-system-postgres-1 psql -U postgres -d clinic_dev
   ```

---

### ❌ Lỗi: "Flyway migration failed"

**Nguyên nhân**: Migration file có lỗi SQL hoặc checksum không khớp.

**Giải pháp Option 1 - Reset database:**

```powershell
cd apps/backend
.\reset-db.ps1
```

**Giải pháp Option 2 - Repair Flyway:**

```powershell
cd apps/backend
mvn flyway:repair
```

---

### ❌ Frontend không hiển thị data

**Kiểm tra:**

1. **Backend có đang chạy?**
   - Truy cập: http://localhost:4000/api/v1/health
   - Phải trả về `{ status: "ok" }`

2. **CORS có được config đúng?**
   - Check `application.yml`:
     ```yaml
     cors:
       allowed-origins: http://localhost:3000
     ```

3. **Xem console logs:**
   - Mở DevTools (F12) ở browser
   - Check tab Console và Network
   - Xem có lỗi API calls không

4. **Sample data có trong database?**
   ```powershell
   cd apps/backend
   .\migrate.ps1  # Đảm bảo V3__seed_data.sql đã chạy
   ```

---

### ❌ Lỗi TypeScript hoặc ESLint

**Clear cache và reinstall:**

```powershell
# Clean node_modules
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force apps/*/node_modules
Remove-Item -Recurse -Force packages/*/node_modules

# Reinstall
npm install

# Run typecheck
npm run typecheck
```

---

### ⚠️ Maven build quá chậm hoặc download dependencies fails

**Giải pháp 1 - Sử dụng Maven mirror (VN):**

Tạo hoặc edit file `~/.m2/settings.xml`:

```xml
<settings>
  <mirrors>
    <mirror>
      <id>maven-default-http-blocker</id>
      <mirrorOf>external:dummy:*</mirrorOf>
      <url>https://repo.maven.apache.org/maven2</url>
    </mirror>
  </mirrors>
</settings>
```

**Giải pháp 2 - Clear Maven cache:**

```powershell
Remove-Item -Recurse -Force ~/.m2/repository
mvn clean install -f apps/backend/pom.xml
```

---

## 🔧 Advanced Configuration

### Đổi Database Port

Edit `docker-compose.yml`:

```yaml
services:
  postgres:
    ports:
      - '5433:5432' # Đổi từ 5432 sang 5433
```

Sau đó update `DB_URL`:

```
jdbc:postgresql://localhost:5433/clinic_dev
```

### Thêm CORS Origins

```powershell
$env:CORS_ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001"
npm run dev:backend
```

### Enable Debug Logging

Edit `apps/backend/src/main/resources/application.yml`:

```yaml
logging:
  level:
    com.clinic.backend: DEBUG
    org.springframework: INFO
```

---

## 📚 Tài Liệu Bổ Sung

- **[ARCHITECTURE.md](ARCHITECTURE.md)**: Kiến trúc hệ thống chi tiết
- **[DOCTOR_MODULE_GUIDE.md](DOCTOR_MODULE_GUIDE.md)**: Hướng dẫn Doctor Module
- **[SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)**: Checklist troubleshooting setup
- **[apps/backend/DATABASE.md](apps/backend/DATABASE.md)**: Database management guide
- **[CONTRIBUTING.md](CONTRIBUTING.md)**: Hướng dẫn contribute
- **[UI_FIX_GUIDE.md](UI_FIX_GUIDE.md)**: Hướng dẫn fix UI issues

---

## 👥 Contributing

Xem [CONTRIBUTING.md](CONTRIBUTING.md) để biết:

- Code style guidelines
- Git workflow
- Pull request process
- Code review checklist

### Quick Contribution Guide

1. Fork repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes và ensure tests pass
4. Chạy `npm run check` để verify code quality
5. Commit changes: `git commit -m 'feat: add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Tạo Pull Request

---

## 🎓 Learning Resources

### Spring Boot

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Spring Data JPA Guide](https://spring.io/guides/gs/accessing-data-jpa/)
- [Flyway Documentation](https://flywaydb.org/documentation/)

### React & Frontend

- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Database

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## 📞 Support & Contact

Nếu gặp vấn đề không có trong Troubleshooting section, hãy cung cấp:

1. **Environment info**:

   ```powershell
   java -version
   mvn -version
   node -v
   docker --version
   ```

2. **Container status**:

   ```powershell
   docker ps -a
   ```

3. **Error logs**:
   - Backend logs từ terminal
   - Frontend console logs (DevTools)
   - Database logs: `npm run db:logs`

4. **Screenshot** lỗi cụ thể

---

## 📝 License

Private project - All rights reserved

---

## 🎯 Roadmap & Future Work

### Upcoming Features

- [ ] Authentication & Authorization (JWT + RBAC)
- [ ] Admin Module (User management, System config)
- [ ] Receptionist Module (Appointment booking, Check-in)
- [ ] Pharmacist Module (Inventory, Dispensing)
- [ ] Billing Module (Payment processing)
- [ ] Lab Module (Lab tests management)
- [ ] Reports & Analytics
- [ ] Real-time notifications (WebSocket)
- [ ] Multi-clinic support

### Technical Improvements

- [ ] Comprehensive test coverage (Unit + Integration)
- [ ] API rate limiting
- [ ] Caching strategy (Redis)
- [ ] File upload (Medical documents, Images)
- [ ] Audit logging
- [ ] Performance optimization
- [ ] CI/CD pipeline
- [ ] Production deployment guide
- [ ] Monitoring & Alerting

---

## 🙏 Acknowledgments

Được xây dựng bởi team development với mục tiêu tối ưu quy trình quản lý phòng khám.

**Tech Stack Credits**: React, Spring Boot, PostgreSQL, Tailwind CSS, và các open-source libraries khác.

---

**Happy Coding! 🚀**
