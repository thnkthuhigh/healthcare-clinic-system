import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { VnpaySandboxGuide } from '../../../components/VnpaySandboxGuide';
import { formatVndFromCents } from '../../../lib/currency';
import { formatDateTimeUtc7, toIsoDateUtc7 } from '../../../lib/time';
import { adminApi } from '../api';
import { PrintableInvoice } from '../components';
import { CashierConsultationPanel } from '../components/CashierConsultationPanel';
import { CashierInvoicePreviewDialog } from '../components/CashierInvoicePreviewDialog';
import { CashierPageHeader } from '../components/CashierPageHeader';
import { CashierPaymentDialog } from '../components/CashierPaymentDialog';
import { CashierRetailPanel } from '../components/CashierRetailPanel';
import type { AdminMedicationDto, CashierBooking, RetailSaleResponse } from '../types';

type CashierTab = 'consultation' | 'retail';
type PaymentMethod = 'QR' | 'CASH' | 'VNPAY';

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
    category?: 'SERVICE' | 'LAB' | 'MEDICATION' | null;
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
  return formatVndFromCents(cents);
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
  if (method === 'VNPAY') {
    return 'VNPAY';
  }
  return '-';
}

function isWebBookingFeePaid(booking: CashierBooking): boolean {
  return booking.channel === 'WEB' && Boolean(booking.bookingFeePaidAt);
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
  const [gatewayFeedback, setGatewayFeedback] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    const requestedTab: CashierTab =
      searchParams.get('tab') === 'retail' ? 'retail' : 'consultation';
    setTab((prev) => (prev === requestedTab ? prev : requestedTab));
  }, [searchParams]);

  useEffect(() => {
    const paymentResult = searchParams.get('paymentResult');
    const returnedBookingId = searchParams.get('bookingId');
    const returnedMessage = searchParams.get('message');

    if (!paymentResult || !returnedBookingId) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('paymentResult');
    nextParams.delete('bookingId');
    nextParams.delete('message');
    nextParams.delete('gateway');
    setSearchParams(nextParams, { replace: true });

    if (paymentResult === 'success') {
      setGatewayFeedback({
        tone: 'success',
        message: returnedMessage || 'Đã ghi nhận thanh toán VNPAY thành công.',
      });
      queryClient.invalidateQueries({ queryKey: ['cashier-bookings'] });
      void adminApi.getCashierBookingDetail(returnedBookingId).then((detail) => {
        setSelectedBooking(detail);
        setPaymentSheet(null);
        openCleanBookingInvoice(detail);
      });
      return;
    }

    setGatewayFeedback({
      tone: 'error',
      message: returnedMessage || 'Giao dịch VNPAY chưa hoàn tất.',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, searchParams, setSearchParams]);

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
  const invoiceRef = useRef<HTMLDivElement>(null);
  const cashierFallbackLabel = useMemo(() => getCurrentCashierLabel(), []);
  const cashierDisplayLabel = useMemo(() => {
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
  }, []);

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
    mutationFn: ({ bookingId, method }: { bookingId: string; method: 'QR' | 'CASH' }) =>
      adminApi.processPayment(bookingId, method),
    onSuccess: (updatedBooking) => {
      queryClient.invalidateQueries({ queryKey: ['cashier-bookings'] });
      setSelectedBooking(updatedBooking);
      setPaymentSheet(null);
      openCleanBookingInvoice(updatedBooking);
    },
  });

  const vnpayMutation = useMutation({
    mutationFn: (bookingId: string) => adminApi.createCashierVnpayPayment(bookingId),
    onSuccess: (response) => {
      window.location.assign(response.paymentUrl);
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

  const openCleanBookingInvoice = useCallback(
    (booking: CashierBooking) => {
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

      if ((booking.labFeeCents ?? 0) > 0) {
        lines.push({
          category: 'LAB',
          name: 'Xét nghiệm cận lâm sàng',
          qty: 1,
          unit: null,
          unitPriceCents: booking.labFeeCents,
          totalCents: booking.labFeeCents,
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

      setInvoicePreview({
        invoiceCode: `BK-${booking.bookingId.slice(0, 8).toUpperCase()}`,
        title: 'Hóa đơn thanh toán khám bệnh',
        customerName: booking.patientName,
        customerPhone: booking.patientPhone,
        serviceName: booking.serviceName,
        doctorName: booking.doctorName,
        queueNumber: booking.queueNumber,
        createdAt: booking.paidAt ?? booking.completedAt ?? new Date().toISOString(),
        paidAt: booking.paidAt ?? null,
        paymentMethod: booking.paymentMethod ?? null,
        billedByName: booking.billedByName ?? cashierDisplayLabel,
        qrValue: null,
        lines,
        totalCents: booking.totalBillCents,
      });
    },
    [cashierDisplayLabel],
  );

  const openCleanRetailInvoice = (result: RetailSaleResponse) => {
    setInvoicePreview({
      invoiceCode: result.invoiceCode,
      title: 'Hóa đơn bán lẻ thuốc',
      customerName: result.customerName ?? 'Khách lẻ',
      customerPhone: result.customerPhone ?? null,
      createdAt: result.createdAt,
      paidAt: result.createdAt,
      paymentMethod: 'CASH',
      billedByName: result.billedByName ?? cashierDisplayLabel,
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

    if ((booking.labFeeCents ?? 0) > 0) {
      lines.push({
        category: 'LAB',
        name: 'Xét nghiệm cận lâm sàng',
        qty: 1,
        unit: null,
        unitPriceCents: booking.labFeeCents,
        totalCents: booking.labFeeCents,
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
      qrValue: null,
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
    setPaymentSheet({ booking, method: 'VNPAY' });
    payMutation.reset();
    vnpayMutation.reset();
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
          <title>HĂ³a Ä‘Æ¡n</title>
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

  const paymentErrorMessage =
    payMutation.error instanceof Error
      ? payMutation.error.message
      : vnpayMutation.error instanceof Error
        ? vnpayMutation.error.message
        : null;

  return (
    <div className="space-y-4">
      <CashierPageHeader tab={tab} onSwitchTab={switchTab} />

      <section className="hidden rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_top_right,rgba(125,211,252,0.28),transparent_32%),linear-gradient(180deg,#ffffff,#f8fafc)] p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Thu ngân phòng khám
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">
              {tab === 'consultation' ? 'Thanh toán khám bệnh' : 'Bán lẻ thuốc'}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Theo dõi bill trong ngày, xử lý VNPAY hoặc tiền mặt và in hóa đơn ngay sau khi hoàn
              tất.
            </p>
          </div>

          <div className="inline-flex rounded-2xl border border-slate-200 bg-white/90 p-1 shadow-sm">
            <button
              onClick={() => switchTab('consultation')}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition ${
                tab === 'consultation'
                  ? 'bg-slate-950 text-white'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              Thanh toán khám
            </button>
            <button
              onClick={() => switchTab('retail')}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition ${
                tab === 'retail' ? 'bg-slate-950 text-white' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">medication</span>
              Bán lẻ thuốc
            </button>
          </div>
        </div>
      </section>

      {gatewayFeedback && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            gatewayFeedback.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {gatewayFeedback.message}
        </div>
      )}

      {tab === 'consultation' && (
        <CashierConsultationPanel
          today={today}
          bookings={bookings}
          filteredBookings={filteredBookings}
          isLoading={isLoading}
          unpaidCount={unpaidCount}
          paidCount={paidCount}
          totalRevenue={totalRevenue}
          filterTab={filterTab}
          selectedBooking={selectedBooking}
          cashierFallbackLabel={cashierDisplayLabel}
          expiring={expireMutation.isPending}
          onFilterChange={setFilterTab}
          onSelectBooking={(booking) => void handleSelectBooking(booking)}
          onExpire={() => expireMutation.mutate()}
          onOpenPayment={openPaymentSheet}
          onOpenInvoice={openCleanBookingInvoice}
          onRemovePrescriptionItem={(payload) => removeItemMutation.mutate(payload)}
        />
      )}

      {tab === 'retail' && (
        <CashierRetailPanel
          cashierLabel={cashierDisplayLabel}
          retailCustomerName={retailCustomerName}
          retailCustomerPhone={retailCustomerPhone}
          retailMedicationId={retailMedicationId}
          retailQty={retailQty}
          retailItems={retailItems}
          retailTotal={retailTotal}
          activeMedications={activeMedications}
          selectedRetailMedication={selectedRetailMedication}
          retailResult={retailResult}
          retailPaymentConfirmed={retailPaymentConfirmed}
          retailSubmitting={retailSaleMutation.isPending}
          retailErrorMessage={
            retailSaleMutation.error instanceof Error
              ? retailSaleMutation.error.message
              : retailSaleMutation.isError
                ? 'Bán lẻ thất bại.'
                : null
          }
          onRetailCustomerNameChange={setRetailCustomerName}
          onRetailCustomerPhoneChange={setRetailCustomerPhone}
          onRetailMedicationChange={setRetailMedicationId}
          onRetailQtyChange={setRetailQty}
          onAddRetailItem={addRetailItem}
          onUpdateRetailQty={updateRetailQty}
          onRemoveRetailItem={removeRetailItem}
          onSubmitRetail={() => retailSaleMutation.mutate()}
          onConfirmRetailPaid={() => setRetailPaymentConfirmed(true)}
          onOpenRetailInvoice={openCleanRetailInvoice}
        />
      )}

      {paymentSheet && (
        <CashierPaymentDialog
          paymentSheet={paymentSheet}
          cashierFallbackLabel={cashierDisplayLabel}
          payPending={payMutation.isPending}
          vnpayPending={vnpayMutation.isPending}
          errorMessage={paymentErrorMessage}
          onClose={() => {
            setPaymentSheet(null);
            payMutation.reset();
            vnpayMutation.reset();
          }}
          onMethodChange={(method) =>
            setPaymentSheet((prev) => (prev ? { ...prev, method } : prev))
          }
          onSubmit={() => {
            if (paymentSheet.method === 'VNPAY') {
              vnpayMutation.mutate(paymentSheet.booking.bookingId);
              return;
            }

            payMutation.mutate({
              bookingId: paymentSheet.booking.bookingId,
              method: paymentSheet.method === 'CASH' ? 'CASH' : 'QR',
            });
          }}
        />
      )}

      {invoicePreview && (
        <CashierInvoicePreviewDialog
          invoicePreview={invoicePreview}
          invoiceRef={invoiceRef}
          onPrint={printInvoice}
          onClose={() => setInvoicePreview(null)}
        />
      )}

      <div className="hidden items-center gap-1 rounded-lg bg-slate-100 p-1">
        <button
          onClick={() => switchTab('consultation')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            tab === 'consultation'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Thanh toĂ¡n khĂ¡m
        </button>
        <button
          onClick={() => switchTab('retail')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            tab === 'retail'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          BĂ¡n láº» thuá»‘c
        </button>
      </div>

      {gatewayFeedback && (
        <div
          className={`hidden rounded-lg border px-4 py-3 text-sm ${
            gatewayFeedback.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {gatewayFeedback.message}
        </div>
      )}

      {tab === 'consultation' && (
        <div className="hidden h-full gap-4">
          <div className="flex w-[420px] flex-shrink-0 flex-col space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
                <p className="text-2xl font-bold text-amber-600">{unpaidCount}</p>
                <p className="text-xs text-slate-500">Chá» thanh toĂ¡n</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{paidCount}</p>
                <p className="text-xs text-slate-500">ÄĂ£ thanh toĂ¡n</p>
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
                      : 'Táº¥t cáº£'}
                </button>
              ))}
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto">
              {isLoading && (
                <p className="py-8 text-center text-sm text-slate-400">Äang táº£i...</p>
              )}
              {!isLoading && filteredBookings.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-400">
                  KhĂ´ng cĂ³ lá»‹ch khĂ¡m nĂ o
                </p>
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
                      {(() => {
                        const isPrepaid = isWebBookingFeePaid(booking);
                        const badgeClass =
                          booking.paymentStatus === 'PAID'
                            ? 'bg-green-100 text-green-700'
                            : isPrepaid
                              ? 'bg-sky-100 text-sky-700'
                              : 'bg-amber-100 text-amber-700';
                        const badgeText =
                          booking.paymentStatus === 'PAID'
                            ? 'Da TT'
                            : isPrepaid
                              ? 'Da coc'
                              : 'Cho TT';

                        return (
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}
                          >
                            {badgeText}
                          </span>
                        );
                      })()}
                      <p className="mt-1 text-xs font-semibold text-slate-700">
                        {formatMoney(booking.totalBillCents)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                    <span>BS: {booking.doctorName}</span>
                    {booking.serviceName && <span>| {booking.serviceName}</span>}
                    <span>| {booking.channel === 'WEB' ? 'Web' : 'VĂ£ng lai'}</span>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => expireMutation.mutate()}
              disabled={expireMutation.isPending}
              className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              {expireMutation.isPending
                ? 'Äang xá»­ lĂ½...'
                : 'Há»§y Ä‘Æ¡n thuá»‘c quĂ¡ háº¡n (>2h)'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto rounded-lg border border-slate-200 bg-white">
            {!selectedBooking ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center text-slate-400">
                  <span className="material-symbols-outlined text-5xl">receipt_long</span>
                  <p className="mt-2 text-sm">Chá»n bá»‡nh nhĂ¢n Ä‘á»ƒ xem hĂ³a Ä‘Æ¡n</p>
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
                      HoĂ n thĂ nh: {formatTime(selectedBooking.completedAt)}
                    </p>
                    {selectedBooking.paidAt && (
                      <p className="text-xs text-slate-400">
                        Da thu luc: {formatTime(selectedBooking.paidAt)}
                      </p>
                    )}
                    {selectedBooking.billedByName && (
                      <p className="text-xs text-slate-400">
                        NgÆ°á»i láº­p bill: {selectedBooking.billedByName}
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
                    {selectedBooking.paymentStatus === 'PAID'
                      ? 'ÄĂ£ thanh toĂ¡n'
                      : 'Chá» thanh toĂ¡n'}
                  </span>
                </div>

                {selectedBooking.paymentStatus === 'PAID' && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    PhÆ°Æ¡ng thá»©c thanh toĂ¡n:{' '}
                    {getPaymentMethodLabel(selectedBooking.paymentMethod)}
                  </div>
                )}

                {isWebBookingFeePaid(selectedBooking) && (
                  <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-700">
                    ÄĂ£ thu phĂ­ Ä‘áº·t lá»‹ch: {formatMoney(selectedBooking.bookingFeeCents ?? 0)}
                    {selectedBooking.bookingFeePaidAt
                      ? ` lĂºc ${formatTime(selectedBooking.bookingFeePaidAt)}`
                      : ''}
                    {selectedBooking.bookingFeePaymentMethod
                      ? ` (${getPaymentMethodLabel(selectedBooking.bookingFeePaymentMethod)})`
                      : ''}
                  </div>
                )}

                {selectedBooking.status !== 'COMPLETED' && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    Ca khĂ¡m chÆ°a hoĂ n táº¥t, Thu ngĂ¢n chá»‰ theo dĂµi tráº¡ng thĂ¡i cá»c. Sáº½
                    thu pháº§n cĂ²n láº¡i sau khi bĂ¡c sÄ© káº¿t thĂºc khĂ¡m.
                  </div>
                )}

                {selectedBooking.serviceName && (
                  <div className="rounded-lg bg-slate-50 p-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-700">{selectedBooking.serviceName}</span>
                      <strong>{formatMoney(selectedBooking.servicePriceCents)}</strong>
                    </div>
                    {selectedBooking.labFeeCents > 0 && (
                      <div className="mt-2 flex justify-between border-t border-slate-200 pt-2">
                        <span className="text-sm text-slate-700">
                          XĂ©t nghiá»‡m cáº­n lĂ¢m sĂ ng
                        </span>
                        <strong>{formatMoney(selectedBooking.labFeeCents)}</strong>
                      </div>
                    )}
                  </div>
                )}

                {selectedBooking.prescriptionItems &&
                  selectedBooking.prescriptionItems.length > 0 && (
                    <div className="rounded-lg bg-slate-50 p-4">
                      <h4 className="mb-2 text-sm font-semibold text-slate-700">ÄÆ¡n thuá»‘c</h4>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-xs text-slate-500">
                            <th className="pb-2 text-left font-medium">Thuá»‘c</th>
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
                                    title="XĂ³a thuá»‘c"
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
                    <span className="text-base font-bold text-slate-900">Tá»•ng cá»™ng</span>
                    <span className="text-xl font-bold text-blue-700">
                      {formatMoney(selectedBooking.totalBillCents)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedBooking.paymentStatus === 'UNPAID' &&
                    selectedBooking.status === 'COMPLETED' && (
                      <button
                        onClick={() => openPaymentSheet(selectedBooking)}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        Thanh toĂ¡n
                      </button>
                    )}

                  <button
                    onClick={() => openInvoiceFromBooking(selectedBooking)}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    In hĂ³a Ä‘Æ¡n
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'retail' && (
        <div className="hidden grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-base font-semibold text-slate-900">BĂ¡n láº» thuá»‘c</h3>
            <p className="mt-1 text-sm text-slate-500">
              Nháº­p thĂ´ng tin khĂ¡ch vĂ thuá»‘c cáº§n bĂ¡n
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">TĂªn khĂ¡ch</label>
                <input
                  value={retailCustomerName}
                  onChange={(e) => setRetailCustomerName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="KhĂ¡ch láº»"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Sá»‘ Ä‘iá»‡n thoáº¡i
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
                  <option value="">-- Chá»n thuá»‘c --</option>
                  {activeMedications.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({formatMoney(item.priceCents)}) - tá»“n {item.availableStock}
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
                  ThĂªm
                </button>
              </div>

              {selectedRetailMedication && (
                <p className="mt-2 text-xs text-slate-500">
                  {selectedRetailMedication.name} - Ä‘Æ¡n vá»‹ {selectedRetailMedication.unit} -
                  giĂ¡ {formatMoney(selectedRetailMedication.priceCents)}
                </p>
              )}
            </div>

            <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500">
                    <th className="px-3 py-2 text-left">Thuá»‘c</th>
                    <th className="px-3 py-2 text-center">SL</th>
                    <th className="px-3 py-2 text-right">ÄÆ¡n giĂ¡</th>
                    <th className="px-3 py-2 text-right">ThĂ nh tiá»n</th>
                    <th className="w-10 px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {retailItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                        ChÆ°a cĂ³ thuá»‘c nĂ o
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
              <span className="text-sm font-medium text-slate-700">Tá»•ng táº¡m tĂ­nh</span>
              <strong className="text-lg text-blue-700">{formatMoney(retailTotal)}</strong>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => retailSaleMutation.mutate()}
                disabled={retailSaleMutation.isPending || retailItems.length === 0}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {retailSaleMutation.isPending ? 'Äang xá»­ lĂ½...' : 'Thanh toĂ¡n'}
              </button>
            </div>

            {retailSaleMutation.isError && (
              <p className="mt-2 text-sm text-red-600">
                {retailSaleMutation.error instanceof Error
                  ? retailSaleMutation.error.message
                  : 'BĂ¡n láº» tháº¥t báº¡i'}
              </p>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-base font-semibold text-slate-900">Káº¿t quáº£ bĂ¡n láº»</h3>
            {!retailResult ? (
              <p className="mt-3 text-sm text-slate-500">
                ChÆ°a cĂ³ hĂ³a Ä‘Æ¡n bĂ¡n láº» nĂ o trong phiĂªn hiá»‡n táº¡i.
              </p>
            ) : (
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <p>
                  MĂ£ hĂ³a Ä‘Æ¡n: <strong>{retailResult.invoiceCode}</strong>
                </p>
                <p>
                  KhĂ¡ch hĂ ng: <strong>{retailResult.customerName ?? 'KhĂ¡ch láº»'}</strong>
                </p>
                {retailResult.customerPhone && (
                  <p>
                    SÄT: <strong>{retailResult.customerPhone}</strong>
                  </p>
                )}
                <p>
                  Tá»•ng tiá»n: <strong>{formatMoney(retailResult.totalCents)}</strong>
                </p>
                <p>
                  NgÆ°á»i láº­p bill:{' '}
                  <strong>{retailResult.billedByName ?? cashierFallbackLabel}</strong>
                </p>
                {!retailPaymentConfirmed ? (
                  <button
                    onClick={() => setRetailPaymentConfirmed(true)}
                    className="mt-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    Thanh toĂ¡n thĂ nh cĂ´ng
                  </button>
                ) : (
                  <button
                    onClick={() => openRetailInvoice(retailResult)}
                    className="mt-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Xuáº¥t hĂ³a Ä‘Æ¡n
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {paymentSheet && (
        <div className="hidden fixed inset-0 z-50 items-center justify-center bg-black/45 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  XĂ¡c nháº­n thanh toĂ¡n
                </p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">
                  {paymentSheet.booking.patientName}
                </h3>
                <p className="text-sm text-slate-500">
                  MĂ£ bill táº¡m: BK-{paymentSheet.booking.bookingId.slice(0, 8).toUpperCase()} |
                  Tá»•ng thanh toĂ¡n {formatMoney(paymentSheet.booking.totalBillCents)}
                </p>
              </div>
              <button
                onClick={() => {
                  setPaymentSheet(null);
                  payMutation.reset();
                }}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                ÄĂ³ng
              </button>
            </div>

            <div className="mt-4 grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1.05fr_1fr]">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-900">Chi tiáº¿t bill</p>
                <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 text-sm">
                  {paymentSheet.booking.serviceName && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">
                        Dá»‹ch vá»¥ khĂ¡m: {paymentSheet.booking.serviceName}
                      </span>
                      <span className="font-medium text-slate-900">
                        {formatMoney(paymentSheet.booking.servicePriceCents)}
                      </span>
                    </div>
                  )}
                  {paymentSheet.booking.labFeeCents > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">XĂ©t nghiá»‡m cáº­n lĂ¢m sĂ ng</span>
                      <span className="font-medium text-slate-900">
                        {formatMoney(paymentSheet.booking.labFeeCents)}
                      </span>
                    </div>
                  )}
                  {(paymentSheet.booking.prescriptionItems ?? []).map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <span className="text-slate-600">
                        Thuá»‘c: {item.medicationName} x {item.qty}
                      </span>
                      <span className="font-medium text-slate-900">
                        {formatMoney(item.totalCents)}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-slate-200 pt-2">
                    <div className="flex items-center justify-between text-base font-semibold text-slate-900">
                      <span>Tá»•ng cá»™ng</span>
                      <span>{formatMoney(paymentSheet.booking.totalBillCents)}</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  NgÆ°á»i láº­p bill: {paymentSheet.booking.billedByName ?? cashierFallbackLabel}
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-900">Phuong thuc thanh toan</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      setPaymentSheet((prev) => (prev ? { ...prev, method: 'VNPAY' } : prev))
                    }
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      paymentSheet.method === 'VNPAY'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-300 bg-white text-slate-600'
                    }`}
                  >
                    VNPAY
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
                    Tien mat
                  </button>
                </div>

                {paymentSheet.method === 'VNPAY' ? (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-2xl text-blue-600">
                          account_balance_wallet
                        </span>
                        <div className="space-y-1 text-sm text-slate-700">
                          <p className="font-semibold text-slate-900">Thanh toan qua VNPAY</p>
                          <p>
                            He thong se chuyen sang cong thanh toan VNPAY de khach hang xac nhan
                            giao dich.
                          </p>
                          <p>
                            Sau khi thanh toan thanh cong, thu ngan se duoc quay lai hoa don nay.
                          </p>
                        </div>
                      </div>
                    </div>
                    <VnpaySandboxGuide />
                  </div>
                ) : (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                    Xac nhan da nhan du tien mat truoc khi bam hoan tat.
                  </div>
                )}
              </div>
            </div>

            {(payMutation.isError || vnpayMutation.isError) && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {payMutation.error instanceof Error
                  ? payMutation.error.message
                  : vnpayMutation.error instanceof Error
                    ? vnpayMutation.error.message
                    : 'Thanh toan that bai, vui long thu lai.'}
              </div>
            )}

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                onClick={() => {
                  setPaymentSheet(null);
                  payMutation.reset();
                  vnpayMutation.reset();
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Huy
              </button>
              <button
                onClick={() => {
                  if (paymentSheet.method === 'VNPAY') {
                    vnpayMutation.mutate(paymentSheet.booking.bookingId);
                    return;
                  }

                  payMutation.mutate({
                    bookingId: paymentSheet.booking.bookingId,
                    method: paymentSheet.method === 'CASH' ? 'CASH' : 'QR',
                  });
                }}
                disabled={payMutation.isPending || vnpayMutation.isPending}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {paymentSheet.method === 'VNPAY'
                  ? vnpayMutation.isPending
                    ? 'Dang chuyen sang VNPAY...'
                    : 'Tiep tuc toi VNPAY'
                  : payMutation.isPending
                    ? 'Dang ghi nhan...'
                    : 'Xac nhan thanh toan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {invoicePreview && (
        <div className="hidden fixed inset-0 z-50 items-center justify-center bg-black/40 p-4">
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
                lines={invoicePreview.lines}
                totalCents={invoicePreview.totalCents}
              />
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={printInvoice}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                In hĂ³a Ä‘Æ¡n
              </button>
              <button
                onClick={() => setInvoicePreview(null)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                ÄĂ³ng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
