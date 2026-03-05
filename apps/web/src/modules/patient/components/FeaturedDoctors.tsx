import { Link } from 'react-router-dom';

import type { MockDoctor } from '../mock';

interface FeaturedDoctorsProps {
  doctors: MockDoctor[];
}

export function FeaturedDoctors({ doctors }: FeaturedDoctorsProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900">Bác sĩ nổi bật</h2>
        <Link
          to="/doctors"
          className="text-sm text-blue-600 hover:underline flex items-center gap-0.5"
        >
          Xem tất cả
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {doctors.map((doc) => (
          <div
            key={doc.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col items-center text-center hover:shadow-md hover:border-blue-200 transition-all"
          >
            <div
              className={`w-16 h-16 ${doc.avatarColor} rounded-full flex items-center justify-center mb-3 shadow-md`}
            >
              <span className="text-xl font-bold text-white">{doc.initials}</span>
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">{doc.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{doc.specialty}</p>
            <div className="flex items-center gap-1 mt-2">
              <span className="material-symbols-outlined text-amber-400 text-sm">star</span>
              <span className="text-xs font-semibold text-slate-700">{doc.rating}</span>
              <span className="text-xs text-slate-400">({doc.reviewCount} đánh giá)</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{doc.yearsExp} năm kinh nghiệm</p>
            <div className="flex gap-2 mt-4 w-full">
              <Link
                to={`/doctors/${doc.id}`}
                className="flex-1 py-2 border border-slate-200 text-slate-600 text-xs rounded-xl hover:bg-slate-50 transition-colors font-medium"
              >
                Xem hồ sơ
              </Link>
              <Link
                to={`/booking?doctorId=${doc.id}`}
                className="flex-1 py-2 bg-blue-600 text-white text-xs rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                Đặt lịch
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
