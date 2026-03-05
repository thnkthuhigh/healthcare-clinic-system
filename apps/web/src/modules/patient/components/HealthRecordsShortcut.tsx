import { Link } from 'react-router-dom';

import type { MockHealthRecord } from '../mock';

interface HealthRecordsShortcutProps {
  records: MockHealthRecord[];
}

export function HealthRecordsShortcut({ records }: HealthRecordsShortcutProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900">Lịch sử khám gần đây</h2>
        <Link
          to="/health-records"
          className="text-sm text-blue-600 hover:underline flex items-center gap-0.5"
        >
          Xem tất cả
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {records.length === 0 ? (
          <div className="py-12 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-300">
              medical_information
            </span>
            <p className="text-slate-500 mt-3 font-medium">Bạn chưa có lịch sử khám bệnh.</p>
            <p className="text-slate-400 text-sm mt-1">Hãy đặt lịch để bắt đầu theo dõi sức khỏe</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {records.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-green-600 text-lg">
                      check_circle
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{r.diagnosis}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {r.doctorName} · {r.service}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-xs text-slate-400">{r.date}</p>
                  <Link
                    to={`/health-records/${r.id}`}
                    className="text-xs text-blue-600 hover:underline mt-0.5 block"
                  >
                    Chi tiết
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
