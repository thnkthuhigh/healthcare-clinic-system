import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { adminApi } from '../api';
import type { AdminServiceDto, CreateServiceRequest, UpdateServiceRequest } from '../types';

function priceLabel(cents: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cents * 10);
}

// ── Service Modal ────────────────────────────────────────────────────────────

interface ServiceModalProps {
  initial?: AdminServiceDto | undefined;
  onClose: () => void;
  onSaved: () => void;
}

function ServiceModal({ initial, onClose, onSaved }: ServiceModalProps) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name ?? '');
  const [durationMin, setDurationMin] = useState(String(initial?.durationMin ?? ''));
  const [priceCents, setPriceCents] = useState(String(initial?.priceCents ?? ''));
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: CreateServiceRequest) => adminApi.createService(data),
    onSuccess: () => {
      onSaved();
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServiceRequest }) =>
      adminApi.updateService(id, data),
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
    const dur = parseInt(durationMin, 10);
    const price = parseInt(priceCents, 10);
    if (!name.trim()) {
      setError('Tên dịch vụ không được để trống');
      return;
    }
    if (!dur || dur < 1) {
      setError('Thời gian ít nhất 1 phút');
      return;
    }
    if (isNaN(price) || price < 0) {
      setError('Giá không hợp lệ');
      return;
    }

    if (isEdit) {
      const data: UpdateServiceRequest = {};
      if (name !== initial!.name) data.name = name;
      if (dur !== initial!.durationMin) data.durationMin = dur;
      if (price !== initial!.priceCents) data.priceCents = price;
      updateMutation.mutate({ id: initial!.id, data });
    } else {
      createMutation.mutate({ name: name.trim(), durationMin: dur, priceCents: price });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-card-dark rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            {isEdit ? 'Sửa dịch vụ' : 'Thêm dịch vụ'}
          </h2>
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
              Tên dịch vụ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Khám tổng quát"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600
                bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Thời gian (phút) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                placeholder="30"
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
                value={priceCents}
                onChange={(e) => setPriceCents(e.target.value)}
                placeholder="20000"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600
                  bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-sm"
              />
            </div>
          </div>

          {priceCents && !isNaN(parseInt(priceCents, 10)) && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ≈ {priceLabel(parseInt(priceCents, 10))}
            </p>
          )}

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
              disabled={isPending}
              className="px-4 py-2 text-sm rounded-lg bg-sky-600 text-white hover:bg-sky-700
                disabled:opacity-50 font-medium"
            >
              {isPending ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Thêm dịch vụ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export function ServiceManagementPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminServiceDto | undefined>();

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['admin-services'],
    queryFn: adminApi.getServices,
  });

  const toggleMutation = useMutation({
    mutationFn: adminApi.toggleServiceActive,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-services'] }),
  });

  const handleOpenCreate = () => {
    setEditTarget(undefined);
    setShowModal(true);
  };

  const handleOpenEdit = (svc: AdminServiceDto) => {
    setEditTarget(svc);
    setShowModal(true);
  };

  const handleSaved = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-services'] });
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-background-dark">
      {/* Header */}
      <div
        className="px-6 py-4 bg-white dark:bg-card-dark border-b border-slate-200 dark:border-slate-700
        flex items-center gap-4 flex-wrap"
      >
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Quản lý Dịch vụ khám</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {services.length} dịch vụ · {services.filter((s) => s.active).length} đang hoạt động
          </p>
        </div>
        <div className="flex-1" />
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700
            text-white text-sm font-medium rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Thêm dịch vụ
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 gap-2 text-slate-400">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            Đang tải...
          </div>
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center text-slate-400">
            <span className="material-symbols-outlined text-5xl mb-2">medical_services</span>
            <p className="text-sm">Chưa có dịch vụ nào</p>
            <button
              onClick={handleOpenCreate}
              className="mt-3 text-xs text-sky-600 hover:underline"
            >
              + Thêm dịch vụ đầu tiên
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Tên dịch vụ
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Giá dịch vụ
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {services.map((svc) => (
                  <tr
                    key={svc.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors
                      ${!svc.active ? 'opacity-50' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {svc.name}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">
                      <span className="flex items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {svc.durationMin} phút
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">
                      {priceLabel(svc.priceCents)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleMutation.mutate(svc.id)}
                        disabled={toggleMutation.isPending}
                        title={svc.active ? 'Nhấn để tắt' : 'Nhấn để bật'}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                          transition-colors disabled:opacity-50 cursor-pointer
                          ${
                            svc.active
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                      >
                        <span className="material-symbols-outlined text-xs">
                          {svc.active ? 'check_circle' : 'cancel'}
                        </span>
                        {svc.active ? 'Hoạt động' : 'Tắt'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleOpenEdit(svc)}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md
                          bg-slate-100 text-slate-600 hover:bg-slate-200
                          dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                        Sửa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <ServiceModal
          initial={editTarget}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
