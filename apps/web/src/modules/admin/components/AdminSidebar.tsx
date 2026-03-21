import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../auth/useAuth';

interface NavItem {
  path: string;
  icon: string;
  label: string;
}

interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

const quickItems: NavItem[] = [
  { path: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { path: '/admin/reception', icon: 'assignment_ind', label: 'Le tan' },
  { path: '/admin/cashier', icon: 'point_of_sale', label: 'Thu ngan' },
];

const navGroups: NavGroup[] = [
  {
    id: 'clinic',
    title: 'Quan ly kham',
    items: [
      { path: '/admin/shifts', icon: 'calendar_month', label: 'Ca lam viec' },
      { path: '/admin/patients', icon: 'folder_shared', label: 'Ho so kham' },
      { path: '/admin/doctors', icon: 'medical_information', label: 'Bac si' },
      { path: '/admin/services', icon: 'medical_services', label: 'Dich vu' },
      { path: '/admin/departments', icon: 'domain', label: 'Khoa' },
    ],
  },
  {
    id: 'inventory',
    title: 'Kho va tai nguyen',
    items: [
      { path: '/admin/rooms', icon: 'meeting_room', label: 'Phong kham' },
      { path: '/admin/supplies', icon: 'inventory_2', label: 'Vat tu' },
      { path: '/admin/assets', icon: 'inventory', label: 'Tai san' },
      { path: '/admin/medications', icon: 'medication', label: 'Thuoc' },
      { path: '/admin/templates', icon: 'description', label: 'Toa mau' },
    ],
  },
  {
    id: 'report',
    title: 'Tong hop',
    items: [{ path: '/admin/reports', icon: 'bar_chart', label: 'Bao cao' }],
  },
];

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);

  const roleBadge = user?.role === 'OWNER' ? 'Owner' : 'Admin';

  const handleSignOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const isRouteActive = (path: string) =>
    location.pathname === path ||
    (path !== '/admin/dashboard' && location.pathname.startsWith(path + '/'));

  useEffect(() => {
    const activeGroup = navGroups.find((group) =>
      group.items.some(
        (item) =>
          location.pathname === item.path ||
          (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path + '/')),
      ),
    );
    if (activeGroup) {
      setOpenGroupId(activeGroup.id);
    }
  }, [location.pathname]);

  const toggleGroup = (groupId: string) => {
    setOpenGroupId((current) => (current === groupId ? null : groupId));
  };

  return (
    <aside className="h-screen w-60 shrink-0 border-r border-slate-200 bg-white transition-colors duration-200 dark:border-slate-800 dark:bg-[#151b2b]">
      <div className="flex items-center gap-3 border-b border-slate-100 p-4 dark:border-slate-800/50">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <span className="material-symbols-outlined text-xl text-red-600 dark:text-red-400">
            admin_panel_settings
          </span>
        </div>
        <div className="flex flex-col overflow-hidden">
          <h1 className="truncate text-sm font-bold text-slate-900 dark:text-white">
            Quan tri vien
          </h1>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.phone}</p>
          <p className="text-[10px] font-semibold text-primary">{roleBadge}</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <section className="space-y-1">
          <p className="px-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Tac vu nhanh
          </p>
          {quickItems.map((item) => {
            const isActive = isRouteActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary dark:bg-primary/20'
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[19px] transition-colors ${
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
        </section>

        {navGroups.map((group) => {
          const isOpen = openGroupId === group.id;
          const hasActiveItem = group.items.some((item) => isRouteActive(item.path));

          return (
            <section key={group.id} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left transition-colors ${
                  hasActiveItem
                    ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
                    : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wide">
                  {group.title}
                </span>
                <span
                  className={`material-symbols-outlined text-base transition-transform ${
                    isOpen ? 'rotate-90' : ''
                  }`}
                >
                  chevron_right
                </span>
              </button>

              {isOpen && (
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = isRouteActive(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors ${
                          isActive
                            ? 'bg-primary/10 text-primary dark:bg-primary/20'
                            : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined text-[19px] transition-colors ${
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
                </div>
              )}
            </section>
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
