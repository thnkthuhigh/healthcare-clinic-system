import { Link } from 'react-router-dom';

import { CLINIC_CONTACT } from '../content';

const FOOTER_LINKS = [
  { to: '/', label: 'Trang chủ' },
  { to: '/about', label: 'Về phòng khám' },
  { to: '/doctors', label: 'Bác sĩ' },
  { to: '/services', label: 'Dịch vụ' },
  { to: '/health-records', label: 'Tra cứu' },
];

export function PatientFooter() {
  return (
    <footer className="mt-10 border-t border-slate-200 bg-white/95">
      <div className="clinic-container py-6 sm:py-8">
        <section className="rounded-2xl bg-primary px-5 py-5 text-white sm:px-6 lg:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/75">
                Hỗ trợ bệnh nhân
              </p>
              <p className="mt-1 text-lg font-semibold">Cần đặt lịch hoặc tra cứu hồ sơ?</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Link to="/booking" className="btn-secondary border-white/30 bg-white text-primary">
                <span className="material-symbols-outlined text-base">calendar_add_on</span>
                <span>Đặt lịch ngay</span>
              </Link>
              <Link
                to="/health-records"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                <span className="material-symbols-outlined text-base">search</span>
                <span>Tra cứu hồ sơ</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-5 border-b border-slate-200 pb-5">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr_1fr] lg:items-start">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                  <span className="material-symbols-outlined text-lg">local_hospital</span>
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-950">{CLINIC_CONTACT.brand}</p>
                  <p className="text-sm text-slate-500">{CLINIC_CONTACT.tagline}</p>
                </div>
              </div>
              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600">
                Phòng khám đa khoa phục vụ khám theo lịch hẹn, theo dõi hồ sơ điều trị và hỗ trợ
                bệnh nhân tra cứu thông tin sau khám trong cùng một hệ thống rõ ràng, dễ dùng.
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Điều hướng
              </p>
              <ul className="mt-3 space-y-2.5">
                {FOOTER_LINKS.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="text-sm text-slate-700 transition-colors hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Liên hệ
              </p>
              <ul className="mt-3 space-y-2.5 text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined mt-0.5 text-base text-slate-400">
                    location_on
                  </span>
                  <span>{CLINIC_CONTACT.address}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-base text-slate-400">phone</span>
                  <span>{CLINIC_CONTACT.phone}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-base text-slate-400">mail</span>
                  <span>{CLINIC_CONTACT.email}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-base text-slate-400">
                    schedule
                  </span>
                  <span>{CLINIC_CONTACT.hours}</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <div className="pt-3 text-xs text-slate-500">
          © 2026 Healthcare Clinic. Nền tảng đặt lịch khám và tra cứu hồ sơ bệnh nhân.
        </div>
      </div>
    </footer>
  );
}
