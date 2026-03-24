import { useLocation } from 'react-router-dom';

const routeTitles: Record<string, { title: string; description: string; icon: string }> = {
  '/admin/dashboard': {
    title: 'Tổng quan vận hành',
    description: 'Theo dõi hoạt động trong ngày và các đầu việc quan trọng của phòng khám.',
    icon: 'dashboard',
  },
  '/admin/reception': {
    title: 'Điều phối tiếp nhận',
    description: 'Quản lý hàng chờ, check-in và các bước tiếp nhận đầu ca.',
    icon: 'assignment_ind',
  },
  '/admin/cashier': {
    title: 'Thu ngân',
    description: 'Kiểm soát thanh toán, hóa đơn và các khoản phát sinh.',
    icon: 'point_of_sale',
  },
  '/admin/doctors': {
    title: 'Quản lý bác sĩ',
    description: 'Cấu hình đội ngũ chuyên môn, chuyên khoa và lịch làm việc.',
    icon: 'medical_information',
  },
  '/admin/patients': {
    title: 'Hồ sơ khám bệnh',
    description: 'Theo dõi bệnh nhân, lịch sử khám và trạng thái xử lý hồ sơ.',
    icon: 'folder_shared',
  },
  '/admin/shifts': {
    title: 'Ca làm việc',
    description: 'Phân ca và giám sát năng lực tiếp nhận theo ngày.',
    icon: 'calendar_month',
  },
  '/admin/services': {
    title: 'Dịch vụ và chuyên khoa',
    description: 'Quản lý danh mục dịch vụ, chuyên khoa và phạm vi khám.',
    icon: 'medical_services',
  },
  '/admin/rooms': {
    title: 'Phòng khám',
    description: 'Theo dõi cấu hình phòng và nguồn lực sử dụng nội bộ.',
    icon: 'meeting_room',
  },
  '/admin/supplies': {
    title: 'Vật tư',
    description: 'Giám sát vật tư tiêu hao phục vụ quy trình khám chữa bệnh.',
    icon: 'inventory_2',
  },
  '/admin/assets': {
    title: 'Tài sản',
    description: 'Quản lý tài sản và trang thiết bị của phòng khám.',
    icon: 'inventory',
  },
  '/admin/medications': {
    title: 'Danh mục thuốc',
    description: 'Quản lý thuốc và các cấu hình kê đơn liên quan.',
    icon: 'medication',
  },
  '/admin/templates': {
    title: 'Mẫu toa thuốc',
    description: 'Chuẩn hóa các mẫu kê đơn và hướng dẫn sử dụng.',
    icon: 'description',
  },
  '/admin/departments': {
    title: 'Khoa và bộ phận',
    description: 'Tổ chức nhóm chuyên môn và bộ phận hỗ trợ vận hành.',
    icon: 'domain',
  },
  '/admin/reports': {
    title: 'Báo cáo và audit',
    description: 'Tổng hợp báo cáo, nhật ký hoạt động và các chỉ số kiểm soát.',
    icon: 'bar_chart',
  },
};

export function AdminHeader() {
  const location = useLocation();

  const current = Object.entries(routeTitles).find(([path]) => location.pathname.startsWith(path))?.[1] ?? {
    title: 'Quản trị hệ thống',
    description: 'Điều phối và cấu hình toàn bộ vận hành phòng khám.',
    icon: 'admin_panel_settings',
  };

  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="ops-header" data-testid="admin-header">
      <div className="flex items-start gap-4">
        <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <span className="material-symbols-outlined text-[22px]">{current.icon}</span>
        </div>
        <div>
          <p className="ops-section-label">Khu vực quản trị</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950" data-testid="admin-header-title">
            {current.title}
          </h2>
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
