import { useState, useEffect, useCallback } from 'react';

import { formatDateUtc7 } from '../../../lib/time';
import { doctorApi, consultationApi } from '../api';
import type { Patient, MedicalRecord } from '../types';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const avatarColors = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-400',
  'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-400',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400',
  'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-400',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-400',
];

export function DoctorPatientsPage() {
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientHistory, setPatientHistory] = useState<MedicalRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 1) {
      setPatients([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const results = await doctorApi.searchPatients(q);
      setPatients(results);
    } catch {
      setError('Không thể tìm kiếm bệnh nhân');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 350);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  const handleSelectPatient = async (patient: Patient) => {
    setSelectedPatient(patient);
    setHistoryLoading(true);
    setPatientHistory([]);
    try {
      const history = await consultationApi.getPatientHistory(patient.id);
      setPatientHistory(history || []);
    } catch {
      setPatientHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const formatDate = (iso: string) =>
    formatDateUtc7(iso, { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div
      className="h-full overflow-hidden flex flex-col bg-slate-50 dark:bg-background-dark"
      data-testid="doctor-patients-page"
    >
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-5 gap-0">
        {/* LEFT - Search Panel */}
        <div className="lg:col-span-2 flex flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              Hồ sơ bệnh nhân
            </h1>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                search
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Tìm theo tên, SĐT, CMND..."
                autoFocus
                data-testid="doctor-patients-search"
              />
              {loading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {error && (
              <div className="p-4 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 m-3 rounded-lg">
                {error}
              </div>
            )}

            {!loading && query.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-3">
                  manage_search
                </span>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Nhập tên, số điện thoại hoặc CMND để tìm bệnh nhân
                </p>
              </div>
            )}

            {!loading && query.length > 0 && patients.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-3">
                  person_search
                </span>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Không tìm thấy bệnh nhân
                </p>
              </div>
            )}

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {patients.map((p, idx) => {
                const isSelected = selectedPatient?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPatient(p)}
                    className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors ${
                      isSelected
                        ? 'bg-primary/5 dark:bg-primary/10 border-l-2 border-primary'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarColors[idx % avatarColors.length]}`}
                    >
                      {getInitials(p.fullName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-100 truncate text-sm">
                        {p.fullName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {p.phone}
                      </p>
                    </div>
                    {p.age != null && (
                      <span className="text-xs text-slate-400 flex-shrink-0">{p.age} tuổi</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT - Patient Detail */}
        <div className="lg:col-span-3 flex flex-col overflow-y-auto">
          {!selectedPatient ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-12">
              <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">
                person
              </span>
              <h2 className="text-lg font-semibold text-slate-500 dark:text-slate-400">
                Chọn bệnh nhân để xem hồ sơ
              </h2>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Patient Header */}
              <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-start gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-3xl">person</span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {selectedPatient.fullName}
                    </h2>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedPatient.gender && (
                        <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
                          {selectedPatient.gender === 'Male'
                            ? 'Nam'
                            : selectedPatient.gender === 'Female'
                              ? 'Nữ'
                              : selectedPatient.gender}
                        </span>
                      )}
                      {selectedPatient.age != null && (
                        <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
                          {selectedPatient.age} tuổi
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div>
                        <p className="text-xs text-slate-400 uppercase font-semibold tracking-wide">
                          Số điện thoại
                        </p>
                        <p className="text-sm text-slate-700 dark:text-slate-200 font-medium mt-0.5">
                          {selectedPatient.phone}
                        </p>
                      </div>
                      {selectedPatient.nationalId && (
                        <div>
                          <p className="text-xs text-slate-400 uppercase font-semibold tracking-wide">
                            CMND
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-200 font-medium mt-0.5">
                            {selectedPatient.nationalId}
                          </p>
                        </div>
                      )}
                      {selectedPatient.weightKg && (
                        <div>
                          <p className="text-xs text-slate-400 uppercase font-semibold tracking-wide">
                            Cân nặng
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-200 font-medium mt-0.5">
                            {selectedPatient.weightKg} kg
                          </p>
                        </div>
                      )}
                      {selectedPatient.heightCm && (
                        <div>
                          <p className="text-xs text-slate-400 uppercase font-semibold tracking-wide">
                            Chiều cao
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-200 font-medium mt-0.5">
                            {selectedPatient.heightCm} cm
                          </p>
                        </div>
                      )}
                      {selectedPatient.address && (
                        <div className="col-span-2">
                          <p className="text-xs text-slate-400 uppercase font-semibold tracking-wide">
                            Địa chỉ
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-200 mt-0.5">
                            {selectedPatient.address}
                          </p>
                        </div>
                      )}
                    </div>
                    {selectedPatient.allergies && (
                      <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-lg flex items-center gap-2">
                        <span className="material-symbols-outlined text-red-500 text-[18px]">
                          warning
                        </span>
                        <div>
                          <p className="text-xs font-bold text-red-500 uppercase tracking-wide">
                            Dị ứng
                          </p>
                          <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                            {selectedPatient.allergies}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Medical History */}
              <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">
                      history
                    </span>
                    Lịch sử khám bệnh
                  </h3>
                  <span className="text-xs text-slate-400">{patientHistory.length} lần khám</span>
                </div>

                <div className="p-4">
                  {historyLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : patientHistory.length === 0 ? (
                    <div className="text-center py-10">
                      <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">
                        history
                      </span>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                        Chưa có lịch sử khám bệnh
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {patientHistory.map((record, idx) => (
                        <div key={record.id} className="relative flex gap-4 pb-4">
                          {idx < patientHistory.length - 1 && (
                            <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
                          )}
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 z-10">
                            <span className="material-symbols-outlined text-primary text-[16px]">
                              stethoscope
                            </span>
                          </div>
                          <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-slate-800 dark:text-white text-sm">
                                {record.diagnosis}
                              </h4>
                              <span className="text-xs text-slate-400 flex-shrink-0 ml-2">
                                {formatDate(record.createdAt)}
                              </span>
                            </div>
                            {record.doctorName && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                                BS. {record.doctorName}{' '}
                                {record.serviceName ? `· ${record.serviceName}` : ''}
                              </p>
                            )}
                            {record.symptoms && (
                              <div className="mb-1.5">
                                <span className="text-xs font-semibold text-slate-400 uppercase">
                                  Triệu chứng:{' '}
                                </span>
                                <span className="text-xs text-slate-600 dark:text-slate-300">
                                  {record.symptoms}
                                </span>
                              </div>
                            )}
                            {record.conclusion && (
                              <div className="mt-2 p-2 bg-white dark:bg-slate-800 rounded-lg text-xs text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                                {record.conclusion}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
