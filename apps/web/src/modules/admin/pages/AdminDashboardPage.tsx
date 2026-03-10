import { useEffect, useState } from 'react';

import { adminApi } from '../api';
import type { DashboardStats, ShiftOverview } from '../types';

export function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [shifts, setShifts] = useState<ShiftOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [statsData, shiftsData] = await Promise.all([
          adminApi.getDashboardStats(today),
          adminApi.getTodayShifts(today),
        ]);
        setStats(statsData);
        setShifts(shiftsData);
      } catch {
        setError('Không thể tải dữ liệu. Vui lòng thử lại.');
        // Fallback data while backend is loading
        setStats({
          todayPatients: 24,
          waitingCount: 5,
          inConsultationCount: 2,
          completedCount: 15,
          unpaidCount: 3,
          revenue: 4500000,
          webBookings: 14,
          walkInBookings: 10,
        });
        setShifts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [today]);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(cents);
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const statCards = [
    {
      label: 'Tổng BN hôm nay',
      value: stats?.todayPatients ?? 0,
      icon: 'groups',
      color: 'blue',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Đang chờ khám',
      value: stats?.waitingCount ?? 0,
      icon: 'schedule',
      color: 'amber',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Đang khám',
      value: stats?.inConsultationCount ?? 0,
      icon: 'stethoscope',
      color: 'purple',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      label: 'Đã hoàn thành',
      value: stats?.completedCount ?? 0,
      icon: 'check_circle',
      color: 'green',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'Chờ thanh toán',
      value: stats?.unpaidCount ?? 0,
      icon: 'payments',
      color: 'red',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    {
      label: 'Doanh thu hôm nay',
      value: formatCurrency(stats?.revenue ?? 0),
      icon: 'account_balance',
      color: 'emerald',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      isText: true,
    },
  ];

  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-background-dark">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Error banner */}
        {error && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">
              info
            </span>
            <p className="text-sm text-amber-700 dark:text-amber-400">{error}</p>
          </div>
        )}

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard tổng quan</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{formatDate()}</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-shadow relative"
            >
              {loading && (
                <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {card.label}
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                    {card.isText ? card.value : card.value}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center`}
                >
                  <span className={`material-symbols-outlined ${card.iconColor} text-[28px]`}>
                    {card.icon}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Booking Channel Split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Web vs Walk-in */}
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
              Kênh đặt lịch
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 dark:text-slate-400">Đặt qua Web</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {stats?.webBookings ?? 0}
                  </span>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${stats && stats.todayPatients > 0 ? (stats.webBookings / stats.todayPatients) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 dark:text-slate-400">Khách vãng lai</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {stats?.walkInBookings ?? 0}
                  </span>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${stats && stats.todayPatients > 0 ? (stats.walkInBookings / stats.todayPatients) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
              Thao tác nhanh
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: 'Check-in BN',
                  icon: 'how_to_reg',
                  href: '/admin/reception',
                  color: 'bg-blue-500',
                },
                {
                  label: 'Thu ngân',
                  icon: 'point_of_sale',
                  href: '/admin/cashier',
                  color: 'bg-green-500',
                },
                {
                  label: 'Tạo ca làm',
                  icon: 'event_available',
                  href: '/admin/shifts',
                  color: 'bg-purple-500',
                },
                {
                  label: 'Xem báo cáo',
                  icon: 'assessment',
                  href: '/admin/reports',
                  color: 'bg-amber-500',
                },
              ].map((action) => (
                <a
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div
                    className={`w-9 h-9 rounded-lg ${action.color} flex items-center justify-center`}
                  >
                    <span className="material-symbols-outlined text-white text-[18px]">
                      {action.icon}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {action.label}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Today's Shifts Overview */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Ca làm việc hôm nay
            </h3>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 rounded-lg bg-slate-100 dark:bg-slate-700 animate-pulse"
                  />
                ))}
              </div>
            ) : shifts.length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">
                  event_busy
                </span>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  Chưa có ca làm việc nào hôm nay
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {shifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          shift.type === 'MORNING'
                            ? 'bg-amber-50 dark:bg-amber-900/20'
                            : 'bg-indigo-50 dark:bg-indigo-900/20'
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined text-[20px] ${
                            shift.type === 'MORNING'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-indigo-600 dark:text-indigo-400'
                          }`}
                        >
                          {shift.type === 'MORNING' ? 'wb_sunny' : 'wb_twilight'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {shift.doctorName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {shift.type === 'MORNING' ? 'Ca sáng' : 'Ca chiều'} • {shift.startTime} -{' '}
                          {shift.endTime}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {shift.bookedSlots}/{shift.totalSlots}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">đã đặt</p>
                      </div>
                      <div
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          shift.status === 'OPEN'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                        }`}
                      >
                        {shift.status === 'OPEN' ? 'Đang mở' : 'Đã đóng'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
