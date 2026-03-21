import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from './useAuth';

export function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user } = useAuth();

  if (isAuthenticated && user) {
    const redirectTo = getRedirectPath(user.role);
    return <Navigate to={redirectTo} replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const loggedInUser = await login({ phone, password });
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
      navigate(from || getRedirectPath(loggedInUser.role), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dang nhap that bai');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-600">
            <span className="material-symbols-outlined text-3xl text-white">local_hospital</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Healthcare Clinic</h1>
          <p className="mt-2 text-slate-600">Dang nhap vao he thong</p>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-lg">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-red-600">error</span>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">So dien thoai</label>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0900000000"
                value={phone}
                type="tel"
                autoComplete="tel"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Mat khau</label>
              <div className="relative">
                <input
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 pr-11 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="********"
                  value={password}
                  autoComplete="current-password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 px-3 text-slate-500 hover:text-slate-700"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-base">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="flex gap-2">
                <span className="material-symbols-outlined text-sm text-blue-600">info</span>
                <div className="flex-1">
                  <p className="text-xs font-medium text-blue-800">Tai khoan mac dinh</p>
                  <p className="mt-1 text-xs text-blue-700">Owner: 0900000000 / owner123</p>
                  <p className="text-xs text-blue-700">Admin: 0903456789 / password123</p>
                  <p className="text-xs text-blue-700">BS. Le Van Minh: 0901234567 / password123</p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!phone || !password || isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Dang dang nhap...
                </>
              ) : (
                'Dang nhap'
              )}
            </button>
          </form>

          <div className="mt-6 space-y-2 text-center text-sm">
            <p className="text-slate-600">
              Chua co tai khoan?{' '}
              <Link to="/register" className="font-medium text-blue-600 hover:underline">
                Dang ky ngay
              </Link>
            </p>
            <p>
              <Link
                to="/forgot-password"
                className="text-slate-500 transition-colors hover:text-blue-600 hover:underline"
              >
                Quen mat khau?
              </Link>
            </p>
            <Link to="/" className="block text-blue-600 hover:underline">
              ? Ve trang chu
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function getRedirectPath(role: string): string {
  switch (role) {
    case 'OWNER':
    case 'ADMIN':
      return '/admin';
    case 'DOCTOR':
      return '/doctor/dashboard';
    case 'RECEPTIONIST':
    case 'CASHIER':
      return '/admin';
    case 'PATIENT':
      return '/mainpage';
    default:
      return '/mainpage';
  }
}
