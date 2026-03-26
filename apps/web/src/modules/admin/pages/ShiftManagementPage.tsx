import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { addDaysToIsoDate, toIsoDateUtc7 } from '../../../lib/time';
import { adminApi } from '../api';
import type {
  AdminDoctorDto,
  AdminShiftDto,
  AdminSlotDto,
  BulkShiftRequest,
  DayShiftConfig,
  SyncWeekShiftRequest,
} from '../types';

const WEEKDAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

type ViewMode = 'DAY' | 'WEEK';
type ShiftType = 'MORNING' | 'AFTERNOON';
type DayShiftMap = Record<number, { MORNING: boolean; AFTERNOON: boolean }>;

const TYPE_LABEL: Record<string, string> = {
  MORNING: 'Sáng (07:00-12:00)',
  AFTERNOON: 'Chiều (13:00-18:00)',
};

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function addDays(isoDate: string, days: number) {
  return addDaysToIsoDate(isoDate, days);
}

function toUtcDateFromIso(isoDate: string) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year || 1970, (month || 1) - 1, day || 1));
}

function toIsoFromUtcDate(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function startOfWeekMonday(isoDate: string) {
  const d = toUtcDateFromIso(isoDate);
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() + (day === 0 ? -6 : 1 - day));
  return toIsoFromUtcDate(d);
}

function getWeekDates(weekStartDate: string) {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i));
}

function toMonthValue(isoDate: string) {
  return isoDate.slice(0, 7);
}

function getWeekStartFromMonthWeek(monthValue: string, weekNo: number) {
  const parts = monthValue.split('-').map(Number);
  const year = parts[0] ?? Number.parseInt(toIsoDateUtc7().slice(0, 4), 10);
  const month = parts[1] ?? 1;
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const day = firstDay.getUTCDay();
  const shiftToMonday = day === 0 ? -6 : 1 - day;
  firstDay.setUTCDate(firstDay.getUTCDate() + shiftToMonday + (weekNo - 1) * 7);
  return toIsoFromUtcDate(firstDay);
}

function getWeekNoFromDate(isoDate: string) {
  const parts = isoDate.split('-').map(Number);
  const year = parts[0] ?? Number.parseInt(toIsoDateUtc7().slice(0, 4), 10);
  const month = parts[1] ?? 1;
  const day = parts[2] ?? 1;
  const target = new Date(Date.UTC(year, month - 1, day));
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const firstWeekMonday = new Date(firstDay);
  const firstWeekDay = firstDay.getUTCDay();
  const shiftToMonday = firstWeekDay === 0 ? -6 : 1 - firstWeekDay;
  firstWeekMonday.setUTCDate(firstWeekMonday.getUTCDate() + shiftToMonday);
  const diffDays = Math.floor((target.getTime() - firstWeekMonday.getTime()) / 86_400_000);
  const weekNo = Math.floor(diffDays / 7) + 1;
  return Math.min(5, Math.max(1, weekNo));
}

function createEmptyDayShiftMap(): DayShiftMap {
  return {
    1: { MORNING: false, AFTERNOON: false },
    2: { MORNING: false, AFTERNOON: false },
    3: { MORNING: false, AFTERNOON: false },
    4: { MORNING: false, AFTERNOON: false },
    5: { MORNING: false, AFTERNOON: false },
    6: { MORNING: false, AFTERNOON: false },
    7: { MORNING: false, AFTERNOON: false },
  };
}

function mapToDayConfigs(dayShifts: DayShiftMap, includeEmptyDays: boolean): DayShiftConfig[] {
  const out: DayShiftConfig[] = [];
  for (let day = 1; day <= 7; day++) {
    const row = dayShifts[day] ?? { MORNING: false, AFTERNOON: false };
    const shiftTypes: ShiftType[] = [];
    if (row.MORNING) shiftTypes.push('MORNING');
    if (row.AFTERNOON) shiftTypes.push('AFTERNOON');
    if (!includeEmptyDays && shiftTypes.length === 0) continue;
    out.push({ dayOfWeek: day, shiftTypes });
  }
  return out;
}

function countSelected(dayShifts: DayShiftMap) {
  let c = 0;
  for (let d = 1; d <= 7; d++) {
    if (dayShifts[d]?.MORNING) c += 1;
    if (dayShifts[d]?.AFTERNOON) c += 1;
  }
  return c;
}

interface SlotGridProps {
  shiftId: string;
  onToggle: (slotId: string) => void;
  toggling: string | null;
}

