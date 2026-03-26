import { formatDateUtc7 } from '../../../lib/time';

export function DoctorHeader() {
  const current = {
    title: 'Khu vực bác sĩ',
    icon: 'stethoscope',
  };

  const today = formatDateUtc7(new Date(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="ops-header" data-testid="doctor-header">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <span className="material-symbols-outlined text-[20px]">{current.icon}</span>
        </div>
        <h2 className="text-xl font-semibold text-slate-950" data-testid="doctor-header-title">
          {current.title}
        </h2>
      </div>

      <div className="hidden items-center gap-4 lg:flex">
        <span className="text-sm text-slate-500">{today}</span>
      </div>
    </header>
  );
}
