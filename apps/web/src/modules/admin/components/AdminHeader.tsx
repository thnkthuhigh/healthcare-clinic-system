import { useLocation } from 'react-router-dom';

const routeTitles: Record<string, { title: string; icon: string }> = {
  '/admin/dashboard': { title: 'Dashboard', icon: 'dashboard' },
  '/admin/reception': { title: 'Điều phối khám', icon: 'assignment_ind' },
  '/admin/cashier': { title: 'Thu ngân', icon: 'point_of_sale' },
  '/admin/doctors': { title: 'Quản lý Bác sĩ', icon: 'medical_information' },
  '/admin/patients': { title: 'Quản lý Bệnh nhân', icon: 'group' },
  '/admin/records': { title: 'Hồ sơ Bệnh nhân', icon: 'folder_shared' },
  '/admin/shifts': { title: 'Ca làm việc', icon: 'calendar_month' },
  '/admin/services': { title: 'Dịch vụ & Chuyên khoa', icon: 'medical_services' },
  '/admin/medications': { title: 'Danh mục Thuốc', icon: 'medication' },
  '/admin/templates': { title: 'Toa thuốc mẫu', icon: 'description' },
  '/admin/departments': { title: 'Quản lý Khoa', icon: 'domain' },
  '/admin/reports': { title: 'Báo cáo & Audit', icon: 'bar_chart' },
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
    <header className="h-16 px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-sm z-10 sticky top-0">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary text-[24px]">{icon}</span>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">{today}</span>
        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
          <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-[18px]">
            notifications
          </span>
        </div>
      </div>
    </header>
  );
}