function SlotGrid({ shiftId, onToggle, toggling }: SlotGridProps) {
  const { data: slots, isLoading } = useQuery({
    queryKey: ['slots', shiftId],
    queryFn: () => adminApi.getShiftSlots(shiftId),
  });

  if (isLoading) {
    return <div className="p-2 text-xs text-slate-400">Đang tải slot...</div>;
  }

  return (
    <div className="grid grid-cols-8 gap-1.5">
      {(slots ?? []).map((slot: AdminSlotDto) => {
        const isLocked = slot.status === 'LOCKED';
        const isReserve = slot.pool === 'RESERVE';
        const bg = isLocked
          ? 'bg-slate-200 text-slate-400'
          : isReserve
            ? 'bg-amber-400 text-white hover:bg-amber-500'
            : 'bg-sky-500 text-white hover:bg-sky-600';
        return (
          <button
            key={slot.id}
            onClick={() => onToggle(slot.id)}
            disabled={toggling === slot.id}
            className={`aspect-square rounded-md text-xs font-bold ${bg}`}
            title={`Slot ${slot.sequence}`}
          >
            {slot.sequence}
          </button>
        );
      })}
    </div>
  );
}

interface ShiftCardProps {
  shift: AdminShiftDto;
  onLock: () => void;
  onOpen: () => void;
  onDelete: () => void;
  onToggleSlot: (slotId: string) => void;
  togglingSlot: string | null;
  mutating: boolean;
}

