import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { PublicHero, SectionHeading } from '../../components/ClinicUI';
import { ClinicHeroImageVisual } from '../../components/ClinicVisuals';
import { customerApi } from '../patient/api';
import { PatientFooter } from '../patient/components/PatientFooter';
import { PatientNavbar } from '../patient/components/PatientNavbar';
import { CLINIC_CONTACT } from '../patient/content';
import type { ClinicService, DoctorSummary } from '../patient/types';

const TRUST_FACTS = [
  {
    icon: 'schedule',
    title: 'Giờ tiếp nhận',
    value: '07:00 - 12:00, 13:00 - 18:00',
  },
  {
    icon: 'call',
    title: 'Tổng đài hỗ trợ',
    value: CLINIC_CONTACT.phone,
  },
  {
    icon: 'location_on',
    title: 'Địa chỉ phòng khám',
    value: 'Quận 5, TP. Hồ Chí Minh',
  },
  {
    icon: 'medical_information',
    title: 'Kết quả sau khám',
    value: 'Tra cứu hồ sơ bằng số điện thoại',
  },
] as const;

const PROCESS_STEPS = [
  {
    step: '01',
    title: 'Đặt lịch trực tuyến',
    description: 'Chọn bác sĩ và khung giờ phù hợp trong vài phút.',
  },
  {
    step: '02',
    title: 'Check-in tại quầy',
    description: 'Đọc số điện thoại hoặc đưa mã QR để tiếp nhận nhanh.',
  },
  {
    step: '03',
    title: 'Khám, nhận toa và theo dõi',
    description: 'Kết quả khám và toa thuốc được lưu lại để tra cứu khi cần.',
  },
] as const;

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

function isPublicDoctor(doctor: DoctorSummary): boolean {
  return !isNoisyPublicName(doctor.displayName);
}

function isPublicService(service: ClinicService): boolean {
  if (isNoisyPublicName(service.name)) return false;
  return service.priceCents >= 100_000;
}

function serviceSummary(name: string): string {
  const normalized = normalizeText(name);
  if (normalized.includes('tim')) {
    return 'Tầm soát và theo dõi các bệnh lý tim mạch, huyết áp, rối loạn nhịp.';
  }
  if (normalized.includes('nhi')) {
    return 'Khám trẻ em theo độ tuổi, theo dõi tăng trưởng và bệnh thường gặp.';
  }
  if (normalized.includes('xet') || normalized.includes('lab')) {
    return 'Xét nghiệm hỗ trợ chẩn đoán và theo dõi điều trị chính xác hơn.';
  }
  if (normalized.includes('tong') || normalized.includes('quat')) {
    return 'Đánh giá sức khỏe tổng quát, tư vấn điều trị và phòng ngừa sớm.';
  }
  return 'Dịch vụ khám phù hợp nhu cầu thực tế, được tư vấn rõ trước khi thực hiện.';
}

function doctorSummary(doctor: DoctorSummary): string {
  if (doctor.specialty) {
    return `Theo dõi và điều trị chuyên sâu nhóm bệnh ${doctor.specialty.toLowerCase()}.`;
  }
  return 'Khám và tư vấn điều trị theo quy trình chuẩn của phòng khám.';
}

function doctorExperience(doctor: DoctorSummary): string {
  const stars = doctor.averageStars ?? 0;
  if (stars >= 4.8) return 'Kinh nghiệm lâm sàng 15+ năm';
  if (stars >= 4.5) return 'Kinh nghiệm lâm sàng 10+ năm';
  if (stars >= 4) return 'Kinh nghiệm lâm sàng 7+ năm';
  return 'Bác sĩ chuyên khoa';
}

function formatVnd(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value / 100);
}

function DoctorCard({ doctor }: { doctor: DoctorSummary }) {
  const initials = doctor.displayName
    .replace('BS.', '')
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <article className="clinic-card p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-base font-bold text-slate-700">
          {doctor.avatarUrl ? (
            <img
              src={doctor.avatarUrl}
              alt={doctor.displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold text-slate-950">{doctor.displayName}</p>
          <p className="text-sm text-slate-600">{doctor.specialty ?? 'Đa khoa'}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-primary">
            {doctorExperience(doctor)}
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">{doctorSummary(doctor)}</p>
      <div className="mt-5 flex gap-2.5">
        <Link to={`/booking?doctorId=${doctor.id}`} className="btn-primary flex-1 px-4 py-2.5">
          Đặt lịch khám
        </Link>
        <Link to={`/doctors?doctorId=${doctor.id}`} className="btn-secondary px-4 py-2.5">
          Xem chi tiết
        </Link>
      </div>
    </article>
  );
}

export function HomePage() {
  const { data: doctors = [] } = useQuery({
    queryKey: ['home-doctors'],
    queryFn: () => customerApi.getDoctors(),
  });

  const { data: services = [] } = useQuery({
    queryKey: ['home-services'],
    queryFn: customerApi.getServices,
  });

  const publicDoctors = useMemo(() => doctors.filter(isPublicDoctor).slice(0, 4), [doctors]);
  const publicServices = useMemo(() => services.filter(isPublicService).slice(0, 6), [services]);

  return (
    <div className="clinic-page" data-testid="public-home-page">
      <PatientNavbar />

      <PublicHero
        icon="favorite"
        eyebrow="Phòng khám đa khoa"
        title="Chăm sóc sức khỏe tận tâm. Đặt lịch khám nhanh chóng chỉ với vài bước."
        description="Khi cần khám bệnh, bạn chỉ cần chọn bác sĩ phù hợp, đặt giờ hẹn và đến check-in đúng lịch. Toàn bộ hồ sơ sau khám được lưu để tra cứu lại bằng số điện thoại."
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
          <div className="space-y-4">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
              <ClinicHeroImageVisual />
            </div>
            <p className="text-sm leading-6 text-slate-600">
              Không gian khám sạch sẽ, quy trình tiếp nhận rõ ràng và đội ngũ bác sĩ theo dõi sát
              từng hồ sơ.
            </p>
          </div>
        }
      />

      <main className="clinic-section space-y-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {TRUST_FACTS.map((item) => (
            <div key={item.title} className="clinic-card-muted p-5">
              <div className="flex items-start gap-3">
                <div className="clinic-icon-badge">
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">{item.value}</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="clinic-card p-6 sm:p-8">
          <SectionHeading
            eyebrow="Chuyên khoa và dịch vụ"
            title="Danh mục khám nổi bật"
            description="Chọn nhóm khám phù hợp với nhu cầu hiện tại. Mức phí được công khai để bạn dễ chủ động trước khi xác nhận lịch."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {publicServices.map((service) => (
              <article
                key={service.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <h3 className="text-base font-semibold text-slate-950">{service.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {serviceSummary(service.name)}
                </p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-primary">
                    {formatVnd(service.priceCents)}
                  </p>
                  <Link to={`/booking?serviceId=${service.id}`} className="btn-primary px-4 py-2.5">
                    Đặt lịch
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="clinic-card p-6 sm:p-8">
          <SectionHeading
            eyebrow="Đội ngũ bác sĩ"
            title="Bác sĩ theo chuyên khoa"
            description="Tham khảo nhanh thông tin bác sĩ trước khi chọn lịch hẹn."
          />
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {publicDoctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        </section>

        <section className="clinic-card p-6 sm:p-8">
          <SectionHeading eyebrow="Quy trình khám" title="Đi khám đơn giản với 3 bước rõ ràng" />
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {PROCESS_STEPS.map((item) => (
              <div key={item.step} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-bold text-primary">
                  {item.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <PatientFooter />
    </div>
  );
}
