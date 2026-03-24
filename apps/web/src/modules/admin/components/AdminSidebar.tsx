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
  { path: '/admin/dashboard', icon: 'dashboard', label: 'Tổng quan' },
  { path: '/admin/reception', icon: 'assignment_ind', label: 'Tiếp nhận' },
  { path: '/admin/cashier', icon: 'point_of_sale', label: 'Thu ngân' },
];

const navGroups: NavGroup[] = [
  {
    id: 'clinic',
    title: 'Khám và hồ sơ',
    items: [
      { path: '/admin/shifts', icon: 'calendar_month', label: 'Ca làm việc' },
      { path: '/admin/patients', icon: 'folder_shared', label: 'Hồ sơ khám' },
      { path: '/admin/doctors', icon: 'medical_information', label: 'Bác sĩ' },
      { path: '/admin/services', icon: 'medical_services', label: 'Dịch vụ' },
      { path: '/admin/departments', icon: 'domain', label: 'Chuyên khoa' },
    ],
  },
  {
    id: 'inventory',
    title: 'Cơ sở vật chất',
    items: [
      { path: '/admin/rooms', icon: 'meeting_room', label: 'Phòng khám' },
      { path: '/admin/supplies', icon: 'inventory_2', label: 'Vật tư' },
      { path: '/admin/assets', icon: 'inventory', label: 'Tài sản' },
      { path: '/admin/medications', icon: 'medication', label: 'Thuốc' },
      { path: '/admin/templates', icon: 'description', label: 'Mẫu toa thuốc' },
    ],
  },
  {
    id: 'report',
    title: 'Tổng hợp',
    items: [{ path: '/admin/reports', icon: 'bar_chart', label: 'Báo cáo và audit' }],
  },
];

function navIdFromPath(path: string) {
  const slug = path.replace('/admin/', '').replaceAll('/', '-');
  return slug || 'dashboard';
}

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
    <aside className="ops-sidebar" data-testid="admin-sidebar">
      <div className="border-b border-slate-100 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white">
            <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold text-slate-950">Healthcare Clinic</h1>
            <p className="truncate text-xs text-slate-500">{user?.phone}</p>
          </div>
        </div>
        <div className="mt-4 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {roleBadge}
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4" data-testid="admin-nav">
        <section className="space-y-1">
          <p className="ops-section-label px-2">Truy cập nhanh</p>
          {quickItems.map((item) => (
            <NavLink key={item.path} item={item} active={isRouteActive(item.path)} />
          ))}
        </section>

        {navGroups.map((group) => {
          const isOpen = openGroupId === group.id;
          const hasActiveItem = group.items.some((item) => isRouteActive(item.path));

          return (
            <section key={group.id} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                data-testid={`admin-nav-group-${group.id}`}
                className={`flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.14em] ${
                  hasActiveItem ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <span>{group.title}</span>
                <span
                  className={`material-symbols-outlined text-base transition-transform ${isOpen ? 'rotate-90' : ''}`}
                >
                  chevron_right
                </span>
              </button>

              {isOpen && (
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <NavLink key={item.path} item={item} active={isRouteActive(item.path)} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <button
          onClick={handleSignOut}
          data-testid="admin-signout"
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const navId = navIdFromPath(item.path);

  return (
    <Link
      to={item.path}
      data-testid={`admin-nav-${navId}`}
      className={`ops-nav-link ${active ? 'ops-nav-link-active' : 'ops-nav-link-idle'}`}
    >
      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
      <span>{item.label}</span>
    </Link>
  );
}
