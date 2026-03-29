import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useRef, useState } from 'react';

import { formatVndFromCents } from '../../../lib/currency';
import { formatDateTimeUtc7, formatDateUtc7, toIsoDateUtc7 } from '../../../lib/time';
import { adminApi } from '../api';
import type {
  AdminPatientDto,
  AdminServiceDto,
  CreateVisitRequest,
  CreateVisitResponse,
  DispatchOptionDto,
  ReceptionBooking,
  ShiftOverview,
} from '../types';

const STATUS_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  BOOKED: { label: 'Đã đặt', color: 'bg-blue-100 text-blue-700', icon: 'event_available' },
  CHECKED_IN: { label: 'Đã check-in', color: 'bg-green-100 text-green-700', icon: 'how_to_reg' },
  WAITING: { label: 'Chờ khám', color: 'bg-amber-100 text-amber-700', icon: 'hourglass_top' },
  IN_CONSULTATION: {
    label: 'Đang khám',
    color: 'bg-purple-100 text-purple-700',
    icon: 'stethoscope',
  },
  PENDING_LAB: { label: 'Chờ xét nghiệm', color: 'bg-orange-100 text-orange-700', icon: 'science' },
  RESULTS_READY: { label: 'Có kết quả', color: 'bg-teal-100 text-teal-700', icon: 'lab_research' },
  COMPLETED: {
    label: 'Hoàn thành',
    color: 'bg-emerald-100 text-emerald-700',
    icon: 'check_circle',
  },
  NO_SHOW: { label: 'Vắng mặt', color: 'bg-red-100 text-red-700', icon: 'person_off' },
  CANCELED: { label: 'Đã hủy', color: 'bg-slate-100 text-slate-600', icon: 'cancel' },
};

const POOL_LABELS: Record<string, string> = {
  COMMON: 'Bể chung',
  RESERVE: 'Bể dự phòng',
  OVERRIDE: 'Override',
};

const WAITING_BUCKET_STATUSES = new Set(['WAITING', 'PENDING_LAB', 'RESULTS_READY']);

function toReceptionSummaryStatus(status: string) {
  if (WAITING_BUCKET_STATUSES.has(status)) {
    return 'WAITING';
  }
  return status;
}

type GenderValue = 'MALE' | 'FEMALE' | 'OTHER' | '';
type TabType = 'board' | 'checkin' | 'create_visit';

type ApiError = Error & {
  status?: number;
};

interface VisitFormState {
  patientName: string;
  patientPhone: string;
  patientDob: string;
  patientGender: GenderValue;
  patientNationalId: string;
  patientInsuranceCode: string;
  serviceId: string;
}

function emptyVisitForm(serviceId = ''): VisitFormState {
  return {
    patientName: '',
    patientPhone: '',
    patientDob: '',
    patientGender: '',
    patientNationalId: '',
    patientInsuranceCode: '',
    serviceId,
  };
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Thao tác thất bại';
}

function shouldOfferOverride(error: ApiError) {
  const msg = error.message.toLowerCase();
  return (
    error.status === 409 ||
    msg.includes('hết số khám') ||
    msg.includes('het so kham') ||
    msg.includes('slot') ||
    msg.includes('override')
  );
}

function priceLabel(cents: number) {
  return formatVndFromCents(cents);
}

function normalizeDateForInput(rawDate: string | null) {
  if (!rawDate) return '';
  return rawDate.slice(0, 10);
}

function dateTimeLabel(raw: string | null) {
  if (!raw) return 'Chưa cập nhật';
  return formatDateTimeUtc7(raw);
}

