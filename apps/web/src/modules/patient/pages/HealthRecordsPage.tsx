import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { FlatTaskHeader } from '../../../components/ClinicUI';
import { RecordAccessVisual } from '../../../components/ClinicVisuals';
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
        <FlatTaskHeader
          icon="medical_information"
          eyebrow="Tra cứu"
          title="Mở lại hồ sơ, lịch hẹn và phiếu khám từ một điểm tra cứu chung"
          description="Đây là utility hub cho bệnh nhân sau khi đã đăng ký khám. Bạn có thể dùng số điện thoại để mở lại hồ sơ sức khỏe, xem lịch hẹn hiện có hoặc quay lại phiếu khám khi cần check-in."
        />

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_0.85fr]">
          <a href="#record-search" className="clinic-card overflow-hidden bg-primary text-white">
            <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_280px]">
              <div className="p-6 sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/72">
                  Điểm vào chính
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                  Tra cứu hồ sơ sức khỏe bằng số điện thoại
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-white/80">
                  Mở lại lịch sử khám, đơn thuốc, kết quả điều trị và dữ liệu liên quan trong cùng một
                  trang tra cứu.
                </p>
                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/10 px-4 py-2 text-sm font-semibold text-white">
                  <span>Mở phần tra cứu</span>
                  <span className="material-symbols-outlined text-base">arrow_downward</span>
                </div>
              </div>

              <div className="border-t border-white/12 bg-white/10 p-4 md:border-l md:border-t-0">
                <div className="rounded-[24px] bg-white p-3 shadow-soft">
                  <RecordAccessVisual />
                </div>
              </div>
            </div>
          </a>

          <div className="grid gap-4">
            <Link to="/appointments" className="clinic-card group p-5">
              <div className="clinic-icon-badge">
                <span className="material-symbols-outlined text-[22px]">event_note</span>
              </div>
              <p className="mt-4 text-lg font-semibold text-slate-950">Xem lịch hẹn và trạng thái</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Theo dõi các cuộc hẹn hiện có, số thứ tự và thời gian dự kiến đến lượt.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                <span>Đi tới lịch hẹn</span>
                <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              </div>
            </Link>

            <Link to="/appointments" className="clinic-card group p-5">
              <div className="clinic-icon-badge">
                <span className="material-symbols-outlined text-[22px]">qr_code_2</span>
              </div>
              <p className="mt-4 text-lg font-semibold text-slate-950">Mở phiếu khám và mã QR</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Quay lại phiếu khám để xuất trình tại quầy tiếp nhận khi cần check-in.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                <span>Mở phiếu khám</span>
                <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              </div>
            </Link>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="space-y-6">
            <section id="record-search" className="clinic-card overflow-hidden scroll-mt-24">
              <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
                <div className="bg-slate-50 p-6 sm:p-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                    Hồ sơ sức khỏe
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-slate-950">
                    Tra cứu bằng số điện thoại đã đăng ký
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Hệ thống sẽ mở lại hồ sơ bệnh nhân, lịch sử khám, đơn thuốc và kết quả đã lưu theo
                    số điện thoại dùng khi đặt khám.
                  </p>

                  <div className="mt-6 rounded-[24px] border border-slate-200 bg-white p-4">
                    <RecordAccessVisual />
                  </div>
                </div>

                <form
                  onSubmit={handleLookup}
                  className="p-5 sm:p-6 lg:p-7"
                  data-testid="patient-health-records-lookup-form"
                >
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
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

                  <div className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-950">Dữ liệu sẽ hiển thị khi hồ sơ đã có</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Bao gồm lịch sử khám, đơn thuốc và kết quả điều trị được lưu theo số điện thoại đã đăng ký.
                    </p>
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
                <div className="clinic-card overflow-hidden" data-testid="patient-health-records-summary">
                  <div className="bg-slate-50 px-5 py-5 sm:px-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-lg font-bold text-primary shadow-soft">
                          {getInitials(patientQuery.data.fullName)}
                        </div>
                        <div>
                          <p className="text-xl font-semibold text-slate-950">{patientQuery.data.fullName}</p>
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
                    <InfoStat label="CCCD / Hộ chiếu" value={patientQuery.data.nationalId ?? 'Chưa cập nhật'} />
                    <InfoStat label="Lượt khám đã lưu" value={String(bookings.length)} />
                    <InfoStat label="Đơn thuốc" value={String(recordStats.withPrescription)} />
                    <InfoStat label="Kết quả khám" value={String(recordStats.withMedicalRecord)} />
                  </div>
                </div>

                {loadingBookings && (
                  <div className="clinic-card p-10 text-center text-slate-500">Đang tải lịch sử khám...</div>
                )}

                {!loadingBookings && bookings.length === 0 && (
                  <div className="clinic-empty">
                    <span className="material-symbols-outlined text-5xl text-slate-300">folder_open</span>
                    <p className="mt-3 text-slate-500">Chưa có hồ sơ khám bệnh nào cho bệnh nhân này.</p>
                  </div>
                )}

                {!loadingBookings && bookings.length > 0 && (
                  <section className="clinic-card p-5 sm:p-6">
                    <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">Các lần khám đã lưu</p>
                        <p className="mt-1 text-sm text-slate-500">
                          Mỗi thẻ bên dưới đại diện cho một lần khám, bao gồm trạng thái và tài liệu liên quan.
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

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="clinic-card p-5">
              <p className="text-sm font-semibold text-slate-950">Lưu ý và hỗ trợ</p>

              <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Khi nào dữ liệu xuất hiện
                </p>
                <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
                  <li>Tra cứu áp dụng theo số điện thoại đã dùng khi đăng ký khám.</li>
                  <li>Đơn thuốc và kết quả khám chỉ xuất hiện khi hồ sơ đã được hoàn tất.</li>
                  <li>Nếu cần đặt lịch mới, bạn có thể chuyển sang luồng đặt lịch mà không cần tạo tài khoản.</li>
                </ul>
              </div>

              <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Đi nhanh tới
                </p>
                <div className="mt-3 flex flex-col gap-3">
                  <Link to="/appointments" className="btn-secondary w-full justify-between">
                    <span>Xem lịch hẹn hiện tại</span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </Link>
                  <Link to="/booking" className="btn-secondary w-full justify-between">
                    <span>Đặt lịch mới</span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </Link>
                </div>
              </div>
            </div>
          </aside>
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
