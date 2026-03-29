import type { ReactNode } from 'react';

import { formatVndFromCents } from '../../../lib/currency';
import type { CashierBooking } from '../types';

type PaymentMethod = 'QR' | 'CASH' | 'VNPAY';

interface PaymentSheetState {
  booking: CashierBooking;
  method: PaymentMethod;
}

interface CashierPaymentDialogProps {
  paymentSheet: PaymentSheetState;
  cashierFallbackLabel: string;
  payPending: boolean;
  vnpayPending: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onMethodChange: (method: PaymentMethod) => void;
  onSubmit: () => void;
}

function formatMoney(cents: number) {
  return formatVndFromCents(cents);
}

function buildBillItems(booking: CashierBooking) {
  const items: Array<{ key: string; name: string; meta?: string; amountCents: number }> = [];

  if (booking.serviceName) {
    items.push({
      key: 'service',
      name: booking.serviceName,
      meta: 'Dịch vụ khám',
      amountCents: booking.servicePriceCents,
    });
  }

  if ((booking.labFeeCents ?? 0) > 0) {
    items.push({
      key: 'lab',
      name: 'Xét nghiệm cận lâm sàng',
      meta: 'Cận lâm sàng',
      amountCents: booking.labFeeCents,
    });
  }

  for (const item of booking.prescriptionItems ?? []) {
    items.push({
      key: item.id,
      name: item.medicationName,
      meta: `${item.qty} ${item.unit}`,
      amountCents: item.totalCents,
    });
  }

  return items;
}

function hasBookingFeePaid(booking: CashierBooking) {
  return booking.channel === 'WEB' && Boolean(booking.bookingFeePaidAt);
}

function canUseCashMethod(booking: CashierBooking) {
  return booking.status === 'COMPLETED';
}

export function CashierPaymentDialog({
  paymentSheet,
  cashierFallbackLabel,
  payPending,
  vnpayPending,
  errorMessage,
  onClose,
  onMethodChange,
  onSubmit,
}: CashierPaymentDialogProps) {
  const { booking } = paymentSheet;
  const billItems = buildBillItems(booking);
  const isVnpay = paymentSheet.method === 'VNPAY';
  const cashAvailable = canUseCashMethod(booking);
  const previsitVnpayOnly = !cashAvailable && hasBookingFeePaid(booking);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[2px]">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white shadow-[0_40px_120px_-48px_rgba(15,23,42,0.6)]">
        <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_right,#dbeafe,transparent_20%),linear-gradient(180deg,#ffffff,#f8fafc)] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Xác nhận thanh toán
              </p>
              <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                {booking.patientName}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Mã bill BK-{booking.bookingId.slice(0, 8).toUpperCase()} · Tổng thanh toán{' '}
                {formatMoney(booking.totalBillCents)}
              </p>
              {previsitVnpayOnly && (
                <div className="mt-3 inline-flex rounded-2xl border border-sky-200 bg-sky-50 px-3.5 py-2 text-sm text-sky-800">
                  Lượt khám này chưa hoàn tất nên hiện chỉ hỗ trợ thu trước qua VNPAY.
                </div>
              )}
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-right shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                  Tổng cần thu
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                  {formatMoney(booking.totalBillCents)}
                </p>
              </div>

              <button
                onClick={onClose}
                className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-500 transition hover:bg-slate-50"
                aria-label="Đóng hộp thoại thanh toán"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[1.06fr_0.94fr]">
          <section className="space-y-4">
            <Card title="Chi tiết hóa đơn">
              <div className="space-y-2.5">
                {billItems.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-3 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{item.name}</p>
                      {item.meta && <p className="mt-1 text-xs text-slate-500">{item.meta}</p>}
                    </div>
                    <p className="text-sm font-semibold text-slate-950">
                      {formatMoney(item.amountCents)}
                    </p>
                  </div>
                ))}

                <div className="rounded-[20px] bg-slate-950 px-4 py-3.5 text-white">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm uppercase tracking-[0.16em] text-slate-400">
                      Tổng cộng
                    </span>
                    <span className="text-lg font-semibold">
                      {formatMoney(booking.totalBillCents)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Thông tin lượt khám">
              <div className="grid gap-2.5 sm:grid-cols-2">
                <InfoItem label="Bệnh nhân" value={booking.patientName} />
                <InfoItem label="Số điện thoại" value={booking.patientPhone} />
                <InfoItem label="Bác sĩ" value={booking.doctorName} />
                <InfoItem
                  label="Người lập bill"
                  value={booking.billedByName ?? cashierFallbackLabel}
                />
              </div>
            </Card>
          </section>

          <section className="space-y-4">
            <Card title="Phương thức thanh toán">
              <div className={`grid gap-3 ${cashAvailable ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
                <MethodButton
                  active={isVnpay}
                  title="VNPAY"
                  description={cashAvailable ? 'Mở cổng thanh toán ngay' : 'Thu trước qua VNPAY'}
                  icon="account_balance_wallet"
                  onClick={() => onMethodChange('VNPAY')}
                />
                {cashAvailable && (
                  <MethodButton
                    active={paymentSheet.method === 'CASH'}
                    title="Tiền mặt"
                    description="Thu trực tiếp tại quầy"
                    icon="payments"
                    onClick={() => onMethodChange('CASH')}
                  />
                )}
              </div>
            </Card>

            <div
              className={`rounded-[24px] border p-4 ${
                isVnpay ? 'border-sky-200 bg-sky-50' : 'border-emerald-200 bg-emerald-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <span className="material-symbols-outlined text-[22px] text-slate-900">
                    {isVnpay ? 'account_balance_wallet' : 'payments'}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <p className="text-base font-semibold text-slate-900">
                    {isVnpay ? 'Chuyển sang VNPAY' : 'Xác nhận đã nhận tiền mặt'}
                  </p>
                  <p className="text-sm leading-6 text-slate-700">
                    {isVnpay
                      ? 'Bấm xác nhận để mở trang thanh toán. Nếu backend đang chạy mock local, hệ thống sẽ điều hướng sang VNPAY demo thay cho cổng thật.'
                      : 'Chỉ xác nhận sau khi thu ngân đã nhận đủ tiền. Hệ thống sẽ ghi nhận hóa đơn ngay lập tức.'}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {errorMessage && (
          <div className="mx-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-6">
            {errorMessage}
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 px-5 py-4 sm:px-6">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            onClick={onSubmit}
            disabled={payPending || vnpayPending}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isVnpay ? 'open_in_new' : 'check_circle'}
            </span>
            {isVnpay
              ? vnpayPending
                ? 'Đang mở VNPAY...'
                : 'Mở VNPAY để thanh toán'
              : payPending
                ? 'Đang ghi nhận...'
                : 'Xác nhận thanh toán'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <h4 className="text-base font-semibold text-slate-950">{title}</h4>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3.5 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function MethodButton({
  active,
  title,
  description,
  icon,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-[20px] border px-4 py-3 text-left transition ${
        active
          ? 'border-slate-950 bg-slate-950 text-white shadow-[0_18px_38px_-28px_rgba(15,23,42,0.9)]'
          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-[21px]">{icon}</span>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className={`mt-1 text-sm ${active ? 'text-slate-300' : 'text-slate-500'}`}>
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}
