import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Custom hook for doctor module navigation
 */
export function useDoctorNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const goToDashboard = useCallback(() => {
    navigate('/doctor/dashboard');
  }, [navigate]);

  const goToQueue = useCallback(
    (shiftId?: number | string) => {
      if (shiftId) {
        navigate(`/doctor/queue/${shiftId}`);
      } else {
        navigate('/doctor/queue');
      }
    },
    [navigate],
  );

  const goToConsultation = useCallback(
    (bookingId: number | string, state?: Record<string, unknown>) => {
      navigate(`/doctor/consultation/${bookingId}`, { state });
    },
    [navigate],
  );

  const goToSchedule = useCallback(() => {
    navigate('/doctor/schedule');
  }, [navigate]);

  const goToPatients = useCallback(() => {
    navigate('/doctor/patients');
  }, [navigate]);

  const goToSettings = useCallback(() => {
    navigate('/doctor/settings');
  }, [navigate]);

  const goBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const isActive = useCallback(
    (path: string) => {
      return location.pathname.startsWith(path);
    },
    [location.pathname],
  );

  return {
    // Navigation functions
    goToDashboard,
    goToQueue,
    goToConsultation,
    goToSchedule,
    goToPatients,
    goToSettings,
    goBack,

    // Utilities
    isActive,
    currentPath: location.pathname,
    state: location.state,
  };
}

/**
 * Hook for general app navigation
 */
export function useAppNavigation() {
  const navigate = useNavigate();

  const goToHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const goToPatientHome = useCallback(() => {
    navigate('/mainpage');
  }, [navigate]);

  const goToLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  const goToDoctorPortal = useCallback(() => {
    navigate('/doctor');
  }, [navigate]);

  const goToReceptionistPortal = useCallback(() => {
    navigate('/receptionist');
  }, [navigate]);

  const goToPharmacistPortal = useCallback(() => {
    navigate('/pharmacist');
  }, [navigate]);

  const goToAdminPortal = useCallback(() => {
    navigate('/admin');
  }, [navigate]);

  return {
    goToHome,
    goToPatientHome,
    goToLogin,
    goToDoctorPortal,
    goToReceptionistPortal,
    goToPharmacistPortal,
    goToAdminPortal,
  };
}
