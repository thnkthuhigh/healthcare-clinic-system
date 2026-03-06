import { Outlet } from 'react-router-dom';

import { AdminHeader } from './AdminHeader';
import { AdminSidebar } from './AdminSidebar';

export function AdminLayout() {
  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display overflow-hidden">
      <AdminSidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <AdminHeader />

        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
