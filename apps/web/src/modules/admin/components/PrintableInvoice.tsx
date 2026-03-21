interface PrintableInvoiceLine {
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
  lines: PrintableInvoiceLine[];
  totalCents: number;
}

function formatMoney(cents: number) {
  return `${new Intl.NumberFormat('vi-VN').format(cents)} d`;
}

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString('vi-VN');
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
  lines,
  totalCents,
}: PrintableInvoiceProps) {
  return (
    <div className="mx-auto w-full max-w-3xl rounded-xl border border-slate-200 bg-white p-6 text-slate-900">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold">PHONG KHAM HEALTHCARE CLINIC</h2>
        <p className="mt-1 text-sm text-slate-500">Hoa don dich vu y te</p>
      </div>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-slate-600">Ma hoa don: {invoiceCode}</p>
          <p className="text-sm text-slate-600">Thoi gian: {formatDateTime(createdAt)}</p>
        </div>
        <div className="rounded-lg bg-slate-100 px-4 py-2 text-center">
          <p className="text-xs text-slate-500">Tong tien</p>
          <p className="text-xl font-bold text-slate-900">{formatMoney(totalCents)}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
        <p>
          Khach hang: <strong>{customerName}</strong>
        </p>
        {customerPhone && (
          <p>
            So dien thoai: <strong>{customerPhone}</strong>
          </p>
        )}
        {serviceName && (
          <p>
            Dich vu: <strong>{serviceName}</strong>
          </p>
        )}
        {doctorName && (
          <p>
            Bac si: <strong>{doctorName}</strong>
          </p>
        )}
        {queueNumber !== null && queueNumber !== undefined && (
          <p>
            STT: <strong>{queueNumber}</strong>
          </p>
        )}
        {shiftLabel && (
          <p>
            Ca kham: <strong>{shiftLabel}</strong>
          </p>
        )}
        {roomName && (
          <p>
            Phong: <strong>{roomName}</strong>
          </p>
        )}
      </div>

      <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="px-3 py-2 text-left">Noi dung</th>
              <th className="px-3 py-2 text-center">SL</th>
              <th className="px-3 py-2 text-right">Don gia</th>
              <th className="px-3 py-2 text-right">Thanh tien</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr key={`${line.name}-${index}`} className="border-t border-slate-200">
                <td className="px-3 py-2">
                  <p className="font-medium">{line.name}</p>
                  {line.unit && <p className="text-xs text-slate-500">Don vi: {line.unit}</p>}
                </td>
                <td className="px-3 py-2 text-center">{line.qty}</td>
                <td className="px-3 py-2 text-right">{formatMoney(line.unitPriceCents)}</td>
                <td className="px-3 py-2 text-right font-semibold">
                  {formatMoney(line.totalCents)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-300 bg-slate-50">
              <td className="px-3 py-2 text-right font-semibold" colSpan={3}>
                Tong cong
              </td>
              <td className="px-3 py-2 text-right text-base font-bold">
                {formatMoney(totalCents)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-6 grid grid-cols-2 text-sm">
        <div>
          <p className="text-slate-500">Nguoi lap hoa don</p>
          <div className="mt-12 border-t border-dashed border-slate-300" />
        </div>
        <div className="text-right">
          <p className="text-slate-500">Khach hang</p>
          <div className="mt-12 border-t border-dashed border-slate-300" />
        </div>
      </div>
    </div>
  );
}

export type { PrintableInvoiceLine, PrintableInvoiceProps };
