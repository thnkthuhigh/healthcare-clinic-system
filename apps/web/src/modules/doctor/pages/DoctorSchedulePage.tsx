import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

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
  return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
}

function formatLongDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatClock(value: string | null | undefined) {
  if (!value) return '--:--';
  return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function shiftLabel(type: ShiftType) {
  return type === 'MORNING' ? 'Ca sang' : 'Ca chieu';
}

function shiftChip(type: ShiftType) {
  return type === 'MORNING'
    ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300'
    : 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-300';
}

function getChannelLabel(channel: string) {
  return channel === 'WEB' ? 'Dat truoc' : 'Tai quay';
}

function statusLabel(status: string) {
  return (
    {
      BOOKED: 'Da dat',
      CHECKED_IN: 'Da check-in',
      WAITING: 'Dang cho',
      IN_CONSULTATION: 'Dang kham',
      PENDING_LAB: 'Cho ket qua CLS',
      RESULTS_READY: 'Co ket qua',
      COMPLETED: 'Hoan thanh',
      NO_SHOW: 'Vang mat',
      CANCELED: 'Da huy',
    }[status] ?? status
  );
}

function statusChip(status: string) {
  return (
    {
      BOOKED:
        'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-900/20 dark:text-sky-300',
      CHECKED_IN:
        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300',
      WAITING:
        'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
      IN_CONSULTATION:
        'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-300',
      PENDING_LAB:
        'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-800 dark:bg-fuchsia-900/20 dark:text-fuchsia-300',
      RESULTS_READY:
        'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      COMPLETED:
        'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
    }[status] ??
    'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
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
        setError('Khong the tai lich lam viec cua bac si');
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
  const shiftsByDate = schedule.reduce<Record<string, ScheduleShift[]>>((acc, shift) => {
    const items = acc[shift.date] ?? [];
    items.push(shift);
    acc[shift.date] = items.sort(
      (a, b) => SHIFT_ORDER.indexOf(a.type) - SHIFT_ORDER.indexOf(b.type),
    );
    return acc;
  }, {});

  const calendarDays: Date[] = [];
  for (
    let day = startOfCalendar(viewMonth);
    day <= endOfCalendar(viewMonth);
    day = addDays(day, 1)
  ) {
    calendarDays.push(day);
  }

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

  const monthPatients = schedule.reduce((sum, shift) => sum + shift.totalPatients, 0);
  const monthMorning = schedule
    .filter((shift) => shift.type === 'MORNING')
    .reduce((sum, shift) => sum + shift.totalPatients, 0);
  const monthAfternoon = schedule
    .filter((shift) => shift.type === 'AFTERNOON')
    .reduce((sum, shift) => sum + shift.totalPatients, 0);
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
      await consultationApi.invitePatient(bookingId);
      navigate(`/doctor/consultation/${bookingId}`);
    } catch {
      setError('Khong the moi benh nhan vao phong kham');
    } finally {
      setStartingBookingId(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-background-dark">
      <div className="mx-auto max-w-7xl space-y-8 p-6">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_320px]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 dark:border-sky-800 dark:bg-sky-900/20 dark:text-sky-300">
                  <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                  Monthly schedule
                </span>
                <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Lich kham theo thang
                </h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Chon ngay trong lich de mo bang chi tiet benh nhan theo tung khung gio.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMonth(startOfMonth(addMonths(viewMonth, -1)))}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                <button
                  onClick={goToToday}
                  className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  Ve hom nay
                </button>
                <button
                  onClick={() => setViewMonth(startOfMonth(addMonths(viewMonth, 1)))}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Ca trong thang</p>
                <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                  {schedule.length}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Tong benh nhan</p>
                <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                  {monthPatients}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Bac si</p>
                <p className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
                  {doctor?.displayName ?? 'Dang tai...'}
                </p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {doctor?.specialty ?? 'Chua cap nhat chuyen khoa'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Ngay dang chon</p>
              <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                {formatLongDate(selectedDateKey)}
              </h2>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Sang</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                    {selectedMorning}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Chieu</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                    {selectedAfternoon}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('detail')}
                className="mt-5 inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                Mo chi tiet ngay
              </button>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Phan bo ca</p>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="mb-2 flex justify-between text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    <span>Sang</span>
                    <span>
                      {monthPatients === 0 ? 0 : Math.round((monthMorning / monthPatients) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{
                        width: `${monthPatients === 0 ? 0 : Math.round((monthMorning / monthPatients) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    <span>Chieu</span>
                    <span>
                      {monthPatients === 0 ? 0 : Math.round((monthAfternoon / monthPatients) * 100)}
                      %
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-cyan-400"
                      style={{
                        width: `${monthPatients === 0 ? 0 : Math.round((monthAfternoon / monthPatients) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
            {error}
          </div>
        )}

        <section className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="inline-flex rounded-full bg-slate-100 p-1 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setActiveTab('month')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === 'month'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Lich thang
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('detail')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === 'detail'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Chi tiet ngay
            </button>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {activeTab === 'month'
              ? 'Bam vao o ngay de mo tab chi tiet ngay.'
              : `Dang xem ${formatLongDate(selectedDateKey)}`}
          </p>
        </section>

        {activeTab === 'month' && (
          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Lich thang</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {formatMonthYear(viewMonth)}
                </h2>
              </div>
              <span className="hidden rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300 md:inline-flex">
                Chon ngay
              </span>
            </div>
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:border-slate-800 dark:bg-slate-900/70">
              {DAY_LABELS.map((label) => (
                <div key={label}>{label}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-800">
              {calendarDays.map((day) => {
                const dateKey = toDateKey(day);
                const dayShifts = shiftsByDate[dateKey] ?? [];
                const morning = dayShifts
                  .filter((shift) => shift.type === 'MORNING')
                  .reduce((sum, shift) => sum + shift.totalPatients, 0);
                const afternoon = dayShifts
                  .filter((shift) => shift.type === 'AFTERNOON')
                  .reduce((sum, shift) => sum + shift.totalPatients, 0);
                return (
                  <button
                    key={dateKey}
                    onClick={() => selectDate(day)}
                    className={`min-h-[154px] bg-white p-3 text-left transition-colors dark:bg-slate-950 ${isSameDay(day, selectedDate) ? 'ring-2 ring-inset ring-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-900'} ${isSameMonth(day, viewMonth) ? '' : 'opacity-40'}`}
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className={`inline-flex h-8 min-w-[32px] items-center justify-center rounded-full px-2 text-sm font-bold ${isSameDay(day, selectedDate) ? 'bg-primary text-white' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'}`}
                      >
                        {day.getDate()}
                      </span>
                      {isSameDay(day, today) && (
                        <span className="rounded-full bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                          Hom nay
                        </span>
                      )}
                    </div>
                    <div className="mt-4 space-y-2">
                      {dayShifts.length === 0 && (
                        <div className="flex h-[72px] items-center justify-center rounded-2xl border border-dashed border-slate-200 text-[11px] font-medium text-slate-400 dark:border-slate-800 dark:text-slate-500">
                          Khong co ca
                        </div>
                      )}
                      {morning > 0 && (
                        <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                          <span className="inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">
                              light_mode
                            </span>
                            Sang
                          </span>
                          <span>{morning}</span>
                        </div>
                      )}
                      {afternoon > 0 && (
                        <div className="flex items-center justify-between rounded-2xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 dark:border-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-300">
                          <span className="inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">
                              partly_cloudy_day
                            </span>
                            Chieu
                          </span>
                          <span>{afternoon}</span>
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
          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="border-b border-slate-200 px-6 py-6 dark:border-slate-800">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => selectDate(addDays(selectedDate, -1))}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                  </button>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Chi tiet ngay
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                      {formatLongDate(selectedDateKey)}
                    </h2>
                  </div>
                  <button
                    onClick={() => selectDate(addDays(selectedDate, 1))}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </button>
                </div>
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <button
                    onClick={() => setActiveTab('month')}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Ve lich thang
                  </button>
                  <div className="relative min-w-[260px]">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      search
                    </span>
                    <input
                      type="text"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      placeholder="Tim benh nhan, SDT, dich vu..."
                    />
                  </div>
                  <button
                    onClick={goToToday}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Ve hom nay
                  </button>
                </div>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Tong lich</p>
                  <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                    {rows.length}
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-900/50 dark:bg-emerald-900/10">
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-500">Hoan thanh</p>
                  <p className="mt-3 text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                    {selectedCompleted}
                  </p>
                </div>
                <div className="rounded-2xl border border-cyan-200 bg-cyan-50/80 p-4 dark:border-cyan-900/50 dark:bg-cyan-900/10">
                  <p className="text-xs uppercase tracking-[0.18em] text-cyan-600">Da check-in</p>
                  <p className="mt-3 text-3xl font-bold text-cyan-700 dark:text-cyan-300">
                    {selectedCheckedIn}
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/50 dark:bg-amber-900/10">
                  <p className="text-xs uppercase tracking-[0.18em] text-amber-600">Cho check-in</p>
                  <p className="mt-3 text-3xl font-bold text-amber-700 dark:text-amber-300">
                    {selectedBooked}
                  </p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-[260px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-16 text-center">
                <div className="mb-4 rounded-full bg-slate-100 p-5 dark:bg-slate-900">
                  <span className="material-symbols-outlined text-4xl text-slate-400">
                    event_busy
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Khong co lich chi tiet
                </h3>
                <p className="mt-2 max-w-lg text-sm text-slate-500 dark:text-slate-400">
                  {search
                    ? 'Khong tim thay benh nhan phu hop voi bo loc hien tai.'
                    : 'Ngay nay chua co benh nhan dat lich hoac bac si chua duoc xep ca.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400">
                      <th className="px-6 py-4">Gio hen</th>
                      <th className="px-6 py-4">Benh nhan</th>
                      <th className="px-6 py-4">Ca kham</th>
                      <th className="px-6 py-4">Dich vu</th>
                      <th className="px-6 py-4">Trang thai</th>
                      <th className="px-6 py-4 text-right">Thao tac</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredRows.map(({ shift, booking }) => (
                      <tr
                        key={booking.id}
                        className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40"
                      >
                        <td className="px-6 py-4 align-top">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {formatClock(booking.appointmentTime)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Slot #{booking.slotSequence}
                          </p>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {booking.patient.fullName}
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {booking.patient.phone} • {booking.patient.age ?? '--'} tuoi
                          </p>
                          {booking.patient.allergies && (
                            <span className="mt-2 inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
                              Di ung: {booking.patient.allergies}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 align-top">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${shiftChip(shift.type)}`}
                          >
                            {shiftLabel(shift.type)}
                          </span>
                          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            {shift.timeRange} • {getChannelLabel(booking.channel)}
                          </p>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {booking.serviceName ?? 'Chua chon dich vu'}
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
                              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              Mo queue
                            </Link>
                            {booking.status === 'IN_CONSULTATION' ? (
                              <Link
                                to={`/doctor/consultation/${booking.id}`}
                                className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                              >
                                Tiep tuc
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
                                Bat dau
                              </button>
                            ) : (
                              <span className="inline-flex rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                {booking.status === 'BOOKED' ? 'Cho check-in' : 'Dang xu ly'}
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
