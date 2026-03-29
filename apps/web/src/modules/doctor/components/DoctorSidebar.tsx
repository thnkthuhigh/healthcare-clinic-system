import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../auth/useAuth';

interface SidebarProps {
  doctorName: string;
  specialty?: string;
  avatarUrl?: string;
  isVisible?: boolean;
}

const mainNavItems = [
  { path: '/doctor/dashboard', icon: 'grid_view', label: 'Tổng quan' },
  { path: '/doctor/queue', icon: 'list_alt', label: 'Hàng chờ' },
  { path: '/doctor/lab', icon: 'science', label: 'Xét nghiệm' },
  { path: '/doctor/schedule', icon: 'calendar_month', label: 'Lịch làm việc' },
  { path: '/doctor/patients', icon: 'group', label: 'Bệnh nhân' },
  { path: '/doctor/settings', icon: 'settings', label: 'Thiết lập' },
];

const ownerNavItem = { path: '/doctor/accounts', icon: 'manage_accounts', label: 'Tài khoản' };

function navIdFromPath(path: string) {
  const slug = path.replace('/doctor/', '').replaceAll('/', '-');
  return slug || 'dashboard';
}

export function DoctorSidebar({
  doctorName,
  specialty,
  avatarUrl,
  isVisible = true,
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const roleBadge = user?.role === 'OWNER' ? 'Owner' : user?.role === 'ADMIN' ? 'Admin' : 'Bác sĩ';

  const allNavItems = user?.role === 'OWNER' ? [...mainNavItems, ownerNavItem] : [...mainNavItems];

  const handleSignOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <aside className="ops-sidebar" data-testid="doctor-sidebar">
      <div className="border-b border-slate-100 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-primary text-white">
            {avatarUrl ? (
              <img src={avatarUrl} alt={doctorName} className="h-full w-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-xl">stethoscope</span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold text-slate-950">Healthcare Clinic</h1>
            <p className="truncate text-xs text-slate-500">{doctorName}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {roleBadge}
          </span>
          {specialty && (
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {specialty}
            </span>
          )}
        </div>
      </div>

      <nav
        className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-4"
        data-testid="doctor-nav"
      >
        <p className="ops-section-label px-2 pb-1">Điều hướng</p>
        {allNavItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              data-testid={`doctor-nav-${navIdFromPath(item.path)}`}
              className={`ops-nav-link ${isActive ? 'ops-nav-link-active' : 'ops-nav-link-idle'}`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <button
          onClick={handleSignOut}
          data-testid="doctor-signout"
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
