import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { formatDateTimeUtc7, formatDateUtc7 } from '../../../lib/time';
import { adminApi } from '../api';
import type { AdminPatientDto, VisitRecordDto } from '../types';

export function PatientRecordsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

  // Search patients
  const { data: patients = [], isLoading: loadingPatients } = useQuery({
    queryKey: ['admin-patients-records', searchQuery],
    queryFn: () => adminApi.getPatients(searchQuery || undefined),
    staleTime: 30_000,
    enabled: searchQuery.length >= 2,
  });

  // Load patient records when selected
  const { data: patientRecord, isLoading: loadingRecords } = useQuery({
    queryKey: ['admin-patient-records', selectedPatientId],
    queryFn: () => adminApi.getPatientRecords(selectedPatientId!),
    enabled: !!selectedPatientId,
    staleTime: 30_000,
  });

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '—';
    return formatDateUtc7(dateStr);
  }

  function formatDateTime(dateStr: string | null) {
    if (!dateStr) return '—';
    return formatDateTimeUtc7(dateStr);
  }

  function statusBadge(status: string) {
    const colors: Record<string, string> = {
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
    return colors[status] || 'bg-slate-100 text-slate-600';
  }

  function paymentBadge(status: string) {
    if (status === 'PAID') return 'bg-green-100 text-green-700';
    if (status === 'VOID') return 'bg-red-100 text-red-700';
    return 'bg-amber-100 text-amber-700';
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-2xl text-blue-600">folder_shared</span>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Hồ sơ Bệnh nhân</h1>
          <p className="text-xs text-slate-500">Tra cứu hồ sơ, lịch sử y tế, toa thuốc</p>
        </div>
      </div>

      {/* Layout: Left = search + patient list, Right = records */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Panel: Search */}
        <div className="space-y-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">
              search
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm SĐT, tên, CCCD (tối thiểu 2 ký tự)..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-white"
            />
          </div>

          {/* Patient List */}
          {loadingPatients && (
            <div className="text-center text-sm text-slate-400 py-8">Đang tìm...</div>
          )}

          {!loadingPatients && searchQuery.length >= 2 && patients.length === 0 && (
            <div className="text-center text-sm text-slate-400 py-8">Không tìm thấy bệnh nhân</div>
          )}

          {searchQuery.length < 2 && !selectedPatientId && (
            <div className="text-center text-sm text-slate-400 py-8">
              Nhập SĐT, tên hoặc CCCD để tìm kiếm
            </div>
          )}

          <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
            {patients.map((p: AdminPatientDto) => (
              <button
                key={p.id}
                onClick={() => setSelectedPatientId(p.id)}
                className={`w-full text-left rounded-lg border p-3 transition-colors ${
                  selectedPatientId === p.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                }`}
              >
                <div className="font-medium text-sm text-slate-900 dark:text-white">
                  {p.fullName}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  <span className="material-symbols-outlined text-xs mr-1 align-middle">phone</span>
                  {p.phone}
                  {p.nationalId && (
                    <span className="ml-3">
                      <span className="material-symbols-outlined text-xs mr-1 align-middle">
                        badge
                      </span>
                      {p.nationalId}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Panel: Patient Records */}
        <div className="lg:col-span-2">
          {!selectedPatientId && (
            <div className="h-full flex items-center justify-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 min-h-[400px]">
              <div className="text-center">
                <span className="material-symbols-outlined text-5xl text-slate-300">
                  description
                </span>
                <p className="text-sm text-slate-400 mt-2">Chọn bệnh nhân để xem hồ sơ</p>
              </div>
            </div>
          )}

          {selectedPatientId && loadingRecords && (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-sm text-slate-400 mt-2">Đang tải hồ sơ...</p>
              </div>
            </div>
          )}

          {patientRecord && !loadingRecords && (
            <div className="space-y-4">
              {/* Patient Info Card */}
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">
                      person
                    </span>
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 dark:text-white">
                      {patientRecord.fullName}
                    </h2>
                    <p className="text-xs text-slate-500">{patientRecord.phone}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400">CCCD</span>
                    <p className="font-medium text-slate-700 dark:text-slate-300">
                      {patientRecord.nationalId || '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Ngày sinh</span>
                    <p className="font-medium text-slate-700 dark:text-slate-300">
                      {formatDate(patientRecord.dateOfBirth)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Giới tính</span>
                    <p className="font-medium text-slate-700 dark:text-slate-300">
                      {patientRecord.gender || '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Dị ứng</span>
                    <p className="font-medium text-slate-700 dark:text-slate-300">
                      {patientRecord.allergies || 'Không'}
                    </p>
                  </div>
                </div>
                {patientRecord.address && (
                  <div className="mt-2 text-xs">
                    <span className="text-slate-400">Địa chỉ: </span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {patientRecord.address}
                    </span>
                  </div>
                )}
              </div>

              {/* Records Timeline */}
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">history</span>
                  Lịch sử khám ({patientRecord.records.length} lần)
                </h3>

                {patientRecord.records.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-8">
                    Chưa có lịch sử khám bệnh
                  </p>
                )}

                <div className="space-y-3">
                  {patientRecord.records.map((record: VisitRecordDto) => (
                    <div
                      key={record.recordId}
                      className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
                    >
                      {/* Record Header — click to expand */}
                      <button
                        onClick={() =>
                          setExpandedRecord(
                            expandedRecord === record.recordId ? null : record.recordId,
                          )
                        }
                        className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-xs text-slate-500 min-w-[100px]">
                            {formatDateTime(record.visitDate)}
                          </div>
                          <div>
                            <span className="font-medium text-sm text-slate-900 dark:text-white">
                              {record.diagnosis || 'Chưa có chẩn đoán'}
                            </span>
                            <div className="text-xs text-slate-500">
                              BS. {record.doctorName}
                              {record.serviceName && ` · ${record.serviceName}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusBadge(record.bookingStatus)}`}
                          >
                            {record.bookingStatus}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${paymentBadge(record.paymentStatus)}`}
                          >
                            {record.paymentStatus}
                          </span>
                          <span className="material-symbols-outlined text-base text-slate-400">
                            {expandedRecord === record.recordId ? 'expand_less' : 'expand_more'}
                          </span>
                        </div>
                      </button>

                      {/* Expanded Detail */}
                      {expandedRecord === record.recordId && (
                        <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
                          {/* Symptoms / Diagnosis / Conclusion */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase font-medium mb-1">
                                Triệu chứng
                              </p>
                              <p className="text-xs text-slate-700 dark:text-slate-300">
                                {record.symptoms || '—'}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase font-medium mb-1">
                                Chẩn đoán
                              </p>
                              <p className="text-xs text-slate-700 dark:text-slate-300">
                                {record.diagnosis || '—'}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase font-medium mb-1">
                                Kết luận
                              </p>
                              <p className="text-xs text-slate-700 dark:text-slate-300">
                                {record.conclusion || '—'}
                              </p>
                            </div>
                          </div>

                          {record.notes && (
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase font-medium mb-1">
                                Ghi chú
                              </p>
                              <p className="text-xs text-slate-700 dark:text-slate-300">
                                {record.notes}
                              </p>
                            </div>
                          )}

                          {/* Prescription */}
                          {record.prescriptionItems && record.prescriptionItems.length > 0 && (
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase font-medium mb-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">
                                  medication
                                </span>
                                Toa thuốc
                                {record.prescriptionStatus && (
                                  <span
                                    className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${
                                      record.prescriptionStatus === 'PAID'
                                        ? 'bg-green-100 text-green-700'
                                        : record.prescriptionStatus === 'HELD'
                                          ? 'bg-amber-100 text-amber-700'
                                          : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {record.prescriptionStatus}
                                  </span>
                                )}
                              </p>
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-slate-400 text-left">
                                    <th className="py-1 pr-2">Thuốc</th>
                                    <th className="py-1 pr-2">SL</th>
                                    <th className="py-1 pr-2">Liều dùng</th>
                                    <th className="py-1">Ghi chú</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {record.prescriptionItems.map((item, idx) => (
                                    <tr
                                      key={idx}
                                      className="border-t border-slate-100 dark:border-slate-700"
                                    >
                                      <td className="py-1 pr-2 text-slate-700 dark:text-slate-300">
                                        {item.medicationName}
                                      </td>
                                      <td className="py-1 pr-2 text-slate-700 dark:text-slate-300">
                                        {item.qty} {item.unit}
                                      </td>
                                      <td className="py-1 pr-2 text-slate-700 dark:text-slate-300">
                                        {item.dosage || '—'}
                                      </td>
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
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
