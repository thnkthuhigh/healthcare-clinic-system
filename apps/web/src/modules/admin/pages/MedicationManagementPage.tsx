import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { adminApi } from '../api';
import type {
  AdminMedicationDto,
  CreateMedicationRequest,
  UpdateMedicationRequest,
} from '../types';

function priceLabel(cents: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cents * 10);
}

function StockBar({ real, hold }: { real: number; hold: number }) {
  const available = real - hold;
  const pctHold = real > 0 ? Math.min(100, (hold / real) * 100) : 0;
  const pctAvail = real > 0 ? Math.min(100, (available / real) * 100) : 0;

  let color = 'bg-emerald-500';
  if (available === 0) color = 'bg-red-500';
  else if (available <= 10) color = 'bg-amber-500';

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-500">
          Còn: <span className="font-medium text-slate-900 dark:text-white">{available}</span>
        </span>
        {hold > 0 && <span className="text-amber-600 dark:text-amber-400">Tạm giữ: {hold}</span>}
        <span className="text-slate-400">/ {real}</span>
      </div>
      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
        <div className={`${color} h-full rounded-full`} style={{ width: `${pctAvail}%` }} />
        {hold > 0 && <div className="bg-amber-400 h-full" style={{ width: `${pctHold}%` }} />}
      </div>
    </div>
  );
}

// ── Medication Modal ─────────────────────────────────────────────────────────

interface MedicationModalProps {
  initial?: AdminMedicationDto | undefined;
  onClose: () => void;
  onSaved: () => void;
}

