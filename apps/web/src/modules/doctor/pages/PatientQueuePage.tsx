import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useAuth } from '../../auth/useAuth';
import { doctorApi } from '../api';
import type { QueueItem, BookingStatus } from '../types';

type FilterStatus = 'ALL' | BookingStatus;

const statusFilters: { value: FilterStatus; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'WAITING', label: 'Đang chờ' },
  { value: 'IN_CONSULTATION', label: 'Đang khám' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
];

function getStatusBadge(status: BookingStatus) {
  switch (status) {
    case 'IN_CONSULTATION':
      return {
        label: 'Đang khám',
        bgClass: 'bg-amber-100 dark:bg-amber-900/40',
        textClass: 'text-amber-700 dark:text-amber-300',
        borderClass: 'border-amber-200 dark:border-amber-800',
        pulse: true,
      };
    case 'WAITING':
    case 'CHECKED_IN':
      return {
        label: 'Đang chờ',
        bgClass: 'bg-slate-100 dark:bg-slate-800',
        textClass: 'text-slate-600 dark:text-slate-400',
        borderClass: '',
        pulse: false,
      };
    case 'COMPLETED':
      return {
        label: 'Hoàn thành',
        bgClass: 'bg-emerald-50 dark:bg-emerald-900/20',
        textClass: 'text-emerald-600 dark:text-emerald-400',
        borderClass: '',
        pulse: false,
      };
    case 'RESULTS_READY':
      return {
        label: 'Kết quả sẵn sàng',
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
  return new Date(isoString).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
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
  const { user } = useAuth();
  const { shiftId: paramShiftId } = useParams<{ shiftId: string }>();
  const [activeShiftId, setActiveShiftId] = useState<string | null>(paramShiftId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [newPatientToast, setNewPatientToast] = useState<string | null>(null);

  // Handle missing shiftId
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
        const doctor = await doctorApi.getProfile(user.id);
        const shifts = await doctorApi.getShifts(doctor.id);

        // Find current or next shift
        const active = shifts.find((s) => s.status !== 'CLOSED') || shifts[0];

        if (active) {
          setActiveShiftId(active.id);
        } else {
          setLoading(false);
          setError('Không có ca làm việc nào trong hôm nay');
        }
      } catch (err) {
        console.error('Failed to find active shift:', err);
        setLoading(false);
        setError('Không thể tìm ca làm việc hiện tại');
      }
    };

    findActiveShift();
  }, [paramShiftId, user]);

  // Fetch queue data
  const fetchQueue = useCallback(async () => {
    if (!activeShiftId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await doctorApi.getQueue(
        activeShiftId,
        statusFilter === 'ALL' ? undefined : statusFilter,
      );
      setQueueItems(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch queue:', err);
      setError('Không thể tải danh sách hàng chờ');
    } finally {
      setLoading(false);
    }
  }, [activeShiftId, statusFilter]);

  // Initial fetch
  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Real-time updates with polling (every 10 seconds)
  useEffect(() => {
    if (!activeShiftId) return;

    const interval = setInterval(() => {
      fetchQueue();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [activeShiftId, fetchQueue]);

  // Filter queue items (client-side search)
  const filteredItems = queueItems.filter((item) => {
    const matchesSearch =
      searchQuery === '' ||
      item.patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.patient.phone.includes(searchQuery) ||
      (item.patient.nationalId && item.patient.nationalId.includes(searchQuery));
    return matchesSearch;
  });

  // Count by status
  const counts = {
    ALL: queueItems.length,
    WAITING: queueItems.filter((i) => i.status === 'WAITING' || i.status === 'CHECKED_IN').length,
    IN_CONSULTATION: queueItems.filter((i) => i.status === 'IN_CONSULTATION').length,
    COMPLETED: queueItems.filter((i) => i.status === 'COMPLETED').length,
  };

  // Format last updated time
  const getTimeSinceUpdate = () => {
    const seconds = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000);
    if (seconds < 60) return `${seconds} giây trước`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes} phút trước`;
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 space-y-6">
      {/* Toast Notification for New Patient */}
      {newPatientToast && (
        <div className="fixed top-6 right-6 z-50 animate-bounce">
          <div className="flex items-center gap-3 bg-white dark:bg-[#1e2739] border-l-4 border-primary shadow-lg rounded-r-lg p-4 max-w-sm w-full">
            <div className="bg-primary/10 p-2 rounded-full text-primary">
              <span className="material-symbols-outlined text-[20px]">person_add</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                Bệnh nhân mới
              </p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                {newPatientToast} đã được thêm vào hàng chờ.
              </p>
            </div>
            <button
              onClick={() => setNewPatientToast(null)}
              className="ml-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">
            warning
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">{error}</p>
            <button
              onClick={fetchQueue}
              className="mt-2 text-sm text-amber-700 dark:text-amber-300 underline hover:no-underline"
            >
              Thử lại
            </button>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          to="/doctor/dashboard"
          className="text-slate-500 hover:text-primary dark:text-slate-400 transition-colors"
        >
          Tổng quan
        </Link>
        <span className="material-symbols-outlined text-[14px] text-slate-400">chevron_right</span>
        <span className="font-semibold text-slate-800 dark:text-slate-200">Quản lý hàng chờ</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Hàng chờ: Ca làm việc
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Quản lý luồng bệnh nhân và khám bệnh hôm nay
          </p>
          <p className="text-xs text-slate-400">Cập nhật lần cuối: {getTimeSinceUpdate()}</p>
        </div>
        <button
          className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all active:scale-95 group"
          onClick={fetchQueue}
        >
          <span className="material-symbols-outlined group-hover:animate-pulse">refresh</span>
          Làm mới
        </button>
      </div>

      {/* Stats with Loading */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#151b2b] p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-[#151b2b]/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tổng bệnh nhân</p>
            <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{counts.ALL}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
            <span className="material-symbols-outlined">group</span>
          </div>
        </div>
        <div className="bg-white dark:bg-[#151b2b] p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-[#151b2b]/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Đang chờ</p>
            <p className="text-3xl font-bold text-primary mt-1">{counts.WAITING}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">hourglass_top</span>
          </div>
        </div>
        <div className="bg-white dark:bg-[#151b2b] p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-[#151b2b]/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Hoàn thành</p>
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {counts.COMPLETED}
            </p>
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
            placeholder="Tìm theo tên, SĐT hoặc CMND..."
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
              <th className="px-6 py-4 w-20">STT</th>
              <th className="px-6 py-4">Bệnh nhân</th>
              <th className="px-6 py-4">Check-in</th>
              <th className="px-6 py-4">Dịch vụ</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {/* Loading Skeleton */}
            {loading && queueItems.length === 0 && (
              <>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="h-6 w-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
                          <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded-lg ml-auto"></div>
                    </td>
                  </tr>
                ))}
              </>
            )}

            {/* Actual Data */}
            {!loading &&
              filteredItems.map((item, index) => {
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
                            {item.patient.nationalId
                              ? `CMND: ${item.patient.nationalId.slice(-6)}`
                              : `SĐT: ${item.patient.phone.slice(-6)}`}
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
                          Tiếp tục
                        </Link>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/doctor/consultation/${item.id}`}
                            className="text-primary hover:text-primary-dark transition-colors p-2 rounded-full hover:bg-primary/10"
                            title="Bắt đầu khám"
                          >
                            <span className="material-symbols-outlined">play_arrow</span>
                          </Link>
                          <button
                            className="text-slate-400 hover:text-primary dark:hover:text-primary-light transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Tùy chọn khác"
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
        {!loading && filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-4">
              <span className="material-symbols-outlined text-4xl text-slate-400">
                assignment_turned_in
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Không có bệnh nhân!
            </h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-xs mt-2">
              {searchQuery
                ? 'Không tìm thấy bệnh nhân phù hợp với từ khóa tìm kiếm.'
                : 'Hiện không có bệnh nhân nào trong hàng chờ cho ca làm việc này.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
