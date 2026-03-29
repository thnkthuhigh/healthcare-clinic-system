import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { formatVndFromCents } from '../../../lib/currency';

const MOCK_COMPLETE_URL = 'http://localhost:4000/api/v1/payments/vnpay/mock/complete';

type BankCode = 'VNPAYQR' | 'VNBANK' | 'INTCARD';

const BANK_OPTIONS: Array<{
  code: BankCode;
  title: string;
  description: string;
  icon: string;
  badge: string;
}> = [
  {
    code: 'VNPAYQR',
    title: 'Quét mã QR',
    description: 'Phù hợp cho người dùng muốn xác nhận nhanh trên điện thoại.',
    icon: 'qr_code_2',
    badge: 'Nhanh nhất',
  },
  {
    code: 'VNBANK',
    title: 'ATM nội địa',
    description: 'Mô phỏng thanh toán bằng tài khoản hoặc thẻ ngân hàng nội địa.',
    icon: 'account_balance',
    badge: 'Phổ biến',
  },
  {
    code: 'INTCARD',
    title: 'Thẻ quốc tế',
    description: 'Dùng cho luồng Visa, Mastercard hoặc JCB trong môi trường demo.',
    icon: 'credit_card',
    badge: 'Visa / Mastercard',
  },
];

const MOCK_PAYMENT_FIXTURES: Record<
  Exclude<BankCode, 'VNPAYQR'>,
  { accountNumber: string; accountName: string; expiry: string; otp: string }
> = {
  VNBANK: {
    accountNumber: '9704198526191432198',
    accountName: 'NGUYEN VAN A',
    expiry: '07/15',
    otp: '123456',
  },
  INTCARD: {
    accountNumber: '4456530000001005',
    accountName: 'NGUYEN VAN A',
    expiry: '12/26',
    otp: '123',
  },
};

function buildMockCallbackUrl(
  txnRef: string,
  bankCode: BankCode,
  status: 'success' | 'cancelled',
  confirmed: boolean,
) {
  const params = new URLSearchParams({
    txnRef,
    bankCode,
    status,
    confirmed: confirmed ? '1' : '0',
  });
  return `${MOCK_COMPLETE_URL}?${params.toString()}`;
}

function formatExpiry(value: string | null) {
  if (!value) return '15 phút kể từ khi tạo giao dịch';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '15 phút kể từ khi tạo giao dịch';

  return date.toLocaleString('vi-VN');
}

function buildMethodHint(bankCode: BankCode) {
  if (bankCode === 'VNPAYQR') {
    return 'Bạn chỉ cần bấm xác nhận để mô phỏng việc quét mã và hoàn tất giao dịch.';
  }
  if (bankCode === 'VNBANK') {
    return 'Điền thông tin bất kỳ để mô phỏng màn nhập thẻ hoặc tài khoản ngân hàng nội địa.';
  }
  return 'Điền thông tin thẻ demo để mô phỏng thanh toán bằng thẻ quốc tế.';
}

