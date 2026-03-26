import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { OpsPageHeader } from '../../../components/ClinicUI';
import { formatDateUtc7, formatTimeUtc7, toIsoDateUtc7 } from '../../../lib/time';
import { consultationApi } from '../api';
import type {
  FollowUpBooking,
  MedicalRecord,
  Medication,
  Patient,
  PrescriptionTemplate,
  SaveMedicalRecordRequest,
} from '../types';

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

type LabResultEntry = {
  key: string;
  recordedAtLabel: string;
  resultSummary: string;
  impression: string | null;
  doctorName: string;
  serviceName: string | null;
  createdAt: string;
};

const defaultHistoryIcon = { icon: 'check_circle', tone: 'emerald' } as const;
const historyIcons: Record<string, { icon: string; tone: string }> = {
  'Tim mạch': { icon: 'cardiology', tone: 'purple' },
  'Nội tổng quát': { icon: 'stethoscope', tone: 'blue' },
};

function formatDate(isoString: string) {
  return formatDateUtc7(isoString, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function followUpShiftLabel(type: string) {
  return type === 'MORNING' ? 'Ca sáng' : type === 'AFTERNOON' ? 'Ca chiều' : type;
}

function getGenderLabel(gender: string | null) {
  if (gender === 'Male') return 'Nam';
  if (gender === 'Female') return 'Nữ';
  return gender ?? 'Chưa cập nhật';
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getHistoryIcon(record: MedicalRecord): { icon: string; tone: string } {
  const resolved = historyIcons[record.serviceName || ''];
  return resolved ?? defaultHistoryIcon;
}

function getHistoryToneClass(tone: string) {
  if (tone === 'purple') return 'bg-purple-50 text-purple-700 border-purple-200';
  if (tone === 'blue') return 'bg-blue-50 text-blue-700 border-blue-200';
  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
}

const LAB_SECTION_PATTERN =
  /\[(?:Xet nghiem|Xét nghiệm)\s+([^\]]+)\]\s*([\s\S]*?)(?=\n{2}\[(?:Xet nghiem|Xét nghiệm)\s+|\s*$)/g;

function normalizeForCompare(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function stripLabelPrefix(line: string) {
  const idx = line.indexOf(':');
  if (idx === -1) return line.trim();
  return line.slice(idx + 1).trim();
}

function extractLabEntries(record: MedicalRecord): LabResultEntry[] {
  if (!record.notes) {
    return [];
  }

  const notes = record.notes.replace(/\r\n/g, '\n');
  const matches = Array.from(notes.matchAll(LAB_SECTION_PATTERN));

  return matches
    .map((match, index) => {
      const recordedAtLabel = (match[1] || '').trim() || formatDate(record.createdAt);
      const body = (match[2] || '').trim();
      const lines = body
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      let resultSummary = '';
      let impression = '';

      lines.forEach((line) => {
        const normalized = normalizeForCompare(line);
        if (!resultSummary && normalized.startsWith('ket qua')) {
          resultSummary = stripLabelPrefix(line);
          return;
        }
        if (!impression && normalized.startsWith('nhan dinh')) {
          impression = stripLabelPrefix(line);
        }
      });

      if (!resultSummary) {
        resultSummary = body;
      }

      return {
        key: `${record.id}-${index}`,
        recordedAtLabel,
        resultSummary,
        impression: impression || null,
        doctorName: record.doctorName,
        serviceName: record.serviceName,
        createdAt: record.createdAt,
      } satisfies LabResultEntry;
    })
    .filter((entry) => entry.resultSummary.trim().length > 0);
}

export function ConsultationPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<HistoryTab>('history');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [medicalHistory, setMedicalHistory] = useState<MedicalRecord[]>([]);
  const [prescriptionItems, setPrescriptionItems] = useState<NewPrescriptionItem[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medicationCatalog, setMedicationCatalog] = useState<Medication[]>([]);
  const [prescriptionTemplates, setPrescriptionTemplates] = useState<PrescriptionTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [medSearch, setMedSearch] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedQty, setNewMedQty] = useState('1');
  const [newMedNote, setNewMedNote] = useState('');
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);
  const [weightInput, setWeightInput] = useState('');
  const [heightInput, setHeightInput] = useState('');
  const [isMedicationDropdownOpen, setIsMedicationDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showSendToLabConfirm, setShowSendToLabConfirm] = useState(false);
  const [labTransferToast, setLabTransferToast] = useState<string | null>(null);
  const [followUpDate, setFollowUpDate] = useState(() => toIsoDateUtc7());
  const [followUpNote, setFollowUpNote] = useState('');
  const [schedulingFollowUp, setSchedulingFollowUp] = useState(false);
  const [followUpResult, setFollowUpResult] = useState<FollowUpBooking | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<ConsultationForm>({
    defaultValues: {
      symptoms: '',
      diagnosis: '',
      conclusion: '',
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!bookingId) return;

      try {
        setLoading(true);
        setError(null);

        const bookingDetails = await consultationApi.getBookingDetails(bookingId);
        setPatient(bookingDetails.patient);
        setWeightInput(
          bookingDetails.patient.weightKg !== null ? String(bookingDetails.patient.weightKg) : '',
        );
        setHeightInput(
          bookingDetails.patient.heightCm !== null ? String(bookingDetails.patient.heightCm) : '',
        );

        const [historyResult, templatesResult, catalogResult] = await Promise.allSettled([
          consultationApi.getPatientHistory(bookingDetails.patient.id),
          consultationApi.getPrescriptionTemplates(),
          consultationApi.searchMedications(),
        ]);

        if (historyResult.status === 'fulfilled') {
          const history = historyResult.value || [];
          const currentRecord = bookingDetails.medicalRecord;
          const mergedHistory =
            currentRecord && !history.some((record) => record.id === currentRecord.id)
              ? [currentRecord, ...history]
              : history;
          setMedicalHistory(mergedHistory);
        } else {
          console.error('Failed to fetch patient history:', historyResult.reason);
          setMedicalHistory(bookingDetails.medicalRecord ? [bookingDetails.medicalRecord] : []);
        }

        if (templatesResult.status === 'fulfilled') {
          setPrescriptionTemplates(templatesResult.value || []);
        } else {
          console.error('Failed to fetch prescription templates:', templatesResult.reason);
          setPrescriptionTemplates([]);
        }

        if (catalogResult.status === 'fulfilled') {
          setMedicationCatalog((catalogResult.value || []).slice(0, 24));
        } else {
          console.error('Failed to fetch medication catalog:', catalogResult.reason);
          setMedicationCatalog([]);
        }

        if (bookingDetails.medicalRecord) {
          setValue('symptoms', bookingDetails.medicalRecord.symptoms ?? '');
          setValue('diagnosis', bookingDetails.medicalRecord.diagnosis ?? '');
          setValue('conclusion', bookingDetails.medicalRecord.conclusion ?? '');
        }

        if (bookingDetails.prescription?.items?.length) {
          setPrescriptionItems(
            bookingDetails.prescription.items.map((item) => ({
              medicationId: item.medicationId,
              medicationName: item.medicationName,
              unit: item.unit,
              qty: item.qty,
              dosage: item.dosage ?? '',
              note: item.note ?? '',
              unitPriceCents: item.unitPriceCents,
            })),
          );
        }
      } catch (fetchError) {
        console.error('Failed to fetch patient data:', fetchError);
        setError('Không thể tải thông tin bệnh nhân.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookingId, setValue]);

  useEffect(() => {
    const searchMedications = async () => {
      const keyword = medSearch.trim();
      if (keyword.length < 1) {
        setMedications([]);
        return;
      }

      try {
        const results = await consultationApi.searchMedications(keyword);
        setMedications(results);
      } catch (searchError) {
        console.error('Failed to search medications:', searchError);
      }
    };

    const debounce = setTimeout(searchMedications, 300);
    return () => clearTimeout(debounce);
  }, [medSearch]);

  useEffect(() => {
    if (!labTransferToast) return;
    const timer = setTimeout(() => setLabTransferToast(null), 2600);
    return () => clearTimeout(timer);
  }, [labTransferToast]);

  const medicationSuggestions = useMemo(() => {
    const keyword = medSearch.trim();
    const source =
      keyword.length === 0
        ? medicationCatalog
        : medications.length > 0
          ? medications
          : medicationCatalog.filter((med) =>
              med.name.toLowerCase().includes(keyword.toLowerCase()),
            );

    const sorted = [...source].sort((left, right) => {
      if (!keyword) {
        return left.name.localeCompare(right.name);
      }
      const leftStartsWith = left.name.toLowerCase().startsWith(keyword.toLowerCase());
      const rightStartsWith = right.name.toLowerCase().startsWith(keyword.toLowerCase());
      if (leftStartsWith !== rightStartsWith) {
        return leftStartsWith ? -1 : 1;
      }
      return left.name.localeCompare(right.name);
    });

    return sorted.slice(0, 16);
  }, [medSearch, medications, medicationCatalog]);

  const labResults = useMemo(() => {
    return medicalHistory
      .flatMap((record) => extractLabEntries(record))
      .sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      );
  }, [medicalHistory]);

  const totalPrescriptionCost = useMemo(
    () => prescriptionItems.reduce((sum, item) => sum + item.unitPriceCents * item.qty, 0),
    [prescriptionItems],
  );

  const handleSelectMedication = (med: Medication) => {
    setSelectedMed(med);
    setMedSearch(med.name);
    setNewMedDosage(med.defaultDose || '');
    setMedications([]);
    setIsMedicationDropdownOpen(false);
  };

  const pushPrescriptionItem = (item: NewPrescriptionItem) => {
    setPrescriptionItems((prev) => {
      const existingIndex = prev.findIndex((entry) => entry.medicationId === item.medicationId);
      if (existingIndex === -1) return [...prev, item];

      return prev.map((entry, index) =>
        index === existingIndex
          ? {
              ...entry,
              qty: entry.qty + item.qty,
              dosage: item.dosage || entry.dosage,
              note: item.note || entry.note,
            }
          : entry,
      );
    });
  };

  const handleAddMedication = () => {
    if (!selectedMed || !newMedDosage || !newMedQty) {
      setError('Vui lòng chọn thuốc, liều lượng và số lượng.');
      return;
    }

    const qty = parseInt(newMedQty, 10);
    if (qty <= 0) {
      setError('Số lượng phải lớn hơn 0.');
      return;
    }

    pushPrescriptionItem({
      medicationId: selectedMed.id,
      medicationName: selectedMed.name,
      unit: selectedMed.unit,
      qty,
      dosage: newMedDosage,
      note: newMedNote,
      unitPriceCents: selectedMed.priceCents,
    });

    setMedSearch('');
    setNewMedDosage('');
    setNewMedQty('1');
    setNewMedNote('');
    setSelectedMed(null);
    setError(null);
  };

  const handleApplyTemplate = () => {
    if (!selectedTemplateId) {
      setError('Vui lòng chọn toa mẫu.');
      return;
    }

    const template = prescriptionTemplates.find((item) => item.id === selectedTemplateId);
    if (!template) {
      setError('Không tìm thấy toa mẫu đã chọn.');
      return;
    }

    template.items.forEach((item) => {
      pushPrescriptionItem({
        medicationId: item.medicationId,
        medicationName: item.medicationName,
        unit: item.unit,
        qty: item.qty,
        dosage: item.dosage ?? '',
        note: item.note ?? '',
        unitPriceCents: item.priceCents,
      });
    });

    setError(null);
    setSuccessMessage(`Đã áp dụng toa mẫu: ${template.name}`);
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  const handlePickFromCatalog = (med: Medication) => {
    setSelectedMed(med);
    setMedSearch(med.name);
    setNewMedDosage(med.defaultDose || '');
    setNewMedQty('1');
    setNewMedNote('');
    setMedications([]);
    setIsMedicationDropdownOpen(false);
    setError(null);
  };

  const handleRemoveMedication = (index: number) => {
    setPrescriptionItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const buildMedicalRecordPayload = (data: ConsultationForm): SaveMedicalRecordRequest | null => {
    const payload: SaveMedicalRecordRequest = {
      symptoms: data.symptoms,
      diagnosis: data.diagnosis,
      conclusion: data.conclusion,
    };

    const normalizeDecimal = (raw: string) => raw.trim().replace(',', '.');

    const parsedWeight = normalizeDecimal(weightInput);
    if (parsedWeight) {
      const weightValue = Number(parsedWeight);
      if (!Number.isFinite(weightValue) || weightValue <= 0) {
        setError('Cân nặng phải là số lớn hơn 0.');
        return null;
      }
      payload.weightKg = Number(weightValue.toFixed(2));
    }

    const parsedHeight = normalizeDecimal(heightInput);
    if (parsedHeight) {
      const heightValue = Number(parsedHeight);
      if (!Number.isFinite(heightValue) || heightValue <= 0) {
        setError('Chiều cao phải là số lớn hơn 0.');
        return null;
      }
      payload.heightCm = Number(heightValue.toFixed(2));
    }

    return payload;
  };

  const syncPatientVitals = (payload: SaveMedicalRecordRequest) => {
    setPatient((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        weightKg: payload.weightKg ?? prev.weightKg,
        heightCm: payload.heightCm ?? prev.heightCm,
      };
    });
  };

  const onSaveDraft = async (data: ConsultationForm) => {
    if (!bookingId) return;

    try {
      setSaving(true);
      setError(null);

      const payload = buildMedicalRecordPayload(data);
      if (!payload) return;

      await consultationApi.saveMedicalRecord(bookingId, payload);
      syncPatientVitals(payload);

      setSuccessMessage('Đã lưu bản nháp phiếu khám.');
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (saveError) {
      console.error('Failed to save draft:', saveError);
      setError('Không thể lưu bản nháp.');
    } finally {
      setSaving(false);
    }
  };

  const onComplete = async (data: ConsultationForm) => {
    if (!bookingId) return;

    if (!data.symptoms.trim()) {
      setError('Vui lòng nhập triệu chứng.');
      return;
    }
    if (!data.diagnosis.trim()) {
      setError('Vui lòng nhập chẩn đoán.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = buildMedicalRecordPayload(data);
      if (!payload) return;

      await consultationApi.saveMedicalRecord(bookingId, payload);
      syncPatientVitals(payload);

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

      await consultationApi.completeConsultation(bookingId);
      setSuccessMessage('Hoàn thành khám bệnh, đang chuyển về hàng chờ.');

      setTimeout(() => navigate('/doctor/queue'), 1500);
    } catch (completeError) {
      console.error('Failed to complete consultation:', completeError);
      setError('Không thể hoàn thành khám bệnh.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendToLab = async () => {
    if (!bookingId) return;

    try {
      setSaving(true);
      setError(null);

      const formSnapshot = getValues();
      const payload = buildMedicalRecordPayload(formSnapshot);
      if (!payload) return;

      await consultationApi.saveMedicalRecord(bookingId, payload);
      syncPatientVitals(payload);

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

      await consultationApi.sendToLab(bookingId);
      setShowSendToLabConfirm(false);
      setSuccessMessage('Đã gửi bệnh nhân sang khu xét nghiệm và lưu dữ liệu phiên khám.');
      setLabTransferToast('Đã chuyển bệnh nhân qua xét nghiệm.');
    } catch (sendError) {
      console.error('Failed to send to lab:', sendError);
      const resolvedMessage =
        sendError instanceof Error && sendError.message.trim()
          ? sendError.message
          : 'Không thể gửi bệnh nhân đến xét nghiệm.';
      setError(resolvedMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenSendToLabConfirm = () => {
    if (saving || !bookingId) return;
    setError(null);
    setShowSendToLabConfirm(true);
  };

  const handleScheduleFollowUp = async () => {
    if (!bookingId) return;
    if (!followUpDate) {
      setError('Vui lòng chọn ngày tái khám.');
      return;
    }

    try {
      setSchedulingFollowUp(true);
      setError(null);

      const formSnapshot = getValues();
      const payload = buildMedicalRecordPayload(formSnapshot);
      if (!payload) return;

      await consultationApi.saveMedicalRecord(bookingId, payload);
      syncPatientVitals(payload);

      const result = await consultationApi.scheduleFollowUp(bookingId, {
        followUpDate,
        ...(followUpNote.trim() ? { note: followUpNote.trim() } : {}),
      });

      setFollowUpResult(result);
      setSuccessMessage(
        `Đã hẹn tái khám ngày ${formatDateUtc7(result.date, {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })} - ${followUpShiftLabel(result.shiftType)} (${result.timeRange}).`,
      );
    } catch (scheduleError) {
      console.error('Failed to schedule follow-up:', scheduleError);
      setError(
        scheduleError instanceof Error && scheduleError.message
          ? scheduleError.message
          : 'Không thể hẹn tái khám lúc này.',
      );
    } finally {
      setSchedulingFollowUp(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#f4f7fa]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <p className="text-sm text-slate-500">Đang tải thông tin bệnh nhân...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#f4f7fa] px-4">
        <div className="ops-panel max-w-md text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300">error</span>
          <h2 className="mt-3 text-xl font-bold text-slate-900">
            Không tìm thấy thông tin bệnh nhân
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Phiên khám có thể đã thay đổi trạng thái hoặc mã lịch hẹn không còn hợp lệ.
          </p>
          <Link to="/doctor/queue" className="btn-primary mt-5 px-4 py-2.5">
            Quay lại hàng chờ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#f4f7fa] pb-28">
      <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
        <OpsPageHeader
          eyebrow="Khám bệnh"
          title={`Hồ sơ khám: ${patient.fullName}`}
          description={`SĐT ${patient.phone} • ${patient.age ?? '--'} tuổi • ${getGenderLabel(patient.gender)}`}
          actions={
            <Link to="/doctor/queue" className="btn-secondary px-4 py-2.5">
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>Quay lại hàng chờ</span>
            </Link>
          }
        />

        {successMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>{successMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="rounded-lg p-1 hover:bg-emerald-100"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="surface-alert">
            <div className="flex items-start justify-between gap-3">
              <p>{error}</p>
              <button
                type="button"
                onClick={() => setError(null)}
                className="rounded-lg p-1 hover:bg-red-100"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>
        )}

        <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <section className="ops-panel p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-lg font-bold text-slate-700">
                  {getInitials(patient.fullName)}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold text-slate-900">{patient.fullName}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Mã định danh: {patient.nationalId || patient.phone}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <InfoTile label="Giới tính" value={getGenderLabel(patient.gender)} />
                <InfoTile label="Tuổi" value={`${patient.age ?? '--'} tuổi`} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <label className="text-xs uppercase tracking-[0.14em] text-slate-400">
                    Cân nặng (kg)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={weightInput}
                    onChange={(event) => setWeightInput(event.target.value)}
                    placeholder="Ví dụ: 52.5"
                    className="input-field mt-2 h-[40px] bg-white"
                  />
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <label className="text-xs uppercase tracking-[0.14em] text-slate-400">
                    Chiều cao (cm)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={heightInput}
                    onChange={(event) => setHeightInput(event.target.value)}
                    placeholder="Ví dụ: 160"
                    className="input-field mt-2 h-[40px] bg-white"
                  />
                </div>
              </div>

              {patient.allergies && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-500">
                    Dị ứng
                  </p>
                  <p className="mt-1 font-semibold">{patient.allergies}</p>
                </div>
              )}
            </section>

            <section className="ops-panel overflow-hidden p-0">
              <div className="border-b border-slate-200 px-3 pt-3">
                <div className="grid grid-cols-3 gap-2">
                  <TabButton
                    active={activeTab === 'history'}
                    onClick={() => setActiveTab('history')}
                    label="Lịch sử"
                  />
                  <TabButton
                    active={activeTab === 'lab'}
                    onClick={() => setActiveTab('lab')}
                    label="Xét nghiệm"
                  />
                  <TabButton
                    active={activeTab === 'vitals'}
                    onClick={() => setActiveTab('vitals')}
                    label="Sinh hiệu"
                  />
                </div>
              </div>

              <div className="max-h-[560px] overflow-y-auto p-4">
                {activeTab === 'history' && (
                  <>
                    {medicalHistory.length === 0 ? (
                      <EmptyState icon="history" title="Chưa có lịch sử khám" />
                    ) : (
                      <div className="space-y-3">
                        {medicalHistory.map((record) => {
                          const icon = getHistoryIcon(record);
                          return (
                            <article
                              key={record.id}
                              className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-slate-900">
                                    {record.diagnosis || 'Chưa có chẩn đoán'}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {record.doctorName} • {record.serviceName || 'Dịch vụ khám'}
                                  </p>
                                </div>
                                <span
                                  className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[18px] ${getHistoryToneClass(icon.tone)}`}
                                >
                                  <span className="material-symbols-outlined text-[16px]">
                                    {icon.icon}
                                  </span>
                                </span>
                              </div>
                              <p className="mt-2 text-xs text-slate-500">
                                {formatDate(record.createdAt)}
                              </p>
                              {record.conclusion && (
                                <p className="mt-2 rounded-xl bg-white p-2 text-xs leading-5 text-slate-600">
                                  {record.conclusion}
                                </p>
                              )}
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'lab' &&
                  (labResults.length === 0 ? (
                    <EmptyState icon="science" title="Chưa có kết quả xét nghiệm" />
                  ) : (
                    <div className="space-y-3">
                      {labResults.map((entry) => (
                        <article
                          key={entry.key}
                          className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-900">
                              Kết quả xét nghiệm
                            </p>
                            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-cyan-700">
                              {entry.recordedAtLabel}
                            </span>
                          </div>
                          <p className="mt-2 rounded-xl bg-white p-2 text-sm text-slate-700">
                            {entry.resultSummary}
                          </p>
                          {entry.impression && (
                            <p className="mt-2 text-xs leading-5 text-slate-600">
                              Nhận định: {entry.impression}
                            </p>
                          )}
                          <p className="mt-2 text-xs text-slate-500">
                            {entry.doctorName}
                            {entry.serviceName ? ` • ${entry.serviceName}` : ''}
                          </p>
                        </article>
                      ))}
                    </div>
                  ))}
                {activeTab === 'vitals' && (
                  <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Cập nhật sinh hiệu
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="field-label text-xs">Cân nặng (kg)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={weightInput}
                          onChange={(event) => setWeightInput(event.target.value)}
                          placeholder="Ví dụ: 52.5"
                          className="input-field bg-white"
                          data-testid="doctor-consultation-vitals-weight-input"
                        />
                      </div>
                      <div>
                        <label className="field-label text-xs">Chiều cao (cm)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={heightInput}
                          onChange={(event) => setHeightInput(event.target.value)}
                          placeholder="Ví dụ: 160"
                          className="input-field bg-white"
                          data-testid="doctor-consultation-vitals-height-input"
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        Nhập sinh hiệu tại đây rồi bấm <strong>Lưu nháp</strong> hoặc{' '}
                        <strong>Lưu và hoàn thành</strong> để ghi vào hồ sơ.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </aside>

          <section className="ops-panel overflow-visible p-0">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="ops-section-label">Phiếu khám đang xử lý</p>
                  <h2 className="mt-2 text-xl font-bold text-slate-900">Khám lâm sàng và kê đơn</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatDateUtc7(new Date())} •{' '}
                    {formatTimeUtc7(new Date(), { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500"></span>
                  Đang khám
                </span>
              </div>
            </div>

            <form
              className="space-y-8 px-6 py-6 md:px-8"
              onSubmit={(event) => event.preventDefault()}
            >
              <section className="space-y-4">
                <div>
                  <label className="field-label">
                    Triệu chứng <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register('symptoms', {
                      required: 'Vui lòng nhập triệu chứng',
                      minLength: { value: 5, message: 'Triệu chứng phải có ít nhất 5 ký tự' },
                    })}
                    className={`input-field min-h-[120px] resize-y ${errors.symptoms ? 'border-red-300 bg-red-50' : ''}`}
                    placeholder="Mô tả triệu chứng bệnh nhân đang gặp..."
                  />
                  {errors.symptoms && (
                    <p className="mt-1 text-xs text-red-600">{errors.symptoms.message}</p>
                  )}
                </div>

                <div>
                  <label className="field-label">
                    Chẩn đoán <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register('diagnosis', {
                      required: 'Vui lòng nhập chẩn đoán',
                      minLength: { value: 5, message: 'Chẩn đoán phải có ít nhất 5 ký tự' },
                    })}
                    className={`input-field min-h-[140px] resize-y ${errors.diagnosis ? 'border-red-300 bg-red-50' : ''}`}
                    placeholder="Nhập chẩn đoán lâm sàng..."
                  />
                  {errors.diagnosis && (
                    <p className="mt-1 text-xs text-red-600">{errors.diagnosis.message}</p>
                  )}
                </div>

                <div>
                  <label className="field-label">Kết luận và dặn dò</label>
                  <textarea
                    {...register('conclusion')}
                    className="input-field min-h-[100px] resize-y"
                    placeholder="Ghi chú hướng xử trí và dặn dò bệnh nhân..."
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <p className="ops-section-label">Tái khám</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">Hẹn lịch tái khám</h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleScheduleFollowUp}
                    disabled={schedulingFollowUp}
                    className="btn-secondary px-4 py-2.5 disabled:opacity-50"
                  >
                    {schedulingFollowUp ? 'Đang lưu...' : 'Hẹn tái khám'}
                  </button>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
                  <div>
                    <label className="field-label text-xs">Ngày tái khám</label>
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(event) => setFollowUpDate(event.target.value)}
                      className="input-field"
                      min={toIsoDateUtc7()}
                    />
                  </div>
                  <div>
                    <label className="field-label text-xs">Ghi chú (tuỳ chọn)</label>
                    <input
                      type="text"
                      value={followUpNote}
                      onChange={(event) => setFollowUpNote(event.target.value)}
                      className="input-field"
                      placeholder="Ví dụ: tái khám sau khi uống thuốc 7 ngày"
                    />
                  </div>
                </div>

                {followUpResult && (
                  <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                    <p className="font-semibold">
                      Đã tạo lịch tái khám:{' '}
                      {formatDateUtc7(followUpResult.date, {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="mt-1">
                      {followUpShiftLabel(followUpResult.shiftType)} • {followUpResult.timeRange}
                      {followUpResult.serviceName ? ` • ${followUpResult.serviceName}` : ''}
                    </p>
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <p className="ops-section-label">Đơn thuốc</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">
                      Danh sách kê đơn trong phiên khám
                    </h3>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-600">
                    Tạm tính: {formatMoney(totalPrescriptionCost)}
                  </div>
                </div>

                {prescriptionItems.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {prescriptionItems.map((item, index) => (
                      <div
                        key={`${item.medicationId}-${index}`}
                        className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-[minmax(0,1.4fr)_0.7fr_0.5fr_1fr_auto]"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {item.medicationName}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.dosage} • Đơn vị {item.unit}
                          </p>
                          {item.note && (
                            <p className="mt-1 text-xs text-slate-500">Ghi chú: {item.note}</p>
                          )}
                        </div>
                        <div className="text-sm text-slate-600">
                          {formatMoney(item.unitPriceCents)}/đv
                        </div>
                        <div className="text-sm font-semibold text-slate-900">SL {item.qty}</div>
                        <div className="text-sm font-semibold text-slate-900">
                          {formatMoney(item.unitPriceCents * item.qty)}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMedication(index)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                    Chưa có thuốc nào được thêm vào đơn.
                  </div>
                )}

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Chọn nhanh thuốc
                    </p>
                    <div className="mt-2 flex max-h-28 flex-wrap gap-2 overflow-y-auto pr-1">
                      {medicationCatalog.length > 0 ? (
                        medicationCatalog.map((med) => (
                          <button
                            key={med.id}
                            type="button"
                            onClick={() => handlePickFromCatalog(med)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                              selectedMed?.id === med.id
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-primary/35 hover:text-primary'
                            }`}
                          >
                            {med.name}
                          </button>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500">Chưa có thuốc khả dụng trong kho.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Toa mẫu
                    </p>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                      <select
                        value={selectedTemplateId}
                        onChange={(event) => setSelectedTemplateId(event.target.value)}
                        className="input-field min-w-0 flex-1"
                      >
                        <option value="">Chọn toa mẫu</option>
                        {prescriptionTemplates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name} ({template.items.length} thuốc)
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleApplyTemplate}
                        disabled={!selectedTemplateId}
                        className="btn-secondary px-4 py-2.5 disabled:opacity-50"
                      >
                        Áp dụng
                      </button>
                    </div>
                    {prescriptionTemplates.length === 0 && (
                      <p className="mt-2 text-xs text-slate-500">
                        Chưa có toa mẫu active từ quản trị.
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-4 lg:grid-cols-12">
                  <div className="lg:col-span-4">
                    <label className="field-label text-xs">Tên thuốc</label>
                    <div className="relative z-40">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">
                        search
                      </span>
                      <input
                        type="text"
                        value={medSearch}
                        onFocus={() => setIsMedicationDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setIsMedicationDropdownOpen(false), 120)}
                        onChange={(event) => {
                          setMedSearch(event.target.value);
                          if (selectedMed && event.target.value !== selectedMed.name) {
                            setSelectedMed(null);
                          }
                          setIsMedicationDropdownOpen(true);
                        }}
                        className="input-field pl-10"
                        placeholder="Tìm thuốc..."
                      />

                      {isMedicationDropdownOpen && medicationSuggestions.length > 0 && (
                        <div className="absolute bottom-full left-0 right-0 z-50 mb-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                          <div className="max-h-52 overflow-y-auto">
                            {medicationSuggestions.map((med) => (
                              <button
                                key={med.id}
                                type="button"
                                onClick={() => handleSelectMedication(med)}
                                className="w-full border-b border-slate-100 px-3 py-2 text-left last:border-none hover:bg-slate-50"
                              >
                                <p className="text-sm font-medium text-slate-900">{med.name}</p>
                                <p className="text-xs text-slate-500">
                                  {med.defaultDose || 'Chưa có liều mẫu'} • Còn {med.availableStock}{' '}
                                  {med.unit}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-3">
                    <label className="field-label text-xs">Liều lượng</label>
                    <input
                      type="text"
                      value={newMedDosage}
                      onChange={(event) => setNewMedDosage(event.target.value)}
                      className="input-field"
                      placeholder="VD: 2 viên/ngày"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <label className="field-label text-xs">Số lượng</label>
                    <input
                      type="number"
                      min="1"
                      value={newMedQty}
                      onChange={(event) => setNewMedQty(event.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <label className="field-label text-xs">Ghi chú</label>
                    <input
                      type="text"
                      value={newMedNote}
                      onChange={(event) => setNewMedNote(event.target.value)}
                      className="input-field"
                      placeholder="Sau ăn, trước ngủ..."
                    />
                  </div>

                  <div className="lg:col-span-1 lg:self-end">
                    <button
                      type="button"
                      onClick={handleAddMedication}
                      disabled={!selectedMed}
                      className="btn-primary h-[46px] w-full px-0 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                    </button>
                  </div>
                </div>
              </section>
            </form>
          </section>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <Link to="/doctor/queue" className="btn-secondary px-4 py-2.5">
            Hủy
          </Link>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleOpenSendToLabConfirm}
              disabled={saving}
              className="btn-secondary border-primary/30 bg-primary/10 text-primary hover:bg-primary/15 disabled:opacity-50"
            >
              Gửi xét nghiệm
            </button>
            <button
              type="button"
              onClick={handleSubmit(onSaveDraft)}
              disabled={saving}
              className="btn-secondary disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : 'Lưu nháp'}
            </button>
            <button
              type="button"
              onClick={handleSubmit(onComplete)}
              disabled={saving}
              className="btn-primary disabled:opacity-50"
            >
              {saving ? 'Đang xử lý...' : 'Lưu và hoàn thành'}
            </button>
          </div>
        </div>
      </div>

      {showSendToLabConfirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-2xl text-primary">science</span>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900">Xác nhận gửi xét nghiệm</h3>
                <p className="text-sm text-slate-600">
                  Bệnh nhân sẽ chuyển sang trạng thái <strong>PENDING_LAB</strong> và được đánh dấu
                  trong hàng chờ xét nghiệm.
                </p>
                <p className="text-sm text-slate-600">
                  Hệ thống cũng sẽ lưu thông tin khám hiện tại trước khi gửi đi.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSendToLabConfirm(false)}
                className="btn-secondary"
                disabled={saving}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSendToLab}
                className="btn-primary"
                disabled={saving}
              >
                {saving ? 'Đang gửi...' : 'Xác nhận gửi'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ViewportToast message={labTransferToast} />
    </div>
  );
}

function ViewportToast({ message }: { message: string | null }) {
  if (!message || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed right-4 top-4 z-[100] w-[320px] max-w-[calc(100vw-2rem)] rounded-lg border border-emerald-200 bg-white px-3 py-2 text-emerald-800 shadow-lg">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
        <p className="text-xs font-medium leading-5">{message}</p>
      </div>
    </div>,
    document.body,
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
        active
          ? 'bg-primary/10 text-primary'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
      }`}
    >
      {label}
    </button>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function EmptyState({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
      <span className="material-symbols-outlined text-4xl text-slate-400">{icon}</span>
      <p className="mt-2 text-sm font-medium text-slate-600">{title}</p>
    </div>
  );
}
