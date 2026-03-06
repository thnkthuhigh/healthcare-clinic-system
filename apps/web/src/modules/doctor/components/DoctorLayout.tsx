import { Outlet } from 'react-router-dom';

import { useAuth } from '../../auth/useAuth';

import { DoctorHeader } from './DoctorHeader';
import { DoctorSidebar } from './DoctorSidebar';

export function DoctorLayout() {
  const { user } = useAuth();

  const displayName =
    user?.role === 'OWNER' ? 'Owner' : user?.role === 'ADMIN' ? 'Admin' : user?.phone || 'Bác sĩ';

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display overflow-hidden">
      <DoctorSidebar doctorName={displayName} />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <DoctorHeader />

        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
