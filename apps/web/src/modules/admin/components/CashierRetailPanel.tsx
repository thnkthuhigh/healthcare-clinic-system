import type { ReactNode } from 'react';

import { formatVndFromCents } from '../../../lib/currency';
import type { AdminMedicationDto, RetailSaleResponse } from '../types';

interface RetailDraftItem {
  medicationId: string;
  medicationName: string;
  unit: string;
  unitPriceCents: number;
  qty: number;
  lineTotalCents: number;
}

interface CashierRetailPanelProps {
  cashierLabel: string;
  retailCustomerName: string;
  retailCustomerPhone: string;
  retailMedicationId: string;
  retailQty: string;
  retailItems: RetailDraftItem[];
  retailTotal: number;
  activeMedications: AdminMedicationDto[];
  selectedRetailMedication: AdminMedicationDto | null;
  retailResult: RetailSaleResponse | null;
  retailPaymentConfirmed: boolean;
  retailSubmitting: boolean;
  retailErrorMessage: string | null;
  onRetailCustomerNameChange: (value: string) => void;
  onRetailCustomerPhoneChange: (value: string) => void;
  onRetailMedicationChange: (value: string) => void;
  onRetailQtyChange: (value: string) => void;
  onAddRetailItem: () => void;
  onUpdateRetailQty: (medicationId: string, value: string) => void;
  onRemoveRetailItem: (medicationId: string) => void;
  onSubmitRetail: () => void;
  onConfirmRetailPaid: () => void;
  onOpenRetailInvoice: (result: RetailSaleResponse) => void;
}

function formatMoney(cents: number) {
  return formatVndFromCents(cents);
}

export function CashierRetailPanel({
  cashierLabel,
  retailCustomerName,
  retailCustomerPhone,
  retailMedicationId,
  retailQty,
  retailItems,
  retailTotal,
  activeMedications,
  selectedRetailMedication,
  retailResult,
  retailPaymentConfirmed,
  retailSubmitting,
  retailErrorMessage,
  onRetailCustomerNameChange,
  onRetailCustomerPhoneChange,
  onRetailMedicationChange,
  onRetailQtyChange,
  onAddRetailItem,
  onUpdateRetailQty,
  onRemoveRetailItem,
  onSubmitRetail,
  onConfirmRetailPaid,
  onOpenRetailInvoice,
}: CashierRetailPanelProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
      <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-950">Bán lẻ thuốc tại quầy</h3>
            <p className="mt-1 text-sm text-slate-500">
              Tạo bill nhanh cho khách lẻ và thu tiền trực tiếp.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            Thu ngân: {cashierLabel}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Field label="Tên khách">
            <input
              value={retailCustomerName}
              onChange={(event) => onRetailCustomerNameChange(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              placeholder="Khách lẻ"
            />
          </Field>
          <Field label="Số điện thoại">
            <input
              value={retailCustomerPhone}
              onChange={(event) => onRetailCustomerPhoneChange(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              placeholder="09xxxxxxxx"
            />
          </Field>
        </div>

        <div className="mt-5 rounded-[28px] border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">Thêm thuốc vào bill</p>
          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_120px_110px]">
            <select
              value={retailMedicationId}
              onChange={(event) => onRetailMedicationChange(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
            >
              <option value="">Chọn thuốc</option>
              {activeMedications.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({formatMoney(item.priceCents)}) · tồn {item.availableStock}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={retailQty}
              onChange={(event) => onRetailQtyChange(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
            />
            <button
              onClick={onAddRetailItem}
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Thêm
            </button>
          </div>

          {selectedRetailMedication && (
            <p className="mt-3 text-sm text-slate-500">
              {selectedRetailMedication.name} · đơn vị {selectedRetailMedication.unit} · giá{' '}
              {formatMoney(selectedRetailMedication.priceCents)}
            </p>
          )}
        </div>

        <div className="mt-5 overflow-hidden rounded-[28px] border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Thuốc</th>
                <th className="px-4 py-3 text-center font-medium">SL</th>
                <th className="px-4 py-3 text-right font-medium">Đơn giá</th>
                <th className="px-4 py-3 text-right font-medium">Thành tiền</th>
                <th className="w-14 px-4 py-3 text-right font-medium">Xóa</th>
              </tr>
            </thead>
            <tbody>
              {retailItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                    Chưa có thuốc nào trong bill.
                  </td>
                </tr>
              )}
              {retailItems.map((item) => (
                <tr key={item.medicationId} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{item.medicationName}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.unit}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="number"
                      min={1}
                      value={item.qty}
                      onChange={(event) => onUpdateRetailQty(item.medicationId, event.target.value)}
                      className="w-16 rounded-xl border border-slate-200 px-2 py-2 text-center text-sm outline-none transition focus:border-slate-400"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">{formatMoney(item.unitPriceCents)}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatMoney(item.lineTotalCents)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onRemoveRetailItem(item.medicationId)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-red-500 transition hover:bg-red-50 hover:text-red-700"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex flex-col gap-4 rounded-[28px] bg-slate-950 p-5 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.16em] text-slate-400">Tổng tạm tính</p>
            <p className="mt-2 text-3xl font-semibold">{formatMoney(retailTotal)}</p>
          </div>
          <button
            onClick={onSubmitRetail}
            disabled={retailSubmitting || retailItems.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <span className="material-symbols-outlined text-[18px]">payments</span>
            {retailSubmitting ? 'Đang xử lý...' : 'Thanh toán'}
          </button>
        </div>

        {retailErrorMessage && (
          <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {retailErrorMessage}
          </p>
        )}
      </section>

      <section className="space-y-4">
        <PanelCard title="Kết quả bán lẻ">
          {!retailResult ? (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
              Chưa có hóa đơn bán lẻ nào được tạo.
            </div>
          ) : (
            <div className="space-y-4">
              <InfoItem label="Mã hóa đơn" value={retailResult.invoiceCode} />
              <InfoItem label="Khách hàng" value={retailResult.customerName ?? 'Khách lẻ'} />
              <InfoItem label="Số điện thoại" value={retailResult.customerPhone ?? '-'} />
              <InfoItem label="Tổng tiền" value={formatMoney(retailResult.totalCents)} />
              <InfoItem label="Người lập bill" value={retailResult.billedByName ?? cashierLabel} />

              {!retailPaymentConfirmed ? (
                <button
                  onClick={onConfirmRetailPaid}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  Xác nhận đã thu tiền
                </button>
              ) : (
                <button
                  onClick={() => onOpenRetailInvoice(retailResult)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <span className="material-symbols-outlined text-[18px]">print</span>
                  Xuất hóa đơn
                </button>
              )}
            </div>
          )}
        </PanelCard>

        <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          Luồng bán lẻ hiện được tối ưu cho thanh toán trực tiếp tại quầy. Nếu cần VNPAY cho bán lẻ
          thuốc, nên tách thành luồng riêng để dễ đối soát.
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function PanelCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h4 className="text-xl font-semibold text-slate-950">{title}</h4>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}
