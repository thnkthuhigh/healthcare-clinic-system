# Routes Documentation

## 📍 Route Structure

### Public Routes

| Path               | Component          | Description                                             |
| ------------------ | ------------------ | ------------------------------------------------------- |
| `/`                | HomePage           | Landing page với role selection (redirect nếu đã login) |
| `/login`           | LoginPage          | Login page với role-based authentication                |
| `/register`        | RegisterPage       | Đăng ký tài khoản bệnh nhân                             |
| `/forgot-password` | ForgotPasswordPage | 3-bước khôi phục mật khẩu qua OTP                       |

### Patient Routes (Protected)

| Path        | Component       | Description                                      |
| ----------- | --------------- | ------------------------------------------------ |
| `/mainpage` | PatientHomePage | Trang chủ sau đăng nhập (mọi role được phép vào) |

### Doctor Routes (Protected)

Base path: `/doctor`
Layout: `DoctorLayout` (includes Sidebar + Header)

| Path                              | Component                      | Description                          | Params                 |
| --------------------------------- | ------------------------------ | ------------------------------------ | ---------------------- |
| `/doctor`                         | Navigate → `/doctor/dashboard` | Auto-redirect to dashboard           | -                      |
| `/doctor/dashboard`               | DoctorDashboardPage            | Dashboard với shift overview & stats | -                      |
| `/doctor/queue`                   | Navigate → `/doctor/queue/`    | Auto-redirect to queue               | -                      |
| `/doctor/queue/:shiftId`          | PatientQueuePage               | Patient queue management             | `shiftId` (optional)   |
| `/doctor/consultation/:bookingId` | ConsultationPage               | Consultation & prescription          | `bookingId` (required) |
| `/doctor/schedule`                | DoctorSchedulePage             | Schedule management (Coming soon)    | -                      |
| `/doctor/patients`                | DoctorPatientsPage             | Patient records (Coming soon)        | -                      |
| `/doctor/settings`                | DoctorSettingsPage             | Account settings (Coming soon)       | -                      |

### Receptionist Routes (Coming Soon)

Base path: `/receptionist`

| Path                         | Component                 | Description         | Status     |
| ---------------------------- | ------------------------- | ------------------- | ---------- |
| `/receptionist/dashboard`    | ReceptionistDashboardPage | Dashboard overview  | 🚧 Planned |
| `/receptionist/appointments` | AppointmentsPage          | Manage appointments | 🚧 Planned |
| `/receptionist/check-in`     | CheckInPage               | Patient check-in    | 🚧 Planned |
| `/receptionist/patients`     | PatientsPage              | Patient management  | 🚧 Planned |

### Pharmacist Routes (Coming Soon)

Base path: `/pharmacist`

| Path                                   | Component               | Description               | Status     |
| -------------------------------------- | ----------------------- | ------------------------- | ---------- |
| `/pharmacist/dashboard`                | PharmacistDashboardPage | Dashboard overview        | 🚧 Planned |
| `/pharmacist/prescriptions`            | PrescriptionsPage       | Pending prescriptions     | 🚧 Planned |
| `/pharmacist/inventory`                | InventoryPage           | Drug inventory management | 🚧 Planned |
| `/pharmacist/dispense/:prescriptionId` | DispensePage            | Dispense medication       | 🚧 Planned |

### Admin Routes (Coming Soon)

Base path: `/admin`

| Path               | Component          | Description            | Status     |
| ------------------ | ------------------ | ---------------------- | ---------- |
| `/admin/dashboard` | AdminDashboardPage | Dashboard overview     | 🚧 Planned |
| `/admin/users`     | UsersPage          | User management        | 🚧 Planned |
| `/admin/doctors`   | DoctorsPage        | Doctor management      | 🚧 Planned |
| `/admin/services`  | ServicesPage       | Services configuration | 🚧 Planned |
| `/admin/settings`  | SettingsPage       | System settings        | 🚧 Planned |

### Error Routes

| Path | Component    | Description                   |
| ---- | ------------ | ----------------------------- |
| `*`  | NotFoundPage | 404 page for unmatched routes |

---

## 🧭 Navigation Flow

### Landing Flow

