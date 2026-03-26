import { formatVndFromCents } from '../../../lib/currency';
import { formatDateTimeUtc7 } from '../../../lib/time';

interface PrintableInvoiceLine {
  category?: 'SERVICE' | 'LAB' | 'MEDICATION' | null;
  name: string;
  unit?: string | null;
  qty: number;
  unitPriceCents: number;
  totalCents: number;
}

interface PrintableInvoiceProps {
  invoiceCode: string;
  title: string;
  customerName: string;
  customerPhone?: string | null | undefined;
  serviceName?: string | null | undefined;
  doctorName?: string | null | undefined;
  queueNumber?: number | null | undefined;
  shiftLabel?: string | null | undefined;
  roomName?: string | null | undefined;
  createdAt: string;
  paidAt?: string | null | undefined;
  paymentMethod?: 'QR' | 'CASH' | null | undefined;
  billedByName?: string | null | undefined;
  lines: PrintableInvoiceLine[];
  totalCents: number;
}

function formatMoney(cents: number) {
  return formatVndFromCents(cents);
}

function formatDateTime(value: string) {
  return formatDateTimeUtc7(value);
}

function paymentMethodLabel(method?: 'QR' | 'CASH' | null) {
  if (method === 'QR') {
    return 'Quét QR';
  }
  if (method === 'CASH') {
    return 'Tiền mặt';
  }
  return '-';
}

export function PrintableInvoice({
  invoiceCode,
  title,
  customerName,
  customerPhone,
  serviceName,
  doctorName,
  queueNumber,
  shiftLabel,
  roomName,
  createdAt,
  paidAt,
  paymentMethod,
  billedByName,
  lines,
  totalCents,
}: PrintableInvoiceProps) {
  const serviceTotal = lines
    .filter((line) => line.category === 'SERVICE')
    .reduce((sum, line) => sum + line.totalCents, 0);
  const labTotal = lines
    .filter((line) => line.category === 'LAB')
    .reduce((sum, line) => sum + line.totalCents, 0);
  const medicationTotal = lines
    .filter((line) => line.category === 'MEDICATION')
    .reduce((sum, line) => sum + line.totalCents, 0);

  return (
    <div className="mx-auto w-full max-w-[820px] rounded-xl border border-slate-300 bg-white p-8 text-slate-900">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <p className="text-2xl font-bold uppercase tracking-wide">Healthcare Clinic</p>
          <p className="mt-1 text-sm text-slate-600">Phiếu thu và hóa đơn dịch vụ y tế</p>
          <p className="mt-1 text-xs text-slate-500">Địa chỉ: 123 Nguyễn Văn Cừ, Quận 5, TP.HCM</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-wide text-slate-500">Tổng thanh toán</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatMoney(totalCents)}</p>
        </div>
      </header>

      <section className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm md:grid-cols-2">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-slate-500">Thông tin hóa đơn</p>
          <p>
            Mã hóa đơn: <strong>{invoiceCode}</strong>
          </p>
          <p>
            Loại: <strong>{title}</strong>
          </p>
          <p>
            Lập lúc: <strong>{formatDateTime(createdAt)}</strong>
          </p>
          <p>
            Thanh toán lúc: <strong>{paidAt ? formatDateTime(paidAt) : '-'}</strong>
          </p>
          <p>
            Phương thức: <strong>{paymentMethodLabel(paymentMethod)}</strong>
          </p>
          <p>
            Người lập bill: <strong>{billedByName ?? '-'}</strong>
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-slate-500">Thông tin bệnh nhân</p>
          <p>
            Họ tên: <strong>{customerName}</strong>
          </p>
          {customerPhone && (
            <p>
              Số điện thoại: <strong>{customerPhone}</strong>
            </p>
          )}
          {doctorName && (
            <p>
              Bác sĩ: <strong>{doctorName}</strong>
            </p>
          )}
          {serviceName && (
            <p>
              Dịch vụ: <strong>{serviceName}</strong>
            </p>
          )}
          {queueNumber !== null && queueNumber !== undefined && (
            <p>
              STT khám: <strong>{queueNumber}</strong>
            </p>
          )}
          {shiftLabel && (
            <p>
              Ca khám: <strong>{shiftLabel}</strong>
            </p>
          )}
          {roomName && (
            <p>
              Phòng: <strong>{roomName}</strong>
            </p>
          )}
        </div>
      </section>

      <section className="mt-4 overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="w-12 px-3 py-2 text-center">STT</th>
              <th className="px-3 py-2 text-left">Nội dung</th>
              <th className="w-24 px-3 py-2 text-center">Đơn vị</th>
              <th className="w-20 px-3 py-2 text-center">SL</th>
              <th className="w-36 px-3 py-2 text-right">Đơn giá</th>
              <th className="w-36 px-3 py-2 text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr key={`${line.name}-${index}`} className="border-t border-slate-200 align-top">
                <td className="px-3 py-2 text-center">{index + 1}</td>
                <td className="px-3 py-2">
                  <p className="font-medium">{line.name}</p>
                  <p className="text-xs text-slate-500">
                    {line.category === 'SERVICE'
                      ? 'Dịch vụ khám'
                      : line.category === 'LAB'
                        ? 'Xét nghiệm'
                        : 'Thuốc'}
                  </p>
                </td>
                <td className="px-3 py-2 text-center">{line.unit ?? '-'}</td>
                <td className="px-3 py-2 text-center">{line.qty}</td>
                <td className="px-3 py-2 text-right">{formatMoney(line.unitPriceCents)}</td>
                <td className="px-3 py-2 text-right font-semibold">{formatMoney(line.totalCents)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-300 bg-slate-50">
              <td className="px-3 py-2 text-right font-medium text-slate-600" colSpan={5}>
                Tổng dịch vụ khám
              </td>
              <td className="px-3 py-2 text-right font-semibold">{formatMoney(serviceTotal)}</td>
            </tr>
            <tr className="border-t border-slate-300 bg-slate-50">
              <td className="px-3 py-2 text-right font-medium text-slate-600" colSpan={5}>
                Tổng xét nghiệm
              </td>
              <td className="px-3 py-2 text-right font-semibold">{formatMoney(labTotal)}</td>
            </tr>
            <tr className="border-t border-slate-300 bg-slate-50">
              <td className="px-3 py-2 text-right font-medium text-slate-600" colSpan={5}>
                Tổng tiền thuốc
              </td>
              <td className="px-3 py-2 text-right font-semibold">{formatMoney(medicationTotal)}</td>
            </tr>
            <tr className="border-t border-slate-300 bg-slate-100">
              <td className="px-3 py-2 text-right text-base font-bold" colSpan={5}>
                Tổng thanh toán
              </td>
              <td className="px-3 py-2 text-right text-lg font-bold">{formatMoney(totalCents)}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-6 text-sm">
        <div>
          <p className="font-medium text-slate-700">Người lập bill</p>
          <p className="mt-1 text-slate-500">{billedByName ?? '-'}</p>
          <div className="mt-12 border-t border-dashed border-slate-300" />
        </div>
        <div className="text-right">
          <p className="font-medium text-slate-700">Bệnh nhân / Người thanh toán</p>
          <p className="mt-1 text-slate-500">{customerName}</p>
          <div className="mt-12 border-t border-dashed border-slate-300" />
        </div>
      </section>
    </div>
  );
}

export type { PrintableInvoiceLine, PrintableInvoiceProps };
