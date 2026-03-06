// Auth types shared across the frontend

export interface AuthUser {
  id: string;
  phone: string;
  role: 'OWNER' | 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'CASHIER' | 'PATIENT';
  status: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface RegisterCredentials {
  fullName: string;
  phone: string;
  password: string;
}
