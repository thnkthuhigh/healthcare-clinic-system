import { InfoPageHeader, SectionHeading } from '../../../components/ClinicUI';
import { ClinicOperationsVisual } from '../../../components/ClinicVisuals';
import { PatientFooter } from '../components/PatientFooter';
import { PatientNavbar } from '../components/PatientNavbar';
import { CLINIC_CONTACT } from '../content';

const STATS = [
  { label: 'Năm hoạt động', value: '10+' },
  { label: 'Bác sĩ chuyên khoa', value: '20+' },
  { label: 'Bệnh nhân đã phục vụ', value: '50.000+' },
  { label: 'Chuyên khoa đang vận hành', value: '8' },
] as const;

const CARE_MODEL = [
  {
    icon: 'calendar_add_on',
    title: 'Đi thẳng vào tác vụ chính',
    description: 'Bệnh nhân có thể bắt đầu từ đặt lịch, bác sĩ hoặc tra cứu hồ sơ.',
  },
  {
    icon: 'medical_information',
    title: 'Dữ liệu được mở lại dễ dàng',
    description: 'Phiếu khám, đơn thuốc và lịch hẹn được nối lại bằng số điện thoại đăng ký.',
  },
  {
    icon: 'monitoring',
    title: 'Luồng nội bộ đồng bộ',
    description: 'Bác sĩ và lễ tân làm việc trên cùng hệ ngôn ngữ giao diện với khu bệnh nhân.',
  },
] as const;

const VALUES = [
  {
    icon: 'verified_user',
    title: 'Rõ ràng',
    description: 'Mỗi trang chỉ ưu tiên một mục tiêu chính để người dùng không bị phân tán.',
  },
  {
    icon: 'favorite',
    title: 'Tin cậy',
    description: 'Ngôn ngữ hiển thị ngắn, trung tính và phù hợp bối cảnh phòng khám.',
  },
  {
    icon: 'hub',
    title: 'Liền mạch',
    description: 'Từ đặt lịch đến mở lại hồ sơ đều nằm trong cùng một trải nghiệm thống nhất.',
  },
] as const;

const EXPERIENCE_ZONES = [
  {
    title: 'Khu tiếp nhận bệnh nhân',
    description: 'Tập trung vào đặt lịch, xem lại lịch hẹn, phiếu khám và hồ sơ sức khỏe.',
    icon: 'medical_information',
  },
  {
    title: 'Khu vận hành nội bộ',
    description: 'Hỗ trợ bác sĩ, lễ tân và quản trị viên trong điều phối hoạt động hằng ngày.',
    icon: 'monitoring',
  },
  {
    title: 'Điểm tra cứu sau khám',
    description: 'Cho phép bệnh nhân quay lại xem tài liệu, đơn thuốc và kết quả đã lưu.',
    icon: 'inventory_2',
  },
] as const;

export function AboutPage() {
  return (
    <div className="clinic-page" data-testid="public-about-page">
      <PatientNavbar />

      <InfoPageHeader
        icon="local_hospital"
        eyebrow="Về phòng khám"
        title="Một website phòng khám được tổ chức như dịch vụ thật, không phải trang giới thiệu khô"
        description="Healthcare Clinic tập trung vào đúng các nhu cầu bệnh nhân thường làm nhất: tìm bác sĩ, đặt lịch, giữ phiếu khám và mở lại hồ sơ khi cần."
        metrics={
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="clinic-kpi">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Giờ tiếp nhận
              </p>
              <p className="mt-3 text-xl font-bold tracking-tight text-slate-950">
                {CLINIC_CONTACT.hours}
              </p>
            </div>
            <div className="clinic-kpi">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Tổng đài hỗ trợ
              </p>
              <p className="mt-3 text-xl font-bold tracking-tight text-slate-950">
                {CLINIC_CONTACT.phone}
              </p>
            </div>
          </div>
        }
      />

      <main className="clinic-section space-y-8">
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {STATS.map((item) => (
            <div key={item.label} className="clinic-stat-card">
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{item.value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_0.92fr]">
          <div className="clinic-card overflow-hidden p-6 sm:p-8 lg:p-10">
            <SectionHeading
              eyebrow="Mô hình trải nghiệm"
              title="Thiết kế theo hành trình khám bệnh, không theo kiểu dashboard chung chung"
              description="Thông tin được rút gọn để nhường chỗ cho các điểm vào rõ ràng, card chọn nhanh và các khối tạo cảm giác tin cậy hơn."
            />

            <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-4">
              <ClinicOperationsVisual />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {CARE_MODEL.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-soft"
                >
                  <div className="clinic-icon-badge">
                    <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                  </div>
                  <p className="mt-4 text-lg font-semibold text-slate-950">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="clinic-card p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Không gian sử dụng
              </p>
              <div className="mt-5 space-y-3">
                {EXPERIENCE_ZONES.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="clinic-icon-badge">
                        <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="clinic-card overflow-hidden">
              <div className="bg-primary p-6 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/75">
                  Liên hệ phòng khám
                </p>
                <h3 className="mt-3 text-2xl font-semibold">Thông tin cần để bắt đầu nhanh</h3>
              </div>
              <div className="space-y-4 p-6 text-sm text-slate-600">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Địa chỉ</p>
                  <p className="mt-2 leading-7">{CLINIC_CONTACT.address}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Liên hệ</p>
                  <p className="mt-2">{CLINIC_CONTACT.phone}</p>
                  <p>{CLINIC_CONTACT.email}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
                    Giờ tiếp nhận
                  </p>
                  <p className="mt-2">{CLINIC_CONTACT.hours}</p>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="clinic-card p-6 sm:p-8 lg:p-10">
          <SectionHeading
            eyebrow="Giá trị cốt lõi"
            title="Ba nguyên tắc chi phối toàn bộ giao diện"
            description="Ưu tiên cảm giác chuyên nghiệp, dễ dùng và nhất quán thay vì thêm nhiều hiệu ứng hoặc nội dung không cần thiết."
          />
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {VALUES.map((item) => (
              <div key={item.title} className="clinic-card p-5">
                <div className="clinic-icon-badge">
                  <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                </div>
                <p className="mt-4 text-lg font-semibold text-slate-950">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <PatientFooter />
    </div>
  );
}
