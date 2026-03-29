import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { formatDateTimeUtc7, formatDateUtc7 } from '../../../lib/time';
import { useAuth } from '../../auth/useAuth';
import { customerApi } from '../api';
import { RatingModal } from '../components';
import { PatientFooter } from '../components/PatientFooter';
import { PatientNavbar } from '../components/PatientNavbar';
import type { MedicalRecord, PatientBooking, Prescription } from '../types';

type RecordTab = 'overview' | 'lab' | 'prescription' | 'invoice';

const STATUS_BADGE: Record<string, string> = {
  BOOKED: 'bg-blue-100 text-blue-700',
  CHECKED_IN: 'bg-cyan-100 text-cyan-700',
  WAITING: 'bg-amber-100 text-amber-700',
  IN_CONSULTATION: 'bg-purple-100 text-purple-700',
  PENDING_LAB: 'bg-orange-100 text-orange-700',
  RESULTS_READY: 'bg-teal-100 text-teal-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELED: 'bg-slate-200 text-slate-600',
  NO_SHOW: 'bg-rose-100 text-rose-700',
};

const STATUS_LABEL: Record<string, string> = {
  BOOKED: 'Đã đặt',
  CHECKED_IN: 'Đã check-in',
  WAITING: 'Chờ khám',
  IN_CONSULTATION: 'Đang khám',
  PENDING_LAB: 'Chờ xét nghiệm',
  RESULTS_READY: 'Có kết quả xét nghiệm',
  COMPLETED: 'Đã hoàn thành',
  CANCELED: 'Đã hủy',
  NO_SHOW: 'Vắng mặt',
};

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

