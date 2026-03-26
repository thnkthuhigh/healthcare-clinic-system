import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { OpsPageHeader } from '../../../components/ClinicUI';
import { formatDateUtc7, formatTimeUtc7, toIsoDateUtc7 } from '../../../lib/time';
import { useAuth } from '../../auth/useAuth';
import { consultationApi, doctorApi } from '../api';
import type { Doctor, ScheduleShift } from '../types';

type PendingLabRow = {
  shift: ScheduleShift;
  booking: ScheduleShift['bookings'][number];
};

function formatTime(value: string | null | undefined) {
  if (!value) return '--:--';
  return formatTimeUtc7(value, { hour: '2-digit', minute: '2-digit' });
}

function shiftTypeLabel(type: ScheduleShift['type']) {
  return type === 'MORNING' ? 'Ca sáng' : 'Ca chiều';
}

function resolveApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

function pushDoctorNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body });
  } catch {
    // no-op
  }
}

export function DoctorLabPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => toIsoDateUtc7());
  const [schedule, setSchedule] = useState<ScheduleShift[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [resultSummary, setResultSummary] = useState('');
  const [impression, setImpression] = useState('');
  const [lastReturnedShiftId, setLastReturnedShiftId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [queueNotice, setQueueNotice] = useState<string | null>(null);
  const previousPendingCountRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    doctorApi
      .getProfile(user.id)
      .then(setDoctor)
      .catch((err) => setError(resolveApiErrorMessage(err, 'Không thể tải thông tin bác sĩ.')));
  }, [user]);

  useEffect(() => {
    const fetchLabQueue = async () => {
      if (!doctor) return;

      try {
        setLoading(true);
        setError(null);
        const data = await doctorApi.getScheduleDetails(doctor.id, selectedDate, selectedDate);
        setSchedule(data);
      } catch (fetchError) {
        console.error('Failed to load lab queue:', fetchError);
        setError(
          resolveApiErrorMessage(fetchError, 'Không thể tải danh sách bệnh nhân chờ xét nghiệm.'),
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLabQueue();
  }, [doctor, selectedDate]);

  const pendingRows = useMemo<PendingLabRow[]>(() => {
    return schedule
      .flatMap((shift) =>
        shift.bookings
          .filter((booking) => booking.status === 'PENDING_LAB')
          .map((booking) => ({ shift, booking })),
      )
      .sort((left, right) => {
        const byAppointment = left.booking.appointmentTime.localeCompare(
          right.booking.appointmentTime,
        );
        if (byAppointment !== 0) return byAppointment;

        const leftQueue = left.booking.queueNumber ?? Number.MAX_SAFE_INTEGER;
        const rightQueue = right.booking.queueNumber ?? Number.MAX_SAFE_INTEGER;
        if (leftQueue !== rightQueue) {
          return leftQueue - rightQueue;
        }

        return left.booking.slotSequence - right.booking.slotSequence;
      });
  }, [schedule]);

  const selectedQueueOrder = useMemo(() => {
    if (!selectedBookingId) return null;
    const idx = pendingRows.findIndex((row) => row.booking.id === selectedBookingId);
    return idx >= 0 ? idx + 1 : null;
  }, [pendingRows, selectedBookingId]);

  useEffect(() => {
    const currentCount = pendingRows.length;
    const previousCount = previousPendingCountRef.current;
    if (previousCount !== null && currentCount > previousCount) {
      const added = currentCount - previousCount;
      const message = `Có ${added} bệnh nhân mới được chuyển sang khu xét nghiệm.`;
      setQueueNotice(message);
      pushDoctorNotification('Cập nhật xét nghiệm', message);
    }
    previousPendingCountRef.current = currentCount;
  }, [pendingRows.length]);

  useEffect(() => {
    if (pendingRows.length === 0) {
      setSelectedBookingId(null);
      return;
    }

    const selectedStillExists = pendingRows.some((row) => row.booking.id === selectedBookingId);
    if (!selectedStillExists) {
      setSelectedBookingId(pendingRows[0]!.booking.id);
    }
  }, [pendingRows, selectedBookingId]);

  const selectedRow = pendingRows.find((row) => row.booking.id === selectedBookingId) ?? null;

  const refreshSchedule = async () => {
    if (!doctor) return;
    const refreshed = await doctorApi.getScheduleDetails(doctor.id, selectedDate, selectedDate);
    setSchedule(refreshed);
  };

  const handleCompleteLab = async () => {
    if (!selectedRow) {
      setError('Vui lòng chọn bệnh nhân cần cập nhật kết quả.');
      return;
    }

    if (!resultSummary.trim()) {
      setError('Vui lòng nhập kết quả xét nghiệm.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await consultationApi.completeLabResult(selectedRow.booking.id, {
        resultSummary: resultSummary.trim(),
        ...(impression.trim() ? { impression: impression.trim() } : {}),
      });

      setLastReturnedShiftId(selectedRow.shift.id);
      setResultSummary('');
      setImpression('');
      setSuccessMessage(
        `Đã hoàn tất xét nghiệm cho ${selectedRow.booking.patient.fullName}. Bệnh nhân đã được trả về hàng chờ của bác sĩ.`,
      );
      pushDoctorNotification(
        'Hoàn tất xét nghiệm',
        `Đã trả bệnh nhân ${selectedRow.booking.patient.fullName} về hàng chờ bác sĩ.`,
      );
      await refreshSchedule();
    } catch (completeError) {
      console.error('Failed to complete lab result:', completeError);
      setError(
        resolveApiErrorMessage(completeError, 'Không thể hoàn tất xét nghiệm. Vui lòng thử lại.'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-[#f4f7fa] p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <OpsPageHeader
          eyebrow="Xét nghiệm"
          title="Xử lý kết quả xét nghiệm"
          description={`Ngày làm việc: ${formatDateUtc7(selectedDate, {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="input-field w-[180px] py-2.5"
              />
              <Link to="/doctor/queue" className="btn-secondary px-4 py-2.5">
                Về hàng chờ
              </Link>
            </div>
          }
        />

        {successMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>{successMessage}</span>
              {lastReturnedShiftId && (
                <button
                  type="button"
                  onClick={() => navigate(`/doctor/queue/${lastReturnedShiftId}`)}
                  className="btn-secondary px-3 py-1.5 text-xs"
                >
                  Mở hàng chờ của ca này
                </button>
              )}
            </div>
          </div>
        )}

        {queueNotice && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>{queueNotice}</span>
              <button
                type="button"
                onClick={() => setQueueNotice(null)}
                className="rounded p-1 hover:bg-blue-100"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="surface-alert flex items-start justify-between gap-3">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="rounded-lg p-1 hover:bg-red-100"
            >
              <span className="material-symbols-outlined text-base text-red-500">close</span>
            </button>
          </div>
        )}

        <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="ops-panel">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <p className="ops-section-label">Chờ xét nghiệm</p>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                {pendingRows.length}
              </span>
            </div>

            {loading ? (
              <div className="flex min-h-[220px] items-center justify-center">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            ) : pendingRows.length === 0 ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-4xl text-slate-300">science</span>
                <p className="mt-2 text-sm text-slate-500">
                  Không có bệnh nhân đang chờ xét nghiệm.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {pendingRows.map((row, index) => {
                  const active = row.booking.id === selectedBookingId;
                  return (
                    <button
                      key={row.booking.id}
                      type="button"
                      onClick={() => setSelectedBookingId(row.booking.id)}
                      className={`w-full rounded-xl border p-3 text-left transition-colors ${
                        active
                          ? 'border-primary bg-primary/10'
                          : 'border-slate-200 bg-white hover:border-primary/35'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">
                          #{index + 1} • {row.booking.patient.fullName}
                        </p>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                          STT xét nghiệm {index + 1}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {row.booking.patient.phone} • {shiftTypeLabel(row.shift.type)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Giờ hẹn {formatTime(row.booking.appointmentTime)}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          <section className="ops-panel">
            {!selectedRow ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-4xl text-slate-300">biotech</span>
                <p className="mt-2 text-sm text-slate-500">
                  Chọn một bệnh nhân bên trái để nhập kết quả xét nghiệm.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="ops-section-label">Thông tin ca xét nghiệm</p>
                  <h3 className="mt-2 text-lg font-bold text-slate-900">
                    {selectedRow.booking.patient.fullName}
                  </h3>
                  {selectedQueueOrder && (
                    <p className="mt-1 text-sm font-semibold text-primary">
                      Thứ tự xử lý xét nghiệm: #{selectedQueueOrder}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedRow.booking.patient.phone} •{' '}
                    {selectedRow.booking.serviceName ?? 'Khám tổng quát'}
                  </p>
                </div>

                <div>
                  <label className="field-label">
                    Kết quả xét nghiệm <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={resultSummary}
                    onChange={(event) => setResultSummary(event.target.value)}
                    className="input-field min-h-[140px] resize-y"
                    placeholder="Nhập kết quả chính: chỉ số, kết luận xét nghiệm..."
                  />
                </div>

                <div>
                  <label className="field-label">Nhận định bổ sung</label>
                  <textarea
                    value={impression}
                    onChange={(event) => setImpression(event.target.value)}
                    className="input-field min-h-[110px] resize-y"
                    placeholder="Ghi chú thêm cho bác sĩ khám..."
                  />
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCompleteLab}
                    disabled={submitting}
                    className="btn-primary px-5 py-2.5 disabled:opacity-50"
                  >
                    {submitting ? 'Đang lưu...' : 'Hoàn tất xét nghiệm'}
                  </button>
                </div>
              </div>
            )}
          </section>
        </section>
      </div>
    </div>
  );
}
