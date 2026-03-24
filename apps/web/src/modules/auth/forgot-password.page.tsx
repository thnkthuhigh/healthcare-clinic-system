import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AuthShell } from '../../components/ClinicUI';

import { authApi } from './auth.api';

type Step = 'phone' | 'otp' | 'new-password' | 'success';

const STEPS = [
  { key: 'phone', label: 'Số điện thoại' },
  { key: 'otp', label: 'Xác minh OTP' },
  { key: 'new-password', label: 'Mật khẩu mới' },
] as const;

function getStepIndex(step: Step) {
  const index = STEPS.findIndex((item) => item.key === step);
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
      setError('Số điện thoại không hợp lệ, ví dụ 0912345678.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.sendResetOtp(phone);
      setStep('otp');
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 900));
      setStep('otp');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await authApi.resetPassword(phone, otp, '__verify_only__');
      setStep('new-password');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mã OTP không đúng hoặc đã hết hạn.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.resetPassword(phone, otp, newPassword);
      setStep('success');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đặt lại mật khẩu thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      icon="lock_reset"
      title="Khôi phục mật khẩu"
      description="Xác minh số điện thoại và cập nhật lại mật khẩu cho tài khoản đã đăng ký."
    >
      {step !== 'success' && (
        <div className="mb-6 flex items-center">
          {STEPS.map((item, index) => {
            const isDone = index < currentIndex;
            const isActive = index === currentIndex;

            return (
              <div key={item.key} className="flex flex-1 items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                      isDone
                        ? 'bg-primary text-white'
                        : isActive
                          ? 'border border-primary bg-primary/10 text-primary'
                          : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isDone ? (
                      <span className="material-symbols-outlined text-sm">check</span>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className="mt-1.5 whitespace-nowrap text-[11px] text-slate-500">{item.label}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`mx-2 mb-4 h-px flex-1 ${isDone ? 'bg-primary' : 'bg-slate-200'}`} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <div className="surface-alert mb-5" data-testid="auth-forgot-error">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            <p>{error}</p>
          </div>
        </div>
      )}

      {step === 'phone' && (
        <form onSubmit={handlePhoneSubmit} className="space-y-5" data-testid="auth-forgot-phone-form">
          <p className="text-sm leading-6 text-slate-600">
            Nhập số điện thoại đã đăng ký. Hệ thống sẽ gửi mã OTP để xác minh yêu cầu khôi phục mật khẩu.
          </p>
          <div>
            <label className="field-label">Số điện thoại</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0912345678"
              autoComplete="tel"
              disabled={isSubmitting}
              className="input-field"
              data-testid="auth-forgot-phone"
            />
          </div>
          <button
            type="submit"
            disabled={!phone || isSubmitting}
            className="btn-primary w-full"
            data-testid="auth-forgot-send-otp"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Đang gửi OTP</span>
              </>
            ) : (
              'Gửi OTP'
            )}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleOtpSubmit} className="space-y-5" data-testid="auth-forgot-otp-form">
          <div className="surface-note">
            <p>
              Mã OTP đã được gửi tới <span className="font-semibold text-slate-900">{phone}</span>.
            </p>
          </div>
          <div>
            <label className="field-label">Mã OTP</label>
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              disabled={isSubmitting}
              className="input-field text-center font-mono text-2xl tracking-[0.5em]"
              data-testid="auth-forgot-otp"
            />
          </div>
          <button
            type="submit"
            disabled={otp.length !== 6 || isSubmitting}
            className="btn-primary w-full"
            data-testid="auth-forgot-verify-otp"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Đang xác minh</span>
              </>
            ) : (
              'Xác nhận OTP'
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep('phone');
              setOtp('');
              setError('');
            }}
            className="w-full text-sm text-slate-500 transition-colors hover:text-primary"
          >
            Nhập lại số điện thoại
          </button>
        </form>
      )}

      {step === 'new-password' && (
        <form
          onSubmit={handlePasswordSubmit}
          className="space-y-5"
          data-testid="auth-forgot-reset-form"
        >
          <p className="text-sm text-slate-600">Tạo mật khẩu mới cho tài khoản của bạn.</p>
          <div>
            <label className="field-label">Mật khẩu mới</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
                autoComplete="new-password"
                disabled={isSubmitting}
                className="input-field pr-11"
                data-testid="auth-forgot-new-password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 px-3 text-slate-500 transition-colors hover:text-slate-700"
                tabIndex={-1}
              >
                <span className="material-symbols-outlined text-base">
                  {showNewPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">Tối thiểu 6 ký tự</p>
          </div>

          <div>
            <label className="field-label">Xác nhận mật khẩu</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                autoComplete="new-password"
                disabled={isSubmitting}
                className="input-field pr-11"
                data-testid="auth-forgot-confirm-password"
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
            disabled={!newPassword || !confirmPassword || isSubmitting}
            className="btn-primary w-full"
            data-testid="auth-forgot-reset-submit"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Đang cập nhật</span>
              </>
            ) : (
              'Đổi mật khẩu'
            )}
          </button>
        </form>
      )}

      {step === 'success' && (
        <div className="space-y-3 text-center" data-testid="auth-forgot-success">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <span className="material-symbols-outlined text-3xl">check_circle</span>
          </div>
          <p className="text-lg font-semibold text-slate-900">Đã cập nhật mật khẩu</p>
          <p className="text-sm text-slate-600">Hệ thống sẽ chuyển bạn về màn đăng nhập sau ít giây.</p>
        </div>
      )}

      <div className="mt-6 space-y-2 text-center text-sm">
        <p className="text-slate-600">
          Đã nhớ mật khẩu?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Đăng nhập
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
