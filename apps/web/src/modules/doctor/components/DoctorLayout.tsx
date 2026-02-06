import { Outlet } from 'react-router-dom';

import { DoctorHeader } from './DoctorHeader';
import { DoctorSidebar } from './DoctorSidebar';

// Mock doctor data - replace with real auth context later
const mockDoctor = {
  name: 'Dr. Sarah Smith',
  specialty: 'Cardiology',
};

export function DoctorLayout() {
  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display overflow-hidden">
      <DoctorSidebar doctorName={mockDoctor.name} specialty={mockDoctor.specialty} />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <DoctorHeader title="Doctor Portal" />

        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
