import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../auth/useAuth';

const navItems = [
  { path: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { path: '/admin/reception', icon: 'assignment_ind', label: 'Lễ tân' },
  { path: '/admin/cashier', icon: 'point_of_sale', label: 'Thu ngân' },
  { path: '/admin/doctors', icon: 'medical_information', label: 'Bác sĩ' },
  { path: '/admin/patients', icon: 'group', label: 'Bệnh nhân' },
  { path: '/admin/records', icon: 'folder_shared', label: 'Hồ sơ BN' },
  { path: '/admin/shifts', icon: 'calendar_month', label: 'Ca làm việc' },
  { path: '/admin/services', icon: 'medical_services', label: 'Dịch vụ' },
  { path: '/admin/medications', icon: 'medication', label: 'Thuốc' },
  { path: '/admin/templates', icon: 'description', label: 'Toa mẫu' },
  { path: '/admin/departments', icon: 'domain', label: 'Khoa' },
  { path: '/admin/reports', icon: 'bar_chart', label: 'Báo cáo' },
];

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const roleBadge = user?.role === 'OWNER' ? '👑 Owner' : '⚙️ Admin';

  const handleSignOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="w-64 h-screen bg-white dark:bg-[#151b2b] border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 transition-colors duration-200">
      {/* Branding */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/50">
        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-xl text-red-600 dark:text-red-400">
            admin_panel_settings
          </span>
        </div>
        <div className="flex flex-col overflow-hidden">
          <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate">
            Quản trị viên
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.phone}</p>
          <p className="text-[10px] text-primary font-semibold">{roleBadge}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-0.5 p-3 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path + '/'));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group ${
                isActive
                  ? 'bg-primary/10 text-primary dark:bg-primary/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[20px] ${
                  isActive ? 'fill-current' : 'group-hover:text-primary'
                } transition-colors`}
              >
                {item.icon}
              </span>
              <span
                className={`text-sm ${isActive ? 'font-bold' : 'font-medium group-hover:text-primary'} transition-colors`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="text-sm font-medium">Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
