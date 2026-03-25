import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { OpsPageHeader } from '../../../components/ClinicUI';
import { formatTimeUtc7 } from '../../../lib/time';
import { useAuth } from '../../auth/useAuth';
import { consultationApi, doctorApi } from '../api';
import type { BookingStatus, QueueItem, Shift } from '../types';

type FilterStatus = 'ALL' | 'BOOKED' | 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED';

const statusFilters: { value: FilterStatus; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'BOOKED', label: 'Đã đặt' },
  { value: 'WAITING', label: 'Đang chờ' },
  { value: 'IN_CONSULTATION', label: 'Đang khám' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
];

const avatarColors = [
  'bg-amber-100 text-amber-700',
  'bg-blue-100 text-blue-700',
  'bg-indigo-100 text-indigo-700',
  'bg-pink-100 text-pink-700',
  'bg-green-100 text-green-700',
];

function getStatusBadge(status: BookingStatus) {
  switch (status) {
    case 'BOOKED':
      return {
        label: 'Đã đặt lịch',
        bgClass: 'bg-sky-50',
        textClass: 'text-sky-700',
        borderClass: 'border-sky-200',
        pulse: false,
      };
    case 'IN_CONSULTATION':
      return {
        label: 'Đang khám',
        bgClass: 'bg-amber-100',
        textClass: 'text-amber-700',
        borderClass: 'border-amber-200',
        pulse: true,
      };
    case 'WAITING':
    case 'CHECKED_IN':
      return {
        label: 'Đang chờ',
        bgClass: 'bg-slate-100',
        textClass: 'text-slate-600',
        borderClass: '',
        pulse: false,
      };
    case 'RESULTS_READY':
      return {
        label: 'Có kết quả',
        bgClass: 'bg-blue-100',
        textClass: 'text-blue-700',
        borderClass: 'border-blue-200',
        pulse: true,
      };
    case 'COMPLETED':
      return {
        label: 'Hoàn thành',
        bgClass: 'bg-emerald-50',
        textClass: 'text-emerald-600',
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
  return formatTimeUtc7(value, {
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
  return channel === 'WEB' ? 'Đặt trước' : 'Tại quầy';
}

function toTimestamp(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

function isCurrentShift(shift: Shift) {
  const now = Date.now();
  const start = toTimestamp(shift.startTime);
  const end = toTimestamp(shift.endTime);
  if (start == null || end == null) return false;
  return now >= start && now <= end;
}

function pickBestShift(shifts: Shift[]) {
  if (shifts.length === 0) return null;
  const openShifts = shifts.filter((shift) => shift.status !== 'CLOSED');
  const candidates = openShifts.length > 0 ? openShifts : shifts;
  const hasBookedPatients = candidates.some((shift) => shift.totalPatients > 0);

  return [...candidates].sort((left, right) => {
    if (hasBookedPatients && left.totalPatients !== right.totalPatients) {
      return right.totalPatients - left.totalPatients;
    }
    const leftActiveScore = isCurrentShift(left) ? 1 : 0;
    const rightActiveScore = isCurrentShift(right) ? 1 : 0;
    if (leftActiveScore !== rightActiveScore) {
      return rightActiveScore - leftActiveScore;
    }
    if (!hasBookedPatients && left.totalPatients !== right.totalPatients) {
      return right.totalPatients - left.totalPatients;
    }
    const leftStart = toTimestamp(left.startTime) ?? 0;
    const rightStart = toTimestamp(right.startTime) ?? 0;
    return leftStart - rightStart;
  })[0];
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
        const active = pickBestShift(shifts);

        if (active) {
          setActiveShiftId(active.id);
        } else {
          setError('Không có ca làm việc nào trong hôm nay.');
          setLoading(false);
        }
      } catch (fetchError) {
        console.error('Failed to find active shift:', fetchError);
        setError('Không thể tìm ca làm việc hiện tại.');
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
      setError('Không thể tải danh sách hàng chờ.');
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
    WAITING: queueItems.filter(
      (item) =>
        item.status === 'WAITING' ||
        item.status === 'CHECKED_IN' ||
        item.status === 'RESULTS_READY',
    ).length,
    IN_CONSULTATION: queueItems.filter((item) => item.status === 'IN_CONSULTATION').length,
    COMPLETED: queueItems.filter((item) => item.status === 'COMPLETED').length,
  };

  const getTimeSinceUpdate = () => {
    const seconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
    if (seconds < 60) return `${seconds} giây trước`;

    const minutes = Math.floor(seconds / 60);
    return `${minutes} phút trước`;
  };

  const handleStartConsultation = async (bookingId: string) => {
    try {
      setInvitingBookingId(bookingId);
      setError(null);
      await consultationApi.invitePatient(bookingId);
      navigate(`/doctor/consultation/${bookingId}`);
    } catch (inviteError) {
      console.error('Failed to invite patient:', inviteError);
      setError('Không thể mời bệnh nhân vào phòng khám.');
    } finally {
      setInvitingBookingId(null);
    }
  };

  return (
    <div className="min-h-full bg-[#f4f7fa] p-6 md:p-8 lg:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <OpsPageHeader
          eyebrow="Queue bác sĩ"
          title="Điều phối hàng chờ khám"
          description={`Cập nhật lần cuối: ${getTimeSinceUpdate()}`}
        />

        {error && (
          <div className="surface-alert flex items-start justify-between gap-3">
            <p>{error}</p>
            <button onClick={() => setError(null)} className="rounded-lg p-1 hover:bg-red-100">
              <span className="material-symbols-outlined text-base text-red-500">close</span>
            </button>
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            loading={loading}
            title="Tổng bệnh nhân"
            value={counts.ALL}
            icon="group"
            tone="default"
          />
          <StatCard
            loading={loading}
            title="Chờ check-in"
            value={counts.BOOKED}
            icon="event_available"
            tone="sky"
          />
          <StatCard
            loading={loading}
            title="Đang chờ khám"
            value={counts.WAITING}
            icon="hourglass_top"
            tone="primary"
          />
          <StatCard
            loading={loading}
            title="Hoàn thành"
            value={counts.COMPLETED}
            icon="check_circle"
            tone="emerald"
          />
        </section>

        <section className="ops-panel">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="relative w-full md:w-96">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="input-field pl-10"
                placeholder="Tìm theo tên, SĐT hoặc CMND..."
              />
            </div>

            <div className="flex w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 md:w-auto">
              {statusFilters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    statusFilter === filter.value
                      ? 'bg-white text-primary shadow-soft'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  {filter.label} ({counts[filter.value] || 0})
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="ops-panel overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  <th className="w-20 px-6 py-4">STT</th>
                  <th className="px-6 py-4">Bệnh nhân</th>
                  <th className="px-6 py-4">Lịch / Check-in</th>
                  <th className="px-6 py-4">Dịch vụ</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading && queueItems.length === 0 && (
                  <>
                    {[1, 2, 3, 4, 5].map((index) => (
                      <tr key={index} className="animate-pulse">
                        <td className="px-6 py-4">
                          <div className="h-6 w-12 rounded bg-slate-200"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-slate-200"></div>
                            <div className="space-y-2">
                              <div className="h-4 w-32 rounded bg-slate-200"></div>
                              <div className="h-3 w-24 rounded bg-slate-200"></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-24 rounded bg-slate-200"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-28 rounded bg-slate-200"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-6 w-24 rounded-full bg-slate-200"></div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="ml-auto h-8 w-24 rounded-lg bg-slate-200"></div>
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
                            ? 'bg-amber-50/50 hover:bg-amber-50'
                            : isBooked
                              ? 'bg-sky-50/40 hover:bg-sky-50'
                              : isCompleted
                                ? 'bg-slate-50/50 opacity-75 hover:opacity-100'
                                : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="px-6 py-4">
                          <span
                            className={`text-lg font-bold ${
                              isExamining
                                ? 'text-amber-700'
                                : isBooked
                                  ? 'text-sky-700'
                                  : isCompleted
                                    ? 'text-slate-400'
                                    : 'text-slate-500'
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
                                  ? 'bg-slate-200 text-slate-500'
                                  : avatarColors[index % avatarColors.length]
                              }`}
                            >
                              {getInitials(item.patient.fullName)}
                            </div>

                            <div>
                              <p
                                className={`font-bold ${isCompleted ? 'text-slate-700' : 'text-slate-900'}`}
                              >
                                {item.patient.fullName}
                              </p>
                              <div
                                className={`flex flex-wrap gap-x-3 gap-y-1 text-xs ${isCompleted ? 'text-slate-400' : 'text-slate-500'}`}
                              >
                                <span>SĐT: {item.patient.phone}</span>
                                <span>Slot #{item.slotSequence}</span>
                                <span>{getChannelLabel(item.channel)}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <p
                              className={`font-medium ${isCompleted ? 'text-slate-500' : 'text-slate-600'}`}
                            >
                              Giờ hẹn {formatTime(item.appointmentTime)}
                            </p>
                            <p className="text-xs text-slate-400">
                              {item.checkInAt
                                ? `Check-in ${formatTime(item.checkInAt)}`
                                : 'Chưa check-in'}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className={isCompleted ? 'text-slate-500' : 'text-slate-600'}>
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
                            <button className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-200 hover:text-primary">
                              <span className="material-symbols-outlined">history</span>
                            </button>
                          ) : isExamining ? (
                            <Link
                              to={`/doctor/consultation/${item.id}`}
                              className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                edit_note
                              </span>
                              Tiếp tục
                            </Link>
                          ) : isBooked ? (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-500">
                              <span className="material-symbols-outlined text-[18px]">
                                schedule
                              </span>
                              Chờ check-in
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
                                <span className="material-symbols-outlined text-[18px]">
                                  play_arrow
                                </span>
                              )}
                              Mời vào khám
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">Đang xử lý</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>

            {!loading && filteredItems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 rounded-full bg-slate-100 p-6">
                  <span className="material-symbols-outlined text-4xl text-slate-400">
                    assignment_turned_in
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">Không có bệnh nhân</h3>
                <p className="mt-2 max-w-xs text-slate-500">
                  {searchQuery
                    ? 'Không tìm thấy bệnh nhân phù hợp với từ khóa tìm kiếm.'
                    : 'Hiện không có bệnh nhân nào trong hàng chờ cho ca làm việc này.'}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  loading,
  title,
  value,
  icon,
  tone,
}: {
  loading: boolean;
  title: string;
  value: number;
  icon: string;
  tone: 'default' | 'sky' | 'primary' | 'emerald';
}) {
  const toneClass = {
    default: {
      value: 'text-slate-900',
      iconWrap: 'bg-slate-100 text-slate-500',
    },
    sky: {
      value: 'text-sky-600',
      iconWrap: 'bg-sky-50 text-sky-600',
    },
    primary: {
      value: 'text-primary',
      iconWrap: 'bg-primary/10 text-primary',
    },
    emerald: {
      value: 'text-emerald-600',
      iconWrap: 'bg-emerald-50 text-emerald-600',
    },
  }[tone];

  return (
    <div className="ops-stat relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-[20px] bg-white/70 backdrop-blur-[1px]">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className={`mt-1 text-3xl font-bold ${toneClass.value}`}>{value}</p>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${toneClass.iconWrap}`}
        >
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      </div>
    </div>
  );
}
