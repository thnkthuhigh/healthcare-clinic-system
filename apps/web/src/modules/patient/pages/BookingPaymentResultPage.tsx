import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';

import { formatVndFromCents } from '../../../lib/currency';
import { customerApi } from '../api';
import { PatientFooter } from '../components/PatientFooter';
import { PatientNavbar } from '../components/PatientNavbar';
import { QRTicket } from '../components/QRTicket';

function getReadableMessage(status: string, message: string) {
  if (status === 'invalid') {
    return (
      message || 'Kết quả trả về từ cổng thanh toán không hợp lệ hoặc không thuộc giao dịch này.'
    );
  }
  if (status === 'failed') {
    return message || 'Giao dịch chưa hoàn tất hoặc đã bị hủy.';
  }
  return message;
}

function getPaymentMethodLabel(method: string | null | undefined) {
  if (method === 'VNPAY') return 'VNPAY';
  if (method === 'CASH') return 'Tiền mặt';
  if (method === 'QR') return 'QR';
  return 'Đã xác nhận';
}

export function BookingPaymentResultPage() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const status = searchParams.get('status') ?? 'failed';
  const message = getReadableMessage(status, searchParams.get('message') ?? '');

  const success = status === 'success';

  const {
    data: ticket,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['booking-payment-result', bookingId],
    queryFn: () => customerApi.getBookingTicket(bookingId!),
    enabled: success && !!bookingId,
  });

  const retryMutation = useMutation({
    mutationFn: () => customerApi.createBookingFeeVnpayPayment(bookingId!),
    onSuccess: (response) => {
      window.location.assign(response.paymentUrl);
    },
  });

  return (
    <div className="clinic-page" data-testid="patient-booking-payment-result-page">
      <PatientNavbar />

      <main className="clinic-section">
        <div className="mx-auto w-full max-w-5xl space-y-5">
          {success ? (
            <>
              <section className="overflow-hidden rounded-[32px] border border-emerald-200 bg-white shadow-sm">
                <div className="bg-[radial-gradient(circle_at_top_right,#bbf7d0,transparent_26%),linear-gradient(180deg,#f0fdf4,#ecfeff)] px-6 py-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="max-w-2xl">
                      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-soft">
                        <span className="material-symbols-outlined text-3xl">check_circle</span>
                      </div>
                      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                        Thanh toán thành công
                      </h1>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Phí giữ chỗ đã được ghi nhận. Phiếu khám của bạn đã sẵn sàng để check-in tại
                        quầy tiếp nhận.
                      </p>
                    </div>

                    {ticket && (
                      <div className="grid gap-3 sm:grid-cols-3">
                        <ResultStat
                          label="Phí đã thanh toán"
                          value={formatVndFromCents(ticket.bookingFeeCents)}
                        />
                        <ResultStat
                          label="Phương thức"
                          value={getPaymentMethodLabel(ticket.bookingFeePaymentMethod)}
                        />
                        <ResultStat label="Trạng thái" value="Sẵn sàng check-in" />
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {isLoading && (
                <section className="rounded-[28px] border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
                  Đang tải phiếu khám...
                </section>
              )}

              {error && (
                <section className="rounded-[28px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                  {(error as Error)?.message ?? 'Không tải được phiếu khám sau thanh toán.'}
                </section>
              )}

              {ticket && <QRTicket ticket={ticket} />}
            </>
          ) : (
            <section className="rounded-[32px] border border-red-200 bg-[linear-gradient(180deg,#fef2f2,#fff7ed)] p-6 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-red-600 shadow-soft">
                <span className="material-symbols-outlined text-3xl">cancel</span>
              </div>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                {status === 'invalid' ? 'Giao dịch không hợp lệ' : 'Thanh toán chưa hoàn tất'}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
            </section>
          )}

          <section className="flex flex-wrap justify-center gap-3">
            {!success && bookingId && (
              <button
                type="button"
                onClick={() => retryMutation.mutate()}
                disabled={retryMutation.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <span className="material-symbols-outlined text-base">refresh</span>
                {retryMutation.isPending ? 'Đang chuyển sang VNPAY...' : 'Thử lại thanh toán'}
              </button>
            )}

            <Link to="/appointments" className="btn-secondary">
              Xem lịch hẹn
            </Link>

            <Link to="/booking" className="btn-secondary">
              Đặt lịch mới
            </Link>
          </section>
        </div>
      </main>

      <PatientFooter />
    </div>
  );
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/70 bg-white/80 px-4 py-4 shadow-sm backdrop-blur-sm">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}
