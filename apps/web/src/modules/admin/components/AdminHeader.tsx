import { useLocation } from 'react-router-dom';

const routeTitles: Record<string, { title: string; icon: string }> = {
  '/admin/dashboard': { title: 'Dashboard', icon: 'dashboard' },
  '/admin/reception': { title: 'Dieu phoi kham', icon: 'assignment_ind' },
  '/admin/cashier': { title: 'Thu ngan', icon: 'point_of_sale' },
  '/admin/doctors': { title: 'Quan ly Bac si', icon: 'medical_information' },
  '/admin/patients': { title: 'Quan ly Ho so kham', icon: 'folder_shared' },
  '/admin/shifts': { title: 'Ca lam viec', icon: 'calendar_month' },
  '/admin/services': { title: 'Dich vu va Chuyen khoa', icon: 'medical_services' },
  '/admin/rooms': { title: 'Quan ly Phong kham', icon: 'meeting_room' },
  '/admin/medications': { title: 'Danh muc Thuoc', icon: 'medication' },
  '/admin/templates': { title: 'Toa thuoc mau', icon: 'description' },
  '/admin/departments': { title: 'Quan ly Khoa', icon: 'domain' },
  '/admin/reports': { title: 'Bao cao va Audit', icon: 'bar_chart' },
};

export function AdminHeader() {
  const location = useLocation();

  const getTitle = () => {
    for (const [path, info] of Object.entries(routeTitles)) {
      if (location.pathname.startsWith(path)) {
        return info;
      }
    }

    return { title: 'Admin', icon: 'admin_panel_settings' };
  };

  const { title, icon } = getTitle();

  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-sm dark:border-slate-700 dark:bg-surface-dark/80">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-[24px] text-primary">{icon}</span>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        <span className="hidden text-sm text-slate-500 dark:text-slate-400 sm:block">{today}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
          <span className="material-symbols-outlined text-[18px] text-slate-500 dark:text-slate-400">
            notifications
          </span>
        </div>
      </div>
    </header>
  );
}
