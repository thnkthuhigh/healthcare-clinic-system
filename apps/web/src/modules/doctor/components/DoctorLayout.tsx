import { Outlet } from 'react-router-dom';

import { useAuth } from '../../auth/useAuth';

import { DoctorHeader } from './DoctorHeader';
import { DoctorSidebar } from './DoctorSidebar';

export function DoctorLayout() {
  const { user } = useAuth();

  const displayName =
    user?.role === 'OWNER' ? 'Owner' : user?.role === 'ADMIN' ? 'Admin' : user?.phone || 'Bác sĩ';

  return (
    <div className="ops-shell" data-testid="doctor-layout">
      <DoctorSidebar doctorName={displayName} />

      <main className="ops-main" data-testid="doctor-main">
        <DoctorHeader />
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
