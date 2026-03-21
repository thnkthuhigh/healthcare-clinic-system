import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { useAuth } from '../../auth/useAuth';
import { customerApi } from '../api';
import { PatientFooter } from '../components/PatientFooter';
import { PatientNavbar } from '../components/PatientNavbar';

const ROLE_LABEL: Record<string, string> = {
  PATIENT: 'Bệnh nhân',
  DOCTOR: 'Bác sĩ',
  ADMIN: 'Quản trị viên',
  OWNER: 'Chủ phòng khám',
  RECEPTIONIST: 'Lễ tân',
  CASHIER: 'Thu ngân',
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Đang hoạt động',
  INACTIVE: 'Tạm ngưng',
  BLOCKED: 'Bị khóa',
};

function displayLabel(map: Record<string, string>, value: string | undefined) {
  if (!value) return 'Chưa có';
  return map[value] ?? value;
}

export function ProfilePage() {
  const { user } = useAuth();
  const phone = user?.phone ?? '';

  const patientQuery = useQuery({
    queryKey: ['patient-profile', phone],
    queryFn: () => customerApi.lookupPatient(phone),
    enabled: !!phone,
  });

  const bookingsQuery = useQuery({
    queryKey: ['patient-profile-bookings', patientQuery.data?.id],
    queryFn: () => customerApi.getPatientBookings(patientQuery.data!.id),
    enabled: !!patientQuery.data?.id,
  });

  const initials = (user?.phone ?? 'U').slice(0, 2);
  const role = displayLabel(ROLE_LABEL, user?.role);
  const status = displayLabel(STATUS_LABEL, user?.status);

  const totalBookings = bookingsQuery.data?.length ?? 0;
  const completedBookings =
    bookingsQuery.data?.filter((booking) => booking.status === 'COMPLETED').length ?? 0;
  const upcomingBookings =
    bookingsQuery.data?.filter((booking) =>
      ['BOOKED', 'CHECKED_IN', 'WAITING'].includes(booking.status),
    ).length ?? 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <PatientNavbar />

      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-4">
            <span className="material-symbols-outlined text-sm">person</span>
            <span className="text-sm font-medium">Thông tin tài khoản</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Hồ sơ cá nhân</h1>
          <p className="text-blue-100 max-w-xl mx-auto">
            Quản lý thông tin đăng nhập và truy cập nhanh đến dữ liệu khám bệnh của bạn.
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 text-white flex items-center justify-center text-xl font-bold">
              {initials}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900">
                {patientQuery.data?.fullName ?? user?.phone ?? 'Người dùng'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">Tài khoản đăng nhập Healthcare Clinic</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium bg-blue-100 text-blue-700">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {role}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-400 mb-1">Số điện thoại</p>
              <p className="font-semibold text-slate-800">{patientQuery.data?.phone ?? phone}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-400 mb-1">Trạng thái tài khoản</p>
              <p className="font-semibold text-slate-800">{status}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4 sm:col-span-2">
              <p className="text-xs text-slate-400 mb-1">CCCD / Passport</p>
              <p className="font-semibold text-slate-800">
                {patientQuery.data?.nationalId ?? 'Chưa cập nhật'}
              </p>
            </div>
          </div>

          {(patientQuery.isLoading || bookingsQuery.isLoading) && (
            <p className="text-sm text-slate-500 mt-4">Đang tải dữ liệu hồ sơ từ hệ thống...</p>
          )}

          {(patientQuery.isError || bookingsQuery.isError) && (
            <p className="text-sm text-red-600 mt-4">
              Không thể tải dữ liệu hồ sơ từ database. Vui lòng thử lại.
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
              <p className="text-xs text-slate-500 mb-1">Tổng lượt khám</p>
              <p className="text-2xl font-bold text-slate-900">{totalBookings}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
              <p className="text-xs text-slate-500 mb-1">Đã hoàn thành</p>
              <p className="text-2xl font-bold text-emerald-600">{completedBookings}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
              <p className="text-xs text-slate-500 mb-1">Lịch sắp tới</p>
              <p className="text-2xl font-bold text-blue-600">{upcomingBookings}</p>
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Thao tác nhanh</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              to="/booking"
              className="rounded-xl border border-blue-200 bg-blue-50 p-4 hover:bg-blue-100 transition-colors"
            >
              <p className="text-sm font-semibold text-blue-700">Đặt lịch khám</p>
              <p className="text-xs text-blue-600 mt-1">Đặt lịch mới với bác sĩ</p>
            </Link>
            <Link
              to="/health-records"
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 hover:bg-emerald-100 transition-colors"
            >
              <p className="text-sm font-semibold text-emerald-700">Hồ sơ sức khỏe</p>
              <p className="text-xs text-emerald-600 mt-1">Xem lịch sử khám và đơn thuốc</p>
            </Link>
            <Link
              to="/appointments"
              className="rounded-xl border border-amber-200 bg-amber-50 p-4 hover:bg-amber-100 transition-colors"
            >
              <p className="text-sm font-semibold text-amber-700">Lịch khám của tôi</p>
              <p className="text-xs text-amber-600 mt-1">Theo dõi trạng thái lịch hẹn</p>
            </Link>
          </div>
        </section>
      </main>

      <PatientFooter />
    </div>
  );
}
