import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { customerApi } from '../api';
import { BookingCard, RatingModal } from '../components';
import type { PatientBooking, MedicalRecord, Prescription } from '../types';

export function HealthProfilePage() {
  const [phone, setPhone] = useState('');
  const [submittedPhone, setSubmittedPhone] = useState('');
  const [patientId, setPatientId] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Modal states
  const [viewPrescription, setViewPrescription] = useState<Prescription | null>(null);
  const [viewMedRecord, setViewMedRecord] = useState<MedicalRecord | null>(null);
  const [ratingBooking, setRatingBooking] = useState<PatientBooking | null>(null);

  const queryClient = useQueryClient();

  // Lookup mutation (triggered on form submit)
  const lookupMutation = useMutation({
    mutationFn: () => customerApi.lookupPatient(submittedPhone),
    onSuccess: (p) => {
      setPatientId(p.id);
      setLookupError(null);
    },
    onError: (e: Error) => setLookupError(e.message),
  });

  // Bookings query
  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['patient-bookings', patientId],
    queryFn: () => customerApi.getPatientBookings(patientId!),
    enabled: !!patientId,
  });

  const ratingMutation = useMutation({
    mutationFn: ({ bookingId, stars, comment }: { bookingId: string; stars: number; comment: string }) =>
      customerApi.submitRating(bookingId, { stars, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-bookings', patientId] });
    },
  });

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setSubmittedPhone(phone.trim());
    setPatientId(null);
    setLookupError(null);
    // Trigger lookup after updating submittedPhone via callback trick
    setTimeout(() => lookupMutation.mutate(), 0);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-3">
        <h1 className="font-bold text-slate-800">Hồ sơ sức khỏe</h1>
        <p className="text-xs text-slate-400">Tra cứu lịch sử khám bệnh của bạn</p>
      </div>

      <div className="mx-auto max-w-lg px-4 pt-5 pb-10 space-y-5">
        {/* Phone lookup form */}
        <form onSubmit={handleLookup} className="bg-white rounded-xl border border-slate-100 shadow-soft p-4 space-y-3">
          <p className="text-sm font-medium text-slate-700">Tra cứu bằng số điện thoại</p>
          <div className="flex gap-2">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Nhập SĐT đã đăng ký"
              type="tel"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              disabled={lookupMutation.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm text-white font-semibold hover:bg-primary-dark disabled:opacity-50"
            >
              {lookupMutation.isPending ? '...' : 'Tìm'}
            </button>
          </div>
          {lookupError && <p className="text-xs text-red-500">{lookupError}</p>}
        </form>

        {/* Booking list */}
        {patientId && (
          <>
            {loadingBookings && (
              <p className="text-center text-sm text-slate-400 py-6">Đang tải lịch sử...</p>
            )}
            {!loadingBookings && bookings.length === 0 && (
              <div className="text-center py-10 text-slate-400">
                <p className="text-4xl mb-2">📋</p>
                <p>Chưa có lịch sử khám bệnh</p>
              </div>
            )}
            {bookings.map((booking) => (
              <BookingCard
                key={booking.bookingId}
                booking={booking}
                onViewPrescription={() => setViewPrescription(booking.prescription)}
                onViewLabResults={() => setViewMedRecord(booking.medicalRecord)}
                onRate={() => setRatingBooking(booking)}
              />
            ))}
          </>
        )}
      </div>

      {/* ── Prescription Modal ── */}
      {viewPrescription && (
        <Modal title="Đơn thuốc" onClose={() => setViewPrescription(null)}>
          <div className="space-y-2 text-sm">
            {viewPrescription.items.map((item) => (
              <div key={item.id} className="flex justify-between border-b border-slate-100 pb-2">
                <div>
                  <p className="font-medium text-slate-800">{item.medicationName}</p>
                  <p className="text-xs text-slate-500">
                    {item.qty} {item.unit}
                    {item.dosage ? ` — ${item.dosage}` : ''}
                    {item.note ? ` (${item.note})` : ''}
                  </p>
                </div>
                <span className="text-xs text-slate-500 self-center">
                  {(item.totalCents / 100).toLocaleString('vi-VN')}đ
                </span>
              </div>
            ))}
            <div className="flex justify-between pt-1 font-semibold text-primary">
              <span>Tổng cộng</span>
              <span>{(viewPrescription.totalCents / 100).toLocaleString('vi-VN')}đ</span>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Medical Record Modal ── */}
      {viewMedRecord && (
        <Modal title="Kết quả khám / Xét nghiệm" onClose={() => setViewMedRecord(null)}>
          <div className="space-y-3 text-sm">
            <Field label="Bác sĩ" value={viewMedRecord.doctorName} />
            <Field label="Triệu chứng" value={viewMedRecord.symptoms} />
            <Field label="Chẩn đoán" value={viewMedRecord.diagnosis} />
            <Field label="Kết luận" value={viewMedRecord.conclusion} />
            {viewMedRecord.notes && <Field label="Ghi chú" value={viewMedRecord.notes} />}
          </div>
        </Modal>
      )}

      {/* ── Rating Modal ── */}
      {ratingBooking && (
        <RatingModal
          bookingId={ratingBooking.bookingId}
          doctorName={ratingBooking.doctorName}
          onSubmit={async (stars, comment) => {
            await ratingMutation.mutateAsync({
              bookingId: ratingBooking.bookingId,
              stars,
              comment,
            });
          }}
          onClose={() => setRatingBooking(null)}
        />
      )}
    </div>
  );
}

// Helper components

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <p className="font-semibold text-slate-800">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl"
          >
            ×
          </button>
        </div>
        <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className="text-slate-700 bg-slate-50 rounded px-2 py-1.5">{value}</p>
    </div>
  );
}
