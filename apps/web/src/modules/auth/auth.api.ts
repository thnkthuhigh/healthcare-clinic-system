import type {
  LoginCredentials,
  LoginResponse,
  AuthUser,
  RegisterCredentials,
  ForgotPasswordChallenge,
  ForgotPasswordVerification,
} from './auth.types';

const API_BASE = 'http://localhost:4000/api/v1/auth';

const DEFAULT_FORGOT_CHALLENGE: ForgotPasswordChallenge = {
  method: 'SMS',
  message: 'OTP da duoc gui.',
};

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Loi dang nhap' }));
      throw new Error(error.message || 'Loi dang nhap');
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
      const error = await response.json().catch(() => ({ message: 'Loi dang ky' }));
      throw new Error(error.message || 'Loi dang ky');
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
      throw new Error('Token khong hop le');
    }

    return response.json();
  },

  sendResetOtp: async (phone: string): Promise<ForgotPasswordChallenge> => {
    const response = await fetch(`${API_BASE}/forgot/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Loi gui OTP' }));
      throw new Error(error.message || 'Loi gui OTP');
    }

    if (response.status === 204) {
      return DEFAULT_FORGOT_CHALLENGE;
    }

    return response
      .json()
      .catch(() => DEFAULT_FORGOT_CHALLENGE) as Promise<ForgotPasswordChallenge>;
  },

  verifyResetOtp: async (phone: string, otp: string): Promise<ForgotPasswordVerification> => {
    const response = await fetch(`${API_BASE}/forgot/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Loi xac minh' }));
      throw new Error(error.message || 'Loi xac minh');
    }

    return response.json();
  },

  resetPassword: async (phone: string, resetToken: string, newPassword: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/forgot/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, resetToken, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Loi reset' }));
      throw new Error(error.message || 'Loi reset');
    }

    if (response.status === 204) return;
    await response.text().catch(() => '');
  },
};
