import { useState } from 'react';
import QRCode from 'react-qr-code';

import { formatDateUtc7 } from '../../../lib/time';
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

const BOOKING_FEE_VND = 10_000;

function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(amount)} đ`;
}

export function PaymentStep({
  ticket,
  doctor,
  shift,
  service,
  patientName,
  patientPhone,
  onPay,
  paying,
}: PaymentStepProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [showBillPopup, setShowBillPopup] = useState(false);

  const draftBillCode = `BL-${(ticket?.bookingId ?? 'TEMP').slice(0, 8).toUpperCase()}`;
  const paymentQrValue = `HC_BOOKING_FEE|BILL:${draftBillCode}|AMOUNT:${BOOKING_FEE_VND}|PHONE:${patientPhone}`;

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
                ? formatDateUtc7(shift.date, {
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

          <div className="mt-3 border-t border-dashed border-slate-200 pt-3">
            <Row label="Phí đặt lịch (thu trước)" value={formatVnd(BOOKING_FEE_VND)} bold />
            <Row
              label="Phí khám dịch vụ"
              value={
                service
                  ? `${(service.priceCents / 100).toLocaleString('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    })} (thu sau tại quầy)`
                  : 'Thu sau tại quầy theo chỉ định'
              }
            />
          </div>
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          className="mt-1 accent-[color:#2d7a7c]"
          data-testid="patient-booking-payment-confirm"
        />
        <span>
          Tôi xác nhận thông tin trên là chính xác và đồng ý thanh toán trước phí đặt lịch 10.000đ
          để giữ lịch hẹn.
        </span>
      </label>

      <button
        type="button"
        disabled={!confirmed || paying}
        onClick={() => setShowBillPopup(true)}
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
            <span>Thanh toán phí đặt lịch 10.000đ</span>
          </>
        )}
      </button>

      {showBillPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4">
          <div className="clinic-card w-full max-w-xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  Hóa đơn tạm thu
                </p>
                <h3 className="mt-1 text-2xl font-bold text-slate-950">Phí đặt lịch khám</h3>
                <p className="mt-1 text-sm text-slate-500">Mã bill: {draftBillCode}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowBillPopup(false)}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <Row label="Bệnh nhân" value={patientName} />
              <Row label="Số điện thoại" value={patientPhone} />
              <Row label="Khoản thu" value="Phí giữ lịch khám" />
              <Row label="Số tiền" value={formatVnd(BOOKING_FEE_VND)} bold />
            </div>

            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Phí khám dịch vụ và thuốc sẽ thanh toán tại quầy thu ngân sau khi khám.
            </div>

            <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-4">
              <p className="mb-3 text-sm font-semibold text-slate-900">Chuyển khoản QR</p>
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-soft">
                  <QRCode value={paymentQrValue} size={160} />
                </div>
                <p className="text-center text-xs text-slate-600">
                  Quét mã QR để chuyển khoản phí đặt lịch 10.000đ, sau đó bấm xác nhận.
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowBillPopup(false)}
                className="btn-secondary"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={paying}
                onClick={() => {
                  onPay();
                  setShowBillPopup(false);
                }}
                className="btn-primary"
              >
                Xác nhận đã chuyển khoản 10.000đ
              </button>
            </div>
          </div>
        </div>
      )}
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
