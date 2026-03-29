import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../auth/useAuth';
import { doctorApi } from '../api';

import { DoctorHeader } from './DoctorHeader';
import { DoctorSidebar } from './DoctorSidebar';

export function DoctorLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isCheckingTotp, setIsCheckingTotp] = useState(false);
  const [isTotpConfirmed, setIsTotpConfirmed] = useState<boolean | null>(null);

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

  useEffect(() => {
    if (user?.role !== 'DOCTOR') {
      setIsCheckingTotp(false);
      setIsTotpConfirmed(null);
      return;
    }

    if (isTotpConfirmed === true) {
      return;
    }

    let cancelled = false;
    setIsCheckingTotp(true);

    doctorApi
      .getTotpStatus()
      .then((status) => {
        if (cancelled) return;
        setIsTotpConfirmed(status.confirmed);
        if (!status.confirmed && location.pathname !== '/doctor/settings') {
          navigate('/doctor/settings', { replace: true });
        }
      })
      .catch((error) => {
        console.error('Failed to check doctor TOTP status:', error);
      })
      .finally(() => {
        if (!cancelled) {
          setIsCheckingTotp(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isTotpConfirmed, location.pathname, navigate, user?.role]);

  const displayName =
    user?.role === 'OWNER' ? 'Owner' : user?.role === 'ADMIN' ? 'Admin' : user?.phone || 'Bác sĩ';

  if (isCheckingTotp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Dang mo thiet lap app xac thuc...</p>
        </div>
      </div>
    );
  }

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
