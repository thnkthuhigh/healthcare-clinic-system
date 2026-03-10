import { Link } from 'react-router-dom';

import { PatientFooter } from '../components/PatientFooter';
import { PatientNavbar } from '../components/PatientNavbar';

const STATS = [
  { label: 'Năm hoạt động', value: '10+', icon: 'calendar_month' },
  { label: 'Bác sĩ chuyên khoa', value: '20+', icon: 'stethoscope' },
  { label: 'Bệnh nhân hài lòng', value: '50.000+', icon: 'favorite' },
  { label: 'Chuyên khoa', value: '8', icon: 'medical_services' },
];

const VALUES = [
  {
    icon: 'verified',
    title: 'Chuyên nghiệp',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    desc: 'Đội ngũ bác sĩ được đào tạo bài bản, nhiều năm kinh nghiệm trong nước và quốc tế.',
  },
  {
    icon: 'favorite',
    title: 'Tận tâm',
    color: 'text-red-500',
    bg: 'bg-red-50',
    desc: 'Luôn đặt lợi ích và sức khoẻ của bệnh nhân lên hàng đầu trong mọi quyết định.',
  },
  {
    icon: 'biotech',
    title: 'Hiện đại',
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    desc: 'Trang thiết bị y tế tiên tiến, ứng dụng công nghệ số trong quản lý và điều trị.',
  },
  {
    icon: 'lock',
    title: 'Bảo mật',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    desc: 'Hồ sơ bệnh nhân được bảo mật tuyệt đối, tuân thủ quy định pháp luật về y tế.',
  },
];

const DEPARTMENTS = [
  { name: 'Tim mạch', icon: 'ecg_heart', color: 'text-red-500', bg: 'bg-red-50' },
  { name: 'Nội tổng quát', icon: 'stethoscope', color: 'text-blue-600', bg: 'bg-blue-50' },
  { name: 'Nhi khoa', icon: 'child_care', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { name: 'Da liễu', icon: 'dermatology', color: 'text-amber-600', bg: 'bg-amber-50' },
  { name: 'Thần kinh', icon: 'neurology', color: 'text-violet-600', bg: 'bg-violet-50' },
  { name: 'Mắt', icon: 'visibility', color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { name: 'Tai - Mũi - Họng', icon: 'hearing', color: 'text-teal-600', bg: 'bg-teal-50' },
  { name: 'Xương khớp', icon: 'orthopedics', color: 'text-indigo-600', bg: 'bg-indigo-50' },
];

const WORKING_HOURS = [
  { day: 'Thứ 2 – Thứ 6', hours: '07:00 – 17:00', note: 'Buổi sáng & chiều' },
  { day: 'Thứ 7', hours: '07:00 – 12:00', note: 'Buổi sáng' },
  { day: 'Chủ nhật', hours: 'Nghỉ', note: 'Trừ trường hợp cấp cứu' },
];

export function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PatientNavbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-teal-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl">local_hospital</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Healthcare Clinic</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Chăm sóc sức khoẻ toàn diện — Nơi bạn tin tưởng gửi gắm sức khoẻ gia đình
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl border border-slate-200 p-5 text-center shadow-sm"
            >
              <span className="material-symbols-outlined text-blue-600 text-3xl block mb-2">
                {s.icon}
              </span>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">
        {/* Mission */}
        <section className="bg-white rounded-2xl border border-slate-200 p-8">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-blue-600 text-2xl">flag</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Sứ mệnh của chúng tôi</h2>
              <p className="text-slate-500 text-sm mt-0.5">Vì một cộng đồng khoẻ mạnh hơn</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-600 leading-relaxed">
            <p>
              Healthcare Clinic được thành lập năm 2015 với sứ mệnh cung cấp dịch vụ chăm sóc sức
              khoẻ chất lượng cao, tiếp cận rộng rãi cho mọi người dân. Chúng tôi tin rằng mỗi bệnh
              nhân xứng đáng được nhận sự chăm sóc y tế tốt nhất với chi phí hợp lý.
            </p>
            <p>
              Với đội ngũ hơn 20 bác sĩ chuyên khoa giàu kinh nghiệm và hệ thống trang thiết bị hiện
              đại, chúng tôi cam kết mang đến trải nghiệm khám chữa bệnh an toàn, hiệu quả và thân
              thiện cho từng bệnh nhân.
            </p>
          </div>
        </section>

        {/* Values */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Giá trị cốt lõi</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md hover:border-blue-200 transition-all"
              >
                <div
                  className={`w-12 h-12 ${v.bg} rounded-xl flex items-center justify-center mb-4`}
                >
                  <span className={`material-symbols-outlined ${v.color} text-2xl`}>{v.icon}</span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{v.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Departments */}
        <section className="bg-white rounded-2xl border border-slate-200 p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Chuyên khoa</h2>
          <p className="text-slate-500 text-sm mb-6">
            Hệ thống 8 chuyên khoa đầy đủ, phục vụ toàn diện nhu cầu chăm sóc sức khoẻ
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {DEPARTMENTS.map((d) => (
              <div
                key={d.name}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all"
              >
                <div className={`w-9 h-9 ${d.bg} rounded-lg flex items-center justify-center`}>
                  <span className={`material-symbols-outlined ${d.color} text-xl`}>{d.icon}</span>
                </div>
                <span className="text-sm font-medium text-slate-700">{d.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Location + Hours */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Location */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-600">location_on</span>
              </div>
              <h3 className="font-semibold text-slate-900 text-lg">Địa chỉ & Liên hệ</h3>
            </div>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-slate-400 text-base flex-shrink-0 mt-0.5">
                  place
                </span>
                <span>123 Đường Nguyễn Văn Cừ, Phường 4, Quận 5, TP. Hồ Chí Minh</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400 text-base">call</span>
                <span>(028) 3838 1234 — (028) 3838 5678</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400 text-base">email</span>
                <span>info@healthcareclinic.vn</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400 text-base">language</span>
                <span>www.healthcareclinic.vn</span>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-teal-600">schedule</span>
              </div>
              <h3 className="font-semibold text-slate-900 text-lg">Giờ làm việc</h3>
            </div>
            <div className="space-y-3">
              {WORKING_HOURS.map((h) => (
                <div
                  key={h.day}
                  className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{h.day}</p>
                    <p className="text-xs text-slate-400">{h.note}</p>
                  </div>
                  <span
                    className={`text-sm font-semibold ${h.hours === 'Nghỉ' ? 'text-red-500' : 'text-teal-600'}`}
                  >
                    {h.hours}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl p-10 text-center text-white">
          <h3 className="text-2xl font-bold mb-2">Chăm sóc sức khoẻ ngay hôm nay</h3>
          <p className="text-blue-100 mb-6 max-w-md mx-auto">
            Đặt lịch khám trực tuyến nhanh chóng, không cần chờ đợi lâu
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/booking"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors"
            >
              <span className="material-symbols-outlined">calendar_add_on</span>
              Đặt lịch khám
            </Link>
            <Link
              to="/doctors"
              className="inline-flex items-center justify-center gap-2 bg-white/10 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-colors border border-white/20"
            >
              <span className="material-symbols-outlined">stethoscope</span>
              Xem bác sĩ
            </Link>
          </div>
        </div>
      </main>

      <PatientFooter />
    </div>
  );
}
