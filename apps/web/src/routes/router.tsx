import { createBrowserRouter, Navigate } from 'react-router-dom';

import { RequireAuth } from '../components/RequireAuth';
import { AdminLayout } from '../modules/admin/components';
import {
  AdminDashboardPage,
  ReceptionPage,
  CashierPage,
  DoctorManagementPage,
  PatientManagementPage,
  ShiftManagementPage,
  ServiceManagementPage,
  RoomManagementPage,
  SupplyManagementPage,
  AssetManagementPage,
  MedicationManagementPage,
  PrescriptionTemplatePage,
  ReportsPage,
  DepartmentManagementPage,
} from '../modules/admin/pages';
import { ForgotPasswordPage } from '../modules/auth/forgot-password.page';
import { LoginPage } from '../modules/auth/login.page';
import { RegisterPage } from '../modules/auth/register.page';
import { useAuth } from '../modules/auth/useAuth';
import { NotFoundPage } from '../modules/common/NotFound.page';
import { DoctorLayout } from '../modules/doctor/components';
import {
  DoctorDashboardPage,
  PatientQueuePage,
  ConsultationPage,
  DoctorLabPage,
  DoctorSchedulePage,
  DoctorPatientsPage,
  DoctorSettingsPage,
} from '../modules/doctor/pages';
import { HomePage } from '../modules/home/home.page';
import { AccountManagementPage } from '../modules/owner/pages';
import {
  BookingPage,
  BookingPaymentResultPage,
  MockVnpayPage,
  HealthProfilePage,
  HealthRecordsPage,
  ProfilePage,
  DoctorsPage,
  ServicesPage,
  AboutPage,
  AppointmentsPage,
} from '../modules/patient/pages';

import { RouteViewport } from './RouteViewport';

// eslint-disable-next-line react-refresh/only-export-components
function AdminIndexRedirect() {
  const { user } = useAuth();
  const target = user?.role === 'CASHIER' ? '/admin/cashier' : '/admin/dashboard';
  return <Navigate to={target} replace />;
}

