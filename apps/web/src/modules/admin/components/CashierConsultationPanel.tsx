import type { ReactNode } from 'react';

import { formatVndFromCents } from '../../../lib/currency';
import { formatDateTimeUtc7 } from '../../../lib/time';
import type { CashierBooking } from '../types';

interface CashierConsultationPanelProps {
  today: string;
  bookings: CashierBooking[];
  filteredBookings: CashierBooking[];
  isLoading: boolean;
  unpaidCount: number;
  paidCount: number;
  totalRevenue: number;
  filterTab: 'UNPAID' | 'PAID' | 'ALL';
  selectedBooking: CashierBooking | null;
  cashierFallbackLabel: string;
  expiring: boolean;
  onFilterChange: (value: 'UNPAID' | 'PAID' | 'ALL') => void;
  onSelectBooking: (booking: CashierBooking) => void;
  onExpire: () => void;
  onOpenPayment: (booking: CashierBooking) => void;
  onOpenInvoice: (booking: CashierBooking) => void;
  onRemovePrescriptionItem: (payload: { bookingId: string; itemId: string }) => void;
}

function formatMoney(cents: number) {
  return formatVndFromCents(cents);
}

function formatTime(value: string | null) {
  if (!value) return '-';
  return formatDateTimeUtc7(value);
}

function getPaymentMethodLabel(method: 'QR' | 'CASH' | 'VNPAY' | null | undefined) {
  if (method === 'QR') return 'Quét QR';
  if (method === 'CASH') return 'Tiền mặt';
  if (method === 'VNPAY') return 'VNPAY';
  return '-';
}

function isWebBookingFeePaid(booking: CashierBooking) {
  return booking.channel === 'WEB' && Boolean(booking.bookingFeePaidAt);
}

function canPrevisitPayWithVnpay(booking: CashierBooking) {
  return (
    booking.paymentStatus === 'UNPAID' &&
    isWebBookingFeePaid(booking) &&
    booking.status !== 'CANCELED' &&
    booking.status !== 'NO_SHOW'
  );
}

function canOpenPaymentSheet(booking: CashierBooking) {
  return (
    booking.paymentStatus === 'UNPAID' &&
    (booking.status === 'COMPLETED' || canPrevisitPayWithVnpay(booking))
  );
}

function getPaymentActionLabel(booking: CashierBooking) {
  return booking.status === 'COMPLETED' ? 'Thanh toán' : 'Thanh toán VNPAY';
}

function getChannelLabel(channel: CashierBooking['channel']) {
  return channel === 'WEB' ? 'Đặt online' : 'Vãng lai';
}

function getVisitStatusLabel(status: string) {
  switch (status) {
    case 'BOOKED':
      return 'Đã đặt lịch';
    case 'CHECKED_IN':
      return 'Đã check-in';
    case 'WAITING':
      return 'Đang chờ';
    case 'IN_CONSULTATION':
      return 'Đang khám';
    case 'PENDING_LAB':
      return 'Chờ cận lâm sàng';
    case 'RESULTS_READY':
      return 'Đã có kết quả';
    case 'COMPLETED':
      return 'Đã khám xong';
    default:
      return status;
  }
}

function getPaymentState(booking: CashierBooking) {
  if (booking.paymentStatus === 'PAID') {
    return {
      label: 'Đã thanh toán',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    };
  }

  if (canPrevisitPayWithVnpay(booking) && booking.status !== 'COMPLETED') {
    return {
      label: 'Sẵn sàng thu VNPAY',
      className: 'border-sky-200 bg-sky-50 text-sky-700',
    };
  }

  if (isWebBookingFeePaid(booking)) {
    return {
      label: 'Đã thu phí đặt lịch',
      className: 'border-sky-200 bg-sky-50 text-sky-700',
    };
  }

  return {
    label: 'Chờ thanh toán',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  };
}

