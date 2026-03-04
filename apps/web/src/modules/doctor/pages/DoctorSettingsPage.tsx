export function DoctorSettingsPage() {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Settings</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Manage your account and preferences
        </p>

        {/* Settings Categories */}
        <div className="space-y-4">
          {/* Profile Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-slate-700 dark:text-slate-300">
                person
              </span>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Profile Settings
              </h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Update your personal information and profile picture
            </p>
          </div>

          {/* Account Security */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-slate-700 dark:text-slate-300">
                lock
              </span>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Account Security
              </h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Change password and manage security settings
            </p>
          </div>

          {/* Notification Preferences */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-slate-700 dark:text-slate-300">
                notifications
              </span>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Notifications
              </h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Configure notification preferences and alerts
            </p>
          </div>

          {/* Coming Soon Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center mt-8">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <strong>Note:</strong> Settings functionality is under development
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
