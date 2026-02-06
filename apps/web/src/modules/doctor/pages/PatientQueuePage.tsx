import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import type { QueueItem, BookingStatus } from '../types';

// Mock data
const mockQueueItems: QueueItem[] = [
  {
    id: '1',
    queueNumber: 5,
    patient: {
      id: 'p1',
      fullName: 'Tran Thi B',
      phone: '0901234567',
      nationalId: '001234567890',
      dateOfBirth: '1980-05-15',
      age: 45,
      gender: 'Female',
      weightKg: 58,
      heightCm: 160,
      allergies: null,
      address: null,
    },
    serviceName: 'General Check-up',
    status: 'IN_CONSULTATION',
    channel: 'WEB',
    checkInAt: '2026-02-06T07:45:00Z',
    priorityScore: 50,
    skipCount: 0,
  },
  {
    id: '2',
    queueNumber: 6,
    patient: {
      id: 'p2',
      fullName: 'Le Chi C',
      phone: '0902345678',
      nationalId: '001234567891',
      dateOfBirth: '1975-08-20',
      age: 50,
      gender: 'Male',
      weightKg: 72,
      heightCm: 170,
      allergies: 'Penicillin',
      address: null,
    },
    serviceName: 'Follow-up',
    status: 'WAITING',
    channel: 'WEB',
    checkInAt: '2026-02-06T07:55:00Z',
    priorityScore: 50,
    skipCount: 0,
  },
  {
    id: '3',
    queueNumber: 7,
    patient: {
      id: 'p3',
      fullName: 'Pham Duc D',
      phone: '0903456789',
      nationalId: '001234567892',
      dateOfBirth: '1990-12-10',
      age: 35,
      gender: 'Male',
      weightKg: 80,
      heightCm: 175,
      allergies: null,
      address: null,
    },
    serviceName: 'Consultation',
    status: 'WAITING',
    channel: 'WALK_IN',
    checkInAt: '2026-02-06T08:05:00Z',
    priorityScore: 0,
    skipCount: 0,
  },
  {
    id: '4',
    queueNumber: 8,
    patient: {
      id: 'p4',
      fullName: 'Hoang Lan E',
      phone: '0904567890',
      nationalId: '001234567893',
      dateOfBirth: '1985-03-25',
      age: 40,
      gender: 'Female',
      weightKg: 55,
      heightCm: 158,
      allergies: 'Peanuts',
      address: null,
    },
    serviceName: 'Blood Test',
    status: 'WAITING',
    channel: 'WEB',
    checkInAt: '2026-02-06T08:15:00Z',
    priorityScore: 50,
    skipCount: 0,
  },
  {
    id: '5',
    queueNumber: 4,
    patient: {
      id: 'p5',
      fullName: 'Kieu Van F',
      phone: '0905678901',
      nationalId: '001234567894',
      dateOfBirth: '1995-07-30',
      age: 30,
      gender: 'Male',
      weightKg: 68,
      heightCm: 172,
      allergies: null,
      address: null,
    },
    serviceName: 'Vaccination',
    status: 'COMPLETED',
    channel: 'WALK_IN',
    checkInAt: '2026-02-06T07:30:00Z',
    priorityScore: 0,
    skipCount: 0,
  },
];

type FilterStatus = 'ALL' | BookingStatus;

const statusFilters: { value: FilterStatus; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'WAITING', label: 'Waiting' },
  { value: 'IN_CONSULTATION', label: 'Examining' },
  { value: 'COMPLETED', label: 'Completed' },
];

