import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { PatientFooter } from '../components/PatientFooter';
import { PatientNavbar } from '../components/PatientNavbar';
import { customerApi } from '../api';
import type { PatientBooking } from '../types';

// ─── Status config ───────────────────────────────────────────────────────────

type DisplayStatus = 'BOOKED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';

interface StatusCfg {
  label: string;
  bg: string;
  text: string;
  dot: string;
  icon: string;
}

const STATUS_CONFIG: Record<DisplayStatus, StatusCfg> = {
  BOOKED: {
    label: 'Đã đặt lịch',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
    icon: 'event',
  },
  IN_PROGRESS: {
    label: 'Đang khám',
    bg: 'bg-green-100',
    text: 'text-green-700',
    dot: 'bg-green-500',
    icon: 'stethoscope',
  },
  COMPLETED: {
    label: 'Đã khám',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
    icon: 'check_circle',
  },
  CANCELED: {
    label: 'Đã hủy',
    bg: 'bg-red-100',
    text: 'text-red-600',
    dot: 'bg-red-400',
    icon: 'cancel',
  },
};

const IN_PROGRESS_STATUSES = new Set([
  'CHECKED_IN',
  'WAITING',
  'IN_CONSULTATION',
  'PENDING_LAB',
  'RESULTS_READY',
]);

function getDisplayStatus(raw: string): DisplayStatus {
  if (raw === 'BOOKED') return 'BOOKED';
  if (IN_PROGRESS_STATUSES.has(raw)) return 'IN_PROGRESS';
  if (raw === 'COMPLETED') return 'COMPLETED';
  return 'CANCELED';
}

// ─── Status stepper ──────────────────────────────────────────────────────────

const STATUS_STEPS = [
  { key: 'BOOKED', label: 'Đã đặt lịch', icon: 'event' },
  { key: 'IN_PROGRESS', label: 'Đã check-in / Đang khám', icon: 'stethoscope' },
  { key: 'COMPLETED', label: 'Đã khám xong', icon: 'check_circle' },
];

