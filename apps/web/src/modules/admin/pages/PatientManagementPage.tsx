import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { adminApi } from '../api';
import type { AdminPatientDto, PatientRecordDto, VisitRecordDto } from '../types';

type PatientTab = 'info' | 'history' | 'prescriptions';

export function PatientManagementPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PatientTab>('info');
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  const [resetModal, setResetModal] = useState<AdminPatientDto | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const { data: patients = [], isLoading: loadingPatients } = useQuery({
    queryKey: ['admin-patients', searchQuery],
    queryFn: () => adminApi.getPatients(searchQuery || undefined),
    staleTime: 30_000,
  });

  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId) ?? null;

  const { data: patientRecord, isLoading: loadingRecords } = useQuery({
    queryKey: ['admin-patient-records', selectedPatientId],
    queryFn: () => adminApi.getPatientRecords(selectedPatientId!),
    enabled: !!selectedPatientId,
    staleTime: 30_000,
  });

  const resetMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      adminApi.resetPatientPassword(id, password),
    onSuccess: (response) => {
      setResetSuccess(response.message);
      setResetPassword('');
      setShowResetPassword(false);
      setResetError('');
      queryClient.invalidateQueries({ queryKey: ['admin-patients'] });
    },
    onError: (error) =>
      setResetError(error instanceof Error ? error.message : 'Loi dat lai mat khau'),
  });

  const historyRecords = patientRecord?.records ?? [];
  const prescriptionRecords = historyRecords.filter(
    (record) => (record.prescriptionItems?.length ?? 0) > 0,
  );

  function handleSelectPatient(patient: AdminPatientDto) {
    setSelectedPatientId(patient.id);
    setActiveTab('info');
    setExpandedRecordId(null);
  }

  function openResetModal() {
    if (!selectedPatient || !selectedPatient.hasAccount) {
      return;
    }

    setResetModal(selectedPatient);
    setResetPassword('');
    setShowResetPassword(false);
    setResetError('');
    setResetSuccess('');
  }

  function handleResetSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!resetModal) {
      return;
    }

    setResetError('');
    setResetSuccess('');
    resetMutation.mutate({ id: resetModal.id, password: resetPassword });
  }

  return (
    <div className="flex h-full min-h-0 gap-4">
      <aside className="w-[360px] shrink-0 rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Danh sach benh nhan</h2>
          <button
            type="button"
            onClick={() => navigate('/admin/reception')}
            className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700"
          >
            Tao ho so moi
          </button>
        </div>

        <div className="relative mb-3">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base text-slate-400">
            search
          </span>
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Tim SDT, ten, CCCD..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <p className="mb-3 text-xs text-slate-500">{patients.length} benh nhan</p>

        <div className="max-h-[calc(100vh-280px)] space-y-2 overflow-y-auto pr-1">
          {loadingPatients && (
            <p className="py-10 text-center text-sm text-slate-400">Dang tai danh sach...</p>
          )}

          {!loadingPatients && patients.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-400">Khong tim thay benh nhan</p>
          )}

          {patients.map((patient) => (
            <button
              key={patient.id}
              type="button"
              onClick={() => handleSelectPatient(patient)}
              className={`w-full rounded-lg border p-3 text-left transition-colors ${
                selectedPatientId === patient.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
              }`}
            >
              <p className="text-sm font-medium text-slate-900">{patient.fullName}</p>
              <p className="mt-1 text-xs text-slate-500">{patient.phone}</p>
              {patient.nationalId && (
                <p className="mt-0.5 text-xs text-slate-400">CCCD: {patient.nationalId}</p>
              )}
            </button>
          ))}
        </div>
      </aside>

      <section className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-4">
        {!selectedPatientId && (
          <div className="flex h-full min-h-[420px] items-center justify-center text-center text-slate-400">
            <div>
              <span className="material-symbols-outlined text-5xl">folder_shared</span>
              <p className="mt-2 text-sm">Chon benh nhan de quan ly ho so kham</p>
            </div>
          </div>
        )}

        {selectedPatientId && (
          <div className="flex h-full min-h-0 flex-col">
            <div className="mb-4 flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h1 className="text-lg font-bold text-slate-900">Quan ly ho so kham</h1>
                <p className="text-sm text-slate-500">
                  {selectedPatient?.fullName ?? patientRecord?.fullName ?? 'Benh nhan'}
                </p>
              </div>
              <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
                {[
                  { key: 'info', label: 'Thong tin' },
                  { key: 'history', label: 'Lich su kham' },
                  { key: 'prescriptions', label: 'Don thuoc cu' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key as PatientTab)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      activeTab === tab.key
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {(loadingRecords || !patientRecord) && (
                <div className="flex h-full min-h-[260px] items-center justify-center text-sm text-slate-400">
                  Dang tai du lieu ho so...
                </div>
              )}

              {!loadingRecords && patientRecord && activeTab === 'info' && (
                <PatientInfoTab
                  patient={selectedPatient}
                  record={patientRecord}
                  onResetPassword={openResetModal}
                />
              )}

              {!loadingRecords && patientRecord && activeTab === 'history' && (
                <VisitHistoryTab
                  records={historyRecords}
                  expandedRecordId={expandedRecordId}
                  onToggleRecord={(recordId) =>
                    setExpandedRecordId((current) => (current === recordId ? null : recordId))
                  }
                />
              )}

              {!loadingRecords && patientRecord && activeTab === 'prescriptions' && (
                <PrescriptionHistoryTab records={prescriptionRecords} />
              )}
            </div>
          </div>
        )}
      </section>

      {resetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-1 text-base font-bold text-slate-900">Reset mat khau</h3>
            <p className="mb-4 text-sm text-slate-500">{resetModal.fullName}</p>

            <form onSubmit={handleResetSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Mat khau moi *
                </label>
                <div className="relative">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    value={resetPassword}
                    onChange={(event) => setResetPassword(event.target.value)}
                    minLength={6}
                    required
                    placeholder="Toi thieu 6 ky tu"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 px-2 text-slate-500 hover:text-slate-700"
                    tabIndex={-1}
                  >
                    <span className="material-symbols-outlined text-base">
                      {showResetPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
              {resetError && <p className="text-xs text-red-600">{resetError}</p>}
              {resetSuccess && <p className="text-xs text-green-600">{resetSuccess}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setResetModal(null);
                    setShowResetPassword(false);
                  }}
                  className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Dong
                </button>
                <button
                  type="submit"
                  disabled={resetMutation.isPending}
                  className="flex-1 rounded-lg bg-amber-500 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
                >
                  {resetMutation.isPending ? 'Dang xu ly...' : 'Xac nhan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function PatientInfoTab({
  patient,
  record,
  onResetPassword,
}: {
  patient: AdminPatientDto | null;
  record: PatientRecordDto;
  onResetPassword: () => void;
}) {
  const genderLabel =
    record.gender === 'MALE' ? 'Nam' : record.gender === 'FEMALE' ? 'Nu' : (record.gender ?? '—');

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-lg font-bold text-slate-600">
            {record.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-base font-semibold text-slate-900">{record.fullName}</p>
            <p className="text-sm text-slate-500">{record.phone}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
          <InfoRow label="CCCD" value={record.nationalId} />
          <InfoRow label="Ngay sinh" value={formatDate(record.dateOfBirth)} />
          <InfoRow label="Gioi tinh" value={genderLabel} />
          <InfoRow label="BHYT" value="Chua cap nhat" />
          <InfoRow label="Di ung" value={record.allergies} />
          <InfoRow label="Dia chi" value={record.address} />
        </div>
      </div>

      {patient?.hasAccount && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <h3 className="text-sm font-semibold text-amber-800">Tai khoan benh nhan</h3>
          <p className="mt-1 text-xs text-amber-700">
            Benh nhan da co tai khoan. Ban co the reset mat khau trong truong hop can ho tro.
          </p>
          <button
            type="button"
            onClick={onResetPassword}
            className="mt-3 rounded-lg bg-amber-500 px-3 py-2 text-xs font-medium text-white hover:bg-amber-600"
          >
            Reset mat khau
          </button>
        </div>
      )}

      {!patient?.hasAccount && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
          Benh nhan nay chua co tai khoan dang nhap.
        </div>
      )}
    </div>
  );
}

function VisitHistoryTab({
  records,
  expandedRecordId,
  onToggleRecord,
}: {
  records: VisitRecordDto[];
  expandedRecordId: string | null;
  onToggleRecord: (recordId: string) => void;
}) {
  if (records.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-400">
        Chua co lich su kham benh
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((record) => {
        const isExpanded = expandedRecordId === record.recordId;

        return (
          <div key={record.recordId} className="overflow-hidden rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => onToggleRecord(record.recordId)}
              className="flex w-full items-center justify-between gap-3 bg-slate-50 px-4 py-3 text-left hover:bg-slate-100"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {record.diagnosis || 'Chua co chan doan'}
                </p>
                <p className="text-xs text-slate-500">
                  {formatDateTime(record.visitDate)} · BS. {record.doctorName}
                  {record.serviceName ? ` · ${record.serviceName}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadge(record.bookingStatus)}`}
                >
                  {record.bookingStatus}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${paymentBadge(record.paymentStatus)}`}
                >
                  {record.paymentStatus}
                </span>
                <span className="material-symbols-outlined text-base text-slate-400">
                  {isExpanded ? 'expand_less' : 'expand_more'}
                </span>
              </div>
            </button>

            {isExpanded && (
              <div className="space-y-3 px-4 py-3">
                <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                  <PanelItem label="Trieu chung" value={record.symptoms} />
                  <PanelItem label="Chan doan" value={record.diagnosis} />
                  <PanelItem label="Ket luan" value={record.conclusion} />
                </div>

                <PanelItem label="Ket qua xet nghiem" value={labResultLabel(record)} />

                {record.notes && <PanelItem label="Ghi chu" value={record.notes} />}

                {record.prescriptionItems && record.prescriptionItems.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Don thuoc
                    </p>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-slate-500">
                          <th className="py-1 pr-2">Thuoc</th>
                          <th className="py-1 pr-2">So luong</th>
                          <th className="py-1 pr-2">Lieu dung</th>
                          <th className="py-1">Ghi chu</th>
                        </tr>
                      </thead>
                      <tbody>
                        {record.prescriptionItems.map((item, index) => (
                          <tr
                            key={`${record.recordId}-${index}`}
                            className="border-t border-slate-100"
                          >
                            <td className="py-1 pr-2 text-slate-700">{item.medicationName}</td>
                            <td className="py-1 pr-2 text-slate-700">
                              {item.qty} {item.unit}
                            </td>
                            <td className="py-1 pr-2 text-slate-700">{item.dosage || '—'}</td>
                            <td className="py-1 text-slate-500">{item.note || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PrescriptionHistoryTab({ records }: { records: VisitRecordDto[] }) {
  if (records.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-400">
        Chua co don thuoc cu de in lai
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((record) => (
        <div key={record.recordId} className="rounded-xl border border-slate-200 p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {record.diagnosis || 'Don thuoc khong co chan doan'}
              </p>
              <p className="text-xs text-slate-500">
                {formatDateTime(record.visitDate)} · BS. {record.doctorName}
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              In lai
            </button>
          </div>

          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-1 pr-2">Thuoc</th>
                <th className="py-1 pr-2">SL</th>
                <th className="py-1 pr-2">Lieu dung</th>
                <th className="py-1">Ghi chu</th>
              </tr>
            </thead>
            <tbody>
              {record.prescriptionItems?.map((item, index) => (
                <tr key={`${record.recordId}-print-${index}`} className="border-t border-slate-100">
                  <td className="py-1 pr-2 text-slate-700">{item.medicationName}</td>
                  <td className="py-1 pr-2 text-slate-700">
                    {item.qty} {item.unit}
                  </td>
                  <td className="py-1 pr-2 text-slate-700">{item.dosage || '—'}</td>
                  <td className="py-1 text-slate-500">{item.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value ?? '—'}</p>
    </div>
  );
}

function PanelItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="text-sm text-slate-700">{value || '—'}</p>
    </div>
  );
}

function formatDate(value: string | null): string {
  if (!value) {
    return '—';
  }
  return new Date(value).toLocaleDateString('vi-VN');
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return '—';
  }
  return new Date(value).toLocaleString('vi-VN');
}

function statusBadge(status: string): string {
  const colorMap: Record<string, string> = {
    COMPLETED: 'bg-green-100 text-green-700',
    IN_CONSULTATION: 'bg-blue-100 text-blue-700',
    PENDING_LAB: 'bg-yellow-100 text-yellow-700',
    RESULTS_READY: 'bg-purple-100 text-purple-700',
    CANCELED: 'bg-red-100 text-red-700',
    NO_SHOW: 'bg-slate-100 text-slate-600',
    BOOKED: 'bg-cyan-100 text-cyan-700',
    CHECKED_IN: 'bg-indigo-100 text-indigo-700',
    WAITING: 'bg-orange-100 text-orange-700',
  };

  return colorMap[status] ?? 'bg-slate-100 text-slate-600';
}

function paymentBadge(status: string): string {
  if (status === 'PAID') {
    return 'bg-green-100 text-green-700';
  }
  if (status === 'VOID') {
    return 'bg-red-100 text-red-700';
  }
  return 'bg-amber-100 text-amber-700';
}

function labResultLabel(record: VisitRecordDto): string {
  if (record.bookingStatus === 'RESULTS_READY' || record.bookingStatus === 'COMPLETED') {
    return 'Da co ket qua';
  }
  if (record.bookingStatus === 'PENDING_LAB') {
    return 'Dang cho ket qua';
  }
  return 'Khong co chi dinh';
}
