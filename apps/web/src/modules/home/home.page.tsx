import { Link, Navigate } from 'react-router-dom';

import { useAuth } from '../auth/useAuth';

export function HomePage() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/mainpage" replace />;
  }

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

          {/* Admin Portal */}
          <Link
            to="/admin"
            className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md hover:border-red-300 transition-all group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-red-200 transition-colors">
                <span className="material-symbols-outlined text-3xl text-red-600">
                  admin_panel_settings
                </span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Admin</h3>
              <p className="text-sm text-slate-600">Quản trị hệ thống & điều phối khám</p>
            </div>
          </Link>
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
            ✅ Check API Health
          </a>
          <a
            className="rounded border border-slate-300 bg-white px-6 py-3 hover:bg-slate-50 transition-colors font-medium"
            href="http://localhost:4000/swagger-ui"
            rel="noreferrer"
            target="_blank"
          >
            📚 API Documentation
          </a>
        </div>

        {/* System Info */}
        <div className="mt-16 pt-8 border-t border-slate-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">4</p>
              <p className="text-sm text-slate-600 mt-1">Modules</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">8+</p>
              <p className="text-sm text-slate-600 mt-1">Features</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">15+</p>
              <p className="text-sm text-slate-600 mt-1">DB Tables</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">20+</p>
              <p className="text-sm text-slate-600 mt-1">API Endpoints</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-slate-500">
          <p>Built with React + Spring Boot + PostgreSQL</p>
          <p className="mt-1">
            Need help? Check{' '}
            <a
              href="https://github.com/thnkthuhigh/healthcare-clinic-system"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline"
            >
              Documentation
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
