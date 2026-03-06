import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { adminApi } from '../api';
import type {
  AdminDoctorDto,
  CreateDoctorRequest,
  DepartmentDto,
  UpdateDoctorRequest,
} from '../types';

type ModalState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; doctor: AdminDoctorDto };

const EMPTY_CREATE: CreateDoctorRequest = {
  phone: '',
  password: '',
  displayName: '',
  specialty: '',
};

function SpecialtySelect({
  name,
  defaultValue,
  departments,
}: {
  name: string;
  defaultValue?: string | undefined;
  departments: DepartmentDto[];
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue ?? ''}
      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
        bg-white focus:border-blue-500 focus:outline-none text-slate-900"
    >
      <option value="">— Không có —</option>
      {departments.map((d) => (
        <option key={d.id} value={d.name}>
          {d.name}
        </option>
      ))}
    </select>
  );
}

export function DoctorManagementPage() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' });
  const [formError, setFormError] = useState('');

  // ── Queries ──
  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ['admin-doctors'],
    queryFn: () => adminApi.getDoctors(),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['admin-departments'],
    queryFn: adminApi.getDepartments,
  });

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: (data: CreateDoctorRequest) => adminApi.createDoctor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
      setModal({ mode: 'closed' });
    },
    onError: (e) => setFormError(e instanceof Error ? e.message : 'Lỗi tạo tài khoản'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDoctorRequest }) =>
      adminApi.updateDoctor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
      setModal({ mode: 'closed' });
    },
    onError: (e) => setFormError(e instanceof Error ? e.message : 'Lỗi cập nhật'),
  });

  const lockMutation = useMutation({
    mutationFn: ({ id, lock }: { id: string; lock: boolean }) =>
      lock ? adminApi.lockDoctor(id) : adminApi.unlockDoctor(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-doctors'] }),
  });

  // ── Form handlers ──
  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError('');
    const fd = new FormData(e.currentTarget);
    const specialty = (fd.get('specialty') as string).trim();
    createMutation.mutate({
      phone: fd.get('phone') as string,
      password: fd.get('password') as string,
      displayName: fd.get('displayName') as string,
      ...(specialty ? { specialty } : {}),
    });
  }

  function handleUpdate(e: React.FormEvent<HTMLFormElement>, doctorId: string) {
    e.preventDefault();
    setFormError('');
    const fd = new FormData(e.currentTarget);
    const displayName = (fd.get('displayName') as string).trim();
    const specialty = (fd.get('specialty') as string).trim();
    const newPassword = (fd.get('newPassword') as string).trim();
    updateMutation.mutate({
      id: doctorId,
      data: {
        ...(displayName ? { displayName } : {}),
        ...(specialty ? { specialty } : {}),
        ...(newPassword ? { newPassword } : {}),
      },
    });
  }

  // ── Render ──
  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{doctors.length} bác sĩ</p>
        <button
          onClick={() => {
            setFormError('');
            setModal({ mode: 'create' });
          }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <span className="material-symbols-outlined text-base">person_add</span>
          Thêm bác sĩ
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {isLoading ? (
          <p className="py-12 text-center text-sm text-slate-400">Đang tải...</p>
        ) : doctors.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">Chưa có bác sĩ nào</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Bác sĩ</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Chuyên khoa</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">SĐT</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Trạng thái</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {doctors.map((doctor) => (
                <tr key={doctor.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                        {doctor.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{doctor.displayName}</p>
                        <p className="text-xs text-slate-400">
                          Ngày tạo: {new Date(doctor.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{doctor.specialty ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{doctor.phone}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        doctor.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {doctor.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setFormError('');
                          setModal({ mode: 'edit', doctor });
                        }}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        <span className="material-symbols-outlined align-middle text-sm">edit</span>
                      </button>
                      <button
                        onClick={() =>
                          lockMutation.mutate({ id: doctor.id, lock: doctor.status === 'ACTIVE' })
                        }
                        disabled={lockMutation.isPending}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
                          doctor.status === 'ACTIVE'
                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                            : 'border-green-200 text-green-600 hover:bg-green-50'
                        }`}
                      >
                        <span className="material-symbols-outlined align-middle text-sm">
                          {doctor.status === 'ACTIVE' ? 'lock' : 'lock_open'}
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal.mode !== 'closed' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-base font-bold text-slate-900">
              {modal.mode === 'create' ? 'Thêm bác sĩ mới' : `Sửa: ${modal.doctor.displayName}`}
            </h3>

            {modal.mode === 'create' ? (
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Số điện thoại *
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    required
                    defaultValue={EMPTY_CREATE.phone}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Mật khẩu *
                  </label>
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Tên hiển thị *
                  </label>
                  <input
                    name="displayName"
                    required
                    placeholder="VD: BS. Nguyễn Văn A"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Chuyên khoa
                  </label>
                  <SpecialtySelect name="specialty" departments={departments} />
                </div>
                {formError && <p className="text-xs text-red-600">{formError}</p>}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModal({ mode: 'closed' })}
                    className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createMutation.isPending ? 'Đang tạo...' : 'Tạo tài khoản'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={(e) => handleUpdate(e, modal.doctor.id)} className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Tên hiển thị
                  </label>
                  <input
                    name="displayName"
                    defaultValue={modal.doctor.displayName}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Chuyên khoa
                  </label>
                  <SpecialtySelect
                    name="specialty"
                    defaultValue={modal.doctor.specialty ?? ''}
                    departments={departments}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Mật khẩu mới (để trống nếu không đổi)
                  </label>
                  <input
                    name="newPassword"
                    type="password"
                    minLength={6}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                {formError && <p className="text-xs text-red-600">{formError}</p>}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModal({ mode: 'closed' })}
                    className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
