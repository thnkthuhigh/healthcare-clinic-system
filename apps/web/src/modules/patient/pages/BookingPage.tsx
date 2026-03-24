import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { FlatTaskHeader } from '../../../components/ClinicUI';
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

const STEPS = [
  'Chọn bác sĩ',
  'Chọn ca khám',
  'Thông tin bệnh nhân',
  'Xác nhận',
  'Phiếu khám',
];

const STEP_ICONS = ['groups', 'calendar_month', 'badge', 'payments', 'qr_code_2'];

function formatHumanDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function BookingPage() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorSummary | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0] ?? '');
  const [selectedShift, setSelectedShift] = useState<AvailableShift | null>(null);
  const [patientInfo, setPatientInfo] = useState<PatientInfoFormValues | null>(null);
  const [selectedService, setSelectedService] = useState<ClinicService | null>(null);
  const [createdTicket, setCreatedTicket] = useState<BookingTicket | null>(null);
  const [paidTicket, setPaidTicket] = useState<BookingTicket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const preselectedDoctorId = searchParams.get('doctorId');
  const preselectedServiceId = searchParams.get('serviceId');

  const { data: doctors = [], isLoading: loadingDoctors } = useQuery({
    queryKey: ['customer-doctors'],
    queryFn: customerApi.getDoctors,
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

  useEffect(() => {
    if (!preselectedDoctorId || doctors.length === 0) return;
    const matchedDoctor = doctors.find((doctor) => doctor.id === preselectedDoctorId);
    if (matchedDoctor) {
      setSelectedDoctor((current) => (current?.id === matchedDoctor.id ? current : matchedDoctor));
    }
  }, [doctors, preselectedDoctorId]);

  useEffect(() => {
    if (!preselectedServiceId || services.length === 0) return;
    const matchedService = services.find((service) => service.id === preselectedServiceId) ?? null;
    if (matchedService) {
      setSelectedService((current) => (current?.id === matchedService.id ? current : matchedService));
    }
  }, [preselectedServiceId, services]);

  const createBookingMutation = useMutation({
    mutationFn: customerApi.createBooking,
    onSuccess: (ticket) => {
      setCreatedTicket(ticket);
      setStep(4);
    },
    onError: (e: Error) => setError(e.message),
  });

  const paymentMutation = useMutation({
    mutationFn: (bookingId: string) => customerApi.processPayment(bookingId),
    onSuccess: (ticket) => {
      setPaidTicket(ticket);
      setStep(5);
    },
    onError: (e: Error) => setError(e.message),
  });

  const handleDoctorSelect = (doctor: DoctorSummary) => {
    setSelectedDoctor(doctor);
    setSelectedShift(null);
  };

  const handlePatientInfoSubmit = (values: PatientInfoFormValues) => {
    setPatientInfo(values);
    const service = values.serviceId
      ? services.find((item) => item.id === values.serviceId) ?? null
      : null;
    setSelectedService(service);
    setError(null);

    createBookingMutation.mutate({
      shiftId: selectedShift!.id,
      fullName: values.fullName,
      phone: values.phone,
      ...(values.serviceId ? { serviceId: values.serviceId } : {}),
      ...(values.nationalId ? { nationalId: values.nationalId } : {}),
      ...(values.dateOfBirth ? { dateOfBirth: values.dateOfBirth } : {}),
      ...(values.gender ? { gender: values.gender } : {}),
      ...(values.notes ? { notes: values.notes } : {}),
    });
  };

  return (
    <div className="clinic-page" data-testid="patient-booking-page">
      <PatientNavbar />

      <main className="clinic-section space-y-6">
        <FlatTaskHeader
          icon="calendar_add_on"
          eyebrow="Đặt lịch khám"
          title="Hoàn tất lịch hẹn trong một luồng trực quan và dễ theo dõi"
          description="Trang đặt lịch được tổ chức lại theo kiểu task flow: mỗi bước chỉ hiển thị đúng lượng thông tin cần thiết, trong khi các chi tiết quan trọng luôn được giữ ở cột tóm tắt bên phải."
          actions={
            <Link to="/doctors" className="btn-secondary" data-testid="patient-booking-view-doctors">
              <span className="material-symbols-outlined text-base">groups</span>
              <span>Xem bác sĩ</span>
            </Link>
          }
          aside={
            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Bắt đầu nhanh
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <span className="material-symbols-outlined text-[20px] text-primary">calendar_add_on</span>
                  <p className="mt-3 text-sm font-semibold text-slate-950">Không cần tài khoản</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <span className="material-symbols-outlined text-[20px] text-primary">qr_code_2</span>
                  <p className="mt-3 text-sm font-semibold text-slate-950">Có mã QR check-in</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <span className="material-symbols-outlined text-[20px] text-primary">medical_information</span>
                  <p className="mt-3 text-sm font-semibold text-slate-950">Tra cứu lại bằng số điện thoại</p>
                </div>
              </div>
            </div>
          }
        />

        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
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
                    <span>Quay lại bước trước</span>
                  </button>
                )}
              </div>

              <div className="mt-5">
                <div data-testid="patient-booking-step-indicator">
                  <StepIndicator current={step} steps={STEPS} />
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 lg:p-7">
              <div className="mb-6 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Luồng đặt lịch</p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">5 bước rõ ràng</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Tra cứu lại</p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">Theo số điện thoại</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Kết quả cuối</p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">Phiếu khám điện tử</p>
                </div>
              </div>

              {error && <div className="surface-alert mb-5">{error}</div>}

              <div key={step} className="animate-clinic-enter">
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary shadow-soft">
                        <span className="material-symbols-outlined text-[22px]">groups</span>
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-slate-950">Chọn bác sĩ phù hợp</h2>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          Bắt đầu với bác sĩ bạn muốn khám. Sau khi chọn xong, hệ thống sẽ hiển thị các
                          ca còn trống theo ngày.
                        </p>
                      </div>
                    </div>

                    {loadingDoctors && (
                      <p className="text-sm text-slate-500">Đang tải danh sách bác sĩ...</p>
                    )}

                    <div className="grid gap-4 xl:grid-cols-2">
                      {doctors.map((doctor) => (
                        <DoctorCard
                          key={doctor.id}
                          doctor={doctor}
                          selected={selectedDoctor?.id === doctor.id}
                          onSelect={() => handleDoctorSelect(doctor)}
                        />
                      ))}
                    </div>

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
                      Tiếp tục chọn ca khám
                    </button>
                  </div>
                )}

                {step === 2 && selectedDoctor && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary shadow-soft">
                        <span className="material-symbols-outlined text-[22px]">calendar_month</span>
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-slate-950">Chọn ngày và ca khám</h2>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          Đã chọn <span className="font-semibold text-slate-700">{selectedDoctor.displayName}</span>
                          {selectedDoctor.specialty ? `, ${selectedDoctor.specialty.toLowerCase()}` : ''}. Vui lòng chọn ngày khám và ca còn trống để tiếp tục.
                        </p>
                      </div>
                    </div>

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
                      Tiếp tục nhập thông tin bệnh nhân
                    </button>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary shadow-soft">
                        <span className="material-symbols-outlined text-[22px]">badge</span>
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-slate-950">Thông tin bệnh nhân</h2>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          Số điện thoại sẽ được dùng để tra cứu lịch hẹn, phiếu khám và hồ sơ sức khỏe
                          sau này.
                        </p>
                      </div>
                    </div>

                    {createBookingMutation.isPending ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                        Đang tạo lịch hẹn...
                      </div>
                    ) : (
                      <PatientInfoForm
                        services={services}
                        onSubmit={handlePatientInfoSubmit}
                        initialValues={selectedService ? { serviceId: selectedService.id } : undefined}
                      />
                    )}
                  </div>
                )}

                {step === 4 && createdTicket && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary shadow-soft">
                        <span className="material-symbols-outlined text-[22px]">payments</span>
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-slate-950">Xác nhận và thanh toán</h2>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          Kiểm tra lại thông tin lịch hẹn trước khi tạo phiếu khám và lưu trạng thái thanh
                          toán.
                        </p>
                      </div>
                    </div>

                    <PaymentStep
                      ticket={createdTicket}
                      doctor={selectedDoctor}
                      shift={selectedShift}
                      service={selectedService}
                      patientName={patientInfo?.fullName ?? ''}
                      patientPhone={patientInfo?.phone ?? ''}
                      onPay={() => paymentMutation.mutate(createdTicket.bookingId)}
                      paying={paymentMutation.isPending}
                    />
                  </div>
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
                          <h2 className="mt-4 text-xl font-bold text-slate-950">Đặt lịch thành công</h2>
                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            Vui lòng lưu lại phiếu khám để xuất trình khi đến quầy tiếp nhận.
                          </p>
                        </div>
                        <QRTicket ticket={finalTicket} />
                      </div>
                    );
                  })()}
              </div>
            </div>
          </section>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="clinic-card-muted p-5" data-testid="patient-booking-step-summary">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Tóm tắt lựa chọn
              </p>
              <div className="mt-4 space-y-3">
                {STEPS.map((item, index) => {
                  const icon = STEP_ICONS[index] ?? 'check_circle';
                  const isDone = index + 1 < step;
                  const isActive = index + 1 === step;

                  return (
                    <div
                      key={item}
                      className={`flex items-center gap-3 rounded-2xl border px-3 py-3 ${
                        isActive
                          ? 'border-primary bg-white'
                          : isDone
                            ? 'border-primary/20 bg-white'
                            : 'border-slate-200 bg-white/70'
                      }`}
                    >
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full ${
                          isDone ? 'bg-primary text-white' : isActive ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {isDone ? 'check' : icon}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm ${isActive ? 'font-semibold text-primary' : 'text-slate-700'}`}>
                          {item}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="clinic-card p-5" data-testid="patient-booking-selection-summary">
              <p className="text-sm font-semibold text-slate-950">Thông tin đang chọn</p>
              <div className="mt-4 space-y-3">
                <SummaryRow label="Bác sĩ" value={selectedDoctor?.displayName ?? 'Chưa chọn'} />
                <SummaryRow label="Chuyên khoa" value={selectedDoctor?.specialty ?? 'Chưa chọn'} />
                <SummaryRow
                  label="Ngày khám"
                  value={selectedShift ? formatHumanDate(selectedShift.date) : 'Chưa chọn'}
                />
                <SummaryRow
                  label="Ca khám"
                  value={selectedShift ? selectedShift.timeRange : 'Chưa chọn'}
                />
                <SummaryRow label="Dịch vụ" value={selectedService?.name ?? 'Chưa chọn'} />
              </div>
            </div>

            <div className="clinic-card p-5">
              <p className="text-sm font-semibold text-slate-950">Lưu ý</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <li>Số điện thoại sẽ được dùng để tra cứu lịch hẹn và hồ sơ sức khỏe.</li>
                <li>Khung giờ hiển thị là thời gian tham khảo theo ca khám và số lượng bệnh nhân.</li>
                <li>Sau khi hoàn tất, bạn có thể mở lại phiếu khám tại trang lịch hẹn.</li>
              </ul>

              <Link to="/appointments" className="btn-secondary mt-5 w-full">
                <span className="material-symbols-outlined text-base">event_note</span>
                <span>Đến trang lịch hẹn</span>
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <PatientFooter />
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