function ShiftCard({
  shift,
  onLock,
  onOpen,
  onDelete,
  onToggleSlot,
  togglingSlot,
  mutating,
}: ShiftCardProps) {
  const [showSlots, setShowSlots] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-slate-900">{shift.doctorName}</p>
              {shift.isMakeup && (
                <span className="rounded-full bg-fuchsia-100 px-2 py-0.5 text-[11px] font-medium text-fuchsia-700">
                  Ca bu
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">{TYPE_LABEL[shift.type]}</p>
            {shift.adjustmentNote && (
              <p className="mt-1 line-clamp-2 text-[11px] text-fuchsia-700">
                Ghi chu: {shift.adjustmentNote}
              </p>
            )}
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${shift.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
          >
            {shift.status === 'OPEN' ? 'Đang mở' : 'Đã khóa'}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded bg-slate-50 p-2">
            <p className="text-sm font-bold">{shift.totalSlots}</p>
            <p>Tổng</p>
          </div>
          <div className="rounded bg-emerald-50 p-2">
            <p className="text-sm font-bold text-emerald-700">{shift.openSlots}</p>
            <p>Trong</p>
          </div>
          <div className="rounded bg-sky-50 p-2">
            <p className="text-sm font-bold text-sky-700">{shift.bookedSlots}</p>
            <p>Đã đặt</p>
          </div>
        </div>
      </div>

      {showSlots && (
        <div className="border-t border-slate-100 px-4 pb-3 pt-3">
          <SlotGrid shiftId={shift.id} onToggle={onToggleSlot} toggling={togglingSlot} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 px-4 pb-4">
        <button
          onClick={() => setShowSlots((v) => !v)}
          className="text-xs text-slate-600 hover:text-sky-600"
        >
          {showSlots ? 'An slot' : 'Xem slot'}
        </button>
        <div className="flex-1" />
        {shift.status === 'OPEN' ? (
          <button
            onClick={onLock}
            disabled={mutating}
            className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-700"
          >
            Khóa ca
          </button>
        ) : (
          <button
            onClick={onOpen}
            disabled={mutating}
            className="rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-700"
          >
            Mở ca
          </button>
        )}
        <button
          onClick={onDelete}
          disabled={mutating}
          className="rounded bg-red-50 px-2 py-1 text-xs text-red-600"
        >
          Xóa
        </button>
      </div>
    </div>
  );
}

interface DayShiftMatrixProps {
  weekStartDate: string;
  dayShifts: DayShiftMap;
  onToggle: (day: number, type: ShiftType) => void;
}

function DayShiftMatrix({ weekStartDate, dayShifts, onToggle }: DayShiftMatrixProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Ngày</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Sáng</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-slate-600">Chiều</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {Array.from({ length: 7 }, (_, idx) => {
            const day = idx + 1;
            return (
              <tr key={day}>
                <td className="px-3 py-2 text-sm text-slate-700">
                  <div className="font-medium">{WEEKDAY_LABELS[idx]}</div>
                  <div className="text-xs text-slate-400">
                    {formatDate(addDays(weekStartDate, idx))}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => onToggle(day, 'MORNING')}
                    className={`rounded-full px-3 py-1 text-xs ${dayShifts[day]?.MORNING ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}
                  >
                    {dayShifts[day]?.MORNING ? 'Đã chọn' : 'Bỏ trống'}
                  </button>
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => onToggle(day, 'AFTERNOON')}
                    className={`rounded-full px-3 py-1 text-xs ${dayShifts[day]?.AFTERNOON ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}
                  >
                    {dayShifts[day]?.AFTERNOON ? 'Đã chọn' : 'Bỏ trống'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface WeekRow {
  date: string;
  shifts: AdminShiftDto[];
}

interface WeeklyPatternModalProps {
  doctors: AdminDoctorDto[];
  initialWeekStart: string;
  onClose: () => void;
  onCreated: () => void;
}

function WeeklyPatternModal({
  doctors,
  initialWeekStart,
  onClose,
  onCreated,
}: WeeklyPatternModalProps) {
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? '');
  const [monthValue, setMonthValue] = useState(toMonthValue(initialWeekStart));
  const [weekNo, setWeekNo] = useState(getWeekNoFromDate(initialWeekStart));
  const [repeatWeeks, setRepeatWeeks] = useState(12);
  const [dayShifts, setDayShifts] = useState<DayShiftMap>(createEmptyDayShiftMap());
  const [error, setError] = useState('');

  const weekStartDate = useMemo(
    () => getWeekStartFromMonthWeek(monthValue, weekNo),
    [monthValue, weekNo],
  );

  const mutation = useMutation({
    mutationFn: adminApi.createShiftsBulk,
    onSuccess: (data) => {
      onCreated();
      onClose();
      alert(`Da tao ${data.created.length} ca, bo qua ${data.skipped.length} ca.`);
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h2 className="font-semibold text-slate-900">Tạo ca trực theo tuần trong tháng</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!doctorId) return setError('Vui lòng chọn bác sĩ');
            if (countSelected(dayShifts) === 0) return setError('Vui lòng chọn ít nhất 1 ca');
            if (repeatWeeks < 1 || repeatWeeks > 52) return setError('Số tuần áp dụng 1..52');
            const dayConfigs = mapToDayConfigs(dayShifts, false);
            const daysOfWeek = dayConfigs.map((cfg) => cfg.dayOfWeek);
            const shiftTypes = Array.from(new Set(dayConfigs.flatMap((cfg) => cfg.shiftTypes)));
            setError('');
            const payload: BulkShiftRequest = {
              doctorId,
              weekStartDate,
              repeatWeeks,
              dayConfigs,
              daysOfWeek,
              shiftTypes,
            };
            mutation.mutate(payload);
          }}
          className="space-y-4 p-4"
        >
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          <div className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600">Bác sĩ *</label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">-- Chọn bác sĩ --</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.displayName}
                    {d.specialty ? ` - ${d.specialty}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Tháng *</label>
              <input
                type="month"
                value={monthValue}
                onChange={(e) => setMonthValue(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Tuần trong tháng *
              </label>
              <select
                value={weekNo}
                onChange={(e) => setWeekNo(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value={1}>Tuần 1</option>
                <option value={2}>Tuần 2</option>
                <option value={3}>Tuần 3</option>
                <option value={4}>Tuần 4</option>
                <option value={5}>Tuần 5</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Tuần được áp dụng: {formatDate(weekStartDate)} -{' '}
              {formatDate(addDays(weekStartDate, 6))}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Số tuần áp dụng lặp *
              </label>
              <input
                type="number"
                min={1}
                max={52}
                value={repeatWeeks}
                onChange={(e) => setRepeatWeeks(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <DayShiftMatrix
            weekStartDate={weekStartDate}
            dayShifts={dayShifts}
            onToggle={(day, type) =>
              setDayShifts((prev) => {
                const row = prev[day] ?? { MORNING: false, AFTERNOON: false };
                return {
                  ...prev,
                  [day]: {
                    MORNING: type === 'MORNING' ? !row.MORNING : row.MORNING,
                    AFTERNOON: type === 'AFTERNOON' ? !row.AFTERNOON : row.AFTERNOON,
                  },
                };
              })
            }
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {mutation.isPending ? 'Đang tạo...' : 'Tạo lịch lặp'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface SyncWeekModalProps {
  doctors: AdminDoctorDto[];
  initialWeekStart: string;
  onClose: () => void;
  onSynced: () => void;
}

function SyncWeekModal({ doctors, initialWeekStart, onClose, onSynced }: SyncWeekModalProps) {
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? '');
  const [monthValue, setMonthValue] = useState(toMonthValue(initialWeekStart));
  const [weekNo, setWeekNo] = useState(getWeekNoFromDate(initialWeekStart));
  const [note, setNote] = useState('');
  const [dayShifts, setDayShifts] = useState<DayShiftMap>(createEmptyDayShiftMap());
  const [error, setError] = useState('');

  const weekStartDate = useMemo(
    () => getWeekStartFromMonthWeek(monthValue, weekNo),
    [monthValue, weekNo],
  );
  const weekDates = useMemo(() => getWeekDates(weekStartDate), [weekStartDate]);

  const { data: weekRows = [] } = useQuery({
    queryKey: ['admin-shifts-week-modal', weekStartDate],
    queryFn: async () =>
      Promise.all(
        weekDates.map(async (date) => ({
          date,
          shifts: await adminApi.getShifts(date),
        })),
      ),
  });

  useEffect(() => {
    if (!doctorId) return;
    const nextMap = createEmptyDayShiftMap();
    for (let day = 1; day <= 7; day++) {
      const date = addDays(weekStartDate, day - 1);
      const row = weekRows.find((r) => r.date === date);
      const doctorShifts = row?.shifts.filter((s) => s.doctorId === doctorId) ?? [];
      for (const s of doctorShifts) {
        const rowState = nextMap[day] ?? { MORNING: false, AFTERNOON: false };
        if (s.type === 'MORNING') rowState.MORNING = true;
        if (s.type === 'AFTERNOON') rowState.AFTERNOON = true;
        nextMap[day] = rowState;
      }
    }
    setDayShifts(nextMap);
  }, [doctorId, weekRows, weekStartDate]);

  const mutation = useMutation({
    mutationFn: adminApi.syncWeekShifts,
    onSuccess: (data) => {
      onSynced();
      onClose();
      alert(
        `Đã cập nhật tuần: tạo ${data.created.length}, xóa ${data.deleted.length}, bỏ qua ${data.skipped.length}.`,
      );
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h2 className="font-semibold text-slate-900">Đổi ca trực tuần này</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!doctorId) return setError('Vui lòng chọn bác sĩ');
            if (!note.trim()) return setError('Vui lòng nhập ghi chú đổi ca/ca bù');
            setError('');
            const payload: SyncWeekShiftRequest = {
              doctorId,
              weekStartDate,
              note: note.trim(),
              dayConfigs: mapToDayConfigs(dayShifts, true),
            };
            mutation.mutate(payload);
          }}
          className="space-y-4 p-4"
        >
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          <div className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600">Bác sĩ *</label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">-- Chọn bác sĩ --</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.displayName}
                    {d.specialty ? ` - ${d.specialty}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Tháng *</label>
              <input
                type="month"
                value={monthValue}
                onChange={(e) => setMonthValue(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Tuần trong tháng *
              </label>
              <select
                value={weekNo}
                onChange={(e) => setWeekNo(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value={1}>Tuần 1</option>
                <option value={2}>Tuần 2</option>
                <option value={3}>Tuần 3</option>
                <option value={4}>Tuần 4</option>
                <option value={5}>Tuần 5</option>
              </select>
            </div>
          </div>

          <div className="rounded bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Pham vi dieu chinh: {formatDate(weekStartDate)} -{' '}
            {formatDate(addDays(weekStartDate, 6))}. Tuần sau không đổi.
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Ghi chu doi ca / ca bu *
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Nghỉ có phép Thứ 2, bù Thứ 4 tuần 2"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <DayShiftMatrix
            weekStartDate={weekStartDate}
            dayShifts={dayShifts}
            onToggle={(day, type) =>
              setDayShifts((prev) => {
                const row = prev[day] ?? { MORNING: false, AFTERNOON: false };
                return {
                  ...prev,
                  [day]: {
                    MORNING: type === 'MORNING' ? !row.MORNING : row.MORNING,
                    AFTERNOON: type === 'AFTERNOON' ? !row.AFTERNOON : row.AFTERNOON,
                  },
                };
              })
            }
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {mutation.isPending ? 'Đang cập nhật...' : 'Lưu đổi ca'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface WeekCalendarProps {
  doctors: AdminDoctorDto[];
  weekDates: string[];
  weekRows: WeekRow[];
}

function WeekCalendar({ doctors, weekDates, weekRows }: WeekCalendarProps) {
  const map = useMemo(() => {
    const byDate: Record<
      string,
      Record<string, { MORNING?: AdminShiftDto; AFTERNOON?: AdminShiftDto }>
    > = {};
    for (const date of weekDates) {
      byDate[date] = {};
      for (const d of doctors) byDate[date][d.id] = {};
    }
    for (const row of weekRows) {
      for (const s of row.shifts) {
        if (!byDate[row.date]?.[s.doctorId]) continue;
        const doctorDay = byDate[row.date]![s.doctorId] ?? {};
        byDate[row.date]![s.doctorId] = {
          ...doctorDay,
          ...(s.type === 'MORNING' ? { MORNING: s } : { AFTERNOON: s }),
        };
      }
    }
    return byDate;
  }, [doctors, weekDates, weekRows]);

  const badgeClass = (shift: AdminShiftDto | undefined, normalColor: string) => {
    if (!shift) return 'bg-slate-50 text-slate-400';
    if (shift.isMakeup) return 'bg-fuchsia-100 text-fuchsia-700';
    return normalColor;
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-[980px] w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th className="px-3 py-3 text-left font-medium text-slate-600">Thứ / Ngày</th>
            {doctors.map((d) => (
              <th key={d.id} className="px-3 py-3 text-left font-medium text-slate-600">
                <div className="whitespace-nowrap">{d.displayName}</div>
                <div className="text-xs font-normal text-slate-400">
                  {d.specialty ?? 'Chưa gán khoa'}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {weekDates.map((date, idx) => (
            <tr key={date} className="align-top hover:bg-slate-50">
              <td className="px-3 py-3">
                <div className="font-medium text-slate-900">{WEEKDAY_LABELS[idx]}</div>
                <div className="text-xs text-slate-400">{formatDate(date)}</div>
              </td>
              {doctors.map((d) => {
                const cell = map[date]?.[d.id] ?? {};
                return (
                  <td key={`${date}-${d.id}`} className="px-3 py-3">
                    <div className="space-y-1 text-xs">
                      <div
                        className={`inline-flex min-w-[120px] items-center justify-between rounded-full px-2 py-1 ${badgeClass(cell.MORNING, 'bg-amber-50 text-amber-700')}`}
                        title={cell.MORNING?.adjustmentNote ?? ''}
                      >
                        <span>SANG</span>
                        <span>
                          {cell.MORNING
                            ? `${cell.MORNING.bookedSlots}/${cell.MORNING.totalSlots}`
                            : '-'}
                        </span>
                      </div>
                      <div
                        className={`inline-flex min-w-[120px] items-center justify-between rounded-full px-2 py-1 ${badgeClass(cell.AFTERNOON, 'bg-indigo-50 text-indigo-700')}`}
                        title={cell.AFTERNOON?.adjustmentNote ?? ''}
                      >
                        <span>CHIEU</span>
                        <span>
                          {cell.AFTERNOON
                            ? `${cell.AFTERNOON.bookedSlots}/${cell.AFTERNOON.totalSlots}`
                            : '-'}
                        </span>
                      </div>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ShiftManagementPage() {
  const queryClient = useQueryClient();
  const today = toIsoDateUtc7();
  const [selectedDate, setSelectedDate] = useState(today);
  const [viewMode, setViewMode] = useState<ViewMode>('DAY');
  const [showPattern, setShowPattern] = useState(false);
  const [showSyncWeek, setShowSyncWeek] = useState(false);
  const [togglingSlot, setTogglingSlot] = useState<string | null>(null);

  const weekStartDate = useMemo(() => startOfWeekMonday(selectedDate), [selectedDate]);
  const weekDates = useMemo(() => getWeekDates(weekStartDate), [weekStartDate]);

  const { data: shifts = [], isLoading: isDayLoading } = useQuery({
    queryKey: ['admin-shifts', selectedDate],
    queryFn: () => adminApi.getShifts(selectedDate),
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ['admin-doctors'],
    queryFn: adminApi.getDoctors,
  });

  const { data: weekRows = [], isLoading: isWeekLoading } = useQuery({
    queryKey: ['admin-shifts-week', weekStartDate],
    queryFn: async () =>
      Promise.all(
        weekDates.map(async (date) => ({
          date,
          shifts: await adminApi.getShifts(date),
        })),
      ),
  });

  const invalidateShiftQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-shifts'] });
    queryClient.invalidateQueries({ queryKey: ['admin-shifts-week'] });
  };

  const lockMutation = useMutation({
    mutationFn: adminApi.lockShift,
    onSuccess: invalidateShiftQueries,
  });
  const openMutation = useMutation({
    mutationFn: adminApi.openShift,
    onSuccess: invalidateShiftQueries,
  });
  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteShift,
    onSuccess: invalidateShiftQueries,
    onError: (e: Error) => alert(e.message),
  });
  const toggleSlotMutation = useMutation({
    mutationFn: adminApi.toggleSlot,
    onSuccess: () => {
      setTogglingSlot(null);
      shifts.forEach((s) => queryClient.invalidateQueries({ queryKey: ['slots', s.id] }));
      invalidateShiftQueries();
    },
    onError: () => setTogglingSlot(null),
  });

  const isMutating = lockMutation.isPending || openMutation.isPending || deleteMutation.isPending;

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Quản lý Ca làm việc</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Tạo lịch theo tuần trong tháng, đổi ca có ghi chú và đánh dấu ca bù.
          </p>
        </div>
        <div className="flex-1" />

        <div className="flex items-center rounded-lg bg-slate-100 p-1">
          <button
            onClick={() => setViewMode('DAY')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${viewMode === 'DAY' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'}`}
          >
            Ngày
          </button>
          <button
            onClick={() => setViewMode('WEEK')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${viewMode === 'WEEK' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'}`}
          >
            Tuần
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, viewMode === 'WEEK' ? -7 : -1))}
            className="rounded-lg border border-slate-300 p-1.5 text-slate-600"
          >
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900"
          />
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, viewMode === 'WEEK' ? 7 : 1))}
            className="rounded-lg border border-slate-300 p-1.5 text-slate-600"
          >
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
          {selectedDate !== today && (
            <button
              onClick={() => setSelectedDate(today)}
              className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs text-slate-600"
            >
              Hom nay
            </button>
          )}
        </div>

        <button
          onClick={() => setShowPattern(true)}
          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"
        >
          Tạo lịch lặp
        </button>
        <button
          onClick={() => setShowSyncWeek(true)}
          className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700"
        >
          Đổi ca tuần này
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {viewMode === 'DAY' ? (
          isDayLoading ? (
            <div className="h-40 text-sm text-slate-400">Đang tải...</div>
          ) : shifts.length === 0 ? (
            <div className="h-40 text-sm text-slate-400">
              Chưa có ca trực ngày {formatDate(selectedDate)}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {shifts.map((shift) => (
                <ShiftCard
                  key={shift.id}
                  shift={shift}
                  onLock={() => lockMutation.mutate(shift.id)}
                  onOpen={() => openMutation.mutate(shift.id)}
                  onDelete={() => {
                    if (shift.bookedSlots > 0) return alert('Ca có booking không thể xóa');
                    if (
                      !window.confirm(
                        `Xóa ca ${TYPE_LABEL[shift.type]} của BS. ${shift.doctorName}?`,
                      )
                    )
                      return;
                    deleteMutation.mutate(shift.id);
                  }}
                  onToggleSlot={(slotId) => {
                    setTogglingSlot(slotId);
                    toggleSlotMutation.mutate(slotId);
                  }}
                  togglingSlot={togglingSlot}
                  mutating={isMutating}
                />
              ))}
            </div>
          )
        ) : isWeekLoading ? (
          <div className="h-40 text-sm text-slate-400">Đang tải lịch tuần...</div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">
              Tuần hiện tại: {formatDate(weekStartDate)} - {formatDate(addDays(weekStartDate, 6))}
            </p>
            <WeekCalendar doctors={doctors} weekDates={weekDates} weekRows={weekRows} />
          </div>
        )}
      </div>

      {showPattern && (
        <WeeklyPatternModal
          doctors={doctors}
          initialWeekStart={weekStartDate}
          onClose={() => setShowPattern(false)}
          onCreated={invalidateShiftQueries}
        />
      )}

      {showSyncWeek && (
        <SyncWeekModal
          doctors={doctors}
          initialWeekStart={weekStartDate}
          onClose={() => setShowSyncWeek(false)}
          onSynced={invalidateShiftQueries}
        />
      )}
    </div>
  );
}
