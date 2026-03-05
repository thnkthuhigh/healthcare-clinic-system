import type { MockAppointment } from '../mock';

interface WelcomeSectionProps {
  userName: string;
  appointments: MockAppointment[];
}

export function WelcomeSection({ userName, appointments }: WelcomeSectionProps) {
  const upcoming = appointments.filter(
    (a) => a.status === 'BOOKED' || a.status === 'CHECKED_IN',
  ).length;
  const completed = appointments.filter((a) => a.status === 'COMPLETED').length;

  return (
    <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-teal-500 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <p className="text-blue-100 text-sm font-medium mb-1">Chào mừng trở lại 👋</p>
            <h1 className="text-2xl sm:text-3xl font-bold">{userName}</h1>
            <p className="text-blue-100 mt-2 text-sm">Chúc bạn và gia đình luôn khỏe mạnh!</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 text-center min-w-[100px]">
              <p className="text-3xl font-bold">{upcoming}</p>
              <p className="text-xs text-blue-100 mt-1">Lịch sắp tới</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 text-center min-w-[100px]">
              <p className="text-3xl font-bold">{completed}</p>
              <p className="text-xs text-blue-100 mt-1">Đã hoàn thành</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
