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

  // Forgot password / OTP
  sendResetOtp: async (phone: string): Promise<{ message: string }> => {
      const response = await fetch(`${API_BASE}/forgot/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Lỗi gửi OTP' }));
        throw new Error(error.message || 'Lỗi gửi OTP');
      }
      return response.json();
    },

  resetPassword: async (phone: string, otp: string, newPassword: string): Promise<{ message: string }> => {
      const response = await fetch(`${API_BASE}/forgot/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, newPassword }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Lỗi reset' }));
        throw new Error(error.message || 'Lỗi reset');
      }
      return response.json();
    },
};
