import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { adminApi } from '../api';
import type { AdminDoctorDto, AdminServiceDto, DepartmentDto } from '../types';

interface DepartmentUsage {
  doctorCount: number;
  serviceCount: number;
  doctors: AdminDoctorDto[];
  services: AdminServiceDto[];
}

function normalizeKey(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

export function DepartmentManagementPage() {
  const queryClient = useQueryClient();

  const [newName, setNewName] = useState('');
  const [formError, setFormError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['admin-departments'],
    queryFn: adminApi.getDepartments,
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ['admin-doctors-department-usage'],
    queryFn: adminApi.getDoctors,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['admin-services-department-usage'],
    queryFn: adminApi.getServices,
  });

  useEffect(() => {
    if (departments.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !departments.some((dept) => dept.id === selectedId)) {
      setSelectedId(departments[0]?.id ?? null);
    }
  }, [departments, selectedId]);

  const usageMap = useMemo(() => {
    const map = new Map<string, DepartmentUsage>();

    for (const dept of departments) {
      const deptKey = normalizeKey(dept.name);
      const deptDoctors = doctors.filter((doctor) => normalizeKey(doctor.specialty) === deptKey);
      const deptServices = services.filter(
        (service) => normalizeKey(service.specialtyName) === deptKey,
      );
      map.set(dept.id, {
        doctorCount: deptDoctors.length,
        serviceCount: deptServices.length,
        doctors: deptDoctors,
        services: deptServices,
      });
    }

    return map;
  }, [departments, doctors, services]);

  const selectedDepartment = departments.find((dept) => dept.id === selectedId) ?? null;
  const selectedUsage = (selectedDepartment ? usageMap.get(selectedDepartment.id) : null) ?? {
    doctorCount: 0,
    serviceCount: 0,
    doctors: [],
    services: [],
  };

  const deleteTarget = departments.find((dept) => dept.id === confirmDeleteId) ?? null;
  const deleteUsage = (deleteTarget ? usageMap.get(deleteTarget.id) : null) ?? {
    doctorCount: 0,
    serviceCount: 0,
    doctors: [],
    services: [],
  };

  const createMutation = useMutation({
    mutationFn: (name: string) => adminApi.createDepartment(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-departments'] });
      setNewName('');
      setFormError('');
    },
    onError: (error) => setFormError(error instanceof Error ? error.message : 'Tao khoa that bai'),
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => adminApi.renameDepartment(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-departments'] });
      setEditingId(null);
      setEditingName('');
      setFormError('');
    },
    onError: (error) => setFormError(error instanceof Error ? error.message : 'Doi ten that bai'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-departments'] });
      setConfirmDeleteId(null);
    },
    onError: (error) => setFormError(error instanceof Error ? error.message : 'Xoa khoa that bai'),
  });

  function submitCreate(event: React.FormEvent) {
    event.preventDefault();
    setFormError('');
    const normalized = newName.trim();
    if (!normalized) {
      setFormError('Ten khoa la bat buoc.');
      return;
    }
    createMutation.mutate(normalized);
  }

  function startEdit(dept: DepartmentDto) {
    setEditingId(dept.id);
    setEditingName(dept.name);
    setFormError('');
  }

  function submitEdit(event: React.FormEvent, deptId: string) {
    event.preventDefault();
    setFormError('');
    const normalized = editingName.trim();
    if (!normalized) {
      setFormError('Ten khoa la bat buoc.');
      return;
    }
    renameMutation.mutate({ id: deptId, name: normalized });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Quan ly khoa</h1>
            <p className="text-xs text-slate-500">{departments.length} khoa trong he thong</p>
          </div>
        </div>

        <form onSubmit={submitCreate} className="flex flex-wrap gap-2">
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Ten khoa/chuyen khoa"
            className="min-w-[260px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Dang tao...' : 'Them khoa'}
          </button>
        </form>

        {formError && <p className="mt-2 text-xs text-red-600">{formError}</p>}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Danh sach khoa
          </div>

          {isLoading ? (
            <p className="py-16 text-center text-sm text-slate-400">Dang tai...</p>
          ) : departments.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-400">Chua co khoa nao</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {departments.map((dept) => {
                const usage = usageMap.get(dept.id) ?? {
                  doctorCount: 0,
                  serviceCount: 0,
                  doctors: [],
                  services: [],
                };
                const isActive = selectedId === dept.id;
                const isEditing = editingId === dept.id;

                return (
                  <li
                    key={dept.id}
                    className={`px-4 py-3 transition-colors ${isActive ? 'bg-blue-50/70' : 'hover:bg-slate-50'}`}
                    onMouseEnter={() => setSelectedId(dept.id)}
                  >
                    {isEditing ? (
                      <form
                        onSubmit={(event) => submitEdit(event, dept.id)}
                        className="flex items-center gap-2"
                      >
                        <input
                          autoFocus
                          value={editingName}
                          onChange={(event) => setEditingName(event.target.value)}
                          className="flex-1 rounded-lg border border-blue-300 px-3 py-1.5 text-sm focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={renameMutation.isPending}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          Luu
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditingName('');
                          }}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                        >
                          Huy
                        </button>
                      </form>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedId(dept.id)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {dept.name}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-2 text-xs">
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">
                              {usage.doctorCount} bac si
                            </span>
                            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-violet-700">
                              {usage.serviceCount} dich vu
                            </span>
                          </div>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEdit(dept)}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100"
                            title="Doi ten"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(dept.id)}
                            className="rounded-lg border border-red-200 p-1.5 text-red-500 hover:bg-red-50"
                            title="Xoa"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Chi tiet khoa
          </div>

          {!selectedDepartment ? (
            <p className="py-16 text-center text-sm text-slate-400">Chon khoa de xem chi tiet</p>
          ) : (
            <div className="space-y-4 p-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {selectedDepartment.name}
                </h2>
                <p className="text-xs text-slate-500">
                  {selectedUsage.doctorCount} bac si � {selectedUsage.serviceCount} dich vu
                </p>
              </div>

              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Bac si thuoc khoa
                </h3>
                {selectedUsage.doctors.length === 0 ? (
                  <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-400">
                    Khong co bac si nao
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {selectedUsage.doctors.map((doctor) => (
                      <li key={doctor.id} className="rounded-lg border border-slate-200 px-3 py-2">
                        <p className="text-sm font-medium text-slate-800">{doctor.displayName}</p>
                        <p className="text-xs text-slate-500">{doctor.phone}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Dich vu thuoc khoa
                </h3>
                {selectedUsage.services.length === 0 ? (
                  <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-400">
                    Khong co dich vu nao
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {selectedUsage.services.map((service) => (
                      <li key={service.id} className="rounded-lg border border-slate-200 px-3 py-2">
                        <p className="text-sm font-medium text-slate-800">{service.name}</p>
                        <p className="text-xs text-slate-500">
                          Gia: {new Intl.NumberFormat('vi-VN').format(service.priceCents)} d
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Xac nhan xoa khoa</h3>
            <p className="mt-2 text-sm text-slate-600">
              Ban sap xoa khoa <strong>{deleteTarget.name}</strong>.
            </p>

            {(deleteUsage.doctorCount > 0 || deleteUsage.serviceCount > 0) && (
              <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Canh bao: khoa nay dang co {deleteUsage.doctorCount} bac si va{' '}
                {deleteUsage.serviceCount} dich vu lien ket. Nen gan lai truoc khi xoa de tranh sai
                lech du lieu.
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Huy
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Dang xoa...' : 'Van xoa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
