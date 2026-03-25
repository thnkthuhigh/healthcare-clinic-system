import { Outlet } from 'react-router-dom';

import { AdminHeader } from './AdminHeader';
import { AdminSidebar } from './AdminSidebar';

export function AdminLayout() {
  return (
    <div className="ops-shell bg-[#f4f7fa]" data-testid="admin-layout">
      <AdminSidebar />

      <main
        className="ops-main min-h-screen px-3 pb-3 pt-3 md:px-4 md:pb-4 md:pt-4"
        data-testid="admin-main"
      >
        <div className="flex h-full min-h-0 flex-col gap-3">
          <AdminHeader />
          <div className="flex-1 overflow-y-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
