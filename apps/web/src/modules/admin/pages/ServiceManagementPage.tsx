import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { adminApi } from '../api';
import type {
  AdminServiceDto,
  CreateServiceRequest,
  DepartmentDto,
  UpdateServiceRequest,
} from '../types';

function priceLabel(cents: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cents * 10);
}

interface ServiceModalProps {
  departments: DepartmentDto[];
  initial?: AdminServiceDto | undefined;
  onClose: () => void;
  onSaved: () => void;
}

function ServiceModal({ departments, initial, onClose, onSaved }: ServiceModalProps) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name ?? '');
  const [priceCents, setPriceCents] = useState(String(initial?.priceCents ?? ''));
  const [specialtyId, setSpecialtyId] = useState(initial?.specialtyId ?? '');
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

    const normalizedName = name.trim();
    const price = parseInt(priceCents, 10);

    if (!normalizedName) {
      setError('Ten dich vu khong duoc de trong');
      return;
    }
    if (Number.isNaN(price) || price < 0) {
      setError('Gia khong hop le');
      return;
    }

    if (isEdit) {
      const data: UpdateServiceRequest = {};
      if (normalizedName !== initial!.name) data.name = normalizedName;
      if (price !== initial!.priceCents) data.priceCents = price;
      if ((specialtyId || '') !== (initial!.specialtyId ?? '')) {
        data.specialtyId = specialtyId || '';
      }
      updateMutation.mutate({ id: initial!.id, data });
      return;
    }

    createMutation.mutate({
      name: normalizedName,
      priceCents: price,
      ...(specialtyId ? { specialtyId } : {}),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h2 className="font-semibold text-slate-900">
            {isEdit ? 'Sua dich vu' : 'Them dich vu'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 p-4">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Ten dich vu *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Kham tong quat"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Gia (cents) *</label>
            <input
              type="number"
              min={0}
              value={priceCents}
              onChange={(e) => setPriceCents(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Khoa chuyen mon</label>
            <select
              value={specialtyId}
              onChange={(e) => setSpecialtyId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            >
              <option value="">-- Chua gan khoa --</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>

          {priceCents && !Number.isNaN(parseInt(priceCents, 10)) && (
            <p className="text-xs text-slate-500">
              Gia hien thi: {priceLabel(parseInt(priceCents, 10))}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Huy
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
            >
              {isPending ? 'Dang luu...' : isEdit ? 'Luu thay doi' : 'Them dich vu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ServiceManagementPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminServiceDto | undefined>();

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['admin-services'],
    queryFn: adminApi.getServices,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['admin-departments-service'],
    queryFn: adminApi.getDepartments,
  });

  const toggleMutation = useMutation({
    mutationFn: adminApi.toggleServiceActive,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-services'] }),
  });

  const stats = useMemo(
    () => ({
      total: services.length,
      active: services.filter((service) => service.active).length,
      mappedSpecialty: services.filter((service) => !!service.specialtyId).length,
    }),
    [services],
  );

  const handleSaved = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-services'] });
  };

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Quan ly dich vu</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              {stats.active}/{stats.total} dang hoat dong - {stats.mappedSpecialty} da gan khoa
            </p>
          </div>
          <div className="flex-1" />
          <button
            onClick={() => {
              setEditTarget(undefined);
              setShowModal(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Them dich vu
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center gap-2 text-slate-400">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            Dang tai...
          </div>
        ) : services.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center text-center text-slate-400">
            <span className="material-symbols-outlined mb-2 text-5xl">medical_services</span>
            <p className="text-sm">Chua co dich vu nao</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Ten dich vu
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Khoa
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Gia
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Trang thai
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Thao tac
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {services.map((service) => (
                  <tr
                    key={service.id}
                    className={`${!service.active ? 'opacity-50' : ''} hover:bg-slate-50`}
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">{service.name}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {service.specialtyName ?? 'Chua gan'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      {priceLabel(service.priceCents)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleMutation.mutate(service.id)}
                        disabled={toggleMutation.isPending}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium disabled:opacity-50 ${
                          service.active
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {service.active ? 'Hoat dong' : 'Tam tat'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button
                          onClick={() => {
                            setEditTarget(service);
                            setShowModal(true);
                          }}
                          className="rounded-md bg-slate-100 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-200"
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
        <ServiceModal
          departments={departments}
          initial={editTarget}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
