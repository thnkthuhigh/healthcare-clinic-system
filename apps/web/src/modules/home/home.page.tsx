import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { PublicHero, SectionHeading } from '../../components/ClinicUI';
import { ClinicOverviewVisual } from '../../components/ClinicVisuals';
import { customerApi } from '../patient/api';
import { PatientFooter } from '../patient/components/PatientFooter';
import { PatientNavbar } from '../patient/components/PatientNavbar';
import { CLINIC_CONTACT } from '../patient/content';
import type { ClinicService, DoctorSummary } from '../patient/types';

const TRUST_FACTS = [
  {
    icon: 'schedule',
    label: 'Giờ tiếp nhận',
    value: '07:00 - 17:30, Thứ 2 - Thứ 7',
  },
  {
    icon: 'call',
    label: 'Tổng đài',
    value: '(028) 3838 1234',
  },
  {
    icon: 'qr_code_2',
    label: 'Phiếu khám',
    value: 'Lưu kèm mã QR check-in',
  },
  {
    icon: 'medical_information',
    label: 'Tra cứu',
    value: 'Mở lại bằng số điện thoại',
  },
] as const;

const MAIN_ACTIONS = [
  {
    icon: 'calendar_add_on',
    title: 'Đặt lịch khám mới',
    description: 'Chọn bác sĩ, ca khám và lưu phiếu trong một luồng ngắn, rõ ràng.',
    cta: 'Bắt đầu đặt lịch',
    to: '/booking',
    tone: 'primary' as const,
  },
  {
    icon: 'groups',
    title: 'Tìm bác sĩ phù hợp',
    description: 'Xem bác sĩ theo chuyên khoa rồi chuyển sang bước chọn lịch.',
    cta: 'Xem bác sĩ',
    to: '/doctors',
    tone: 'default' as const,
  },
  {
    icon: 'search',
    title: 'Tra cứu hồ sơ và lịch hẹn',
    description: 'Mở lại hồ sơ, phiếu khám, mã QR và lịch hẹn đã có.',
    cta: 'Mở trang tra cứu',
    to: '/health-records',
    tone: 'default' as const,
  },
] as const;

const PROCESS_STEPS = [
  {
    step: '01',
    title: 'Chọn đúng điểm vào',
    description: 'Trang chủ chỉ giữ ba lối vào chính: đặt lịch, bác sĩ và tra cứu.',
  },
  {
    step: '02',
    title: 'Thực hiện tác vụ chính',
    description: 'Mỗi trang sau đó chỉ tập trung vào đúng nội dung của nó, không lặp chéo.',
  },
  {
    step: '03',
    title: 'Quay lại khi cần',
    description: 'Dùng lại số điện thoại đã đăng ký để mở hồ sơ, lịch hẹn và phiếu khám.',
  },
] as const;

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
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
  return 'medical_services';
}

