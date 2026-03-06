import { useRef } from 'react';
import QRCode from 'react-qr-code';

import type { BookingTicket } from '../types';

interface QRTicketProps {
  ticket: BookingTicket;
}

const SHIFT_LABEL: Record<string, string> = { MORNING: 'Buổi sáng', AFTERNOON: 'Buổi chiều' };

export function QRTicket({ ticket }: QRTicketProps) {
  const ticketRef = useRef<HTMLDivElement>(null);

  const handleSave = () => {
    const svgEl = ticketRef.current?.querySelector<SVGElement>('svg');
    if (!svgEl) return;

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `ve-kham-${ticket.bookingId.slice(0, 8)}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const dateDisplay = new Date(ticket.date + 'T00:00:00').toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="space-y-4">
      {/* Ticket card */}
      <div
        ref={ticketRef}
        className="bg-white rounded-2xl border-2 border-primary shadow-card overflow-hidden"
      >
        {/* Header */}
        <div className="bg-primary px-5 py-3 text-white text-center">
          <p className="text-xs uppercase tracking-widest opacity-80">Vé Khám Bệnh</p>
          <p className="text-2xl font-extrabold mt-0.5">
            #{ticket.queueNumber !== null ? String(ticket.queueNumber).padStart(3, '0') : '—'}
          </p>
        </div>

        {/* Body */}
        <div className="flex gap-4 px-5 py-4">
          {/* QR */}
          <div className="flex-shrink-0 flex flex-col items-center gap-1">
            <QRCode value={ticket.bookingId} size={100} level="M" />
            <p className="text-[9px] text-slate-400 text-center max-w-[100px] truncate">
              {ticket.bookingId}
            </p>
          </div>

          {/* Info */}
          <div className="flex-1 space-y-1.5 text-sm min-w-0">
            <InfoRow label="Bệnh nhân" value={ticket.patientName} />
            <InfoRow label="SĐT" value={ticket.patientPhone} />
            <InfoRow label="Bác sĩ" value={ticket.doctorName} />
            <InfoRow label="Chuyên khoa" value={ticket.specialty ?? 'Đa khoa'} />
            <InfoRow
              label="Ca khám"
              value={`${SHIFT_LABEL[ticket.shiftType] ?? ticket.shiftType} — ${ticket.timeRange}`}
            />
            <InfoRow label="Ngày" value={dateDisplay} />
            {ticket.serviceName && <InfoRow label="Dịch vụ" value={ticket.serviceName} />}
          </div>
        </div>

        {/* Status bar */}
        <div className="bg-slate-50 border-t border-slate-100 px-5 py-2 flex justify-between text-xs text-slate-500">
          <span>
            Trạng thái:{' '}
            <strong className={ticket.paymentStatus === 'PAID' ? 'text-green-600' : 'text-amber-600'}>
              {ticket.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chờ thanh toán'}
            </strong>
          </span>
          <span>{new Date(ticket.createdAt).toLocaleTimeString('vi-VN')}</span>
        </div>
      </div>

      {/* Actions */}
      <button
        type="button"
        onClick={handleSave}
        className="w-full rounded-lg border-2 border-primary text-primary font-semibold py-2.5 hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
      >
        💾 Lưu ảnh vé về máy
      </button>

      <p className="text-center text-xs text-slate-400">
        Xuất trình mã QR này khi đến quầy check-in hoặc đọc SĐT <strong>{ticket.patientPhone}</strong>
        <br />
        cho nhân viên lễ tân.
      </p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1.5 min-w-0">
      <span className="text-slate-400 flex-shrink-0 w-20">{label}:</span>
      <span className="text-slate-700 font-medium truncate">{value}</span>
    </div>
  );
}
