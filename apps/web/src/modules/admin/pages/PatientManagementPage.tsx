import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { adminApi } from '../api';
import type { AdminPatientDto } from '../types';

export function PatientManagementPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<AdminPatientDto | null>(null);
  const [resetModal, setResetModal] = useState<AdminPatientDto | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  // ── Queries ──
  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['admin-patients', searchQuery],
    queryFn: () => adminApi.getPatients(searchQuery || undefined),
    staleTime: 30_000,
  });

  // ── Mutations ──
  const resetMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      adminApi.resetPatientPassword(id, password),
    onSuccess: (res) => {
      setResetSuccess(res.message);
      setResetPassword('');
      setResetError('');
      queryClient.invalidateQueries({ queryKey: ['admin-patients'] });
    },
    onError: (e) => setResetError(e instanceof Error ? e.message : 'Lỗi đặt lại mật khẩu'),
  });

  function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resetModal) return;
    setResetError('');
    setResetSuccess('');
    resetMutation.mutate({ id: resetModal.id, password: resetPassword });
  }

  // ── Render ──
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">
            search
          </span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, SĐT, CCCD..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <p className="whitespace-nowrap text-sm text-slate-500">{patients.length} bệnh nhân</p>
      </div>

      <div className="flex gap-4">
        {/* Patient list */}
        <div className="flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {isLoading ? (
            <p className="py-12 text-center text-sm text-slate-400">Đang tải...</p>
          ) : patients.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">Không tìm thấy bệnh nhân</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Bệnh nhân</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">SĐT</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Giới tính</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Tài khoản</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((patient) => (
                  <tr
                    key={patient.id}
                    className={`cursor-pointer hover:bg-slate-50 ${
                      selectedPatient?.id === patient.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedPatient(patient)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{patient.fullName}</p>
                      {patient.nationalId && (
                        <p className="text-xs text-slate-400">CCCD: {patient.nationalId}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{patient.phone}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {patient.gender === 'MALE'
                        ? 'Nam'
                        : patient.gender === 'FEMALE'
                          ? 'Nữ'
                          : (patient.gender ?? '—')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          patient.hasAccount
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {patient.hasAccount ? 'Có TK' : 'Chưa có'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPatient(patient);
                        }}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        <span className="material-symbols-outlined align-middle text-sm">info</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail panel */}
        {selectedPatient && (
          <div className="w-72 flex-shrink-0 rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Chi tiết</h3>
              <button
                onClick={() => setSelectedPatient(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-lg font-bold text-slate-600">
                {selectedPatient.fullName.charAt(0).toUpperCase()}
              </div>
              <p className="text-base font-bold text-slate-900">{selectedPatient.fullName}</p>

              <div className="space-y-1 text-xs">
                <Row label="SĐT" value={selectedPatient.phone} />
                <Row label="CCCD" value={selectedPatient.nationalId} />
                <Row
                  label="Ngày sinh"
                  value={
                    selectedPatient.dateOfBirth
                      ? new Date(selectedPatient.dateOfBirth).toLocaleDateString('vi-VN')
                      : null
                  }
                />
                <Row
                  label="Giới tính"
                  value={
                    selectedPatient.gender === 'MALE'
                      ? 'Nam'
                      : selectedPatient.gender === 'FEMALE'
                        ? 'Nữ'
                        : selectedPatient.gender
                  }
                />
                <Row label="Địa chỉ" value={selectedPatient.address} />
                <Row label="Dị ứng" value={selectedPatient.allergies} />
                <Row label="Tài khoản" value={selectedPatient.hasAccount ? 'Đã có' : 'Chưa có'} />
              </div>

              {selectedPatient.hasAccount && (
                <button
                  onClick={() => {
                    setResetModal(selectedPatient);
                    setResetError('');
                    setResetSuccess('');
                    setResetPassword('');
                  }}
                  className="mt-3 w-full rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-100"
                >
                  <span className="material-symbols-outlined mr-1 align-middle text-sm">key</span>
                  Reset mật khẩu
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reset password modal */}
      {resetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-1 text-base font-bold text-slate-900">Reset mật khẩu</h3>
            <p className="mb-4 text-sm text-slate-500">{resetModal.fullName}</p>

            <form onSubmit={handleResetSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Mật khẩu mới *
                </label>
                <input
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  minLength={6}
                  required
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              {resetError && <p className="text-xs text-red-600">{resetError}</p>}
              {resetSuccess && <p className="text-xs text-green-600">{resetSuccess}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setResetModal(null)}
                  className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={resetMutation.isPending}
                  className="flex-1 rounded-lg bg-amber-500 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
                >
                  {resetMutation.isPending ? 'Đang xử lý...' : 'Xác nhận'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-500">{label}:</span>
      <span className="text-right font-medium text-slate-700">{value ?? '—'}</span>
    </div>
  );
}
