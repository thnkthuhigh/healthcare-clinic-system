interface HeaderProps {
  title: string;
}

export function DoctorHeader({ title }: HeaderProps) {
  return (
    <header className="h-16 px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-sm z-10 sticky top-0">
      <div className="flex items-center gap-2 lg:hidden">
        <button className="text-slate-500 hover:text-primary">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <span className="text-lg font-bold text-primary">MedDesk</span>
      </div>

      <div className="hidden lg:flex items-center gap-2 text-slate-400">
        <span className="material-symbols-outlined text-primary">analytics</span>
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</span>
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
