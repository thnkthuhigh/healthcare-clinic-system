import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useAuth } from '../../auth/useAuth';
import { customerApi } from '../api';
import { BookingCard, RatingModal } from '../components';
import { PatientFooter } from '../components/PatientFooter';
import { PatientNavbar } from '../components/PatientNavbar';
import type { MedicalRecord, PatientBooking, Prescription } from '../types';

function getInitials(name: string) {
  return name
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function HealthRecordsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [submittedPhone, setSubmittedPhone] = useState('');
  const [lookupError, setLookupError] = useState('');
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
    if (user?.phone) {
      setPhone(user.phone);
      setSubmittedPhone(user.phone);
    }
  }, [user?.phone]);

  useEffect(() => {
    const phoneFromQuery = searchParams.get('phone')?.trim();
    if (!phoneFromQuery || user?.phone) return;
    setPhone(phoneFromQuery);
    setSubmittedPhone(phoneFromQuery);
    setLookupError('');
  }, [searchParams, user?.phone]);

  const handleLookup = (event: FormEvent) => {
    event.preventDefault();
    const normalizedPhone = phone.trim();
    if (!normalizedPhone) {
      setLookupError('Vui lòng nhập số điện thoại đã đăng ký.');
      return;
    }
    setLookupError('');
    setSubmittedPhone(normalizedPhone);
  };

  const recordStats = useMemo(() => {
    const completed = bookings.filter((booking) => booking.status === 'COMPLETED').length;
    const withPrescription = bookings.filter((booking) => booking.prescription).length;
    const withMedicalRecord = bookings.filter((booking) => booking.medicalRecord).length;
    return { completed, withPrescription, withMedicalRecord };
  }, [bookings]);

  return (
    <div className="clinic-page" data-testid="patient-health-records-page">
      <PatientNavbar />

      <main className="clinic-section space-y-6">
        <div className="grid gap-6">
          <section className="space-y-6">
            <section id="record-search" className="clinic-card overflow-hidden scroll-mt-24">
              <div>
                <form
                  onSubmit={handleLookup}
                  className="p-5 sm:p-6 lg:p-7"
                  data-testid="patient-health-records-lookup-form"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                      Hồ sơ khám bệnh
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                      Tra cứu hồ sơ khám bệnh
                    </h2>
                  </div>

                  <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <label className="field-label">Số điện thoại</label>
                    <input
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="Nhập số điện thoại đã đăng ký"
                      type="tel"
                      className="input-field"
                      data-testid="patient-health-records-phone"
                    />
                    <button
                      type="submit"
                      disabled={patientQuery.isLoading}
                      className="btn-primary mt-4 w-full"
                      data-testid="patient-health-records-submit"
                    >
                      {patientQuery.isLoading ? 'Đang tra cứu' : 'Tra cứu hồ sơ'}
                    </button>
                  </div>

                  {submittedPhone && !lookupError && !patientQuery.isError && (
                    <p className="mt-4 text-xs text-slate-500">
                      Đang hiển thị dữ liệu cho số: {submittedPhone}
                    </p>
                  )}
                  {lookupError && <p className="mt-4 text-xs text-red-600">{lookupError}</p>}
                  {patientQuery.isError && !lookupError && (
                    <p className="mt-4 text-xs text-red-600">
                      {(patientQuery.error as Error).message ?? 'Không tìm thấy hồ sơ bệnh nhân.'}
                    </p>
                  )}
                </form>
              </div>
            </section>

            {patientQuery.data && (
              <section className="space-y-4">
                <div
                  className="clinic-card overflow-hidden"
                  data-testid="patient-health-records-summary"
                >
                  <div className="bg-slate-50 px-5 py-5 sm:px-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-lg font-bold text-primary shadow-soft">
                          {getInitials(patientQuery.data.fullName)}
                        </div>
                        <div>
                          <p className="text-xl font-semibold text-slate-950">
                            {patientQuery.data.fullName}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">{patientQuery.data.phone}</p>
                        </div>
                      </div>
                      <Link to="/booking" className="btn-secondary w-fit">
                        <span className="material-symbols-outlined text-base">calendar_add_on</span>
                        <span>Đặt lịch mới</span>
                      </Link>
                    </div>
                  </div>

                  <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
                    <InfoStat
                      label="CCCD / Hộ chiếu"
                      value={patientQuery.data.nationalId ?? 'Chưa cập nhật'}
                    />
                    <InfoStat label="Lượt khám đã lưu" value={String(bookings.length)} />
                    <InfoStat label="Đơn thuốc" value={String(recordStats.withPrescription)} />
                    <InfoStat label="Kết quả khám" value={String(recordStats.withMedicalRecord)} />
                  </div>
                </div>

                {loadingBookings && (
                  <div className="clinic-card p-10 text-center text-slate-500">
                    Đang tải lịch sử khám...
                  </div>
                )}

                {!loadingBookings && bookings.length === 0 && (
                  <div className="clinic-empty">
                    <span className="material-symbols-outlined text-5xl text-slate-300">
                      folder_open
                    </span>
                    <p className="mt-3 text-slate-500">
                      Chưa có hồ sơ khám bệnh nào cho bệnh nhân này.
                    </p>
                  </div>
                )}

                {!loadingBookings && bookings.length > 0 && (
                  <section className="clinic-card p-5 sm:p-6">
                    <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">Các lần khám đã lưu</p>
                        <p className="mt-1 text-sm text-slate-500">
                          Mỗi thẻ bên dưới đại diện cho một lần khám, bao gồm trạng thái và tài liệu
                          liên quan.
                        </p>
                      </div>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {recordStats.completed} lượt đã hoàn thành
                      </span>
                    </div>

                    <div className="mt-5 space-y-4" data-testid="patient-health-records-bookings">
                      {bookings.map((booking) => (
                        <BookingCard
                          key={booking.bookingId}
                          booking={booking}
                          onViewPrescription={() => setViewPrescription(booking.prescription)}
                          onViewLabResults={() => setViewMedRecord(booking.medicalRecord)}
                          onRate={() => setRatingBooking(booking)}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </section>
            )}
          </section>
        </div>
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
                    {item.dosage ? ` - ${item.dosage}` : ''}
                    {item.note ? ` (${item.note})` : ''}
                  </p>
                </div>
                <span className="self-center text-xs text-slate-500">
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

function InfoStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
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
      className="clinic-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="clinic-modal-panel w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <p className="font-semibold text-slate-800">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 transition-colors hover:text-slate-700"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="mb-1 text-xs text-slate-400">{label}</p>
      <p className="rounded-xl bg-slate-50 px-3 py-2 text-slate-700">{value}</p>
    </div>
  );
}
