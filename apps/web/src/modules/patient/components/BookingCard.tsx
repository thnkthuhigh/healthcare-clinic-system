import { formatDateUtc7, formatTimeUtc7 } from '../../../lib/time';
import type { PatientBooking } from '../types';

interface BookingCardProps {
  booking: PatientBooking;
  onViewPrescription: () => void;
  onViewLabResults: () => void;
  onRate: () => void;
  onCancel?: () => void;
}

const SHIFT_LABEL: Record<string, string> = {
  MORNING: 'Buổi sáng',
  AFTERNOON: 'Buổi chiều',
};

const STATUS_LABEL: Record<string, string> = {
  BOOKED: 'Đã đặt',
  CHECKED_IN: 'Đã check-in',
  WAITING: 'Đang chờ',
  IN_CONSULTATION: 'Đang khám',
  PENDING_LAB: 'Chờ xét nghiệm',
  RESULTS_READY: 'Có kết quả',
  COMPLETED: 'Đã hoàn thành',
  NO_SHOW: 'Vắng mặt',
  CANCELED: 'Đã hủy',
};

const STATUS_COLOR: Record<string, string> = {
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  CANCELED: 'bg-red-50 text-red-600',
  NO_SHOW: 'bg-red-50 text-red-600',
  BOOKED: 'bg-primary/10 text-primary',
  CHECKED_IN: 'bg-sky-50 text-sky-700',
  WAITING: 'bg-amber-50 text-amber-700',
  IN_CONSULTATION: 'bg-slate-100 text-slate-700',
  PENDING_LAB: 'bg-orange-50 text-orange-700',
  RESULTS_READY: 'bg-teal-50 text-teal-700',
};

function formatMoney(cents: number) {
  return `${Math.round(cents / 100).toLocaleString('vi-VN')} đ`;
}