function getStatusBadge(status: BookingStatus) {
  switch (status) {
    case 'IN_CONSULTATION':
      return {
        label: 'Examining',
        bgClass: 'bg-amber-100 dark:bg-amber-900/40',
        textClass: 'text-amber-700 dark:text-amber-300',
        borderClass: 'border-amber-200 dark:border-amber-800',
        pulse: true,
      };
    case 'WAITING':
    case 'CHECKED_IN':
      return {
        label: 'Waiting',
        bgClass: 'bg-slate-100 dark:bg-slate-800',
        textClass: 'text-slate-600 dark:text-slate-400',
        borderClass: '',
        pulse: false,
      };
    case 'COMPLETED':
      return {
        label: 'Completed',
        bgClass: 'bg-emerald-50 dark:bg-emerald-900/20',
        textClass: 'text-emerald-600 dark:text-emerald-400',
        borderClass: '',
        pulse: false,
      };
    case 'RESULTS_READY':
      return {
        label: 'Results Ready',
        bgClass: 'bg-blue-100 dark:bg-blue-900/40',
        textClass: 'text-blue-700 dark:text-blue-300',
        borderClass: 'border-blue-200 dark:border-blue-800',
        pulse: true,
      };
    default:
      return {
        label: status,
        bgClass: 'bg-slate-100',
        textClass: 'text-slate-600',
        borderClass: '',
        pulse: false,
      };
  }
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

const avatarColors = [
  'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-400',
  'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-400',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-400',
  'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-400',
  'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-400',
];

export function PatientQueuePage() {
  const { shiftId: _shiftId } = useParams<{ shiftId: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [showToast, setShowToast] = useState(true);

  // Filter queue items
  const filteredItems = mockQueueItems.filter((item) => {
    const matchesSearch =
      searchQuery === '' ||
      item.patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.patient.phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Count by status
  const counts = {
    ALL: mockQueueItems.length,
    WAITING: mockQueueItems.filter((i) => i.status === 'WAITING' || i.status === 'CHECKED_IN')
      .length,
    IN_CONSULTATION: mockQueueItems.filter((i) => i.status === 'IN_CONSULTATION').length,
    COMPLETED: mockQueueItems.filter((i) => i.status === 'COMPLETED').length,
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 space-y-6">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50 animate-bounce">
          <div className="flex items-center gap-3 bg-white dark:bg-[#1e2739] border-l-4 border-primary shadow-lg rounded-r-lg p-4 max-w-sm w-full">
            <div className="bg-primary/10 p-2 rounded-full text-primary">
              <span className="material-symbols-outlined text-[20px]">person_add</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                New Check-in
              </p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                Nguyen Van A added to queue.
              </p>
            </div>
            <button
              onClick={() => setShowToast(false)}
              className="ml-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          to="/doctor/dashboard"
          className="text-slate-500 hover:text-primary dark:text-slate-400 transition-colors"
        >
          Queue Management
        </Link>
        <span className="material-symbols-outlined text-[14px] text-slate-400">chevron_right</span>
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          Shift 7:00 AM - 9:00 AM
        </span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Queue: Morning Shift (07:00 - 09:00)
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Manage patient flow and examinations for today.
          </p>
        </div>
        <button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all active:scale-95 group">
          <span className="material-symbols-outlined group-hover:animate-pulse">campaign</span>
          Call Next Patient
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#151b2b] p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Patients</p>
            <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">15</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
            <span className="material-symbols-outlined">group</span>
          </div>
        </div>
        <div className="bg-white dark:bg-[#151b2b] p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Waiting</p>
            <p className="text-3xl font-bold text-primary mt-1">4</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">hourglass_top</span>
          </div>
        </div>
        <div className="bg-white dark:bg-[#151b2b] p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Completed</p>
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">11</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <span className="material-symbols-outlined">check_circle</span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-[#151b2b] p-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-primary/50"
            placeholder="Search by patient name or ID..."
          />
        </div>

        {/* Tabs */}
        <div className="flex w-full md:w-auto overflow-x-auto gap-1 p-1 bg-slate-50 dark:bg-slate-900 rounded-lg">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                statusFilter === filter.value
                  ? 'bg-white dark:bg-slate-800 text-primary shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              {filter.label} ({counts[filter.value as keyof typeof counts] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-[#151b2b] rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-800">
              <th className="px-6 py-4 w-20">Queue No.</th>
              <th className="px-6 py-4">Patient Name</th>
              <th className="px-6 py-4">Check-in Time</th>
              <th className="px-6 py-4">Service</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredItems.map((item, index) => {
              const statusBadge = getStatusBadge(item.status);
              const isExamining = item.status === 'IN_CONSULTATION';
              const isCompleted = item.status === 'COMPLETED';

              return (
                <tr
                  key={item.id}
                  className={`transition-colors group ${
                    isExamining
                      ? 'bg-amber-50/50 dark:bg-amber-900/10 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                      : isCompleted
                        ? 'bg-slate-50/50 dark:bg-slate-900/30 opacity-70 hover:opacity-100'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <td className="px-6 py-4">
                    <span
                      className={`font-bold text-lg ${
                        isExamining
                          ? 'text-amber-700 dark:text-amber-500'
                          : isCompleted
                            ? 'text-slate-400 dark:text-slate-500'
                            : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      #{String(item.queueNumber).padStart(2, '0')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold ${
                          isExamining ? 'ring-2 ring-white dark:ring-slate-800' : ''
                        } ${isCompleted ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400' : avatarColors[index % avatarColors.length]}`}
                      >
                        {getInitials(item.patient.fullName)}
                      </div>
                      <div>
                        <p
                          className={`font-bold ${
                            isCompleted
                              ? 'text-slate-700 dark:text-slate-300'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {item.patient.fullName}
                        </p>
                        <p
                          className={`text-xs ${isCompleted ? 'text-slate-400' : 'text-slate-500'}`}
                        >
                          ID: {item.patient.nationalId?.slice(-6) || item.patient.phone.slice(-6)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`font-medium ${
                        isCompleted
                          ? 'text-slate-500 dark:text-slate-400'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {item.checkInAt ? formatTime(item.checkInAt) : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={
                        isCompleted
                          ? 'text-slate-500 dark:text-slate-400'
                          : 'text-slate-600 dark:text-slate-300'
                      }
                    >
                      {item.serviceName || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${statusBadge.bgClass} ${statusBadge.textClass} ${statusBadge.borderClass ? `border ${statusBadge.borderClass}` : ''}`}
                    >
                      {statusBadge.pulse && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
                        </span>
                      )}
                      {statusBadge.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isCompleted ? (
                      <button className="text-slate-400 hover:text-primary dark:hover:text-primary-light transition-colors p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                        <span className="material-symbols-outlined">history</span>
                      </button>
                    ) : isExamining ? (
                      <Link
                        to={`/doctor/consultation/${item.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit_note</span>
                        Continue
                      </Link>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/doctor/consultation/${item.id}`}
                          className="text-primary hover:text-primary-dark transition-colors p-2 rounded-full hover:bg-primary/10"
                          title="Start Examination"
                        >
                          <span className="material-symbols-outlined">play_arrow</span>
                        </Link>
                        <button
                          className="text-slate-400 hover:text-primary dark:hover:text-primary-light transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="More options"
                        >
                          <span className="material-symbols-outlined">more_vert</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-4">
              <span className="material-symbols-outlined text-4xl text-slate-400">
                assignment_turned_in
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">All Caught Up!</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-xs mt-2">
              There are no patients waiting in the queue for this shift.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
