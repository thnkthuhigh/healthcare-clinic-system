import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { InfoPageHeader, SectionHeading } from '../../../components/ClinicUI';
import { customerApi } from '../api';
import { PatientFooter } from '../components/PatientFooter';
import { PatientNavbar } from '../components/PatientNavbar';
import type { DoctorSummary } from '../types';

const AVATAR_COLORS = ['bg-slate-200', 'bg-sky-100', 'bg-cyan-100', 'bg-stone-200'] as const;
const ALL_SPECIALTIES = 'Tất cả chuyên khoa';

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function getInitials(name: string): string {
  return name
    .replace('BS.', '')
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function StarRating({ stars }: { stars: number | null }) {
  const value = stars ?? 0;

  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((item) => (
        <span
          key={item}
          className={`material-symbols-outlined text-base ${
            item <= Math.round(value) ? 'text-amber-500' : 'text-slate-300'
          }`}
        >
          star
        </span>
      ))}
      <span className="text-sm font-medium text-slate-500">
        {value > 0 ? value.toFixed(1) : 'Chưa có đánh giá'}
      </span>
    </div>
  );
}

function getDoctorHeadline(doctor: DoctorSummary): string {
  if ((doctor.averageStars ?? 0) >= 4.5) return 'Được bệnh nhân đánh giá cao';
  if (doctor.specialty) return `Phù hợp khi cần khám ${doctor.specialty.toLowerCase()}`;
  return 'Sẵn sàng cho bước đặt lịch trực tuyến';
}

function getDoctorAccent(doctor: DoctorSummary): string {
  if ((doctor.averageStars ?? 0) >= 4.5) return 'Được đánh giá cao';
  if (doctor.specialty) return doctor.specialty;
  return 'Đặt lịch trực tuyến';
}

function DoctorAvatar({
  doctor,
  colorClass,
  size = 'large',
}: {
  doctor: DoctorSummary;
  colorClass: string;
  size?: 'large' | 'small';
}) {
  const sizeClass = size === 'large' ? 'h-24 w-24 text-2xl' : 'h-16 w-16 text-lg';

  return (
    <div
      className={`flex ${sizeClass} items-center justify-center overflow-hidden rounded-full border border-white ${colorClass} font-bold text-slate-700 shadow-soft`}
    >
      {doctor.avatarUrl ? (
        <img src={doctor.avatarUrl} alt={doctor.displayName} className="h-full w-full object-cover" />
      ) : (
        getInitials(doctor.displayName)
      )}
    </div>
  );
}

