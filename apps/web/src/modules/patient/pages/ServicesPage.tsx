import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { SectionHeading } from '../../../components/ClinicUI';
import { customerApi } from '../api';
import { PatientFooter } from '../components/PatientFooter';
import { PatientNavbar } from '../components/PatientNavbar';
import type { ClinicService } from '../types';

type ServiceGroupKey = 'all' | 'general' | 'specialty' | 'follow-up' | 'diagnostic' | 'other';

const SERVICE_GROUP_LABELS: Record<ServiceGroupKey, string> = {
  all: 'Tất cả',
  general: 'Khám tổng quát',
  specialty: 'Chuyên khoa',
  'follow-up': 'Tái khám',
  diagnostic: 'Xét nghiệm / cận lâm sàng',
  other: 'Dịch vụ khác',
};

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function isNoisyPublicName(value: string): boolean {
  const lowered = value.trim().toLowerCase();
  if (['fgjnh', 'tdjkh', 'test', 'abc', 'xyz'].includes(lowered)) return true;
  return /^[a-z]{4,6}$/.test(lowered);
}

function isPublicService(service: ClinicService): boolean {
  if (isNoisyPublicName(service.name)) return false;
  return service.priceCents >= 100_000;
}

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
  if (normalized.includes('tai kham')) return 'history';
  return 'medical_services';
}

function serviceDescription(name: string): string {
  const normalized = normalizeText(name);

  if (normalized.includes('tong') || normalized.includes('quat')) {
    return 'Đánh giá toàn diện sức khỏe, phát hiện sớm vấn đề nội khoa và tư vấn hướng điều trị.';
  }
  if (normalized.includes('tim')) {
    return 'Theo dõi triệu chứng tim mạch, huyết áp và các yếu tố nguy cơ để điều trị phù hợp.';
  }
  if (normalized.includes('nhi')) {
    return 'Khám bệnh lý trẻ em theo độ tuổi, theo dõi tăng trưởng và tư vấn chăm sóc tại nhà.';
  }
  if (normalized.includes('xet') || normalized.includes('lab')) {
    return 'Thực hiện xét nghiệm phục vụ chẩn đoán, hỗ trợ bác sĩ đưa ra chỉ định chính xác.';
  }
  if (normalized.includes('tai kham')) {
    return 'Đánh giá lại tiến triển sau điều trị, điều chỉnh toa thuốc hoặc hướng theo dõi tiếp theo.';
  }
  return 'Dịch vụ khám được tư vấn rõ quy trình, chi phí và thời lượng trước khi xác nhận lịch.';
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
    normalized.includes('mri')
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

function ServiceCard({ service }: { service: ClinicService }) {
  return (
    <article className="clinic-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="clinic-icon-badge">
          <span className="material-symbols-outlined text-[22px]">{serviceIcon(service.name)}</span>
        </div>
        <p className="text-base font-bold text-primary">{formatVND(service.priceCents)}</p>
      </div>

      <h3 className="mt-4 text-lg font-semibold text-slate-950">{service.name}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{serviceDescription(service.name)}</p>

      <div className="mt-5">
        <Link to={`/booking?serviceId=${service.id}`} className="btn-primary w-full">
          Đặt lịch dịch vụ này
        </Link>
      </div>
    </article>
  );
}

export function ServicesPage() {
  const [activeGroup, setActiveGroup] = useState<ServiceGroupKey>('all');

  const {
    data: services = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['customer', 'services'],
    queryFn: () => customerApi.getServices(),
  });

  const publicServices = useMemo(() => services.filter(isPublicService), [services]);

  const groupedCounts = useMemo(() => {
    return publicServices.reduce<Record<ServiceGroupKey, number>>(
      (accumulator, service) => {
        const group = classifyService(service);
        accumulator[group] += 1;
        return accumulator;
      },
      {
        all: publicServices.length,
        general: 0,
        specialty: 0,
        'follow-up': 0,
        diagnostic: 0,
        other: 0,
      },
    );
  }, [publicServices]);

  const filteredServices = useMemo(() => {
    if (activeGroup === 'all') return publicServices;
    return publicServices.filter((service) => classifyService(service) === activeGroup);
  }, [publicServices, activeGroup]);

  return (
    <div className="clinic-page" data-testid="public-services-page">
      <PatientNavbar />

      <main className="clinic-section space-y-6">
        <section className="clinic-card p-6 sm:p-8">
          <SectionHeading
            eyebrow="Dịch vụ khám"
            title="Danh mục dịch vụ "
            description="Bạn có thể lọc theo nhóm dịch vụ, xem mức phí tham khảo và đặt lịch trực tiếp từ từng thẻ dịch vụ."
          />
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
          <section className="clinic-card p-6 sm:p-8">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">
                Đang hiển thị{' '}
                <span className="font-semibold text-slate-950">{filteredServices.length}</span> dịch
                vụ
              </p>
              <Link to="/booking" className="btn-secondary px-4 py-2.5">
                Đặt lịch ngay
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
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
                  <ServiceCard key={service.id} service={service} />
                ))}
            </div>

            {!isLoading && filteredServices.length === 0 && (
              <div className="clinic-empty mt-6">
                <span className="material-symbols-outlined text-5xl text-slate-300">
                  category_search
                </span>
                <p className="mt-3 text-slate-600">Chưa có dịch vụ phù hợp với nhóm đang chọn.</p>
                <button
                  type="button"
                  onClick={() => setActiveGroup('all')}
                  className="btn-secondary mt-5"
                >
                  Xem lại toàn bộ dịch vụ
                </button>
              </div>
            )}

            {!isLoading && groupedCounts.all === 0 && (
              <div className="surface-alert mt-6">
                <p>Danh mục dịch vụ công khai chưa có dữ liệu phù hợp để hiển thị.</p>
              </div>
            )}
          </section>
        )}
      </main>

      <PatientFooter />
    </div>
  );
}
