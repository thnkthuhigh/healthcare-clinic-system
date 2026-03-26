import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { adminApi } from '../api';
import type {
  AdminDoctorDto,
  AdminServiceDto,
  CreateDoctorRequest,
  DepartmentDto,
  UpdateDoctorRequest,
} from '../types';

type ModalState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; doctor: AdminDoctorDto };

type ModalTab = 'ACCOUNT' | 'PROFILE';

interface DoctorFormState {
  phone: string;
  password: string;
  newPassword: string;
  displayName: string;
  specialty: string;
  bio: string;
  experienceYears: string;
  qualifications: string;
  dateOfBirth: string;
  nationalId: string;
  workHistory: string;
  serviceIds: string[];
}

function emptyDoctorForm(): DoctorFormState {
  return {
    phone: '',
    password: '',
    newPassword: '',
    displayName: '',
    specialty: '',
    bio: '',
    experienceYears: '0',
    qualifications: '',
    dateOfBirth: '',
    nationalId: '',
    workHistory: '',
    serviceIds: [],
  };
}

function doctorToForm(doctor: AdminDoctorDto): DoctorFormState {
  return {
    phone: doctor.phone,
    password: '',
    newPassword: '',
    displayName: doctor.displayName,
    specialty: doctor.specialty ?? '',
    bio: doctor.bio ?? '',
    experienceYears: String(doctor.experienceYears ?? 0),
    qualifications: doctor.qualifications ?? '',
    dateOfBirth: doctor.dateOfBirth ?? '',
    nationalId: doctor.nationalId ?? '',
    workHistory: doctor.workHistory ?? '',
    serviceIds: doctor.serviceIds ?? [],
  };
}

function normalizeSpecialty(value: string) {
  return value.trim().toLowerCase();
}

function filterServicesBySpecialty(services: AdminServiceDto[], specialty: string) {
  const activeServices = services.filter((svc) => svc.active);
  const normalized = normalizeSpecialty(specialty);
  if (!normalized) return activeServices;

  const matched = activeServices.filter(
    (svc) => (svc.specialtyName ?? '').trim().toLowerCase() === normalized,
  );

  return matched.length > 0 ? matched : activeServices;
}

