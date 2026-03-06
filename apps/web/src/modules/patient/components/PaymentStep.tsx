import { useState } from 'react';

import type { BookingTicket, DoctorSummary, AvailableShift, ClinicService } from '../types';

interface PaymentStepProps {
  ticket: BookingTicket | null;
  doctor: DoctorSummary | null;
  shift: AvailableShift | null;
  service: ClinicService | null;
  patientName: string;
  patientPhone: string;
  onPay: () => void;
  paying: boolean;
}

const SHIFT_LABEL: Record<string, string> = { MORNING: 'Buổi sáng', AFTERNOON: 'Buổi chiều' };

export function PaymentStep({
  doctor,
  shift,
  service,
  patientName,
  patientPhone,
  onPay,
  paying,
}: PaymentStepProps) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="space-y-5">
      {/* Booking summary card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-soft overflow-hidden">
        <div className="bg-primary/10 px-4 py-3">
          <p className="font-semibold text-primary">Thông tin đặt lịch</p>
        </div>
        <div className="px-4 py-3 space-y-2 text-sm">
          <Row label="Bác sĩ" value={doctor?.displayName ?? '—'} />
          <Row label="Chuyên khoa" value={doctor?.specialty ?? 'Đa khoa'} />
          <Row
            label="Ca khám"
            value={shift ? `${SHIFT_LABEL[shift.type]} — ${shift.timeRange}` : '—'}
          />
          <Row
            label="Ngày khám"
            value={
              shift
                ? new Date(shift.date + 'T00:00:00').toLocaleDateString('vi-VN', {
                    weekday: 'long',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })
                : '—'
            }
          />
          <Row label="Dịch vụ" value={service?.name ?? 'Khám tổng quát'} />
          <div className="border-t border-dashed border-slate-200 pt-2 mt-2">
            <Row label="Bệnh nhân" value={patientName} />
            <Row label="SĐT" value={patientPhone} />
          </div>
          {service && (
            <div className="border-t border-dashed border-slate-200 pt-2 mt-2">
              <Row
                label="Phí khám"
                value={(service.priceCents / 100).toLocaleString('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                })}
                bold
              />
            </div>
          )}
        </div>
      </div>

      {/* Confirmation checkbox */}
      <label className="flex items-start gap-2 text-sm text-slate-600 cursor-pointer">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5 accent-primary"
        />
        Tôi xác nhận thông tin trên là chính xác và đồng ý tiến hành thanh toán.
      </label>

      {/* Simulated payment notice */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
        💳 <strong>Mô phỏng thanh toán (MVP):</strong> Bấm nút bên dưới để hệ thống xác nhận
        thành công và chuyển sang trạng thái BOOKED.
      </div>

      <button
        type="button"
        disabled={!confirmed || paying}
        onClick={onPay}
        className="w-full rounded-lg bg-primary py-3 text-white font-bold text-base
          hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {paying ? 'Đang xử lý...' : '💳 Thanh toán & Xác nhận'}
      </button>
    </div>
  );
}

function Row({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-500 flex-shrink-0">{label}</span>
      <span className={`text-right ${bold ? 'font-bold text-primary' : 'text-slate-700'}`}>
        {value}
      </span>
    </div>
  );
}
