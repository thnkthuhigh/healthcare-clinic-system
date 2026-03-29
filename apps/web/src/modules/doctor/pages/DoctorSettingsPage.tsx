import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { Navigate } from 'react-router-dom';

import { OpsPageHeader } from '../../../components/ClinicUI';
import { OtpCodeInput } from '../../../components/OtpCodeInput';
import { useAuth } from '../../auth/useAuth';
import { doctorApi } from '../api';
import type { Doctor, DoctorTotpSetup, DoctorTotpStatus } from '../types';

export function DoctorSettingsPage() {
  const { user, logout } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [totpStatus, setTotpStatus] = useState<DoctorTotpStatus | null>(null);
  const [totpSetup, setTotpSetup] = useState<DoctorTotpSetup | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPreparingTotp, setIsPreparingTotp] = useState(false);
  const [isConfirmingTotp, setIsConfirmingTotp] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [loadError, setLoadError] = useState('');
  const [totpError, setTotpError] = useState('');
  const [totpMessage, setTotpMessage] = useState('');

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const loadDoctorSecurity = async () => {
      setLoading(true);
      setLoadError('');
      setTotpError('');

      try {
        const [profile, status] = await Promise.all([
          doctorApi.getProfile(user.id),
          doctorApi.getTotpStatus(),
        ]);

        if (cancelled) return;

        setDoctor(profile);
        setTotpStatus(status);

        if (!status.confirmed) {
          setIsPreparingTotp(true);
          const setup = await doctorApi.issueTotpSetup(false);
          if (cancelled) return;
          setTotpSetup(setup);
          setTotpMessage(
            'Day la QR rieng cua tai khoan bac si. Hay quet ngay vao app xac thuc de dung khi quen mat khau.',
          );
        } else {
          setTotpSetup(null);
          setTotpMessage('App xac thuc da san sang cho flow quen mat khau.');
        }
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          setLoadError(error instanceof Error ? error.message : 'Khong the tai du lieu tai khoan.');
        }
      } finally {
        if (!cancelled) {
          setIsPreparingTotp(false);
          setLoading(false);
        }
      }
    };

    loadDoctorSecurity();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const infoRows = [
    { icon: 'badge', label: 'Ho va ten', value: doctor?.displayName },
    { icon: 'stethoscope', label: 'Chuyen khoa', value: doctor?.specialty || 'Chua cap nhat' },
    { icon: 'phone', label: 'So dien thoai', value: doctor?.phone },
    { icon: 'work', label: 'Vai tro', value: 'Bac si' },
  ];

  const totpBadge = totpStatus?.confirmed
    ? 'bg-emerald-100 text-emerald-700'
    : totpStatus?.configured
      ? 'bg-amber-100 text-amber-700'
      : 'bg-slate-100 text-slate-600';

  const totpLabel = totpStatus?.confirmed
    ? 'Da kich hoat'
    : totpStatus?.configured
      ? 'Can quet QR'
      : 'Chua cai dat';

  const handleConfirmTotp = async (event: React.FormEvent) => {
    event.preventDefault();
    setTotpError('');

    if (totpCode.length !== 6) {
      setTotpError('Vui long nhap du 6 chu so.');
      return;
    }

    setIsConfirmingTotp(true);
    try {
      const status = await doctorApi.confirmTotp(totpCode);
      setTotpStatus(status);
      setTotpCode('');
      setTotpSetup(null);
      setTotpMessage(
        'Da lien ket thanh cong. Tu gio bac si co the dung ma 6 so nay khi quen mat khau.',
      );
    } catch (error) {
      setTotpError(error instanceof Error ? error.message : 'Khong the xac nhan ma 6 so.');
    } finally {
      setIsConfirmingTotp(false);
    }
  };

  const handleReloadQr = async () => {
    setTotpError('');
    setTotpMessage('');
    setIsPreparingTotp(true);

    try {
      const setup = await doctorApi.issueTotpSetup(false);
      setTotpSetup(setup);
      setTotpMessage('QR cua tai khoan dang duoc hien lai. Hay quet vao app xac thuc cua bac si.');
    } catch (error) {
      setTotpError(error instanceof Error ? error.message : 'Khong the tai lai QR.');
    } finally {
      setIsPreparingTotp(false);
    }
  };

  if (user && user.role !== 'DOCTOR') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-full bg-[#f4f7fa]">
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <OpsPageHeader
          eyebrow="Onboarding doctor"
          title="App xac thuc cua bac si"
          description="Sau khi admin tao tai khoan, bac si dang nhap vao day de quet QR rieng cua minh vao app mat khau."
        />

        <section className="ops-panel">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-4xl">person</span>
            </div>
            <div>
              {loading ? (
                <div className="space-y-2">
                  <div className="h-5 w-44 animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-slate-950">{doctor?.displayName}</h2>
                  <p className="mt-1 text-sm text-slate-500">{doctor?.specialty || 'Bac si'}</p>
                </>
              )}
            </div>
          </div>
        </section>

        {loadError && (
          <section className="surface-alert">
            <p>{loadError}</p>
          </section>
        )}

        <section className="ops-panel overflow-hidden p-0">
          <div className="border-b border-slate-200 px-6 py-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
              Thong tin ca nhan
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {infoRows.map((row) => (
              <div
                key={row.label}
                className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3 text-slate-500">
                  <span className="material-symbols-outlined text-[18px]">{row.icon}</span>
                  <span className="text-sm">{row.label}</span>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {loading ? (
                    <span className="inline-block h-4 w-28 animate-pulse rounded bg-slate-200" />
                  ) : (
                    row.value || '-'
                  )}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="ops-panel space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-base font-semibold text-slate-900">
                  QR xac thuc rieng cua bac si
                </h3>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${totpBadge}`}>
                  {totpLabel}
                </span>
              </div>
              <p className="text-sm text-slate-500">
                QR nay thuoc rieng tai khoan cua bac si. Hay quet vao Google Authenticator,
                Microsoft Authenticator, 1Password, Authy hoac iPhone Passwords.
              </p>
            </div>

            {!totpStatus?.confirmed && (
              <button
                type="button"
                onClick={handleReloadQr}
                className="btn-secondary px-4 py-2.5"
                disabled={isPreparingTotp}
              >
                {isPreparingTotp ? 'Dang tai QR' : 'Tai lai QR'}
              </button>
            )}
          </div>

          {totpMessage && (
            <div className="surface-note">
              <p>{totpMessage}</p>
            </div>
          )}

          {totpError && (
            <div className="surface-alert">
              <p>{totpError}</p>
            </div>
          )}

          {!totpStatus?.confirmed && isPreparingTotp && !totpSetup ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
              Dang tai QR cua tai khoan...
            </div>
          ) : null}

          {!totpStatus?.confirmed && totpSetup ? (
            <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="rounded-2xl bg-white p-3">
                  <QRCode value={totpSetup.otpAuthUri} size={160} className="h-auto w-full" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Manual entry key
                  </p>
                  <p className="mt-2 break-all font-mono text-sm text-slate-900">
                    {totpSetup.manualEntryKey}
                  </p>
                  <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Issuer</p>
                      <p className="mt-1 font-semibold text-slate-900">{totpSetup.issuer}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Account</p>
                      <p className="mt-1 font-semibold text-slate-900">{totpSetup.accountName}</p>
                    </div>
                  </div>
                </div>

                <form
                  onSubmit={handleConfirmTotp}
                  className="space-y-4 rounded-2xl bg-slate-50 p-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Nhap ma 6 so sau khi quet
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Mo app xac thuc vua luu, lay ma TOTP hien tai va nhap vao day de hoan tat.
                    </p>
                  </div>

                  <OtpCodeInput
                    value={totpCode}
                    onChange={setTotpCode}
                    disabled={isConfirmingTotp}
                    testId="doctor-settings-totp"
                  />

                  <button
                    type="submit"
                    className="btn-primary w-full"
                    disabled={totpCode.length !== 6 || isConfirmingTotp}
                  >
                    {isConfirmingTotp ? 'Dang xac nhan' : 'Xac nhan lien ket app'}
                  </button>
                </form>
              </div>
            </div>
          ) : null}

          {totpStatus?.confirmed && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              App xac thuc da duoc lien ket cho tai khoan nay. Khi quen mat khau, bac si vao trang
              dang nhap, nhap so dien thoai va ma 6 so trong app.
            </div>
          )}
        </section>

        <section className="ops-panel">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Flow quen mat khau</h3>
            <p className="mt-1 text-sm text-slate-500">
              Sau khi quet xong, doctor khong can vao admin. Khi quen mat khau chi can quay lai
              trang dang nhap va lam theo cac buoc duoi day.
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p>1. Bam "Quen mat khau" o trang dang nhap.</p>
            <p className="mt-2">2. Nhap so dien thoai cua tai khoan doctor.</p>
            <p className="mt-2">3. Nhap ma 6 so tu app xac thuc da luu o day.</p>
            <p className="mt-2">4. Dat mat khau moi.</p>
          </div>
        </section>

        <section className="ops-panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Bao mat phien lam viec</h3>
              <p className="mt-1 text-sm text-slate-500">
                Neu da quet xong QR, doctor co the dang xuat va dang nhap lai binh thuong.
              </p>
            </div>
            <button
              onClick={logout}
              className="btn-danger px-5 py-2.5"
              data-testid="doctor-settings-logout"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              <span>Dang xuat</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
