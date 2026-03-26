import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

import { useAuth } from '../../auth/useAuth';

import { DoctorHeader } from './DoctorHeader';
import { DoctorSidebar } from './DoctorSidebar';

export function DoctorLayout() {
  const { user } = useAuth();
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem('doctor_sidebar_visible');
    if (saved === '0') {
      setIsSidebarVisible(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('doctor_sidebar_visible', isSidebarVisible ? '1' : '0');
  }, [isSidebarVisible]);

  const displayName =
    user?.role === 'OWNER' ? 'Owner' : user?.role === 'ADMIN' ? 'Admin' : user?.phone || 'Bác sĩ';

  return (
    <div className="ops-shell" data-testid="doctor-layout">
      <DoctorSidebar doctorName={displayName} isVisible={isSidebarVisible} />

      <main className="ops-main" data-testid="doctor-main">
        <DoctorHeader
          isSidebarVisible={isSidebarVisible}
          onToggleSidebar={() => setIsSidebarVisible((prev) => !prev)}
        />
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
