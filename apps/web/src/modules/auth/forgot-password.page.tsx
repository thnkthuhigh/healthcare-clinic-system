import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AuthShell } from '../../components/ClinicUI';
import { OtpCodeInput } from '../../components/OtpCodeInput';

import { authApi } from './auth.api';
import type { ForgotPasswordChallenge } from './auth.types';

type Step = 'phone' | 'otp' | 'new-password' | 'success';

const STEPS = [
  { key: 'phone', label: 'So dien thoai' },
  { key: 'otp', label: 'Ma xac thuc' },
  { key: 'new-password', label: 'Mat khau moi' },
] as const;

function getStepIndex(step: Step) {
  const index = STEPS.findIndex((item) => item.key === step);
  return index === -1 ? 2 : index;
}

export function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [challenge, setChallenge] = useState<ForgotPasswordChallenge | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const currentIndex = getStepIndex(step);
  const isDoctorTotp = challenge?.method === 'TOTP';

  const handlePhoneSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!/^0[0-9]{9}$/.test(phone)) {
      setError('So dien thoai khong hop le, vi du 0912345678.');
      return;
    }

    setIsSubmitting(true);
    try {
      const nextChallenge = await authApi.sendResetOtp(phone);
      setChallenge(nextChallenge);
      setOtp('');
      setResetToken('');
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Khong the bat dau quy trinh khoi phuc.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (otp.length !== 6) {
      setError('Vui long nhap du 6 chu so.');
      return;
    }

    setIsSubmitting(true);
    try {
      const verification = await authApi.verifyResetOtp(phone, otp);
      setResetToken(verification.resetToken);
      setStep('new-password');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ma xac thuc khong dung hoac da het han.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Mat khau phai co it nhat 6 ky tu.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mat khau xac nhan khong khop.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.resetPassword(phone, resetToken, newPassword);
      setStep('success');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dat lai mat khau that bai.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetToPhoneStep = () => {
    setStep('phone');
    setChallenge(null);
    setOtp('');
    setResetToken('');
    setError('');
  };

  return (
    <AuthShell
      icon="lock_reset"
      title="Khoi phuc mat khau"
      description="Bac si dung ma TOTP 6 so trong app xac thuc da quet tu QR do admin hoac owner cap."
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
                  <span className="mt-1.5 whitespace-nowrap text-[11px] text-slate-500">
                    {item.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`mx-2 mb-4 h-px flex-1 ${isDone ? 'bg-primary' : 'bg-slate-200'}`}
                  />
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
        <form
          onSubmit={handlePhoneSubmit}
          className="space-y-5"
          data-testid="auth-forgot-phone-form"
        >
          <p className="text-sm leading-6 text-slate-600">
            Nhap so dien thoai da dang ky. Neu day la tai khoan bac si, he thong se yeu cau ma TOTP
            6 so tu app xac thuc da duoc cap QR truoc do, khong gui SMS.
          </p>
          <div>
            <label className="field-label">So dien thoai</label>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
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
                <span>Dang kiem tra</span>
              </>
            ) : (
              'Tiep tuc'
            )}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleOtpSubmit} className="space-y-5" data-testid="auth-forgot-otp-form">
          <div className="surface-note">
            <p className="font-semibold text-slate-900">{challenge?.message}</p>
            <p className="mt-1 text-xs text-slate-500">
              {isDoctorTotp
                ? `Tai khoan bac si ${phone} can ma 6 so tu app xac thuc da quet QR do admin hoac owner cap.`
                : `Ma OTP da duoc gui toi ${phone}.`}
            </p>
          </div>

          <div className="space-y-3">
            <label className="field-label">{isDoctorTotp ? 'Ma TOTP 6 so' : 'Ma OTP 6 so'}</label>
            <OtpCodeInput
              value={otp}
              onChange={setOtp}
              disabled={isSubmitting}
              autoFocus
              testId="auth-forgot-otp"
            />
            <p className="text-xs text-slate-500">
              {isDoctorTotp
                ? 'Mo Google Authenticator, Microsoft Authenticator, 1Password, Authy hoac iPhone Passwords de lay ma moi nhat.'
                : 'Ban co the paste toan bo 6 chu so vao o dau tien.'}
            </p>
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
                <span>Dang xac minh</span>
              </>
            ) : (
              'Xac nhan ma'
            )}
          </button>
          <button
            type="button"
            onClick={resetToPhoneStep}
            className="w-full text-sm text-slate-500 transition-colors hover:text-primary"
          >
            Nhap lai so dien thoai
          </button>
        </form>
      )}

      {step === 'new-password' && (
        <form
          onSubmit={handlePasswordSubmit}
          className="space-y-5"
          data-testid="auth-forgot-reset-form"
        >
          <p className="text-sm text-slate-600">Tao mat khau moi cho tai khoan cua ban.</p>
          <div>
            <label className="field-label">Mat khau moi</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Nhap mat khau moi"
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
            <p className="mt-1 text-xs text-slate-500">Toi thieu 6 ky tu</p>
          </div>

          <div>
            <label className="field-label">Xac nhan mat khau</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Nhap lai mat khau"
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
            disabled={!newPassword || !confirmPassword || !resetToken || isSubmitting}
            className="btn-primary w-full"
            data-testid="auth-forgot-reset-submit"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Dang cap nhat</span>
              </>
            ) : (
              'Doi mat khau'
            )}
          </button>
        </form>
      )}

      {step === 'success' && (
        <div className="space-y-3 text-center" data-testid="auth-forgot-success">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <span className="material-symbols-outlined text-3xl">check_circle</span>
          </div>
          <p className="text-lg font-semibold text-slate-900">Da cap nhat mat khau</p>
          <p className="text-sm text-slate-600">
            He thong se chuyen ban ve man dang nhap sau it giay.
          </p>
        </div>
      )}

      <div className="mt-6 space-y-2 text-center text-sm">
        <p className="text-slate-600">
          Da nho mat khau?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Dang nhap
          </Link>
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>Ve trang cong khai</span>
        </Link>
      </div>
    </AuthShell>
  );
}
