import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';

import { AuthShell } from '../../components/ClinicUI';

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
    return <Navigate to={getRedirectPath(user.role)} replace />;
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
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      icon="shield_lock"
      title="Đăng nhập nội bộ"
      description="Dành cho bác sĩ, lễ tân, thu ngân và quản trị viên đã được cấp tài khoản."
    >
      <form onSubmit={handleLogin} className="space-y-5" data-testid="auth-login-form">
        {error && (
          <div className="surface-alert" data-testid="auth-login-error">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              <p>{error}</p>
            </div>
          </div>
        )}

        <div>
          <label className="field-label">Số điện thoại</label>
          <input
            className="input-field"
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0900000000"
            value={phone}
            type="tel"
            autoComplete="tel"
            disabled={isSubmitting}
            data-testid="auth-login-phone"
          />
        </div>

        <div>
          <label className="field-label">Mật khẩu</label>
          <div className="relative">
            <input
              className="input-field pr-11"
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? 'text' : 'password'}
              placeholder="Nhập mật khẩu"
              value={password}
              autoComplete="current-password"
              disabled={isSubmitting}
              data-testid="auth-login-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 px-3 text-slate-500 transition-colors hover:text-slate-700"
              tabIndex={-1}
            >
              <span className="material-symbols-outlined text-base">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        <div className="surface-note">
          <div className="flex gap-2">
            <span className="material-symbols-outlined text-sm text-primary">info</span>
            <div className="space-y-1 text-xs">
              <p className="font-semibold text-slate-900">Tài khoản thử nghiệm</p>
              <p>Owner: 0900000000 / owner123</p>
              <p>Admin: 0903456789 / password123</p>
              <p>Bác sĩ: 0901234567 / password123</p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!phone || !password || isSubmitting}
          className="btn-primary w-full"
          data-testid="auth-login-submit"
        >
          {isSubmitting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Đang đăng nhập</span>
            </>
          ) : (
            'Đăng nhập'
          )}
        </button>
      </form>

      <div className="mt-6 space-y-2 text-center text-sm">
        <p className="text-slate-600">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Đăng ký
          </Link>
        </p>
        <p>
          <Link
            to="/forgot-password"
            className="text-slate-500 transition-colors hover:text-primary hover:underline"
            data-testid="auth-login-forgot-link"
          >
            Quên mật khẩu
          </Link>
        </p>
        <Link to="/" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>Về trang công khai</span>
        </Link>
      </div>
    </AuthShell>
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
      return '/';
    default:
      return '/';
  }
}
