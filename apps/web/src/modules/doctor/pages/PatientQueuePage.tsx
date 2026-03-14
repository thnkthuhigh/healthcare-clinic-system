import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../../auth/useAuth';
import { consultationApi, doctorApi } from '../api';
import type { BookingStatus, QueueItem } from '../types';

type FilterStatus = 'ALL' | 'BOOKED' | 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED';

const statusFilters: { value: FilterStatus; label: string }[] = [
  { value: 'ALL', label: 'Tat ca' },
  { value: 'BOOKED', label: 'Da dat' },
  { value: 'WAITING', label: 'Dang cho' },
  { value: 'IN_CONSULTATION', label: 'Dang kham' },
  { value: 'COMPLETED', label: 'Hoan thanh' },
];

const avatarColors = [
  'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-400',
  'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-400',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-400',
  'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-400',
  'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-400',
];

function getStatusBadge(status: BookingStatus) {
  switch (status) {
    case 'BOOKED':
      return {
        label: 'Da dat lich',
        bgClass: 'bg-sky-50 dark:bg-sky-900/20',
        textClass: 'text-sky-700 dark:text-sky-300',
        borderClass: 'border-sky-200 dark:border-sky-800',
        pulse: false,
      };
    case 'IN_CONSULTATION':
      return {
        label: 'Dang kham',
        bgClass: 'bg-amber-100 dark:bg-amber-900/40',
        textClass: 'text-amber-700 dark:text-amber-300',
        borderClass: 'border-amber-200 dark:border-amber-800',
        pulse: true,
      };
    case 'WAITING':
    case 'CHECKED_IN':
      return {
        label: 'Dang cho',
        bgClass: 'bg-slate-100 dark:bg-slate-800',
        textClass: 'text-slate-600 dark:text-slate-400',
        borderClass: '',
        pulse: false,
      };
    case 'RESULTS_READY':
      return {
        label: 'Co ket qua',
        bgClass: 'bg-blue-100 dark:bg-blue-900/40',
        textClass: 'text-blue-700 dark:text-blue-300',
        borderClass: 'border-blue-200 dark:border-blue-800',
        pulse: true,
      };
    case 'COMPLETED':
      return {
        label: 'Hoan thanh',
        bgClass: 'bg-emerald-50 dark:bg-emerald-900/20',
        textClass: 'text-emerald-600 dark:text-emerald-400',
        borderClass: '',
        pulse: false,
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
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatTime(value: string | null | undefined) {
  if (!value) return '--:--';
  return new Date(value).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatQueueNumber(value: number | null) {
  return value == null ? '--' : String(value).padStart(2, '0');
}

function matchesStatusFilter(status: BookingStatus, filter: FilterStatus) {
  if (filter === 'ALL') return true;
  if (filter === 'BOOKED') return status === 'BOOKED';
  if (filter === 'WAITING') {
    return status === 'WAITING' || status === 'CHECKED_IN' || status === 'RESULTS_READY';
  }
  return status === filter;
}

function canStartConsultation(status: BookingStatus) {
  return status === 'CHECKED_IN' || status === 'WAITING' || status === 'RESULTS_READY';
}

function getChannelLabel(channel: QueueItem['channel']) {
  return channel === 'WEB' ? 'Dat web' : 'Vang lai';
}

export function PatientQueuePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { shiftId: paramShiftId } = useParams<{ shiftId: string }>();
  const [activeShiftId, setActiveShiftId] = useState<string | null>(paramShiftId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [invitingBookingId, setInvitingBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (paramShiftId) {
      setActiveShiftId(paramShiftId);
      return;
    }

    const findActiveShift = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const doctor = await doctorApi.getProfile(user.id);
        const shifts = await doctorApi.getShifts(doctor.id);
        const active = shifts.find((shift) => shift.status !== 'CLOSED') || shifts[0];

        if (active) {
          setActiveShiftId(active.id);
        } else {
          setError('Khong co ca lam viec nao trong hom nay');
          setLoading(false);
        }
      } catch (fetchError) {
        console.error('Failed to find active shift:', fetchError);
        setError('Khong the tim ca lam viec hien tai');
        setLoading(false);
      }
    };

    findActiveShift();
  }, [paramShiftId, user]);

  const fetchQueue = useCallback(async () => {
    if (!activeShiftId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await doctorApi.getQueue(activeShiftId);
      setQueueItems(data);
      setLastUpdated(new Date());
    } catch (fetchError) {
      console.error('Failed to fetch queue:', fetchError);
      setError('Khong the tai danh sach hang cho');
    } finally {
      setLoading(false);
    }
  }, [activeShiftId]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  useEffect(() => {
    if (!activeShiftId) return;

    const interval = setInterval(() => {
      fetchQueue();
    }, 10000);

    return () => clearInterval(interval);
  }, [activeShiftId, fetchQueue]);

  const filteredItems = queueItems.filter((item) => {
    const matchesSearch =
      searchQuery === '' ||
      item.patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.patient.phone.includes(searchQuery) ||
      (item.patient.nationalId && item.patient.nationalId.includes(searchQuery));

    return matchesSearch && matchesStatusFilter(item.status, statusFilter);
  });

  const counts = {
    ALL: queueItems.length,
    BOOKED: queueItems.filter((item) => item.status === 'BOOKED').length,
    WAITING: queueItems.filter((item) =>
      item.status === 'WAITING' || item.status === 'CHECKED_IN' || item.status === 'RESULTS_READY',
    ).length,
    IN_CONSULTATION: queueItems.filter((item) => item.status === 'IN_CONSULTATION').length,
    COMPLETED: queueItems.filter((item) => item.status === 'COMPLETED').length,
  };

  const getTimeSinceUpdate = () => {
    const seconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
    if (seconds < 60) return `${seconds} giay truoc`;

    const minutes = Math.floor(seconds / 60);
    return `${minutes} phut truoc`;
  };

  const handleStartConsultation = async (bookingId: string) => {
    try {
      setInvitingBookingId(bookingId);
      setError(null);
      await consultationApi.invitePatient(bookingId);
      navigate(`/doctor/consultation/${bookingId}`);
    } catch (inviteError) {
      console.error('Failed to invite patient:', inviteError);
      setError('Khong the moi benh nhan vao phong kham');
    } finally {
      setInvitingBookingId(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 space-y-6">
      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">
              warning
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200">{error}</p>
              <button
                onClick={fetchQueue}
                className="mt-2 text-sm text-amber-700 underline hover:no-underline dark:text-amber-300"
              >
                Thu lai
              </button>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-sm">
        <Link
          to="/doctor/dashboard"
          className="text-slate-500 hover:text-primary dark:text-slate-400 transition-colors"
        >
          Tong quan
        </Link>
        <span className="material-symbols-outlined text-[14px] text-slate-400">chevron_right</span>
        <span className="font-semibold text-slate-800 dark:text-slate-200">Quan ly hang cho</span>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Hang cho theo bac si
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Gom benh nhan da dat lich, da check-in, dang cho va dang kham trong ca nay
          </p>
          <p className="text-xs text-slate-400">Cap nhat lan cuoi: {getTimeSinceUpdate()}</p>
        </div>

        <button
          className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95"
          onClick={fetchQueue}
        >
          <span className="material-symbols-outlined">refresh</span>
          Lam moi
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="relative flex items-center justify-between rounded-xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#151b2b]">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/50 backdrop-blur-sm dark:bg-[#151b2b]/50">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tong benh nhan</p>
            <p className="mt-1 text-3xl font-bold text-slate-800 dark:text-white">{counts.ALL}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800">
            <span className="material-symbols-outlined">group</span>
          </div>
        </div>

        <div className="relative flex items-center justify-between rounded-xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#151b2b]">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/50 backdrop-blur-sm dark:bg-[#151b2b]/50">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Cho check-in</p>
            <p className="mt-1 text-3xl font-bold text-sky-600 dark:text-sky-400">
              {counts.BOOKED}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
            <span className="material-symbols-outlined">event_available</span>
          </div>
        </div>

        <div className="relative flex items-center justify-between rounded-xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#151b2b]">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/50 backdrop-blur-sm dark:bg-[#151b2b]/50">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Dang cho</p>
            <p className="mt-1 text-3xl font-bold text-primary">{counts.WAITING}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="material-symbols-outlined">hourglass_top</span>
          </div>
        </div>

        <div className="relative flex items-center justify-between rounded-xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#151b2b]">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/50 backdrop-blur-sm dark:bg-[#151b2b]/50">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Hoan thanh</p>
            <p className="mt-1 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {counts.COMPLETED}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <span className="material-symbols-outlined">check_circle</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-slate-100 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-[#151b2b] md:flex-row">
        <div className="relative w-full md:w-96">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-lg border-none bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-slate-200"
            placeholder="Tim theo ten, SDT hoac CMND..."
          />
        </div>

        <div className="flex w-full gap-1 overflow-x-auto rounded-lg bg-slate-50 p-1 dark:bg-slate-900 md:w-auto">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                statusFilter === filter.value
                  ? 'bg-white text-primary shadow-sm dark:bg-slate-800'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {filter.label} ({counts[filter.value] || 0})
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-[#151b2b]">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
              <th className="w-20 px-6 py-4">STT</th>
              <th className="px-6 py-4">Benh nhan</th>
              <th className="px-6 py-4">Lich / Check-in</th>
              <th className="px-6 py-4">Dich vu</th>
              <th className="px-6 py-4">Trang thai</th>
              <th className="px-6 py-4 text-right">Thao tac</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading && queueItems.length === 0 && (
              <>
                {[1, 2, 3, 4, 5].map((index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="h-6 w-12 rounded bg-slate-200 dark:bg-slate-700"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700"></div>
                          <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-700"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 w-24 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="ml-auto h-8 w-24 rounded-lg bg-slate-200 dark:bg-slate-700"></div>
                    </td>
                  </tr>
                ))}
              </>
            )}

            {!loading &&
              filteredItems.map((item, index) => {
                const statusBadge = getStatusBadge(item.status);
                const isBooked = item.status === 'BOOKED';
                const isExamining = item.status === 'IN_CONSULTATION';
                const isCompleted = item.status === 'COMPLETED';

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      isExamining
                        ? 'bg-amber-50/50 hover:bg-amber-50 dark:bg-amber-900/10 dark:hover:bg-amber-900/20'
                        : isBooked
                          ? 'bg-sky-50/40 hover:bg-sky-50 dark:bg-sky-900/10 dark:hover:bg-sky-900/20'
                          : isCompleted
                            ? 'bg-slate-50/50 opacity-70 hover:opacity-100 dark:bg-slate-900/30'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <span
                        className={`text-lg font-bold ${
                          isExamining
                            ? 'text-amber-700 dark:text-amber-500'
                            : isBooked
                              ? 'text-sky-700 dark:text-sky-400'
                              : isCompleted
                                ? 'text-slate-400 dark:text-slate-500'
                                : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        #{formatQueueNumber(item.queueNumber)}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${
                            isCompleted
                              ? 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                              : avatarColors[index % avatarColors.length]
                          }`}
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
                          <div
                            className={`flex flex-wrap gap-x-3 gap-y-1 text-xs ${
                              isCompleted ? 'text-slate-400' : 'text-slate-500'
                            }`}
                          >
                            <span>SDT: {item.patient.phone}</span>
                            <span>Slot #{item.slotSequence}</span>
                            <span>{getChannelLabel(item.channel)}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p
                          className={`font-medium ${
                            isCompleted
                              ? 'text-slate-500 dark:text-slate-400'
                              : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          Gio hen {formatTime(item.appointmentTime)}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {item.checkInAt ? `Check-in ${formatTime(item.checkInAt)}` : 'Chua check-in'}
                        </p>
                      </div>
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
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${statusBadge.bgClass} ${statusBadge.textClass} ${
                          statusBadge.borderClass ? `border ${statusBadge.borderClass}` : ''
                        }`}
                      >
                        {statusBadge.pulse && (
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75"></span>
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-current"></span>
                          </span>
                        )}
                        {statusBadge.label}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      {isCompleted ? (
                        <button className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-200 hover:text-primary dark:hover:bg-slate-700">
                          <span className="material-symbols-outlined">history</span>
                        </button>
                      ) : isExamining ? (
                        <Link
                          to={`/doctor/consultation/${item.id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit_note</span>
                          Tiep tuc
                        </Link>
                      ) : isBooked ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          <span className="material-symbols-outlined text-[18px]">schedule</span>
                          Cho check-in
                        </span>
                      ) : canStartConsultation(item.status) ? (
                        <button
                          type="button"
                          onClick={() => handleStartConsultation(item.id)}
                          disabled={invitingBookingId === item.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
                        >
                          {invitingBookingId === item.id ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                          ) : (
                            <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                          )}
                          Moi vao kham
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">Dang xu ly</span>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>

        {!loading && filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 rounded-full bg-slate-100 p-6 dark:bg-slate-800">
              <span className="material-symbols-outlined text-4xl text-slate-400">
                assignment_turned_in
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Khong co benh nhan
            </h3>
            <p className="mt-2 max-w-xs text-slate-500 dark:text-slate-400">
              {searchQuery
                ? 'Khong tim thay benh nhan phu hop voi tu khoa tim kiem.'
                : 'Hien khong co benh nhan nao trong hang cho cho ca lam viec nay.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
