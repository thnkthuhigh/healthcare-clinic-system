import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { OpsPageHeader } from '../../../components/ClinicUI';
import { formatDateUtc7, formatTimeUtc7 } from '../../../lib/time';
import { useAuth } from '../../auth/useAuth';
import { consultationApi, doctorApi } from '../api';
import type { Doctor, ScheduleShift, ShiftType } from '../types';

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const SHIFT_ORDER: ShiftType[] = ['MORNING', 'AFTERNOON'];
type ScheduleTab = 'month' | 'detail';

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfMonth(date: Date) {
  const next = startOfDay(date);
  next.setDate(1);
  return next;
}

function endOfMonth(date: Date) {
  const next = startOfMonth(date);
  next.setMonth(next.getMonth() + 1);
  next.setDate(0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = startOfDay(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  const next = startOfDay(date);
  const day = next.getDate();
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, lastDay));
  return next;
}

function startOfCalendar(date: Date) {
  const next = startOfMonth(date);
  next.setDate(next.getDate() - next.getDay());
  return next;
}

function endOfCalendar(date: Date) {
  const next = endOfMonth(date);
  next.setDate(next.getDate() + (6 - next.getDay()));
  return next;
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

function isSameDay(left: Date, right: Date) {
  return toDateKey(left) === toDateKey(right);
}

function isSameMonth(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

function formatMonthYear(date: Date) {
  return formatDateUtc7(date, { month: 'long', year: 'numeric' });
}

function formatLongDate(value: string) {
  return formatDateUtc7(value, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatClock(value: string | null | undefined) {
  if (!value) return '--:--';
  return formatTimeUtc7(value, { hour: '2-digit', minute: '2-digit' });
}

function shiftLabel(type: ShiftType) {
  return type === 'MORNING' ? 'Ca sáng' : 'Ca chiều';
}

function shiftChip(type: ShiftType) {
  return type === 'MORNING'
    ? 'border-amber-200 bg-amber-50 text-amber-700'
    : 'border-cyan-200 bg-cyan-50 text-cyan-700';
}

function getChannelLabel(channel: string) {
  return channel === 'WEB' ? 'Đặt trước' : 'Tại quầy';
}

function statusLabel(status: string) {
  return (
    {
      BOOKED: 'Đã đặt',
      CHECKED_IN: 'Đã check-in',
      WAITING: 'Đang chờ',
      IN_CONSULTATION: 'Đang khám',
      PENDING_LAB: 'Chờ kết quả CLS',
      RESULTS_READY: 'Có kết quả',
      COMPLETED: 'Hoàn thành',
      NO_SHOW: 'Vắng mặt',
      CANCELED: 'Đã hủy',
    }[status] ?? status
  );
}

function statusChip(status: string) {
  return (
    {
      BOOKED: 'border-sky-200 bg-sky-50 text-sky-700',
      CHECKED_IN: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      WAITING: 'border-amber-200 bg-amber-50 text-amber-700',
      IN_CONSULTATION: 'border-violet-200 bg-violet-50 text-violet-700',
      PENDING_LAB: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700',
      RESULTS_READY: 'border-blue-200 bg-blue-50 text-blue-700',
      COMPLETED: 'border-slate-200 bg-slate-100 text-slate-700',
      NO_SHOW: 'border-rose-200 bg-rose-50 text-rose-700',
      CANCELED: 'border-slate-200 bg-slate-100 text-slate-500',
    }[status] ?? 'border-slate-200 bg-slate-100 text-slate-700'
  );
}

function canStart(status: string) {
  return status === 'CHECKED_IN' || status === 'WAITING' || status === 'RESULTS_READY';
}

function compareShift(left: ScheduleShift, right: ScheduleShift) {
  const dateCompare = left.date.localeCompare(right.date);
  if (dateCompare !== 0) return dateCompare;
  return SHIFT_ORDER.indexOf(left.type) - SHIFT_ORDER.indexOf(right.type);
}

export function DoctorSchedulePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [activeTab, setActiveTab] = useState<ScheduleTab>('month');
  const [schedule, setSchedule] = useState<ScheduleShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [startingBookingId, setStartingBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    doctorApi.getProfile(user.id).then(setDoctor).catch(console.error);
  }, [user]);

  useEffect(() => {
    if (!doctor) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await doctorApi.getScheduleDetails(
          doctor.id,
          toDateKey(startOfMonth(viewMonth)),
          toDateKey(endOfMonth(viewMonth)),
        );
        setSchedule([...data].sort(compareShift));
      } catch {
        setError('Không thể tải lịch làm việc của bác sĩ.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [doctor, viewMonth]);

  useEffect(() => {
    setSearch('');
  }, [selectedDate]);

  const today = startOfDay(new Date());

  const shiftsByDate = useMemo(() => {
    return schedule.reduce<Record<string, ScheduleShift[]>>((acc, shift) => {
      const items = acc[shift.date] ?? [];
      items.push(shift);
      acc[shift.date] = items.sort(
        (a, b) => SHIFT_ORDER.indexOf(a.type) - SHIFT_ORDER.indexOf(b.type),
      );
      return acc;
    }, {});
  }, [schedule]);

  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    for (
      let day = startOfCalendar(viewMonth);
      day <= endOfCalendar(viewMonth);
      day = addDays(day, 1)
    ) {
      days.push(day);
    }
    return days;
  }, [viewMonth]);

  const selectedDateKey = toDateKey(selectedDate);
  const selectedShifts = shiftsByDate[selectedDateKey] ?? [];

  const rows = selectedShifts
    .flatMap((shift) => shift.bookings.map((booking) => ({ shift, booking })))
    .sort((left, right) =>
      left.booking.appointmentTime.localeCompare(right.booking.appointmentTime),
    );

  const filteredRows = rows.filter(({ booking }) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      booking.patient.fullName.toLowerCase().includes(query) ||
      booking.patient.phone.toLowerCase().includes(query) ||
      (booking.serviceName ?? '').toLowerCase().includes(query)
    );
  });

  const monthTotalShifts = schedule.length;
  const monthPatients = schedule.reduce((sum, shift) => sum + shift.totalPatients, 0);
  const monthMorningShifts = schedule.filter((shift) => shift.type === 'MORNING').length;
  const monthAfternoonShifts = schedule.filter((shift) => shift.type === 'AFTERNOON').length;
  const selectedMorning = selectedShifts
    .filter((shift) => shift.type === 'MORNING')
    .reduce((sum, shift) => sum + shift.totalPatients, 0);
  const selectedAfternoon = selectedShifts
    .filter((shift) => shift.type === 'AFTERNOON')
    .reduce((sum, shift) => sum + shift.totalPatients, 0);
  const selectedCompleted = rows.filter((row) => row.booking.status === 'COMPLETED').length;
  const selectedCheckedIn = rows.filter((row) => canStart(row.booking.status)).length;
  const selectedBooked = rows.filter((row) => row.booking.status === 'BOOKED').length;

  const selectDate = (date: Date) => {
    const next = startOfDay(date);
    setSelectedDate(next);
    setActiveTab('detail');
    if (!isSameMonth(next, viewMonth)) setViewMonth(startOfMonth(next));
  };

  const goToToday = () => {
    setSelectedDate(today);
    setViewMonth(startOfMonth(today));
  };

  const handleStart = async (bookingId: string) => {
    try {
      setStartingBookingId(bookingId);
      setError(null);
      await consultationApi.invitePatient(bookingId);
      navigate(`/doctor/consultation/${bookingId}`);
    } catch {
      setError('Không thể mời bệnh nhân vào phòng khám.');
    } finally {
      setStartingBookingId(null);
    }
  };

  return (
    <div className="min-h-full bg-[#f4f7fa]">
      <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
        <OpsPageHeader
          eyebrow="Lịch bác sĩ"
          title="Lịch khám theo tháng"
          description={`Đang xem ${formatMonthYear(viewMonth)}`}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMonth(startOfMonth(addMonths(viewMonth, -1)))}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={goToToday}
                className="btn-secondary rounded-full px-4 py-2.5"
              >
                Về hôm nay
              </button>
              <button
                type="button"
                onClick={() => setViewMonth(startOfMonth(addMonths(viewMonth, 1)))}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          }
        />

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="ops-panel">
            <p className="ops-section-label">Thông tin bác sĩ</p>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {doctor?.displayName ?? 'Đang tải...'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {doctor?.specialty ?? 'Chưa cập nhật chuyên khoa'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('detail')}
                className="btn-secondary rounded-full px-4 py-2"
              >
                Mở chi tiết ngày
              </button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <SummaryItem label="Ca trong tháng" value={String(schedule.length)} />
              <SummaryItem label="Tổng bệnh nhân" value={String(monthPatients)} />
              <SummaryItem label="Đang chọn" value={formatLongDate(selectedDateKey)} compact />
            </div>
          </div>

          <div className="space-y-4">
            <div className="ops-panel p-5">
              <p className="ops-section-label">Ngày đang chọn</p>
              <h3 className="mt-3 text-xl font-bold text-slate-900">
                {formatLongDate(selectedDateKey)}
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <SummaryItem label="Sáng" value={String(selectedMorning)} compact />
                <SummaryItem label="Chiều" value={String(selectedAfternoon)} compact />
              </div>
            </div>

            <div className="ops-panel p-5">
              <p className="ops-section-label">Phân bổ ca</p>
              <div className="mt-4 space-y-4">
                <ProgressRow
                  label="Ca sáng"
                  value={
                    monthTotalShifts === 0
                      ? 0
                      : Math.round((monthMorningShifts / monthTotalShifts) * 100)
                  }
                  tone="amber"
                />
                <ProgressRow
                  label="Ca chiều"
                  value={
                    monthTotalShifts === 0
                      ? 0
                      : Math.round((monthAfternoonShifts / monthTotalShifts) * 100)
                  }
                  tone="cyan"
                />
              </div>
            </div>
          </div>
        </section>

        {error && <div className="surface-alert">{error}</div>}

        <section className="ops-panel flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="inline-flex rounded-full bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('month')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === 'month'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Lịch tháng
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('detail')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === 'detail'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Chi tiết ngày
            </button>
          </div>
        </section>

        {activeTab === 'month' && (
          <section className="ops-panel overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="ops-section-label">Lịch tháng</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  {formatMonthYear(viewMonth)}
                </h2>
              </div>
              <span className="hidden rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 md:inline-flex">
                Chọn ngày
              </span>
            </div>

            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              {DAY_LABELS.map((label) => (
                <div key={label}>{label}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-px bg-slate-200">
              {calendarDays.map((day) => {
                const dateKey = toDateKey(day);
                const dayShifts = shiftsByDate[dateKey] ?? [];
                const hasMorningShift = dayShifts.some((shift) => shift.type === 'MORNING');
                const hasAfternoonShift = dayShifts.some((shift) => shift.type === 'AFTERNOON');
                const morningPatients = dayShifts
                  .filter((shift) => shift.type === 'MORNING')
                  .reduce((sum, shift) => sum + shift.totalPatients, 0);
                const afternoonPatients = dayShifts
                  .filter((shift) => shift.type === 'AFTERNOON')
                  .reduce((sum, shift) => sum + shift.totalPatients, 0);

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => selectDate(day)}
                    className={`min-h-[154px] bg-white p-3 text-left transition-colors ${
                      isSameDay(day, selectedDate)
                        ? 'ring-2 ring-inset ring-primary'
                        : 'hover:bg-slate-50'
                    } ${isSameMonth(day, viewMonth) ? '' : 'opacity-40'}`}
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className={`inline-flex h-8 min-w-[32px] items-center justify-center rounded-full px-2 text-sm font-bold ${
                          isSameDay(day, selectedDate)
                            ? 'bg-primary text-white'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {day.getDate()}
                      </span>
                      {isSameDay(day, today) && (
                        <span className="rounded-full bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                          Hôm nay
                        </span>
                      )}
                    </div>

                    <div className="mt-4 space-y-2">
                      {dayShifts.length === 0 && (
                        <div className="flex h-[72px] items-center justify-center rounded-2xl border border-dashed border-slate-200 text-[11px] font-medium text-slate-400">
                          Không có ca
                        </div>
                      )}
                      {hasMorningShift && (
                        <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                          <span className="inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">
                              light_mode
                            </span>
                            Sáng
                          </span>
                          <span>{morningPatients}</span>
                        </div>
                      )}
                      {hasAfternoonShift && (
                        <div className="flex items-center justify-between rounded-2xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700">
                          <span className="inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">
                              partly_cloudy_day
                            </span>
                            Chiều
                          </span>
                          <span>{afternoonPatients}</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === 'detail' && (
          <section className="ops-panel overflow-hidden p-0">
            <div className="border-b border-slate-200 px-6 py-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => selectDate(addDays(selectedDate, -1))}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                  </button>

                  <div>
                    <p className="ops-section-label">Chi tiết ngày</p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-900">
                      {formatLongDate(selectedDateKey)}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => selectDate(addDays(selectedDate, 1))}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </button>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <button
                    type="button"
                    onClick={() => setActiveTab('month')}
                    className="btn-secondary px-4 py-3"
                  >
                    Về lịch tháng
                  </button>
                  <div className="relative min-w-[260px]">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      search
                    </span>
                    <input
                      type="text"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="input-field py-3 pl-10 pr-4"
                      placeholder="Tìm bệnh nhân, SĐT, dịch vụ..."
                    />
                  </div>
                  <button type="button" onClick={goToToday} className="btn-secondary px-4 py-3">
                    Về hôm nay
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SummaryItem label="Tổng lịch" value={String(rows.length)} compact />
                <SummaryItem
                  label="Hoàn thành"
                  value={String(selectedCompleted)}
                  compact
                  tone="emerald"
                />
                <SummaryItem
                  label="Đang chờ khám"
                  value={String(selectedCheckedIn)}
                  compact
                  tone="cyan"
                />
                <SummaryItem
                  label="Chờ check-in"
                  value={String(selectedBooked)}
                  compact
                  tone="amber"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-[260px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-16 text-center">
                <div className="mb-4 rounded-full bg-slate-100 p-5">
                  <span className="material-symbols-outlined text-4xl text-slate-400">
                    event_busy
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Không có lịch chi tiết</h3>
                <p className="mt-2 max-w-lg text-sm text-slate-500">
                  {search
                    ? 'Không tìm thấy bệnh nhân phù hợp với bộ lọc hiện tại.'
                    : 'Ngày này chưa có bệnh nhân đặt lịch hoặc bác sĩ chưa được xếp ca.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      <th className="px-6 py-4">Giờ hẹn</th>
                      <th className="px-6 py-4">Bệnh nhân</th>
                      <th className="px-6 py-4">Ca khám</th>
                      <th className="px-6 py-4">Dịch vụ</th>
                      <th className="px-6 py-4">Trạng thái</th>
                      <th className="px-6 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRows.map(({ shift, booking }) => (
                      <tr key={booking.id} className="transition-colors hover:bg-slate-50">
                        <td className="px-6 py-4 align-top">
                          <p className="text-sm font-bold text-slate-900">
                            {formatClock(booking.appointmentTime)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Slot #{booking.slotSequence}
                          </p>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <p className="text-sm font-semibold text-slate-900">
                            {booking.patient.fullName}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {booking.patient.phone} • {booking.patient.age ?? '--'} tuổi
                          </p>
                          {booking.patient.allergies && (
                            <span className="mt-2 inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
                              Dị ứng: {booking.patient.allergies}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 align-top">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${shiftChip(shift.type)}`}
                          >
                            {shiftLabel(shift.type)}
                          </span>
                          <p className="mt-2 text-xs text-slate-500">
                            {shift.timeRange} • {getChannelLabel(booking.channel)}
                          </p>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            {booking.serviceName ?? 'Chưa chọn dịch vụ'}
                          </span>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusChip(booking.status)}`}
                          >
                            {statusLabel(booking.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 align-top text-right">
                          <div className="flex justify-end gap-2">
                            <Link
                              to={`/doctor/queue/${shift.id}`}
                              className="btn-secondary rounded-xl px-3 py-2 text-xs"
                            >
                              Mở queue
                            </Link>
                            {booking.status === 'IN_CONSULTATION' ? (
                              <Link
                                to={`/doctor/consultation/${booking.id}`}
                                className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                              >
                                Tiếp tục
                              </Link>
                            ) : canStart(booking.status) ? (
                              <button
                                type="button"
                                onClick={() => handleStart(booking.id)}
                                disabled={startingBookingId === booking.id}
                                className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
                              >
                                {startingBookingId === booking.id ? (
                                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                                ) : (
                                  <span className="material-symbols-outlined text-[16px]">
                                    play_arrow
                                  </span>
                                )}
                                Bắt đầu
                              </button>
                            ) : (
                              <span className="inline-flex rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
                                {booking.status === 'BOOKED' ? 'Chờ check-in' : 'Đang xử lý'}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function SummaryItem({
  label,
  value,
  compact = false,
  tone = 'default',
}: {
  label: string;
  value: string;
  compact?: boolean;
  tone?: 'default' | 'emerald' | 'cyan' | 'amber';
}) {
  const toneClass = {
    default: 'border-slate-200 bg-slate-50 text-slate-900',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    cyan: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
  }[tone];

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className={`${compact ? 'mt-2 text-2xl' : 'mt-3 text-3xl'} font-bold`}>{value}</p>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'amber' | 'cyan';
}) {
  const barClass = tone === 'amber' ? 'bg-amber-400' : 'bg-cyan-400';

  return (
    <div>
      <div className="mb-2 flex justify-between text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
