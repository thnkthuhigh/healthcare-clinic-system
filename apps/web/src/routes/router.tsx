import { createBrowserRouter } from 'react-router-dom';

import { HomePage } from '../modules/home/home.page';
import { LoginPage } from '../modules/auth/login.page';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
]);
