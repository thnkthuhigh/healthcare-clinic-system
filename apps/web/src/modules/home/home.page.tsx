import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-3xl font-semibold">Clinic System</h1>
        <p className="mt-2 text-sm text-slate-600">Hệ thống phòng khám — Monorepo.</p>

        {/* Patient section */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-slate-700 mb-3">🏥 Dành cho Bệnh nhân</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-lg bg-primary px-5 py-2.5 text-white font-semibold hover:bg-primary-dark transition-colors"
              to="/booking"
            >
              📅 Đặt lịch khám
            </Link>
            <Link
              className="rounded-lg border border-primary text-primary px-5 py-2.5 font-semibold hover:bg-primary/5 transition-colors"
              to="/health-profile"
            >
              📋 Hồ sơ sức khỏe
            </Link>
          </div>
        </div>

        {/* Staff section */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-slate-700 mb-3">👨‍⚕️ Dành cho Nhân viên</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 hover:border-slate-400 transition-colors"
              to="/login"
            >
              Đăng nhập
            </Link>
            <Link
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 hover:border-slate-400 transition-colors"
              to="/doctor/dashboard"
            >
              Bảng điều khiển Bác sĩ
            </Link>
          </div>
        </div>

        {/* Dev links */}
        <div className="mt-8 border-t border-slate-200 pt-5">
          <p className="text-xs text-slate-400 mb-2">Dev / Debug</p>
          <a
            className="text-xs text-slate-400 underline"
            href="http://localhost:4000/api/v1/health"
            rel="noreferrer"
            target="_blank"
          >
            API Health Check
          </a>
        </div>
      </div>
    </div>
  );
}
