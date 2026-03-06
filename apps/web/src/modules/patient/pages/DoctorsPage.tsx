import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { customerApi } from '../api';
import { PatientFooter } from '../components/PatientFooter';
import { PatientNavbar } from '../components/PatientNavbar';

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-teal-500',
  'bg-emerald-500',
  'bg-cyan-500',
  'bg-violet-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-indigo-500',
];

function getInitials(name: string): string {
  const parts = name.replace('BS.', '').trim().split(' ');
  const first = parts[0]?.[0] ?? '';
  const last = parts.length >= 2 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase() || name.slice(0, 2).toUpperCase();
}

function StarRating({ stars }: { stars: number | null }) {
  const value = stars ?? 0;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`material-symbols-outlined text-sm ${i <= Math.round(value) ? 'text-amber-400' : 'text-slate-300'}`}
        >
          star
        </span>
      ))}
      <span className="text-xs font-semibold text-slate-700 ml-0.5">
        {value > 0 ? value.toFixed(1) : 'Chưa có đánh giá'}
      </span>
    </div>
  );
}

function DoctorCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center animate-pulse">
      <div className="w-20 h-20 bg-slate-200 rounded-full mb-4" />
      <div className="h-4 bg-slate-200 rounded w-32 mb-2" />
      <div className="h-3 bg-slate-200 rounded w-24 mb-3" />
      <div className="h-3 bg-slate-200 rounded w-20 mb-5" />
      <div className="flex gap-2 w-full">
        <div className="flex-1 h-9 bg-slate-200 rounded-xl" />
        <div className="flex-1 h-9 bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
}

export function DoctorsPage() {
  const {
    data: doctors,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['customer', 'doctors'],
    queryFn: () => customerApi.getDoctors(),
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <PatientNavbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-4">
            <span className="material-symbols-outlined text-sm">medical_services</span>
            <span className="text-sm font-medium">Đội ngũ bác sĩ chuyên nghiệp</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Danh sách Bác sĩ</h1>
          <p className="text-blue-100 max-w-xl mx-auto">
            Đội ngũ bác sĩ giàu kinh nghiệm, tận tâm với bệnh nhân tại Healthcare Clinic
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Error state */}
        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center mb-8">
            <span className="material-symbols-outlined text-red-400 text-3xl block mb-2">
              error
            </span>
            <p className="text-red-700 font-medium">Không thể tải danh sách bác sĩ</p>
            <p className="text-red-500 text-sm mt-1">Vui lòng thử lại sau</p>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <DoctorCardSkeleton key={i} />)
            : doctors?.map((doc, idx) => {
                const initials = getInitials(doc.displayName);
                const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                return (
                  <div
                    key={doc.id}
                    className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center text-center hover:shadow-md hover:border-blue-200 transition-all"
                  >
                    {/* Avatar */}
                    <div
                      className={`w-20 h-20 ${avatarColor} rounded-full flex items-center justify-center mb-4 shadow-md`}
                    >
                      {doc.avatarUrl ? (
                        <img
                          src={doc.avatarUrl}
                          alt={doc.displayName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-white">{initials}</span>
                      )}
                    </div>

                    {/* Info */}
                    <h3 className="font-semibold text-slate-900">{doc.displayName}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">{doc.specialty ?? 'Đa khoa'}</p>

                    <div className="mt-2">
                      <StarRating stars={doc.averageStars} />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-5 w-full">
                      <Link
                        to={`/booking?doctorId=${doc.id}`}
                        className="flex-1 py-2.5 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors font-medium text-center"
                      >
                        Đặt lịch
                      </Link>
                    </div>
                  </div>
                );
              })}
        </div>

        {/* Empty state */}
        {!isLoading && !isError && doctors?.length === 0 && (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-slate-300 text-6xl block mb-4">
              person_off
            </span>
            <p className="text-slate-500 text-lg">Chưa có bác sĩ nào</p>
          </div>
        )}
      </main>

      <PatientFooter />
    </div>
  );
}
