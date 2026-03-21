import type { PatientBooking } from '../types';

interface BookingCardProps {
  booking: PatientBooking;
  onViewPrescription: () => void;
  onViewLabResults: () => void;
  onRate: () => void;
  onCancel?: () => void;
}

const SHIFT_LABEL: Record<string, string> = { MORNING: 'Buổi sáng', AFTERNOON: 'Buổi chiều' };

const STATUS_LABEL: Record<string, string> = {
  BOOKED: 'Đã đặt',
  CHECKED_IN: 'Đã check-in',
  WAITING: 'Đang chờ',
  IN_CONSULTATION: 'Đang khám',
  PENDING_LAB: 'Chờ XN',
  RESULTS_READY: 'Có kết quả',
  COMPLETED: 'Đã hoàn thành',
  NO_SHOW: 'Không đến',
  CANCELED: 'Đã hủy',
};

const STATUS_COLOR: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELED: 'bg-red-100 text-red-500',
  NO_SHOW: 'bg-red-100 text-red-500',
  BOOKED: 'bg-blue-100 text-blue-700',
  CHECKED_IN: 'bg-cyan-100 text-cyan-700',
  WAITING: 'bg-yellow-100 text-yellow-700',
  IN_CONSULTATION: 'bg-purple-100 text-purple-700',
  PENDING_LAB: 'bg-orange-100 text-orange-700',
  RESULTS_READY: 'bg-teal-100 text-teal-700',
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

  const dateDisplay = new Date(booking.date + 'T00:00:00').toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-soft overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100">
        <span className="text-xs text-slate-500">{dateDisplay}</span>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[booking.status] ?? 'bg-slate-100 text-slate-500'}`}
        >
          {STATUS_LABEL[booking.status] ?? booking.status}
        </span>
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-1.5 text-sm">
        <p className="font-semibold text-slate-800">{booking.doctorName}</p>
        <p className="text-xs text-slate-500">{booking.specialty ?? 'Đa khoa'}</p>
        <p className="text-xs text-slate-500">
          {SHIFT_LABEL[booking.shiftType] ?? booking.shiftType} — {booking.timeRange}
        </p>
        {booking.serviceName && (
          <p className="text-xs text-slate-500">Dịch vụ: {booking.serviceName}</p>
        )}
      </div>

      {/* Footer */}
      {isCompleted && (
        <div className="px-4 pb-3 space-y-2">
          {!isPaid ? (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700 flex items-center gap-1.5">
              ⏳ <span>Đang xử lý — chờ thanh toán tại quầy</span>
            </div>
          ) : (
            <div className="flex gap-2">
              {booking.prescription && (
                <button
                  type="button"
                  onClick={onViewPrescription}
                  className="flex-1 rounded-lg border border-primary text-primary text-xs font-medium py-1.5 hover:bg-primary/5 transition-colors"
                >
                  💊 Xem Đơn Thuốc
                </button>
              )}
              {booking.medicalRecord && (
                <button
                  type="button"
                  onClick={onViewLabResults}
                  className="flex-1 rounded-lg border border-teal-600 text-teal-600 text-xs font-medium py-1.5 hover:bg-teal-50 transition-colors"
                >
                  🧪 Xem Kết Quả XN
                </button>
              )}
            </div>
          )}

          {/* Rating */}
          {isPaid && (
            <div>
              {booking.ratingStars !== null ? (
                <div className="flex items-center gap-1 text-xs text-amber-400">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i}>{i < (booking.ratingStars ?? 0) ? '★' : '☆'}</span>
                  ))}
                  <span className="text-slate-500 ml-1">
                    {booking.ratingComment ? `"${booking.ratingComment}"` : 'Đã đánh giá'}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onRate}
                  className="text-xs text-slate-500 underline hover:text-primary"
                >
                  ⭐ Gửi đánh giá bác sĩ
                </button>
              )}
            </div>
          )}
        </div>
      )}
      {/* Cancel action for BOOKED (if allowed) */}
      {booking.status === 'BOOKED' && (
        <div className="px-4 pb-3 mt-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onCancel?.()}
              className="flex-1 rounded-lg border border-red-200 text-red-600 text-xs font-medium py-2 hover:bg-red-50 transition-colors"
            >
              Hủy lịch
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
