import { createBrowserRouter } from 'react-router-dom';

import { LoginPage } from '../modules/auth/login.page';
import { DoctorLayout } from '../modules/doctor/components';
import { DoctorDashboardPage, PatientQueuePage, ConsultationPage } from '../modules/doctor/pages';
import { HomePage } from '../modules/home/home.page';
import { BookingPage, HealthProfilePage } from '../modules/patient/pages';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  // Patient / Customer routes
  {
    path: '/booking',
    element: <BookingPage />,
  },
  {
    path: '/health-profile',
    element: <HealthProfilePage />,
  },
  // Doctor routes
  {
    path: '/doctor',
    element: <DoctorLayout />,
    children: [
      {
        path: 'dashboard',
        element: <DoctorDashboardPage />,
      },
      {
        path: 'queue/:shiftId?',
        element: <PatientQueuePage />,
      },
      {
        path: 'consultation/:bookingId',
        element: <ConsultationPage />,
      },
    ],
  },
]);
