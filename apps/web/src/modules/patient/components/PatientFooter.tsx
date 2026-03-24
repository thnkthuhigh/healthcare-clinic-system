import { Link } from 'react-router-dom';

import { CLINIC_CONTACT, PUBLIC_NAV_LINKS } from '../content';

const FOOTER_LINKS = [
  { to: '/', label: 'Trang chủ' },
  { to: '/about', label: 'Về phòng khám' },
  ...PUBLIC_NAV_LINKS.filter((item) => item.to !== '/').map((item) => ({
    to: item.to,
    label: item.label,
  })),
];

const TRUST_ITEMS = [
  'Không cần tạo tài khoản để đặt lịch',
  'Phiếu khám có mã QR check-in',
  'Tra cứu lại bằng số điện thoại',
] as const;

export function PatientFooter() {
  return (
    <footer className="mt-16 border-t border-slate-200/80 bg-white/92">
      <div className="clinic-container py-12">
        <section className="rounded-[32px] bg-primary px-6 py-8 text-white shadow-soft sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/72">
                Hỗ trợ bệnh nhân
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Bắt đầu từ thao tác bạn cần nhất
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80">
                Đặt lịch mới, mở lại hồ sơ hoặc liên hệ tổng đài trong giờ tiếp nhận mà không phải đi
                qua các lớp điều hướng phức tạp.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {TRUST_ITEMS.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white/90"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                to="/booking"
                className="btn-secondary border-white/20 bg-white text-primary hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-base">calendar_add_on</span>
                <span>Đặt lịch ngay</span>
              </Link>
              <Link
                to="/health-records"
                className="btn-secondary border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                <span className="material-symbols-outlined text-base">search</span>
                <span>Tra cứu hồ sơ</span>
              </Link>
            </div>
          </div>
        </section>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_0.9fr_1fr]">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white">
                <span className="material-symbols-outlined text-xl">local_hospital</span>
              </div>
              <div>
                <p className="text-base font-semibold text-slate-950">{CLINIC_CONTACT.brand}</p>
                <p className="text-sm text-slate-500">{CLINIC_CONTACT.tagline}</p>
              </div>
            </div>
            <p className="max-w-lg text-sm leading-7 text-slate-600">
              Không gian số dành cho bệnh nhân để đặt lịch khám, theo dõi lịch hẹn và tra cứu hồ sơ
              sức khỏe trong cùng một trải nghiệm rõ ràng, dễ dùng.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
              Điều hướng
            </h3>
            <ul className="mt-4 space-y-3">
              {FOOTER_LINKS.map((item) => (
                <li key={`${item.to}-${item.label}`}>
                  <Link
                    to={item.to}
                    className="text-sm text-slate-600 transition-colors hover:text-primary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
              Liên hệ
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
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
                <span className="material-symbols-outlined text-base text-slate-400">schedule</span>
                <span>{CLINIC_CONTACT.hours}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Healthcare Clinic. Nền tảng đặt lịch khám và tra cứu hồ sơ bệnh nhân.</p>
          <p>Khu vực nhân sự chỉ truy cập qua đường dẫn nội bộ đã được cấp quyền.</p>
        </div>
      </div>
    </footer>
  );
}
