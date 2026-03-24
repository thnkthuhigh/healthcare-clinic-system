import { useState } from 'react';

import type { AvailableShift, BookingTicket, ClinicService, DoctorSummary } from '../types';

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

const SHIFT_LABEL: Record<string, string> = {
  MORNING: 'Buổi sáng',
  AFTERNOON: 'Buổi chiều',
};

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
      <div className="clinic-card overflow-hidden rounded-[24px]">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
          <p className="font-semibold text-slate-950">Tóm tắt lịch hẹn</p>
        </div>
        <div className="space-y-2 px-5 py-5 text-sm">
          <Row label="Bác sĩ" value={doctor?.displayName ?? '-'} />
          <Row label="Chuyên khoa" value={doctor?.specialty ?? 'Đa khoa'} />
          <Row
            label="Ca khám"
            value={shift ? `${SHIFT_LABEL[shift.type] ?? shift.type} • ${shift.timeRange}` : '-'}
          />
          <Row
            label="Ngày khám"
            value={
              shift
                ? new Date(`${shift.date}T00:00:00`).toLocaleDateString('vi-VN', {
                    weekday: 'long',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })
                : '-'
            }
          />
          <Row label="Dịch vụ" value={service?.name ?? 'Khám theo chỉ định khi tiếp nhận'} />
          <div className="mt-3 border-t border-dashed border-slate-200 pt-3">
            <Row label="Bệnh nhân" value={patientName} />
            <Row label="Số điện thoại" value={patientPhone} />
          </div>
          {service && (
            <div className="mt-3 border-t border-dashed border-slate-200 pt-3">
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

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-1 accent-[color:#2d7a7c]"
          data-testid="patient-booking-payment-confirm"
        />
        <span>
          Tôi xác nhận thông tin trên là chính xác và đồng ý chuyển sang bước thanh toán mô phỏng để
          lưu lịch hẹn.
        </span>
      </label>

      <div className="surface-note">
        <div className="flex gap-2">
          <span className="material-symbols-outlined text-sm text-primary">payments</span>
          <p>
            Đây là bước mô phỏng thanh toán trong môi trường thử nghiệm. Sau khi xác nhận, hệ thống
            sẽ tạo phiếu khám và lưu trạng thái lịch hẹn cho bệnh nhân.
          </p>
        </div>
      </div>

      <button
        type="button"
        disabled={!confirmed || paying}
        onClick={onPay}
        className="btn-primary w-full"
        data-testid="patient-booking-pay"
      >
        {paying ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span>Đang xử lý thanh toán</span>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-base">payments</span>
            <span>Thanh toán và tạo phiếu khám</span>
          </>
        )}
      </button>
    </div>
  );
}

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="flex-shrink-0 text-slate-500">{label}</span>
      <span className={`text-right ${bold ? 'font-semibold text-primary' : 'text-slate-800'}`}>
        {value}
      </span>
    </div>
  );
}
