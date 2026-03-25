import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { toIsoDateUtc7 } from '../../../lib/time';
import { customerApi } from '../api';
import {
  DoctorCard,
  PatientInfoForm,
  PaymentStep,
  QRTicket,
  ShiftPicker,
  StepIndicator,
} from '../components';
import type { PatientInfoFormValues } from '../components';
import { PatientFooter } from '../components/PatientFooter';
import { PatientNavbar } from '../components/PatientNavbar';
import type { AvailableShift, BookingTicket, ClinicService, DoctorSummary } from '../types';

const STEPS = ['Chọn bác sĩ', 'Chọn ca khám', 'Thông tin bệnh nhân', 'Xác nhận', 'Phiếu khám'];

function normalizeText(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

function isNoisyPublicName(value: string): boolean {
  const lowered = value.trim().toLowerCase();
  if (['fgjnh', 'tdjkh', 'test', 'abc', 'xyz'].includes(lowered)) return true;
  return /^[a-z]{4,6}$/.test(lowered);
}

function doctorMatchesService(doctor: DoctorSummary, service: ClinicService): boolean {
  const specialty = normalizeText(doctor.specialty);
  const serviceName = normalizeText(service.name);
  if (!specialty || !serviceName) return false;

  if (serviceName.includes('tai kham')) return true;
  if (serviceName.includes(specialty) || specialty.includes(serviceName)) return true;

  const serviceTokens = serviceName.split(/\s+/).filter((token) => token.length >= 3);
  return serviceTokens.some((token) => specialty.includes(token));
}

function inferServiceForDoctor(
  doctor: DoctorSummary | null,
  services: ClinicService[],
  preferredServiceId: string | null,
) {
  if (services.length === 0) return null;

  const byPreferred = preferredServiceId
    ? (services.find((service) => service.id === preferredServiceId) ?? null)
    : null;
  if (byPreferred) return byPreferred;
  if (!doctor) return byPreferred;

  const specialty = normalizeText(doctor.specialty);
  if (specialty) {
    const directMatch = services.find((service) => {
      const serviceName = normalizeText(service.name);
      return serviceName.includes(specialty) || specialty.includes(serviceName);
    });
    if (directMatch) return directMatch;

    const specialtyTokens = specialty.split(/\s+/).filter((token) => token.length >= 3);
    const tokenMatch = services.find((service) => {
      const serviceName = normalizeText(service.name);
      return specialtyTokens.some((token) => serviceName.includes(token));
    });
    if (tokenMatch) return tokenMatch;
  }

  return byPreferred;
}

export function BookingPage() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorSummary | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => toIsoDateUtc7());
  const [selectedShift, setSelectedShift] = useState<AvailableShift | null>(null);
  const [patientInfo, setPatientInfo] = useState<PatientInfoFormValues | null>(null);
  const [selectedService, setSelectedService] = useState<ClinicService | null>(null);
  const [createdTicket, setCreatedTicket] = useState<BookingTicket | null>(null);
  const [paidTicket, setPaidTicket] = useState<BookingTicket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const preselectedDoctorId = searchParams.get('doctorId');
  const preselectedServiceId = searchParams.get('serviceId');

  const { data: doctors = [], isLoading: loadingDoctors } = useQuery({
    queryKey: ['customer-doctors', preselectedServiceId],
    queryFn: () => customerApi.getDoctors(preselectedServiceId),
  });

  const { data: shifts = [], isLoading: loadingShifts } = useQuery({
    queryKey: ['customer-shifts', selectedDoctor?.id, selectedDate],
    queryFn: () => customerApi.getAvailableShifts(selectedDoctor!.id, selectedDate),
    enabled: !!selectedDoctor,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['customer-services'],
    queryFn: customerApi.getServices,
  });

  const preselectedService = preselectedServiceId
    ? (services.find((service) => service.id === preselectedServiceId) ?? null)
    : null;

  const filteredDoctors = (() => {
    const visible = doctors.filter((doctor) => !isNoisyPublicName(doctor.displayName));
    if (!preselectedService) return visible;

    const matched = visible.filter((doctor) => doctorMatchesService(doctor, preselectedService));
    return matched.length > 0 ? matched : visible;
  })();

  useEffect(() => {
    if (!preselectedDoctorId || filteredDoctors.length === 0) return;
    const matchedDoctor = filteredDoctors.find((doctor) => doctor.id === preselectedDoctorId);
    if (matchedDoctor) {
      setSelectedDoctor((current) => (current?.id === matchedDoctor.id ? current : matchedDoctor));
    }
  }, [filteredDoctors, preselectedDoctorId]);

  useEffect(() => {
    if (!selectedDoctor) return;
    if (filteredDoctors.some((doctor) => doctor.id === selectedDoctor.id)) return;
    setSelectedDoctor(null);
  }, [filteredDoctors, selectedDoctor]);

  useEffect(() => {
    const inferredService = inferServiceForDoctor(selectedDoctor, services, preselectedServiceId);
    setSelectedService((current) => {
      if (current?.id === inferredService?.id) return current;
      return inferredService;
    });
  }, [preselectedServiceId, selectedDoctor, services]);

  const createBookingMutation = useMutation({
    mutationFn: customerApi.createBooking,
    onSuccess: (ticket) => {
      setCreatedTicket(ticket);
      setStep(4);
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const paymentMutation = useMutation({
    mutationFn: ({ bookingId, method }: { bookingId: string; method: 'QR' | 'CASH' }) =>
      customerApi.processPayment(bookingId, method),
    onSuccess: (ticket) => {
      setPaidTicket(ticket);
      setStep(5);
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const handleDoctorSelect = (doctor: DoctorSummary) => {
    setSelectedDoctor(doctor);
    setSelectedService(inferServiceForDoctor(doctor, services, preselectedServiceId));
    setSelectedShift(null);
    setError(null);
  };

  const handlePatientInfoSubmit = (values: PatientInfoFormValues) => {
    if (!selectedShift) {
      setError('Vui lòng chọn ca khám trước khi gửi thông tin.');
      return;
    }

    setPatientInfo(values);
    setError(null);

    createBookingMutation.mutate({
      shiftId: selectedShift.id,
      fullName: values.fullName,
      phone: values.phone,
      ...(selectedService?.id ? { serviceId: selectedService.id } : {}),
      ...(values.nationalId ? { nationalId: values.nationalId } : {}),
      ...(values.dateOfBirth ? { dateOfBirth: values.dateOfBirth } : {}),
      ...(values.gender ? { gender: values.gender } : {}),
      ...(values.notes ? { notes: values.notes } : {}),
    });
  };

  return (
    <div className="clinic-page" data-testid="patient-booking-page">
      <PatientNavbar />

      <main className="clinic-section">
        <div className="mx-auto w-full max-w-4xl space-y-5">
          <section className="rounded-[22px] border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  Đặt lịch khám
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                  Form đặt lịch
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/doctors"
                  className="btn-secondary px-4 py-2.5"
                  data-testid="patient-booking-view-doctors"
                >
                  Xem bác sĩ
                </Link>
                <Link to="/appointments" className="btn-secondary px-4 py-2.5">
                  Xem lịch hẹn
                </Link>
              </div>
            </div>
          </section>

          <section className="clinic-card overflow-hidden" data-testid="patient-booking-main-panel">
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    Bước {step} / {STEPS.length}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{STEPS[step - 1]}</p>
                </div>
                {step > 1 && step < 5 && (
                  <button
                    type="button"
                    onClick={() => {
                      setStep(step - 1);
                      setError(null);
                    }}
                    className="btn-secondary px-4 py-2.5"
                  >
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                    <span>Quay lại</span>
                  </button>
                )}
              </div>

              <div className="mt-5" data-testid="patient-booking-step-indicator">
                <StepIndicator current={step} steps={STEPS} />
              </div>
            </div>

            <div className="p-5 sm:p-6 lg:p-7">
              {error && <div className="surface-alert mb-5">{error}</div>}

              {step === 1 && (
                <div className="space-y-4">
                  {preselectedService && (
                    <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                      Đang lọc bác sĩ theo dịch vụ: <strong>{preselectedService.name}</strong>
                    </div>
                  )}

                  {loadingDoctors && (
                    <p className="text-sm text-slate-500">Đang tải danh sách bác sĩ...</p>
                  )}

                  {!loadingDoctors && filteredDoctors.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                      Hiện chưa có bác sĩ phù hợp với dịch vụ đã chọn. Vui lòng chọn dịch vụ khác
                      hoặc thử lại sau.
                    </div>
                  ) : (
                    <div className="grid gap-4 xl:grid-cols-2">
                      {filteredDoctors.map((doctor) => (
                        <DoctorCard
                          key={doctor.id}
                          doctor={doctor}
                          selected={selectedDoctor?.id === doctor.id}
                          onSelect={() => handleDoctorSelect(doctor)}
                        />
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedDoctor) {
                        setError('Vui lòng chọn một bác sĩ để tiếp tục.');
                        return;
                      }
                      setError(null);
                      setStep(2);
                    }}
                    className="btn-primary w-full"
                    data-testid="patient-booking-next-from-doctor"
                  >
                    Tiếp tục
                  </button>
                </div>
              )}

              {step === 2 && selectedDoctor && (
                <div className="space-y-4">
                  <ShiftPicker
                    doctorId={selectedDoctor.id}
                    selectedDate={selectedDate}
                    onDateChange={(date) => {
                      setSelectedDate(date);
                      setSelectedShift(null);
                    }}
                    shifts={shifts}
                    selectedShiftId={selectedShift?.id ?? null}
                    onShiftSelect={(id) => {
                      const shift = shifts.find((item) => item.id === id) ?? null;
                      setSelectedShift(shift);
                      setError(null);
                    }}
                    loading={loadingShifts}
                  />

                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedShift) {
                        setError('Vui lòng chọn một ca khám còn trống.');
                        return;
                      }
                      setError(null);
                      setStep(3);
                    }}
                    className="btn-primary w-full"
                    data-testid="patient-booking-next-from-shift"
                  >
                    Tiếp tục
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  {createBookingMutation.isPending ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                      Đang tạo lịch hẹn...
                    </div>
                  ) : (
                    <PatientInfoForm
                      selectedService={selectedService}
                      onSubmit={handlePatientInfoSubmit}
                    />
                  )}
                </div>
              )}

              {step === 4 && createdTicket && (
                <PaymentStep
                  ticket={createdTicket}
                  doctor={selectedDoctor}
                  shift={selectedShift}
                  service={selectedService}
                  patientName={patientInfo?.fullName ?? ''}
                  patientPhone={patientInfo?.phone ?? ''}
                  onPay={(method) =>
                    paymentMutation.mutate({ bookingId: createdTicket.bookingId, method })
                  }
                  paying={paymentMutation.isPending}
                />
              )}

              {step === 5 &&
                (() => {
                  const finalTicket = paidTicket ?? createdTicket;
                  if (!finalTicket) return null;

                  return (
                    <div className="space-y-4">
                      <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-soft">
                          <span className="material-symbols-outlined text-3xl">check_circle</span>
                        </div>
                        <h2 className="mt-4 text-xl font-bold text-slate-950">
                          Đặt lịch thành công
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          Lưu lại phiếu khám để check-in tại quầy tiếp nhận.
                        </p>
                      </div>
                      <QRTicket ticket={finalTicket} />
                    </div>
                  );
                })()}
            </div>
          </section>
        </div>
      </main>

      <PatientFooter />
    </div>
  );
}
