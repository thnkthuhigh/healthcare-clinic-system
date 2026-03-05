import { Link } from 'react-router-dom';

import type { MockService } from '../mock';

interface ClinicServicesProps {
  services: MockService[];
}

export function ClinicServices({ services }: ClinicServicesProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900">Dịch vụ phòng khám</h2>
        <Link
          to="/services"
          className="text-sm text-blue-600 hover:underline flex items-center gap-0.5"
        >
          Xem tất cả
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {services.map((s) => (
          <Link
            key={s.id}
            to={`/services/${s.id}`}
            className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col items-center text-center hover:shadow-md hover:border-blue-200 transition-all group"
          >
            <div
              className={`w-12 h-12 ${s.bgColor} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
            >
              <span className={`material-symbols-outlined ${s.iconColor}`}>{s.icon}</span>
            </div>
            <h3 className="text-xs font-semibold text-slate-900 leading-tight">{s.title}</h3>
            <p className="text-xs text-slate-400 mt-1 leading-tight line-clamp-2">
              {s.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
