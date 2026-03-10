import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { adminApi } from '../api';
import type { CashierBooking } from '../types';

function formatVND(cents: number): string {
  return new Intl.NumberFormat('vi-VN').format(cents) + 'đ';
}

export function CashierPage() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);

  const [selectedBooking, setSelectedBooking] = useState<CashierBooking | null>(null);
  const [filterTab, setFilterTab] = useState<'UNPAID' | 'PAID' | 'ALL'>('UNPAID');

  // ── Queries ──
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['cashier-bookings', today],
    queryFn: () => adminApi.getCashierBookings(today),
    refetchInterval: 15_000,
  });

  // ── Mutations ──
  const payMutation = useMutation({
    mutationFn: (bookingId: string) => adminApi.processPayment(bookingId),
    onSuccess: (updatedBooking) => {
      queryClient.invalidateQueries({ queryKey: ['cashier-bookings'] });
      setSelectedBooking(updatedBooking);
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: ({ bookingId, itemId }: { bookingId: string; itemId: string }) =>
      adminApi.removePrescriptionItem(bookingId, itemId),
    onSuccess: (updatedBooking) => {
      queryClient.invalidateQueries({ queryKey: ['cashier-bookings'] });
      setSelectedBooking(updatedBooking);
    },
  });

  const expireMutation = useMutation({
    mutationFn: () => adminApi.expireOldPrescriptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashier-bookings'] });
    },
  });

  // ── Derived data ──
  const unpaidCount = bookings.filter((b) => b.paymentStatus === 'UNPAID').length;
  const paidCount = bookings.filter((b) => b.paymentStatus === 'PAID').length;

  const filteredBookings = bookings.filter((b) => {
    if (filterTab === 'UNPAID') return b.paymentStatus === 'UNPAID';
    if (filterTab === 'PAID') return b.paymentStatus === 'PAID';
    return true;
  });

  const totalRevenue = bookings
    .filter((b) => b.paymentStatus === 'PAID')
    .reduce((sum, b) => sum + b.totalBillCents, 0);

  const handleSelectBooking = useCallback((booking: CashierBooking) => {
    // Reload detail to get prescription items
    adminApi.getCashierBookingDetail(booking.bookingId).then(setSelectedBooking);
  }, []);

  // ── Render ──
  return (
    <div className="flex h-full gap-4">
      {/* LEFT — Booking list */}
      <div className="flex w-[420px] flex-shrink-0 flex-col space-y-3">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{unpaidCount}</p>
            <p className="text-xs text-slate-500">Chờ thanh toán</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{paidCount}</p>
            <p className="text-xs text-slate-500">Đã thanh toán</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
            <p className="text-lg font-bold text-blue-600">{formatVND(totalRevenue)}</p>
            <p className="text-xs text-slate-500">Doanh thu</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          {(['UNPAID', 'PAID', 'ALL'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filterTab === tab
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab === 'UNPAID'
                ? `Chờ TT (${unpaidCount})`
                : tab === 'PAID'
                  ? `Đã TT (${paidCount})`
                  : 'Tất cả'}
            </button>
          ))}
        </div>

        {/* Booking list */}
        <div className="flex-1 space-y-2 overflow-y-auto">
          {isLoading && <p className="py-8 text-center text-sm text-slate-400">Đang tải...</p>}
          {!isLoading && filteredBookings.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-400">Không có lịch khám nào</p>
          )}
          {filteredBookings.map((booking) => (
            <button
              key={booking.bookingId}
              onClick={() => handleSelectBooking(booking)}
              className={`w-full rounded-lg border p-3 text-left transition-all ${
                selectedBooking?.bookingId === booking.bookingId
                  ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {booking.queueNumber && (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">
                      {booking.queueNumber}
                    </span>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{booking.patientName}</p>
                    <p className="text-xs text-slate-500">{booking.patientPhone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      booking.paymentStatus === 'PAID'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {booking.paymentStatus === 'PAID' ? 'Đã TT' : 'Chờ TT'}
                  </span>
                  <p className="mt-1 text-xs font-semibold text-slate-700">
                    {formatVND(booking.totalBillCents)}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                <span>BS: {booking.doctorName}</span>
                {booking.serviceName && <span>• {booking.serviceName}</span>}
                <span>• {booking.channel === 'WEB' ? 'Web' : 'Vãng lai'}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Expire button */}
        <button
          onClick={() => expireMutation.mutate()}
          disabled={expireMutation.isPending}
          className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
        >
          <span className="material-symbols-outlined mr-1 align-middle text-sm">timer_off</span>
          {expireMutation.isPending ? 'Đang xử lý...' : 'Hủy đơn thuốc quá hạn (>2h)'}
        </button>
        {expireMutation.isSuccess && expireMutation.data && (
          <p className="text-center text-xs text-green-600">{expireMutation.data.message}</p>
        )}
      </div>

      {/* RIGHT — Payment detail */}
      <div className="flex-1 overflow-y-auto rounded-lg border border-slate-200 bg-white">
        {!selectedBooking ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-slate-400">
              <span className="material-symbols-outlined text-5xl">receipt_long</span>
              <p className="mt-2 text-sm">Chọn bệnh nhân để xem hóa đơn</p>
            </div>
          </div>
        ) : (
          <div className="p-6">
            {/* Header */}
            <div className="mb-6 flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedBooking.patientName}</h3>
                <p className="text-sm text-slate-500">{selectedBooking.patientPhone}</p>
                <p className="mt-1 text-xs text-slate-400">
                  BS: {selectedBooking.doctorName}
                  {selectedBooking.completedAt &&
                    ` • Hoàn thành: ${new Date(selectedBooking.completedAt).toLocaleTimeString('vi-VN')}`}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  selectedBooking.paymentStatus === 'PAID'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {selectedBooking.paymentStatus === 'PAID' ? '✓ Đã thanh toán' : 'Chờ thanh toán'}
              </span>
            </div>

            {/* Bill breakdown */}
            <div className="space-y-4">
              {/* Service fee */}
              {selectedBooking.serviceName && (
                <div className="rounded-lg bg-slate-50 p-4">
                  <h4 className="mb-2 text-sm font-semibold text-slate-700">
                    <span className="material-symbols-outlined mr-1 align-middle text-base">
                      medical_services
                    </span>
                    Phí khám
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">{selectedBooking.serviceName}</span>
                    <span className="font-semibold text-slate-900">
                      {formatVND(selectedBooking.servicePriceCents)}
                    </span>
                  </div>
                </div>
              )}

              {/* Prescription */}
              {selectedBooking.prescriptionItems &&
                selectedBooking.prescriptionItems.length > 0 && (
                  <div className="rounded-lg bg-slate-50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-700">
                        <span className="material-symbols-outlined mr-1 align-middle text-base">
                          medication
                        </span>
                        Đơn thuốc
                        {selectedBooking.prescriptionStatus && (
                          <span
                            className={`ml-2 rounded px-1.5 py-0.5 text-xs ${
                              selectedBooking.prescriptionStatus === 'HELD'
                                ? 'bg-amber-100 text-amber-700'
                                : selectedBooking.prescriptionStatus === 'PAID'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {selectedBooking.prescriptionStatus === 'HELD'
                              ? 'Tạm giữ'
                              : selectedBooking.prescriptionStatus === 'PAID'
                                ? 'Đã TT'
                                : selectedBooking.prescriptionStatus}
                          </span>
                        )}
                      </h4>
                    </div>

                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs text-slate-500">
                          <th className="pb-2 text-left font-medium">Thuốc</th>
                          <th className="pb-2 text-center font-medium">SL</th>
                          <th className="pb-2 text-right font-medium">Đơn giá</th>
                          <th className="pb-2 text-right font-medium">Thành tiền</th>
                          {selectedBooking.paymentStatus === 'UNPAID' && (
                            <th className="pb-2 text-right font-medium w-10"></th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBooking.prescriptionItems.map((item) => (
                          <tr key={item.id} className="border-b border-slate-100">
                            <td className="py-2">
                              <p className="font-medium text-slate-900">{item.medicationName}</p>
                              <p className="text-xs text-slate-500">
                                {item.unit}
                                {item.dosage && ` • ${item.dosage}`}
                                {item.note && ` • ${item.note}`}
                              </p>
                            </td>
                            <td className="py-2 text-center">{item.qty}</td>
                            <td className="py-2 text-right">{formatVND(item.unitPriceCents)}</td>
                            <td className="py-2 text-right font-medium">
                              {formatVND(item.totalCents)}
                            </td>
                            {selectedBooking.paymentStatus === 'UNPAID' && (
                              <td className="py-2 text-right">
                                <button
                                  title="Xóa thuốc"
                                  onClick={() =>
                                    removeItemMutation.mutate({
                                      bookingId: selectedBooking.bookingId,
                                      itemId: item.id,
                                    })
                                  }
                                  disabled={removeItemMutation.isPending}
                                  className="text-red-400 hover:text-red-600 disabled:opacity-50"
                                >
                                  <span className="material-symbols-outlined text-base">close</span>
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td
                            colSpan={3}
                            className="pt-2 text-right text-sm font-medium text-slate-600"
                          >
                            Tổng thuốc:
                          </td>
                          <td className="pt-2 text-right font-semibold text-slate-900">
                            {formatVND(selectedBooking.prescriptionTotalCents ?? 0)}
                          </td>
                          {selectedBooking.paymentStatus === 'UNPAID' && <td></td>}
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

              {/* No prescription */}
              {(!selectedBooking.prescriptionItems ||
                selectedBooking.prescriptionItems.length === 0) &&
                selectedBooking.prescriptionId === null && (
                  <div className="rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-400">
                    <span className="material-symbols-outlined text-2xl">medication</span>
                    <p className="mt-1">Không có đơn thuốc</p>
                  </div>
                )}

              {/* Total */}
              <div className="rounded-lg bg-blue-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-slate-900">TỔNG CỘNG</span>
                  <span className="text-xl font-bold text-blue-700">
                    {formatVND(selectedBooking.totalBillCents)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Phí khám: {formatVND(selectedBooking.servicePriceCents)} + Thuốc:{' '}
                    {formatVND(selectedBooking.prescriptionTotalCents ?? 0)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {selectedBooking.paymentStatus === 'UNPAID' && (
                <button
                  onClick={() => payMutation.mutate(selectedBooking.bookingId)}
                  disabled={payMutation.isPending}
                  className="w-full rounded-lg bg-green-600 px-4 py-3 text-base font-bold text-white shadow-lg transition-colors hover:bg-green-700 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined mr-2 align-middle">payments</span>
                  {payMutation.isPending ? 'Đang xử lý...' : 'THANH TOÁN (PAID)'}
                </button>
              )}

              {payMutation.isError && (
                <p className="text-center text-sm text-red-600">
                  {payMutation.error instanceof Error
                    ? payMutation.error.message
                    : 'Lỗi thanh toán'}
                </p>
              )}

              {selectedBooking.paymentStatus === 'PAID' && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                  <span className="material-symbols-outlined text-3xl text-green-600">
                    check_circle
                  </span>
                  <p className="mt-1 text-sm font-semibold text-green-700">
                    Đã thanh toán thành công
                  </p>
                  <p className="mt-1 text-xs text-green-600">
                    Kho thuốc đã được trừ • Hồ sơ đã mở khóa cho bệnh nhân
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
