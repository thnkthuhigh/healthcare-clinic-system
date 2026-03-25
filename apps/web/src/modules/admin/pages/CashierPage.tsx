import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import { useSearchParams } from 'react-router-dom';

import { formatDateTimeUtc7, toIsoDateUtc7 } from '../../../lib/time';
import { adminApi } from '../api';
import { PrintableInvoice } from '../components';
import type { AdminMedicationDto, CashierBooking, RetailSaleResponse } from '../types';

type CashierTab = 'consultation' | 'retail';
type PaymentMethod = 'QR' | 'CASH';

interface RetailDraftItem {
  medicationId: string;
  medicationName: string;
  unit: string;
  unitPriceCents: number;
  qty: number;
  lineTotalCents: number;
}

interface InvoicePreviewState {
  invoiceCode: string;
  title: string;
  customerName: string;
  customerPhone?: string | null;
  serviceName?: string | null;
  doctorName?: string | null;
  queueNumber?: number | null;
  shiftLabel?: string | null;
  roomName?: string | null;
  createdAt: string;
  paidAt?: string | null;
  paymentMethod?: PaymentMethod | null;
  billedByName?: string | null;
  qrValue?: string | null;
  lines: Array<{
    category?: 'SERVICE' | 'MEDICATION' | null;
    name: string;
    unit?: string | null;
    qty: number;
    unitPriceCents: number;
    totalCents: number;
  }>;
  totalCents: number;
}

interface PaymentSheetState {
  booking: CashierBooking;
  method: PaymentMethod;
}