function FeaturedDoctor({ doctor }: { doctor: DoctorSummary }) {
  return (
    <div className="clinic-card overflow-hidden">
      <div className="grid gap-0 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="flex items-center justify-center border-b border-slate-200 bg-slate-100 px-6 py-8 lg:border-b-0 lg:border-r">
          <DoctorAvatar doctor={doctor} colorClass="bg-sky-100" />
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              Bác sĩ nổi bật
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
              {getDoctorAccent(doctor)}
            </span>
          </div>

          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-950">
            {doctor.displayName}
          </h2>
          <p className="mt-2 text-base text-slate-600">{doctor.specialty ?? 'Đa khoa'}</p>

          <div className="mt-4">
            <StarRating stars={doctor.averageStars} />
          </div>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600">
            {getDoctorHeadline(doctor)}. Bạn có thể mở ngay bước chọn lịch với đúng bác sĩ để
            giảm thời gian thao tác khi đặt khám.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link to={`/booking?doctorId=${doctor.id}`} className="btn-primary">
              <span className="material-symbols-outlined text-base">calendar_add_on</span>
              <span>Đặt lịch với bác sĩ này</span>
            </Link>
            <a href="#doctor-results" className="btn-secondary">
              <span className="material-symbols-outlined text-base">view_list</span>
              <span>Xem toàn bộ bác sĩ</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function DoctorResultCard({
  doctor,
  index,
}: {
  doctor: DoctorSummary;
  index: number;
}) {
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length] || 'bg-slate-200';

  return (
    <article className="clinic-card p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <DoctorAvatar doctor={doctor} colorClass={avatarColor} size="small" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-950">{doctor.displayName}</h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {doctor.specialty ?? 'Đa khoa'}
            </span>
          </div>
          <div className="mt-3">
            <StarRating stars={doctor.averageStars} />
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">{getDoctorHeadline(doctor)}.</p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="material-symbols-outlined text-base text-primary">bolt</span>
          <span>Chuyển ngay sang bước chọn ca khám</span>
        </div>
        <Link to={`/booking?doctorId=${doctor.id}`} className="btn-primary px-4 py-2.5">
          Đặt lịch
        </Link>
      </div>
    </article>
  );
}

export function DoctorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState(ALL_SPECIALTIES);

  const { data: doctors = [], isLoading, isError } = useQuery({
    queryKey: ['customer', 'doctors'],
    queryFn: () => customerApi.getDoctors(),
  });

  const specialties = useMemo(
    () =>
      Array.from(new Set(doctors.map((doctor) => doctor.specialty).filter(Boolean))).sort((a, b) =>
        String(a).localeCompare(String(b), 'vi'),
      ) as string[],
    [doctors],
  );

  const featuredDoctor = useMemo(() => {
    if (doctors.length === 0) return null;
    return [...doctors].sort((a, b) => (b.averageStars ?? 0) - (a.averageStars ?? 0))[0] ?? doctors[0];
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    const normalizedQuery = normalizeText(searchQuery.trim());

    return doctors.filter((doctor) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        normalizeText(doctor.displayName).includes(normalizedQuery);
      const matchesSpecialty =
        selectedSpecialty === ALL_SPECIALTIES || doctor.specialty === selectedSpecialty;
      return matchesQuery && matchesSpecialty;
    });
  }, [doctors, searchQuery, selectedSpecialty]);

  return (
    <div className="clinic-page" data-testid="public-doctors-page">
      <PatientNavbar />

      <InfoPageHeader
        icon="groups"
        eyebrow="Đội ngũ bác sĩ"
        title="Chọn bác sĩ theo chuyên khoa, đánh giá và nhu cầu khám"
        description="Trang này được tổ chức như một danh mục chọn nhanh để bạn tìm đúng bác sĩ trước khi chuyển sang đặt lịch."
        metrics={
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="clinic-kpi">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Bác sĩ đang mở lịch
              </p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                {doctors.length}
              </p>
            </div>
            <div className="clinic-kpi">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Chuyên khoa khả dụng
              </p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                {specialties.length}
              </p>
            </div>
          </div>
        }
      />

      <main className="clinic-section space-y-6">
        {isError && (
          <div className="surface-alert">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              <p>Không thể tải danh sách bác sĩ. Vui lòng thử lại sau.</p>
            </div>
          </div>
        )}

        {!isError && featuredDoctor && <FeaturedDoctor doctor={featuredDoctor} />}

        <section className="clinic-card p-6 sm:p-8" id="doctor-results">
          <div className="grid gap-6 border-b border-slate-200 pb-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <SectionHeading
              eyebrow="Chọn nhanh"
              title="Tìm bác sĩ theo tên hoặc chuyên khoa"
              description="Giảm thời gian đọc danh sách dài bằng một ô tìm kiếm và nhóm chuyên khoa nổi bật."
            />

            <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <span className="font-semibold text-slate-950">{filteredDoctors.length}</span> kết quả phù
              hợp
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            <label className="block">
              <span className="field-label">Tìm theo tên bác sĩ</span>
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  search
                </span>
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Ví dụ: Trần Thị Hương"
                  className="input-field pl-12"
                  data-testid="public-doctors-search"
                />
              </div>
            </label>

            <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm font-semibold text-slate-950">Đi nhanh tới bước đặt lịch</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Khi chọn bác sĩ, hệ thống sẽ mở thẳng phần ca khám còn trống.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {[ALL_SPECIALTIES, ...specialties].map((specialty) => {
              const isActive = selectedSpecialty === specialty;
              return (
                <button
                  key={specialty}
                  type="button"
                  onClick={() => setSelectedSpecialty(specialty)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {specialty}
                </button>
              );
            })}
          </div>

          <div className="mt-6 clinic-grid sm:grid-cols-2 xl:grid-cols-3">
            {isLoading &&
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="clinic-card animate-pulse p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-full bg-slate-200" />
                    <div className="flex-1">
                      <div className="h-5 w-40 rounded bg-slate-200" />
                      <div className="mt-3 h-4 w-28 rounded bg-slate-200" />
                      <div className="mt-4 h-4 w-full rounded bg-slate-200" />
                    </div>
                  </div>
                  <div className="mt-5 h-10 rounded-2xl bg-slate-200" />
                </div>
              ))}

            {!isLoading &&
              filteredDoctors.map((doctor, index) => (
                <DoctorResultCard key={doctor.id} doctor={doctor} index={index} />
              ))}
          </div>

          {!isLoading && !isError && filteredDoctors.length === 0 && (
            <div className="clinic-empty mt-6">
              <span className="material-symbols-outlined text-5xl text-slate-300">person_search</span>
              <p className="mt-3 text-slate-600">
                Chưa tìm thấy bác sĩ phù hợp với bộ lọc hiện tại.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSpecialty(ALL_SPECIALTIES);
                }}
                className="btn-secondary mt-5"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </section>
      </main>

      <PatientFooter />
    </div>
  );
}
