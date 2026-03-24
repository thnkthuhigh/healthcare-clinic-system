import { useRef } from 'react';
import QRCode from 'react-qr-code';

import type { BookingTicket } from '../types';

interface QRTicketProps {
  ticket: BookingTicket;
}

const SHIFT_LABEL: Record<string, string> = {
  MORNING: 'Buổi sáng',
  AFTERNOON: 'Buổi chiều',
};

export function QRTicket({ ticket }: QRTicketProps) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const displayQueueNumber = ticket.queueNumber ?? ticket.slotSequence;
  const displayQueueLabel =
    ticket.queueNumber !== null ? 'Số thứ tự đến lượt' : 'Số thứ tự tham khảo';
  const ticketCode = buildTicketCode(ticket.bookingId, ticket.date);

  const handleSave = () => {
    const svgEl = ticketRef.current?.querySelector<SVGElement>('svg');
    if (!svgEl) return;

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${ticketCode.toLowerCase()}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const dateDisplay = new Date(`${ticket.date}T00:00:00`).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="space-y-4" data-testid="patient-booking-ticket">
      <div
        ref={ticketRef}
        className="clinic-card overflow-hidden rounded-[28px] border-primary/20"
        data-testid="patient-booking-ticket-card"
      >
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Phiếu khám</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{ticketCode}</p>
              <p className="mt-1 text-xs text-slate-500">ID đặt lịch: {ticket.bookingId}</p>
            </div>
            <div className="rounded-[22px] border border-slate-200 bg-white px-5 py-4 text-center shadow-soft">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{displayQueueLabel}</p>
              <p className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
                #{String(displayQueueNumber).padStart(3, '0')}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 px-5 py-5 sm:grid-cols-[160px_minmax(0,1fr)]">
          <div className="flex flex-col items-center gap-3">
            <div
              className="rounded-2xl border border-slate-200 bg-white p-3"
              data-testid="patient-booking-ticket-qr"
            >
              <QRCode value={ticket.bookingId} size={110} level="M" />
            </div>
            <p className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Xuất trình tại quầy
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <InfoBlock label="Bệnh nhân" value={ticket.patientName} />
            <InfoBlock label="Số điện thoại" value={ticket.patientPhone} />
            <InfoBlock label="Bác sĩ" value={ticket.doctorName} />
            <InfoBlock label="Chuyên khoa" value={ticket.specialty ?? 'Đa khoa'} />
            <InfoBlock label="Ngày khám" value={dateDisplay} />
            <InfoBlock
              label="Ca khám"
              value={`${SHIFT_LABEL[ticket.shiftType] ?? ticket.shiftType} • ${ticket.timeRange}`}
            />
            <InfoBlock label="Giờ hẹn" value={formatClock(ticket.appointmentTime)} />
            <InfoBlock
              label="Đang phục vụ"
              value={
                ticket.currentServingQueueNumber !== null
                  ? `#${String(ticket.currentServingQueueNumber).padStart(3, '0')}`
                  : 'Chưa có dữ liệu'
              }
            />
            <InfoBlock label="Giờ dự kiến tới lượt" value={formatClock(ticket.estimatedTurnAt)} />
            <InfoBlock
              label="Thanh toán"
              value={ticket.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chờ thanh toán'}
            />
            {ticket.serviceName && <InfoBlock label="Dịch vụ" value={ticket.serviceName} />}
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
        <p>
          {ticket.queueNumber === null
            ? 'Số hiện tại là mức tham khảo trước check-in. Khi đến quầy tiếp nhận, hệ thống sẽ cấp số chính thức.'
            : 'Số hiện tại là số thứ tự đã được cấp cho bệnh nhân trong ca khám này.'}
        </p>
        <p className="mt-2">
          Xuất trình mã QR hoặc đọc số điện thoại <strong>{ticket.patientPhone}</strong> cho nhân viên lễ tân.
        </p>
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="btn-secondary w-full"
        data-testid="patient-booking-ticket-download"
      >
        <span className="material-symbols-outlined text-base">download</span>
        <span>Lưu ảnh phiếu khám</span>
      </button>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function buildTicketCode(bookingId: string, date: string) {
  const compactDate = date.replaceAll('-', '').slice(2);
  return `PK-${compactDate}-${bookingId.slice(0, 6).toUpperCase()}`;
}

function formatClock(value: string) {
  return new Date(value).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
