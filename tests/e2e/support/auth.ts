import type { APIRequestContext, Page } from '@playwright/test';

const AUTH_API_BASE = 'http://localhost:4000/api/v1/auth';

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

export const ROLE_CREDENTIALS = {
  owner: { phone: '0900000000', password: 'owner123' },
  admin: { phone: '0903456789', password: 'password123' },
  doctor: { phone: '0901234567', password: 'password123' },
} as const satisfies Record<string, LoginCredentials>;

export async function apiLogin(request: APIRequestContext, credentials: LoginCredentials) {
  const response = await request.post(`${AUTH_API_BASE}/login`, {
    data: credentials,
  });

  if (!response.ok()) {
    throw new Error(`Login failed for ${credentials.phone}: ${response.status()} ${await response.text()}`);
  }

  return (await response.json()) as LoginResponse;
}

export async function registerPatient(
  request: APIRequestContext,
  payload: {
    fullName: string;
    phone: string;
    password: string;
  },
) {
  const response = await request.post(`${AUTH_API_BASE}/register`, {
    data: payload,
  });

  if (!response.ok()) {
    throw new Error(`Register failed for ${payload.phone}: ${response.status()} ${await response.text()}`);
  }
}

export async function seedAuthStorage(page: Page, auth: LoginResponse) {
  await page.addInitScript((payload: LoginResponse) => {
    window.localStorage.setItem('clinic_token', payload.token);
    window.localStorage.setItem('clinic_user', JSON.stringify(payload.user));
  }, auth);
}

export async function loginAs(
  page: Page,
  request: APIRequestContext,
  credentials: LoginCredentials,
  path = '/',
) {
  const auth = await apiLogin(request, credentials);
  await seedAuthStorage(page, auth);
  await page.goto(path);
  return auth;
}
