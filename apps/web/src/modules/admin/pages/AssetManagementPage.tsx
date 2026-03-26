import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { formatVndFromCents } from '../../../lib/currency';
import { adminApi } from '../api';
import type {
  AdminAssetDto,
  AdminRoomDto,
  AssetStatus,
  CreateAssetRequest,
  UpdateAssetRequest,
} from '../types';

const ASSET_STATUSES: AssetStatus[] = ['ACTIVE', 'MAINTENANCE', 'RETIRED'];

function priceLabel(cents: number) {
  return formatVndFromCents(cents);
}

interface AssetModalProps {
  rooms: AdminRoomDto[];
  initial?: AdminAssetDto | undefined;
  onClose: () => void;
  onSaved: () => void;
}

function AssetModal({ rooms, initial, onClose, onSaved }: AssetModalProps) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name ?? '');
  const [assetCode, setAssetCode] = useState(initial?.assetCode ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'EQUIPMENT');
  const [roomId, setRoomId] = useState(initial?.roomId ?? '');
  const [purchaseDate, setPurchaseDate] = useState(initial?.purchaseDate ?? '');
  const [purchasePriceCents, setPurchasePriceCents] = useState(
    String(initial?.purchasePriceCents ?? 0),
  );
  const [status, setStatus] = useState<AssetStatus>(initial?.status ?? 'ACTIVE');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: CreateAssetRequest) => adminApi.createAsset(data),
    onSuccess: () => {
      onSaved();
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAssetRequest }) =>
      adminApi.updateAsset(id, data),
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
    const normalizedCategory = category.trim().toUpperCase();
    const normalizedAssetCode = assetCode.trim();
    const normalizedNotes = notes.trim();
    const price = parseInt(purchasePriceCents, 10);

    if (!normalizedName) {
      setError('Tên tài sản không được để trống');
      return;
    }
    if (!normalizedCategory) {
      setError('Danh mục không được để trống');
      return;
    }
    if (Number.isNaN(price) || price < 0) {
      setError('Giá mua không hợp lệ');
      return;
    }

    if (isEdit) {
      const data: UpdateAssetRequest = {};
      if (normalizedName !== initial!.name) data.name = normalizedName;
      if ((normalizedAssetCode || '') !== (initial!.assetCode ?? ''))
        data.assetCode = normalizedAssetCode || '';
      if (normalizedCategory !== initial!.category) data.category = normalizedCategory;
      if ((roomId || '') !== (initial!.roomId ?? '')) data.roomId = roomId || '';
      if ((purchaseDate || '') !== (initial!.purchaseDate ?? ''))
        data.purchaseDate = purchaseDate || '';
      if (price !== initial!.purchasePriceCents) data.purchasePriceCents = price;
      if (status !== initial!.status) data.status = status;
      if ((normalizedNotes || '') !== (initial!.notes ?? '')) data.notes = normalizedNotes;
      updateMutation.mutate({ id: initial!.id, data });
      return;
    }

    createMutation.mutate({
      name: normalizedName,
      ...(normalizedAssetCode ? { assetCode: normalizedAssetCode } : {}),
      category: normalizedCategory,
      ...(roomId ? { roomId } : {}),
      ...(purchaseDate ? { purchaseDate } : {}),
      purchasePriceCents: price,
      status,
      ...(normalizedNotes ? { notes: normalizedNotes } : {}),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h2 className="font-semibold text-slate-900">
            {isEdit ? 'Sửa tài sản' : 'Thêm tài sản'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 p-4">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600">Tên tài sản *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Mã tài sản</label>
              <input
                type="text"
                value={assetCode}
                onChange={(e) => setAssetCode(e.target.value)}
                placeholder="TS-001"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Category *</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="EQUIPMENT"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Phòng</label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="">-- Chưa gán phòng --</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.code} - {room.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Trạng thái</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AssetStatus)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                {ASSET_STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Ngày mua</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Giá mua (cents)
              </label>
              <input
                type="number"
                min={0}
                value={purchasePriceCents}
                onChange={(e) => setPurchasePriceCents(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </div>

            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-600">Ghi chu</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
              {isPending ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Thêm tài sản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function statusBadgeColor(status: AssetStatus) {
  if (status === 'ACTIVE') return 'bg-emerald-100 text-emerald-700';
  if (status === 'MAINTENANCE') return 'bg-amber-100 text-amber-700';
  return 'bg-slate-200 text-slate-700';
}

export function AssetManagementPage() {
  const queryClient = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roomFilter, setRoomFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminAssetDto | undefined>();

  const { data: rooms = [] } = useQuery({
    queryKey: ['admin-rooms-asset-filter'],
    queryFn: () => adminApi.getRooms(),
    staleTime: 60000,
  });

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['admin-assets', categoryFilter, statusFilter, roomFilter],
    queryFn: () =>
      adminApi.getAssets(
        categoryFilter || undefined,
        statusFilter || undefined,
        roomFilter || undefined,
      ),
  });

  const quickStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AssetStatus }) =>
      adminApi.updateAsset(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-assets'] }),
  });

  const categories = useMemo(() => {
    const unique = new Set<string>();
    for (const asset of assets) {
      unique.add(asset.category);
    }
    return Array.from(unique.values()).sort((left, right) => left.localeCompare(right));
  }, [assets]);

  const stats = useMemo(
    () => ({
      total: assets.length,
      active: assets.filter((asset) => asset.status === 'ACTIVE').length,
      maintenance: assets.filter((asset) => asset.status === 'MAINTENANCE').length,
      retired: assets.filter((asset) => asset.status === 'RETIRED').length,
    }),
    [assets],
  );

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-assets'] });

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Quản lý tai san</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              {stats.active}/{stats.total} đang hoạt động - {stats.maintenance} bảo trì -{' '}
              {stats.retired} ngung su dung
            </p>
          </div>
          <div className="flex-1" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="">Tất cả category</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <select
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="">Tất cả phong</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.code} - {room.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="">Tất cả trang thai</option>
            {ASSET_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setEditTarget(undefined);
              setShowModal(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Thêm tài sản
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center gap-2 text-slate-400">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            Đang tải...
          </div>
        ) : assets.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center text-center text-slate-400">
            <span className="material-symbols-outlined mb-2 text-5xl">inventory</span>
            <p className="text-sm">Chưa có tài sản nào</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Mã
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Tên tài sản
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Phòng
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Ngày mua
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Giá mua
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
                {assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700">{asset.assetCode ?? '-'}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{asset.name}</p>
                      {asset.notes && (
                        <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                          {asset.notes}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{asset.category}</td>
                    <td className="px-4 py-3 text-slate-700">{asset.roomName ?? '-'}</td>
                    <td className="px-4 py-3 text-center text-slate-700">
                      {asset.purchaseDate ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      {priceLabel(asset.purchasePriceCents)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeColor(asset.status)}`}
                      >
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {asset.status !== 'MAINTENANCE' && (
                          <button
                            onClick={() =>
                              quickStatusMutation.mutate({ id: asset.id, status: 'MAINTENANCE' })
                            }
                            className="rounded-md bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700 hover:bg-amber-100"
                          >
                            Bao tri
                          </button>
                        )}
                        {asset.status !== 'RETIRED' && (
                          <button
                            onClick={() =>
                              quickStatusMutation.mutate({ id: asset.id, status: 'RETIRED' })
                            }
                            className="rounded-md bg-rose-50 px-2.5 py-1.5 text-xs text-rose-700 hover:bg-rose-100"
                          >
                            Ngung su dung
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditTarget(asset);
                            setShowModal(true);
                          }}
                          className="rounded-md bg-slate-100 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-200"
                        >
                          Sửa
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
        <AssetModal
          rooms={rooms}
          initial={editTarget}
          onClose={() => setShowModal(false)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
