import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../auth/useAuth';
import { doctorApi } from '../api';
import type { Shift } from '../types';

function getShiftStatus(shift: Shift) {
  if (shift.status === 'CLOSED' || shift.completedCount === shift.totalPatients) {
    return { label: 'Hoàn thành', color: 'green' };
  }
  if (shift.inConsultationCount > 0 || shift.waitingCount > 0) {
    return { label: 'Đang diễn ra', color: 'amber' };
  }
  return { label: 'Sắp tới', color: 'slate' };
}

export function DoctorDashboardPage() {
  const { user } = useAuth();
  const [selectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tính tổng số liệu
  const totalAppointments = shifts.reduce((sum, s) => sum + s.totalPatients, 0);
  const totalWaiting = shifts.reduce((sum, s) => sum + s.waitingCount + s.checkedInCount, 0);
  const totalCompleted = shifts.reduce((sum, s) => sum + s.completedCount, 0);

  // Fetch shifts from API
  useEffect(() => {
    const fetchShifts = async () => {
      if (!user) return;
      try {
        setLoading(true);
        setError(null);
        const doctor = await doctorApi.getProfile(user.id);
        const data = await doctorApi.getShifts(doctor.id, selectedDate || undefined);
        setShifts(data);
      } catch (err) {
        console.error('Failed to fetch shifts:', err);
        setError('Không thể tải danh sách ca làm việc. Vui lòng thử lại.');
        setShifts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchShifts();
  }, [selectedDate, user]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-background-dark">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">
              info
            </span>
            <p className="text-sm text-amber-700 dark:text-amber-400">{error}</p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Tổng quan ca làm việc
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {selectedDate && formatDate(selectedDate)}
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[20px] text-slate-600 dark:text-slate-400">
              calendar_today
            </span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Chọn ngày khác
            </span>
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tổng lượt khám */}
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-shadow relative">
            {loading && (
              <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Tổng lượt khám
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                  {totalAppointments}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[28px]">
                  groups
                </span>
              </div>
            </div>
          </div>

          {/* Đang chờ */}
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-shadow relative">
            {loading && (
              <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Đang chờ</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                  {totalWaiting}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
                  {shifts.reduce((sum, s) => sum + s.checkedInCount, 0)} đã check-in
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[28px]">
                  schedule
                </span>
              </div>
            </div>
          </div>

          {/* Đã hoàn thành */}
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-shadow relative">
            {loading && (
              <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Đã hoàn thành
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                  {totalCompleted}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium">
                  {totalAppointments > 0
                    ? Math.round((totalCompleted / totalAppointments) * 100)
                    : 0}
                  % tiến độ
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-[28px]">
                  check_circle
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Schedule */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Lịch làm việc hôm nay
            </h2>
          </div>

          <div className="p-6 space-y-4">
            {loading ? (
              // Loading skeleton
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 animate-pulse"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32" />
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24" />
                      </div>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : shifts.length === 0 ? (
              // Empty state
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-5xl">
                  event_busy
                </span>
                <p className="text-slate-500 dark:text-slate-400 mt-3">
                  Không có ca làm việc nào trong ngày này
                </p>
              </div>
            ) : (
              shifts.map((shift) => {
                const status = getShiftStatus(shift);
                const progress = (shift.completedCount / shift.totalPatients) * 100;

                return (
                  <div
                    key={shift.id}
                    className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary/50 dark:hover:border-primary/50 transition-all bg-slate-50/50 dark:bg-slate-800/50"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                          <span className="material-symbols-outlined text-primary text-[26px]">
                            schedule
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                            Ca{' '}
                            {shift.type === 'MORNING'
                              ? 'sáng'
                              : shift.type === 'AFTERNOON'
                                ? 'chiều'
                                : 'tối'}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            {shift.timeRange}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                            status.color === 'green'
                              ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : status.color === 'amber'
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {status.label}
                        </span>
                        {shift.id && (
                          <Link
                            to={`/doctor/queue/${shift.id}`}
                            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm"
                          >
                            <span>Xem hàng chờ</span>
                            <span className="material-symbols-outlined text-[18px]">
                              arrow_forward
                            </span>
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">
                          Tiến độ: {shift.completedCount}/{shift.totalPatients} bệnh nhân
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {Math.round(progress)}%
                        </span>
                      </div>
                      <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-teal-500 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-5 pt-2 flex-wrap">
                        {shift.waitingCount > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="material-symbols-outlined text-amber-500 text-[20px]">
                              schedule
                            </span>
                            <span className="text-slate-600 dark:text-slate-400">
                              {shift.waitingCount} đang chờ
                            </span>
                          </div>
                        )}
                        {shift.checkedInCount > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="material-symbols-outlined text-blue-500 text-[20px]">
                              login
                            </span>
                            <span className="text-slate-600 dark:text-slate-400">
                              {shift.checkedInCount} đã check-in
                            </span>
                          </div>
                        )}
                        {shift.inConsultationCount > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="material-symbols-outlined text-green-500 text-[20px]">
                              stethoscope
                            </span>
                            <span className="text-slate-600 dark:text-slate-400">
                              {shift.inConsultationCount} đang khám
                            </span>
                          </div>
                        )}
                        {shift.completedCount > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="material-symbols-outlined text-green-600 text-[20px]">
                              check_circle
                            </span>
                            <span className="text-slate-600 dark:text-slate-400">
                              {shift.completedCount} hoàn thành
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
