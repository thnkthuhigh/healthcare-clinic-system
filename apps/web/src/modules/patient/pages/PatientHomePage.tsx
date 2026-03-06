import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { customerApi } from '../api';
import { PatientFooter } from '../components/PatientFooter';
import { PatientNavbar } from '../components/PatientNavbar';
import type { DoctorSummary, ClinicService } from '../types';

// ─── Static data ─────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-teal-500',
  'bg-emerald-500',
  'bg-cyan-500',
  'bg-violet-500',
  'bg-rose-500',
];

const SERVICE_ICONS = [
  { icon: 'stethoscope', bg: 'bg-blue-50', color: 'text-blue-600' },
  { icon: 'favorite', bg: 'bg-red-50', color: 'text-red-500' },
  { icon: 'child_care', bg: 'bg-emerald-50', color: 'text-emerald-600' },
  { icon: 'dermatology', bg: 'bg-amber-50', color: 'text-amber-600' },
  { icon: 'biotech', bg: 'bg-violet-50', color: 'text-violet-600' },
  { icon: 'ecg_heart', bg: 'bg-pink-50', color: 'text-pink-600' },
  { icon: 'neurology', bg: 'bg-indigo-50', color: 'text-indigo-600' },
  { icon: 'orthopedics', bg: 'bg-teal-50', color: 'text-teal-600' },
];

const WHY_CHOOSE = [
  {
    icon: 'verified',
    title: 'Bác sĩ chuyên môn cao',
    desc: 'Đội ngũ bác sĩ được đào tạo bài bản, nhiều năm kinh nghiệm thực tiễn.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: 'biotech',
    title: 'Thiết bị hiện đại',
    desc: 'Trang bị máy móc y tế tiên tiến, đảm bảo chẩn đoán chính xác và an toàn.',
    color: 'text-teal-600',
    bg: 'bg-teal-50',
  },
  {
    icon: 'timer',
    title: 'Quy trình nhanh chóng',
    desc: 'Đặt lịch online, giảm thiểu thời gian chờ, tối ưu trải nghiệm khám bệnh.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    icon: 'payments',
    title: 'Chi phí hợp lý',
    desc: 'Bảng giá minh bạch, rõ ràng, không phát sinh chi phí ẩn ngoài ý muốn.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    icon: 'favorite',
    title: 'Chăm sóc tận tâm',
    desc: 'Đặt lợi ích bệnh nhân lên hàng đầu, tư vấn chu đáo từng trường hợp.',
    color: 'text-rose-500',
    bg: 'bg-rose-50',
  },
];

const TESTIMONIALS = [
  {
    name: 'Nguyễn Thị Lan',
    role: 'Bệnh nhân tim mạch',
    initials: 'NL',
    color: 'bg-blue-500',
    stars: 5,
    content:
      'Phòng khám rất chuyên nghiệp, bác sĩ tận tâm giải thích rõ ràng từng bước điều trị. Tôi rất hài lòng với dịch vụ tại đây.',
  },
  {
    name: 'Trần Văn Hùng',
    role: 'Bệnh nhân nhi khoa',
    initials: 'TH',
    color: 'bg-teal-500',
    stars: 5,
    content:
      'Con tôi sợ bác sĩ nhưng ở đây nhân viên rất thân thiện, kiên nhẫn. Bé đã không còn lo lắng khi đến khám nữa.',
  },
  {
    name: 'Phạm Thị Mai',
    role: 'Bệnh nhân da liễu',
    initials: 'PM',
    color: 'bg-emerald-500',
    stars: 5,
    content:
      'Đặt lịch online rất tiện, không phải chờ đợi lâu. Kết quả khám chuẩn xác, phác đồ điều trị rõ ràng và hiệu quả.',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  const parts = name.replace('BS.', '').trim().split(' ');
  const first = parts[0]?.[0] ?? '';
  const last = parts.length >= 2 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase() || name.slice(0, 2).toUpperCase();
}

function formatVND(cents: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function StarRow({ count }: { count: number }) {
  return (
    <div className="flex">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="material-symbols-outlined text-amber-400 text-base">
          star
        </span>
      ))}
    </div>
  );
}

