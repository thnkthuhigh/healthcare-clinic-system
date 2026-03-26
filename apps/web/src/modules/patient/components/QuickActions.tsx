import { Link } from 'react-router-dom';

const ACTIONS = [
  {
    title: 'Đặt lịch khám',
    description: 'Chọn bác sĩ, ca khám và gửi thông tin bệnh nhân trong một quy trình rõ ràng.',
    icon: 'calendar_add_on',
    to: '/booking',
    btnLabel: 'Bắt đầu đặt lịch',
  },
  {
    title: 'Lịch hẹn của tôi',
    description: 'Theo dõi trạng thái lịch hẹn, số thứ tự và mã QR check-in trong ngày khám.',
    icon: 'event_note',
    to: '/appointments',
    btnLabel: 'Xem lịch hẹn',
  },
  {
    title: 'Tra cứu hồ sơ',
    description: 'Xem lại lịch sử khám, đơn thuốc, kết quả điều trị bằng số điện thoại đã đăng ký.',
    icon: 'medical_information',
    to: '/health-records',
    btnLabel: 'Mở hồ sơ',
  },
  {
    title: 'Tìm bác sĩ',
    description: 'Tham khảo danh sách bác sĩ theo chuyên khoa trước khi đặt lịch trực tuyến.',
    icon: 'groups',
    to: '/doctors',
    btnLabel: 'Xem đội ngũ',
  },
] as const;

export function QuickActions() {
  return (
    <section className="clinic-card p-6 sm:p-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Hành trình bệnh nhân
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">Các thao tác thường dùng</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Mỗi tác vụ được thiết kế theo đúng ngữ cảnh sử dụng thực tế để giảm bớt thao tác thừa và
            giúp bệnh nhân dễ theo dõi thông tin hơn.
          </p>
        </div>
      </div>

      <div className="clinic-grid mt-6 sm:grid-cols-2 xl:grid-cols-4">
        {ACTIONS.map((action) => (
          <div key={action.to} className="clinic-action-card min-h-[216px]">
            <div>
              <div className="clinic-icon-badge">
                <span className="material-symbols-outlined text-[22px]">{action.icon}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{action.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{action.description}</p>
            </div>
            <Link
              to={action.to}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary"
            >
              <span>{action.btnLabel}</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