function formatMoney(cents: number | null | undefined) {
  const safe = cents ?? 0;
  return `${(safe / 100).toLocaleString('vi-VN')} đ`;
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
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [recordTab, setRecordTab] = useState<RecordTab>('overview');
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

  const sortedBookings = useMemo(
    () =>
      [...bookings].sort(
        (a, b) =>
          new Date(b.appointmentTime || b.createdAt).getTime() -
          new Date(a.appointmentTime || a.createdAt).getTime(),
      ),
    [bookings],
  );

  const selectedBooking = useMemo(
    () => sortedBookings.find((booking) => booking.bookingId === selectedBookingId) ?? null,
    [selectedBookingId, sortedBookings],
  );

  useEffect(() => {
    if (sortedBookings.length === 0) {
      setSelectedBookingId('');
      return;
    }
    if (
      !selectedBookingId ||
      !sortedBookings.some((item) => item.bookingId === selectedBookingId)
    ) {
      setSelectedBookingId(sortedBookings[0]!.bookingId);
      setRecordTab('overview');
    }
  }, [selectedBookingId, sortedBookings]);

  return (
    <div className="clinic-page" data-testid="patient-health-records-page">
      <PatientNavbar />

      <main className="clinic-section space-y-6">
        <div className="grid gap-6">
          <section className="space-y-6">
            <section id="record-search" className="clinic-card overflow-hidden scroll-mt-24">
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
                    <InfoStat label="Lịch sử khám" value={String(bookings.length)} />
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
                      <p className="text-sm font-semibold text-slate-950">Lịch sử khám bệnh</p>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {recordStats.completed} lượt đã hoàn thành
                      </span>
                    </div>

                    <div
                      className="mt-5 grid gap-5 lg:grid-cols-[minmax(260px,0.35fr)_minmax(0,1fr)]"
                      data-testid="patient-health-records-bookings"
                    >
                      <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <p className="px-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Mục lục sổ khám
                        </p>
                        <div className="mt-3 space-y-2">
                          {sortedBookings.map((booking) => {
                            const active = booking.bookingId === selectedBookingId;
                            return (
                              <button
                                key={booking.bookingId}
                                type="button"
                                onClick={() => {
                                  setSelectedBookingId(booking.bookingId);
                                  setRecordTab('overview');
                                }}
                                className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                                  active
                                    ? 'border-primary bg-primary/10'
                                    : 'border-slate-200 bg-white hover:border-primary/40'
                                }`}
                              >
                                <p className="text-sm font-semibold text-slate-900">
                                  {formatDateUtc7(booking.date, {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                  })}
                                </p>
                                <p className="mt-1 text-xs text-slate-600">
                                  {booking.serviceName ?? 'Dịch vụ khám'}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                  BS. {booking.doctorName}
                                </p>
                                <span
                                  className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_BADGE[booking.status] ?? 'bg-slate-200 text-slate-700'}`}
                                >
                                  {STATUS_LABEL[booking.status] ?? booking.status}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </aside>

                      <section className="space-y-4">
                        {selectedBooking && (
                          <>
                            <div className="rounded-2xl border border-slate-200 bg-white p-5">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                                    Trang sổ khám
                                  </p>
                                  <h3 className="mt-1 text-xl font-semibold text-slate-950">
                                    Hồ sơ khám bệnh ngày{' '}
                                    {formatDateUtc7(selectedBooking.date, {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                    })}
                                  </h3>
                                  <p className="mt-1 text-sm text-slate-600">
                                    Bác sĩ điều trị:{' '}
                                    <span className="font-semibold">
                                      BS. {selectedBooking.doctorName}
                                    </span>
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span
                                    className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${STATUS_BADGE[selectedBooking.status] ?? 'bg-slate-200 text-slate-700'}`}
                                  >
                                    {STATUS_LABEL[selectedBooking.status] ?? selectedBooking.status}
                                  </span>
                                  <p className="mt-2 text-xs text-slate-500">
                                    {selectedBooking.followUp && selectedBooking.followUpScheduledAt
                                      ? `Lịch tái khám: ${formatDateTimeUtc7(selectedBooking.followUpScheduledAt)}`
                                      : `Khung giờ dự kiến: ${selectedBooking.timeRange}`}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-4 flex flex-wrap gap-2">
                                {(
                                  ['overview', 'lab', 'prescription', 'invoice'] as RecordTab[]
                                ).map((tab) => (
                                  <button
                                    key={tab}
                                    type="button"
                                    onClick={() => setRecordTab(tab)}
                                    className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                                      recordTab === tab
                                        ? 'bg-primary text-white'
                                        : 'border border-slate-200 bg-white text-slate-600'
                                    }`}
                                  >
                                    {tab === 'overview' && 'Tổng quan'}
                                    {tab === 'lab' && 'Kết quả xét nghiệm'}
                                    {tab === 'prescription' && 'Đơn thuốc'}
                                    {tab === 'invoice' && 'Hóa đơn'}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {recordTab === 'overview' && (
                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                    Chỉ số sinh tồn & triệu chứng
                                  </p>
                                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                                    <InfoStat label="Cân nặng" value="Chưa cập nhật" />
                                    <InfoStat label="Chiều cao" value="Chưa cập nhật" />
                                    <InfoStat label="Huyết áp" value="Chưa cập nhật" />
                                    <InfoStat label="Nhịp tim" value="Chưa cập nhật" />
                                  </div>
                                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                      Triệu chứng
                                    </p>
                                    <p className="mt-1">
                                      {selectedBooking.medicalRecord?.symptoms ??
                                        'Chưa có thông tin triệu chứng.'}
                                    </p>
                                  </div>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                    Kết luận & chẩn đoán
                                  </p>
                                  <div className="mt-3 space-y-3 text-sm">
                                    <Field
                                      label="Chẩn đoán"
                                      value={
                                        selectedBooking.medicalRecord?.diagnosis ?? 'Chưa cập nhật'
                                      }
                                    />
                                    <Field
                                      label="Kết luận"
                                      value={
                                        selectedBooking.medicalRecord?.conclusion ?? 'Chưa cập nhật'
                                      }
                                    />
                                    <Field
                                      label="Dịch vụ đã khám"
                                      value={selectedBooking.serviceName ?? 'Chưa cập nhật'}
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {recordTab === 'lab' && (
                              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                  Cận lâm sàng & file đính kèm
                                </p>
                                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                                  {selectedBooking.medicalRecord?.notes ??
                                    'Chưa có kết quả xét nghiệm hoặc file đính kèm.'}
                                </div>
                                {selectedBooking.medicalRecord && (
                                  <button
                                    type="button"
                                    onClick={() => setViewMedRecord(selectedBooking.medicalRecord)}
                                    className="mt-3 text-sm font-semibold text-primary underline underline-offset-2"
                                  >
                                    Xem bản ghi chi tiết
                                  </button>
                                )}
                              </div>
                            )}

                            {recordTab === 'prescription' && (
                              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                  Đơn thuốc điện tử
                                </p>
                                {!selectedBooking.prescription ||
                                selectedBooking.prescription.items.length === 0 ? (
                                  <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                                    Chưa có đơn thuốc cho lần khám này.
                                  </p>
                                ) : (
                                  <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                                    <table className="min-w-full text-sm">
                                      <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.12em] text-slate-500">
                                        <tr>
                                          <th className="px-3 py-2">Thuốc</th>
                                          <th className="px-3 py-2">Số lượng</th>
                                          <th className="px-3 py-2">Liều dùng</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {selectedBooking.prescription.items.map((item) => (
                                          <tr key={item.id} className="border-t border-slate-100">
                                            <td className="px-3 py-2 font-medium text-slate-800">
                                              {item.medicationName}
                                            </td>
                                            <td className="px-3 py-2 text-slate-700">
                                              {item.qty} {item.unit}
                                            </td>
                                            <td className="px-3 py-2 text-slate-700">
                                              {item.dosage ?? 'Theo chỉ định bác sĩ'}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                                {selectedBooking.prescription && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setViewPrescription(selectedBooking.prescription)
                                    }
                                    className="mt-3 text-sm font-semibold text-primary underline underline-offset-2"
                                  >
                                    Xem đơn thuốc đầy đủ
                                  </button>
                                )}
                              </div>
                            )}

                            {recordTab === 'invoice' && (
                              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                  Hóa đơn lần khám
                                </p>
                                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                  <InfoStat
                                    label="Phí dịch vụ khám"
                                    value={formatMoney(selectedBooking.servicePriceCents)}
                                  />
                                  <InfoStat
                                    label="Phí xét nghiệm"
                                    value={formatMoney(selectedBooking.labFeeCents)}
                                  />
                                  <InfoStat
                                    label="Tiền thuốc"
                                    value={formatMoney(selectedBooking.prescriptionAmountCents)}
                                  />
                                  <InfoStat
                                    label="Tổng thanh toán"
                                    value={formatMoney(selectedBooking.totalBillCents)}
                                  />
                                </div>
                                <p className="mt-3 text-sm text-slate-600">
                                  Trạng thái thanh toán:{' '}
                                  <span className="font-semibold">
                                    {selectedBooking.paymentStatus === 'PAID'
                                      ? 'Đã thanh toán'
                                      : 'Chưa thanh toán'}
                                  </span>
                                </p>
                              </div>
                            )}

                            {!selectedBooking.ratingStars &&
                              selectedBooking.status === 'COMPLETED' && (
                                <button
                                  type="button"
                                  onClick={() => setRatingBooking(selectedBooking)}
                                  className="text-sm font-semibold text-primary underline underline-offset-2"
                                >
                                  Gửi đánh giá cho bác sĩ
                                </button>
                              )}
                          </>
                        )}
                      </section>
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
                  {formatMoney(item.totalCents)}
                </span>
              </div>
            ))}
            <div className="flex justify-between pt-1 font-semibold text-primary">
              <span>Tổng cộng</span>
              <span>{formatMoney(viewPrescription.totalCents)}</span>
            </div>
          </div>
        </Modal>
      )}

      {viewMedRecord && (
        <Modal title="Kết quả khám" onClose={() => setViewMedRecord(null)}>
          <div className="space-y-3 text-sm">
            <Field label="Bác sĩ" value={viewMedRecord.doctorName} />
            <Field label="Triệu chứng" value={viewMedRecord.symptoms ?? 'Chưa cập nhật'} />
            <Field label="Chẩn đoán" value={viewMedRecord.diagnosis ?? 'Chưa cập nhật'} />
            <Field label="Kết luận" value={viewMedRecord.conclusion ?? 'Chưa cập nhật'} />
            <Field label="Ghi chú" value={viewMedRecord.notes ?? 'Chưa cập nhật'} />
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
      <div className="clinic-modal-panel w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
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
  return (
    <div>
      <p className="mb-1 text-xs text-slate-400">{label}</p>
      <p className="rounded-xl bg-slate-50 px-3 py-2 text-slate-700">{value || 'Chưa cập nhật'}</p>
    </div>
  );
}
