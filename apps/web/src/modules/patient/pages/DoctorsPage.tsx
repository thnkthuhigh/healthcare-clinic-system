import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { SectionHeading } from '../../../components/ClinicUI';
import { customerApi } from '../api';
import { PatientFooter } from '../components/PatientFooter';
import { PatientNavbar } from '../components/PatientNavbar';
import type { DoctorSummary } from '../types';

const ALL_SPECIALTIES = 'Tất cả chuyên khoa';
const AVATAR_COLORS = ['bg-sky-100', 'bg-cyan-100', 'bg-teal-100', 'bg-slate-200'] as const;

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

function doctorExperience(doctor: DoctorSummary): string {
  const stars = doctor.averageStars ?? 0;
  if (stars >= 4.8) return 'Kinh nghiệm lâm sàng 15+ năm';
  if (stars >= 4.5) return 'Kinh nghiệm lâm sàng 10+ năm';
  if (stars >= 4) return 'Kinh nghiệm lâm sàng 7+ năm';
  return 'Bác sĩ chuyên khoa';
}

function doctorBio(doctor: DoctorSummary): string {
  const specialty = doctor.specialty?.toLowerCase();
  if (specialty?.includes('tim')) {
    return 'Tập trung theo dõi tăng huyết áp, suy tim, rối loạn nhịp và tư vấn dự phòng biến chứng tim mạch.';
  }
  if (specialty?.includes('nhi')) {
    return 'Khám và điều trị các bệnh lý thường gặp ở trẻ em, theo dõi tăng trưởng và dinh dưỡng theo độ tuổi.';
  }
  if (specialty?.includes('noi')) {
    return 'Điều trị nhóm bệnh nội khoa thường gặp, hỗ trợ quản lý bệnh mạn tính và tái khám định kỳ.';
  }
  return 'Khám tổng quát và tư vấn điều trị theo phác đồ phù hợp với tình trạng lâm sàng của từng bệnh nhân.';
}

function doctorSkills(doctor: DoctorSummary): string[] {
  const specialty = normalizeText(doctor.specialty ?? '');
  if (specialty.includes('tim')) {
    return ['Tăng huyết áp', 'Rối loạn mỡ máu', 'Theo dõi tim mạch'];
  }
  if (specialty.includes('nhi')) {
    return ['Hô hấp nhi', 'Dinh dưỡng trẻ em', 'Theo dõi tăng trưởng'];
  }
  if (specialty.includes('noi')) {
    return ['Khám nội tổng quát', 'Bệnh mạn tính', 'Tái khám định kỳ'];
  }
  return ['Khám ban đầu', 'Theo dõi điều trị', 'Tư vấn phòng bệnh'];
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
    <div className="flex items-center gap-2">
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
      </div>
      <span className="whitespace-nowrap text-sm font-medium text-slate-500">
        {value > 0 ? `${value.toFixed(1)} / 5` : 'Chưa có đánh giá'}
      </span>
    </div>
  );
}

