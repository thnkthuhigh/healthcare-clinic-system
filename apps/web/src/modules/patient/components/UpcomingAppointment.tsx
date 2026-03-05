import { Link } from 'react-router-dom';

import type { MockAppointment } from '../mock';

const STATUS_CONFIG: Record<
  MockAppointment['status'],
  { label: string; bg: string; text: string; dot: string }
> = {
  BOOKED: { label: 'Đã đặt lịch', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  CHECKED_IN: {
    label: 'Đã check-in',
    bg: 'bg-green-100',
    text: 'text-green-700',
    dot: 'bg-green-500',
  },
  COMPLETED: {
    label: 'Hoàn thành',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
  },
  CANCELED: { label: 'Đã hủy', bg: 'bg-red-100', text: 'text-red-600', dot: 'bg-red-500' },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

interface UpcomingAppointmentProps {
  appointments: MockAppointment[];
}

export function UpcomingAppointment({ appointments }: UpcomingAppointmentProps) {
  const upcoming = appointments.find((a) => a.status === 'BOOKED' || a.status === 'CHECKED_IN');

  return (
    <section>
      <h2 className="text-xl font-bold text-slate-900 mb-4">Lịch khám sắp tới</h2>

      {upcoming ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 hover:shadow-sm transition-shadow">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-blue-600">person</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-slate-900">{upcoming.doctorName}</h3>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_CONFIG[upcoming.status].bg} ${STATUS_CONFIG[upcoming.status].text}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[upcoming.status].dot}`}
                  />
                  {STATUS_CONFIG[upcoming.status].label}
                </span>
              </div>
              <p className="text-sm text-slate-500">{upcoming.specialty}</p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-slate-600 mt-2">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-slate-400 text-base">
                    calendar_month
                  </span>
                  {formatDate(upcoming.date)}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-slate-400 text-base">
                    schedule
                  </span>
                  {upcoming.time} – {upcoming.shift}
                </span>
              </div>
            </div>
          </div>
          <Link
            to={`/appointments/${upcoming.id}`}
            className="flex-shrink-0 px-5 py-2 rounded-xl border border-blue-600 text-blue-600 text-sm font-medium hover:bg-blue-50 transition-colors"
          >
            Xem chi tiết
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300">calendar_month</span>
          <p className="text-slate-500 mt-3 font-medium">Bạn chưa có lịch khám sắp tới</p>
          <p className="text-slate-400 text-sm mt-1">Đặt lịch để được chăm sóc sức khỏe tốt hơn</p>
          <Link
            to="/booking"
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <span className="material-symbols-outlined text-base">calendar_add_on</span>
            Đặt lịch ngay
          </Link>
        </div>
      )}
    </section>
  );
}
