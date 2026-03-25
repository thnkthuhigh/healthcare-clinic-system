import { formatDateUtc7 } from '../../../lib/time';
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
  NO_SHOW: 'Không đến',
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

export function BookingCard({
  booking,
  onViewPrescription,
  onViewLabResults,
  onRate,
  onCancel,
}: BookingCardProps) {
  const isPaid = booking.paymentStatus === 'PAID';
  const isCompleted = booking.status === 'COMPLETED';

  const dateDisplay = formatDateUtc7(booking.date, {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="clinic-card overflow-hidden" data-testid={`patient-record-card-${booking.bookingId}`}>
      <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
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
      </div>

      <div className="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_240px]">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
              {dateDisplay}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
              {SHIFT_LABEL[booking.shiftType] ?? booking.shiftType}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
              {booking.timeRange}
            </span>
            {booking.serviceName && (
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                {booking.serviceName}
              </span>
            )}
            {booking.queueNumber && (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                STT {booking.queueNumber}
              </span>
            )}
          </div>

          <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoBlock label="Ngày khám" value={dateDisplay} />
            <InfoBlock label="Khung giờ" value={booking.timeRange} />
            <InfoBlock label="Thanh toán" value={isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'} />
          </dl>

          {isCompleted && isPaid && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
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
                    {booking.ratingComment ? `"${booking.ratingComment}"` : 'Đã gửi đánh giá'}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onRate}
                  className="text-sm font-medium text-primary hover:underline"
                  data-testid={`patient-record-rate-${booking.bookingId}`}
                >
                  Gửi đánh giá cho bác sĩ
                </button>
              )}
            </div>
          )}
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Tài liệu và thao tác</p>
          <div className="mt-4 space-y-2">
            {isCompleted ? (
              !isPaid ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs leading-6 text-amber-700">
                  Buổi khám đã hoàn tất. Vui lòng thanh toán tại quầy để mở tài liệu liên quan.
                </div>
              ) : (
                <>
                  {booking.prescription && (
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
                  {booking.medicalRecord && (
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
                Đơn thuốc và kết quả khám sẽ xuất hiện khi buổi khám đã hoàn tất.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
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