```
HomePage (/)
  ├─ Đã đăng nhập? → /mainpage (auto-redirect)
  ├─ Click "Login" → LoginPage (/login)
  ├─ Click "Doctor Portal" → /doctor → /doctor/dashboard
  └─ Click "API Health/Docs" → External links
```

### Patient Flow

```
LoginPage (/login)
  └─ Login as PATIENT → /mainpage

PatientHomePage (/mainpage)
  ├─ Navbar Navigation:
  │   ├─ Trang chủ → /mainpage
  │   ├─ Bác sĩ → /doctors
  │   ├─ Dịch vụ → /services
  │   ├─ Đặt lịch khám → /booking
  │   └─ Lịch khám của tôi → /appointments
  │
  └─ Đăng xuất → HomePage (/)
```

### Doctor Flow

```
LoginPage (/login)
  └─ Login as Doctor → /doctor/dashboard

DoctorLayout (/doctor)
  ├─ Sidebar Navigation:
  │   ├─ Dashboard → /doctor/dashboard
  │   ├─ Queue → /doctor/queue
  │   ├─ Schedule → /doctor/schedule (Coming soon)
  │   ├─ Patients → /doctor/patients (Coming soon)
  │   └─ Settings → /doctor/settings (Coming soon)
  │
  ├─ Dashboard Actions:
  │   └─ Click shift card → /doctor/queue/:shiftId
  │
  ├─ Queue Actions:
  │   └─ Click "Start/Continue Consultation" → /doctor/consultation/:bookingId
  │
  └─ Consultation Actions:
      ├─ Save → Stay on page
      ├─ Complete → Navigate back to queue
      └─ Cancel → Navigate back to queue
```

---

## 🔐 Route Protection (TODO)

Hiện tại routes **CHƯA** được protect. Cần implement:

### Auth Guard Component

```tsx
// Example: ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute({ allowedRoles }: { allowedRoles: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
```

### Usage in Router

```tsx
{
  path: '/doctor',
  element: <ProtectedRoute allowedRoles={['doctor']} />,
  children: [
    {
      path: '',
      element: <DoctorLayout />,
      children: [
        // ... doctor routes
      ],
    },
  ],
}
```

---

## 🎯 Quick Navigation for Development

### Direct Access URLs

- Homepage: http://localhost:3000/
- Login: http://localhost:3000/login
- Doctor Dashboard: http://localhost:3000/doctor/dashboard
- Patient Queue: http://localhost:3000/doctor/queue
- API Health: http://localhost:4000/api/v1/health
- Swagger UI: http://localhost:4000/swagger-ui

### Navigation Helpers

**From anywhere to Doctor Dashboard:**

```tsx
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/doctor/dashboard');
```

**From Doctor pages back to queue:**

```tsx
navigate('/doctor/queue/' + shiftId);
// or
navigate(-1); // Go back
```

**Programmatic navigation with state:**

```tsx
navigate('/doctor/consultation/' + bookingId, {
  state: { fromQueue: true, shiftId: currentShiftId },
});
```

---

## 📝 Adding New Routes

### 1. Create Page Component

```tsx
// apps/web/src/modules/doctor/pages/NewPage.tsx
export function NewPage() {
  return <div>New Page Content</div>;
}
```

### 2. Export from index

```tsx
// apps/web/src/modules/doctor/pages/index.ts
export { NewPage } from './NewPage';
```

### 3. Add to Router

```tsx
// apps/web/src/routes/router.tsx
import { NewPage } from '../modules/doctor/pages';

// In doctor children array:
{
  path: 'new-route',
  element: <NewPage />,
}
```

### 4. Add to Sidebar (if needed)

```tsx
// apps/web/src/modules/doctor/components/DoctorSidebar.tsx
const navItems = [
  // ... existing items
  { path: '/doctor/new-route', icon: 'icon_name', label: 'New Page' },
];
```

---

## 🚀 Future Enhancements

- [ ] Role-based route protection
- [ ] Auth context provider
- [ ] Route loading states
- [ ] Breadcrumb navigation
- [ ] Route transitions/animations
- [ ] Deep linking support
- [ ] Query params handling
- [ ] Route-based code splitting
- [ ] Redirect after login based on user role from API
- [ ] Remember last visited page
