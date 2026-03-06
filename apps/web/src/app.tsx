import { RouterProvider } from 'react-router-dom';

import { AuthProvider } from './modules/auth/AuthContext';
import { router } from './routes/router';

export function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
