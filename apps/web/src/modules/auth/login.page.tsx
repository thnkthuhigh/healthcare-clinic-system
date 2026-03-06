import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import { useAuth } from './useAuth';

export function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user } = useAuth();

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectTo = getRedirectPath(user.role);
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const loggedInUser = await login({ phone, password });

      // Redirect to the page user was trying to access, or default by role
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
      navigate(from || getRedirectPath(loggedInUser.role), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <span className="material-symbols-outlined text-3xl text-white">local_hospital</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Healthcare Clinic</h1>
          <p className="text-slate-600 mt-2">Đăng nhập vào hệ thống</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex gap-2 items-center">
                  <span className="material-symbols-outlined text-red-600 text-sm">error</span>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Phone Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Số điện thoại</label>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0900000000"
                value={phone}
                type="tel"
                autoComplete="tel"
                disabled={isSubmitting}
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Mật khẩu</label>
              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                value={password}
                autoComplete="current-password"
                disabled={isSubmitting}
              />
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex gap-2">
                <span className="material-symbols-outlined text-blue-600 text-sm">info</span>
                <div className="flex-1">
                  <p className="text-xs text-blue-800 font-medium">Tài khoản mặc định</p>
                  <p className="text-xs text-blue-700 mt-1">Owner: 0900000000 / owner123</p>
                  <p className="text-xs text-blue-700">BS. Lê Văn Minh: 0901234567 / password123</p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!phone || !password || isSubmitting}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center text-sm space-y-2">
            <p className="text-slate-600">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-blue-600 hover:underline font-medium">
                Đăng ký ngay
              </Link>
            </p>
            <p>
              <Link
                to="/forgot-password"
                className="text-slate-500 hover:text-blue-600 hover:underline transition-colors"
              >
                Quên mật khẩu?
              </Link>
            </p>
            <Link to="/" className="text-blue-600 hover:underline block">
              ← Về trang chủ
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
      return '/doctor/dashboard';
    case 'DOCTOR':
      return '/doctor/dashboard';
    case 'RECEPTIONIST':
      return '/doctor/dashboard'; // TODO: receptionist dashboard
    case 'CASHIER':
      return '/doctor/dashboard'; // TODO: cashier dashboard
    case 'PATIENT':
      return '/mainpage';
    default:
      return '/mainpage';
  }
}
