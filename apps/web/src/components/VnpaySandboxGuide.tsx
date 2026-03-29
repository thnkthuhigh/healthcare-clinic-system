type SandboxCard = {
  title: string;
  subtitle: string;
  accentClass: string;
  fields: Array<{
    label: string;
    value: string;
  }>;
};

const sandboxCards: SandboxCard[] = [
  {
    title: 'ATM nội địa NCB',
    subtitle: 'Thanh toán thành công',
    accentClass: 'from-sky-500/15 to-cyan-500/5 text-sky-700',
    fields: [
      { label: 'Số thẻ', value: '9704198526191432198' },
      { label: 'Chủ thẻ', value: 'NGUYEN VAN A' },
      { label: 'Ngày phát hành', value: '07/15' },
      { label: 'OTP', value: '123456' },
    ],
  },
  {
    title: 'ATM nội địa NAPAS',
    subtitle: 'Thanh toán thành công',
    accentClass: 'from-emerald-500/15 to-teal-500/5 text-emerald-700',
    fields: [
      { label: 'Số thẻ', value: '9704000000000018' },
      { label: 'Chủ thẻ', value: 'NGUYEN VAN A' },
      { label: 'Ngày phát hành', value: '03/07' },
      { label: 'OTP', value: 'otp' },
    ],
  },
  {
    title: 'VISA sandbox',
    subtitle: 'Thanh toán thành công',
    accentClass: 'from-violet-500/15 to-fuchsia-500/5 text-violet-700',
    fields: [
      { label: 'Số thẻ', value: '4456530000001005' },
      { label: 'Chủ thẻ', value: 'NGUYEN VAN A' },
      { label: 'Ngày hết hạn', value: '12/26' },
      { label: 'CVV', value: '123' },
    ],
  },
];

interface VnpaySandboxGuideProps {
  className?: string;
}

export function VnpaySandboxGuide({ className = '' }: VnpaySandboxGuideProps) {
  return (
    <section
      className={`rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm ${className}`.trim()}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
          <span className="material-symbols-outlined text-[22px]">credit_card</span>
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-semibold text-slate-900">Thẻ test VNPAY sandbox</p>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
              Dùng khi QR sandbox lỗi
            </span>
          </div>
          <p className="text-sm leading-6 text-slate-600">
            Chỉ dùng khi hệ thống đang chuyển sang{' '}
            <span className="font-semibold text-slate-900">sandbox.vnpayment.vn</span>. Nếu mã QR
            test không hoạt động, hãy chọn thanh toán bằng thẻ hoặc ATM ngay trên trang VNPAY.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-3">
        {sandboxCards.map((card) => (
          <article
            key={card.title}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80"
          >
            <div className={`bg-gradient-to-br px-4 py-4 ${card.accentClass}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{card.title}</p>
                  <p className="mt-1 text-xs font-medium text-emerald-600">{card.subtitle}</p>
                </div>
                <span className="material-symbols-outlined text-lg text-slate-400">payments</span>
              </div>
            </div>

            <dl className="space-y-2 p-4 text-sm">
              {card.fields.map((field) => (
                <div
                  key={field.label}
                  className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 rounded-xl bg-white px-3 py-2"
                >
                  <dt className="text-slate-500">{field.label}</dt>
                  <dd className="break-all text-right font-medium text-slate-900">{field.value}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href="https://sandbox.vnpayment.vn/apis/vnpay-demo/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
        >
          <span className="material-symbols-outlined text-base">menu_book</span>
          Xem danh sách test card chính thức
        </a>
        <a
          href="https://sandbox.vnpayment.vn/tryitnow/Home/CreateOrder"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
        >
          <span className="material-symbols-outlined text-base">open_in_new</span>
          Mở demo sandbox VNPAY
        </a>
      </div>
    </section>
  );
}
