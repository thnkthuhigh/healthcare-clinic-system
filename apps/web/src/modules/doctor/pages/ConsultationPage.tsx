import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams, useNavigate } from 'react-router-dom';

import { consultationApi } from '../api';
import type { Patient, MedicalRecord, Medication } from '../types';

type HistoryTab = 'history' | 'lab' | 'vitals';

type ConsultationForm = {
  symptoms: string;
  diagnosis: string;
  conclusion: string;
};

type NewPrescriptionItem = {
  medicationId: string;
  medicationName: string;
  unit: string;
  qty: number;
  dosage: string;
  note: string;
  unitPriceCents: number;
};

const historyIcons: Record<string, { icon: string; color: string }> = {
  'Tim mạch': { icon: 'cardiology', color: 'purple' },
  'Nội tổng quát': { icon: 'coronavirus', color: 'blue' },
  default: { icon: 'check_circle', color: 'green' },
};

export function ConsultationPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<HistoryTab>('history');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [medicalHistory, setMedicalHistory] = useState<MedicalRecord[]>([]);
  const [prescriptionItems, setPrescriptionItems] = useState<NewPrescriptionItem[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medSearch, setMedSearch] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedQty, setNewMedQty] = useState('1');
  const [newMedNote, setNewMedNote] = useState('');
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConsultationForm>({
    defaultValues: {
      symptoms: '',
      diagnosis: '',
      conclusion: '',
    },
  });

  // Fetch patient data and history
  useEffect(() => {
    const fetchData = async () => {
      if (!bookingId) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch booking details to get patient
        const bookingDetails = await consultationApi.getBookingDetails(bookingId);
        setPatient(bookingDetails.patient);

        // Fetch patient history
        const history = await consultationApi.getPatientHistory(bookingDetails.patient.id);
        setMedicalHistory(history || []);
      } catch (err) {
        console.error('Failed to fetch patient data:', err);
        setError('Không thể tải thông tin bệnh nhân');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookingId]);

  // Search medications when query changes
  useEffect(() => {
    const searchMedications = async () => {
      if (!medSearch || medSearch.length < 2) {
        setMedications([]);
        return;
      }

      try {
        const results = await consultationApi.searchMedications(medSearch);
        setMedications(results);
      } catch (err) {
        console.error('Failed to search medications:', err);
      }
    };

    const debounce = setTimeout(searchMedications, 300);
    return () => clearTimeout(debounce);
  }, [medSearch]);

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleSelectMedication = (med: Medication) => {
    setSelectedMed(med);
    setMedSearch(med.name);
    setNewMedDosage(med.defaultDose || '');
    setMedications([]);
  };

  const handleAddMedication = () => {
    if (!selectedMed || !newMedDosage || !newMedQty) {
      setError('Vui lòng chọn thuốc, liều lượng và số lượng');
      return;
    }

    const qty = parseInt(newMedQty, 10);
    if (qty <= 0) {
      setError('Số lượng phải lớn hơn 0');
      return;
    }

    const newItem: NewPrescriptionItem = {
      medicationId: selectedMed.id,
      medicationName: selectedMed.name,
      unit: selectedMed.unit,
      qty,
      dosage: newMedDosage,
      note: newMedNote,
      unitPriceCents: selectedMed.priceCents,
    };

    setPrescriptionItems([...prescriptionItems, newItem]);

    // Reset form
    setMedSearch('');
    setNewMedDosage('');
    setNewMedQty('1');
    setNewMedNote('');
    setSelectedMed(null);
    setError(null);
  };

  const handleRemoveMedication = (index: number) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index));
  };

  const onSaveDraft = async (data: ConsultationForm) => {
    if (!bookingId) return;

    try {
      setSaving(true);
      setError(null);

      await consultationApi.saveMedicalRecord(bookingId, {
        symptoms: data.symptoms,
        diagnosis: data.diagnosis,
        conclusion: data.conclusion,
      });

      setSuccessMessage('Đã lưu bản nháp');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to save draft:', err);
      setError('Không thể lưu bản nháp');
    } finally {
      setSaving(false);
    }
  };

  const onComplete = async (data: ConsultationForm) => {
    if (!bookingId) return;

    // Validate form
    if (!data.symptoms.trim()) {
      setError('Vui lòng nhập triệu chứng');
      return;
    }
    if (!data.diagnosis.trim()) {
      setError('Vui lòng nhập chẩn đoán');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Save medical record
      await consultationApi.saveMedicalRecord(bookingId, {
        symptoms: data.symptoms,
        diagnosis: data.diagnosis,
        conclusion: data.conclusion,
      });

      // Save prescription if any items
      if (prescriptionItems.length > 0) {
        await consultationApi.savePrescription(bookingId, {
          items: prescriptionItems.map((item) => ({
            medicationId: item.medicationId,
            qty: item.qty,
            dosage: item.dosage,
            note: item.note,
          })),
        });
      }

      // Complete consultation
      await consultationApi.completeConsultation(bookingId);

      setSuccessMessage('Hoàn thành khám bệnh! Chuyển bệnh nhân đến thu ngân.');

      // Navigate back to queue after 2 seconds
      setTimeout(() => {
        navigate('/doctor/queue');
      }, 2000);
    } catch (err) {
      console.error('Failed to complete consultation:', err);
      setError('Không thể hoàn thành khám bệnh');
    } finally {
      setSaving(false);
    }
  };

  const handleSendToLab = async () => {
    if (!bookingId) return;

    try {
      setSaving(true);
      setError(null);

      await consultationApi.sendToLab(bookingId);

      setSuccessMessage('Đã gửi bệnh nhân đến khu xét nghiệm.');
      setTimeout(() => {
        setSuccessMessage(null);
        navigate('/doctor/queue');
      }, 1800);
    } catch (err) {
      console.error('Failed to send to lab:', err);
      setError('Không thể gửi bệnh nhân đến xét nghiệm');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">Đang tải thông tin bệnh nhân...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">error</span>
          <p className="text-slate-500 dark:text-slate-400">Không tìm thấy thông tin bệnh nhân</p>
          <Link
            to="/doctor/queue"
            className="mt-4 inline-block px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Quay lại hàng chờ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full min-w-0 bg-background-light dark:bg-background-dark relative">
      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-right">
          <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500 shadow-lg rounded-r-lg p-4 max-w-sm">
            <div className="bg-emerald-500/10 p-2 rounded-full text-emerald-600 dark:text-emerald-400">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
            </div>
            <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
              {successMessage}
            </p>
            <button
              onClick={() => setSuccessMessage(null)}
              className="ml-auto text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-right">
          <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 shadow-lg rounded-r-lg p-4 max-w-sm">
            <div className="bg-red-500/10 p-2 rounded-full text-red-600 dark:text-red-400">
              <span className="material-symbols-outlined text-[20px]">error</span>
            </div>
            <p className="text-sm font-medium text-red-900 dark:text-red-100">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Navigation / Breadcrumbs */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-700 bg-surface-light dark:bg-surface-dark z-10 sticky top-0 flex-shrink-0">
        <div className="flex items-center gap-2 text-sm">
          <Link
            to="/doctor/queue"
            className="flex items-center gap-1 text-slate-500 hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Quay lại hàng chờ
          </Link>
          <span className="material-symbols-outlined text-slate-400 text-[14px]">
            chevron_right
          </span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            Khám bệnh: {patient.fullName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors"
            title="Lịch sử bệnh nhân"
          >
            <span className="material-symbols-outlined text-[20px]">history</span>
          </button>
        </div>
      </header>

      {/* Content Grid */}
      <div className="flex p-4 lg:p-6 flex-col lg:flex-row gap-6 pb-24">
        {/* LEFT COLUMN: Patient Info + History */}
        <div className="w-full lg:w-[380px] xl:w-[420px] flex flex-col gap-6 flex-shrink-0">
          {/* Patient Header Card */}
          <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 flex-shrink-0">
            <div className="flex flex-col gap-4">
              <div className="flex gap-4 items-start">
                <div className="bg-slate-200 dark:bg-slate-700 rounded-xl size-20 shadow-inner flex-shrink-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-slate-400">person</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight truncate">
                    {patient.fullName}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium rounded">
                      {patient.gender === 'Male'
                        ? 'Nam'
                        : patient.gender === 'Female'
                          ? 'Nữ'
                          : patient.gender}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium rounded">
                      {patient.age} tuổi
                    </span>
                  </div>
                  <p className="text-slate-400 dark:text-slate-500 text-xs mt-2 font-mono">
                    ID: #{patient.nationalId || patient.phone}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-1">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                  <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">
                    Cân nặng
                  </p>
                  <p className="text-slate-900 dark:text-white font-semibold">
                    {patient.weightKg ? `${patient.weightKg} kg` : '-'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                  <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">
                    Chiều cao
                  </p>
                  <p className="text-slate-900 dark:text-white font-semibold">
                    {patient.heightCm ? `${patient.heightCm} cm` : '-'}
                  </p>
                </div>
                {patient.allergies && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 col-span-2 flex items-center justify-between">
                    <div>
                      <p className="text-red-400 text-xs uppercase font-bold tracking-wider">
                        Dị ứng
                      </p>
                      <p className="text-red-600 dark:text-red-400 font-semibold text-sm">
                        {patient.allergies}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-red-400">warning</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* History Tabs & Timeline */}
          <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Tabs Header */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 px-2 bg-white dark:bg-surface-dark flex-shrink-0">
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-3 border-b-2 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                  activeTab === 'history'
                    ? 'border-primary text-primary dark:text-primary font-semibold'
                    : 'border-transparent text-slate-500 dark:text-slate-400 font-medium'
                }`}
              >
                Lịch sử khám
              </button>
              <button
                onClick={() => setActiveTab('lab')}
                className={`flex-1 py-3 border-b-2 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                  activeTab === 'lab'
                    ? 'border-primary text-primary dark:text-primary font-semibold'
                    : 'border-transparent text-slate-500 dark:text-slate-400 font-medium'
                }`}
              >
                Xét nghiệm
              </button>
              <button
                onClick={() => setActiveTab('vitals')}
                className={`flex-1 py-3 border-b-2 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                  activeTab === 'vitals'
                    ? 'border-primary text-primary dark:text-primary font-semibold'
                    : 'border-transparent text-slate-500 dark:text-slate-400 font-medium'
                }`}
              >
                Sinh hiệu
              </button>
            </div>

            {/* Timeline Content */}
            <div className="overflow-y-auto flex-1 p-4">
              {activeTab === 'history' && (
                <div className="relative">
                  {medicalHistory.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                      <span className="material-symbols-outlined text-4xl mb-2">history</span>
                      <p>Chưa có lịch sử khám bệnh</p>
                    </div>
                  ) : (
                    medicalHistory.map((record, index) => {
                      const iconConfig =
                        historyIcons[record.serviceName || ''] || historyIcons.default;
                      const colorClasses = {
                        green:
                          'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
                        blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                        purple:
                          'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
                      };

                      return (
                        <div key={record.id} className="flex gap-4 pb-6 group">
                          <div className="flex flex-col items-center">
                            <div
                              className={`size-8 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm z-10 ${
                                iconConfig
                                  ? colorClasses[iconConfig.color as keyof typeof colorClasses]
                                  : colorClasses.green
                              }`}
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                {iconConfig?.icon ?? 'check_circle'}
                              </span>
                            </div>
                            {index < medicalHistory.length - 1 && (
                              <div className="w-0.5 bg-slate-200 dark:bg-slate-700 h-full -my-2"></div>
                            )}
                          </div>
                          <div className="flex-1 pt-1 pb-2">
                            <div className="flex justify-between items-start">
                              <h4 className="text-slate-900 dark:text-white font-semibold text-sm">
                                {record.diagnosis}
                              </h4>
                              <span className="text-slate-400 text-xs whitespace-nowrap">
                                {formatDate(record.createdAt)}
                              </span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                              {record.doctorName} • {record.serviceName}
                            </p>
                            {record.conclusion && (
                              <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700/50 text-xs text-slate-600 dark:text-slate-300">
                                {record.conclusion}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
              {activeTab === 'lab' && (
                <div className="text-center py-10 text-slate-500">
                  <span className="material-symbols-outlined text-4xl mb-2">science</span>
                  <p>Chưa có kết quả xét nghiệm</p>
                </div>
              )}
              {activeTab === 'vitals' && (
                <div className="text-center py-10 text-slate-500">
                  <span className="material-symbols-outlined text-4xl mb-2">monitor_heart</span>
                  <p>Chưa có sinh hiệu</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Active Examination Form */}
        <div className="flex-1 bg-white dark:bg-surface-dark rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col relative">
          {/* Form Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800 z-10">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-slate-900 dark:text-white text-lg font-bold">
                  Phiếu khám bệnh
                </h2>
                <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-bold px-2 py-1 rounded-full border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  Đang khám
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                {new Date().toLocaleDateString('vi-VN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}{' '}
                • {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 lg:p-8 pb-32 overflow-y-auto">
            <form className="flex flex-col gap-8 max-w-4xl mx-auto">
              {/* Diagnosis Section */}
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-primary">
                        stethoscope
                      </span>
                      Triệu chứng <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      {...register('symptoms', {
                        required: 'Vui lòng nhập triệu chứng',
                        minLength: {
                          value: 5,
                          message: 'Triệu chứng phải có ít nhất 5 ký tự',
                        },
                      })}
                      className={`w-full bg-slate-50 dark:bg-slate-900 border rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none h-24 ${
                        errors.symptoms
                          ? 'border-red-500 focus:ring-red-200'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                      placeholder="Mô tả triệu chứng của bệnh nhân..."
                    />
                    {errors.symptoms && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">error</span>
                        {errors.symptoms.message}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-primary">
                        clinical_notes
                      </span>
                      Chẩn đoán <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      {...register('diagnosis', {
                        required: 'Vui lòng nhập chẩn đoán',
                        minLength: {
                          value: 5,
                          message: 'Chẩn đoán phải có ít nhất 5 ký tự',
                        },
                      })}
                      className={`w-full bg-slate-50 dark:bg-slate-900 border rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none h-32 ${
                        errors.diagnosis
                          ? 'border-red-500 focus:ring-red-200'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                      placeholder="Nhập chẩn đoán lâm sàng..."
                    />
                    {errors.diagnosis && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">error</span>
                        {errors.diagnosis.message}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-primary">
                        assignment_turned_in
                      </span>
                      Kết luận / Ghi chú của bác sĩ
                    </label>
                    <textarea
                      {...register('conclusion')}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none h-20"
                      placeholder="Kết luận và các bước tiếp theo..."
                    />
                  </div>
                </div>
              </div>

              {/* Prescription Section */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <span className="bg-primary/10 text-primary p-1 rounded-md">
                      <span className="material-symbols-outlined text-[20px]">prescriptions</span>
                    </span>
                    Đơn thuốc
                  </h3>
                  <button
                    type="button"
                    className="text-primary text-sm font-medium hover:text-primary-dark flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[18px]">print</span>
                    In đơn
                  </button>
                </div>

                {/* Prescription Builder */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                  {/* Prescription Items */}
                  {prescriptionItems.length > 0 && (
                    <div className="flex flex-col gap-3 mb-4">
                      {prescriptionItems.map((item, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-12 gap-4 items-center bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm group hover:border-primary/50 transition-colors"
                        >
                          <div className="col-span-4 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-slate-400 text-[18px]">
                              pill
                            </span>
                            {item.medicationName}
                          </div>
                          <div className="col-span-2 text-sm text-slate-600 dark:text-slate-300">
                            {item.dosage}
                          </div>
                          <div className="col-span-1 text-sm text-slate-500">SL: {item.qty}</div>
                          <div className="col-span-4 text-sm text-slate-500 truncate">
                            {item.note || '-'}
                          </div>
                          <div className="col-span-1 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveMedication(index)}
                              className="text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add New Input */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end bg-slate-100 dark:bg-slate-800 p-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
                    <div className="lg:col-span-4">
                      <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                        Tên thuốc
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-slate-400 text-[18px]">
                          search
                        </span>
                        <input
                          type="text"
                          value={medSearch}
                          onChange={(e) => setMedSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-primary focus:border-primary dark:text-white"
                          placeholder="Tìm thuốc..."
                        />
                        {/* Medication dropdown */}
                        {medications.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                            {medications.map((med) => (
                              <button
                                key={med.id}
                                type="button"
                                onClick={() => handleSelectMedication(med)}
                                className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 text-sm border-b border-slate-100 dark:border-slate-700 last:border-0"
                              >
                                <div className="font-medium text-slate-900 dark:text-white">
                                  {med.name}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {med.usage} • {med.defaultDose} • Còn {med.availableStock}{' '}
                                  {med.unit}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="lg:col-span-2">
                      <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                        Liều lượng
                      </label>
                      <input
                        type="text"
                        value={newMedDosage}
                        onChange={(e) => setNewMedDosage(e.target.value)}
                        className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-primary focus:border-primary dark:text-white"
                        placeholder="VD: 10mg/ngày"
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                        Số lượng
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newMedQty}
                        onChange={(e) => setNewMedQty(e.target.value)}
                        className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-primary focus:border-primary dark:text-white"
                      />
                    </div>
                    <div className="lg:col-span-4">
                      <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                        Ghi chú
                      </label>
                      <input
                        type="text"
                        value={newMedNote}
                        onChange={(e) => setNewMedNote(e.target.value)}
                        className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-primary focus:border-primary dark:text-white"
                        placeholder="Hướng dẫn sử dụng"
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <button
                        type="button"
                        onClick={handleAddMedication}
                        disabled={!selectedMed}
                        className="w-full h-[38px] flex items-center justify-center bg-primary hover:bg-primary-dark text-white rounded transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Sticky Footer Action Bar */}
      <div className="sticky bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 lg:px-8 lg:py-4 flex items-center justify-between z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <Link
          to="/doctor/queue"
          className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          Hủy
        </Link>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSendToLab}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-primary/10 text-primary dark:text-primary font-semibold text-sm hover:bg-primary/20 transition-colors border border-transparent disabled:opacity-50"
          >
            Gửi xét nghiệm
          </button>
          <button
            type="button"
            onClick={handleSubmit(onSaveDraft)}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : 'Lưu nháp'}
          </button>
          <button
            type="button"
            onClick={handleSubmit(onComplete)}
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-all shadow-md shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[20px]">save</span>
            {saving ? 'Đang xử lý...' : 'Lưu & Hoàn thành'}
          </button>
        </div>
      </div>
    </div>
  );
}
