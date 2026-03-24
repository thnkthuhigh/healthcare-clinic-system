import type { ReactNode } from 'react';

interface SharedHeaderProps {
  icon: string;
  eyebrow: string;
  title: string;
  description: string;
}

interface PublicHeroProps extends SharedHeaderProps {
  actions?: ReactNode;
  insights?: ReactNode;
}

export function PublicHero({
  icon,
  eyebrow,
  title,
  description,
  actions,
  insights,
}: PublicHeroProps) {
  return (
    <section className="clinic-hero">
      <div className="clinic-hero-panel">
        <div className="clinic-hero-card clinic-hero-card-public">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_420px] lg:items-start">
            <div className="animate-clinic-enter">
              <div className="clinic-eyebrow">
                <span className="material-symbols-outlined text-sm">{icon}</span>
                <span>{eyebrow}</span>
              </div>
              <h1 className="clinic-title mt-6 max-w-4xl">{title}</h1>
              <p className="clinic-subtitle max-w-3xl text-base sm:text-lg">{description}</p>
              {actions && <div className="mt-8 flex flex-wrap gap-3">{actions}</div>}
            </div>
            {insights && (
              <aside className="clinic-card-muted animate-clinic-enter-delayed p-5">{insights}</aside>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

interface InfoPageHeaderProps extends SharedHeaderProps {
  metrics?: ReactNode;
}

export function InfoPageHeader({
  icon,
  eyebrow,
  title,
  description,
  metrics,
}: InfoPageHeaderProps) {
  return (
    <section className="clinic-hero">
      <div className="clinic-hero-panel">
        <div className="clinic-hero-card">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
            <div className="animate-clinic-enter">
              <div className="clinic-eyebrow">
                <span className="material-symbols-outlined text-sm">{icon}</span>
                <span>{eyebrow}</span>
              </div>
              <h1 className="clinic-title mt-5">{title}</h1>
              <p className="clinic-subtitle">{description}</p>
            </div>
            {metrics && <div className="animate-clinic-enter-delayed">{metrics}</div>}
          </div>
        </div>
      </div>
    </section>
  );
}

interface TaskPageHeaderProps extends SharedHeaderProps {
  summary?: ReactNode;
  actions?: ReactNode;
}

export function TaskPageHeader({
  icon,
  eyebrow,
  title,
  description,
  summary,
  actions,
}: TaskPageHeaderProps) {
  return (
    <section className="clinic-hero">
      <div className="clinic-hero-panel">
        <div className="clinic-hero-card clinic-hero-card-task">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div className="animate-clinic-enter">
              <div className="clinic-eyebrow">
                <span className="material-symbols-outlined text-sm">{icon}</span>
                <span>{eyebrow}</span>
              </div>
              <h1 className="clinic-title mt-5">{title}</h1>
              <p className="clinic-subtitle">{description}</p>
              {actions && <div className="mt-6 flex flex-wrap gap-3">{actions}</div>}
            </div>
            {summary && <aside className="clinic-card animate-clinic-enter-delayed p-5">{summary}</aside>}
          </div>
        </div>
      </div>
    </section>
  );
}

interface FlatTaskHeaderProps extends SharedHeaderProps {
  actions?: ReactNode;
  aside?: ReactNode;
}

export function FlatTaskHeader({
  icon,
  eyebrow,
  title,
  description,
  actions,
  aside,
}: FlatTaskHeaderProps) {
  return (
    <div className="clinic-flat-header">
      <div className="clinic-flat-header-main">
        <div className="clinic-flat-eyebrow">
          <span className="material-symbols-outlined text-sm">{icon}</span>
          <span>{eyebrow}</span>
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">{description}</p>
        {actions && <div className="mt-5 flex flex-wrap gap-3">{actions}</div>}
      </div>
      {aside && <aside className="w-full max-w-sm lg:self-start">{aside}</aside>}
    </div>
  );
}

interface SectionHeadingProps {
  title: string;
  description?: string;
  eyebrow?: string;
  align?: 'left' | 'center';
}

export function SectionHeading({
  title,
  description,
  eyebrow,
  align = 'left',
}: SectionHeadingProps) {
  const centered = align === 'center';

  return (
    <div className={centered ? 'mx-auto max-w-2xl text-center' : ''}>
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
      )}
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
      {description && <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">{description}</p>}
    </div>
  );
}

interface OpsPageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function OpsPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: OpsPageHeaderProps) {
  return (
    <div className="ops-page-header">
      <div>
        <p className="ops-section-label">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{title}</h1>
        {description && <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

interface AuthShellProps {
  icon: string;
  title: string;
  description: string;
  children: ReactNode;
}

export function AuthShell({ icon, title, description, children }: AuthShellProps) {
  return (
    <div className="clinic-page flex items-center justify-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center">
          <section className="clinic-card-muted hidden p-10 lg:block">
            <div className="clinic-eyebrow">
              <span className="material-symbols-outlined text-sm">shield_lock</span>
              <span>Khu vực nội bộ</span>
            </div>
            <h1 className="mt-6 max-w-md text-4xl font-bold tracking-tight text-slate-950">
              Cổng vận hành dành cho nhân sự phòng khám
            </h1>
            <p className="mt-4 max-w-xl text-base leading-8 text-slate-600">
              Bác sĩ, lễ tân, thu ngân và quản trị viên sử dụng khu vực này để điều phối lịch khám,
              xử lý hồ sơ và theo dõi hoạt động trong ngày.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">Luồng vận hành rõ ràng</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Giao diện ưu tiên thao tác nhanh, dễ đọc và hạn chế nhiễu thị giác.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">Bảo mật theo vai trò</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Mỗi tài khoản chỉ truy cập đúng khu vực được phân quyền.
                </p>
              </div>
            </div>
          </section>

          <div className="w-full">
            <div className="mb-6 text-center animate-clinic-enter">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-soft">
                <span className="material-symbols-outlined text-3xl">{icon}</span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h2>
              <p className="mt-2 text-sm text-slate-600">{description}</p>
            </div>
            <div className="clinic-card animate-clinic-pop p-6 sm:p-8">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PageHeroProps extends SharedHeaderProps {
  actions?: ReactNode;
  aside?: ReactNode;
}

export function PageHero({
  icon,
  eyebrow,
  title,
  description,
  aside,
}: PageHeroProps) {
  return (
    <InfoPageHeader
      icon={icon}
      eyebrow={eyebrow}
      title={title}
      description={description}
      metrics={aside ? <div className="clinic-card-muted p-5">{aside}</div> : undefined}
    />
  );
}
