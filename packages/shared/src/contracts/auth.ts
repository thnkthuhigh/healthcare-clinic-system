export type UserRole = 'OWNER' | 'ADMIN' | 'RECEPTIONIST' | 'CASHIER' | 'DOCTOR' | 'PATIENT';

export type AccountStatus = 'ACTIVE' | 'LOCKED';

export type LoginRequest = {
  phone: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  user: {
    id: string;
    phone: string;
    role: UserRole;
  };
};