function StatusStepper({ rawStatus }: { rawStatus: string }) {
  const current = getDisplayStatus(rawStatus);
  if (current === 'CANCELED') return null;

  const ORDER: DisplayStatus[] = ['BOOKED', 'IN_PROGRESS', 'COMPLETED'];
  const currentIdx = ORDER.indexOf(current);

  return (
    <div className="flex items-center gap-0 mt-4 mb-1">
      {STATUS_STEPS.map((step, idx) => {
        const isDone = idx < currentIdx;
        const isActive = idx === currentIdx;
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isDone
                    ? 'bg-blue-600 text-white'
                    : isActive
                      ? 'bg-blue-100 border-2 border-blue-600 text-blue-600'
                      : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isDone ? (
                  <span className="material-symbols-outlined text-sm">check</span>
                ) : (
                  <span className="material-symbols-outlined text-sm">{step.icon}</span>
                )}
              </div>
              <span
                className={`text-xs mt-1 whitespace-nowrap font-medium ${
                  isActive ? 'text-blue-700' : isDone ? 'text-blue-500' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < STATUS_STEPS.length - 1 && (
              <div
                className={`h-0.5 w-12 sm:w-20 mb-4 transition-colors ${
                  idx < currentIdx ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Can cancel check ────────────────────────────────────────────────────────

function canCancel(booking: PatientBooking): boolean {
  if (booking.status !== 'BOOKED') return false;
  // date is YYYY-MM-DD; timeRange is e.g. "07:00 - 11:00"
  const startTime = booking.timeRange.split(' - ')[0] ?? '07:00';
  const [h, m] = startTime.split(':').map(Number);
  const apptDate = new Date(
    `${booking.date}T${String(h).padStart(2, '0')}:${String(m ?? 0).padStart(2, '0')}:00`,
  );
  const diffMs = apptDate.getTime() - Date.now();
  return diffMs > 24 * 60 * 60 * 1000;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// ─── Booking card ─────────────────────────────────────────────────────────────

function BookingCard({
  booking,
  phone,
  onCanceled,
}: {
  booking: PatientBooking;
  phone: string;
  onCanceled: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const displayStatus = getDisplayStatus(booking.status);
  const cfg = STATUS_CONFIG[displayStatus];
  const cancelAllowed = canCancel(booking);
  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    mutationFn: () => customerApi.cancelBooking(booking.bookingId, phone),
    onSuccess: () => {
      setConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ['patient-bookings'] });
      onCanceled();
    },
  });

  return (
    <div
      className={`bg-white rounded-2xl border p-5 transition-all ${
        displayStatus === 'CANCELED'
          ? 'border-slate-200 opacity-60'
          : 'border-slate-200 hover:shadow-md hover:border-blue-200'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        {/* Left: doctor info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-blue-600">person</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-slate-900 truncate">{booking.doctorName}</h3>
              <span
                className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            </div>
            {booking.specialty && (
              <p className="text-xs text-slate-500 mt-0.5">{booking.specialty}</p>
            )}
          </div>
        </div>

        {/* Right: cancel btn */}
        {cancelAllowed && !confirmOpen && (
          <button
            onClick={() => setConfirmOpen(true)}
            className="flex-shrink-0 text-sm text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors font-medium"
          >
            Hủy lịch
          </button>
        )}
      </div>

      {/* Details row */}
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-slate-600">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-slate-400 text-base">calendar_today</span>
          {formatDate(booking.date)}
        </span>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-slate-400 text-base">schedule</span>
          {booking.timeRange}
          {' · '}
          {booking.shiftType === 'MORNING' ? 'Buổi sáng' : 'Buổi chiều'}
        </span>
        {booking.serviceName && (
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-slate-400 text-base">
              medical_services
            </span>
            {booking.serviceName}
          </span>
        )}
        {booking.queueNumber && (
          <span className="flex items-center gap-1 font-semibold text-blue-700">
            <span className="material-symbols-outlined text-blue-400 text-base">
              format_list_numbered
            </span>
            STT: {booking.queueNumber}
          </span>
        )}
      </div>

      {/* Stepper — only for non-canceled */}
      {displayStatus !== 'CANCELED' && (
        <div className="mt-3 overflow-x-auto">
          <StatusStepper rawStatus={booking.status} />
        </div>
      )}

      {/* Confirm cancel dialog */}
      {confirmOpen && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-medium text-red-800 mb-1">Xác nhận hủy lịch khám?</p>
          <p className="text-xs text-red-600 mb-3">
            Thao tác này không thể hoàn tác. Lịch sẽ bị hủy ngay lập tức.
          </p>
          {cancelMutation.isError && (
            <p className="text-xs text-red-700 bg-red-100 rounded p-2 mb-3">
              {(cancelMutation.error as Error)?.message ?? 'Hủy lịch thất bại, thử lại sau'}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-60"
            >
              {cancelMutation.isPending ? 'Đang hủy...' : 'Xác nhận hủy'}
            </button>
            <button
              onClick={() => setConfirmOpen(false)}
              disabled={cancelMutation.isPending}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50 transition-colors"
            >
              Giữ lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Phone lookup form ────────────────────────────────────────────────────────

function PhoneLookupForm({ onLookup }: { onLookup: (phone: string) => void }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const phone = input.trim();
    if (!phone) {
      setError('Vui lòng nhập số điện thoại');
      return;
    }
    if (!/^0\d{9}$/.test(phone)) {
      setError('Số điện thoại không hợp lệ (ví dụ: 0901234567)');
      return;
    }
    setError('');
    onLookup(phone);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md mx-auto shadow-sm">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-blue-600 text-3xl">search</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Tra cứu lịch khám</h2>
        <p className="text-slate-500 text-sm mt-1">
          Nhập số điện thoại đã đăng ký để xem lịch khám
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Số điện thoại</label>
          <input
            type="tel"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ví dụ: 0901234567"
            className={`w-full px-4 py-3 rounded-xl border text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              error ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'
            }`}
          />
          {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
        </div>
        <button
          type="submit"
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          Tra cứu lịch khám
        </button>
      </form>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AppointmentsPage() {
  const [phone, setPhone] = useState('');
  const [lookedUp, setLookedUp] = useState(false);
  const [canceledMsg, setCanceledMsg] = useState(false);

  const patientQuery = useQuery({
    queryKey: ['patient-lookup', phone],
    queryFn: () => customerApi.lookupPatient(phone),
    enabled: lookedUp && !!phone,
    retry: false,
  });

  const bookingsQuery = useQuery({
    queryKey: ['patient-bookings', patientQuery.data?.id],
    queryFn: () => customerApi.getPatientBookings(patientQuery.data!.id),
    enabled: !!patientQuery.data?.id,
  });

  function handleLookup(p: string) {
    setPhone(p);
    setLookedUp(true);
    setCanceledMsg(false);
  }

  function handleReset() {
    setPhone('');
    setLookedUp(false);
    setCanceledMsg(false);
  }

  // Sort: upcoming first, then by date desc
  const sortedBookings = bookingsQuery.data
    ? [...bookingsQuery.data].sort((a, b) => {
        const order = {
          BOOKED: 0,
          CHECKED_IN: 1,
          WAITING: 1,
          IN_CONSULTATION: 1,
          PENDING_LAB: 1,
          RESULTS_READY: 1,
          COMPLETED: 2,
          NO_SHOW: 3,
          CANCELED: 3,
        };
        const oa = order[a.status as keyof typeof order] ?? 3;
        const ob = order[b.status as keyof typeof order] ?? 3;
        if (oa !== ob) return oa - ob;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      })
    : [];

  const upcomingCount = sortedBookings.filter(
    (b) => b.status === 'BOOKED' || IN_PROGRESS_STATUSES.has(b.status),
  ).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <PatientNavbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-700 to-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-4">
            <span className="material-symbols-outlined text-sm">event_available</span>
            <span className="text-sm font-medium">Tra cứu & quản lý lịch khám</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Lịch khám của tôi</h1>
          <p className="text-slate-300 max-w-lg mx-auto text-sm">
            Xem lịch sắp tới, theo dõi trạng thái và hủy lịch nếu cần
          </p>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Not looked up yet → show form */}
        {!lookedUp && <PhoneLookupForm onLookup={handleLookup} />}

        {/* Looking up */}
        {lookedUp && patientQuery.isLoading && (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500">Đang tra cứu...</p>
          </div>
        )}

        {/* Patient not found */}
        {lookedUp && patientQuery.isError && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
            <span className="material-symbols-outlined text-amber-400 text-4xl block mb-3">
              person_off
            </span>
            <h3 className="font-semibold text-amber-800 mb-1">Không tìm thấy hồ sơ</h3>
            <p className="text-amber-700 text-sm mb-5">
              Số điện thoại <strong>{phone}</strong> chưa có lịch khám hoặc chưa đăng ký tại phòng
              khám.
            </p>
            <button
              onClick={handleReset}
              className="px-5 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors font-medium text-sm"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Found patient → show bookings */}
        {patientQuery.data && (
          <>
            {/* Patient header */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {patientQuery.data.fullName?.slice(0, 1).toUpperCase() ?? 'P'}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{patientQuery.data.fullName}</p>
                  <p className="text-sm text-slate-500">{phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {upcomingCount > 0 && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                    {upcomingCount} lịch sắp tới
                  </span>
                )}
                <button
                  onClick={handleReset}
                  className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  Đổi SĐT
                </button>
              </div>
            </div>

            {/* Canceled success toast */}
            {canceledMsg && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-green-600 text-xl">
                  check_circle
                </span>
                <p className="text-sm text-green-700 font-medium">Hủy lịch khám thành công.</p>
              </div>
            )}

            {/* Bookings loading */}
            {bookingsQuery.isLoading && (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse"
                  >
                    <div className="flex gap-3">
                      <div className="w-11 h-11 bg-slate-200 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-40" />
                        <div className="h-3 bg-slate-200 rounded w-24" />
                        <div className="h-3 bg-slate-200 rounded w-56" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bookings list */}
            {!bookingsQuery.isLoading && sortedBookings.length > 0 && (
              <div className="space-y-4">
                {sortedBookings.map((b) => (
                  <BookingCard
                    key={b.bookingId}
                    booking={b}
                    phone={phone}
                    onCanceled={() => setCanceledMsg(true)}
                  />
                ))}
              </div>
            )}

            {/* Empty bookings */}
            {!bookingsQuery.isLoading && sortedBookings.length === 0 && (
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-slate-300 text-6xl block mb-4">
                  event_busy
                </span>
                <p className="text-slate-500 text-lg font-medium">Chưa có lịch khám nào</p>
                <p className="text-slate-400 text-sm mt-1 mb-6">Đặt lịch ngay để gặp bác sĩ!</p>
                <a
                  href="/booking"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  <span className="material-symbols-outlined text-sm">calendar_add_on</span>
                  Đặt lịch khám
                </a>
              </div>
            )}
          </>
        )}
      </main>

      <PatientFooter />
    </div>
  );
}