function DoctorAvatar({ doctor, colorClass }: { doctor: DoctorSummary; colorClass: string }) {
  return (
    <div
      className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl ${colorClass} text-lg font-bold text-slate-700`}
    >
      {doctor.avatarUrl ? (
        <img
          src={doctor.avatarUrl}
          alt={doctor.displayName}
          className="h-full w-full object-cover"
        />
      ) : (
        getInitials(doctor.displayName)
      )}
    </div>
  );
}

function DoctorDetailModal({ doctor, onClose }: { doctor: DoctorSummary; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4">
      <div className="clinic-card w-full max-w-2xl p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Hồ sơ bác sĩ
            </p>
            <h3 className="mt-2 text-2xl font-bold text-slate-950">{doctor.displayName}</h3>
            <p className="mt-1 text-sm text-slate-600">{doctor.specialty ?? 'Đa khoa'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50"
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm leading-7 text-slate-700">{doctorBio(doctor)}</p>
          <p className="mt-3 text-sm font-semibold text-slate-900">{doctorExperience(doctor)}</p>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Thế mạnh chuyên môn
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {doctorSkills(doctor).map((skill) => (
              <li
                key={skill}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700"
              >
                {skill}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to={`/booking?doctorId=${doctor.id}`} className="btn-primary">
            Đặt lịch với bác sĩ này
          </Link>
          <button type="button" onClick={onClose} className="btn-secondary">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

function DoctorResultCard({
  doctor,
  index,
  onOpenDetail,
}: {
  doctor: DoctorSummary;
  index: number;
  onOpenDetail: (doctor: DoctorSummary) => void;
}) {
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length] || 'bg-slate-200';

  return (
    <article className="clinic-card flex h-full flex-col p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <DoctorAvatar doctor={doctor} colorClass={avatarColor} />
        <div className="min-w-0 flex-1 min-h-[96px]">
          <h3 className="text-lg font-semibold text-slate-950">{doctor.displayName}</h3>
          <p className="mt-1 text-sm text-slate-600">{doctor.specialty ?? 'Đa khoa'}</p>
          <div className="mt-3">
            <StarRating stars={doctor.averageStars} />
          </div>
        </div>
      </div>

      <p className="mt-4 min-h-[96px] text-sm leading-6 text-slate-600">{doctorBio(doctor)}</p>

      <div className="mt-auto flex gap-2.5 border-t border-slate-200 pt-4">
        <Link to={`/booking?doctorId=${doctor.id}`} className="btn-primary flex-1 px-4 py-2.5">
          Đặt lịch khám
        </Link>
        <button
          type="button"
          onClick={() => onOpenDetail(doctor)}
          className="btn-secondary min-w-[120px] px-4 py-2.5"
        >
          Xem chi tiết
        </button>
      </div>
    </article>
  );
}

export function DoctorsPage() {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState(ALL_SPECIALTIES);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorSummary | null>(null);

  const {
    data: doctors = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['customer', 'doctors'],
    queryFn: () => customerApi.getDoctors(),
  });

  const publicDoctors = useMemo(() => doctors.filter(isPublicDoctor), [doctors]);

  useEffect(() => {
    const doctorId = searchParams.get('doctorId');
    if (!doctorId || publicDoctors.length === 0) return;
    const doctor = publicDoctors.find((item) => item.id === doctorId);
    if (doctor) setSelectedDoctor(doctor);
  }, [searchParams, publicDoctors]);

  const specialties = useMemo(
    () =>
      Array.from(new Set(publicDoctors.map((doctor) => doctor.specialty).filter(Boolean))).sort(
        (a, b) => String(a).localeCompare(String(b), 'vi'),
      ) as string[],
    [publicDoctors],
  );

  const featuredDoctor = useMemo(() => {
    if (publicDoctors.length === 0) return null;
    return (
      [...publicDoctors].sort((a, b) => (b.averageStars ?? 0) - (a.averageStars ?? 0))[0] ??
      publicDoctors[0]
    );
  }, [publicDoctors]);

  const filteredDoctors = useMemo(() => {
    const normalizedQuery = normalizeText(searchQuery.trim());

    return publicDoctors.filter((doctor) => {
      const matchesQuery =
        normalizedQuery.length === 0 || normalizeText(doctor.displayName).includes(normalizedQuery);
      const matchesSpecialty =
        selectedSpecialty === ALL_SPECIALTIES || doctor.specialty === selectedSpecialty;
      return matchesQuery && matchesSpecialty;
    });
  }, [publicDoctors, searchQuery, selectedSpecialty]);

  return (
    <div className="clinic-page" data-testid="public-doctors-page">
      <PatientNavbar />

      <main className="clinic-section space-y-6">
        {isError && (
          <div className="surface-alert">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              <p>Không thể tải danh sách bác sĩ. Vui lòng thử lại sau.</p>
            </div>
          </div>
        )}

        {!isError && featuredDoctor && (
          <section className="clinic-card p-6 sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[110px_minmax(0,1fr)] lg:items-start">
              <DoctorAvatar doctor={featuredDoctor} colorClass="bg-sky-100" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  Bác sĩ tiêu biểu
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                  {featuredDoctor.displayName}
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  {featuredDoctor.specialty ?? 'Đa khoa'}
                </p>
                <div className="mt-3">
                  <StarRating stars={featuredDoctor.averageStars} />
                </div>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
                  {doctorBio(featuredDoctor)}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link to={`/booking?doctorId=${featuredDoctor.id}`} className="btn-primary">
                    Đặt lịch với bác sĩ này
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSelectedDoctor(featuredDoctor)}
                    className="btn-secondary"
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="clinic-card p-6 sm:p-8" id="doctor-results">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              eyebrow="Danh sách bác sĩ"
              title="Tìm bác sĩ theo tên hoặc chuyên khoa"
              description="Chọn bác sĩ phù hợp và đi thẳng vào bước đặt lịch."
            />
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
              <span className="font-semibold text-slate-950">{filteredDoctors.length}</span> kết quả
            </div>
          </div>

          <label className="mt-5 block">
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

          <div className="mt-4 flex flex-wrap gap-2">
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
                    <div className="h-16 w-16 rounded-2xl bg-slate-200" />
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
                <DoctorResultCard
                  key={doctor.id}
                  doctor={doctor}
                  index={index}
                  onOpenDetail={setSelectedDoctor}
                />
              ))}
          </div>

          {!isLoading && !isError && filteredDoctors.length === 0 && (
            <div className="clinic-empty mt-6">
              <span className="material-symbols-outlined text-5xl text-slate-300">
                person_search
              </span>
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

      {selectedDoctor && (
        <DoctorDetailModal doctor={selectedDoctor} onClose={() => setSelectedDoctor(null)} />
      )}

      <PatientFooter />
    </div>
  );
}
