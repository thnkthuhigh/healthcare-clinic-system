import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AuthShell } from '../../components/ClinicUI';

import { authApi } from './auth.api';

export function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.register({ fullName, phone, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      icon="person_add"
      title="Tạo tài khoản bệnh nhân"
      description="Dùng số điện thoại để lưu lịch hẹn, tra cứu hồ sơ và theo dõi các lần khám sau này."
    >
      {success ? (
        <div className="space-y-3 text-center" data-testid="auth-register-success">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <span className="material-symbols-outlined text-3xl">check_circle</span>
          </div>
          <p className="text-lg font-semibold text-slate-900">Đăng ký thành công</p>
          <p className="text-sm text-slate-600">Hệ thống đang chuyển sang trang đăng nhập.</p>
        </div>
      ) : (
        <form onSubmit={handleRegister} className="space-y-5" data-testid="auth-register-form">
          {error && (
            <div className="surface-alert" data-testid="auth-register-error">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                <p>{error}</p>
              </div>
            </div>
          )}

          <div>
            <label className="field-label">Họ và tên</label>
            <input
              className="input-field"
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
              value={fullName}
              type="text"
              autoComplete="name"
              disabled={isSubmitting}
              data-testid="auth-register-full-name"
            />
          </div>

          <div>
            <label className="field-label">Số điện thoại</label>
            <input
              className="input-field"
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0912345678"
              value={phone}
              type="tel"
              autoComplete="tel"
              disabled={isSubmitting}
              data-testid="auth-register-phone"
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
                autoComplete="new-password"
                disabled={isSubmitting}
                data-testid="auth-register-password"
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

          <div>
            <label className="field-label">Xác nhận mật khẩu</label>
            <div className="relative">
              <input
                className="input-field pr-11"
                onChange={(e) => setConfirmPassword(e.target.value)}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                autoComplete="new-password"
                disabled={isSubmitting}
                data-testid="auth-register-confirm-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 px-3 text-slate-500 transition-colors hover:text-slate-700"
                tabIndex={-1}
              >
                <span className="material-symbols-outlined text-base">
                  {showConfirmPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!fullName || !phone || !password || !confirmPassword || isSubmitting}
            className="btn-primary w-full"
            data-testid="auth-register-submit"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Đang đăng ký</span>
              </>
            ) : (
              'Đăng ký'
            )}
          </button>
        </form>
      )}

      <div className="mt-6 space-y-2 text-center text-sm">
        <p className="text-slate-600">
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Đăng nhập
          </Link>
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>Về trang công khai</span>
        </Link>
      </div>
    </AuthShell>
  );
}