export function MockVnpayPage() {
  const [searchParams] = useSearchParams();
  const txnRef = searchParams.get('txnRef') ?? '';
  const orderInfo = searchParams.get('orderInfo') ?? 'Thanh toán dịch vụ y tế';
  const amountCents = Number(searchParams.get('amount') ?? '0');
  const expiresAt = searchParams.get('expiresAt');

  const [bankCode, setBankCode] = useState<BankCode>('VNPAYQR');
  const [accountNumber, setAccountNumber] = useState('9704198526191432198');
  const [accountName, setAccountName] = useState('NGUYEN VAN A');
  const [expiry, setExpiry] = useState('07/15');
  const [otp, setOtp] = useState('123456');
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const formattedAmount = useMemo(
    () => formatVndFromCents(Number.isFinite(amountCents) ? amountCents : 0),
    [amountCents],
  );
  const selectedOption = useMemo(
    () => BANK_OPTIONS.find((option) => option.code === bankCode) ?? BANK_OPTIONS[0]!,
    [bankCode],
  );

  useEffect(() => {
    if (bankCode === 'VNPAYQR') {
      setValidationError(null);
      return;
    }
    const fixture = MOCK_PAYMENT_FIXTURES[bankCode];
    setAccountNumber(fixture.accountNumber);
    setAccountName(fixture.accountName);
    setExpiry(fixture.expiry);
    setOtp(fixture.otp);
    setValidationError(null);
  }, [bankCode]);

  if (!txnRef) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-10">
        <div className="mx-auto max-w-xl rounded-[28px] border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-950">Không tìm thấy giao dịch thanh toán</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Hãy quay lại hệ thống và tạo lại yêu cầu thanh toán mới.
          </p>
        </div>
      </main>
    );
  }

  const handleSubmit = () => {
    if (bankCode !== 'VNPAYQR') {
      const validationMessage = validateMockPayment(bankCode, {
        accountNumber,
        accountName,
        expiry,
        otp,
      });
      if (validationMessage) {
        setValidationError(validationMessage);
        return;
      }
    }

    setValidationError(null);
    setSubmitting(true);
    window.location.assign(buildMockCallbackUrl(txnRef, bankCode, 'success', true));
  };

  const handleCancel = () => {
    setValidationError(null);
    window.location.assign(buildMockCallbackUrl(txnRef, bankCode, 'cancelled', false));
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe,transparent_26%),linear-gradient(180deg,#f8fafc,#eef2ff_58%,#e2e8f0)] px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[36px] border border-slate-200/80 bg-white shadow-[0_30px_90px_-48px_rgba(15,23,42,0.45)]">
          <section className="relative overflow-hidden bg-slate-950 px-6 py-6 text-white sm:px-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.35),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.18),transparent_24%)]" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">
                  VNPAY Demo Local
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-[2.2rem]">
                  Cổng thanh toán mô phỏng
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  Màn hình này dùng để demo luồng thanh toán VNPAY ở môi trường local. Bạn chọn
                  phương thức, xác nhận giao dịch và hệ thống sẽ quay về ứng dụng như một lần thanh
                  toán thành công.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <HeaderStat label="Nội dung thanh toán" value={orderInfo} />
                <HeaderStat label="Số tiền" value={formattedAmount} emphasize />
              </div>
            </div>
          </section>

          <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
            <section className="space-y-5 px-6 py-6 sm:px-8">
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Giao dịch đang chờ xác nhận
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">{orderInfo}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right shadow-sm">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Hết hạn</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatExpiry(expiresAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-900">
                  Demo local không kết nối tới cổng VNPAY thật. Bạn không cần mã cấu hình merchant
                  để chạy luồng này.
                </div>
              </div>

              <div>
                <p className="text-lg font-semibold text-slate-950">Chọn phương thức thanh toán</p>
                <p className="mt-1 text-sm text-slate-500">
                  Giao diện mô phỏng cách người dùng chọn QR, ATM nội địa hoặc thẻ quốc tế.
                </p>

                <div className="mt-4 grid gap-3">
                  {BANK_OPTIONS.map((option) => {
                    const active = bankCode === option.code;
                    return (
                      <button
                        key={option.code}
                        type="button"
                        onClick={() => setBankCode(option.code)}
                        className={`group rounded-[28px] border px-5 py-4 text-left transition ${
                          active
                            ? 'border-slate-950 bg-slate-950 text-white shadow-[0_20px_45px_-28px_rgba(15,23,42,0.9)]'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${
                              active ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[24px]">
                              {option.icon}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-base font-semibold">{option.title}</p>
                              <span
                                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                                  active ? 'bg-white/10 text-sky-200' : 'bg-sky-50 text-sky-700'
                                }`}
                              >
                                {option.badge}
                              </span>
                            </div>
                            <p
                              className={`mt-2 text-sm leading-6 ${
                                active ? 'text-slate-300' : 'text-slate-500'
                              }`}
                            >
                              {option.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="border-t border-slate-200 bg-slate-50/80 px-6 py-6 sm:px-8 lg:border-l lg:border-t-0">
              <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Xác nhận thanh toán
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                      {selectedOption.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {buildMethodHint(bankCode)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-950 px-4 py-3 text-right text-white">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Thanh toán</p>
                    <p className="mt-1 text-xl font-semibold">{formattedAmount}</p>
                  </div>
                </div>

                {bankCode === 'VNPAYQR' ? (
                  <div className="mt-5 space-y-4">
                    <div className="mx-auto flex h-64 w-full max-w-[280px] items-center justify-center rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_center,#ffffff_0,#ffffff_36%,#e2e8f0_100%)] p-5 shadow-inner">
                      <div className="grid h-full w-full grid-cols-5 gap-2 rounded-[28px] bg-white p-3 shadow-sm">
                        {Array.from({ length: 25 }).map((_, index) => (
                          <div
                            key={index}
                            className={`rounded-[10px] ${
                              [0, 1, 3, 5, 7, 8, 10, 11, 13, 15, 17, 18, 20, 21, 23, 24].includes(
                                index,
                              )
                                ? 'bg-slate-950'
                                : 'bg-slate-100'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-900">
                      Mã QR này chỉ dùng để trình diễn. Khi bấm xác nhận, hệ thống sẽ xử lý như một
                      giao dịch VNPAY đã hoàn tất thành công.
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    <div className="grid gap-3">
                      <Field
                        label={bankCode === 'VNBANK' ? 'Số thẻ / tài khoản' : 'Số thẻ'}
                        value={accountNumber}
                        onChange={setAccountNumber}
                      />
                      <Field label="Tên chủ thẻ" value={accountName} onChange={setAccountName} />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Hiệu lực" value={expiry} onChange={setExpiry} />
                        <Field
                          label={bankCode === 'INTCARD' ? 'CVV' : 'OTP xác thực'}
                          value={otp}
                          onChange={setOtp}
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                      Đây là biểu mẫu demo local. Hệ thống đã điền sẵn bộ thẻ test hợp lệ cho phương
                      thức này. Nếu sửa sai số thẻ, ngày hiệu lực hoặc OTP/CVV thì giao dịch sẽ bị
                      từ chối.
                    </div>
                  </div>
                )}

                {validationError && (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                    {validationError}
                  </div>
                )}

                <div className="mt-6 flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Hủy giao dịch
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                    {submitting ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function normalizeCompact(value: string) {
  return value.replace(/\s+/g, '').trim().toUpperCase();
}

function validateMockPayment(
  bankCode: Exclude<BankCode, 'VNPAYQR'>,
  values: { accountNumber: string; accountName: string; expiry: string; otp: string },
) {
  const fixture = MOCK_PAYMENT_FIXTURES[bankCode];
  if (normalizeCompact(values.accountNumber) !== normalizeCompact(fixture.accountNumber)) {
    return bankCode === 'INTCARD'
      ? 'Số thẻ quốc tế không đúng với bộ test local.'
      : 'Số thẻ hoặc tài khoản nội địa không đúng với bộ test local.';
  }
  if (normalizeCompact(values.accountName) !== normalizeCompact(fixture.accountName)) {
    return 'Tên chủ thẻ không khớp với thẻ test local.';
  }
  if (normalizeCompact(values.expiry) !== normalizeCompact(fixture.expiry)) {
    return 'Ngày hiệu lực hoặc ngày hết hạn không đúng.';
  }
  if (normalizeCompact(values.otp) !== normalizeCompact(fixture.otp)) {
    return bankCode === 'INTCARD'
      ? 'CVV không đúng với thẻ test local.'
      : 'OTP xác thực không đúng.';
  }
  return null;
}

function HeaderStat({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="min-w-[180px] rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-300">{label}</p>
      <p
        className={`mt-2 ${emphasize ? 'text-3xl font-semibold' : 'text-sm leading-6 text-white'}`}
      >
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
      />
    </label>
  );
}
