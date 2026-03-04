import { useLocation, useNavigate, Link } from 'react-router-dom';

interface HeaderProps {
  title: string;
}

// Route breadcrumb mapping
const routeBreadcrumbs: Record<string, { label: string; icon: string }[]> = {
  '/doctor/dashboard': [{ label: 'Dashboard', icon: 'grid_view' }],
  '/doctor/queue': [
    { label: 'Dashboard', icon: 'grid_view' },
    { label: 'Queue', icon: 'list_alt' },
  ],
  '/doctor/consultation': [
    { label: 'Dashboard', icon: 'grid_view' },
    { label: 'Queue', icon: 'list_alt' },
    { label: 'Consultation', icon: 'medical_information' },
  ],
  '/doctor/schedule': [{ label: 'Schedule', icon: 'calendar_month' }],
  '/doctor/patients': [{ label: 'Patients', icon: 'group' }],
  '/doctor/settings': [{ label: 'Settings', icon: 'settings' }],
};

export function DoctorHeader({ title }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const getBreadcrumbs = () => {
    const path = location.pathname;
    // Match base path
    for (const [routePath, crumbs] of Object.entries(routeBreadcrumbs)) {
      if (path.startsWith(routePath)) {
        return crumbs;
      }
    }
    return [];
  };

  const breadcrumbs = getBreadcrumbs();
  const canGoBack = location.pathname !== '/doctor/dashboard' && location.pathname !== '/doctor';

  return (
    <header className="h-16 px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-sm z-10 sticky top-0">
      <div className="flex items-center gap-4">
        {/* Mobile Menu */}
        <div className="flex items-center gap-2 lg:hidden">
          <button className="text-slate-500 hover:text-primary">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <span className="text-lg font-bold text-primary">MedDesk</span>
        </div>

        {/* Back Button */}
        {canGoBack && (
          <button
            onClick={() => navigate(-1)}
            className="hidden lg:flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors group"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            <span className="text-sm font-medium">Back</span>
          </button>
        )}

        {/* Breadcrumbs */}
        <div className="hidden lg:flex items-center gap-2 text-slate-400">
          {breadcrumbs.length > 0 && (
            <>
              <span className="material-symbols-outlined text-primary">
                {breadcrumbs[breadcrumbs.length - 1]?.icon}
              </span>
              <div className="flex items-center gap-2">
                {breadcrumbs.map((crumb, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {index > 0 && <span className="text-slate-300 dark:text-slate-600">/</span>}
                    <span
                      className={`text-sm font-medium ${
                        index === breadcrumbs.length - 1
                          ? 'text-slate-900 dark:text-white'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {crumb.label}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="hidden md:flex relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
            search
          </span>
          <input
            type="text"
            placeholder="Search patients, records..."
            className="pl-10 pr-4 py-2 w-64 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white dark:border-surface-dark" />
          </button>
          <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors">
            <span className="material-symbols-outlined">help</span>
          </button>
        </div>
      </div>
    </header>
  );
}
