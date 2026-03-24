import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { InfoPageHeader, SectionHeading } from '../../../components/ClinicUI';
import { customerApi } from '../api';
import { PatientFooter } from '../components/PatientFooter';
import { PatientNavbar } from '../components/PatientNavbar';
import type { ClinicService } from '../types';

type ServiceGroupKey =
  | 'all'
  | 'general'
  | 'specialty'
  | 'follow-up'
  | 'diagnostic'
  | 'other';

const SERVICE_GROUP_LABELS: Record<ServiceGroupKey, string> = {
  all: 'Tất cả',
  general: 'Khám tổng quát',
  specialty: 'Chuyên khoa',
  'follow-up': 'Tái khám',
  diagnostic: 'Xét nghiệm / cận lâm sàng',
  other: 'Dịch vụ khác',
};

const SERVICE_ADVANTAGES = [
  {
    icon: 'calendar_month',
    title: 'Đặt lịch theo nhu cầu',
    description: 'Chọn đúng nhóm dịch vụ trước khi sang bước bác sĩ và ca khám.',
  },
  {
    icon: 'payments',
    title: 'Mức phí tham khảo rõ ràng',
    description: 'Giúp bệnh nhân ước lượng nhanh trước khi xác nhận lịch hẹn.',
  },
  {
    icon: 'lab_profile',
    title: 'Tra cứu lại sau khám',
    description: 'Dịch vụ đã dùng sẽ xuất hiện lại trong hồ sơ và phiếu khám.',
  },
];

