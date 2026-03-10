// Owner module types

export type AccountRole = 'OWNER' | 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'CASHIER' | 'PATIENT';
export type AccountStatus = 'ACTIVE' | 'LOCKED';

export interface AccountInfo {
  id: string;
  fullName: string | null;
  phone: string;
  role: AccountRole;
  status: AccountStatus;
  specialty: string | null;
  createdAt: string;
}

export interface CreateAccountData {
  fullName: string;
  phone: string;
  password: string;
  role: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'CASHIER';
  specialty?: string;
}

export interface UpdateAccountData {
  fullName?: string;
  specialty?: string;
}
