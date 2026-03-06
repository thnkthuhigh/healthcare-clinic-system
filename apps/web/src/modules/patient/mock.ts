export interface MockDoctor {
  id: string;
  name: string;
  specialty: string;
  yearsExp: number;
  initials: string;
  avatarColor: string;
  rating: number;
  reviewCount: number;
}

export interface MockAppointment {
  id: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  shift: string;
  status: 'BOOKED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELED';
}

export interface MockService {
  id: string;
  title: string;
  description: string;
  icon: string;
  bgColor: string;
  iconColor: string;
}

export interface MockHealthRecord {
  id: string;
  date: string;
  doctorName: string;
  diagnosis: string;
  service: string;
}

export const MOCK_DOCTORS: MockDoctor[] = [
  {
    id: '1',
    name: 'BS. Lê Văn Minh',
    specialty: 'Tim mạch',
    yearsExp: 12,
    initials: 'LM',
    avatarColor: 'bg-blue-500',
    rating: 4.9,
    reviewCount: 128,
  },
  {
    id: '2',
    name: 'BS. Trần Thị Hương',
    specialty: 'Nội tổng quát',
    yearsExp: 8,
    initials: 'TH',
    avatarColor: 'bg-teal-500',
    rating: 4.8,
    reviewCount: 96,
  },
  {
    id: '3',
    name: 'BS. Nguyễn Đức Long',
    specialty: 'Nhi khoa',
    yearsExp: 15,
    initials: 'NL',
    avatarColor: 'bg-emerald-500',
    rating: 4.9,
    reviewCount: 210,
  },
  {
    id: '4',
    name: 'BS. Phạm Thị Mai',
    specialty: 'Da liễu',
    yearsExp: 6,
    initials: 'PM',
    avatarColor: 'bg-cyan-500',
    rating: 4.7,
    reviewCount: 74,
  },
];

export const MOCK_APPOINTMENTS: MockAppointment[] = [
  {
    id: '1',
    doctorName: 'BS. Lê Văn Minh',
    specialty: 'Tim mạch',
    date: '2026-03-10',
    time: '08:00',
    shift: 'Buổi sáng',
    status: 'BOOKED',
  },
  {
    id: '2',
    doctorName: 'BS. Trần Thị Hương',
    specialty: 'Nội tổng quát',
    date: '2026-02-20',
    time: '14:00',
    shift: 'Buổi chiều',
    status: 'COMPLETED',
  },
  {
    id: '3',
    doctorName: 'BS. Nguyễn Đức Long',
    specialty: 'Nhi khoa',
    date: '2026-01-15',
    time: '09:00',
    shift: 'Buổi sáng',
    status: 'COMPLETED',
  },
];

export const MOCK_SERVICES: MockService[] = [
  {
    id: '1',
    title: 'Khám tổng quát',
    description: 'Kiểm tra sức khỏe toàn diện',
    icon: 'stethoscope',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    id: '2',
    title: 'Khám tim mạch',
    description: 'Chuyên khoa tim và mạch máu',
    icon: 'favorite',
    bgColor: 'bg-red-50',
    iconColor: 'text-red-500',
  },
  {
    id: '3',
    title: 'Khám nhi',
    description: 'Chăm sóc sức khỏe trẻ em',
    icon: 'child_care',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600',
  },
  {
    id: '4',
    title: 'Xét nghiệm',
    description: 'Xét nghiệm máu và các chỉ số',
    icon: 'science',
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600',
  },
  {
    id: '5',
    title: 'Da liễu',
    description: 'Khám và điều trị bệnh da',
    icon: 'healing',
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-500',
  },
  {
    id: '6',
    title: 'Chẩn đoán hình ảnh',
    description: 'Siêu âm, X-quang',
    icon: 'biotech',
    bgColor: 'bg-teal-50',
    iconColor: 'text-teal-600',
  },
];

export const MOCK_HEALTH_RECORDS: MockHealthRecord[] = [
  {
    id: '1',
    date: '20/02/2026',
    doctorName: 'BS. Trần Thị Hương',
    diagnosis: 'Cảm cúm thông thường',
    service: 'Khám nội tổng quát',
  },
  {
    id: '2',
    date: '15/01/2026',
    doctorName: 'BS. Nguyễn Đức Long',
    diagnosis: 'Viêm họng',
    service: 'Khám nhi',
  },
];
