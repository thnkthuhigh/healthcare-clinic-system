import { formatDateUtc7 } from '../../../lib/time';

export function AdminHeader() {
  const currentTitle = 'Khu vực quản trị';

  const today = formatDateUtc7(new Date(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header
      className="flex min-h-[72px] items-center justify-between rounded-[20px] border border-slate-200 bg-white px-5 shadow-sm"
      data-testid="admin-header"
    >
      <h2 className="text-xl font-semibold text-slate-950" data-testid="admin-header-title">
        {currentTitle}
      </h2>

      <div className="hidden items-center gap-3 lg:flex">
        <span className="text-sm text-slate-500">{today}</span>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
          <span className="material-symbols-outlined text-[18px] text-slate-500">
            notifications
          </span>
        </div>
      </div>
    </header>
  );
}
