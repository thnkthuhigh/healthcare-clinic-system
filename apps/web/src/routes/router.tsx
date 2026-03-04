import { createBrowserRouter, Navigate } from 'react-router-dom';

import { LoginPage } from '../modules/auth/login.page';
import { NotFoundPage } from '../modules/common/NotFound.page';
import { DoctorLayout } from '../modules/doctor/components';
import {
  DoctorDashboardPage,
  PatientQueuePage,
  ConsultationPage,
  DoctorSchedulePage,
  DoctorPatientsPage,
  DoctorSettingsPage,
} from '../modules/doctor/pages';
import { HomePage } from '../modules/home/home.page';

export const router = createBrowserRouter([
  // Public routes
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },

  // Doctor routes - Protected (TODO: Add auth guard)
  {
    path: '/doctor',
    element: <DoctorLayout />,
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
        element: <Navigate to="/doctor/queue/" replace />,
      },
      {
        path: 'queue/:shiftId',
        element: <PatientQueuePage />,
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
        element: <DoctorSettingsPage />,
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

  // Admin routes - Coming soon (TODO)
  // {
  //   path: '/admin',
  //   element: <AdminLayout />,
  //   children: [
  //     { index: true, element: <Navigate to="/admin/dashboard" replace /> },
  //     { path: 'dashboard', element: <AdminDashboardPage /> },
  //     { path: 'users', element: <UsersPage /> },
  //     { path: 'doctors', element: <DoctorsPage /> },
  //     { path: 'services', element: <ServicesPage /> },
  //     { path: 'settings', element: <SettingsPage /> },
  //   ],
  // },

  // 404 Not Found - Must be last
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
