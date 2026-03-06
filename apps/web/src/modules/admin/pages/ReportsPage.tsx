export function ReportsPage() {
  return (
    <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-background-dark">
      <div className="text-center">
        <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600">
          bar_chart
        </span>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-4">Báo cáo & Audit</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Thống kê lượt khám, doanh thu, audit log
        </p>
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 font-medium">
          🚧 Đang phát triển...
        </p>
      </div>
    </div>
  );
}
