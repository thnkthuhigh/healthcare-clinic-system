import type { MutableRefObject } from 'react';

import { PrintableInvoice } from './PrintableInvoice';

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
  paymentMethod?: 'QR' | 'CASH' | 'VNPAY' | null;
  billedByName?: string | null;
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

interface CashierInvoicePreviewDialogProps {
  invoicePreview: InvoicePreviewState;
  invoiceRef: MutableRefObject<HTMLDivElement | null>;
  onPrint: () => void;
  onClose: () => void;
}

export function CashierInvoicePreviewDialog({
  invoicePreview,
  invoiceRef,
  onPrint,
  onClose,
}: CashierInvoicePreviewDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[32px] bg-slate-100 p-4 shadow-2xl">
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

        <div className="mt-4 flex flex-wrap justify-end gap-3">
          <button
            onClick={onPrint}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            In hóa đơn
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
