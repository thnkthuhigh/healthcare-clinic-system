interface CashierPageHeaderProps {
  tab: 'consultation' | 'retail';
  onSwitchTab: (tab: 'consultation' | 'retail') => void;
}

export function CashierPageHeader({ tab, onSwitchTab }: CashierPageHeaderProps) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_right,rgba(125,211,252,0.22),transparent_30%),linear-gradient(180deg,#ffffff,#f8fafc)] px-5 py-4 shadow-sm sm:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Thu ngân phòng khám
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            {tab === 'consultation' ? 'Thanh toán khám bệnh' : 'Bán lẻ thuốc'}
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Theo dõi bill trong ngày, mở VNPAY hoặc xác nhận thu tiền trực tiếp tại quầy.
          </p>
        </div>

        <div className="inline-flex rounded-2xl border border-slate-200 bg-white/90 p-1 shadow-sm">
          <button
            onClick={() => onSwitchTab('consultation')}
            className={`inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-medium transition ${
              tab === 'consultation'
                ? 'bg-slate-950 text-white'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            Thanh toán khám
          </button>
          <button
            onClick={() => onSwitchTab('retail')}
            className={`inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-medium transition ${
              tab === 'retail' ? 'bg-slate-950 text-white' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">medication</span>
            Bán lẻ thuốc
          </button>
        </div>
      </div>
    </section>
  );
}
