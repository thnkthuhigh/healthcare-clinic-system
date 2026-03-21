import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { customerApi } from '../api';
import { PatientFooter } from '../components/PatientFooter';
import { PatientNavbar } from '../components/PatientNavbar';
import type { ClinicService } from '../types';

const ICON_PALETTE = [
  { icon: 'stethoscope', bgColor: 'bg-blue-50', iconColor: 'text-blue-600' },
  { icon: 'favorite', bgColor: 'bg-red-50', iconColor: 'text-red-500' },
  { icon: 'child_care', bgColor: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  { icon: 'neurology', bgColor: 'bg-violet-50', iconColor: 'text-violet-600' },
  { icon: 'visibility', bgColor: 'bg-cyan-50', iconColor: 'text-cyan-600' },
  { icon: 'orthopedics', bgColor: 'bg-amber-50', iconColor: 'text-amber-600' },
  { icon: 'vaccines', bgColor: 'bg-teal-50', iconColor: 'text-teal-600' },
  { icon: 'ecg_heart', bgColor: 'bg-pink-50', iconColor: 'text-pink-600' },
  { icon: 'medication', bgColor: 'bg-indigo-50', iconColor: 'text-indigo-600' },
  { icon: 'biotech', bgColor: 'bg-lime-50', iconColor: 'text-lime-600' },
];

function formatVND(cents: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function ServiceRowSkeleton() {
  return (
    <tr className="animate-pulse border-b border-slate-100">
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-200 rounded-xl" />
          <div className="h-4 bg-slate-200 rounded w-40" />
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="h-4 bg-slate-200 rounded w-24" />
      </td>
      <td className="py-4 px-4">
        <div className="h-8 bg-slate-200 rounded-lg w-20" />
      </td>
    </tr>
  );
}

function ServiceCard({ service, index }: { service: ClinicService; index: number }) {
  const palette = ICON_PALETTE[index % ICON_PALETTE.length] ?? ICON_PALETTE[0]!;
  return (
    <tr className="border-b border-slate-100 hover:bg-blue-50/30 transition-colors group">
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 ${palette.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}
          >
            <span className={`material-symbols-outlined text-xl ${palette.iconColor}`}>
              {palette.icon}
            </span>
          </div>
          <span className="font-medium text-slate-900">{service.name}</span>
        </div>
      </td>
      <td className="py-4 px-4">
        <span className="font-bold text-blue-700 text-base">{formatVND(service.priceCents)}</span>
      </td>
      <td className="py-4 px-4">
        <Link
          to={`/booking?serviceId=${service.id}`}
          className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Đặt lịch
        </Link>
      </td>
    </tr>
  );
}

export function ServicesPage() {
  const {
    data: services,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['customer', 'services'],
    queryFn: () => customerApi.getServices(),
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <PatientNavbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-teal-600 to-blue-700 text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-4">
            <span className="material-symbols-outlined text-sm">local_atm</span>
            <span className="text-sm font-medium">Bảng giá minh bạch, rõ ràng</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Dịch vụ & Bảng giá</h1>
          <p className="text-blue-100 max-w-xl mx-auto">
            Tất cả dịch vụ y tế với mức giá công khai, không phát sinh chi phí ẩn
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Notice banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 mb-8">
          <span className="material-symbols-outlined text-amber-500 flex-shrink-0">info</span>
          <div>
            <p className="text-sm font-medium text-amber-800">Lưu ý về bảng giá</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Giá trên chưa bao gồm chi phí xét nghiệm, thuốc và các dịch vụ cận lâm sàng (nếu có).
              Giá có thể thay đổi theo từng thời điểm.
            </p>
          </div>
        </div>

        {/* Error state */}
        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <span className="material-symbols-outlined text-red-400 text-3xl block mb-2">
              error
            </span>
            <p className="text-red-700 font-medium">Không thể tải danh sách dịch vụ</p>
          </div>
        )}

        {/* Table */}
        {!isError && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">
                Danh sách dịch vụ
                {services && (
                  <span className="ml-2 text-sm font-normal text-slate-400">
                    ({services.length} dịch vụ)
                  </span>
                )}
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Dịch vụ
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Giá khám
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Đặt lịch
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading
                    ? Array.from({ length: 6 }).map((_, i) => <ServiceRowSkeleton key={i} />)
                    : services?.map((service, idx) => (
                        <ServiceCard key={service.id} service={service} index={idx} />
                      ))}
                </tbody>
              </table>
            </div>

            {!isLoading && !isError && services?.length === 0 && (
              <div className="py-16 text-center">
                <span className="material-symbols-outlined text-slate-300 text-5xl block mb-3">
                  medical_services
                </span>
                <p className="text-slate-400">Chưa có dịch vụ nào</p>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="mt-10 bg-blue-600 rounded-2xl p-8 text-center text-white">
          <h3 className="text-xl font-bold mb-2">Sẵn sàng đặt lịch khám?</h3>
          <p className="text-blue-100 mb-5 text-sm">
            Đặt lịch ngay hôm nay để được gặp các bác sĩ giàu kinh nghiệm của chúng tôi
          </p>
          <Link
            to="/booking"
            className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors"
          >
            <span className="material-symbols-outlined">calendar_add_on</span>
            Đặt lịch khám ngay
          </Link>
        </div>
      </main>

      <PatientFooter />
    </div>
  );
}
