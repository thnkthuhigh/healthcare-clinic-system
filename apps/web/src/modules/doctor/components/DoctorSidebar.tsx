import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  doctorName: string;
  specialty?: string;
  avatarUrl?: string;
}

const navItems = [
  { path: '/doctor/dashboard', icon: 'grid_view', label: 'Dashboard' },
  { path: '/doctor/queue', icon: 'list_alt', label: 'Queue' },
  { path: '/doctor/schedule', icon: 'calendar_month', label: 'Schedule' },
  { path: '/doctor/patients', icon: 'group', label: 'Patients' },
];

export function DoctorSidebar({ doctorName, specialty: _specialty, avatarUrl }: SidebarProps) {
  const location = useLocation();

  return (
    <aside className="w-64 h-screen bg-white dark:bg-[#151b2b] border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 transition-colors duration-200">
      {/* User Profile / Branding */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/50">
        <div className="relative w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0 shadow-inner">
          {avatarUrl ? (
            <img src={avatarUrl} alt={doctorName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-200 dark:bg-slate-700">
              <span className="material-symbols-outlined text-xl">person</span>
            </div>
          )}
        </div>
        <div className="flex flex-col overflow-hidden">
          <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate">MedDesk</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{doctorName}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
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

        <div className="my-2 border-t border-slate-100 dark:border-slate-800" />

        <Link
          to="/doctor/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
        >
          <span className="material-symbols-outlined text-[20px] group-hover:text-primary transition-colors">
            settings
          </span>
          <span className="text-sm font-medium group-hover:text-primary transition-colors">
            Settings
          </span>
        </Link>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={() => {
            window.location.href = '/login';
          }}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
