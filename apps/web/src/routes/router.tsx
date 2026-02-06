import { createBrowserRouter } from 'react-router-dom';

import { LoginPage } from '../modules/auth/login.page';
import { DoctorLayout } from '../modules/doctor/components';
import { DoctorDashboardPage, PatientQueuePage, ConsultationPage } from '../modules/doctor/pages';
import { HomePage } from '../modules/home/home.page';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
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
