import type { LoginCredentials, LoginResponse, AuthUser, RegisterCredentials } from './auth.types';

const API_BASE = 'http://localhost:4000/api/v1/auth';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Lỗi đăng nhập' }));
      throw new Error(error.message || 'Lỗi đăng nhập');
    }

    return response.json();
  },

  register: async (credentials: RegisterCredentials): Promise<void> => {
    const response = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Lỗi đăng ký' }));
      throw new Error(error.message || 'Lỗi đăng ký');
    }
  },

  me: async (token: string): Promise<AuthUser> => {
    const response = await fetch(`${API_BASE}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Token không hợp lệ');
    }

    return response.json();
  },
};
