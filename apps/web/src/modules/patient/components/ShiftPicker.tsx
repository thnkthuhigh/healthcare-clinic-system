import { addDaysToIsoDate, formatDateUtc7, toIsoDateUtc7 } from '../../../lib/time';
import type { AvailableShift } from '../types';

interface ShiftPickerProps {
  doctorId: string;
  selectedDate: string;
  onDateChange: (date: string) => void;
  shifts: AvailableShift[];
  selectedShiftId: string | null;
  onShiftSelect: (shiftId: string) => void;
  loading: boolean;
}

const SHIFT_LABELS: Record<string, string> = {
  MORNING: 'Buổi sáng',
  AFTERNOON: 'Buổi chiều',
};

const DEFAULT_SHIFT_RANGES: Record<string, string> = {
  MORNING: '07:00 - 12:00',
  AFTERNOON: '13:00 - 18:00',
};

function formatClockUtc7(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(dt);
}

function resolveShiftTimeRange(shift: AvailableShift): string {
  const start = shift.startTime ? formatClockUtc7(shift.startTime) : '';
  const end = shift.endTime ? formatClockUtc7(shift.endTime) : '';

  if (start && end) return `${start} - ${end}`;
  if (shift.timeRange?.trim()) return shift.timeRange;
  return DEFAULT_SHIFT_RANGES[shift.type] ?? '--:-- - --:--';
}

export function ShiftPicker({
  selectedDate,
  onDateChange,
  shifts,
  selectedShiftId,
  onShiftSelect,
  loading,
}: ShiftPickerProps) {
  const today = toIsoDateUtc7();
  const dates = Array.from({ length: 14 }, (_, index) => addDaysToIsoDate(today, index));

  return (
    <div className="space-y-6">
      <div>
        <p className="field-label">Chọn ngày khám</p>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {dates.map((dateValue) => {
            const isSelected = dateValue === selectedDate;
            const dayName = formatDateUtc7(dateValue, { weekday: 'short' });
            const dayNum = formatDateUtc7(dateValue, { day: 'numeric' });
            const month = formatDateUtc7(dateValue, { month: '2-digit' });

            return (
              <button
                key={dateValue}
                type="button"
                onClick={() => onDateChange(dateValue)}
                data-testid={`patient-booking-date-${dateValue}`}
                className={`flex min-w-[84px] flex-shrink-0 flex-col items-center rounded-[22px] border px-3 py-3 text-xs transition-all ${
                  isSelected
                    ? 'border-primary bg-primary text-white shadow-soft'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-primary/35 hover:shadow-soft'
                }`}
              >
                <span
                  className={`uppercase tracking-[0.12em] ${isSelected ? 'text-white/80' : 'text-slate-400'}`}
                >
                  {dayName}
                </span>
                <span className="mt-1 text-xl font-bold">{dayNum}</span>
                <span
                  className={`mt-1 text-[11px] ${isSelected ? 'text-white/80' : 'text-slate-400'}`}
                >
                  Tháng {month}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="field-label mb-0">Chọn ca khám</p>

        {loading && <p className="mt-4 text-sm text-slate-500">Đang tải danh sách ca khám...</p>}
        {!loading && shifts.length === 0 && (
          <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5 text-sm text-slate-500">
            Không có ca khám khả dụng trong ngày đã chọn.
          </div>
        )}

        <div className="mt-4 space-y-3">
          {shifts.map((shift) => {
            const isSelected = shift.id === selectedShiftId;
            const remaining = Math.max(0, Math.min(12, shift.availableSlots));
            const isFull = remaining <= 0 || shift.status === 'CLOSED';

            return (
              <button
                key={shift.id}
                type="button"
                disabled={isFull}
                onClick={() => !isFull && onShiftSelect(shift.id)}
                data-testid={`patient-booking-shift-${shift.id}`}
                className={`w-full rounded-[26px] border p-5 text-left transition-all ${
                  isFull
                    ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60'
                    : isSelected
                      ? 'border-primary bg-primary/5 shadow-soft'
                      : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-soft'
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                        isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[22px]">
                        {shift.type === 'MORNING' ? 'light_mode' : 'bedtime'}
                      </span>
                    </div>
                    <div>
                      <p
                        className={`text-base font-semibold ${isSelected ? 'text-primary' : 'text-slate-950'}`}
                      >
                        {SHIFT_LABELS[shift.type] ?? shift.type}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">{resolveShiftTimeRange(shift)}</p>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    {isFull ? (
                      <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-600">
                        Đã đầy
                      </span>
                    ) : (
                      <>
                        <p className="text-sm text-slate-500">
                          Còn <strong className="text-primary">{remaining}</strong> chỗ
                        </p>
                        <div className="mt-3 h-2 w-32 rounded-full bg-slate-100 sm:ml-auto">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{ width: `${Math.max(16, (remaining / 12) * 100)}%` }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
