import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

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
      setError('Mat khau xac nhan khong khop');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.register({ fullName, phone, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dang ky that bai');
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
          <p className="mt-2 text-slate-600">Dang ky tai khoan benh nhan</p>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-lg">
          {success ? (
            <div className="space-y-3 text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <span className="material-symbols-outlined text-3xl text-green-600">
                  check_circle
                </span>
              </div>
              <p className="text-lg font-semibold text-slate-900">Dang ky thanh cong!</p>
              <p className="text-sm text-slate-600">Dang chuyen den trang dang nhap...</p>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-red-600">error</span>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Ho va ten</label>
                <input
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyen Van A"
                  value={fullName}
                  type="text"
                  autoComplete="name"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  So dien thoai
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912345678"
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
                    autoComplete="new-password"
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

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Xac nhan mat khau
                </label>
                <div className="relative">
                  <input
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 pr-11 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="********"
                    value={confirmPassword}
                    autoComplete="new-password"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 px-3 text-slate-500 hover:text-slate-700"
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
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Dang dang ky...
                  </>
                ) : (
                  'Dang ky'
                )}
              </button>
            </form>
          )}

          <div className="mt-6 space-y-2 text-center text-sm">
            <p className="text-slate-600">
              Da co tai khoan?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:underline">
                Dang nhap
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
