import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { OpsPageHeader } from '../../../components/ClinicUI';
import { formatDateUtc7, toIsoDateUtc7 } from '../../../lib/time';
import { useAuth } from '../../auth/useAuth';
import { doctorApi } from '../api';
import type { Shift } from '../types';

function getShiftStatus(shift: Shift) {
  if (shift.status === 'CLOSED' || shift.completedCount === shift.totalPatients) {
    return { label: 'Hoàn thành', style: 'bg-emerald-50 text-emerald-700' };
  }
  if (shift.inConsultationCount > 0 || shift.waitingCount > 0) {
    return { label: 'Đang diễn ra', style: 'bg-amber-50 text-amber-700' };
  }
  return { label: 'Sắp tới', style: 'bg-slate-100 text-slate-600' };
}

export function DoctorDashboardPage() {
  const { user } = useAuth();
  const [selectedDate] = useState(() => toIsoDateUtc7());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalAppointments = shifts.reduce((sum, shift) => sum + shift.totalPatients, 0);
  const totalWaiting = shifts.reduce(
    (sum, shift) => sum + shift.waitingCount + shift.checkedInCount,
    0,
  );
  const totalCompleted = shifts.reduce((sum, shift) => sum + shift.completedCount, 0);

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

  const formattedDate = formatDateUtc7(selectedDate, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-full bg-slate-100">
      <div className="mx-auto max-w-7xl p-6 space-y-6">
        <OpsPageHeader
          eyebrow="Dashboard bác sĩ"
          title="Tổng quan ca làm việc"
          description={formattedDate}
        />

        {error && (
          <div className="surface-alert">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">info</span>
              <p>{error}</p>
            </div>
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          <div className="ops-stat relative">
            {loading && <LoadingMask />}
            <p className="text-sm font-medium text-slate-500">Tổng lượt khám</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">{totalAppointments}</p>
            <p className="mt-2 text-xs text-slate-500">Tổng số bệnh nhân trong các ca đã phân.</p>
          </div>

          <div className="ops-stat relative">
            {loading && <LoadingMask />}
            <p className="text-sm font-medium text-slate-500">Đang chờ và đã check-in</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">{totalWaiting}</p>
            <p className="mt-2 text-xs text-slate-500">
              {shifts.reduce((sum, shift) => sum + shift.checkedInCount, 0)} bệnh nhân đã check-in.
            </p>
          </div>

          <div className="ops-stat relative">
            {loading && <LoadingMask />}
            <p className="text-sm font-medium text-slate-500">Đã hoàn thành</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">{totalCompleted}</p>
            <p className="mt-2 text-xs text-slate-500">
              {totalAppointments > 0 ? Math.round((totalCompleted / totalAppointments) * 100) : 0}%
              tiến độ hôm nay.
            </p>
          </div>
        </section>

        <section className="ops-panel">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <p className="ops-section-label">Ca làm việc</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">Lịch khám trong ngày</h2>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-[24px] border border-slate-200 p-5 animate-pulse"
                >
                  <div className="h-5 w-40 rounded bg-slate-200" />
                  <div className="mt-3 h-3 w-24 rounded bg-slate-200" />
                  <div className="mt-4 h-2 w-full rounded bg-slate-200" />
                </div>
              ))
            ) : shifts.length === 0 ? (
              <div className="py-12 text-center">
                <span className="material-symbols-outlined text-5xl text-slate-300">
                  event_busy
                </span>
                <p className="mt-3 text-slate-500">Không có ca làm việc nào trong ngày này.</p>
              </div>
            ) : (
              shifts.map((shift) => {
                const status = getShiftStatus(shift);
                const progress =
                  shift.totalPatients > 0 ? (shift.completedCount / shift.totalPatients) * 100 : 0;

                return (
                  <div
                    key={shift.id}
                    className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <span className="material-symbols-outlined text-[22px]">schedule</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-slate-950">
                              Ca{' '}
                              {shift.type === 'MORNING'
                                ? 'sáng'
                                : shift.type === 'AFTERNOON'
                                  ? 'chiều'
                                  : 'tối'}
                            </h3>
                            <p className="text-sm text-slate-500">{shift.timeRange}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`ops-chip ${status.style}`}>{status.label}</span>
                        <Link to={`/doctor/queue/${shift.id}`} className="btn-primary px-4 py-2.5">
                          <span>Xem hàng chờ</span>
                          <span className="material-symbols-outlined text-base">arrow_forward</span>
                        </Link>
                      </div>
                    </div>

                    <div className="mt-5 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">
                          Tiến độ: {shift.completedCount}/{shift.totalPatients} bệnh nhân
                        </span>
                        <span className="font-semibold text-slate-950">
                          {Math.round(progress)}%
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-amber-500">
                          schedule
                        </span>
                        {shift.waitingCount} đang chờ
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-blue-500">
                          login
                        </span>
                        {shift.checkedInCount} đã check-in
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-emerald-500">
                          stethoscope
                        </span>
                        {shift.inConsultationCount} đang khám
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function LoadingMask() {
  return (
    <div className="absolute inset-0 rounded-[24px] bg-white/60 backdrop-blur-[1px]">
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    </div>
  );
}
