import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { customerApi } from '../api';
import {
  StepIndicator,
  DoctorCard,
  ShiftPicker,
  PatientInfoForm,
  PaymentStep,
  QRTicket,
} from '../components';
import type { PatientInfoFormValues } from '../components';
import type { DoctorSummary, AvailableShift, ClinicService, BookingTicket } from '../types';

const STEPS = ['Chọn Bác sĩ', 'Chọn Ca', 'Thông tin', 'Thanh toán', 'Vé khám'];

export function BookingPage() {
  const [step, setStep] = useState(1);

  // Step 1
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorSummary | null>(null);

  // Step 2
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split('T')[0] ?? '',
  );
  const [selectedShift, setSelectedShift] = useState<AvailableShift | null>(null);

  // Step 3
  const [patientInfo, setPatientInfo] = useState<PatientInfoFormValues | null>(null);
  const [selectedService, setSelectedService] = useState<ClinicService | null>(null);

  // Step 4-5
  const [createdTicket, setCreatedTicket] = useState<BookingTicket | null>(null);
  const [paidTicket, setPaidTicket] = useState<BookingTicket | null>(null);

  const [error, setError] = useState<string | null>(null);

  // Queries
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

  // Mutations
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

  // ===================== Step handlers =====================

  const handleDoctorSelect = (doctor: DoctorSummary) => {
    setSelectedDoctor(doctor);
    setSelectedShift(null);
  };

  const handleStep1Next = () => {
    if (!selectedDoctor) {
      setError('Vui lòng chọn một bác sĩ');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleStep2Next = () => {
    if (!selectedShift) {
      setError('Vui lòng chọn ca khám');
      return;
    }
    setError(null);
    setStep(3);
  };

  const handlePatientInfoSubmit = (values: PatientInfoFormValues) => {
    setPatientInfo(values);
    const svc = values.serviceId ? (services.find((s) => s.id === values.serviceId) ?? null) : null;
    setSelectedService(svc);
    setError(null);
    // Create the booking automatically when submitting patient info
    const bookingPayload = {
      shiftId: selectedShift!.id,
      fullName: values.fullName,
      phone: values.phone,
      ...(values.serviceId ? { serviceId: values.serviceId } : {}),
      ...(values.nationalId ? { nationalId: values.nationalId } : {}),
      ...(values.dateOfBirth ? { dateOfBirth: values.dateOfBirth } : {}),
      ...(values.gender ? { gender: values.gender } : {}),
      ...(values.notes ? { notes: values.notes } : {}),
    };
    createBookingMutation.mutate(bookingPayload);
  };

  const handlePay = () => {
    if (!createdTicket) return;
    paymentMutation.mutate(createdTicket.bookingId);
  };

  // ===================== Render =====================

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3">
        {step > 1 && step < 5 && (
          <button
            type="button"
            onClick={() => {
              setStep(step - 1);
              setError(null);
            }}
            className="text-slate-500 hover:text-slate-800 text-lg"
          >
            ←
          </button>
        )}
        <div className="flex-1">
          <h1 className="font-bold text-slate-800">Đặt lịch khám</h1>
          <p className="text-xs text-slate-400">
            Bước {step} / {STEPS.length}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 pt-5 pb-10">
        <StepIndicator current={step} steps={STEPS} />

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ── Step 1: Choose Doctor ── */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-slate-700">Chọn bác sĩ</h2>
            {loadingDoctors && (
              <p className="text-sm text-slate-400">Đang tải danh sách bác sĩ...</p>
            )}
            {doctors.map((doc) => (
              <DoctorCard
                key={doc.id}
                doctor={doc}
                selected={selectedDoctor?.id === doc.id}
                onSelect={() => handleDoctorSelect(doc)}
              />
            ))}
            <button
              type="button"
              onClick={handleStep1Next}
              className="w-full rounded-lg bg-primary py-2.5 text-white font-semibold hover:bg-primary-dark transition-colors"
            >
              Tiếp tục →
            </button>
          </div>
        )}

        {/* ── Step 2: Choose Date & Shift ── */}
        {step === 2 && selectedDoctor && (
          <div className="space-y-4">
            <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 text-sm">
              <span className="text-slate-500">Bác sĩ đã chọn: </span>
              <strong className="text-primary">{selectedDoctor.displayName}</strong>
            </div>
            <ShiftPicker
              doctorId={selectedDoctor.id}
              selectedDate={selectedDate}
              onDateChange={(d) => {
                setSelectedDate(d);
                setSelectedShift(null);
              }}
              shifts={shifts}
              selectedShiftId={selectedShift?.id ?? null}
              onShiftSelect={(id) => {
                const shift = shifts.find((s) => s.id === id) ?? null;
                setSelectedShift(shift);
              }}
              loading={loadingShifts}
            />
            <button
              type="button"
              onClick={handleStep2Next}
              className="w-full rounded-lg bg-primary py-2.5 text-white font-semibold hover:bg-primary-dark transition-colors"
            >
              Tiếp tục →
            </button>
          </div>
        )}

        {/* ── Step 3: Patient Info ── */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-slate-700">Nhập thông tin bệnh nhân</h2>
            {createBookingMutation.isPending && (
              <div className="text-center text-sm text-slate-500 py-4">Đang đặt lịch...</div>
            )}
            {!createBookingMutation.isPending && (
              <PatientInfoForm services={services} onSubmit={handlePatientInfoSubmit} />
            )}
          </div>
        )}

        {/* ── Step 4: Payment ── */}
        {step === 4 && createdTicket && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-slate-700">Xác nhận & Thanh toán</h2>
            <PaymentStep
              ticket={createdTicket}
              doctor={selectedDoctor}
              shift={selectedShift}
              service={selectedService}
              patientName={patientInfo?.fullName ?? ''}
              patientPhone={patientInfo?.phone ?? ''}
              onPay={handlePay}
              paying={paymentMutation.isPending}
            />
          </div>
        )}

        {/* ── Step 5: QR Ticket ── */}
        {step === 5 && (paidTicket ?? createdTicket) && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-1">🎉</div>
              <h2 className="text-lg font-bold text-slate-800">Đặt lịch thành công!</h2>
              <p className="text-sm text-slate-500 mt-1">
                Vui lòng xuất trình vé này khi đến phòng khám.
              </p>
            </div>
            <QRTicket ticket={paidTicket ?? createdTicket!} />
          </div>
        )}
      </div>
    </div>
  );
}
