import { Link, Navigate } from 'react-router-dom';

import { useAuth } from '../auth/useAuth';

export function HomePage() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/mainpage" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-4xl p-6">
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">🏥 Healthcare Clinic System</h1>
          <p className="text-lg text-slate-600">Comprehensive clinic management solution</p>
        </div>

        {/* Role Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
          {/* Doctor Portal */}
          <Link
            to="/doctor"
            className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md hover:border-blue-300 transition-all group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <span className="material-symbols-outlined text-3xl text-blue-600">
                  medical_information
                </span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Doctor</h3>
              <p className="text-sm text-slate-600">
                Manage patients, consultations & prescriptions
              </p>
            </div>
          </Link>

          {/* Receptionist Portal - Coming Soon */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 opacity-60 cursor-not-allowed relative">
            <div className="absolute top-2 right-2 bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded">
              Coming Soon
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl text-green-600">
                  calendar_month
                </span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Receptionist</h3>
              <p className="text-sm text-slate-600">Appointments & patient check-in</p>
            </div>
          </div>

          {/* Pharmacist Portal - Coming Soon */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 opacity-60 cursor-not-allowed relative">
            <div className="absolute top-2 right-2 bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded">
              Coming Soon
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl text-purple-600">
                  medication
                </span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Pharmacist</h3>
              <p className="text-sm text-slate-600">Inventory & prescription dispensing</p>
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

        {/* Quick Links */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            className="rounded bg-slate-900 px-6 py-3 text-white hover:bg-slate-800 transition-colors font-medium"
            to="/login"
          >
            🔐 Login
          </Link>
          <a
            className="rounded border border-slate-300 bg-white px-6 py-3 hover:bg-slate-50 transition-colors font-medium"
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
