import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

type Step = 'phone' | 'otp' | 'new-password' | 'success';

// Demo OTP
const MOCK_OTP = '123456';

const STEPS = [
  { key: 'phone', label: 'Số điện thoại' },
  { key: 'otp', label: 'Xác minh OTP' },
  { key: 'new-password', label: 'Mật khẩu mới' },
] as const;

function getStepIndex(step: Step) {
  const index = STEPS.findIndex((s) => s.key === step);
  return index === -1 ? 2 : index; // 'success' → index 2 = done
}

export function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const currentIndex = getStepIndex(step);

  // ── Step 1: phone ──────────────────────────────────────────────────────────
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^0[0-9]{9}$/.test(phone)) {
      setError('Số điện thoại không hợp lệ (ví dụ: 0912345678)');
      return;
    }
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 900)); // simulate network
    setIsSubmitting(false);
    setStep('otp');
  };

  // ── Step 2: OTP ────────────────────────────────────────────────────────────
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 700));
    setIsSubmitting(false);
    if (otp !== MOCK_OTP) {
      setError(`Mã OTP không đúng. (Demo: dùng ${MOCK_OTP})`);
      return;
    }
    setStep('new-password');
  };

  // ── Step 3: new password ───────────────────────────────────────────────────
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsSubmitting(false);
    setStep('success');
    setTimeout(() => navigate('/login'), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4 shadow-lg">
            <span className="material-symbols-outlined text-3xl text-white">lock_reset</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Quên mật khẩu</h1>
          <p className="text-slate-500 mt-1 text-sm">Đặt lại mật khẩu của bạn</p>
        </div>

        {/* Step indicator */}
        {step !== 'success' && (
          <div className="flex items-center mb-6">
            {STEPS.map((s, i) => {
              const isDone = i < currentIndex;
              const isActive = i === currentIndex;
              return (
                <div key={s.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
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
                    <span className="text-xs text-slate-500 mt-1.5 whitespace-nowrap">
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 mb-4 transition-colors ${
                        isDone ? 'bg-green-400' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-5 flex gap-2 items-center">
              <span className="material-symbols-outlined text-red-500 text-sm flex-shrink-0">
                error
              </span>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* ── Step 1: Phone ── */}
          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-5">
              <p className="text-slate-600 text-sm leading-relaxed">
                Nhập số điện thoại đã đăng ký. Chúng tôi sẽ gửi mã OTP để xác minh danh tính.
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912345678"
                  autoComplete="tel"
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={!phone || isSubmitting}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang gửi OTP...
                  </>
                ) : (
                  'Gửi OTP'
                )}
              </button>
            </form>
          )}

          {/* ── Step 2: OTP ── */}
          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  Mã OTP đã gửi đến <span className="font-semibold">{phone}</span>
                </p>
                <p className="text-xs text-blue-500 mt-0.5">
                  Demo: dùng mã <strong>123456</strong>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mã OTP (6 chữ số)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="_ _ _ _ _ _"
                  maxLength={6}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-center tracking-[0.5em] text-2xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={otp.length !== 6 || isSubmitting}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang xác minh...
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
                className="w-full text-sm text-slate-500 hover:text-slate-700 py-1 transition-colors"
              >
                ← Nhập lại số điện thoại
              </button>
            </form>
          )}

          {/* ── Step 3: New password ── */}
          {step === 'new-password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <p className="text-slate-600 text-sm">Tạo mật khẩu mới cho tài khoản của bạn.</p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-400 mt-1">Tối thiểu 6 ký tự</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Xác nhận mật khẩu
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={!newPassword || !confirmPassword || isSubmitting}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang cập nhật...
                  </>
                ) : (
                  'Đổi mật khẩu'
                )}
              </button>
            </form>
          )}

          {/* ── Success ── */}
          {step === 'success' && (
            <div className="text-center py-4 space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                <span className="material-symbols-outlined text-green-600 text-3xl">
                  check_circle
                </span>
              </div>
              <div>
                <p className="font-bold text-slate-900 text-xl">Đổi mật khẩu thành công!</p>
                <p className="text-slate-500 text-sm mt-1">Đang chuyển về trang đăng nhập...</p>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                <div className="bg-blue-600 h-1 rounded-full animate-[progress_3s_linear_forwards]" />
              </div>
            </div>
          )}

          {/* Footer link */}
          {step !== 'success' && (
            <div className="mt-6 text-center text-sm">
              <Link to="/login" className="text-blue-600 hover:underline">
                ← Quay lại đăng nhập
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
