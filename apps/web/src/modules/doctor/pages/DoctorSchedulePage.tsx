import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../auth/useAuth';
import { doctorApi } from '../api';
import type { Doctor, Shift } from '../types';

const DAYS_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTHS_VI = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
];

function getShiftLabel(type: string) {
  if (type === 'MORNING') return 'Sáng';
  if (type === 'AFTERNOON') return 'Chiều';
  return 'Tối';
}

function getShiftColor(type: string) {
  if (type === 'MORNING')
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800';
  if (type === 'AFTERNOON')
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800';
  return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800';
}

function getShiftDot(type: string) {
  if (type === 'MORNING') return 'bg-amber-500';
  if (type === 'AFTERNOON') return 'bg-blue-500';
  return 'bg-purple-500';
}

function formatDateParamYMD(d: Date): string {
  return d.toISOString().split('T').at(0) ?? '';
}

export function DoctorSchedulePage() {
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split('T').at(0) ?? '',
  );

  // Fetch doctor profile once
  useEffect(() => {
    if (!user) return;
    doctorApi.getProfile(user.id).then(setDoctor).catch(console.error);
  }, [user]);

  // Fetch schedule when month changes
  useEffect(() => {
    if (!doctor) return;
    const fetchSchedule = async () => {
      setLoading(true);
      setError(null);
      try {
        const from = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const to = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        const data = await doctorApi.getSchedule(
          doctor.id,
          formatDateParamYMD(from),
          formatDateParamYMD(to),
        );
        setShifts(data);
      } catch {
        setError('Không thể tải lịch làm việc');
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, [doctor, currentMonth]);

  // Build calendar days
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calDays: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (calDays.length % 7 !== 0) calDays.push(null);

  const shiftsByDate = shifts.reduce<Record<string, Shift[]>>((acc, s) => {
    const key = typeof s.date === 'string' ? s.date : String(s.date);
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const today: string = new Date().toISOString().split('T').at(0) ?? '';
  const selectedShifts = shiftsByDate[selectedDate] || [];

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));
  const goToday = () => {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now.toISOString().split('T').at(0) ?? '');
  };

  const totalThisMonth = shifts.length;
  const totalPatients = shifts.reduce((s, sh) => s + sh.totalPatients, 0);

  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-background-dark p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Lịch làm việc</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {doctor?.displayName} · {doctor?.specialty}
            </p>
          </div>
          <button
            onClick={goToday}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Hôm nay
          </button>
        </div>

        {error && (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-400">
            {error}
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">calendar_month</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalThisMonth}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Ca trong tháng</p>
            </div>
          </div>
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-green-600">groups</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalPatients}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Bệnh nhân trong tháng</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            {/* Month Nav */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={prevMonth}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-slate-500">chevron_left</span>
              </button>
              <h2 className="font-semibold text-slate-900 dark:text-white">
                {MONTHS_VI[month]} {year}
              </h2>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-slate-500">chevron_right</span>
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
              {DAYS_VI.map((d) => (
                <div
                  key={d}
                  className="py-2 text-center text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar cells */}
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {calDays.map((day, idx) => {
                  if (day === null) {
                    return (
                      <div
                        key={`empty-${idx}`}
                        className="h-20 border-b border-r border-slate-100 dark:border-slate-800"
                      />
                    );
                  }
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayShifts = shiftsByDate[dateStr] || [];
                  const isToday = dateStr === today;
                  const isSelected = dateStr === selectedDate;

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`h-20 border-b border-r border-slate-100 dark:border-slate-800 p-1.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                        isSelected ? 'bg-primary/5 dark:bg-primary/10 border-primary/20' : ''
                      }`}
                    >
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold mb-1 ${
                          isToday
                            ? 'bg-primary text-white'
                            : isSelected
                              ? 'text-primary dark:text-primary-light font-bold'
                              : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {day}
                      </span>
                      <div className="flex flex-col gap-0.5">
                        {dayShifts.slice(0, 2).map((sh) => (
                          <div key={sh.id} className="flex items-center gap-1">
                            <span
                              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getShiftDot(sh.type)}`}
                            />
                            <span className="text-[10px] text-slate-600 dark:text-slate-400 truncate">
                              {getShiftLabel(sh.type)}
                            </span>
                          </div>
                        ))}
                        {dayShifts.length > 2 && (
                          <span className="text-[10px] text-slate-400">
                            +{dayShifts.length - 2}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Day Detail */}
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-800 dark:text-white">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('vi-VN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </h3>
            </div>

            <div className="p-4 space-y-3">
              {selectedShifts.length === 0 ? (
                <div className="text-center py-10">
                  <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">
                    event_busy
                  </span>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    Không có ca làm việc
                  </p>
                </div>
              ) : (
                selectedShifts.map((shift) => {
                  const progress =
                    shift.totalPatients > 0
                      ? Math.round((shift.completedCount / shift.totalPatients) * 100)
                      : 0;
                  return (
                    <div
                      key={shift.id}
                      className={`rounded-xl border p-4 ${getShiftColor(shift.type)}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-bold text-sm">Ca {getShiftLabel(shift.type)}</p>
                          <p className="text-xs opacity-70">{shift.timeRange}</p>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            shift.status === 'OPEN'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {shift.status === 'OPEN' ? 'Mở' : 'Đóng'}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs opacity-80 mb-3">
                        <div className="flex justify-between">
                          <span>Tổng bệnh nhân</span>
                          <span className="font-bold">{shift.totalPatients}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Đang chờ</span>
                          <span className="font-bold">
                            {shift.waitingCount + shift.checkedInCount}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Hoàn thành</span>
                          <span className="font-bold">{shift.completedCount}</span>
                        </div>
                        {shift.totalPatients > 0 && (
                          <div className="pt-1">
                            <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-black/30 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-[10px] opacity-60">{progress}% tiến độ</span>
                          </div>
                        )}
                      </div>

                      <Link
                        to={`/doctor/queue/${shift.id}`}
                        className="flex items-center justify-center gap-1.5 w-full py-2 bg-white/50 dark:bg-black/20 hover:bg-white/70 dark:hover:bg-black/30 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">queue</span>
                        Xem hàng chờ
                      </Link>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Upcoming shifts list */}
        {shifts.length > 0 && !loading && (
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="font-semibold text-slate-900 dark:text-white">
                Tất cả ca trong tháng
              </h2>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {shifts.map((shift) => {
                const dateStr = typeof shift.date === 'string' ? shift.date : String(shift.date);
                const isToday = dateStr === today;
                return (
                  <div
                    key={shift.id}
                    className={`flex items-center gap-4 px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                      isToday ? 'bg-primary/5 dark:bg-primary/10' : ''
                    }`}
                  >
                    <div className="w-12 text-center">
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {DAYS_VI[new Date(dateStr + 'T00:00:00').getDay()]}
                      </p>
                      <p
                        className={`text-xl font-bold ${isToday ? 'text-primary' : 'text-slate-700 dark:text-slate-200'}`}
                      >
                        {new Date(dateStr + 'T00:00:00').getDate()}
                      </p>
                    </div>
                    <div
                      className={`w-1.5 h-10 rounded-full flex-shrink-0 ${getShiftDot(shift.type)}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-800 dark:text-white text-sm">
                          Ca {getShiftLabel(shift.type)}
                        </p>
                        {isToday && (
                          <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-full font-bold">
                            Hôm nay
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {shift.timeRange}
                      </p>
                    </div>
                    <div className="text-center hidden md:block">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        {shift.totalPatients}
                      </p>
                      <p className="text-xs text-slate-400">BN</p>
                    </div>
                    <Link
                      to={`/doctor/queue/${shift.id}`}
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary dark:text-primary-light rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      Mở
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