function HeroVisual({
  doctors,
  services,
}: {
  doctors: DoctorSummary[];
  services: ClinicService[];
}) {
  const featuredDoctor = doctors[0] ?? null;
  const highlightedServices = services.slice(0, 2);

  return (
    <div className="space-y-4">
      <div className="clinic-card overflow-hidden p-4">
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
          <ClinicOverviewVisual />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Hành trình trực tuyến
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              Từ lúc đặt lịch đến lúc mở lại hồ sơ đều đi trên cùng một hệ thống
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            {featuredDoctor ? (
              <>
                <p className="font-semibold text-slate-950">{featuredDoctor.displayName}</p>
                <p className="mt-1">{featuredDoctor.specialty ?? 'Đa khoa'}</p>
              </>
            ) : (
              <p className="font-semibold text-slate-950">Đội ngũ bác sĩ chuyên khoa</p>
            )}
          </div>
        </div>
      </div>

      {highlightedServices.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {highlightedServices.map((service) => (
            <div key={service.id} className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-soft">
              <div className="clinic-icon-badge">
                <span className="material-symbols-outlined text-[20px]">{serviceIcon(service.name)}</span>
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-950">{service.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const { data: doctors = [] } = useQuery({
    queryKey: ['home-doctors'],
    queryFn: customerApi.getDoctors,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['home-services'],
    queryFn: customerApi.getServices,
  });

  const handleLookup = (event: FormEvent) => {
    event.preventDefault();
    const normalizedPhone = phone.trim();

    if (!normalizedPhone) {
      setError('Vui lòng nhập số điện thoại đã đăng ký.');
      return;
    }

    if (!/^0\d{9}$/.test(normalizedPhone)) {
      setError('Số điện thoại không hợp lệ. Ví dụ: 0901234567.');
      return;
    }

    setError('');
    navigate(`/health-records?phone=${encodeURIComponent(normalizedPhone)}`);
  };

  return (
    <div className="clinic-page" data-testid="public-home-page">
      <PatientNavbar />

      <PublicHero
        icon="local_hospital"
        eyebrow="Phòng khám đa khoa"
        title="Đặt lịch, giữ phiếu khám và mở lại hồ sơ trong cùng một hành trình"
        description="Trang chủ chỉ đóng vai trò điểm vào cho bệnh nhân: chọn tác vụ, đi đúng trang và hoàn tất thao tác mà không phải đọc lại cùng một nội dung ở nhiều nơi."
        actions={
          <>
            <Link to="/booking" className="btn-primary" data-testid="public-home-booking-cta">
              <span className="material-symbols-outlined text-base">calendar_add_on</span>
              <span>Đặt lịch khám</span>
            </Link>
            <Link
              to="/health-records"
              className="btn-secondary"
              data-testid="public-home-records-cta"
            >
              <span className="material-symbols-outlined text-base">search</span>
              <span>Tra cứu hồ sơ</span>
            </Link>
          </>
        }
        insights={
          <div>
            <HeroVisual doctors={doctors} services={services} />
            <form
              onSubmit={handleLookup}
              className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-soft"
              data-testid="public-home-quick-lookup-form"
            >
              <label className="field-label">Tra cứu nhanh bằng số điện thoại</label>
              <div className="flex flex-col gap-3">
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  type="tel"
                  placeholder="Ví dụ: 0901234567"
                  className="input-field"
                  data-testid="public-home-quick-lookup-phone"
                />
                {error && <p className="text-xs text-red-600">{error}</p>}
                <button
                  type="submit"
                  className="btn-primary w-full"
                  data-testid="public-home-quick-lookup-submit"
                >
                  <span className="material-symbols-outlined text-base">search</span>
                  <span>Mở trang tra cứu</span>
                </button>
              </div>
            </form>
          </div>
        }
      />

      <main className="clinic-section space-y-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {TRUST_FACTS.map((item) => (
            <div key={item.label} className="clinic-card-muted p-5">
              <div className="flex items-center gap-3">
                <div className="clinic-icon-badge">
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">{item.value}</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-3">
          {MAIN_ACTIONS.map((item) => (
            <Link
              key={item.title}
              to={item.to}
              className={`clinic-card group overflow-hidden p-6 sm:p-7 ${
                item.tone === 'primary' ? 'border-primary/20 bg-primary text-white' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div
                  className={`clinic-icon-badge ${
                    item.tone === 'primary' ? 'border-white/20 bg-white/10 text-white' : ''
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                </div>
                <span
                  className={`text-xs font-semibold uppercase tracking-[0.12em] ${
                    item.tone === 'primary' ? 'text-white/72' : 'text-slate-400'
                  }`}
                >
                  {item.tone === 'primary' ? 'Hành động chính' : 'Chọn nhanh'}
                </span>
              </div>
              <h3
                className={`mt-6 text-2xl font-semibold ${
                  item.tone === 'primary' ? 'text-white' : 'text-slate-950'
                }`}
              >
                {item.title}
              </h3>
              <p
                className={`mt-3 text-sm leading-7 ${
                  item.tone === 'primary' ? 'text-white/80' : 'text-slate-600'
                }`}
              >
                {item.description}
              </p>
              <div
                className={`mt-6 inline-flex items-center gap-2 text-sm font-semibold ${
                  item.tone === 'primary' ? 'text-white' : 'text-primary'
                }`}
              >
                <span>{item.cta}</span>
                <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              </div>
            </Link>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="clinic-card p-6 sm:p-8 lg:p-10">
            <SectionHeading
              eyebrow="Cách sử dụng"
              title="Trang chủ chỉ còn đúng vai trò dẫn bạn vào trang phù hợp"
              description="Sau khi rời trang chủ, mỗi route sẽ chỉ giữ đúng nội dung của nó thay vì lặp lại cùng một danh mục ở nhiều nơi."
            />
            <div className="mt-6 space-y-4">
              {PROCESS_STEPS.map((item) => (
                <div key={item.step} className="flex gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-bold text-primary shadow-soft">
                    {item.step}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="clinic-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Liên hệ và hỗ trợ
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-slate-950">
              Cần hỏi trước khi khám hoặc đổi lịch?
            </h3>
            <div className="mt-6 space-y-4">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Địa chỉ
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-700">{CLINIC_CONTACT.address}</p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Liên hệ
                </p>
                <p className="mt-3 text-sm font-semibold text-slate-950">{CLINIC_CONTACT.phone}</p>
                <p className="mt-1 text-sm text-slate-600">{CLINIC_CONTACT.email}</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PatientFooter />
    </div>
  );
}
