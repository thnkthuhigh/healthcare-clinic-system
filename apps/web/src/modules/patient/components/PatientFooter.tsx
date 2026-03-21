import { Link } from 'react-router-dom';

const FOOTER_LINKS = [
  { to: '/home', label: 'Trang chủ' },
  { to: '/doctors', label: 'Bác sĩ' },
  { to: '/services', label: 'Dịch vụ' },
  { to: '/booking', label: 'Đặt lịch' },
  { to: '/appointments', label: 'Lịch khám của tôi' },
];

const SOCIAL_ICONS = [
  { icon: 'group', label: 'Facebook' },
  { icon: 'smart_display', label: 'YouTube' },
  { icon: 'mail', label: 'Email' },
];

export function PatientFooter() {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-xl">local_hospital</span>
              </div>
              <span className="font-bold text-white text-lg">Healthcare Clinic</span>
            </div>
            <p className="text-sm leading-relaxed max-w-sm">
              Hệ thống phòng khám đa chức năng, cung cấp dịch vụ y tế chất lượng cao với đội ngũ bác
              sĩ giàu kinh nghiệm, tận tâm.
            </p>
            <div className="flex gap-3 mt-10">
              {SOCIAL_ICONS.map((social) => (
                <button
                  key={social.label}
                  type="button"
                  aria-label={social.label}
                  className="w-9 h-9 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-slate-300 text-base leading-none">
                    {social.icon}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm">Liên kết nhanh</h3>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-sm hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <span className="w-1 h-1 rounded-full bg-blue-500" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm">Liên hệ</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-blue-400 text-base flex-shrink-0 mt-0.5">
                  location_on
                </span>
                <span>123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-blue-400 text-base">phone</span>
                <span>1900 0000</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-blue-400 text-base">mail</span>
                <span>contact@healthcare.vn</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-blue-400 text-base">schedule</span>
                <span>Thứ 2 – Thứ 7: 7:00 – 18:00</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-500">
          <p>© 2026 Healthcare Clinic System. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-slate-300 transition-colors">
              Chính sách bảo mật
            </Link>
            <Link to="/terms" className="hover:text-slate-300 transition-colors">
              Điều khoản sử dụng
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
