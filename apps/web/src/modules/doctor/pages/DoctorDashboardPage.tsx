import { Link } from 'react-router-dom';

import type { Shift } from '../types';

// Mock data
const mockShifts: Shift[] = [
  {
    id: '1',
    date: '2026-02-06',
    type: 'MORNING',
    startTime: '2026-02-06T07:00:00Z',
    endTime: '2026-02-06T09:00:00Z',
    timeRange: '07:00 - 09:00',
    status: 'CLOSED',
    totalPatients: 6,
    waitingCount: 0,
    checkedInCount: 0,
    inConsultationCount: 0,
    completedCount: 6,
  },
  {
    id: '2',
    date: '2026-02-06',
    type: 'MORNING',
    startTime: '2026-02-06T09:00:00Z',
    endTime: '2026-02-06T11:00:00Z',
    timeRange: '09:00 - 11:00',
    status: 'OPEN',
    totalPatients: 8,
    waitingCount: 4,
    checkedInCount: 2,
    inConsultationCount: 1,
    completedCount: 3,
  },
  {
    id: '3',
    date: '2026-02-06',
    type: 'AFTERNOON',
    startTime: '2026-02-06T13:00:00Z',
    endTime: '2026-02-06T15:00:00Z',
    timeRange: '13:00 - 15:00',
    status: 'OPEN',
    totalPatients: 5,
    waitingCount: 5,
    checkedInCount: 0,
    inConsultationCount: 0,
    completedCount: 0,
  },
];

function getShiftStatus(shift: Shift) {
  if (shift.status === 'CLOSED' || shift.completedCount === shift.totalPatients) {
    return { label: 'Completed', color: 'slate', borderColor: 'primary' };
  }
  if (shift.inConsultationCount > 0 || shift.waitingCount > 0) {
    return { label: 'In Progress', color: 'amber', borderColor: 'amber-500' };
  }
  return { label: 'Upcoming', color: 'slate', borderColor: 'slate-300' };
}

export function DoctorDashboardPage() {
  const selectedDate: string = new Date().toISOString().split('T')[0] ?? '';

  // Tính tổng số liệu
  const totalAppointments = mockShifts.reduce((sum, s) => sum + s.totalPatients, 0);
  const totalWaiting = mockShifts.reduce((sum, s) => sum + s.waitingCount + s.checkedInCount, 0);
  const totalCompleted = mockShifts.reduce((sum, s) => sum + s.completedCount, 0);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        {/* Page Header & Welcome */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Good Morning, Dr. Smith
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Here's your schedule overview for today.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white dark:bg-surface-dark p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-2 px-3 py-2">
              <span className="material-symbols-outlined text-primary">calendar_today</span>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {formatDate(selectedDate)}
              </span>
            </div>
            <button className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
              Change Date
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Total */}
          <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-card border border-slate-100 dark:border-slate-700/50 flex items-center justify-between group hover:border-primary/30 transition-all">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Appointments
              </span>
              <span className="text-4xl font-extrabold text-slate-900 dark:text-white mt-1">
                {totalAppointments}
              </span>
            </div>
            <div className="size-14 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[32px]">groups</span>
            </div>
          </div>

          {/* Card 2: Waiting */}
          <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-card border border-slate-100 dark:border-slate-700/50 flex items-center justify-between group hover:border-green-500/30 transition-all">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Waiting Room
              </span>
              <span className="text-4xl font-extrabold text-slate-900 dark:text-white mt-1">
                {totalWaiting}
              </span>
              <span className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full w-fit">
                {mockShifts.reduce((sum, s) => sum + s.checkedInCount, 0)} Checked In
              </span>
            </div>
            <div className="size-14 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[32px]">
                airline_seat_recline_normal
              </span>
            </div>
          </div>

          {/* Card 3: Completed */}
          <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-card border border-slate-100 dark:border-slate-700/50 flex items-center justify-between group hover:border-primary/30 transition-all">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Completed
              </span>
              <span className="text-4xl font-extrabold text-slate-900 dark:text-white mt-1">
                {totalCompleted}
              </span>
            </div>
            <div className="size-14 rounded-full bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[32px]">check_circle</span>
            </div>
          </div>
        </div>

        {/* Daily Schedule Section */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">schedule</span>
              Daily Schedule
            </h3>
            <button className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors flex items-center gap-1">
              View Full Calendar
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>

          {/* Schedule List */}
          <div className="flex flex-col gap-4">
            {mockShifts.map((shift) => {
              const status = getShiftStatus(shift);
              const progress = (shift.completedCount / shift.totalPatients) * 100;
              const isActive = status.label === 'In Progress';
              const isCompleted = status.label === 'Completed';

              return (
                <div
                  key={shift.id}
                  className={`group flex flex-col md:flex-row gap-4 md:items-center bg-white dark:bg-surface-dark p-5 rounded-2xl border shadow-sm relative overflow-hidden transition-all hover:shadow-md ${
                    isActive
                      ? 'border-amber-200 dark:border-amber-900/50 ring-1 ring-amber-500/10'
                      : 'border-slate-200 dark:border-slate-700'
                  } ${!isActive && !isCompleted ? 'opacity-80 hover:opacity-100' : ''}`}
                >
                  {/* Left border indicator */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                      isCompleted
                        ? 'bg-primary'
                        : isActive
                          ? 'bg-amber-500'
                          : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  />

                  <div className="flex flex-col min-w-[160px] pl-4">
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      {shift.timeRange}
                    </span>
                    <span
                      className={`text-sm ${
                        isActive
                          ? 'text-amber-600 dark:text-amber-500 font-medium'
                          : 'text-slate-500'
                      }`}
                    >
                      {isActive
                        ? 'Current Session'
                        : shift.type === 'MORNING'
                          ? 'Morning'
                          : 'Afternoon'}
                    </span>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                        <span>Capacity</span>
                        <span className={isActive ? 'text-amber-600 dark:text-amber-500' : ''}>
                          {shift.completedCount} / {shift.totalPatients} Patients
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isActive ? 'bg-amber-500 animate-pulse' : 'bg-primary'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 md:justify-end">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          isActive
                            ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                            : isCompleted
                              ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <span
                          className={`size-2 rounded-full ${
                            isActive
                              ? 'bg-amber-500 animate-pulse'
                              : isCompleted
                                ? 'bg-slate-400'
                                : 'bg-slate-400 border border-white dark:border-slate-800'
                          }`}
                        />
                        {status.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end mt-2 md:mt-0 gap-2">
                    {isActive ? (
                      <Link
                        to={`/doctor/queue/${shift.id}`}
                        className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-primary hover:bg-primary-dark shadow-sm transition-colors"
                      >
                        Resume
                      </Link>
                    ) : (
                      <Link
                        to={`/doctor/queue/${shift.id}`}
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        {isCompleted ? 'Details' : 'Prepare'}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Empty State */}
            <div className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
              <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-4xl mb-2">
                event_available
              </span>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                No appointments scheduled after 15:00
              </p>
              <button className="mt-3 text-primary text-sm font-bold hover:underline">
                Add Exception Slot
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
