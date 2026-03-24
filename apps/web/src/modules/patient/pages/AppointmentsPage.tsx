import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { FlatTaskHeader } from '../../../components/ClinicUI';
import { customerApi } from '../api';
import { PatientFooter } from '../components/PatientFooter';
import { PatientNavbar } from '../components/PatientNavbar';
import { QRTicket } from '../components/QRTicket';
import type { BookingTicket, PatientBooking } from '../types';

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
    bg: 'bg-primary/10',
    text: 'text-primary',
    dot: 'bg-primary',
    icon: 'event',
  },
  IN_PROGRESS: {
    label: 'Đang xử lý',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    icon: 'stethoscope',
  },
  COMPLETED: {
    label: 'Đã hoàn tất',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    dot: 'bg-slate-400',
    icon: 'check_circle',
  },
  CANCELED: {
    label: 'Đã hủy',
    bg: 'bg-red-50',
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

const STATUS_STEPS = [
  { key: 'BOOKED', label: 'Đã đặt lịch', icon: 'event' },
  { key: 'IN_PROGRESS', label: 'Đang khám', icon: 'stethoscope' },
  { key: 'COMPLETED', label: 'Hoàn thành', icon: 'check_circle' },
] as const;

function getDisplayStatus(raw: string): DisplayStatus {
  if (raw === 'BOOKED') return 'BOOKED';
  if (IN_PROGRESS_STATUSES.has(raw)) return 'IN_PROGRESS';
  if (raw === 'COMPLETED') return 'COMPLETED';
  return 'CANCELED';
}

function canCancel(booking: PatientBooking): boolean {
  if (booking.status !== 'BOOKED') return false;
  const startTime = booking.timeRange.split(' - ')[0] ?? '07:00';
  const [hour, minute] = startTime.split(':').map(Number);
  const appointmentDate = new Date(
    `${booking.date}T${String(hour).padStart(2, '0')}:${String(minute ?? 0).padStart(2, '0')}:00`,
  );
  return appointmentDate.getTime() - Date.now() > 24 * 60 * 60 * 1000;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function toBookingTicket(booking: PatientBooking, patientName: string, phone: string): BookingTicket {
  return {
    bookingId: booking.bookingId,
    queueNumber: booking.queueNumber,
    slotSequence: booking.slotSequence,
    patientName,
    patientPhone: phone,
    doctorName: booking.doctorName,
    specialty: booking.specialty,
    date: booking.date,
    shiftType: booking.shiftType,
    timeRange: booking.timeRange,
    serviceName: booking.serviceName,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    createdAt: booking.createdAt,
    appointmentTime: booking.appointmentTime,
    currentServingQueueNumber: booking.currentServingQueueNumber,
    estimatedTurnAt: booking.estimatedTurnAt,
  };
}

function StatusStepper({ rawStatus }: { rawStatus: string }) {
  const current = getDisplayStatus(rawStatus);
  if (current === 'CANCELED') return null;

  const order: DisplayStatus[] = ['BOOKED', 'IN_PROGRESS', 'COMPLETED'];
  const currentIndex = order.indexOf(current);

  return (
    <div className="mt-4 flex items-center gap-0 overflow-x-auto">
      {STATUS_STEPS.map((step, index) => {
        const isDone = index < currentIndex;
        const isActive = index === currentIndex;
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  isDone
                    ? 'bg-primary text-white'
                    : isActive
                      ? 'border border-primary bg-primary/10 text-primary'
                      : 'bg-slate-100 text-slate-400'
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {isDone ? 'check' : step.icon}
                </span>
              </div>
              <span
                className={`mt-1 whitespace-nowrap text-xs font-medium ${
                  isActive ? 'text-primary' : isDone ? 'text-slate-700' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < STATUS_STEPS.length - 1 && (
              <div
                className={`mb-4 h-px w-12 sm:w-20 ${index < currentIndex ? 'bg-primary' : 'bg-slate-200'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function BookingAppointmentCard({
  booking,
  phone,
  patientName,
  onCanceled,
}: {
  booking: PatientBooking;
  phone: string;
  patientName: string;
  onCanceled: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const displayStatus = getDisplayStatus(booking.status);
  const cfg = STATUS_CONFIG[displayStatus];
  const cancelAllowed = canCancel(booking);
  const queryClient = useQueryClient();
  const ticket = toBookingTicket(booking, patientName, phone);

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
      className={`clinic-card p-5 ${displayStatus === 'CANCELED' ? 'opacity-70' : ''}`}
      data-testid={`patient-appointments-card-${booking.bookingId}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-200 text-slate-700">
            <span className="material-symbols-outlined">person</span>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-semibold text-slate-950">{booking.doctorName}</h3>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.text}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            </div>
            {booking.specialty && <p className="mt-1 text-xs text-slate-500">{booking.specialty}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {displayStatus !== 'CANCELED' && (
            <button
              type="button"
              onClick={() => setQrOpen(true)}
              className="btn-secondary px-3 py-2"
              data-testid={`patient-appointments-open-qr-${booking.bookingId}`}
            >
              <span className="material-symbols-outlined text-base">qr_code_2</span>
              <span>Mã QR</span>
            </button>
          )}
          {cancelAllowed && !confirmOpen && (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="rounded-2xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
              data-testid={`patient-appointments-open-cancel-${booking.bookingId}`}
            >
              Hủy lịch
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-base text-slate-400">calendar_today</span>
          {formatDate(booking.date)}
        </span>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-base text-slate-400">schedule</span>
          {booking.timeRange}
        </span>
        {booking.serviceName && (
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-base text-slate-400">medical_services</span>
            {booking.serviceName}
          </span>
        )}
        {booking.queueNumber && (
          <span className="flex items-center gap-1 font-semibold text-primary">
            <span className="material-symbols-outlined text-base">format_list_numbered</span>
            STT: {booking.queueNumber}
          </span>
        )}
      </div>

      {displayStatus !== 'CANCELED' && <StatusStepper rawStatus={booking.status} />}

      {confirmOpen && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">Xác nhận hủy lịch khám?</p>
          <p className="mt-1 text-xs text-red-600">
            Thao tác này không thể hoàn tác và lịch hẹn sẽ bị hủy ngay lập tức.
          </p>
          {cancelMutation.isError && (
            <p className="mt-3 rounded-xl bg-red-100 p-2 text-xs text-red-700">
              {(cancelMutation.error as Error)?.message ?? 'Hủy lịch thất bại, vui lòng thử lại sau.'}
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="btn-danger px-4 py-2"
              data-testid={`patient-appointments-confirm-cancel-${booking.bookingId}`}
            >
              {cancelMutation.isPending ? 'Đang hủy' : 'Xác nhận hủy'}
            </button>
            <button
              onClick={() => setConfirmOpen(false)}
              disabled={cancelMutation.isPending}
              className="btn-secondary px-4 py-2"
            >
              Giữ lại
            </button>
          </div>
        </div>
      )}

      {qrOpen && (
        <div className="clinic-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="clinic-modal-panel max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-base font-semibold text-slate-900">Phiếu khám và mã QR</h4>
              <button
                type="button"
                onClick={() => setQrOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
            <QRTicket ticket={ticket} />
          </div>
        </div>
      )}
    </div>
  );
}

function PhoneLookupPanel({ onLookup }: { onLookup: (phone: string) => void }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const phone = input.trim();
    if (!phone) {
      setError('Vui lòng nhập số điện thoại.');
      return;
    }
    if (!/^0\d{9}$/.test(phone)) {
      setError('Số điện thoại không hợp lệ. Ví dụ: 0901234567.');
      return;
    }
    setError('');
    onLookup(phone);
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="clinic-card p-6 sm:p-7">
        <div className="border-b border-slate-200 pb-5">
          <h2 className="text-lg font-semibold text-slate-950">Tra cứu bằng số điện thoại</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Dùng đúng số điện thoại đã đặt lịch để mở lại các cuộc hẹn, phiếu khám và mã QR.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4" data-testid="patient-appointments-lookup-form">
          <div>
            <label className="field-label">Số điện thoại</label>
            <input
              type="tel"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ví dụ: 0901234567"
              className={`input-field ${error ? 'border-red-300 bg-red-50' : ''}`}
              data-testid="patient-appointments-phone"
            />
            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          </div>
          <button type="submit" className="btn-primary" data-testid="patient-appointments-submit">
            Tra cứu lịch hẹn
          </button>
        </form>
      </div>

      <aside className="clinic-card p-5">
        <p className="text-sm font-semibold text-slate-950">Từ trang này bạn có thể</p>
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-950">Mở phiếu khám</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">Xem lại mã QR và thông tin check-in.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-950">Theo dõi trạng thái</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">Biết lịch đang chờ, đang khám hay đã hoàn tất.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-950">Hủy lịch khi còn hạn</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">Chỉ áp dụng cho lịch chưa bắt đầu và đủ điều kiện.</p>
          </div>
        </div>
      </aside>
    </section>
  );
}

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

  const handleLookup = (value: string) => {
    setPhone(value);
    setLookedUp(true);
    setCanceledMsg(false);
  };

  const handleReset = () => {
    setPhone('');
    setLookedUp(false);
    setCanceledMsg(false);
  };

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
        const orderA = order[a.status as keyof typeof order] ?? 3;
        const orderB = order[b.status as keyof typeof order] ?? 3;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      })
    : [];

  const upcomingCount = sortedBookings.filter(
    (booking) => booking.status === 'BOOKED' || IN_PROGRESS_STATUSES.has(booking.status),
  ).length;

  return (
    <div className="clinic-page" data-testid="patient-appointments-page">
      <PatientNavbar />

      <main className="clinic-section space-y-6">
        <FlatTaskHeader
          icon="event_available"
          eyebrow="Lịch hẹn"
          title="Tra cứu lịch khám, trạng thái xử lý và phiếu check-in"
          description="Trang này chỉ tập trung vào lịch hẹn hiện có: mở phiếu khám, kiểm tra trạng thái và hủy lịch khi còn đủ điều kiện."
          actions={
            <Link to="/booking" className="btn-secondary">
              <span className="material-symbols-outlined text-base">calendar_add_on</span>
              <span>Đặt lịch mới</span>
            </Link>
          }
        />

        {!lookedUp && <PhoneLookupPanel onLookup={handleLookup} />}

        {lookedUp && patientQuery.isLoading && (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-slate-500">Đang tra cứu dữ liệu lịch hẹn...</p>
          </div>
        )}

        {lookedUp && patientQuery.isError && (
          <div className="clinic-card mx-auto max-w-3xl p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300">person_off</span>
            <h3 className="mt-3 font-semibold text-slate-900">Không tìm thấy hồ sơ</h3>
            <p className="mt-2 text-sm text-slate-600">
              Số điện thoại <strong>{phone}</strong> chưa có lịch hẹn hoặc chưa được đăng ký tại phòng khám.
            </p>
            <button onClick={handleReset} className="btn-secondary mt-5">
              Thử lại với số khác
            </button>
          </div>
        )}

        {patientQuery.data && (
          <div className="mx-auto max-w-4xl space-y-4">
            <div className="clinic-card p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-700">
                    {patientQuery.data.fullName?.slice(0, 1).toUpperCase() ?? 'P'}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-950">{patientQuery.data.fullName}</p>
                    <p className="text-sm text-slate-500">{phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {upcomingCount > 0 && (
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {upcomingCount} lịch sắp tới
                    </span>
                  )}
                  <button
                    onClick={handleReset}
                    className="text-sm font-medium text-slate-500 transition-colors hover:text-primary"
                  >
                    Đổi số điện thoại
                  </button>
                </div>
              </div>
            </div>

            {canceledMsg && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
                Hủy lịch khám thành công.
              </div>
            )}

            {bookingsQuery.isLoading && (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="clinic-card animate-pulse p-5">
                    <div className="flex gap-3">
                      <div className="h-11 w-11 rounded-full bg-slate-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-40 rounded bg-slate-200" />
                        <div className="h-3 w-24 rounded bg-slate-200" />
                        <div className="h-3 w-56 rounded bg-slate-200" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!bookingsQuery.isLoading && sortedBookings.length > 0 && (
              <div className="space-y-4">
                {sortedBookings.map((booking) => (
                  <BookingAppointmentCard
                    key={booking.bookingId}
                    booking={booking}
                    phone={phone}
                    patientName={patientQuery.data.fullName}
                    onCanceled={() => setCanceledMsg(true)}
                  />
                ))}
              </div>
            )}

            {!bookingsQuery.isLoading && sortedBookings.length === 0 && (
              <div className="clinic-empty">
                <span className="material-symbols-outlined text-6xl text-slate-300">event_busy</span>
                <p className="mt-4 text-lg font-medium text-slate-700">Chưa có lịch hẹn nào</p>
                <p className="mt-2 text-sm text-slate-500">
                  Bắt đầu bằng cách đặt lịch khám với bác sĩ hoặc dịch vụ phù hợp.
                </p>
                <Link to="/booking" className="btn-primary mt-6">
                  <span className="material-symbols-outlined text-base">calendar_add_on</span>
                  <span>Đặt lịch khám</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </main>

      <PatientFooter />
    </div>
  );
}
