import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { FlatTaskHeader } from '../../../components/ClinicUI';
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

  const initials = (patientQuery.data?.fullName ?? user?.phone ?? 'BN')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const role = displayLabel(ROLE_LABEL, user?.role);
  const status = displayLabel(STATUS_LABEL, user?.status);
  const totalBookings = bookingsQuery.data?.length ?? 0;
  const completedBookings =
    bookingsQuery.data?.filter((booking) => booking.status === 'COMPLETED').length ?? 0;
  const upcomingBookings =
    bookingsQuery.data?.filter((booking) =>
      ['BOOKED', 'CHECKED_IN', 'WAITING'].includes(booking.status),
    ).length ?? 0;

  if (!user) {
    return (
      <div className="clinic-page">
        <PatientNavbar />

        <main className="clinic-section space-y-6">
          <FlatTaskHeader
            icon="person"
            eyebrow="Tài khoản bệnh nhân"
            title="Đăng nhập để xem hồ sơ cá nhân"
            description="Trang này chỉ dành cho tài khoản đã đăng nhập. Nếu bạn chỉ cần mở lại hồ sơ khám, hãy dùng trang tra cứu bằng số điện thoại."
          />

          <section className="mx-auto max-w-3xl clinic-card p-6 text-center sm:p-8">
            <span className="material-symbols-outlined text-5xl text-slate-300">person_off</span>
            <h2 className="mt-4 text-xl font-semibold text-slate-950">Chưa đăng nhập</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Đăng nhập để xem thông tin tài khoản, hoặc dùng trang tra cứu nếu bạn cần mở lại hồ sơ
              khám bằng số điện thoại.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/login" className="btn-primary">
                Đăng nhập
              </Link>
              <Link to="/health-records" className="btn-secondary">
                Tra cứu hồ sơ
              </Link>
            </div>
          </section>
        </main>

        <PatientFooter />
      </div>
    );
  }

  return (
    <div className="clinic-page" data-testid="patient-profile-page">
      <PatientNavbar />

      <main className="clinic-section space-y-6">
        <FlatTaskHeader
          icon="person"
          eyebrow="Tài khoản bệnh nhân"
          title="Thông tin tài khoản và các chỉ số sử dụng"
          description="Trang này chỉ giữ thông tin tài khoản, trạng thái sử dụng và các lối tắt thực sự cần."
        />

        <section className="mx-auto max-w-5xl space-y-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="clinic-card p-6">
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-700">
                    {initials}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">
                      {patientQuery.data?.fullName ?? user.phone}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">{role}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  {status}
                </span>
              </div>

              <div className="clinic-grid mt-5 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
                    Số điện thoại
                  </p>
                  <p className="mt-2 font-semibold text-slate-800">
                    {patientQuery.data?.phone ?? phone}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
                    CCCD / Hộ chiếu
                  </p>
                  <p className="mt-2 font-semibold text-slate-800">
                    {patientQuery.data?.nationalId ?? 'Chưa cập nhật'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Vai trò</p>
                  <p className="mt-2 font-semibold text-slate-800">{role}</p>
                </div>
              </div>

              {(patientQuery.isLoading || bookingsQuery.isLoading) && (
                <p className="mt-4 text-sm text-slate-500">Đang tải dữ liệu hồ sơ...</p>
              )}
              {(patientQuery.isError || bookingsQuery.isError) && (
                <p className="mt-4 text-sm text-red-600">
                  Không thể tải dữ liệu hồ sơ. Vui lòng thử lại.
                </p>
              )}
            </div>

            <aside className="clinic-card p-5">
              <p className="text-sm font-semibold text-slate-950">Lối tắt</p>
              <div className="mt-4 flex flex-col gap-3">
                <Link to="/appointments" className="btn-secondary w-full justify-between">
                  <span>Lịch hẹn</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </Link>
                <Link to="/health-records" className="btn-secondary w-full justify-between">
                  <span>Hồ sơ sức khỏe</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </Link>
                <Link to="/booking" className="btn-secondary w-full justify-between">
                  <span>Đặt lịch mới</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </Link>
              </div>
            </aside>
          </div>

          <section className="clinic-grid sm:grid-cols-3">
            <div className="clinic-stat-card">
              <p className="text-sm text-slate-500">Tổng lượt khám</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">{totalBookings}</p>
            </div>
            <div className="clinic-stat-card">
              <p className="text-sm text-slate-500">Đã hoàn thành</p>
              <p className="mt-2 text-3xl font-bold text-emerald-600">{completedBookings}</p>
            </div>
            <div className="clinic-stat-card">
              <p className="text-sm text-slate-500">Lịch sắp tới</p>
              <p className="mt-2 text-3xl font-bold text-primary">{upcomingBookings}</p>
            </div>
          </section>
        </section>
      </main>

      <PatientFooter />
    </div>
  );
}
