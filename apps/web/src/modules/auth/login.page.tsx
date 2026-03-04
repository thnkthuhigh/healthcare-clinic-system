import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

type UserRole = 'doctor' | 'receptionist' | 'pharmacist' | 'admin';

export function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('doctor');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual authentication
    // For now, just navigate based on role
    if (phone && password) {
      switch (role) {
        case 'doctor':
          navigate('/doctor/dashboard');
          break;
        case 'receptionist':
          // navigate('/receptionist/dashboard');
          alert('Receptionist module coming soon!');
          break;
        case 'pharmacist':
          // navigate('/pharmacist/dashboard');
          alert('Pharmacist module coming soon!');
          break;
        case 'admin':
          // navigate('/admin/dashboard');
          alert('Admin module coming soon!');
          break;
      }
    }
  };

  const roles: { value: UserRole; label: string; icon: string }[] = [
    { value: 'doctor', label: 'Doctor', icon: 'medical_information' },
    { value: 'receptionist', label: 'Receptionist', icon: 'calendar_month' },
    { value: 'pharmacist', label: 'Pharmacist', icon: 'medication' },
    { value: 'admin', label: 'Admin', icon: 'admin_panel_settings' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <span className="material-symbols-outlined text-3xl text-white">local_hospital</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Healthcare Clinic</h1>
          <p className="text-slate-600 mt-2">Sign in to your account</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">I am a</label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                      role === r.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{r.icon}</span>
                    <span className="text-sm">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Phone Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0901234567"
                value={phone}
                type="tel"
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                value={password}
              />
            </div>

            {/* Demo Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex gap-2">
                <span className="material-symbols-outlined text-amber-600 text-sm">info</span>
                <div className="flex-1">
                  <p className="text-xs text-amber-800 font-medium">Demo Mode</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Use any phone/password to access {role} portal
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!phone || !password}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Sign In as {roles.find((r) => r.value === role)?.label}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center text-sm">
            <Link to="/" className="text-blue-600 hover:underline">
              ← Back to Home
            </Link>
          </div>
        </div>

        {/* Quick Access for Development */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600 mb-3">Quick Access (Development):</p>
          <div className="flex gap-2 justify-center flex-wrap">
            <Link
              to="/doctor/dashboard"
              className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded hover:border-blue-400 transition-colors"
            >
              Doctor Dashboard
            </Link>
            <a
              href="http://localhost:4000/swagger-ui"
              target="_blank"
              rel="noreferrer"
              className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded hover:border-blue-400 transition-colors"
            >
              API Docs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