export function DoctorManagementPage() {
  const queryClient = useQueryClient();

  const [modal, setModal] = useState<ModalState>({ mode: 'closed' });
  const [activeTab, setActiveTab] = useState<ModalTab>('ACCOUNT');
  const [form, setForm] = useState<DoctorFormState>(emptyDoctorForm());
  const [formError, setFormError] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ['admin-doctors'],
    queryFn: () => adminApi.getDoctors(),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['admin-departments'],
    queryFn: adminApi.getDepartments,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['admin-services-doctor-modal'],
    queryFn: adminApi.getServices,
  });

  const visibleServices = useMemo(
    () => filterServicesBySpecialty(services, form.specialty),
    [services, form.specialty],
  );

  const createMutation = useMutation({
    mutationFn: (data: CreateDoctorRequest) => adminApi.createDoctor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
      closeModal();
    },
    onError: (e) => setFormError(e instanceof Error ? e.message : 'Lỗi tạo tài khoản'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDoctorRequest }) =>
      adminApi.updateDoctor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
      closeModal();
    },
    onError: (e) => setFormError(e instanceof Error ? e.message : 'Lỗi cập nhật'),
  });

  const lockMutation = useMutation({
    mutationFn: ({ id, lock }: { id: string; lock: boolean }) =>
      lock ? adminApi.lockDoctor(id) : adminApi.unlockDoctor(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-doctors'] }),
  });

  function closeModal() {
    setModal({ mode: 'closed' });
    setActiveTab('ACCOUNT');
    setFormError('');
    setForm(emptyDoctorForm());
    setShowCreatePassword(false);
    setShowNewPassword(false);
  }

  function openCreateModal() {
    setModal({ mode: 'create' });
    setActiveTab('ACCOUNT');
    setForm(emptyDoctorForm());
    setFormError('');
    setShowCreatePassword(false);
    setShowNewPassword(false);
  }

  function openEditModal(doctor: AdminDoctorDto) {
    setModal({ mode: 'edit', doctor });
    setActiveTab('ACCOUNT');
    setForm(doctorToForm(doctor));
    setFormError('');
    setShowCreatePassword(false);
    setShowNewPassword(false);
  }

  function updateField<K extends keyof DoctorFormState>(key: K, value: DoctorFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleService(serviceId: string) {
    setForm((prev) => {
      const has = prev.serviceIds.includes(serviceId);
      return {
        ...prev,
        serviceIds: has
          ? prev.serviceIds.filter((id) => id !== serviceId)
          : [...prev.serviceIds, serviceId],
      };
    });
  }

  function validateCommon() {
    if (!form.displayName.trim()) {
      return 'Vui lòng nhập tên hiển thị.';
    }

    const years = Number(form.experienceYears);
    if (Number.isNaN(years) || years < 0) {
      return 'Số năm kinh nghiệm phải >= 0.';
    }

    return '';
  }

  function buildCreatePayload(): CreateDoctorRequest {
    const years = Number(form.experienceYears);
    return {
      phone: form.phone.trim(),
      password: form.password,
      displayName: form.displayName.trim(),
      ...(form.specialty.trim() ? { specialty: form.specialty.trim() } : {}),
      ...(form.bio.trim() ? { bio: form.bio.trim() } : {}),
      ...(form.qualifications.trim() ? { qualifications: form.qualifications.trim() } : {}),
      ...(Number.isFinite(years) ? { experienceYears: years } : {}),
      ...(form.dateOfBirth ? { dateOfBirth: form.dateOfBirth } : {}),
      ...(form.nationalId.trim() ? { nationalId: form.nationalId.trim() } : {}),
      ...(form.workHistory.trim() ? { workHistory: form.workHistory.trim() } : {}),
      ...(form.serviceIds.length > 0 ? { serviceIds: form.serviceIds } : {}),
    };
  }

  function buildUpdatePayload(): UpdateDoctorRequest {
    const years = Number(form.experienceYears);
    return {
      displayName: form.displayName.trim(),
      specialty: form.specialty,
      bio: form.bio,
      qualifications: form.qualifications,
      experienceYears: Number.isFinite(years) ? years : 0,
      dateOfBirth: form.dateOfBirth || undefined,
      nationalId: form.nationalId,
      workHistory: form.workHistory,
      serviceIds: form.serviceIds,
      ...(form.newPassword.trim() ? { newPassword: form.newPassword.trim() } : {}),
    };
  }

  function submitCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError('');

    if (!form.phone.trim()) {
      setFormError('Vui lòng nhập số điện thoại.');
      return;
    }

    if (!form.password || form.password.length < 6) {
      setFormError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    const commonError = validateCommon();
    if (commonError) {
      setFormError(commonError);
      return;
    }

    createMutation.mutate(buildCreatePayload());
  }

  function submitUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError('');

    const commonError = validateCommon();
    if (commonError) {
      setFormError(commonError);
      return;
    }

    if (form.newPassword.trim() && form.newPassword.trim().length < 6) {
      setFormError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    if (modal.mode !== 'edit') return;
    updateMutation.mutate({ id: modal.doctor.id, data: buildUpdatePayload() });
  }

  const isCreateMode = modal.mode === 'create';
  const isEditMode = modal.mode === 'edit';

  return (
    <div className="space-y-4 px-1">
      <div className="flex items-center justify-between px-1 py-1">
        <p className="text-sm text-slate-600">{doctors.length} bác sĩ</p>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <span className="material-symbols-outlined text-base">person_add</span>
          Thêm bác sĩ
        </button>
      </div>

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
                <th className="px-4 py-3 text-left font-medium text-slate-600">Dịch vụ</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">SDT</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Trạng thái</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {doctors.map((doctor) => {
                return (
                  <tr key={doctor.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                          <span className="material-symbols-outlined text-lg">stethoscope</span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{doctor.displayName}</p>
                          <p className="text-xs text-slate-400">
                            Kinh nghiem: {doctor.experienceYears ?? 0} nam
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{doctor.specialty ?? '-'}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {doctor.serviceIds?.length ?? 0} dịch vụ
                    </td>
                    <td className="px-4 py-3 text-slate-600">{doctor.phone}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          doctor.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {doctor.status === 'ACTIVE' ? 'Hoat dong' : 'Da khoa'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(doctor)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                          <span className="material-symbols-outlined align-middle text-sm">
                            edit
                          </span>
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
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal.mode !== 'closed' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-base font-bold text-slate-900">
              {isCreateMode
                ? 'Thêm bác sĩ mới'
                : isEditMode
                  ? `Cap nhat: ${modal.doctor.displayName}`
                  : ''}
            </h3>

            <div className="mb-4 flex gap-2 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('ACCOUNT')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                  activeTab === 'ACCOUNT' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                Tài khoản
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('PROFILE')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                  activeTab === 'PROFILE' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                Hồ sơ
              </button>
            </div>

            <form onSubmit={isCreateMode ? submitCreate : submitUpdate} className="space-y-4">
              {activeTab === 'ACCOUNT' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">
                      Số điện thoại {isCreateMode ? '*' : ''}
                    </label>
                    <input
                      value={form.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      disabled={!isCreateMode}
                      required={isCreateMode}
                      type="tel"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-slate-100"
                    />
                  </div>

                  {isCreateMode ? (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700">
                        Mật khẩu *
                      </label>
                      <div className="flex gap-2">
                        <input
                          value={form.password}
                          onChange={(e) => updateField('password', e.target.value)}
                          type={showCreatePassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCreatePassword((v) => !v)}
                          className="rounded-lg border border-slate-300 px-2 text-slate-600 hover:bg-slate-50"
                        >
                          <span className="material-symbols-outlined text-sm">
                            {showCreatePassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700">
                        Mật khẩu mới (để trống nếu không đổi)
                      </label>
                      <div className="flex gap-2">
                        <input
                          value={form.newPassword}
                          onChange={(e) => updateField('newPassword', e.target.value)}
                          type={showNewPassword ? 'text' : 'password'}
                          minLength={6}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword((v) => !v)}
                          className="rounded-lg border border-slate-300 px-2 text-slate-600 hover:bg-slate-50"
                        >
                          <span className="material-symbols-outlined text-sm">
                            {showNewPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">
                      Tên bác sĩ *
                    </label>
                    <input
                      value={form.displayName}
                      onChange={(e) => updateField('displayName', e.target.value)}
                      required
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-700">
                      Chuyên khoa
                    </label>
                    <select
                      value={form.specialty}
                      onChange={(e) => updateField('specialty', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">-- Không co --</option>
                      {departments.map((d: DepartmentDto) => (
                        <option key={d.id} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-slate-700">
                      Dịch vụ phụ trách
                    </label>
                    <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3">
                      {visibleServices.map((svc: AdminServiceDto) => (
                        <label
                          key={svc.id}
                          className="flex items-center gap-2 text-sm text-slate-700"
                        >
                          <input
                            type="checkbox"
                            checked={form.serviceIds.includes(svc.id)}
                            onChange={() => toggleService(svc.id)}
                          />
                          <span>{svc.name}</span>
                          {svc.specialtyName && (
                            <span className="text-xs text-slate-400">({svc.specialtyName})</span>
                          )}
                        </label>
                      ))}
                      {visibleServices.length === 0 && (
                        <p className="text-xs text-slate-400">Không có dịch vụ đang hoạt động.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'PROFILE' && (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700">
                        Ho va ten *
                      </label>
                      <input
                        value={form.displayName}
                        onChange={(e) => updateField('displayName', e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700">
                        Số điện thoại
                      </label>
                      <input
                        value={form.phone}
                        disabled
                        className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700">
                        Ngày sinh
                      </label>
                      <input
                        type="date"
                        value={form.dateOfBirth}
                        onChange={(e) => updateField('dateOfBirth', e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700">
                        CCCD / Mã định danh
                      </label>
                      <input
                        value={form.nationalId}
                        onChange={(e) => updateField('nationalId', e.target.value)}
                        placeholder="012345678901"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700">
                        Tổng số năm kinh nghiệm
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={form.experienceYears}
                        onChange={(e) => updateField('experienceYears', e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-700">
                        Chuyên môn / Bằng cấp / Chứng chỉ
                      </label>
                      <input
                        value={form.qualifications}
                        onChange={(e) => updateField('qualifications', e.target.value)}
                        placeholder="VD: Nội khoa, CKI Nội khoa, chứng chỉ siêu âm..."
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-slate-700">
                        Nơi từng công tác (nếu có)
                      </label>
                      <textarea
                        rows={4}
                        value={form.workHistory}
                        onChange={(e) => updateField('workHistory', e.target.value)}
                        placeholder={`- 2018-2021: Bệnh viện A\n- 2021-2024: Phòng khám B`}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-slate-700">
                        Sơ yếu lý lịch tóm tắt
                      </label>
                      <textarea
                        rows={6}
                        value={form.bio}
                        onChange={(e) => updateField('bio', e.target.value)}
                        placeholder={`Tóm tắt cá nhân:\n- ...\nĐịnh hướng chuyên môn:\n- ...\nThành tựu nổi bật:\n- ...`}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {formError && <p className="text-xs text-red-600">{formError}</p>}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Đang xử lý...'
                    : isCreateMode
                      ? 'Tạo tài khoản'
                      : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
