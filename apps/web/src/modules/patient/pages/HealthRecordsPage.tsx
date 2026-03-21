import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';

import { useAuth } from '../../auth/useAuth';
import { customerApi } from '../api';
import { BookingCard, RatingModal } from '../components';
import { PatientFooter } from '../components/PatientFooter';
import { PatientNavbar } from '../components/PatientNavbar';
import type { PatientBooking, MedicalRecord, Prescription } from '../types';

export function HealthRecordsPage() {
  const { user } = useAuth();

  const [phone, setPhone] = useState(user?.phone ?? '');
  const [submittedPhone, setSubmittedPhone] = useState('');
  const [lookupError, setLookupError] = useState<string>('');

  const [viewPrescription, setViewPrescription] = useState<Prescription | null>(null);
  const [viewMedRecord, setViewMedRecord] = useState<MedicalRecord | null>(null);
  const [ratingBooking, setRatingBooking] = useState<PatientBooking | null>(null);

  const queryClient = useQueryClient();

  const patientQuery = useQuery({
    queryKey: ['patient-lookup', submittedPhone],
    queryFn: () => customerApi.lookupPatient(submittedPhone),
    enabled: !!submittedPhone,
  });

  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ['patient-bookings', patientQuery.data?.id],
    queryFn: () => customerApi.getPatientBookings(patientQuery.data!.id),
    enabled: !!patientQuery.data?.id,
  });

  const ratingMutation = useMutation({
    mutationFn: ({
      bookingId,
      stars,
      comment,
    }: {
      bookingId: string;
      stars: number;
      comment: string;
    }) => customerApi.submitRating(bookingId, { stars, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-bookings', patientQuery.data?.id] });
    },
  });

  useEffect(() => {
    if (!user?.phone) return;
    setSubmittedPhone(user.phone);
  }, [user?.phone]);

  const handleLookup = (e: FormEvent) => {
    e.preventDefault();
    const normalizedPhone = phone.trim();
    if (!normalizedPhone) {
      setLookupError('Vui lòng nhập số điện thoại');
      return;
    }
    setLookupError('');
    setSubmittedPhone(normalizedPhone);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PatientNavbar />

      <div className="bg-gradient-to-br from-emerald-600 to-blue-700 text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-4">
            <span className="material-symbols-outlined text-sm">medical_information</span>
            <span className="text-sm font-medium">Lịch sử khám bệnh & điều trị</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Hồ sơ sức khỏe</h1>
          <p className="text-blue-100 max-w-2xl mx-auto">
            Tra cứu nhanh lịch sử khám, kết quả khám và đơn thuốc theo số điện thoại đăng ký.
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <form
          onSubmit={handleLookup}
          className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Số điện thoại
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nhập SĐT đã đăng ký"
                type="tel"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={patientQuery.isLoading}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {patientQuery.isLoading ? 'Đang tra cứu...' : 'Tra cứu'}
            </button>
          </div>

          {submittedPhone && !lookupError && !patientQuery.isError && (
            <p className="text-xs text-slate-500 mt-2">
              Đang hiển thị dữ liệu cho: {submittedPhone}
            </p>
          )}
          {lookupError && <p className="text-xs text-red-600 mt-2">{lookupError}</p>}
          {patientQuery.isError && !lookupError && (
            <p className="text-xs text-red-600 mt-2">
              {(patientQuery.error as Error).message ?? 'Không tìm thấy hồ sơ bệnh nhân'}
            </p>
          )}
        </form>

        {patientQuery.data && (
          <section className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Thông tin bệnh nhân</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                <div>
                  <p className="text-xs text-slate-400">Họ và tên</p>
                  <p className="text-sm font-medium text-slate-800">{patientQuery.data.fullName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Số điện thoại</p>
                  <p className="text-sm font-medium text-slate-800">{patientQuery.data.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">CCCD / Passport</p>
                  <p className="text-sm font-medium text-slate-800">
                    {patientQuery.data.nationalId ?? 'Chưa cập nhật'}
                  </p>
                </div>
              </div>
            </div>

            {loadingBookings && (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400">
                Đang tải lịch sử khám...
              </div>
            )}

            {!loadingBookings && bookings.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
                <span className="material-symbols-outlined text-slate-300 text-5xl block mb-3">
                  folder_open
                </span>
                <p className="text-slate-500 font-medium">Chưa có hồ sơ khám bệnh</p>
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
          </section>
        )}
      </main>

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
            <div className="flex justify-between pt-1 font-semibold text-blue-700">
              <span>Tổng cộng</span>
              <span>{(viewPrescription.totalCents / 100).toLocaleString('vi-VN')}đ</span>
            </div>
          </div>
        </Modal>
      )}

      {viewMedRecord && (
        <Modal title="Kết quả khám" onClose={() => setViewMedRecord(null)}>
          <div className="space-y-3 text-sm">
            <Field label="Bác sĩ" value={viewMedRecord.doctorName} />
            <Field label="Triệu chứng" value={viewMedRecord.symptoms} />
            <Field label="Chẩn đoán" value={viewMedRecord.diagnosis} />
            <Field label="Kết luận" value={viewMedRecord.conclusion} />
            {viewMedRecord.notes && <Field label="Ghi chú" value={viewMedRecord.notes} />}
          </div>
        </Modal>
      )}

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

      <PatientFooter />
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
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