export const router = createBrowserRouter([
  {
    element: <RouteViewport />,
    children: [
      // Public routes
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/register',
        element: <RegisterPage />,
      },
      {
        path: '/forgot-password',
        element: <ForgotPasswordPage />,
      },
      // Patient / Customer routes
      {
        path: '/mainpage',
        element: <Navigate to="/" replace />,
      },
      {
        path: '/booking',
        element: <BookingPage />,
      },
      {
        path: '/booking/payment-result',
        element: <BookingPaymentResultPage />,
      },
      {
        path: '/payment/mock-vnpay',
        element: <MockVnpayPage />,
      },
      {
        path: '/profile',
        element: <ProfilePage />,
      },
      {
        path: '/health-records',
        element: <HealthRecordsPage />,
      },
      {
        path: '/health-profile',
        element: <HealthProfilePage />,
      },
      {
        path: '/doctors',
        element: <DoctorsPage />,
      },
      {
        path: '/services',
        element: <ServicesPage />,
      },
      {
        path: '/about',
        element: <AboutPage />,
      },
      {
        path: '/appointments',
        element: <AppointmentsPage />,
      },
      // Doctor routes
      {
        path: '/doctor',
        element: (
          <RequireAuth allowedRoles={['DOCTOR', 'ADMIN', 'OWNER']}>
            <DoctorLayout />
          </RequireAuth>
        ),
        children: [
          {
            index: true,
            element: <Navigate to="/doctor/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <DoctorDashboardPage />,
          },
          {
            path: 'queue',
            element: <PatientQueuePage />,
          },
          {
            path: 'queue/:shiftId',
            element: <PatientQueuePage />,
          },
          {
            path: 'lab',
            element: <DoctorLabPage />,
          },
          {
            path: 'consultation/:bookingId',
            element: <ConsultationPage />,
          },
          {
            path: 'schedule',
            element: <DoctorSchedulePage />,
          },
          {
            path: 'patients',
            element: <DoctorPatientsPage />,
          },
          {
            path: 'settings',
            element: (
              <RequireAuth allowedRoles={['DOCTOR']}>
                <DoctorSettingsPage />
              </RequireAuth>
            ),
          },
          {
            path: 'accounts',
            element: <AccountManagementPage />,
          },
        ],
      },

      // Receptionist routes - Coming soon (TODO)
      // {
      //   path: '/receptionist',
      //   element: <ReceptionistLayout />,
      //   children: [
      //     { index: true, element: <Navigate to="/receptionist/dashboard" replace /> },
      //     { path: 'dashboard', element: <ReceptionistDashboardPage /> },
      //     { path: 'appointments', element: <AppointmentsPage /> },
      //     { path: 'check-in', element: <CheckInPage /> },
      //     { path: 'patients', element: <PatientsPage /> },
      //   ],
      // },

      // Pharmacist routes - Coming soon (TODO)
      // {
      //   path: '/pharmacist',
      //   element: <PharmacistLayout />,
      //   children: [
      //     { index: true, element: <Navigate to="/pharmacist/dashboard" replace /> },
      //     { path: 'dashboard', element: <PharmacistDashboardPage /> },
      //     { path: 'prescriptions', element: <PrescriptionsPage /> },
      //     { path: 'inventory', element: <InventoryPage /> },
      //     { path: 'dispense/:prescriptionId', element: <DispensePage /> },
      //   ],
      // },

      // Admin routes - Protected (ADMIN + OWNER)
      {
        path: '/admin',
        element: (
          <RequireAuth allowedRoles={['ADMIN', 'OWNER', 'CASHIER']}>
            <AdminLayout />
          </RequireAuth>
        ),
        children: [
          { index: true, element: <AdminIndexRedirect /> },
          {
            path: 'dashboard',
            element: (
              <RequireAuth allowedRoles={['ADMIN', 'OWNER']}>
                <AdminDashboardPage />
              </RequireAuth>
            ),
          },
          {
            path: 'reception',
            element: (
              <RequireAuth allowedRoles={['ADMIN', 'OWNER']}>
                <ReceptionPage />
              </RequireAuth>
            ),
          },
          {
            path: 'cashier',
            element: (
              <RequireAuth allowedRoles={['ADMIN', 'OWNER', 'CASHIER']}>
                <CashierPage />
              </RequireAuth>
            ),
          },
          {
            path: 'doctors',
            element: (
              <RequireAuth allowedRoles={['ADMIN', 'OWNER']}>
                <DoctorManagementPage />
              </RequireAuth>
            ),
          },
          {
            path: 'patients',
            element: (
              <RequireAuth allowedRoles={['ADMIN', 'OWNER']}>
                <PatientManagementPage />
              </RequireAuth>
            ),
          },
          {
            path: 'shifts',
            element: (
              <RequireAuth allowedRoles={['ADMIN', 'OWNER']}>
                <ShiftManagementPage />
              </RequireAuth>
            ),
          },
          {
            path: 'services',
            element: (
              <RequireAuth allowedRoles={['ADMIN', 'OWNER']}>
                <ServiceManagementPage />
              </RequireAuth>
            ),
          },
          {
            path: 'rooms',
            element: (
              <RequireAuth allowedRoles={['ADMIN', 'OWNER']}>
                <RoomManagementPage />
              </RequireAuth>
            ),
          },
          {
            path: 'supplies',
            element: (
              <RequireAuth allowedRoles={['ADMIN', 'OWNER']}>
                <SupplyManagementPage />
              </RequireAuth>
            ),
          },
          {
            path: 'assets',
            element: (
              <RequireAuth allowedRoles={['ADMIN', 'OWNER']}>
                <AssetManagementPage />
              </RequireAuth>
            ),
          },
          {
            path: 'medications',
            element: (
              <RequireAuth allowedRoles={['ADMIN', 'OWNER']}>
                <MedicationManagementPage />
              </RequireAuth>
            ),
          },
          {
            path: 'templates',
            element: (
              <RequireAuth allowedRoles={['ADMIN', 'OWNER']}>
                <PrescriptionTemplatePage />
              </RequireAuth>
            ),
          },
          {
            path: 'departments',
            element: (
              <RequireAuth allowedRoles={['ADMIN', 'OWNER']}>
                <DepartmentManagementPage />
              </RequireAuth>
            ),
          },
          {
            path: 'reports',
            element: (
              <RequireAuth allowedRoles={['ADMIN', 'OWNER']}>
                <ReportsPage />
              </RequireAuth>
            ),
          },
        ],
      },

      // 404 Not Found - Must be last
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