function bookingDateLabel(raw: string | null) {
  if (!raw) return 'Chưa có ngày';
  return formatDateUtc7(raw, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function toSortTimestamp(raw: string | null) {
  if (!raw) return 0;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return 0;
  return parsed.getTime();
}

function getLocalDateIso() {
  return toIsoDateUtc7();
}

export function ReceptionPage() {
  const queryClient = useQueryClient();
  const today = getLocalDateIso();

  const [activeTab, setActiveTab] = useState<TabType>('board');
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [searchPhone, setSearchPhone] = useState('');
  const [followUpOnlySearch, setFollowUpOnlySearch] = useState(false);
  const [searchResults, setSearchResults] = useState<ReceptionBooking[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isFollowUpVisit, setIsFollowUpVisit] = useState(false);
  const [followUpMatches, setFollowUpMatches] = useState<ReceptionBooking[]>([]);
  const [followUpLookupLoading, setFollowUpLookupLoading] = useState(false);
  const [followUpLookupNote, setFollowUpLookupNote] = useState('');

  const [visitForm, setVisitForm] = useState<VisitFormState>(emptyVisitForm());
  const [lookupNote, setLookupNote] = useState('');
  const [lookupState, setLookupState] = useState<
    'idle' | 'loading' | 'found' | 'not_found' | 'error'
  >('idle');
  const [patientCandidates, setPatientCandidates] = useState<AdminPatientDto[]>([]);
  const [showPatientPickerModal, setShowPatientPickerModal] = useState(false);
  const [createVisitResult, setCreateVisitResult] = useState<CreateVisitResponse | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedBookingDetail, setSelectedBookingDetail] = useState<ReceptionBooking | null>(null);
  const [createVisitError, setCreateVisitError] = useState('');
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [pendingOverridePayload, setPendingOverridePayload] = useState<CreateVisitRequest | null>(
    null,
  );
  const lookupRequestIdRef = useRef(0);

  const { data: shifts = [] } = useQuery({
    queryKey: ['admin', 'shifts', today],
    queryFn: () => adminApi.getTodayShifts(today),
    refetchInterval: 30000,
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['admin', 'reception', 'bookings', today, selectedShiftId],
    queryFn: () => adminApi.getReceptionBookings(today, selectedShiftId || undefined),
    refetchInterval: 10000,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['admin', 'services', 'reception-create-visit'],
    queryFn: () => adminApi.getServices(),
    staleTime: 60000,
  });

  const activeServices = useMemo(
    () => services.filter((svc: AdminServiceDto) => svc.active),
    [services],
  );

  const selectedService = useMemo(
    () => services.find((svc) => svc.id === visitForm.serviceId) ?? null,
    [services, visitForm.serviceId],
  );

  const { data: dispatchOptions = [], isLoading: dispatchOptionsLoading } = useQuery({
    queryKey: ['admin', 'reception', 'dispatch-options', visitForm.serviceId],
    queryFn: () => adminApi.getDispatchOptions(visitForm.serviceId),
    enabled: !!visitForm.serviceId,
    staleTime: 15000,
  });

  const effectivePreferredDoctorId = useMemo(() => {
    if (!selectedDoctorId) return '';
    return dispatchOptions.some((option: DispatchOptionDto) => option.doctorId === selectedDoctorId)
      ? selectedDoctorId
      : '';
  }, [dispatchOptions, selectedDoctorId]);

  const suggestedDispatch = dispatchOptions[0];

  const filteredBookings = useMemo(() => {
    const scoped = filterStatus
      ? bookings.filter(
          (booking: ReceptionBooking) => toReceptionSummaryStatus(booking.status) === filterStatus,
        )
      : bookings;

    return [...scoped].sort((a, b) => {
      const aTime = toSortTimestamp(a.createdAt) || toSortTimestamp(a.checkInAt);
      const bTime = toSortTimestamp(b.createdAt) || toSortTimestamp(b.checkInAt);
      return bTime - aTime;
    });
  }, [bookings, filterStatus]);

  const statusCounts = useMemo(
    () =>
      bookings.reduce(
        (acc: Record<string, number>, booking: ReceptionBooking) => {
          const summaryStatus = toReceptionSummaryStatus(booking.status);
          acc[summaryStatus] = (acc[summaryStatus] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    [bookings],
  );

  const checkInMutation = useMutation({
    mutationFn: (bookingId: string) => adminApi.checkIn(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reception'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'shifts'] });
      setSearchResults([]);
      setSearchPhone('');
      setHasSearched(false);
      setFollowUpMatches([]);
      setFollowUpLookupLoading(false);
      setFollowUpLookupNote('');
    },
  });

  const noShowMutation = useMutation({
    mutationFn: (bookingId: string) => adminApi.markNoShow(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reception'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'shifts'] });
    },
  });

  const createVisitMutation = useMutation<CreateVisitResponse, ApiError, CreateVisitRequest>({
    mutationFn: (payload) => adminApi.createVisit(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reception'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'shifts'] });
      setActiveTab('board');
      setCreateVisitResult(data);
      setCreateVisitError('');
      setShowOverrideModal(false);
      setPendingOverridePayload(null);
      setIsFollowUpVisit(false);
      setFollowUpMatches([]);
      setFollowUpLookupLoading(false);
      setFollowUpLookupNote('');
    },
  });

  const handleSearch = useCallback(async () => {
    const phone = searchPhone.trim();
    if (!phone) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const results = await adminApi.searchBookingsByPhone(phone, today, followUpOnlySearch);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [followUpOnlySearch, searchPhone, today]);

  const clearFollowUpLookup = useCallback(() => {
    setFollowUpMatches([]);
    setFollowUpLookupLoading(false);
    setFollowUpLookupNote('');
  }, []);

  const handleFollowUpLookup = useCallback(
    async (rawPhone?: string) => {
      const phone = (rawPhone ?? visitForm.patientPhone).trim();
      if (!phone) {
        clearFollowUpLookup();
        setFollowUpLookupNote('Nhập số điện thoại để kiểm tra lịch tái khám.');
        return;
      }

      setFollowUpLookupLoading(true);
      setFollowUpLookupNote('');
      try {
        const results = await adminApi.searchBookingsByPhone(phone, today, true);
        const matched = results
          .filter((booking) => booking.followUp && booking.status === 'BOOKED')
          .sort((a, b) => {
            const aTime = toSortTimestamp(a.followUpScheduledAt || a.createdAt);
            const bTime = toSortTimestamp(b.followUpScheduledAt || b.createdAt);
            return aTime - bTime;
          });

        setFollowUpMatches(matched);
        if (matched.length > 0) {
          setFollowUpLookupNote(
            `Tìm thấy ${matched.length} lịch tái khám theo số điện thoại. Chọn lịch phù hợp để check-in khi tới ngày hẹn.`,
          );
        } else {
          setFollowUpLookupNote(
            'Không có lịch tái khám phù hợp từ hôm nay trở đi. Có thể bỏ chọn "Bệnh nhân tái khám" để tạo phiếu mới.',
          );
        }
      } catch {
        setFollowUpMatches([]);
        setFollowUpLookupNote('Không thể kiểm tra lịch tái khám lúc này. Vui lòng thử lại.');
      } finally {
        setFollowUpLookupLoading(false);
      }
    },
    [clearFollowUpLookup, today, visitForm.patientPhone],
  );

  const applyPatientCandidate = useCallback(async (candidate: AdminPatientDto) => {
    let insuranceCode = '';
    try {
      const profile = await adminApi.lookupPatient(candidate.phone);
      insuranceCode = profile?.insuranceCode ?? '';
    } catch {
      insuranceCode = '';
    }

    setVisitForm((prev) => ({
      ...prev,
      patientName: candidate.fullName,
      patientPhone: candidate.phone,
      patientDob: normalizeDateForInput(candidate.dateOfBirth),
      patientGender:
        candidate.gender === 'MALE' || candidate.gender === 'FEMALE' || candidate.gender === 'OTHER'
          ? candidate.gender
          : '',
      patientNationalId: candidate.nationalId ?? '',
      patientInsuranceCode: insuranceCode,
    }));
    setLookupState('found');
    setLookupNote('Đã nạp hồ sơ bệnh nhân vào form.');
    setShowPatientPickerModal(false);
    setPatientCandidates([]);
  }, []);

  const handlePhoneLookup = useCallback(async () => {
    const phone = visitForm.patientPhone.trim();
    const requestId = lookupRequestIdRef.current + 1;
    lookupRequestIdRef.current = requestId;
    if (!phone) {
      setLookupState('idle');
      setLookupNote('');
      setPatientCandidates([]);
      setShowPatientPickerModal(false);
      return;
    }

    setLookupState('loading');
    setLookupNote('');
    setCreateVisitError('');

    try {
      const patients = await adminApi.getPatients(phone);
      if (requestId !== lookupRequestIdRef.current) {
        return;
      }
      const matched = patients.filter((patient) => patient.phone === phone);
      if (matched.length === 0) {
        setLookupState('idle');
        setLookupNote('');
        setPatientCandidates([]);
        setShowPatientPickerModal(false);
        return;
      }

      setPatientCandidates(matched);
      setShowPatientPickerModal(true);
      setLookupState('found');
      setLookupNote('');
    } catch {
      if (requestId !== lookupRequestIdRef.current) {
        return;
      }
      setLookupState('error');
      setLookupNote('Không thể tìm hồ sơ lúc này. Vui lòng thử lại.');
    }
  }, [visitForm.patientPhone]);

  const handleCheckInFollowUpFromCreateVisit = useCallback(
    async (bookingId: string) => {
      setCreateVisitError('');
      try {
        await checkInMutation.mutateAsync(bookingId);
        setActiveTab('board');
        setIsFollowUpVisit(false);
        clearFollowUpLookup();
      } catch (error) {
        setCreateVisitError(toErrorMessage(error));
      }
    },
    [checkInMutation, clearFollowUpLookup],
  );

  const buildCreateVisitPayload = useCallback(
    (forceOverride: boolean): CreateVisitRequest => {
      const patientName = visitForm.patientName.trim();
      const patientPhone = visitForm.patientPhone.trim();
      const serviceId = visitForm.serviceId;

      if (!patientName || !patientPhone || !serviceId) {
        throw new Error('Vui lòng nhập đầy đủ họ tên, số điện thoại và dịch vụ.');
      }

      return {
        patientName,
        patientPhone,
        serviceId,
        ...(visitForm.patientDob ? { patientDob: visitForm.patientDob } : {}),
        ...(visitForm.patientGender ? { patientGender: visitForm.patientGender } : {}),
        ...(visitForm.patientNationalId.trim()
          ? { patientNationalId: visitForm.patientNationalId.trim() }
          : {}),
        ...(visitForm.patientInsuranceCode.trim()
          ? { patientInsuranceCode: visitForm.patientInsuranceCode.trim() }
          : {}),
        ...(effectivePreferredDoctorId ? { preferredDoctorId: effectivePreferredDoctorId } : {}),
        ...(forceOverride ? { forceOverride: true } : {}),
      };
    },
    [effectivePreferredDoctorId, visitForm],
  );

  const submitCreateVisit = useCallback(
    async (forceOverride: boolean) => {
      const payload =
        forceOverride && pendingOverridePayload
          ? { ...pendingOverridePayload, forceOverride: true }
          : buildCreateVisitPayload(false);

      setCreateVisitError('');

      try {
        await createVisitMutation.mutateAsync(payload);
      } catch (error) {
        const apiError = error as ApiError;
        if (!forceOverride && shouldOfferOverride(apiError)) {
          setPendingOverridePayload(payload);
          setShowOverrideModal(true);
          return;
        }
        setCreateVisitError(toErrorMessage(error));
      }
    },
    [buildCreateVisitPayload, createVisitMutation, pendingOverridePayload],
  );

  const clearVisitFormAfterCreated = useCallback(() => {
    setVisitForm((prev) => emptyVisitForm(prev.serviceId));
    setSelectedDoctorId('');
    setLookupState('idle');
    setLookupNote('');
    setPatientCandidates([]);
    setShowPatientPickerModal(false);
    setCreateVisitResult(null);
    setIsFollowUpVisit(false);
    setFollowUpMatches([]);
    setFollowUpLookupLoading(false);
    setFollowUpLookupNote('');
  }, []);

  const hasMatchedFollowUpVisit = isFollowUpVisit && followUpMatches.length > 0;

  const printVisitTicket = useCallback(() => {
    if (!createVisitResult) return;
    const shiftLabel = createVisitResult.shiftType === 'MORNING' ? 'Sáng' : 'Chiều';
    const serviceName = selectedService?.name ?? 'Dịch vụ đã chọn';
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Phiếu khám - ${createVisitResult.queueNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            h1 { font-size: 22px; margin-bottom: 8px; }
            .muted { color: #64748b; margin-bottom: 18px; }
            .box { border: 1px solid #cbd5e1; border-radius: 10px; padding: 16px; }
            .row { display: flex; justify-content: space-between; margin: 8px 0; }
            .label { color: #334155; }
            .value { font-weight: 700; }
            .queue { font-size: 42px; text-align: center; margin: 18px 0; font-weight: 700; }
          </style>
        </head>
        <body>
          <h1>Phiếu khám bệnh</h1>
          <div class="muted">Thời gian in: ${formatDateTimeUtc7(new Date())}</div>
          <div class="box">
            <div class="queue">STT #${createVisitResult.queueNumber}</div>
            <div class="row"><div class="label">Bệnh nhân</div><div class="value">${createVisitResult.patientName}</div></div>
            <div class="row"><div class="label">Dịch vụ</div><div class="value">${serviceName}</div></div>
            <div class="row"><div class="label">Bác sĩ</div><div class="value">${createVisitResult.doctorName}</div></div>
            <div class="row"><div class="label">Phòng</div><div class="value">${createVisitResult.roomName || 'Chưa gán phòng'}</div></div>
            <div class="row"><div class="label">Ca</div><div class="value">${shiftLabel}</div></div>
            <div class="row"><div class="label">Loại slot</div><div class="value">${POOL_LABELS[createVisitResult.poolUsed] ?? createVisitResult.poolUsed}</div></div>
          </div>
          <script>window.onload = function(){ window.print(); };</script>
        </body>
      </html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }, [createVisitResult, selectedService]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {(
          ['BOOKED', 'CHECKED_IN', 'WAITING', 'IN_CONSULTATION', 'COMPLETED', 'NO_SHOW'] as const
        ).map((status) => {
          const info = STATUS_LABELS[status] ?? {
            label: status,
            color: 'bg-slate-100 text-slate-700',
            icon: 'help',
          };
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(filterStatus === status ? '' : status)}
              className={`rounded-lg border p-3 text-left transition-all ${
                filterStatus === status
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-lg ${info.color.split(' ')[1]}`}>
                  {info.icon}
                </span>
                <span className="text-2xl font-bold text-slate-900">
                  {statusCounts[status] || 0}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{info.label}</p>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
        {(
          [
            { key: 'board' as TabType, label: 'Bang theo doi', icon: 'dashboard' },
            { key: 'checkin' as TabType, label: 'Check-in Web', icon: 'qr_code_scanner' },
            { key: 'create_visit' as TabType, label: 'Tạo phiếu khám', icon: 'person_add' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'board' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-slate-700">Loc theo ca:</label>
            <select
              value={selectedShiftId}
              onChange={(event) => setSelectedShiftId(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Tất cả ca</option>
              {shifts.map((shift: ShiftOverview) => (
                <option key={shift.id} value={shift.id}>
                  {shift.doctorName} - {shift.type === 'MORNING' ? 'Sáng' : 'Chiều'} (
                  {shift.bookedSlots}/{shift.totalSlots})
                </option>
              ))}
            </select>
            {filterStatus && (
              <button
                onClick={() => setFilterStatus('')}
                className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
              >
                {STATUS_LABELS[filterStatus]?.label}
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
            <span className="text-sm text-slate-500">({filteredBookings.length} lịch khám)</span>
            <span className="text-xs text-slate-400">
              STT là thứ tự đăng ký. Thứ tự mời có thể khác theo ưu tiên hàng chờ.
            </span>
          </div>

          {bookingsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 py-16 text-center">
              <span className="material-symbols-outlined text-5xl text-slate-300">event_busy</span>
              <p className="mt-2 text-sm text-slate-500">Chưa có lịch khám nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-slate-600">STT</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Bệnh nhân</th>
                    <th className="px-4 py-3 font-medium text-slate-600">SDT</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Bác sĩ</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Ca</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Kenh</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Trạng thái</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBookings.map((booking: ReceptionBooking) => {
                    const statusInfo = STATUS_LABELS[booking.status] ?? {
                      label: booking.status,
                      color: 'bg-slate-100 text-slate-600',
                      icon: 'help',
                    };
                    return (
                      <tr key={booking.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          <div className="space-y-1">
                            <p>{booking.queueNumber ?? '-'}</p>
                            <p className="text-xs font-medium text-slate-500">
                              Ngày đặt: {bookingDateLabel(booking.createdAt)}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {booking.patientName}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{booking.patientPhone}</td>
                        <td className="px-4 py-3 text-slate-600">{booking.doctorName}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              booking.shiftType === 'MORNING'
                                ? 'bg-yellow-50 text-yellow-700'
                                : 'bg-indigo-50 text-indigo-700'
                            }`}
                          >
                            {booking.shiftType === 'MORNING' ? 'Sáng' : 'Chiều'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium ${
                              booking.channel === 'WEB' ? 'text-blue-600' : 'text-amber-600'
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm">
                              {booking.channel === 'WEB' ? 'language' : 'directions_walk'}
                            </span>
                            {booking.channel === 'WEB' ? 'Web' : 'Vãng lai'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusInfo.color}`}
                          >
                            <span className="material-symbols-outlined text-sm">
                              {statusInfo.icon}
                            </span>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {booking.status === 'BOOKED' && (
                              <button
                                onClick={() => checkInMutation.mutate(booking.id)}
                                disabled={checkInMutation.isPending}
                                className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                              >
                                Check-in
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedBookingDetail(booking)}
                              title="Xem chi tiết phiếu khám"
                              className="rounded-md bg-slate-100 p-1.5 text-slate-700 hover:bg-slate-200"
                            >
                              <span className="material-symbols-outlined text-base">
                                visibility
                              </span>
                            </button>
                            {(booking.status === 'BOOKED' ||
                              booking.status === 'CHECKED_IN' ||
                              booking.status === 'WAITING') && (
                              <button
                                onClick={() => {
                                  if (
                                    window.confirm(`Đánh dấu ${booking.patientName} là vắng mặt?`)
                                  ) {
                                    noShowMutation.mutate(booking.id);
                                  }
                                }}
                                disabled={noShowMutation.isPending}
                                className="rounded-md bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                              >
                                Vắng mặt
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'checkin' && (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <span className="material-symbols-outlined text-blue-600">qr_code_scanner</span>
            Check-in khách đặt web
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Nhập số điện thoại để tìm lịch BOOKED, sau đó bấm Check-in.
          </p>

          <div className="mt-4 flex gap-3">
            <input
              type="tel"
              value={searchPhone}
              onChange={(event) => setSearchPhone(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && void handleSearch()}
              placeholder="Nhập số điện thoại"
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={() => void handleSearch()}
              disabled={isSearching || !searchPhone.trim()}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSearching ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <span className="material-symbols-outlined text-lg">search</span>
              )}
              Tìm kiếm
            </button>
          </div>

          <label className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={followUpOnlySearch}
              onChange={(event) => setFollowUpOnlySearch(event.target.checked)}
              className="h-4 w-4 accent-blue-600"
            />
            Chỉ hiển thị lịch tái khám
          </label>

          {searchResults.length > 0 && (
            <div className="mt-4 space-y-3">
              <p className="text-sm font-medium text-slate-700">
                Tìm thấy {searchResults.length} lịch khám:
              </p>
              {searchResults.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-slate-900">{booking.patientName}</p>
                    <p className="text-sm text-slate-500">
                      BS. {booking.doctorName} -{' '}
                      {booking.shiftType === 'MORNING' ? 'Ca sáng' : 'Ca chiều'}
                      {booking.serviceName ? ` - ${booking.serviceName}` : ''}
                    </p>
                    {booking.followUp && (
                      <div className="space-y-1">
                        <p className="inline-flex w-fit items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                          Tái khám
                        </p>
                        {booking.followUpScheduledAt && (
                          <p className="text-xs text-slate-500">
                            Lịch hẹn: {formatDateTimeUtc7(booking.followUpScheduledAt)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => checkInMutation.mutate(booking.id)}
                    disabled={checkInMutation.isPending}
                    className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-lg">how_to_reg</span>
                    {booking.followUp ? 'Check-in tái khám' : 'Check-in'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {hasSearched && !isSearching && searchResults.length === 0 && (
            <div className="mt-4 rounded-lg border border-dashed border-slate-300 py-8 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300">search_off</span>
              <p className="mt-2 text-sm text-slate-500">
                {followUpOnlySearch
                  ? 'Không có lịch tái khám đang chờ check-in cho số này.'
                  : 'Không tìm thấy lịch khám đang chờ check-in cho số này.'}
              </p>
              {!followUpOnlySearch && (
                <button
                  type="button"
                  onClick={() => setActiveTab('create_visit')}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                >
                  <span className="material-symbols-outlined text-base">add_circle</span>
                  Tạo phiếu khám thủ công
                </button>
              )}
            </div>
          )}

          {checkInMutation.isError && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4">
              <span className="material-symbols-outlined text-red-600">error</span>
              <p className="text-sm font-medium text-red-700">
                {toErrorMessage(checkInMutation.error)}
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'create_visit' && (
        <div className="grid gap-4 lg:grid-cols-[1.5fr,1fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <span className="material-symbols-outlined text-amber-600">person_add</span>
              Tạo phiếu khám (Auto Dispatch)
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Lễ tân nhập thông tin bệnh nhân + chọn dịch vụ. Hệ thống tự động chọn bác sĩ, phòng và
              slot.
            </p>

            <div className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={visitForm.patientPhone}
                    onChange={(event) => {
                      setVisitForm((prev) => ({
                        ...prev,
                        patientPhone: event.target.value,
                      }));
                      setLookupState('idle');
                      setLookupNote('');
                      setPatientCandidates([]);
                      setShowPatientPickerModal(false);
                      clearFollowUpLookup();
                    }}
                    onBlur={() => {
                      void handlePhoneLookup();
                      if (isFollowUpVisit) {
                        void handleFollowUpLookup(visitForm.patientPhone);
                      }
                    }}
                    placeholder="0901234567"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {lookupState === 'error' && (
                    <p className="mt-1 text-xs text-red-600">{lookupNote}</p>
                  )}
                  <label className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-slate-600">
                    <input
                      type="checkbox"
                      checked={isFollowUpVisit}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setIsFollowUpVisit(checked);
                        if (checked) {
                          void handleFollowUpLookup(visitForm.patientPhone);
                        } else {
                          clearFollowUpLookup();
                        }
                      }}
                      className="h-4 w-4 accent-blue-600"
                    />
                    Bệnh nhân tái khám (ưu tiên check-in lịch hẹn cũ)
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Họ tên bệnh nhân <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={visitForm.patientName}
                    onChange={(event) =>
                      setVisitForm((prev) => ({ ...prev, patientName: event.target.value }))
                    }
                    placeholder="Nguyễn Văn A"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Ngày sinh</label>
                  <input
                    type="date"
                    value={visitForm.patientDob}
                    onChange={(event) =>
                      setVisitForm((prev) => ({ ...prev, patientDob: event.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Giới tính</label>
                  <select
                    value={visitForm.patientGender}
                    onChange={(event) =>
                      setVisitForm((prev) => ({
                        ...prev,
                        patientGender: event.target.value as GenderValue,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Không chọn</option>
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">CCCD</label>
                  <input
                    type="text"
                    value={visitForm.patientNationalId}
                    onChange={(event) =>
                      setVisitForm((prev) => ({ ...prev, patientNationalId: event.target.value }))
                    }
                    placeholder="012345678901"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Mã BHYT</label>
                  <input
                    type="text"
                    value={visitForm.patientInsuranceCode}
                    onChange={(event) =>
                      setVisitForm((prev) => ({
                        ...prev,
                        patientInsuranceCode: event.target.value,
                      }))
                    }
                    placeholder="DN4020..."
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Dịch vụ khám <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={visitForm.serviceId}
                    onChange={(event) => {
                      setVisitForm((prev) => ({ ...prev, serviceId: event.target.value }));
                      setSelectedDoctorId('');
                    }}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Chọn dịch vụ --</option>
                    {activeServices.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                  {selectedService && (
                    <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
                      <div className="font-medium">{selectedService.name}</div>
                      <div>Giá: {priceLabel(selectedService.priceCents)}</div>
                    </div>
                  )}
                  {visitForm.serviceId && (
                    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <label className="mb-1 block text-xs font-medium text-slate-700">
                        Bác sĩ phụ trách (có thể chọn lại)
                      </label>
                      <select
                        value={selectedDoctorId}
                        onChange={(event) => setSelectedDoctorId(event.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Hệ thống tự động chọn bác sĩ phù hợp</option>
                        {dispatchOptions.map((option: DispatchOptionDto) => (
                          <option key={option.shiftId} value={option.doctorId}>
                            {option.doctorName} -{' '}
                            {option.shiftType === 'MORNING' ? 'Sáng' : 'Chiều'} - {option.roomName}{' '}
                            (con {option.openSlots} slot)
                          </option>
                        ))}
                      </select>
                      {suggestedDispatch && (
                        <p className="mt-1 text-xs text-slate-500">
                          Gợi ý hệ thống: {suggestedDispatch.doctorName} (
                          {suggestedDispatch.shiftType === 'MORNING' ? 'Sáng' : 'Chiều'} -{' '}
                          {suggestedDispatch.roomName})
                        </p>
                      )}
                      {dispatchOptionsLoading && (
                        <p className="mt-1 text-xs text-slate-500">
                          Đang tải danh sách bác sĩ phù hợp...
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {isFollowUpVisit && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-blue-900">
                      Lịch tái khám theo số điện thoại
                    </p>
                    {followUpLookupLoading && (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    )}
                  </div>
                  {followUpLookupNote && (
                    <p className="mt-1 text-xs text-blue-700">{followUpLookupNote}</p>
                  )}

                  {followUpMatches.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {followUpMatches.map((booking) => {
                        const followUpDate = booking.followUpScheduledAt?.slice(0, 10) ?? '';
                        const canCheckIn = !followUpDate || followUpDate <= today;

                        return (
                          <div
                            key={booking.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-200 bg-white p-3"
                          >
                            <div className="text-sm text-slate-700">
                              <p className="font-semibold text-slate-900">{booking.patientName}</p>
                              <p>
                                BS. {booking.doctorName} -{' '}
                                {booking.shiftType === 'MORNING' ? 'Ca sáng' : 'Ca chiều'}
                              </p>
                              <p className="text-xs text-slate-500">
                                Lịch hẹn:{' '}
                                {booking.followUpScheduledAt
                                  ? formatDateTimeUtc7(booking.followUpScheduledAt)
                                  : booking.createdAt
                                    ? formatDateTimeUtc7(booking.createdAt)
                                    : 'Chưa cập nhật'}
                              </p>
                              {!canCheckIn && (
                                <p className="mt-1 text-xs font-medium text-amber-700">
                                  Chưa tới ngày hẹn, vui lòng quay lại đúng lịch tái khám.
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => void handleCheckInFollowUpFromCreateVisit(booking.id)}
                              disabled={checkInMutation.isPending || !canCheckIn}
                              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              {canCheckIn ? 'Check-in tái khám' : 'Chưa tới ngày'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => void submitCreateVisit(false)}
                  disabled={
                    createVisitMutation.isPending ||
                    !visitForm.patientName.trim() ||
                    !visitForm.patientPhone.trim() ||
                    !visitForm.serviceId ||
                    hasMatchedFollowUpVisit
                  }
                  className="flex items-center gap-2 rounded-lg bg-amber-600 px-6 py-3 font-medium text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {createVisitMutation.isPending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <span className="material-symbols-outlined">add_circle</span>
                  )}
                  Tạo phiếu khám
                </button>
                {hasMatchedFollowUpVisit && (
                  <p className="text-xs font-medium text-amber-700">
                    Đã có lịch tái khám phù hợp. Vui lòng check-in lịch hẹn thay vì tạo phiếu mới.
                  </p>
                )}

                <button
                  onClick={() => {
                    setVisitForm(emptyVisitForm(visitForm.serviceId));
                    setSelectedDoctorId('');
                    setLookupState('idle');
                    setLookupNote('');
                    setPatientCandidates([]);
                    setShowPatientPickerModal(false);
                    setCreateVisitError('');
                    setIsFollowUpVisit(false);
                    clearFollowUpLookup();
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Xóa form
                </button>
              </div>
            </div>

            {createVisitError && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4">
                <span className="material-symbols-outlined text-red-600">error</span>
                <p className="text-sm font-medium text-red-700">{createVisitError}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h4 className="text-sm font-bold text-slate-900">Dịch vụ đang hoạt động</h4>
              <p className="mt-1 text-xs text-slate-500">{activeServices.length} dịch vụ</p>
              <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                {activeServices.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => {
                      setVisitForm((prev) => ({ ...prev, serviceId: service.id }));
                      setSelectedDoctorId('');
                    }}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      visitForm.serviceId === service.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-medium text-slate-900">{service.name}</div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {priceLabel(service.priceCents)}
                    </div>
                  </button>
                ))}
                {activeServices.length === 0 && (
                  <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
                    Chưa có dịch vụ đang hoạt động.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h4 className="text-sm font-bold text-slate-900">Tổng quan ca hôm nay</h4>
              <div className="mt-3 space-y-2">
                {shifts.map((shift: ShiftOverview) => (
                  <div
                    key={shift.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  >
                    <div className="font-medium text-slate-900">
                      BS. {shift.doctorName} ({shift.type === 'MORNING' ? 'Sáng' : 'Chiều'})
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-slate-600">
                      <span>
                        Đặt: {shift.bookedSlots}/{shift.totalSlots}
                      </span>
                      <span className="text-blue-600">Common: {shift.commonAvailable}</span>
                      <span className="text-amber-600">Reserve: {shift.reserveAvailable}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-medium ${
                          shift.status === 'OPEN'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {shift.status}
                      </span>
                    </div>
                  </div>
                ))}
                {shifts.length === 0 && (
                  <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
                    Chưa có ca nào hôm nay.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showPatientPickerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
            <h4 className="text-lg font-bold text-slate-900">Chọn hồ sơ bệnh nhân</h4>
            <p className="mt-2 text-sm text-slate-600">
              Tìm thấy {patientCandidates.length} hồ sơ với số điện thoại {visitForm.patientPhone}.
              Vui lòng chọn hồ sơ để điền tự động thông tin.
            </p>

            <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
              {patientCandidates.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => void applyPatientCandidate(patient)}
                  className="w-full rounded-lg border border-slate-200 p-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"
                >
                  <div className="font-medium text-slate-900">{patient.fullName}</div>
                  <div className="mt-1 text-xs text-slate-600">
                    SĐT: {patient.phone} | CCCD: {patient.nationalId ?? 'Chưa cập nhật'} | Ngày
                    sinh: {patient.dateOfBirth ?? 'Chưa cập nhật'}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => {
                  setShowPatientPickerModal(false);
                  setLookupState('idle');
                  setLookupNote('');
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {createVisitResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <h4 className="text-lg font-bold text-slate-900">Chi tiết phiếu khám</h4>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              <p>
                STT: <strong>#{createVisitResult.queueNumber}</strong>
              </p>
              <p>
                Bệnh nhân: <strong>{createVisitResult.patientName}</strong>
              </p>
              <p>
                Bác sĩ: <strong>{createVisitResult.doctorName}</strong>
              </p>
              <p>
                Phòng: <strong>{createVisitResult.roomName || 'Chưa gán phòng'}</strong>
              </p>
              <p>
                Ca: <strong>{createVisitResult.shiftType === 'MORNING' ? 'Sáng' : 'Chiều'}</strong>
              </p>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                onClick={printVisitTicket}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                In phiếu
              </button>
              <button
                onClick={() => {
                  clearVisitFormAfterCreated();
                }}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedBookingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <h4 className="text-lg font-bold text-slate-900">Chi tiết lịch khám</h4>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              <p>
                STT: <strong>{selectedBookingDetail.queueNumber ?? '-'}</strong>
              </p>
              <p>
                Bệnh nhân: <strong>{selectedBookingDetail.patientName}</strong>
              </p>
              <p>
                SDT: <strong>{selectedBookingDetail.patientPhone}</strong>
              </p>
              <p>
                Bác sĩ: <strong>{selectedBookingDetail.doctorName}</strong>
              </p>
              <p>
                Ca:{' '}
                <strong>{selectedBookingDetail.shiftType === 'MORNING' ? 'Sáng' : 'Chiều'}</strong>
              </p>
              <p>
                Phòng: <strong>{selectedBookingDetail.roomName || 'Chưa gán phòng'}</strong>
              </p>
              <p>
                Dịch vụ: <strong>{selectedBookingDetail.serviceName ?? 'Chưa cập nhật'}</strong>
              </p>
              <p>
                Pool slot:{' '}
                <strong>
                  {selectedBookingDetail.slotPool
                    ? (POOL_LABELS[selectedBookingDetail.slotPool] ??
                      selectedBookingDetail.slotPool)
                    : 'Chưa cập nhật'}
                </strong>
              </p>
              <p>
                Kênh:{' '}
                <strong>{selectedBookingDetail.channel === 'WEB' ? 'Web' : 'Vãng lai'}</strong>
              </p>
              <p>
                Trạng thái:{' '}
                <strong>
                  {STATUS_LABELS[selectedBookingDetail.status]?.label ??
                    selectedBookingDetail.status}
                </strong>
              </p>
              <p>
                Thanh toán: <strong>{selectedBookingDetail.paymentStatus}</strong>
              </p>
              <p>
                Tạo lúc: <strong>{dateTimeLabel(selectedBookingDetail.createdAt)}</strong>
              </p>
              <p>
                Check-in lúc: <strong>{dateTimeLabel(selectedBookingDetail.checkInAt)}</strong>
              </p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => {
                  const printWindow = window.open('', '_blank', 'width=900,height=700');
                  if (!printWindow) return;
                  const html = `
                    <html>
                      <head>
                        <title>Phiếu khám - ${selectedBookingDetail.queueNumber ?? '-'}</title>
                        <style>
                          body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
                          h1 { font-size: 22px; margin-bottom: 8px; }
                          .muted { color: #64748b; margin-bottom: 18px; }
                          .box { border: 1px solid #cbd5e1; border-radius: 10px; padding: 16px; }
                          .row { display: flex; justify-content: space-between; margin: 8px 0; }
                          .label { color: #334155; }
                          .value { font-weight: 700; }
                          .queue { font-size: 42px; text-align: center; margin: 18px 0; font-weight: 700; }
                        </style>
                      </head>
                      <body>
                        <h1>Phiếu khám bệnh</h1>
                        <div class="muted">Thời gian in: ${formatDateTimeUtc7(new Date())}</div>
                        <div class="box">
                          <div class="queue">STT #${selectedBookingDetail.queueNumber ?? '-'}</div>
                          <div class="row"><div class="label">Bệnh nhân</div><div class="value">${selectedBookingDetail.patientName}</div></div>
                          <div class="row"><div class="label">Dịch vụ</div><div class="value">${selectedBookingDetail.serviceName ?? 'Chưa cập nhật'}</div></div>
                          <div class="row"><div class="label">Bác sĩ</div><div class="value">${selectedBookingDetail.doctorName}</div></div>
                          <div class="row"><div class="label">Phòng</div><div class="value">${selectedBookingDetail.roomName || 'Chưa gán phòng'}</div></div>
                          <div class="row"><div class="label">Ca</div><div class="value">${selectedBookingDetail.shiftType === 'MORNING' ? 'Sáng' : 'Chiều'}</div></div>
                        </div>
                        <script>window.onload = function(){ window.print(); };</script>
                      </body>
                    </html>`;
                  printWindow.document.open();
                  printWindow.document.write(html);
                  printWindow.document.close();
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                In phiếu
              </button>
              <button
                onClick={() => setSelectedBookingDetail(null)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h4 className="text-lg font-bold text-slate-900">Hết số khám thường</h4>
            <p className="mt-2 text-sm text-slate-600">
              Dịch vụ này đã hết slot COMMON/RESERVE trong ngày. Bạn có muốn tạo phiếu theo chế độ
              override không?
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowOverrideModal(false);
                  setPendingOverridePayload(null);
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Bỏ qua
              </button>
              <button
                onClick={() => void submitCreateVisit(true)}
                disabled={createVisitMutation.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {createVisitMutation.isPending ? 'Đang xử lý...' : 'Override'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
