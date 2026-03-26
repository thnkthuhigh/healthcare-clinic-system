import { useEffect, useState } from 'react';

import { OpsPageHeader } from '../../../components/ClinicUI';
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
    <div className="min-h-full bg-[#f4f7fa]">
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <OpsPageHeader
          eyebrow="Thiết lập bác sĩ"
          title="Thông tin tài khoản"
          description="Quản lý thông tin cá nhân và các thiết lập liên quan đến tài khoản bác sĩ."
        />

        <section className="ops-panel">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-4xl">person</span>
            </div>
            <div>
              {loading ? (
                <div className="space-y-2">
                  <div className="h-5 w-44 animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-slate-950">{doctor?.displayName}</h2>
                  <p className="mt-1 text-sm text-slate-500">{doctor?.specialty || 'Bác sĩ'}</p>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="ops-panel overflow-hidden p-0">
          <div className="border-b border-slate-200 px-6 py-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
              Thông tin cá nhân
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {infoRows.map((row) => (
              <div
                key={row.label}
                className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3 text-slate-500">
                  <span className="material-symbols-outlined text-[18px]">{row.icon}</span>
                  <span className="text-sm">{row.label}</span>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {loading ? (
                    <span className="inline-block h-4 w-28 animate-pulse rounded bg-slate-200" />
                  ) : (
                    row.value || '—'
                  )}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="ops-panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Bảo mật phiên làm việc</h3>
              <p className="mt-1 text-sm text-slate-500">
                Sử dụng đăng xuất khi hoàn tất ca để bảo vệ dữ liệu bệnh nhân.
              </p>
            </div>
            <button
              onClick={logout}
              className="btn-danger px-5 py-2.5"
              data-testid="doctor-settings-logout"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              <span>Đăng xuất</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
