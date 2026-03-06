import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { authApi } from './auth.api';

export function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.register({ fullName, phone, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại');
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
          <p className="text-slate-600 mt-2">Đăng ký tài khoản bệnh nhân</p>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {success ? (
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full">
                <span className="material-symbols-outlined text-green-600 text-3xl">
                  check_circle
                </span>
              </div>
              <p className="text-slate-900 font-semibold text-lg">Đăng ký thành công!</p>
              <p className="text-slate-600 text-sm">Đang chuyển đến trang đăng nhập...</p>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex gap-2 items-center">
                    <span className="material-symbols-outlined text-red-600 text-sm">error</span>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Full Name Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Họ và tên</label>
                <input
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  value={fullName}
                  type="text"
                  autoComplete="name"
                  disabled={isSubmitting}
                />
              </div>

              {/* Phone Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Số điện thoại
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912345678"
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
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
              </div>

              {/* Confirm Password Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Xác nhận mật khẩu
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!fullName || !phone || !password || !confirmPassword || isSubmitting}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang đăng ký...
                  </>
                ) : (
                  'Đăng ký'
                )}
              </button>
            </form>
          )}

          {/* Footer Links */}
          <div className="mt-6 text-center text-sm space-y-2">
            <p className="text-slate-600">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-blue-600 hover:underline font-medium">
                Đăng nhập
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
