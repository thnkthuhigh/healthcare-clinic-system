export type UserRole = 'ADMIN' | 'RECEPTIONIST' | 'CASHIER' | 'DOCTOR' | 'PATIENT';

export type AccountStatus = 'ACTIVE' | 'LOCKED';

export type LoginRequest = {
  phone: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  user: {
    id: string;
    phone: string;
    role: UserRole;
  };
};
