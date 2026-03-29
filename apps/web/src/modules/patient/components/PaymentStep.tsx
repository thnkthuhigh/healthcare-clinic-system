import { useState } from 'react';

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
  errorMessage?: string | null;
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
  doctor,
  shift,
  service,
  patientName,
  patientPhone,
  onPay,
  paying,
  errorMessage,
}: PaymentStepProps) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            Xác nhận lịch hẹn
          </p>
          <h3 className="mt-1 text-xl font-semibold text-slate-950">Tóm tắt thanh toán</h3>
        </div>

        <div className="space-y-5 px-5 py-5 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <SummaryCard
              icon="medical_services"
              title="Ca khám"
              value={shift ? `${SHIFT_LABEL[shift.type] ?? shift.type} · ${shift.timeRange}` : '-'}
              detail={
                shift
                  ? formatDateUtc7(shift.date, {
                      weekday: 'long',
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })
                  : 'Chưa chọn lịch'
              }
            />
            <SummaryCard
              icon="person"
              title="Bệnh nhân"
              value={patientName || '-'}
              detail={patientPhone || '-'}
            />
          </div>

          <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <DetailRow label="Bác sĩ" value={doctor?.displayName ?? '-'} />
            <DetailRow label="Chuyên khoa" value={doctor?.specialty ?? 'Đa khoa'} />
            <DetailRow
              label="Dịch vụ"
              value={service?.name ?? 'Khám theo chỉ định khi tiếp nhận'}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <PriceCard
              title="Phí đặt lịch"
              value={formatVnd(BOOKING_FEE_VND)}
              note="Thanh toán ngay để giữ chỗ"
              tone="sky"
            />
            <PriceCard
              title="Phí khám và thuốc"
              value={
                service
                  ? (service.priceCents / 100).toLocaleString('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    })
                  : 'Theo chỉ định'
              }
              note="Thu sau tại quầy thu ngân"
              tone="amber"
            />
          </div>

          <div className="rounded-[28px] border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-900">
            Bấm thanh toán là hệ thống sẽ mở thẳng cổng VNPAY để bạn hoàn tất phí giữ lịch. Không
            còn bước trung gian hay hiển thị thẻ test trong màn hình này.
          </div>
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          className="mt-1 accent-[color:#0f766e]"
          data-testid="patient-booking-payment-confirm"
        />
        <span className="leading-6">
          Tôi xác nhận thông tin đặt lịch là chính xác và đồng ý thanh toán trước{' '}
          <strong>{formatVnd(BOOKING_FEE_VND)}</strong> qua VNPAY để giữ chỗ khám.
        </span>
      </label>

      <button
        type="button"
        disabled={!confirmed || paying}
        onClick={onPay}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        data-testid="patient-booking-pay"
      >
        {paying ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span>Đang chuyển sang VNPAY</span>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-base">payments</span>
            <span>Mở VNPAY để thanh toán phí đặt lịch</span>
          </>
        )}
      </button>

      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  icon,
  title,
  value,
  detail,
}: {
  icon: string;
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
          <span className="material-symbols-outlined text-[22px]">{icon}</span>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {title}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function PriceCard({
  title,
  value,
  note,
  tone,
}: {
  title: string;
  value: string;
  note: string;
  tone: 'sky' | 'amber';
}) {
  const toneClass =
    tone === 'sky'
      ? 'border-sky-200 bg-sky-50 text-sky-900'
      : 'border-amber-200 bg-amber-50 text-amber-900';

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{note}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className="text-right text-slate-900">{value}</span>
    </div>
  );
}
