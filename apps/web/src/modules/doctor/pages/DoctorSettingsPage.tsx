import { useEffect, useState } from 'react';

import { useAuth } from '../../auth/useAuth';
import { doctorApi } from '../api';
import type { Doctor } from '../types';

export function DoctorSettingsPage() {
  const { user, logout } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    doctorApi
      .getProfile(user.id)
      .then(setDoctor)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const infoRows = [
    { icon: 'badge', label: 'Họ và tên', value: doctor?.displayName },
    { icon: 'stethoscope', label: 'Chuyên khoa', value: doctor?.specialty || 'Chưa cập nhật' },
    { icon: 'phone', label: 'Số điện thoại', value: doctor?.phone },
    { icon: 'work', label: 'Vai trò', value: 'Bác sĩ' },
  ];

  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-background-dark p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cài đặt</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản lý thông tin cá nhân và tài khoản
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {/* Banner */}
          <div className="h-24 bg-gradient-to-r from-primary/80 to-teal-500/80" />

          <div className="px-6 pb-6 -mt-10">
            <div className="w-20 h-20 rounded-2xl border-4 border-white dark:border-slate-800 bg-primary/10 flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-primary text-4xl">person</span>
            </div>

            {loading ? (
              <div className="mt-4 space-y-2 animate-pulse">
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-40" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-28" />
              </div>
            ) : (
              <div className="mt-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {doctor?.displayName}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {doctor?.specialty || 'Bác sĩ'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Info List */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
          <div className="px-5 py-3.5 flex items-center gap-3">
            <span className="material-symbols-outlined text-slate-400 text-[20px]">
              account_circle
            </span>
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
              Thông tin cá nhân
            </h3>
          </div>
          {infoRows.map((row) => (
            <div key={row.label} className="px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400 text-[18px]">
                  {row.icon}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">{row.label}</span>
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {loading ? (
                  <span className="inline-block w-24 h-3.5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                ) : (
                  row.value || '—'
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Security */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
          <div className="px-5 py-3.5 flex items-center gap-3">
            <span className="material-symbols-outlined text-slate-400 text-[20px]">security</span>
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Bảo mật</h3>
          </div>
          <div className="px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-slate-400 text-[18px]">lock</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">Mật khẩu</span>
            </div>
            <button className="text-xs text-primary hover:text-primary/80 font-semibold transition-colors">
              Đổi mật khẩu
            </button>
          </div>
          <div className="px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-slate-400 text-[18px]">
                calendar_today
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">Ngày tham gia</span>
            </div>
            <span className="text-sm text-slate-600 dark:text-slate-300">
              {new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Logout */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <button
            onClick={logout}
            className="w-full px-5 py-4 flex items-center gap-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-xl"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="text-sm font-semibold">Đăng xuất</span>
          </button>
        </div>
      </div>
    </div>
  );
}
