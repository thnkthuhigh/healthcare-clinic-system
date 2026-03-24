import { useLocation, useNavigate } from 'react-router-dom';

const routeMeta: Record<string, { title: string; description: string; icon: string }> = {
  '/doctor/dashboard': {
    title: 'Tổng quan ca khám',
    description: 'Theo dõi số bệnh nhân và tiến độ xử lý trong ngày.',
    icon: 'grid_view',
  },
  '/doctor/queue': {
    title: 'Hàng chờ khám',
    description: 'Điều phối bệnh nhân đã check-in và đang chờ vào khám.',
    icon: 'list_alt',
  },
  '/doctor/consultation': {
    title: 'Khám bệnh',
    description: 'Cập nhật hồ sơ khám, chỉ định và kết luận điều trị.',
    icon: 'medical_information',
  },
  '/doctor/schedule': {
    title: 'Lịch làm việc',
    description: 'Theo dõi ca làm việc và lịch hẹn theo ngày, theo tháng.',
    icon: 'calendar_month',
  },
  '/doctor/patients': {
    title: 'Bệnh nhân',
    description: 'Tra cứu thông tin bệnh nhân và lịch sử khám liên quan.',
    icon: 'group',
  },
  '/doctor/settings': {
    title: 'Thiết lập cá nhân',
    description: 'Quản lý hồ sơ tài khoản bác sĩ và các thông tin cá nhân.',
    icon: 'settings',
  },
};

export function DoctorHeader() {
  const location = useLocation();
  const navigate = useNavigate();

  const current =
    Object.entries(routeMeta).find(([path]) => location.pathname.startsWith(path))?.[1] ?? {
      title: 'Khu vực bác sĩ',
      description: 'Theo dõi các công việc chuyên môn trong ngày.',
      icon: 'stethoscope',
    };

  const canGoBack = location.pathname !== '/doctor/dashboard' && location.pathname !== '/doctor';

  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="ops-header" data-testid="doctor-header">
      <div className="flex items-start gap-4">
        <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <span className="material-symbols-outlined text-[22px]">{current.icon}</span>
        </div>
        <div>
          <p className="ops-section-label">Khu vực bác sĩ</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-slate-950" data-testid="doctor-header-title">
              {current.title}
            </h2>
            {canGoBack && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-200"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                <span>Quay lại</span>
              </button>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">{current.description}</p>
        </div>
      </div>

      <div className="hidden items-center gap-4 lg:flex">
        <span className="text-sm text-slate-500">{today}</span>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
          <span className="material-symbols-outlined text-[18px] text-slate-500">notifications</span>
        </div>
      </div>
    </header>
  );
}
