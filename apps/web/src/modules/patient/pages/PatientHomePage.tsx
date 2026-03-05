import { useAuth } from '../../auth/useAuth';
import { ClinicServices } from '../components/ClinicServices';
import { FeaturedDoctors } from '../components/FeaturedDoctors';
import { HealthRecordsShortcut } from '../components/HealthRecordsShortcut';
import { PatientFooter } from '../components/PatientFooter';
import { PatientNavbar } from '../components/PatientNavbar';
import { QuickActions } from '../components/QuickActions';
import { UpcomingAppointment } from '../components/UpcomingAppointment';
import { WelcomeSection } from '../components/WelcomeSection';
import { MOCK_APPOINTMENTS, MOCK_DOCTORS, MOCK_HEALTH_RECORDS, MOCK_SERVICES } from '../mock';

export function PatientHomePage() {
  const { user } = useAuth();

  // Display phone as name until profile feature is built
  const displayName = user?.phone ?? 'Bạn';

  return (
    <div className="min-h-screen bg-slate-50">
      <PatientNavbar />

      <WelcomeSection userName={displayName} appointments={MOCK_APPOINTMENTS} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        <QuickActions />
        <UpcomingAppointment appointments={MOCK_APPOINTMENTS} />
        <FeaturedDoctors doctors={MOCK_DOCTORS} />
        <ClinicServices services={MOCK_SERVICES} />
        <HealthRecordsShortcut records={MOCK_HEALTH_RECORDS} />
      </main>

      <PatientFooter />
    </div>
  );
}
