import type { AccountInfo, CreateAccountData, UpdateAccountData } from './types';

const API_BASE = 'http://localhost:4000/api/owner';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('clinic_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { ...getAuthHeaders(), ...options?.headers },
  });

  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('clinic_token');
    localStorage.removeItem('clinic_user');
    window.location.href = '/login';
    throw new Error('Phiên đăng nhập hết hạn');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Lỗi hệ thống' }));
    throw new Error(error.message || 'Lỗi hệ thống');
  }

  return response.json();
}

export const ownerApi = {
  getAccounts: () => fetchApi<AccountInfo[]>(`${API_BASE}/accounts`),

  getAccount: (userId: string) => fetchApi<AccountInfo>(`${API_BASE}/accounts/${userId}`),

  createAccount: (data: CreateAccountData) =>
    fetchApi<AccountInfo>(`${API_BASE}/accounts`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateAccount: (userId: string, data: UpdateAccountData) =>
    fetchApi<AccountInfo>(`${API_BASE}/accounts/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  toggleLock: (userId: string) =>
    fetchApi<AccountInfo>(`${API_BASE}/accounts/${userId}/toggle-lock`, {
      method: 'PATCH',
    }),

  resetPassword: (userId: string, newPassword: string) =>
    fetchApi<{ message: string }>(`${API_BASE}/accounts/${userId}/reset-password`, {
      method: 'PATCH',
      body: JSON.stringify({ newPassword }),
    }),

  deleteAccount: (userId: string) =>
    fetch(`${API_BASE}/accounts/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }).then((res) => {
      if (!res.ok) throw new Error('Xóa tài khoản thất bại');
    }),
};
