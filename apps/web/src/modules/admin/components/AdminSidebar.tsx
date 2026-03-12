import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../auth/useAuth';

const navItems = [
  { path: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { path: '/admin/reception', icon: 'assignment_ind', label: 'Le tan' },
  { path: '/admin/cashier', icon: 'point_of_sale', label: 'Thu ngan' },
  { path: '/admin/doctors', icon: 'medical_information', label: 'Bac si' },
  { path: '/admin/patients', icon: 'folder_shared', label: 'Ho so kham' },
  { path: '/admin/shifts', icon: 'calendar_month', label: 'Ca lam viec' },
  { path: '/admin/services', icon: 'medical_services', label: 'Dich vu' },
  { path: '/admin/rooms', icon: 'meeting_room', label: 'Phong kham' },
  { path: '/admin/medications', icon: 'medication', label: 'Thuoc' },
  { path: '/admin/templates', icon: 'description', label: 'Toa mau' },
  { path: '/admin/departments', icon: 'domain', label: 'Khoa' },
  { path: '/admin/reports', icon: 'bar_chart', label: 'Bao cao' },
];

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const roleBadge = user?.role === 'OWNER' ? 'Owner' : 'Admin';

  const handleSignOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="h-screen w-64 shrink-0 border-r border-slate-200 bg-white transition-colors duration-200 dark:border-slate-800 dark:bg-[#151b2b]">
      <div className="flex items-center gap-3 border-b border-slate-100 p-6 dark:border-slate-800/50">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <span className="material-symbols-outlined text-xl text-red-600 dark:text-red-400">
            admin_panel_settings
          </span>
        </div>
        <div className="flex flex-col overflow-hidden">
          <h1 className="truncate text-sm font-bold text-slate-900 dark:text-white">Quan tri vien</h1>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.phone}</p>
          <p className="text-[10px] font-semibold text-primary">{roleBadge}</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path + '/'));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary dark:bg-primary/20'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[20px] transition-colors ${
                  isActive ? 'fill-current' : 'group-hover:text-primary'
                }`}
              >
                {item.icon}
              </span>
              <span
                className={`text-sm transition-colors ${
                  isActive ? 'font-bold' : 'font-medium group-hover:text-primary'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-4 dark:border-slate-800">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="text-sm font-medium">Dang xuat</span>
        </button>
      </div>
    </aside>
  );
}