function formatMoney(cents: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(cents)} đ`;
}

function formatTime(raw: string | null): string {
  if (!raw) return '-';
  return formatDateTimeUtc7(raw);
}

function getLocalDateIso() {
  return toIsoDateUtc7();
}

function getPaymentMethodLabel(method: PaymentMethod | null | undefined): string {
  if (method === 'QR') {
    return 'Quét QR';
  }
  if (method === 'CASH') {
    return 'Tiền mặt';
  }
  return '-';
}

function buildPaymentQrValue({
  invoiceCode,
  totalCents,
  patientPhone,
}: {
  invoiceCode: string;
  totalCents: number;
  patientPhone?: string | null;
}) {
  const normalizedAmount = Math.max(0, Math.trunc(totalCents));
  const normalizedPhone = patientPhone ?? '';
  return `HC_PAY|INV:${invoiceCode}|AMOUNT:${normalizedAmount}|CUR:VND|PATIENT:${normalizedPhone}`;
}

function getCurrentCashierLabel() {
  try {
    const raw = localStorage.getItem('clinic_user');
    if (!raw) {
      return 'Thu ngân';
    }
    const parsed = JSON.parse(raw) as { fullName?: string; phone?: string } | null;
    if (parsed?.fullName && parsed.fullName.trim().length > 0) {
      return parsed.fullName.trim();
    }
    if (parsed?.phone && parsed.phone.trim().length > 0) {
      return parsed.phone.trim();
    }
    return 'Thu ngân';
  } catch {
    return 'Thu ngân';
  }
}

export function CashierPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab: CashierTab = searchParams.get('tab') === 'retail' ? 'retail' : 'consultation';
  const today = getLocalDateIso();

  const [tab, setTab] = useState<CashierTab>(initialTab);
  const [selectedBooking, setSelectedBooking] = useState<CashierBooking | null>(null);
  const [filterTab, setFilterTab] = useState<'UNPAID' | 'PAID' | 'ALL'>('UNPAID');

  useEffect(() => {
    const requestedTab: CashierTab =
      searchParams.get('tab') === 'retail' ? 'retail' : 'consultation';
    setTab((prev) => (prev === requestedTab ? prev : requestedTab));
  }, [searchParams]);

  const switchTab = (nextTab: CashierTab) => {
    setTab(nextTab);
    if (nextTab === 'retail') {
      setSearchParams({ tab: 'retail' }, { replace: true });
      return;
    }
    setSearchParams({}, { replace: true });
  };

  const [retailCustomerName, setRetailCustomerName] = useState('');
  const [retailCustomerPhone, setRetailCustomerPhone] = useState('');
  const [retailMedicationId, setRetailMedicationId] = useState('');
  const [retailQty, setRetailQty] = useState('1');
  const [retailItems, setRetailItems] = useState<RetailDraftItem[]>([]);
  const [retailResult, setRetailResult] = useState<RetailSaleResponse | null>(null);
  const [retailPaymentConfirmed, setRetailPaymentConfirmed] = useState(false);
  const [paymentSheet, setPaymentSheet] = useState<PaymentSheetState | null>(null);

  const [invoicePreview, setInvoicePreview] = useState<InvoicePreviewState | null>(null);
  const invoiceRef = useRef<HTMLDivElement | null>(null);
  const cashierFallbackLabel = useMemo(() => getCurrentCashierLabel(), []);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['cashier-bookings', today],
    queryFn: () => adminApi.getCashierBookings(today),
    refetchInterval: 15_000,
  });

  const { data: medications = [] } = useQuery({
    queryKey: ['cashier-retail-medications'],
    queryFn: () => adminApi.getMedications(),
    staleTime: 60_000,
    enabled: tab === 'retail',
  });

  const payMutation = useMutation({
    mutationFn: ({ bookingId, method }: { bookingId: string; method: PaymentMethod }) =>
      adminApi.processPayment(bookingId, method),
    onSuccess: (updatedBooking) => {
      queryClient.invalidateQueries({ queryKey: ['cashier-bookings'] });
      setSelectedBooking(updatedBooking);
      setPaymentSheet(null);
      openInvoiceFromBooking(updatedBooking);
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

  const retailSaleMutation = useMutation({
    mutationFn: () =>
      adminApi.retailSale({
        ...(retailCustomerName.trim() ? { customerName: retailCustomerName.trim() } : {}),
        ...(retailCustomerPhone.trim() ? { customerPhone: retailCustomerPhone.trim() } : {}),
        items: retailItems.map((item) => ({ medicationId: item.medicationId, qty: item.qty })),
      }),
    onSuccess: (result) => {
      setRetailResult(result);
      setRetailPaymentConfirmed(false);
      setRetailItems([]);
      setRetailMedicationId('');
      setRetailQty('1');
      queryClient.invalidateQueries({ queryKey: ['cashier-retail-medications'] });
    },
  });

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

  const activeMedications = useMemo(
    () => medications.filter((medication: AdminMedicationDto) => medication.active),
    [medications],
  );

  const selectedRetailMedication = useMemo(
    () => activeMedications.find((item) => item.id === retailMedicationId) ?? null,
    [activeMedications, retailMedicationId],
  );

  const retailTotal = retailItems.reduce((sum, item) => sum + item.lineTotalCents, 0);

  const openInvoiceFromBooking = (booking: CashierBooking) => {
    const lines: InvoicePreviewState['lines'] = [];

    if (booking.serviceName) {
      lines.push({
        category: 'SERVICE',
        name: booking.serviceName,
        qty: 1,
        unit: null,
        unitPriceCents: booking.servicePriceCents,
        totalCents: booking.servicePriceCents,
      });
    }

    for (const item of booking.prescriptionItems ?? []) {
      lines.push({
        category: 'MEDICATION',
        name: item.medicationName,
        unit: item.unit,
        qty: item.qty,
        unitPriceCents: item.unitPriceCents,
        totalCents: item.totalCents,
      });
    }

    const invoiceCode = `BK-${booking.bookingId.slice(0, 8).toUpperCase()}`;
    const paymentMethod = booking.paymentMethod ?? null;
    const qrValue = buildPaymentQrValue({
      invoiceCode,
      totalCents: booking.totalBillCents,
      patientPhone: booking.patientPhone,
    });

    setInvoicePreview({
      invoiceCode,
      title: 'Hóa đơn thanh toán khám bệnh',
      customerName: booking.patientName,
      customerPhone: booking.patientPhone,
      serviceName: booking.serviceName,
      doctorName: booking.doctorName,
      queueNumber: booking.queueNumber,
      createdAt: booking.paidAt ?? booking.completedAt ?? new Date().toISOString(),
      paidAt: booking.paidAt ?? null,
      paymentMethod,
      billedByName: booking.billedByName ?? cashierFallbackLabel,
      qrValue: paymentMethod === 'QR' ? qrValue : null,
      lines,
      totalCents: booking.totalBillCents,
    });
  };

  const openRetailInvoice = (result: RetailSaleResponse) => {
    setInvoicePreview({
      invoiceCode: result.invoiceCode,
      title: 'Hóa đơn bán lẻ thuốc',
      customerName: result.customerName ?? 'Khách lẻ',
      customerPhone: result.customerPhone ?? null,
      createdAt: result.createdAt,
      paidAt: result.createdAt,
      paymentMethod: 'CASH',
      billedByName: result.billedByName ?? cashierFallbackLabel,
      qrValue: null,
      lines: result.items.map((item) => ({
        category: 'MEDICATION',
        name: item.medicationName,
        unit: item.unit,
        qty: item.qty,
        unitPriceCents: item.unitPriceCents,
        totalCents: item.lineTotalCents,
      })),
      totalCents: result.totalCents,
    });
  };

  const handleSelectBooking = async (booking: CashierBooking) => {
    const detail = await adminApi.getCashierBookingDetail(booking.bookingId);
    setSelectedBooking(detail);
  };

  const openPaymentSheet = (booking: CashierBooking) => {
    setPaymentSheet({ booking, method: 'QR' });
    payMutation.reset();
  };

  const addRetailItem = () => {
    const qty = Number.parseInt(retailQty, 10);
    if (!selectedRetailMedication || Number.isNaN(qty) || qty <= 0) {
      return;
    }

    setRetailResult(null);
    setRetailPaymentConfirmed(false);

    setRetailItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.medicationId === selectedRetailMedication.id,
      );
      if (existingIndex === -1) {
        return [
          ...prev,
          {
            medicationId: selectedRetailMedication.id,
            medicationName: selectedRetailMedication.name,
            unit: selectedRetailMedication.unit,
            unitPriceCents: selectedRetailMedication.priceCents,
            qty,
            lineTotalCents: selectedRetailMedication.priceCents * qty,
          },
        ];
      }

      const updated = [...prev];
      const current = updated[existingIndex]!;
      const nextQty = current.qty + qty;
      updated[existingIndex] = {
        ...current,
        qty: nextQty,
        lineTotalCents: current.unitPriceCents * nextQty,
      };
      return updated;
    });

    setRetailQty('1');
  };

  const updateRetailQty = (medicationId: string, qtyValue: string) => {
    const qty = Number.parseInt(qtyValue, 10);
    if (Number.isNaN(qty) || qty <= 0) {
      return;
    }

    setRetailItems((prev) =>
      prev.map((item) =>
        item.medicationId === medicationId
          ? { ...item, qty, lineTotalCents: item.unitPriceCents * qty }
          : item,
      ),
    );
  };

  const removeRetailItem = (medicationId: string) => {
    setRetailItems((prev) => prev.filter((item) => item.medicationId !== medicationId));
  };

  const printInvoice = () => {
    const html = invoiceRef.current?.innerHTML;
    if (!html) return;

    const printWindow = window.open('', '_blank', 'width=960,height=760');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Hóa đơn</title>
          <style>
            @page { size: A4; margin: 14mm; }
            body { font-family: Arial, sans-serif; margin: 0; background: #ffffff; color: #0f172a; }
            * { box-sizing: border-box; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #e2e8f0; padding: 6px 8px; }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
        <button
          onClick={() => switchTab('consultation')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            tab === 'consultation'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Thanh toán khám
        </button>
        <button
          onClick={() => switchTab('retail')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            tab === 'retail'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Bán lẻ thuốc
        </button>
      </div>

      {tab === 'consultation' && (
        <div className="flex h-full gap-4">
          <div className="flex w-[420px] flex-shrink-0 flex-col space-y-3">
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
                <p className="text-lg font-bold text-blue-600">{formatMoney(totalRevenue)}</p>
                <p className="text-xs text-slate-500">Doanh thu</p>
              </div>
            </div>

            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              {(['UNPAID', 'PAID', 'ALL'] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setFilterTab(item)}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    filterTab === item ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  {item === 'UNPAID'
                    ? `Cho TT (${unpaidCount})`
                    : item === 'PAID'
                      ? `Da TT (${paidCount})`
                      : 'Tat ca'}
                </button>
              ))}
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto">
              {isLoading && <p className="py-8 text-center text-sm text-slate-400">Đang tải...</p>}
              {!isLoading && filteredBookings.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-400">Không có lịch khám nào</p>
              )}
              {filteredBookings.map((booking) => (
                <button
                  key={booking.bookingId}
                  onClick={() => void handleSelectBooking(booking)}
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
                        <p className="text-sm font-semibold text-slate-900">
                          {booking.patientName}
                        </p>
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
                        {booking.paymentStatus === 'PAID' ? 'Da TT' : 'Cho TT'}
                      </span>
                      <p className="mt-1 text-xs font-semibold text-slate-700">
                        {formatMoney(booking.totalBillCents)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                    <span>BS: {booking.doctorName}</span>
                    {booking.serviceName && <span>| {booking.serviceName}</span>}
                    <span>| {booking.channel === 'WEB' ? 'Web' : 'Vang lai'}</span>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => expireMutation.mutate()}
              disabled={expireMutation.isPending}
              className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              {expireMutation.isPending ? 'Đang xử lý...' : 'Hủy đơn thuốc quá hạn (>2h)'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto rounded-lg border border-slate-200 bg-white">
            {!selectedBooking ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center text-slate-400">
                  <span className="material-symbols-outlined text-5xl">receipt_long</span>
                  <p className="mt-2 text-sm">Chọn bệnh nhân để xem hóa đơn</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 p-6">
                <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {selectedBooking.patientName}
                    </h3>
                    <p className="text-sm text-slate-500">{selectedBooking.patientPhone}</p>
                    <p className="mt-1 text-xs text-slate-400">BS: {selectedBooking.doctorName}</p>
                    <p className="text-xs text-slate-400">
                      Hoan thanh: {formatTime(selectedBooking.completedAt)}
                    </p>
                    {selectedBooking.paidAt && (
                      <p className="text-xs text-slate-400">
                        Da thu luc: {formatTime(selectedBooking.paidAt)}
                      </p>
                    )}
                    {selectedBooking.billedByName && (
                      <p className="text-xs text-slate-400">
                        Người lập bill: {selectedBooking.billedByName}
                      </p>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      selectedBooking.paymentStatus === 'PAID'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {selectedBooking.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                  </span>
                </div>

                {selectedBooking.paymentStatus === 'PAID' && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    Phương thức thanh toán: {getPaymentMethodLabel(selectedBooking.paymentMethod)}
                  </div>
                )}

                {selectedBooking.serviceName && (
                  <div className="rounded-lg bg-slate-50 p-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-700">{selectedBooking.serviceName}</span>
                      <strong>{formatMoney(selectedBooking.servicePriceCents)}</strong>
                    </div>
                  </div>
                )}

                {selectedBooking.prescriptionItems &&
                  selectedBooking.prescriptionItems.length > 0 && (
                    <div className="rounded-lg bg-slate-50 p-4">
                      <h4 className="mb-2 text-sm font-semibold text-slate-700">Đơn thuốc</h4>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-xs text-slate-500">
                            <th className="pb-2 text-left font-medium">Thuốc</th>
                            <th className="pb-2 text-center font-medium">SL</th>
                            <th className="pb-2 text-right font-medium">Don gia</th>
                            <th className="pb-2 text-right font-medium">Thanh tien</th>
                            {selectedBooking.paymentStatus === 'UNPAID' && (
                              <th className="w-10 pb-2 text-right"></th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {selectedBooking.prescriptionItems.map((item) => (
                            <tr key={item.id} className="border-b border-slate-100">
                              <td className="py-2">
                                <p className="font-medium text-slate-900">{item.medicationName}</p>
                                <p className="text-xs text-slate-500">{item.unit}</p>
                              </td>
                              <td className="py-2 text-center">{item.qty}</td>
                              <td className="py-2 text-right">
                                {formatMoney(item.unitPriceCents)}
                              </td>
                              <td className="py-2 text-right font-medium">
                                {formatMoney(item.totalCents)}
                              </td>
                              {selectedBooking.paymentStatus === 'UNPAID' && (
                                <td className="py-2 text-right">
                                  <button
                                    title="Xoa thuoc"
                                    onClick={() =>
                                      removeItemMutation.mutate({
                                        bookingId: selectedBooking.bookingId,
                                        itemId: item.id,
                                      })
                                    }
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <span className="material-symbols-outlined text-base">
                                      close
                                    </span>
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                <div className="rounded-lg bg-blue-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-slate-900">Tổng cộng</span>
                    <span className="text-xl font-bold text-blue-700">
                      {formatMoney(selectedBooking.totalBillCents)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedBooking.paymentStatus === 'UNPAID' && (
                    <button
                      onClick={() => openPaymentSheet(selectedBooking)}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Thanh toán
                    </button>
                  )}

                  <button
                    onClick={() => openInvoiceFromBooking(selectedBooking)}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    In hóa đơn
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'retail' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-base font-semibold text-slate-900">Bán lẻ thuốc</h3>
            <p className="mt-1 text-sm text-slate-500">Nhap thong tin khach va thuoc can ban</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Ten khach</label>
                <input
                  value={retailCustomerName}
                  onChange={(e) => setRetailCustomerName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Khách lẻ"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  So dien thoai
                </label>
                <input
                  value={retailCustomerPhone}
                  onChange={(e) => setRetailCustomerPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="09xxxxxxxx"
                />
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 p-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_110px_100px]">
                <select
                  value={retailMedicationId}
                  onChange={(e) => setRetailMedicationId(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">-- Chọn thuốc --</option>
                  {activeMedications.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({formatMoney(item.priceCents)}) - ton {item.availableStock}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={retailQty}
                  onChange={(e) => setRetailQty(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  onClick={addRetailItem}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Them
                </button>
              </div>

              {selectedRetailMedication && (
                <p className="mt-2 text-xs text-slate-500">
                  {selectedRetailMedication.name} - don vi {selectedRetailMedication.unit} - gia{' '}
                  {formatMoney(selectedRetailMedication.priceCents)}
                </p>
              )}
            </div>

            <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500">
                    <th className="px-3 py-2 text-left">Thuốc</th>
                    <th className="px-3 py-2 text-center">SL</th>
                    <th className="px-3 py-2 text-right">Don gia</th>
                    <th className="px-3 py-2 text-right">Thanh tien</th>
                    <th className="w-10 px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {retailItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                        Chua co thuoc nao
                      </td>
                    </tr>
                  )}
                  {retailItems.map((item) => (
                    <tr key={item.medicationId} className="border-t border-slate-100">
                      <td className="px-3 py-2">
                        <p className="font-medium text-slate-900">{item.medicationName}</p>
                        <p className="text-xs text-slate-500">{item.unit}</p>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number"
                          min={1}
                          value={item.qty}
                          onChange={(e) => updateRetailQty(item.medicationId, e.target.value)}
                          className="w-16 rounded border border-slate-300 px-2 py-1 text-center text-sm"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">{formatMoney(item.unitPriceCents)}</td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatMoney(item.lineTotalCents)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => removeRetailItem(item.medicationId)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3">
              <span className="text-sm font-medium text-slate-700">Tổng tạm tính</span>
              <strong className="text-lg text-blue-700">{formatMoney(retailTotal)}</strong>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => retailSaleMutation.mutate()}
                disabled={retailSaleMutation.isPending || retailItems.length === 0}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {retailSaleMutation.isPending ? 'Đang xử lý...' : 'Thanh toán'}
              </button>
            </div>

            {retailSaleMutation.isError && (
              <p className="mt-2 text-sm text-red-600">
                {retailSaleMutation.error instanceof Error
                  ? retailSaleMutation.error.message
                  : 'Bán lẻ thất bại'}
              </p>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-base font-semibold text-slate-900">Ket qua ban le</h3>
            {!retailResult ? (
              <p className="mt-3 text-sm text-slate-500">
                Chưa có hóa đơn bán lẻ nào trong phiên hiện tại.
              </p>
            ) : (
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <p>
                  Mã hóa đơn: <strong>{retailResult.invoiceCode}</strong>
                </p>
                <p>
                  Khách hàng: <strong>{retailResult.customerName ?? 'Khách lẻ'}</strong>
                </p>
                {retailResult.customerPhone && (
                  <p>
                    SĐT: <strong>{retailResult.customerPhone}</strong>
                  </p>
                )}
                <p>
                  Tổng tiền: <strong>{formatMoney(retailResult.totalCents)}</strong>
                </p>
                <p>
                  Người lập bill:{' '}
                  <strong>{retailResult.billedByName ?? cashierFallbackLabel}</strong>
                </p>
                {!retailPaymentConfirmed ? (
                  <button
                    onClick={() => setRetailPaymentConfirmed(true)}
                    className="mt-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    Thanh toán thành công
                  </button>
                ) : (
                  <button
                    onClick={() => openRetailInvoice(retailResult)}
                    className="mt-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Xuất hóa đơn
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {paymentSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Xác nhận thanh toán
                </p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">
                  {paymentSheet.booking.patientName}
                </h3>
                <p className="text-sm text-slate-500">
                  Mã bill tạm: BK-{paymentSheet.booking.bookingId.slice(0, 8).toUpperCase()} | Tổng
                  thanh toán {formatMoney(paymentSheet.booking.totalBillCents)}
                </p>
              </div>
              <button
                onClick={() => {
                  setPaymentSheet(null);
                  payMutation.reset();
                }}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Đóng
              </button>
            </div>

            <div className="mt-4 grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1.05fr_1fr]">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-900">Chi tiết bill</p>
                <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 text-sm">
                  {paymentSheet.booking.serviceName && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Dịch vụ khám: {paymentSheet.booking.serviceName}</span>
                      <span className="font-medium text-slate-900">
                        {formatMoney(paymentSheet.booking.servicePriceCents)}
                      </span>
                    </div>
                  )}
                  {(paymentSheet.booking.prescriptionItems ?? []).map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <span className="text-slate-600">
                        Thuốc: {item.medicationName} x {item.qty}
                      </span>
                      <span className="font-medium text-slate-900">
                        {formatMoney(item.totalCents)}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-slate-200 pt-2">
                    <div className="flex items-center justify-between text-base font-semibold text-slate-900">
                      <span>Tổng cộng</span>
                      <span>{formatMoney(paymentSheet.booking.totalBillCents)}</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Người lập bill: {paymentSheet.booking.billedByName ?? cashierFallbackLabel}
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-900">Phương thức thanh toán</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentSheet((prev) => (prev ? { ...prev, method: 'QR' } : prev))}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      paymentSheet.method === 'QR'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-300 bg-white text-slate-600'
                    }`}
                  >
                    Quét QR
                  </button>
                  <button
                    onClick={() =>
                      setPaymentSheet((prev) => (prev ? { ...prev, method: 'CASH' } : prev))
                    }
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      paymentSheet.method === 'CASH'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-300 bg-white text-slate-600'
                    }`}
                  >
                    Tiền mặt
                  </button>
                </div>

                {paymentSheet.method === 'QR' ? (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <div className="flex flex-col items-center gap-2">
                      <div className="rounded-lg bg-white p-2">
                        <QRCode
                          value={buildPaymentQrValue({
                            invoiceCode: `BK-${paymentSheet.booking.bookingId.slice(0, 8).toUpperCase()}`,
                            totalCents: paymentSheet.booking.totalBillCents,
                            patientPhone: paymentSheet.booking.patientPhone,
                          })}
                          size={132}
                        />
                      </div>
                      <p className="text-center text-xs text-slate-600">
                        Bệnh nhân quét mã QR để thanh toán.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                    Xác nhận đã nhận đủ tiền mặt trước khi bấm hoàn tất.
                  </div>
                )}
              </div>
            </div>

            {payMutation.isError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {payMutation.error instanceof Error
                  ? payMutation.error.message
                  : 'Thanh toán thất bại, vui lòng thử lại.'}
              </div>
            )}

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                onClick={() => {
                  setPaymentSheet(null);
                  payMutation.reset();
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={() =>
                  payMutation.mutate({
                    bookingId: paymentSheet.booking.bookingId,
                    method: paymentSheet.method,
                  })
                }
                disabled={payMutation.isPending}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {payMutation.isPending ? 'Đang ghi nhận...' : 'Xác nhận thanh toán'}
              </button>
            </div>
          </div>
        </div>
      )}

      {invoicePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-slate-100 p-4">
            <div ref={invoiceRef}>
              <PrintableInvoice
                invoiceCode={invoicePreview.invoiceCode}
                title={invoicePreview.title}
                customerName={invoicePreview.customerName}
                customerPhone={invoicePreview.customerPhone}
                serviceName={invoicePreview.serviceName}
                doctorName={invoicePreview.doctorName}
                queueNumber={invoicePreview.queueNumber}
                shiftLabel={invoicePreview.shiftLabel}
                roomName={invoicePreview.roomName}
                createdAt={invoicePreview.createdAt}
                paidAt={invoicePreview.paidAt}
                paymentMethod={invoicePreview.paymentMethod}
                billedByName={invoicePreview.billedByName}
                qrValue={invoicePreview.qrValue}
                lines={invoicePreview.lines}
                totalCents={invoicePreview.totalCents}
              />
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={printInvoice}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                In hóa đơn
              </button>
              <button
                onClick={() => setInvoicePreview(null)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