// ─── Sections ────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-teal-500 text-white overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: text */}
          <div>
            <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 mb-6 text-sm font-medium">
              <span className="material-symbols-outlined text-sm">local_hospital</span>
              Healthcare Clinic — Tin tưởng & Chuyên nghiệp
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-5">
              Chăm sóc sức khoẻ <span className="text-teal-200">tận tâm</span> cho bạn và gia đình
            </h1>
            <p className="text-blue-100 text-lg leading-relaxed mb-8 max-w-lg">
              Đội ngũ bác sĩ chuyên khoa giàu kinh nghiệm, trang thiết bị hiện đại, quy trình khám
              nhanh chóng — tất cả để mang lại sức khoẻ tốt nhất cho bạn.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/booking"
                className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-7 py-3.5 rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
              >
                <span className="material-symbols-outlined">calendar_add_on</span>
                Đặt lịch khám ngay
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center gap-2 bg-white/15 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-white/25 transition-colors border border-white/20"
              >
                <span className="material-symbols-outlined">medical_services</span>
                Xem dịch vụ
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-4 mt-10">
              {[
                { icon: 'groups', text: '20+ bác sĩ chuyên khoa' },
                { icon: 'biotech', text: 'Thiết bị hiện đại' },
                { icon: 'support_agent', text: 'Hỗ trợ tận tâm' },
              ].map((b) => (
                <div
                  key={b.text}
                  className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 text-sm"
                >
                  <span className="material-symbols-outlined text-teal-200 text-base">
                    {b.icon}
                  </span>
                  {b.text}
                </div>
              ))}
            </div>
          </div>

          {/* Right: illustration */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative">
              {/* Main circle */}
              <div className="w-80 h-80 bg-white/10 rounded-full flex items-center justify-center">
                <div className="w-64 h-64 bg-white/15 rounded-full flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-white text-center"
                    style={{ fontSize: '8rem', lineHeight: 1 }}
                  >
                    medical_services
                  </span>
                </div>
              </div>
              {/* Floating cards */}
              <div className="absolute -top-4 -right-6 bg-white text-slate-800 rounded-2xl p-3 shadow-xl text-xs font-semibold flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-600 text-base">
                    check_circle
                  </span>
                </div>
                Đặt lịch thành công!
              </div>
              <div className="absolute -bottom-4 -left-6 bg-white text-slate-800 rounded-2xl p-3 shadow-xl text-xs font-semibold flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-600 text-base">star</span>
                </div>
                4.9/5 — 50.000+ bệnh nhân
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: '10+', label: 'Năm kinh nghiệm' },
            { value: '20+', label: 'Bác sĩ chuyên khoa' },
            { value: '50K+', label: 'Bệnh nhân hài lòng' },
            { value: '8', label: 'Chuyên khoa' },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 rounded-2xl p-4 text-center backdrop-blur-sm">
              <p className="text-3xl font-bold">{s.value}</p>
              <p className="text-blue-100 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left */}
        <div>
          <p className="text-blue-600 font-semibold text-sm mb-2 tracking-wide uppercase">
            Về chúng tôi
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-5 leading-tight">
            Sứ mệnh vì sức khoẻ cộng đồng
          </h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            Healthcare Clinic được thành lập với sứ mệnh cung cấp dịch vụ chăm sóc sức khoẻ chất
            lượng cao, tiếp cận rộng rãi cho mọi người dân. Chúng tôi tin rằng mỗi bệnh nhân xứng
            đáng được nhận sự chăm sóc y tế tốt nhất.
          </p>
          <p className="text-slate-600 leading-relaxed mb-8">
            Với đội ngũ hơn 20 bác sĩ chuyên khoa giàu kinh nghiệm và hệ thống trang thiết bị hiện
            đại, chúng tôi cam kết mang đến trải nghiệm khám bệnh an toàn, hiệu quả và thoải mái.
          </p>
          <Link
            to="/about"
            className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
          >
            Tìm hiểu thêm
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </Link>
        </div>

        {/* Right: 3 highlights */}
        <div className="grid grid-cols-1 gap-4">
          {[
            {
              icon: 'verified',
              title: 'Chuyên nghiệp',
              desc: 'Bác sĩ được đào tạo bài bản tại các trường y uy tín trong và ngoài nước.',
              color: 'text-blue-600',
              bg: 'bg-blue-50',
            },
            {
              icon: 'favorite',
              title: 'Tận tâm',
              desc: 'Luôn đặt sức khoẻ và lợi ích của bệnh nhân lên hàng đầu trong mọi quyết định điều trị.',
              color: 'text-rose-500',
              bg: 'bg-rose-50',
            },
            {
              icon: 'biotech',
              title: 'Hiện đại',
              desc: 'Ứng dụng công nghệ y tế tiên tiến, đặt lịch online, hồ sơ điện tử, kết quả nhanh chóng.',
              color: 'text-teal-600',
              bg: 'bg-teal-50',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-4 bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:border-blue-200 transition-all"
            >
              <div
                className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center flex-shrink-0`}
              >
                <span className={`material-symbols-outlined ${item.color} text-2xl`}>
                  {item.icon}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServicesSection({
  services,
  isLoading,
}: {
  services?: ClinicService[] | undefined;
  isLoading: boolean;
}) {
  const display = services?.slice(0, 6);

  return (
    <section className="bg-slate-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-blue-600 font-semibold text-sm mb-2 tracking-wide uppercase">
            Dịch vụ
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">Dịch vụ nổi bật</h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Cung cấp đầy đủ các dịch vụ khám chữa bệnh với chất lượng cao và chi phí hợp lý
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-5 animate-pulse flex flex-col items-center gap-3"
                >
                  <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                  <div className="h-3 w-20 bg-slate-200 rounded" />
                  <div className="h-2 w-16 bg-slate-200 rounded" />
                </div>
              ))
            : display?.map((s, idx) => {
                const palette = SERVICE_ICONS[idx % SERVICE_ICONS.length]!;
                return (
                  <Link
                    key={s.id}
                    to={`/booking?serviceId=${s.id}`}
                    className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col items-center text-center hover:shadow-md hover:border-blue-200 transition-all group"
                  >
                    <div
                      className={`w-12 h-12 ${palette.bg} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                    >
                      <span className={`material-symbols-outlined ${palette.color}`}>
                        {palette.icon}
                      </span>
                    </div>
                    <h3 className="text-xs font-semibold text-slate-900 leading-tight">{s.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{Math.floor(s.durationMin)} phút</p>
                  </Link>
                );
              })}
        </div>

        <div className="text-center">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 border border-blue-600 text-blue-600 font-semibold px-7 py-3 rounded-xl hover:bg-blue-50 transition-colors"
          >
            Xem tất cả dịch vụ
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function DoctorsSection({
  doctors,
  isLoading,
}: {
  doctors?: DoctorSummary[] | undefined;
  isLoading: boolean;
}) {
  const display = doctors?.slice(0, 4);

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-blue-600 font-semibold text-sm mb-2 tracking-wide uppercase">
            Đội ngũ
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">Bác sĩ tiêu biểu</h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Đội ngũ chuyên gia y tế giàu kinh nghiệm, tận tâm với từng bệnh nhân
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center animate-pulse"
                >
                  <div className="w-20 h-20 bg-slate-200 rounded-full mb-4" />
                  <div className="h-4 bg-slate-200 rounded w-32 mb-2" />
                  <div className="h-3 bg-slate-200 rounded w-24 mb-4" />
                  <div className="h-9 bg-slate-200 rounded-xl w-full" />
                </div>
              ))
            : display?.map((doc, idx) => {
                const color = AVATAR_COLORS[idx % AVATAR_COLORS.length]!;
                const initials = getInitials(doc.displayName);
                const stars = doc.averageStars ?? 5;
                return (
                  <div
                    key={doc.id}
                    className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center text-center hover:shadow-md hover:border-blue-200 transition-all"
                  >
                    <div
                      className={`w-20 h-20 ${color} rounded-full flex items-center justify-center mb-4 shadow-md`}
                    >
                      <span className="text-2xl font-bold text-white">{initials}</span>
                    </div>
                    <h3 className="font-semibold text-slate-900">{doc.displayName}</h3>
                    <p className="text-sm text-slate-500 mt-0.5 mb-2">
                      {doc.specialty ?? 'Đa khoa'}
                    </p>
                    <div className="flex items-center gap-1 mb-1">
                      {Array.from({ length: Math.round(stars) }).map((_, i) => (
                        <span key={i} className="material-symbols-outlined text-amber-400 text-sm">
                          star
                        </span>
                      ))}
                      <span className="text-xs text-slate-500 ml-1">
                        {stars > 0 ? stars.toFixed(1) : ''}
                      </span>
                    </div>
                    <Link
                      to={`/booking?doctorId=${doc.id}`}
                      className="mt-4 w-full py-2.5 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition-colors font-medium"
                    >
                      Đặt lịch
                    </Link>
                  </div>
                );
              })}
        </div>

        <div className="text-center">
          <Link
            to="/doctors"
            className="inline-flex items-center gap-2 border border-blue-600 text-blue-600 font-semibold px-7 py-3 rounded-xl hover:bg-blue-50 transition-colors"
          >
            Xem tất cả bác sĩ
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function WhyChooseUsSection() {
  return (
    <section className="bg-gradient-to-br from-slate-900 to-blue-900 text-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-teal-300 font-semibold text-sm mb-2 tracking-wide uppercase">Lý do</p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Tại sao chọn Healthcare Clinic?</h2>
          <p className="text-slate-300 max-w-xl mx-auto">
            Chúng tôi không chỉ chữa bệnh — chúng tôi chăm sóc sức khoẻ toàn diện cho bạn
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {WHY_CHOOSE.map((item) => (
            <div
              key={item.title}
              className="bg-white/10 rounded-2xl p-6 text-center hover:bg-white/15 transition-colors border border-white/10"
            >
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span
                  className={`material-symbols-outlined text-3xl ${item.color === 'text-blue-600' ? 'text-blue-300' : item.color === 'text-teal-600' ? 'text-teal-300' : item.color === 'text-emerald-600' ? 'text-emerald-300' : item.color === 'text-amber-600' ? 'text-amber-300' : 'text-rose-300'}`}
                >
                  {item.icon}
                </span>
              </div>
              <h3 className="font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingPreviewSection({
  services,
  isLoading,
}: {
  services?: ClinicService[] | undefined;
  isLoading: boolean;
}) {
  const preview = services?.slice(0, 5);

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-blue-600 font-semibold text-sm mb-2 tracking-wide uppercase">
            Bảng giá
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
            Giá dịch vụ tham khảo
          </h2>
          <p className="text-slate-500 max-w-lg mx-auto">
            Bảng giá minh bạch, rõ ràng — không phát sinh chi phí ẩn
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mb-8">
          <div className="bg-blue-600 text-white px-6 py-4 grid grid-cols-3 text-sm font-semibold">
            <span>Dịch vụ</span>
            <span className="text-center">Thời gian</span>
            <span className="text-right">Giá khám</span>
          </div>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-6 py-4 border-b border-slate-100 animate-pulse">
                  <div className="h-4 bg-slate-200 rounded" />
                </div>
              ))
            : preview?.map((s, idx) => {
                const palette = SERVICE_ICONS[idx % SERVICE_ICONS.length]!;
                return (
                  <div
                    key={s.id}
                    className="px-6 py-4 border-b border-slate-100 grid grid-cols-3 items-center hover:bg-blue-50/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`material-symbols-outlined text-base ${palette.color}`}>
                        {palette.icon}
                      </span>
                      <span className="text-sm font-medium text-slate-800">{s.name}</span>
                    </div>
                    <span className="text-sm text-slate-500 text-center">{s.durationMin} phút</span>
                    <span className="text-sm font-bold text-blue-700 text-right">
                      {formatVND(s.priceCents)}
                    </span>
                  </div>
                );
              })}
        </div>

        <div className="text-center">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-7 py-3 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Xem bảng giá đầy đủ
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-blue-600 font-semibold text-sm mb-2 tracking-wide uppercase">
            Đánh giá
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">Bệnh nhân nói gì?</h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Hơn 50.000 bệnh nhân đã tin tưởng lựa chọn Healthcare Clinic
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="bg-white rounded-2xl border border-slate-200 p-7 hover:shadow-md hover:border-blue-200 transition-all"
            >
              <StarRow count={t.stars} />
              <p className="text-slate-600 mt-4 mb-6 leading-relaxed text-sm">"{t.content}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div
                  className={`w-10 h-10 ${t.color} rounded-full flex items-center justify-center flex-shrink-0`}
                >
                  <span className="text-white font-bold text-sm">{t.initials}</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-10 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-3xl p-10 sm:p-14 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />
          <div className="relative">
            <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-3xl">calendar_add_on</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Đặt lịch khám ngay hôm nay</h2>
            <p className="text-blue-100 text-lg mb-8 max-w-lg mx-auto">
              Đặt lịch khám trực tuyến nhanh chóng, không cần chờ đợi lâu. Bác sĩ sẽ tư vấn tận tâm
              cho bạn.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/booking"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors shadow-lg text-lg"
              >
                <span className="material-symbols-outlined">calendar_add_on</span>
                Đặt lịch ngay
              </Link>
              <Link
                to="/appointments"
                className="inline-flex items-center justify-center gap-2 bg-white/15 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/25 transition-colors border border-white/20 text-lg"
              >
                <span className="material-symbols-outlined">search</span>
                Tra cứu lịch khám
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function PatientHomePage() {
  const { data: doctors, isLoading: doctorsLoading } = useQuery({
    queryKey: ['customer', 'doctors'],
    queryFn: () => customerApi.getDoctors(),
  });

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['customer', 'services'],
    queryFn: () => customerApi.getServices(),
  });

  return (
    <div className="min-h-screen bg-white">
      <PatientNavbar />

      <HeroSection />
      <AboutSection />
      <ServicesSection services={services} isLoading={servicesLoading} />
      <DoctorsSection doctors={doctors} isLoading={doctorsLoading} />
      <WhyChooseUsSection />
      <PricingPreviewSection services={services} isLoading={servicesLoading} />
      <TestimonialsSection />
      <CTASection />

      <PatientFooter />
    </div>
  );
}
