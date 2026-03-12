import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { adminApi } from '../api';
import type { AdminRoomDto, CreateRoomRequest, RoomStatus, UpdateRoomRequest } from '../types';

const ROOM_STATUSES: RoomStatus[] = ['ACTIVE', 'INACTIVE', 'MAINTENANCE'];
const DEFAULT_ROOM_TYPES = ['EXAMINATION', 'LAB', 'ULTRASOUND', 'XRAY', 'PROCEDURE', 'OTHER'];

interface RoomModalProps {
  initial?: AdminRoomDto | undefined;
  knownTypes: string[];
  onClose: () => void;
  onSaved: () => void;
}

function RoomModal({ initial, knownTypes, onClose, onSaved }: RoomModalProps) {
  const isEdit = !!initial;
  const [code, setCode] = useState(initial?.code ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [area, setArea] = useState(initial?.area ?? '');
  const [roomType, setRoomType] = useState(initial?.roomType ?? 'EXAMINATION');
  const [status, setStatus] = useState<RoomStatus>(initial?.status ?? 'ACTIVE');
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: CreateRoomRequest) => adminApi.createRoom(data),
    onSuccess: () => {
      onSaved();
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoomRequest }) => adminApi.updateRoom(id, data),
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

    const normalizedCode = code.trim().toUpperCase();
    const normalizedName = name.trim();
    const normalizedArea = area.trim();
    const normalizedRoomType = roomType.trim().toUpperCase();

    if (!normalizedCode) {
      setError('Ma phong khong duoc de trong');
      return;
    }
    if (!normalizedName) {
      setError('Ten phong khong duoc de trong');
      return;
    }
    if (!normalizedRoomType) {
      setError('Loai phong khong duoc de trong');
      return;
    }

    if (isEdit) {
      const data: UpdateRoomRequest = {};
      if (normalizedCode !== initial!.code) data.code = normalizedCode;
      if (normalizedName !== initial!.name) data.name = normalizedName;
      if (normalizedArea !== (initial!.area ?? '')) data.area = normalizedArea;
      if (normalizedRoomType !== initial!.roomType) data.roomType = normalizedRoomType;
      if (status !== initial!.status) data.status = status;
      updateMutation.mutate({ id: initial!.id, data });
      return;
    }

    const payload: CreateRoomRequest = {
      code: normalizedCode,
      name: normalizedName,
      roomType: normalizedRoomType,
      status,
      ...(normalizedArea ? { area: normalizedArea } : {}),
    };

    createMutation.mutate(payload);
  };

  const typeOptions = useMemo(() => {
    const all = new Set<string>([...DEFAULT_ROOM_TYPES, ...knownTypes]);
    return Array.from(all).sort();
  }, [knownTypes]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl dark:bg-card-dark">
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            {isEdit ? 'Sua phong kham' : 'Them phong kham'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 p-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Ma phong *
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="P01"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Loai phong *
              </label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              >
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              Ten phong *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Phong kham 1"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              Khu vuc
            </label>
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Tang 1 - Khu A"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              Trang thai
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as RoomStatus)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            >
              {ROOM_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Huy
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
            >
              {isPending ? 'Dang luu...' : isEdit ? 'Luu' : 'Them phong'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function statusColor(status: string) {
  if (status === 'ACTIVE') return 'bg-emerald-100 text-emerald-700';
  if (status === 'MAINTENANCE') return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-600';
}

export function RoomManagementPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminRoomDto | undefined>();

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['admin-rooms', statusFilter, typeFilter],
    queryFn: () => adminApi.getRooms(statusFilter || undefined, typeFilter || undefined),
  });

  const toggleMutation = useMutation({
    mutationFn: adminApi.toggleRoom,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-rooms'] }),
  });

  const roomTypes = useMemo(() => {
    const all = new Set<string>(DEFAULT_ROOM_TYPES);
    rooms.forEach((room) => all.add(room.roomType));
    return Array.from(all).sort();
  }, [rooms]);

  const stats = {
    total: rooms.length,
    active: rooms.filter((room) => room.status === 'ACTIVE').length,
    maintenance: rooms.filter((room) => room.status === 'MAINTENANCE').length,
    assets: rooms.reduce((sum, room) => sum + room.assetCount, 0),
  };

  const refreshRooms = () => queryClient.invalidateQueries({ queryKey: ['admin-rooms'] });

  return (
    <div className="flex h-full flex-col bg-slate-50 dark:bg-background-dark">
      <div className="border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-card-dark">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Quan ly Phong kham</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              {stats.active}/{stats.total} phong dang hoat dong · {stats.maintenance} phong bao tri ·{' '}
              {stats.assets} tai san
            </p>
          </div>
          <div className="flex-1" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          >
            <option value="">Tat ca trang thai</option>
            {ROOM_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          >
            <option value="">Tat ca loai phong</option>
            {roomTypes.map((type) => (
              <option key={type} value={type}>
                {type}
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
            Them phong
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center gap-2 text-slate-400">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            Dang tai...
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center text-center text-slate-400">
            <span className="material-symbols-outlined mb-2 text-5xl">meeting_room</span>
            <p className="text-sm">Chua co phong kham nao</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-card-dark">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Ma phong
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Ten phong
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Khu vuc
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Loai
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Trang thai
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Tai san
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Thao tac
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rooms.map((room) => (
                  <tr key={room.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{room.code}</td>
                    <td className="px-4 py-3 text-slate-900 dark:text-white">{room.name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{room.area || '—'}</td>
                    <td className="px-4 py-3 text-center text-slate-700 dark:text-slate-300">{room.roomType}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColor(room.status)}`}>
                        {room.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-slate-700 dark:text-slate-300">
                      {room.assetCount}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleMutation.mutate(room.id)}
                          className="rounded-md bg-slate-100 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          {room.status === 'ACTIVE' ? 'Tat' : 'Bat'}
                        </button>
                        <button
                          onClick={() => {
                            setEditTarget(room);
                            setShowModal(true);
                          }}
                          className="rounded-md bg-slate-100 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          Sua
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
        <RoomModal
          initial={editTarget}
          knownTypes={roomTypes}
          onClose={() => setShowModal(false)}
          onSaved={refreshRooms}
        />
      )}
    </div>
  );
}