function formatDateValue(value: string) {
  return formatDateUtc7(value, {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatTimeValue(value: string | null) {
  if (!value) return '--:--';
  return formatTimeUtc7(value, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatActualWindow(booking: PatientBooking) {
  const checkIn = formatTimeValue(booking.checkInAt);
  const completed = formatTimeValue(booking.completedAt);
  if (booking.checkInAt && booking.completedAt) return `${checkIn} - ${completed}`;
  if (booking.completedAt) return `Hoàn thành lúc ${completed}`;
  if (booking.checkInAt) return `Check-in lúc ${checkIn}`;
  return `Dự kiến ${formatTimeValue(booking.appointmentTime)}`;
}

function formatDisplayWindow(booking: PatientBooking) {
  if (booking.checkInAt || booking.completedAt) {
    return formatActualWindow(booking);
  }
  return booking.timeRange;
}

function getDisplayWindowLabel(booking: PatientBooking) {
  if (booking.checkInAt || booking.completedAt) {
    return 'Khung giờ thực tế';
  }
  return 'Khung giờ dự kiến';
}

export function BookingCard({
  booking,
  onViewPrescription,
  onViewLabResults,
  onRate,
  onCancel,
}: BookingCardProps) {
  const isPaid = booking.paymentStatus === 'PAID';
  const isCompleted = booking.status === 'COMPLETED';
  const hasMedicalResult = Boolean(booking.medicalRecord);
  const hasPrescription = Boolean(booking.prescription);
  const diagnosis = booking.medicalRecord?.diagnosis?.trim();
  const serviceAndLabCents = booking.servicePriceCents + (booking.labFeeCents ?? 0);

  return (
    <article className="clinic-card overflow-hidden" data-testid={`patient-record-card-${booking.bookingId}`}>
      <header className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-soft">
            <span className="material-symbols-outlined text-[20px]">clinical_notes</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-950">{booking.doctorName}</p>
            <p className="mt-1 text-xs text-slate-500">{booking.specialty ?? 'Đa khoa'}</p>
          </div>
        </div>
        <span
          className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLOR[booking.status] ?? 'bg-slate-100 text-slate-500'}`}
        >
          {STATUS_LABEL[booking.status] ?? booking.status}
        </span>
      </header>

      <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_220px]">
        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {booking.serviceName && <Tag>{booking.serviceName}</Tag>}
            <Tag>{SHIFT_LABEL[booking.shiftType] ?? booking.shiftType}</Tag>
            {booking.followUp && (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                Tái khám
              </span>
            )}
            {!isCompleted && booking.queueNumber != null && (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                STT {booking.queueNumber}
              </span>
            )}
          </div>

          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <InfoBlock label="Ngày khám" value={formatDateValue(booking.date)} />
            <InfoBlock label={getDisplayWindowLabel(booking)} value={formatDisplayWindow(booking)} />
            {booking.followUp && booking.followUpScheduledAt ? (
              <InfoBlock
                label="Lịch tái khám"
                value={formatDateUtc7(booking.followUpScheduledAt, {
                  weekday: 'short',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              />
            ) : null}
            <InfoBlock label="Dịch vụ đã khám" value={booking.serviceName ?? 'Khám theo chỉ định'} />
            <InfoBlock
              label="Tổng chi phí"
              value={isPaid ? `Đã thanh toán ${formatMoney(booking.totalBillCents)}` : 'Chưa thanh toán'}
            />
            <InfoBlock label="Phí khám + xét nghiệm" value={formatMoney(serviceAndLabCents)} />
            {booking.labFeeCents > 0 && (
              <InfoBlock label="Phí xét nghiệm" value={formatMoney(booking.labFeeCents)} />
            )}
            {diagnosis ? (
              <InfoBlock label="Chẩn đoán" value={diagnosis} />
            ) : (
              <InfoBlock label="Chẩn đoán" value="Chưa cập nhật" />
            )}
          </dl>

          {isCompleted && isPaid && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              {booking.ratingStars !== null ? (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: 5 }, (_, index) => (
                      <span key={index} className="material-symbols-outlined text-sm">
                        {index < (booking.ratingStars ?? 0) ? 'star' : 'star_outline'}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-slate-500">
                    {booking.ratingComment ? `"${booking.ratingComment}"` : 'Bạn đã gửi đánh giá'}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onRate}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  data-testid={`patient-record-rate-${booking.bookingId}`}
                >
                  <span className="material-symbols-outlined text-base">rate_review</span>
                  <span>Gửi đánh giá cho bác sĩ</span>
                </button>
              )}
            </div>
          )}
        </section>

        <aside className="p-0">
          <p className="mb-2 text-xs uppercase tracking-[0.12em] text-slate-400">Tài liệu và thao tác</p>
          <div className="space-y-2">
            {isCompleted ? (
              !isPaid ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs leading-6 text-amber-700">
                  Buổi khám đã hoàn tất. Vui lòng thanh toán tại quầy để mở tài liệu chi tiết.
                </div>
              ) : (
                <>
                  {hasMedicalResult && (
                    <button
                      type="button"
                      onClick={onViewLabResults}
                      className="btn-secondary w-full justify-start px-3 py-2 text-xs"
                      data-testid={`patient-record-view-medical-${booking.bookingId}`}
                    >
                      <span className="material-symbols-outlined text-sm">lab_profile</span>
                      <span>Xem kết quả khám</span>
                    </button>
                  )}
                  {hasPrescription && (
                    <button
                      type="button"
                      onClick={onViewPrescription}
                      className="btn-secondary w-full justify-start px-3 py-2 text-xs"
                      data-testid={`patient-record-view-prescription-${booking.bookingId}`}
                    >
                      <span className="material-symbols-outlined text-sm">description</span>
                      <span>Xem đơn thuốc</span>
                    </button>
                  )}
                </>
              )
            ) : booking.status === 'BOOKED' ? (
              <button
                type="button"
                onClick={() => onCancel?.()}
                className="w-full rounded-xl border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
              >
                Hủy lịch khám
              </button>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-6 text-slate-500">
                Kết quả khám và đơn thuốc sẽ hiển thị khi buổi khám hoàn tất.
              </div>
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}

function Tag({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
      {children}
    </span>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <dt className="text-xs uppercase tracking-[0.12em] text-slate-400">{label}</dt>
      <dd className="mt-2 text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  );
}
