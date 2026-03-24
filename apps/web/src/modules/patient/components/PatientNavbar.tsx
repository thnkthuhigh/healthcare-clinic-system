import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../auth/useAuth';
import { CLINIC_CONTACT, PUBLIC_NAV_LINKS } from '../content';

export function PatientNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const initials = user?.phone?.slice(-2) ?? 'BN';
  const isActive = (path: string) => location.pathname === path;
  const showPublicBookingCta = !isAuthenticated && location.pathname !== '/booking';

  return (
    <nav
      className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/95 backdrop-blur-sm"
      data-testid="public-navbar"
    >
      <div className="clinic-container">
        <div className="grid min-h-[78px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-6">
          <Link to="/" className="flex min-w-0 items-center gap-3 justify-self-start md:min-w-[220px]">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-soft">
              <span className="material-symbols-outlined text-[26px]">local_hospital</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-slate-950">{CLINIC_CONTACT.brand}</p>
            </div>
          </Link>

          <div className="hidden items-center justify-center gap-1 md:flex">
            {PUBLIC_NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                data-testid={`public-nav-${link.to === '/' ? 'home' : link.to.replaceAll('/', '')}`}
                className={`rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 md:min-w-[220px]">
            {showPublicBookingCta && (
              <Link
                to="/booking"
                className="btn-primary hidden px-4 py-2.5 lg:inline-flex"
                data-testid="public-cta-booking"
              >
                <span className="material-symbols-outlined text-base">calendar_add_on</span>
                <span>Đặt lịch ngay</span>
              </Link>
            )}

            {isAuthenticated ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((current) => !current)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 transition-colors hover:bg-slate-50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                    {initials}
                  </div>
                  <span className="hidden max-w-[160px] truncate text-sm text-slate-700 sm:block">
                    {user?.phone ?? 'Bệnh nhân'}
                  </span>
                  <span className="material-symbols-outlined text-base text-slate-400">expand_more</span>
                </button>

                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                    <div className="absolute right-0 z-20 mt-2 w-64 rounded-[20px] border border-slate-200 bg-white p-2 shadow-card">
                      <div className="rounded-xl bg-slate-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Tài khoản bệnh nhân</p>
                        <p className="mt-1 truncate text-sm font-semibold text-slate-900">{user?.phone}</p>
                      </div>
                      <div className="mt-2 space-y-1">
                        <MenuLink
                          to="/profile"
                          label="Hồ sơ cá nhân"
                          icon="person"
                          onClose={() => setIsDropdownOpen(false)}
                        />
                        <MenuLink
                          to="/appointments"
                          label="Lịch hẹn của tôi"
                          icon="event_note"
                          onClose={() => setIsDropdownOpen(false)}
                        />
                        <MenuLink
                          to="/health-records"
                          label="Tra cứu hồ sơ"
                          icon="medical_information"
                          onClose={() => setIsDropdownOpen(false)}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            logout();
                            setIsDropdownOpen(false);
                            navigate('/');
                          }}
                          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                        >
                          <span className="material-symbols-outlined text-lg text-red-400">logout</span>
                          <span>Đăng xuất</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="rounded-xl p-2.5 transition-colors hover:bg-slate-100 md:hidden"
                onClick={() => setIsMenuOpen((current) => !current)}
              >
                <span className="material-symbols-outlined text-slate-600">
                  {isMenuOpen ? 'close' : 'menu'}
                </span>
              </button>
            )}

            {isAuthenticated && (
              <button
                type="button"
                className="rounded-2xl p-2.5 transition-colors hover:bg-slate-100 md:hidden"
                onClick={() => setIsMenuOpen((current) => !current)}
              >
                <span className="material-symbols-outlined text-slate-600">
                  {isMenuOpen ? 'close' : 'menu'}
                </span>
              </button>
            )}
          </div>
        </div>

        {isMenuOpen && (
          <div className="border-t border-slate-100 py-3 md:hidden">
            <div className="space-y-1">
              {PUBLIC_NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  data-testid={`public-mobile-nav-${link.to === '/' ? 'home' : link.to.replaceAll('/', '')}`}
                  className={`block rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    isActive(link.to)
                      ? 'bg-primary/10 text-primary'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              {showPublicBookingCta && (
                <Link
                  to="/booking"
                  className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white"
                  data-testid="public-mobile-cta-booking"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="material-symbols-outlined text-base">calendar_add_on</span>
                  <span>Đặt lịch ngay</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function MenuLink({
  to,
  label,
  icon,
  onClose,
}: {
  to: string;
  label: string;
  icon: string;
  onClose: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClose}
      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
    >
      <span className="material-symbols-outlined text-lg text-slate-400">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
