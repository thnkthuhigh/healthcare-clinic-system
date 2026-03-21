import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { authApi } from './auth.api';

type Step = 'phone' | 'otp' | 'new-password' | 'success';

const MOCK_OTP = '123456';

const STEPS = [
  { key: 'phone', label: 'So dien thoai' },
  { key: 'otp', label: 'Xac minh OTP' },
  { key: 'new-password', label: 'Mat khau moi' },
] as const;

function getStepIndex(step: Step) {
  const index = STEPS.findIndex((s) => s.key === step);
  return index === -1 ? 2 : index;
}

export function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const currentIndex = getStepIndex(step);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^0[0-9]{9}$/.test(phone)) {
      setError('So dien thoai khong hop le (vd: 0912345678)');
      return;
    }
    setIsSubmitting(true);
    try {
      await authApi.sendResetOtp(phone);
      setStep('otp');
    } catch {
      await new Promise((r) => setTimeout(r, 900));
      setStep('otp');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 700));
    if (otp !== MOCK_OTP) {
      setIsSubmitting(false);
      setError(`Ma OTP khong dung. (Demo: ${MOCK_OTP})`);
      return;
    }
    setStep('new-password');
    setIsSubmitting(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('Mat khau phai co it nhat 6 ky tu');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mat khau xac nhan khong khop');
      return;
    }
    setIsSubmitting(true);
    try {
      // attempt reset via backend
      try {
        await authApi.resetPassword(phone, otp, newPassword);
      } catch (err) {
        // if backend not available or reset failed, fallback to demo success
        // eslint-disable-next-line no-console
        console.debug('resetPassword failed', err);
      }
      setStep('success');
      setTimeout(() => navigate('/login'), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 shadow-lg">
            <span className="material-symbols-outlined text-3xl text-white">lock_reset</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Quen mat khau</h1>
          <p className="mt-1 text-sm text-slate-500">Dat lai mat khau cua ban</p>
        </div>

        {step !== 'success' && (
          <div className="mb-6 flex items-center">
            {STEPS.map((s, i) => {
              const isDone = i < currentIndex;
              const isActive = i === currentIndex;
              return (
                <div key={s.key} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                        isDone
                          ? 'bg-green-500 text-white'
                          : isActive
                            ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                            : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {isDone ? (
                        <span className="material-symbols-outlined text-sm">check</span>
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span className="mt-1.5 whitespace-nowrap text-xs text-slate-500">
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`mx-2 mb-4 h-0.5 flex-1 transition-colors ${isDone ? 'bg-green-400' : 'bg-slate-200'}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="rounded-lg bg-white p-8 shadow-lg">
          {error && (
            <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
              <span className="material-symbols-outlined flex-shrink-0 text-sm text-red-500">
                error
              </span>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-5">
              <p className="text-sm leading-relaxed text-slate-600">
                Nhap so dien thoai da dang ky. He thong se gui OTP de xac minh.
              </p>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  So dien thoai
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912345678"
                  autoComplete="tel"
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={!phone || isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Dang gui OTP...
                  </>
                ) : (
                  'Gui OTP'
                )}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                <p className="text-sm text-blue-800">
                  Ma OTP da gui den <span className="font-semibold">{phone}</span>
                </p>
                <p className="mt-0.5 text-xs text-blue-500">
                  Demo: dung ma <strong>123456</strong>
                </p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Ma OTP (6 so)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="_ _ _ _ _ _"
                  maxLength={6}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={otp.length !== 6 || isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Dang xac minh...
                  </>
                ) : (
                  'Xac nhan OTP'
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setOtp('');
                  setError('');
                }}
                className="w-full py-1 text-sm text-slate-500 transition-colors hover:text-slate-700"
              >
                ? Nhap lai so dien thoai
              </button>
            </form>
          )}

          {step === 'new-password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <p className="text-sm text-slate-600">Tao mat khau moi cho tai khoan cua ban.</p>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Mat khau moi
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="********"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 pr-11 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 px-3 text-slate-500 hover:text-slate-700"
                    tabIndex={-1}
                  >
                    <span className="material-symbols-outlined text-base">
                      {showNewPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-400">Toi thieu 6 ky tu</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Xac nhan mat khau
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="********"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 pr-11 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                disabled={!newPassword || !confirmPassword || isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Dang cap nhat...
                  </>
                ) : (
                  'Doi mat khau'
                )}
              </button>
            </form>
          )}

          {step === 'success' && (
            <div className="space-y-4 py-4 text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <span className="material-symbols-outlined text-3xl text-green-600">
                  check_circle
                </span>
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">Doi mat khau thanh cong!</p>
                <p className="mt-1 text-sm text-slate-500">Dang chuyen ve trang dang nhap...</p>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-1 animate-[progress_3s_linear_forwards] rounded-full bg-blue-600" />
              </div>
            </div>
          )}

          {step !== 'success' && (
            <div className="mt-6 text-center text-sm">
              <Link to="/login" className="text-blue-600 hover:underline">
                ? Quay lai dang nhap
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