function formatVND(cents: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function serviceIcon(name: string): string {
  const normalized = normalizeText(name);
  if (normalized.includes('tim')) return 'cardiology';
  if (normalized.includes('nhi')) return 'child_care';
  if (normalized.includes('xet') || normalized.includes('lab')) return 'labs';
  if (normalized.includes('tong') || normalized.includes('quat')) return 'monitor_heart';
  if (normalized.includes('tai') || normalized.includes('mui') || normalized.includes('hong')) {
    return 'hearing';
  }
  if (normalized.includes('tai kham')) return 'history';
  return 'medical_services';
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function classifyService(service: ClinicService): ServiceGroupKey {
  const normalized = normalizeText(service.name);

  if (normalized.includes('tong') || normalized.includes('quat')) return 'general';
  if (normalized.includes('tai kham') || normalized.includes('theo doi')) return 'follow-up';
  if (
    normalized.includes('xet') ||
    normalized.includes('sieu am') ||
    normalized.includes('x quang') ||
    normalized.includes('ct') ||
    normalized.includes('mri') ||
    normalized.includes('do loang xuong')
  ) {
    return 'diagnostic';
  }
  if (
    normalized.includes('tim') ||
    normalized.includes('nhi') ||
    normalized.includes('mat') ||
    normalized.includes('da lieu') ||
    normalized.includes('noi') ||
    normalized.includes('ngoai') ||
    normalized.includes('phu san') ||
    normalized.includes('tai mui hong')
  ) {
    return 'specialty';
  }
  return 'other';
}

function ServiceHighlight({
  title,
  description,
  count,
  icon,
}: {
  title: string;
  description: string;
  count: number;
  icon: string;
}) {
  return (
    <div className="clinic-card p-5 sm:p-6">
      <div className="clinic-icon-badge">
        <span className="material-symbols-outlined text-[22px]">{icon}</span>
      </div>
      <p className="mt-4 text-lg font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <p className="mt-5 text-3xl font-bold tracking-tight text-slate-950">{count}</p>
    </div>
  );
}

function ServiceCard({
  service,
  groupLabel,
}: {
  service: ClinicService;
  groupLabel: string;
}) {
  return (
    <article className="clinic-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="clinic-icon-badge">
          <span className="material-symbols-outlined text-[22px]">{serviceIcon(service.name)}</span>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
          {formatVND(service.priceCents)}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
          {groupLabel}
        </span>
      </div>

      <h3 className="mt-4 text-lg font-semibold text-slate-950">{service.name}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Phù hợp để đưa thẳng vào luồng đặt lịch trực tuyến. Phần chi phí phát sinh chuyên sâu sẽ
        được tư vấn thêm khi tiếp nhận và thăm khám.
      </p>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
        <div className="text-sm text-slate-500">Tiếp tục tới bước chọn bác sĩ và ca khám</div>
        <Link to={`/booking?serviceId=${service.id}`} className="btn-primary px-4 py-2.5">
          Đặt lịch
        </Link>
      </div>
    </article>
  );
}

export function ServicesPage() {
  const [activeGroup, setActiveGroup] = useState<ServiceGroupKey>('all');

  const { data: services = [], isLoading, isError } = useQuery({
    queryKey: ['customer', 'services'],
    queryFn: () => customerApi.getServices(),
  });

  const groupedCounts = useMemo(() => {
    return services.reduce<Record<ServiceGroupKey, number>>(
      (accumulator, service) => {
        const group = classifyService(service);
        accumulator[group] += 1;
        return accumulator;
      },
      {
        all: services.length,
        general: 0,
        specialty: 0,
        'follow-up': 0,
        diagnostic: 0,
        other: 0,
      },
    );
  }, [services]);

  const filteredServices = useMemo(() => {
    if (activeGroup === 'all') return services;
    return services.filter((service) => classifyService(service) === activeGroup);
  }, [services, activeGroup]);

  const startingPrice = useMemo(() => {
    if (services.length === 0) return null;
    return Math.min(...services.map((service) => service.priceCents));
  }, [services]);

  const featuredGroups = [
    {
      key: 'general' as const,
      icon: 'monitor_heart',
      title: 'Khám tổng quát',
      description: 'Nhóm phù hợp cho nhu cầu kiểm tra ban đầu hoặc khám định kỳ.',
    },
    {
      key: 'specialty' as const,
      icon: 'stethoscope',
      title: 'Chuyên khoa',
      description: 'Đi thẳng vào các nhóm bác sĩ và dịch vụ chuyên sâu hơn.',
    },
    {
      key: 'diagnostic' as const,
      icon: 'labs',
      title: 'Cận lâm sàng',
      description: 'Các dịch vụ xét nghiệm và kiểm tra hỗ trợ chẩn đoán.',
    },
  ];

  return (
    <div className="clinic-page" data-testid="public-services-page">
      <PatientNavbar />

      <InfoPageHeader
        icon="medical_services"
        eyebrow="Danh mục dịch vụ"
        title="Chọn nhóm dịch vụ trước, rồi chuyển nhanh sang đặt lịch"
        description="Danh mục được tổ chức theo nhóm để giảm cảm giác đọc dữ liệu và giúp bệnh nhân chọn đúng nhu cầu khám ngay từ đầu."
        metrics={
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="clinic-kpi">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Dịch vụ đang mở
              </p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                {services.length}
              </p>
            </div>
            <div className="clinic-kpi">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Mức phí từ
              </p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                {startingPrice ? formatVND(startingPrice) : '--'}
              </p>
            </div>
          </div>
        }
      />

      <main className="clinic-section space-y-6">
        <section className="grid gap-4 md:grid-cols-3">
          {featuredGroups.map((item) => (
            <ServiceHighlight
              key={item.key}
              icon={item.icon}
              title={item.title}
              description={item.description}
              count={groupedCounts[item.key]}
            />
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {SERVICE_ADVANTAGES.map((item) => (
            <div key={item.title} className="clinic-card-muted p-5">
              <div className="clinic-icon-badge">
                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
              </div>
              <p className="mt-4 text-base font-semibold text-slate-950">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
            </div>
          ))}
        </section>

        {isError && (
          <div className="surface-alert">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              <p>Không thể tải danh mục dịch vụ vào lúc này.</p>
            </div>
          </div>
        )}

        {!isError && (
          <section className="clinic-card p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
              <SectionHeading
                eyebrow="Lọc nhanh"
                title="Tìm đúng nhóm dịch vụ trước khi đặt lịch"
                description="Các nhóm dịch vụ được đưa lên đầu để bạn thu hẹp lựa chọn nhanh, thay vì đọc toàn bộ danh sách theo chiều dọc."
              />

              <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <span className="font-semibold text-slate-950">{filteredServices.length}</span> dịch vụ
                đang hiển thị
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {(Object.keys(SERVICE_GROUP_LABELS) as ServiceGroupKey[]).map((groupKey) => {
                const isActive = activeGroup === groupKey;
                return (
                  <button
                    key={groupKey}
                    type="button"
                    onClick={() => setActiveGroup(groupKey)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {SERVICE_GROUP_LABELS[groupKey]}
                    {groupKey !== 'all' && (
                      <span className={`ml-2 ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                        {groupedCounts[groupKey]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {isLoading &&
                Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="clinic-card animate-pulse p-5">
                    <div className="h-12 w-12 rounded-2xl bg-slate-200" />
                    <div className="mt-4 h-5 w-40 rounded bg-slate-200" />
                    <div className="mt-2 h-4 w-24 rounded bg-slate-200" />
                    <div className="mt-5 h-10 rounded-2xl bg-slate-200" />
                  </div>
                ))}

              {!isLoading &&
                filteredServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    groupLabel={SERVICE_GROUP_LABELS[classifyService(service)]}
                  />
                ))}
            </div>

            {!isLoading && filteredServices.length === 0 && (
              <div className="clinic-empty mt-6">
                <span className="material-symbols-outlined text-5xl text-slate-300">
                  category_search
                </span>
                <p className="mt-3 text-slate-600">
                  Chưa có dịch vụ phù hợp với nhóm đang chọn.
                </p>
                <button type="button" onClick={() => setActiveGroup('all')} className="btn-secondary mt-5">
                  Xem lại toàn bộ dịch vụ
                </button>
              </div>
            )}
          </section>
        )}
      </main>

      <PatientFooter />
    </div>
  );
}
