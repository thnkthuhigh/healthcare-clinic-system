import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { adminApi } from '../api';
import type { AdminDoctorDto, AdminShiftDto, AdminSlotDto, CreateShiftRequest } from '../types';

const TYPE_LABEL: Record<string, string> = {
  MORNING: 'Buổi sáng (7:00–11:00)',
  AFTERNOON: 'Buổi chiều (13:00–17:00)',
};

const TYPE_ICON: Record<string, string> = {
  MORNING: 'wb_sunny',
  AFTERNOON: 'partly_cloudy_day',
};

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function toLocalDateString(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── Slot Grid ───────────────────────────────────────────────────────────────

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
    return (
      <div className="flex items-center gap-2 text-slate-400 text-xs p-2">
        <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
        Đang tải slot...
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2 mb-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-sky-500 inline-block" />
          Thường
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
          Dự phòng
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600 inline-block" />
          Khóa
        </span>
      </div>
      <div className="grid grid-cols-8 gap-1.5">
        {(slots ?? []).map((slot: AdminSlotDto) => {
          const isLocked = slot.status === 'LOCKED';
          const isReserve = slot.pool === 'RESERVE';
          const isToggling = toggling === slot.id;

          const bg = isLocked
            ? 'bg-slate-200 dark:bg-slate-700 text-slate-400'
            : isReserve
              ? 'bg-amber-400 text-white hover:bg-amber-500'
              : 'bg-sky-500 text-white hover:bg-sky-600';

          return (
            <button
              key={slot.id}
              onClick={() => onToggle(slot.id)}
              disabled={isToggling}
              title={`Slot ${slot.sequence} — ${isReserve ? 'Dự phòng' : 'Thường'} — ${isLocked ? 'Khóa' : 'Mở'}`}
              className={`w-full aspect-square rounded-md text-xs font-bold flex items-center justify-center
                transition-colors cursor-pointer ${bg} ${isToggling ? 'opacity-50 cursor-wait' : ''}`}
            >
              {slot.sequence}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Shift Card ───────────────────────────────────────────────────────────────

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
    <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-sky-600 dark:text-sky-400 text-lg">
                {TYPE_ICON[shift.type] ?? 'schedule'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 dark:text-white truncate">
                {shift.doctorName}
              </p>
              {shift.doctorSpecialty && (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {shift.doctorSpecialty}
                </p>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {TYPE_LABEL[shift.type]}
              </p>
            </div>
          </div>

          <span
            className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
              ${
                shift.status === 'OPEN'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
          >
            <span className="material-symbols-outlined text-xs">
              {shift.status === 'OPEN' ? 'lock_open' : 'lock'}
            </span>
            {shift.status === 'OPEN' ? 'Đang mở' : 'Đã khóa'}
          </span>
        </div>

        {/* Slot stats */}
        <div className="mt-3 flex gap-3 text-center">
          <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2">
            <p className="text-base font-bold text-slate-900 dark:text-white">{shift.totalSlots}</p>
            <p className="text-xs text-slate-500">Tổng slot</p>
          </div>
          <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2">
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              {shift.openSlots}
            </p>
            <p className="text-xs text-slate-500">Còn trống</p>
          </div>
          <div className="flex-1 bg-sky-50 dark:bg-sky-900/20 rounded-lg p-2">
            <p className="text-base font-bold text-sky-600 dark:text-sky-400">
              {shift.bookedSlots}
            </p>
            <p className="text-xs text-slate-500">Đã đặt</p>
          </div>
        </div>
      </div>

      {/* Slot grid (collapsible) */}
      {showSlots && (
        <div className="px-4 pb-3 border-t border-slate-100 dark:border-slate-700 pt-3">
          <SlotGrid shiftId={shift.id} onToggle={onToggleSlot} toggling={togglingSlot} />
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-4 flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setShowSlots((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300
            hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">
            {showSlots ? 'expand_less' : 'grid_view'}
          </span>
          {showSlots ? 'Ẩn slot' : 'Xem slot'}
        </button>

        <div className="flex-1" />

        {shift.status === 'OPEN' ? (
          <button
            onClick={onLock}
            disabled={mutating}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md
              bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400
              disabled:opacity-50 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">lock</span>
            Khóa ca
          </button>
        ) : (
          <button
            onClick={onOpen}
            disabled={mutating}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md
              bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400
              disabled:opacity-50 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">lock_open</span>
            Mở ca
          </button>
        )}

        <button
          onClick={onDelete}
          disabled={mutating}
          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md
            bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400
            disabled:opacity-50 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">delete</span>
          Xóa
        </button>
      </div>
    </div>
  );
}

// ── Create Shift Modal ───────────────────────────────────────────────────────

interface CreateShiftModalProps {
  doctors: AdminDoctorDto[];
  initialDate: string;
  onClose: () => void;
  onCreated: () => void;
}

function CreateShiftModal({ doctors, initialDate, onClose, onCreated }: CreateShiftModalProps) {
  const [form, setForm] = useState<CreateShiftRequest>({
    doctorId: doctors[0]?.id ?? '',
    date: initialDate,
    type: 'MORNING',
  });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: adminApi.createShift,
    onSuccess: () => {
      onCreated();
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.doctorId) {
      setError('Vui lòng chọn bác sĩ');
      return;
    }
    mutation.mutate(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-card-dark rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-white">Tạo ca trực</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Bác sĩ <span className="text-red-500">*</span>
            </label>
            <select
              value={form.doctorId}
              onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600
                bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-sm"
            >
              <option value="">-- Chọn bác sĩ --</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.displayName}
                  {d.specialty ? ` — ${d.specialty}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Ngày <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600
                bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Buổi <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['MORNING', 'AFTERNOON'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, type: t })}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors
                    flex flex-col items-center gap-1
                    ${
                      form.type === t
                        ? 'border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                >
                  <span className="material-symbols-outlined text-xl">
                    {t === 'MORNING' ? 'wb_sunny' : 'partly_cloudy_day'}
                  </span>
                  {t === 'MORNING' ? 'Buổi sáng' : 'Buổi chiều'}
                  <span className="text-xs font-normal opacity-70">
                    {t === 'MORNING' ? '7:00–11:00' : '13:00–17:00'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600
                text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 text-sm rounded-lg bg-sky-600 text-white hover:bg-sky-700
                disabled:opacity-50 font-medium"
            >
              {mutation.isPending ? 'Đang tạo...' : 'Tạo ca'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export function ShiftManagementPage() {
  const queryClient = useQueryClient();
  const today = toLocalDateString(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [showCreate, setShowCreate] = useState(false);
  const [togglingSlot, setTogglingSlot] = useState<string | null>(null);

  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ['admin-shifts', selectedDate],
    queryFn: () => adminApi.getShifts(selectedDate),
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ['admin-doctors'],
    queryFn: adminApi.getDoctors,
  });

  const lockMutation = useMutation({
    mutationFn: adminApi.lockShift,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-shifts', selectedDate] }),
  });

  const openMutation = useMutation({
    mutationFn: adminApi.openShift,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-shifts', selectedDate] }),
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteShift,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-shifts', selectedDate] }),
    onError: (e: Error) => alert(e.message),
  });

  const toggleSlotMutation = useMutation({
    mutationFn: adminApi.toggleSlot,
    onSuccess: () => {
      setTogglingSlot(null);
      // invalidate slots queries for all shifts on this date
      shifts.forEach((s) => {
        queryClient.invalidateQueries({ queryKey: ['slots', s.id] });
      });
    },
    onError: () => {
      setTogglingSlot(null);
    },
  });

  const handleToggleSlot = (slotId: string) => {
    setTogglingSlot(slotId);
    toggleSlotMutation.mutate(slotId);
  };

  const handleDelete = (shift: AdminShiftDto) => {
    if (shift.bookedSlots > 0) {
      alert('Ca có lịch hẹn đang hoạt động, không thể xóa.');
      return;
    }
    if (
      !window.confirm(
        `Xóa ca ${TYPE_LABEL[shift.type]} của BS. ${shift.doctorName} ngày ${formatDate(shift.date)}?`,
      )
    )
      return;
    deleteMutation.mutate(shift.id);
  };

  const isMutating = lockMutation.isPending || openMutation.isPending || deleteMutation.isPending;

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-background-dark">
      {/* Header */}
      <div
        className="px-6 py-4 bg-white dark:bg-card-dark border-b border-slate-200 dark:border-slate-700
        flex items-center gap-4 flex-wrap"
      >
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Quản lý Ca trực</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tạo ca trực, tự động sinh 12 slot thường + 4 dự phòng (Logic A)
          </p>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setSelectedDate(
                toLocalDateString(
                  new Date(new Date(selectedDate + 'T00:00:00').getTime() - 86400000),
                ),
              )
            }
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-600
              hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
          >
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-600
              bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-1.5 text-sm"
          />
          <button
            onClick={() =>
              setSelectedDate(
                toLocalDateString(
                  new Date(new Date(selectedDate + 'T00:00:00').getTime() + 86400000),
                ),
              )
            }
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-600
              hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
          >
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
          {selectedDate !== today && (
            <button
              onClick={() => setSelectedDate(today)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800
                text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              Hôm nay
            </button>
          )}
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700
            text-white text-sm font-medium rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Tạo ca mới
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 gap-2 text-slate-400">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            Đang tải...
          </div>
        ) : shifts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center text-slate-400">
            <span className="material-symbols-outlined text-5xl mb-2">calendar_today</span>
            <p className="text-sm">Chưa có ca trực nào ngày {formatDate(selectedDate)}</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-3 text-xs text-sky-600 hover:underline"
            >
              + Tạo ca mới
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {shifts.map((shift) => (
              <ShiftCard
                key={shift.id}
                shift={shift}
                onLock={() => lockMutation.mutate(shift.id)}
                onOpen={() => openMutation.mutate(shift.id)}
                onDelete={() => handleDelete(shift)}
                onToggleSlot={handleToggleSlot}
                togglingSlot={togglingSlot}
                mutating={isMutating}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <CreateShiftModal
          doctors={doctors}
          initialDate={selectedDate}
          onClose={() => setShowCreate(false)}
          onCreated={() =>
            queryClient.invalidateQueries({ queryKey: ['admin-shifts', selectedDate] })
          }
        />
      )}
    </div>
  );
}
