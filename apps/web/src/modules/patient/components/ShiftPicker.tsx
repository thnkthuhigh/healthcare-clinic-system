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

export function ShiftPicker({
  selectedDate,
  onDateChange,
  shifts,
  selectedShiftId,
  onShiftSelect,
  loading,
}: ShiftPickerProps) {
  // Generate next 14 days selectable
  const today = new Date();
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d.toISOString().split('T')[0] ?? '';
  });

  return (
    <div className="space-y-4">
      {/* Date strip */}
      <div>
        <p className="text-sm font-medium text-slate-600 mb-2">Chọn ngày khám</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {dates.map((d) => {
            const date = new Date(d + 'T00:00:00');
            const isSelected = d === selectedDate;
            const dayName = date.toLocaleDateString('vi-VN', { weekday: 'short' });
            const dayNum = date.getDate();
            return (
              <button
                key={d}
                type="button"
                onClick={() => onDateChange(d)}
                className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-lg border text-xs transition-all
                  ${isSelected ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-primary/50'}`}
              >
                <span className="uppercase">{dayName}</span>
                <span className="font-bold text-base">{dayNum}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Shift cards */}
      <div>
        <p className="text-sm font-medium text-slate-600 mb-2">Chọn ca khám</p>
        {loading && <p className="text-sm text-slate-400">Đang tải ca khám...</p>}
        {!loading && shifts.length === 0 && (
          <p className="text-sm text-slate-400">Không có ca khám vào ngày này.</p>
        )}
        <div className="space-y-2">
          {shifts.map((shift) => {
            const isSelected = shift.id === selectedShiftId;
            const isFull = shift.isFull || shift.status === 'CLOSED';
            return (
              <button
                key={shift.id}
                type="button"
                disabled={isFull}
                onClick={() => !isFull && onShiftSelect(shift.id)}
                className={`w-full text-left rounded-lg border-2 p-3 transition-all flex items-center justify-between
                  ${
                    isFull
                      ? 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
                      : isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-200 bg-white hover:border-primary/50'
                  }`}
              >
                <div>
                  <p className={`font-semibold ${isSelected ? 'text-primary' : 'text-slate-700'}`}>
                    {SHIFT_LABELS[shift.type] ?? shift.type}
                  </p>
                  <p className="text-sm text-slate-500">{shift.timeRange}</p>
                </div>
                <div className="text-right">
                  {isFull ? (
                    <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-1 rounded">
                      FULL
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">
                      Còn <strong className="text-primary">{shift.availableSlots}</strong> chỗ
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
