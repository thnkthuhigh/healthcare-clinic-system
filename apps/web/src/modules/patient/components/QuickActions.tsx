import { Link } from 'react-router-dom';

const ACTIONS = [
  {
    title: 'Đặt lịch khám',
    description: 'Đặt lịch với bác sĩ chỉ trong vài bước đơn giản',
    icon: 'calendar_add_on',
    gradient: 'from-blue-500 to-blue-600',
    to: '/booking',
    btnLabel: 'Đặt lịch ngay',
  },
  {
    title: 'Lịch khám của tôi',
    description: 'Xem và quản lý các lịch khám đã đặt',
    icon: 'event_note',
    gradient: 'from-teal-500 to-teal-600',
    to: '/appointments',
    btnLabel: 'Xem lịch',
  },
  {
    title: 'Hồ sơ sức khỏe',
    description: 'Xem lịch sử khám bệnh và đơn thuốc',
    icon: 'medical_information',
    gradient: 'from-emerald-500 to-emerald-600',
    to: '/health-records',
    btnLabel: 'Xem hồ sơ',
  },
  {
    title: 'Danh sách bác sĩ',
    description: 'Tìm bác sĩ phù hợp theo chuyên khoa',
    icon: 'groups',
    gradient: 'from-cyan-500 to-cyan-600',
    to: '/doctors',
    btnLabel: 'Xem bác sĩ',
  },
] as const;

export function QuickActions() {
  return (
    <section>
      <h2 className="text-xl font-bold text-slate-900 mb-4">Truy cập nhanh</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {ACTIONS.map((action) => (
          <div
            key={action.to}
            className={`bg-gradient-to-br ${action.gradient} rounded-2xl p-5 text-white flex flex-col justify-between min-h-[168px]`}
          >
            <div>
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-white">{action.icon}</span>
              </div>
              <h3 className="font-semibold text-base mb-1">{action.title}</h3>
              <p className="text-xs text-white/80 leading-relaxed">{action.description}</p>
            </div>
            <Link
              to={action.to}
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium bg-white/20 hover:bg-white/30 transition-colors rounded-lg px-3 py-1.5 self-start"
            >
              {action.btnLabel}
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
