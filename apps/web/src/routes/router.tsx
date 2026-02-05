import { createBrowserRouter } from 'react-router-dom';

import { LoginPage } from '../modules/auth/login.page';
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
]);
