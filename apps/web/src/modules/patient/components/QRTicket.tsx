import { useEffect, useRef, useState } from 'react';
import QRCode from 'react-qr-code';

import { formatVndFromCents } from '../../../lib/currency';
import { formatDateUtc7, formatTimeUtc7 } from '../../../lib/time';
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
  const [downloadPopup, setDownloadPopup] = useState<string | null>(null);
  const isDownloadError = downloadPopup?.startsWith('Không thể') ?? false;
  const displayQueueNumber = ticket.queueNumber ?? ticket.slotSequence;
  const displayQueueLabel =
    ticket.queueNumber !== null ? 'Số thứ tự đến lượt' : 'Số thứ tự dự kiến';
  const ticketCode = buildTicketCode(ticket.bookingId, ticket.date);

  useEffect(() => {
    if (!downloadPopup) return undefined;
    const timer = window.setTimeout(() => setDownloadPopup(null), 2200);
    return () => window.clearTimeout(timer);
  }, [downloadPopup]);

  const handleSave = () => {
    const svgEl = ticketRef.current?.querySelector<SVGElement>('svg');
    if (!svgEl) {
      setDownloadPopup('Không thể lưu ảnh phiếu khám. Vui lòng thử lại.');
      return;
    }

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgStr)}`;

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setDownloadPopup('Không thể lưu ảnh phiếu khám. Vui lòng thử lại.');
        return;
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `${ticketCode.toLowerCase()}.png`;
      link.click();
      setDownloadPopup('Đã lưu ảnh mã phiếu khám thành công.');
    };

    image.onerror = () => {
      setDownloadPopup('Không thể lưu ảnh phiếu khám. Vui lòng thử lại.');
    };

    image.src = svgDataUrl;
  };

  const dateDisplay = formatDateUtc7(ticket.date, {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="space-y-5" data-testid="patient-booking-ticket">
      <div
        ref={ticketRef}
        className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_70px_-42px_rgba(15,23,42,0.35)]"
        data-testid="patient-booking-ticket-card"
      >
        <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_24%),linear-gradient(180deg,#ffffff,#f8fafc)] px-6 py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                {ticket.bookingFeePaid ? 'Đã xác nhận thanh toán' : 'Chờ thanh toán'}
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Phiếu khám điện tử
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                {ticketCode}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Mang mã này đến quầy tiếp nhận để check-in và theo dõi lượt khám trong ca của bạn.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <HeaderInfo
                label="Phí giữ chỗ"
                value={
                  ticket.bookingFeePaid
                    ? formatVndFromCents(ticket.bookingFeeCents)
                    : 'Chưa thanh toán'
                }
              />
              <HeaderInfo
                label={displayQueueLabel}
                value={`#${String(displayQueueNumber).padStart(3, '0')}`}
                emphasize
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4 text-center">
              <div className="mx-auto flex h-[168px] w-[168px] items-center justify-center rounded-[24px] bg-white shadow-sm">
                <QRCode value={ticket.bookingId} size={132} level="M" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Xuất trình tại quầy
              </p>
            </div>

            <div className="rounded-[24px] border border-sky-100 bg-sky-50 px-4 py-4 text-sm leading-6 text-sky-900">
              Giữ lại màn hình này hoặc lưu ảnh mã để xuất trình nhanh khi đến quầy tiếp nhận.
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <InfoBlock label="Bệnh nhân" value={ticket.patientName} />
            <InfoBlock label="Số điện thoại" value={ticket.patientPhone} />
            <InfoBlock label="Bác sĩ" value={ticket.doctorName} />
            <InfoBlock label="Chuyên khoa" value={ticket.specialty ?? 'Đa khoa'} />
            <InfoBlock label="Ngày khám" value={dateDisplay} />
            <InfoBlock
              label="Ca khám"
              value={`${SHIFT_LABEL[ticket.shiftType] ?? ticket.shiftType} · ${ticket.timeRange}`}
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
              label="Phí đặt lịch"
              value={
                ticket.bookingFeePaid
                  ? `Đã thanh toán ${formatVndFromCents(ticket.bookingFeeCents)}`
                  : 'Chưa thanh toán'
              }
              tone="success"
            />
            <InfoBlock label="Phí khám dịch vụ" value="Thanh toán tại quầy sau khi khám" />
            {ticket.serviceName && <InfoBlock label="Dịch vụ" value={ticket.serviceName} />}
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
        <p>
          {ticket.queueNumber === null
            ? 'Số thứ tự hiện tại chỉ là mốc tham khảo trước khi check-in. Khi tới quầy, hệ thống sẽ cấp số chính thức cho bạn.'
            : 'Số thứ tự đang hiển thị là số đã được cấp cho bạn trong ca khám này.'}
        </p>
        <p className="mt-2">
          Nếu cần hỗ trợ, bạn chỉ cần đọc số điện thoại <strong>{ticket.patientPhone}</strong> cho
          nhân viên lễ tân.
        </p>
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        data-testid="patient-booking-ticket-download"
      >
        <span className="material-symbols-outlined text-base">download</span>
        <span>Lưu ảnh phiếu khám</span>
      </button>

      {downloadPopup && (
        <div
          className={`fixed right-5 top-5 z-50 rounded-2xl border bg-white px-4 py-3 text-sm font-medium shadow-lg ${
            isDownloadError ? 'border-red-200 text-red-700' : 'border-emerald-200 text-emerald-700'
          }`}
        >
          {downloadPopup}
        </div>
      )}
    </div>
  );
}

function HeaderInfo({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p
        className={`mt-2 font-semibold text-slate-950 ${emphasize ? 'text-4xl tracking-tight' : 'text-lg'}`}
      >
        {value}
      </p>
    </div>
  );
}

function InfoBlock({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'success';
}) {
  const toneClass =
    tone === 'success' ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50';

  return (
    <div className={`rounded-[24px] border p-4 ${toneClass}`}>
      <p className="text-xs uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{value}</p>
    </div>
  );
}

function buildTicketCode(bookingId: string, date: string) {
  const compactDate = date.replaceAll('-', '').slice(2);
  return `PK-${compactDate}-${bookingId.slice(0, 6).toUpperCase()}`;
}

function formatClock(value: string) {
  return formatTimeUtc7(value, {
    hour: '2-digit',
    minute: '2-digit',
  });
}
