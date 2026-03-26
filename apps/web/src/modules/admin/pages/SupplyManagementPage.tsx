import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { formatVndFromCents } from '../../../lib/currency';
import { adminApi } from '../api';
import type { AdminSupplyDto, CreateSupplyRequest, UpdateSupplyRequest } from '../types';

type ActiveFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

function costLabel(cents: number) {
  return formatVndFromCents(cents);
}

interface SupplyModalProps {
  initial?: AdminSupplyDto | undefined;
  onClose: () => void;
  onSaved: () => void;
}

function SupplyModal({ initial, onClose, onSaved }: SupplyModalProps) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name ?? '');
  const [unit, setUnit] = useState(initial?.unit ?? '');
  const [stockQty, setStockQty] = useState(String(initial?.stockQty ?? 0));
  const [minQty, setMinQty] = useState(String(initial?.minQty ?? 0));
  const [unitCostCents, setUnitCostCents] = useState(String(initial?.unitCostCents ?? 0));
  const [active, setActive] = useState(initial?.active ?? true);
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: CreateSupplyRequest) => adminApi.createSupply(data),
    onSuccess: () => {
      onSaved();
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSupplyRequest }) =>
      adminApi.updateSupply(id, data),
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

    const normalizedName = name.trim();
    const normalizedUnit = unit.trim();
    const stock = parseInt(stockQty, 10);
    const min = parseInt(minQty, 10);
    const cost = parseInt(unitCostCents, 10);

    if (!normalizedName) {
      setError('Tên vật tư không được để trống');
      return;
    }
    if (!normalizedUnit) {
      setError('Đơn vị không được để trống');
      return;
    }
    if (Number.isNaN(stock) || stock < 0 || Number.isNaN(min) || min < 0) {
      setError('Tồn kho và mức cảnh báo phải >= 0');
      return;
    }
    if (Number.isNaN(cost) || cost < 0) {
      setError('Đơn giá không hợp lệ');
      return;
    }

    if (isEdit) {
      const data: UpdateSupplyRequest = {};
      if (normalizedName !== initial!.name) data.name = normalizedName;
      if (normalizedUnit !== initial!.unit) data.unit = normalizedUnit;
      if (stock !== initial!.stockQty) data.stockQty = stock;
      if (min !== initial!.minQty) data.minQty = min;
      if (cost !== initial!.unitCostCents) data.unitCostCents = cost;
      if (active !== initial!.active) data.active = active;
      updateMutation.mutate({ id: initial!.id, data });
      return;
    }

    createMutation.mutate({
      name: normalizedName,
      unit: normalizedUnit,
      stockQty: stock,
      minQty: min,
      unitCostCents: cost,
      active,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h2 className="font-semibold text-slate-900">
            {isEdit ? 'Sửa vật tư' : 'Thêm vật tư'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 p-4">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600">Tên vật tư *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Đơn vị *</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="hộp, gói, cái..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Trạng thái</label>
              <select
                value={active ? 'ACTIVE' : 'INACTIVE'}
                onChange={(e) => setActive(e.target.value === 'ACTIVE')}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Tồn kho</label>
              <input
                type="number"
                min={0}
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Mức cảnh báo</label>
              <input
                type="number"
                min={0}
                value={minQty}
                onChange={(e) => setMinQty(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </div>

            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Đơn giá nhập (VND)
              </label>
              <input
                type="number"
                min={0}
                value={unitCostCents}
                onChange={(e) => setUnitCostCents(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
            >
              {isPending ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Thêm vật tư'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface RestockSupplyModalProps {
  supply: AdminSupplyDto;
  onClose: () => void;
  onSaved: () => void;
}

function RestockSupplyModal({ supply, onClose, onSaved }: RestockSupplyModalProps) {
  const [qty, setQty] = useState('');
  const [unitCostCents, setUnitCostCents] = useState(String(supply.unitCostCents));
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: ({ id, restockQty, cost }: { id: string; restockQty: number; cost?: number }) =>
      adminApi.restockSupply(id, restockQty, cost),
    onSuccess: () => {
      onSaved();
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const restockQty = parseInt(qty, 10);
    const cost = parseInt(unitCostCents, 10);
    if (!restockQty || restockQty < 1) {
      setError('Số lượng nhập phải >= 1');
      return;
    }
    if (Number.isNaN(cost) || cost < 0) {
      setError('Đơn giá nhập không hợp lệ');
      return;
    }

    mutation.mutate({ id: supply.id, restockQty, cost });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h2 className="font-semibold text-slate-900">Nhập kho vat tu</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          <p className="text-sm text-slate-700">
            <span className="font-medium">{supply.name}</span> - hien con {supply.stockQty}{' '}
            {supply.unit}
          </p>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Số lượng nhập *</label>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Đơn giá nhập (VND)
            </label>
            <input
              type="number"
              min={0}
              value={unitCostCents}
              onChange={(e) => setUnitCostCents(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Đang nhập...' : 'Nhập kho'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function SupplyManagementPage() {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('ALL');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminSupplyDto | undefined>();
  const [restockTarget, setRestockTarget] = useState<AdminSupplyDto | undefined>();

  const activeParam = activeFilter === 'ALL' ? undefined : activeFilter === 'ACTIVE' ? true : false;

  const { data: supplies = [], isLoading } = useQuery({
    queryKey: ['admin-supplies', activeFilter, lowStockOnly],
    queryFn: () => adminApi.getSupplies(activeParam, lowStockOnly || undefined),
  });

  const toggleMutation = useMutation({
    mutationFn: adminApi.toggleSupply,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-supplies'] }),
  });

  const stats = useMemo(
    () => ({
      total: supplies.length,
      active: supplies.filter((supply) => supply.active).length,
      low: supplies.filter((supply) => supply.lowStock).length,
    }),
    [supplies],
  );

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-supplies'] });

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Quản lý vat tu</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              {stats.active}/{stats.total} đang hoạt động - {stats.low} vật tư sắp hết
            </p>
          </div>
          <div className="flex-1" />
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as ActiveFilter)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="ALL">Tất cả</option>
            <option value="ACTIVE">Chi hoat dong</option>
            <option value="INACTIVE">Chi tam tat</option>
          </select>
          <label className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
            />
            Sap het
          </label>
          <button
            onClick={() => {
              setEditTarget(undefined);
              setShowModal(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Thêm vật tư
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center gap-2 text-slate-400">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            Đang tải...
          </div>
        ) : supplies.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center text-center text-slate-400">
            <span className="material-symbols-outlined mb-2 text-5xl">inventory_2</span>
            <p className="text-sm">Chưa có vật tư nào</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Vat tu
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Tồn kho
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Mức cảnh báo
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Đơn giá nhập
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supplies.map((supply) => (
                  <tr
                    key={supply.id}
                    className={`${!supply.active ? 'opacity-60' : ''} hover:bg-slate-50`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{supply.name}</p>
                      <p className="text-xs text-slate-500">Đơn vị: {supply.unit}</p>
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-slate-900">
                      <span className={supply.lowStock ? 'text-red-600' : ''}>
                        {supply.stockQty}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">{supply.minQty}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      {costLabel(supply.unitCostCents)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          supply.active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {supply.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                      {supply.lowStock && (
                        <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          LOW
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setRestockTarget(supply)}
                          className="rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-700 hover:bg-emerald-100"
                        >
                          Nhập kho
                        </button>
                        <button
                          onClick={() => {
                            setEditTarget(supply);
                            setShowModal(true);
                          }}
                          className="rounded-md bg-slate-100 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-200"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => toggleMutation.mutate(supply.id)}
                          disabled={toggleMutation.isPending}
                          className="rounded-md bg-slate-100 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                        >
                          {supply.active ? 'Tat' : 'Bat'}
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
        <SupplyModal initial={editTarget} onClose={() => setShowModal(false)} onSaved={refresh} />
      )}
      {restockTarget && (
        <RestockSupplyModal
          supply={restockTarget}
          onClose={() => setRestockTarget(undefined)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