function MedicationModal({ initial, onClose, onSaved }: MedicationModalProps) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    unit: initial?.unit ?? '',
    usage: initial?.usage ?? '',
    defaultDose: initial?.defaultDose ?? '',
    priceCents: String(initial?.priceCents ?? ''),
    initialStock: '0',
  });
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: CreateMedicationRequest) => adminApi.createMedication(data),
    onSuccess: () => {
      onSaved();
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMedicationRequest }) =>
      adminApi.updateMedication(id, data),
    onSuccess: () => {
      onSaved();
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) {
      setError('Tên thuốc không được để trống');
      return;
    }
    if (!form.unit.trim()) {
      setError('Đơn vị không được để trống');
      return;
    }
    const price = parseInt(form.priceCents, 10);
    if (isNaN(price) || price < 0) {
      setError('Giá không hợp lệ');
      return;
    }

    if (isEdit) {
      const data: UpdateMedicationRequest = {};
      if (form.name !== initial!.name) data.name = form.name.trim();
      if (form.unit !== initial!.unit) data.unit = form.unit.trim();
      if (form.usage !== (initial!.usage ?? '')) data.usage = form.usage || undefined;
      if (form.defaultDose !== (initial!.defaultDose ?? ''))
        data.defaultDose = form.defaultDose || undefined;
      if (price !== initial!.priceCents) data.priceCents = price;
      updateMutation.mutate({ id: initial!.id, data });
    } else {
      createMutation.mutate({
        name: form.name.trim(),
        unit: form.unit.trim(),
        ...(form.usage ? { usage: form.usage } : {}),
        ...(form.defaultDose ? { defaultDose: form.defaultDose } : {}),
        priceCents: price,
        initialStock: parseInt(form.initialStock, 10) || 0,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-card-dark rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            {isEdit ? 'Sửa thuốc' : 'Thêm thuốc mới'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Tên thuốc <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="VD: Paracetamol 500mg"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600
                  bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Đơn vị <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="VD: viên, ml, gói"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600
                  bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Giá (cents) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                value={form.priceCents}
                onChange={(e) => setForm({ ...form, priceCents: e.target.value })}
                placeholder="5000"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600
                  bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Cách dùng
              </label>
              <input
                type="text"
                value={form.usage}
                onChange={(e) => setForm({ ...form, usage: e.target.value })}
                placeholder="VD: Uống sau ăn"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600
                  bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Liều mặc định
              </label>
              <input
                type="text"
                value={form.defaultDose}
                onChange={(e) => setForm({ ...form, defaultDose: e.target.value })}
                placeholder="VD: 1 viên x 3 lần/ngày"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600
                  bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-sm"
              />
            </div>
            {!isEdit && (
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Tồn kho ban đầu
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.initialStock}
                  onChange={(e) => setForm({ ...form, initialStock: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600
                    bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-sm"
                />
              </div>
            )}
          </div>
          {form.priceCents && !isNaN(parseInt(form.priceCents, 10)) && (
            <p className="text-xs text-slate-400">≈ {priceLabel(parseInt(form.priceCents, 10))}</p>
          )}
          <div className="pt-2 flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600
                text-slate-600 dark:text-slate-400 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-sm rounded-lg bg-sky-600 text-white hover:bg-sky-700
                disabled:opacity-50 font-medium"
            >
              {isPending ? 'Đang lưu...' : isEdit ? 'Lưu' : 'Thêm thuốc'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Restock Modal ────────────────────────────────────────────────────────────

interface RestockModalProps {
  med: AdminMedicationDto;
  onClose: () => void;
  onSaved: () => void;
}

function RestockModal({ med, onClose, onSaved }: RestockModalProps) {
  const [qty, setQty] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: ({ id, q }: { id: string; q: number }) => adminApi.restockMedication(id, q),
    onSuccess: () => {
      onSaved();
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(qty, 10);
    if (!n || n < 1) {
      setError('Số lượng phải ít nhất 1');
      return;
    }
    mutation.mutate({ id: med.id, q: n });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-card-dark rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-white">Nhập kho</h2>
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
          <p className="text-sm text-slate-700 dark:text-slate-300">
            <span className="font-medium">{med.name}</span> — hiện còn{' '}
            <span className="font-bold text-emerald-600">{med.availableStock}</span> {med.unit}
          </p>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Số lượng nhập <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              autoFocus
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600
                bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600
                text-slate-600 dark:text-slate-400 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700
                disabled:opacity-50 font-medium"
            >
              {mutation.isPending ? 'Đang nhập...' : 'Nhập kho'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export function MedicationManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminMedicationDto | undefined>();
  const [restockTarget, setRestockTarget] = useState<AdminMedicationDto | undefined>();
  const [filter, setFilter] = useState<'all' | 'low' | 'inactive'>('all');

  const { data: medications = [], isLoading } = useQuery({
    queryKey: ['admin-medications', search],
    queryFn: () => adminApi.getMedications(search || undefined),
  });

  const toggleMutation = useMutation({
    mutationFn: adminApi.toggleMedicationActive,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-medications'] }),
  });

  const displayed = medications.filter((m) => {
    if (filter === 'low') return m.active && m.availableStock <= 10;
    if (filter === 'inactive') return !m.active;
    return true;
  });

  const handleSaved = () => queryClient.invalidateQueries({ queryKey: ['admin-medications'] });

  const stats = {
    total: medications.length,
    active: medications.filter((m) => m.active).length,
    low: medications.filter((m) => m.active && m.availableStock <= 10).length,
    outOfStock: medications.filter((m) => m.active && m.availableStock === 0).length,
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-background-dark">
      {/* Header */}
      <div className="px-6 py-4 bg-white dark:bg-card-dark border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Danh mục Thuốc</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {stats.active}/{stats.total} đang hoạt động
              {stats.low > 0 && (
                <span className="text-amber-600 ml-2">· {stats.low} sắp hết hàng</span>
              )}
              {stats.outOfStock > 0 && (
                <span className="text-red-600 ml-2">· {stats.outOfStock} hết hàng</span>
              )}
            </p>
          </div>
          <div className="flex-1" />
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm thuốc..."
              className="pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600
                bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm w-52"
            />
          </div>
          <button
            onClick={() => {
              setEditTarget(undefined);
              setShowModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700
              text-white text-sm font-medium rounded-lg"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Thêm thuốc
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mt-3">
          {(
            [
              { key: 'all', label: `Tất cả (${stats.total})` },
              { key: 'low', label: `Sắp hết (${stats.low})` },
              { key: 'inactive', label: `Tắt (${stats.total - stats.active})` },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${
                  filter === key
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 gap-2 text-slate-400">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            Đang tải...
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center text-slate-400">
            <span className="material-symbols-outlined text-5xl mb-2">medication</span>
            <p className="text-sm">Không có thuốc nào</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Tên thuốc
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    ĐVT
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Đơn giá
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-48">
                    Tồn kho
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {displayed.map((med) => (
                  <tr
                    key={med.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors
                      ${!med.active ? 'opacity-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">{med.name}</p>
                      {med.defaultDose && (
                        <p className="text-xs text-slate-400 truncate max-w-xs">
                          {med.defaultDose}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">
                      {med.unit}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">
                      {priceLabel(med.priceCents)}
                    </td>
                    <td className="px-4 py-3 w-48">
                      <StockBar real={med.stockReal} hold={med.stockHold} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleMutation.mutate(med.id)}
                        disabled={toggleMutation.isPending}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
                          transition-colors disabled:opacity-50
                          ${
                            med.active
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800'
                          }`}
                      >
                        <span className="material-symbols-outlined text-xs">
                          {med.active ? 'check_circle' : 'cancel'}
                        </span>
                        {med.active ? 'Hoạt động' : 'Tắt'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setRestockTarget(med)}
                          title="Nhập kho"
                          className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50
                            dark:hover:bg-emerald-900/20 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">add_circle</span>
                        </button>
                        <button
                          onClick={() => {
                            setEditTarget(med);
                            setShowModal(true);
                          }}
                          title="Sửa"
                          className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100
                            dark:hover:bg-slate-800 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <MedicationModal
          initial={editTarget}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
      {restockTarget && (
        <RestockModal
          med={restockTarget}
          onClose={() => setRestockTarget(undefined)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
