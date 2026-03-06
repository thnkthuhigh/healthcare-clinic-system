export function DoctorSchedulePage() {
  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Schedule Management
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Manage your shifts and appointments schedule
        </p>

        {/* Coming Soon Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-8 text-center">
          <span className="material-symbols-outlined text-5xl text-blue-500 mb-4 block">
            calendar_month
          </span>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Coming Soon</h2>
          <p className="text-slate-600 dark:text-slate-400">
            Schedule management feature is under development
          </p>
        </div>
      </div>
    </div>
  );
}