export function CashierConsultationPanel({
  today,
  bookings,
  filteredBookings,
  isLoading,
  unpaidCount,
  paidCount,
  totalRevenue,
  filterTab,
  selectedBooking,
  cashierFallbackLabel,
  expiring,
  onFilterChange,
  onSelectBooking,
  onExpire,
  onOpenPayment,
  onOpenInvoice,
  onRemovePrescriptionItem,
}: CashierConsultationPanelProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <StatCard
            title="Chờ thanh toán"
            value={String(unpaidCount)}
            detail="Các bill chưa thu đủ"
          />
          <StatCard title="Đã thanh toán" value={String(paidCount)} detail="Bill đã hoàn tất" />
          <StatCard
            title="Doanh thu trong ngày"
            value={formatMoney(totalRevenue)}
            detail="Từ bill đã thu"
          />
        </div>

        <section className="rounded-[24px] border border-slate-200 bg-white p-3.5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-950">Danh sách thanh toán</h3>
              <p className="mt-1 text-sm text-slate-500">{bookings.length} lượt khám trong ngày.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {today}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {(['UNPAID', 'PAID', 'ALL'] as const).map((item) => (
              <button
                key={item}
                onClick={() => onFilterChange(item)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  filterTab === item
                    ? 'bg-slate-950 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {item === 'UNPAID'
                  ? `Chờ thanh toán (${unpaidCount})`
                  : item === 'PAID'
                    ? `Đã thanh toán (${paidCount})`
                    : `Tất cả (${bookings.length})`}
              </button>
            ))}
          </div>

          <div className="mt-3 max-h-[calc(100vh-21rem)] space-y-2 overflow-y-auto pr-1">
            {isLoading && (
              <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
                Đang tải danh sách thanh toán...
              </p>
            )}

            {!isLoading && filteredBookings.length === 0 && (
              <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
                Không có lịch khám phù hợp với bộ lọc hiện tại.
              </p>
            )}

            {filteredBookings.map((booking) => {
              const paymentState = getPaymentState(booking);

              return (
                <button
                  key={booking.bookingId}
                  onClick={() => onSelectBooking(booking)}
                  className={`w-full rounded-[20px] border p-3.5 text-left transition ${
                    selectedBooking?.bookingId === booking.bookingId
                      ? 'border-slate-950 bg-slate-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
                        {booking.queueNumber ?? '#'}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950">
                          {booking.patientName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{booking.patientPhone}</p>
                        <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs text-slate-500">
                          <span>{booking.doctorName}</span>
                          {booking.serviceName && <span>{booking.serviceName}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${paymentState.className}`}
                      >
                        {paymentState.label}
                      </span>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {formatMoney(booking.totalBillCents)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span>{getChannelLabel(booking.channel)}</span>
                    <span>{getVisitStatusLabel(booking.status)}</span>
                    {booking.completedAt && (
                      <span>Hoàn tất: {formatTime(booking.completedAt)}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={onExpire}
            disabled={expiring}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[18px]">auto_delete</span>
            {expiring ? 'Đang xử lý đơn thuốc quá hạn...' : 'Hủy đơn thuốc quá hạn trên 2 giờ'}
          </button>
        </section>
      </aside>

      <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        {!selectedBooking ? (
          <div className="flex min-h-[460px] items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50/60 p-8">
            <div className="text-center text-slate-400">
              <span className="material-symbols-outlined text-5xl">receipt_long</span>
              <p className="mt-3 text-base font-medium text-slate-500">
                Chọn một bệnh nhân để xem bill
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Chi tiết dịch vụ, thuốc và thanh toán sẽ hiển thị ở đây.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-semibold text-slate-950">
                    {selectedBooking.patientName}
                  </h3>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getPaymentState(selectedBooking).className}`}
                  >
                    {getPaymentState(selectedBooking).label}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {getVisitStatusLabel(selectedBooking.status)}
                  </span>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-slate-500">
                  <span>{selectedBooking.patientPhone}</span>
                  <span>Bác sĩ: {selectedBooking.doctorName}</span>
                  <span>Hình thức: {getChannelLabel(selectedBooking.channel)}</span>
                  {selectedBooking.queueNumber !== null && (
                    <span>Số thứ tự: {selectedBooking.queueNumber}</span>
                  )}
                </div>
              </div>

              <div className="min-w-[190px] rounded-[20px] bg-slate-950 px-4 py-3.5 text-white">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Tổng bill
                </p>
                <p className="mt-1.5 text-2xl font-semibold">
                  {formatMoney(selectedBooking.totalBillCents)}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  {isWebBookingFeePaid(selectedBooking)
                    ? `Đã thu phí đặt lịch ${formatMoney(selectedBooking.bookingFeeCents ?? 0)}`
                    : 'Chưa ghi nhận phí đặt lịch online'}
                </p>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
              <PanelCard title="Thông tin ca khám">
                <InfoItem label="Dịch vụ" value={selectedBooking.serviceName ?? 'Chưa có'} />
                <InfoItem label="Hoàn tất khám" value={formatTime(selectedBooking.completedAt)} />
                <InfoItem
                  label="Người lập bill"
                  value={selectedBooking.billedByName ?? cashierFallbackLabel}
                />
                <InfoItem
                  label="Thu tiền lúc"
                  value={selectedBooking.paidAt ? formatTime(selectedBooking.paidAt) : '-'}
                />
              </PanelCard>

              <PanelCard title="Trạng thái thanh toán">
                <InfoItem
                  label="Phương thức thanh toán"
                  value={getPaymentMethodLabel(selectedBooking.paymentMethod)}
                />
                <InfoItem
                  label="Trạng thái đơn thuốc"
                  value={selectedBooking.prescriptionStatus ?? '-'}
                />
                <InfoItem
                  label="Phí đặt lịch"
                  value={isWebBookingFeePaid(selectedBooking) ? 'Đã thu' : 'Chưa thu'}
                />
                <InfoItem
                  label="Phương thức phí đặt lịch"
                  value={getPaymentMethodLabel(selectedBooking.bookingFeePaymentMethod)}
                />
              </PanelCard>
            </div>

            {selectedBooking.serviceName && (
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex justify-between text-sm text-slate-700">
                  <span>{selectedBooking.serviceName}</span>
                  <strong>{formatMoney(selectedBooking.servicePriceCents)}</strong>
                </div>
                {selectedBooking.labFeeCents > 0 && (
                  <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-sm text-slate-700">
                    <span>Xét nghiệm cận lâm sàng</span>
                    <strong>{formatMoney(selectedBooking.labFeeCents)}</strong>
                  </div>
                )}
              </div>
            )}

            {selectedBooking.prescriptionItems && selectedBooking.prescriptionItems.length > 0 && (
              <div className="overflow-hidden rounded-[24px] border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Thuốc</th>
                      <th className="px-4 py-3 text-center font-medium">SL</th>
                      <th className="px-4 py-3 text-right font-medium">Đơn giá</th>
                      <th className="px-4 py-3 text-right font-medium">Thành tiền</th>
                      {selectedBooking.paymentStatus === 'UNPAID' && (
                        <th className="w-14 px-4 py-3 text-right font-medium">Xóa</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBooking.prescriptionItems.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{item.medicationName}</p>
                          <p className="mt-1 text-xs text-slate-500">{item.unit}</p>
                        </td>
                        <td className="px-4 py-3 text-center">{item.qty}</td>
                        <td className="px-4 py-3 text-right">{formatMoney(item.unitPriceCents)}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatMoney(item.totalCents)}
                        </td>
                        {selectedBooking.paymentStatus === 'UNPAID' && (
                          <td className="px-4 py-3 text-right">
                            <button
                              title="Xóa thuốc"
                              onClick={() =>
                                onRemovePrescriptionItem({
                                  bookingId: selectedBooking.bookingId,
                                  itemId: item.id,
                                })
                              }
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-red-500 transition hover:bg-red-50 hover:text-red-700"
                            >
                              <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              {canOpenPaymentSheet(selectedBooking) && (
                <button
                  onClick={() => onOpenPayment(selectedBooking)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {selectedBooking.status === 'COMPLETED' ? 'payments' : 'account_balance_wallet'}
                  </span>
                  {getPaymentActionLabel(selectedBooking)}
                </button>
              )}

              <button
                onClick={() => onOpenInvoice(selectedBooking)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
                In hóa đơn
              </button>

              {canPrevisitPayWithVnpay(selectedBooking) &&
                selectedBooking.status !== 'COMPLETED' && (
                  <span className="text-sm text-slate-500">
                    Booking online đã thu phí đặt lịch, có thể thanh toán bill còn lại qua VNPAY
                    ngay.
                  </span>
                )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-3.5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-1.5 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1.5 text-sm text-slate-500">{detail}</p>
    </div>
  );
}

function PanelCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <h4 className="text-base font-semibold text-slate-950">{title}</h4>
      <div className="mt-3 grid gap-2.5">{children}</div>
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
