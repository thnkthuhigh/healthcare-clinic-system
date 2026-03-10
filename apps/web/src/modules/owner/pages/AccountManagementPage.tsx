import { useState, useEffect, useCallback } from 'react';

import { ownerApi } from '../api';
import type { AccountInfo, CreateAccountData, AccountRole } from '../types';

const ROLE_LABELS: Record<AccountRole, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  DOCTOR: 'Bác sĩ',
  RECEPTIONIST: 'Lễ tân',
  CASHIER: 'Thu ngân',
  PATIENT: 'Bệnh nhân',
};

const ROLE_COLORS: Record<AccountRole, string> = {
  OWNER: 'bg-amber-100 text-amber-800',
  ADMIN: 'bg-purple-100 text-purple-800',
  DOCTOR: 'bg-blue-100 text-blue-800',
  RECEPTIONIST: 'bg-green-100 text-green-800',
  CASHIER: 'bg-cyan-100 text-cyan-800',
  PATIENT: 'bg-slate-100 text-slate-700',
};

const CREATABLE_ROLES: { value: CreateAccountData['role']; label: string }[] = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'DOCTOR', label: 'Bác sĩ' },
  { value: 'RECEPTIONIST', label: 'Lễ tân' },
  { value: 'CASHIER', label: 'Thu ngân' },
];

export function AccountManagementPage() {
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [resetModal, setResetModal] = useState<{ userId: string; phone: string } | null>(null);
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ownerApi.getAccounts();
      setAccounts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải danh sách');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleToggleLock = async (userId: string) => {
    try {
      const updated = await ownerApi.toggleLock(userId);
      setAccounts((prev) => prev.map((a) => (a.id === userId ? updated : a)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi');
    }
  };

  const handleDelete = async (userId: string, phone: string) => {
    if (!confirm(`Xác nhận xóa tài khoản ${phone}?`)) return;
    try {
      await ownerApi.deleteAccount(userId);
      setAccounts((prev) => prev.filter((a) => a.id !== userId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi');
    }
  };

  const filteredAccounts = accounts.filter((a) => {
    if (filterRole !== 'ALL' && a.role !== filterRole) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (a.fullName?.toLowerCase().includes(q) ?? false) ||
        a.phone.includes(q) ||
        a.role.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quản lý tài khoản</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              {accounts.length} tài khoản trong hệ thống
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
          >
            <span className="material-symbols-outlined text-xl">person_add</span>
            Tạo tài khoản
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
              search
            </span>
            <input
              type="text"
              placeholder="Tìm theo tên, SĐT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="OWNER">Owner</option>
            <option value="ADMIN">Admin</option>
            <option value="DOCTOR">Bác sĩ</option>
            <option value="RECEPTIONIST">Lễ tân</option>
            <option value="CASHIER">Thu ngân</option>
            <option value="PATIENT">Bệnh nhân</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">
                    Họ tên
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">
                    SĐT
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">
                    Vai trò
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">
                    Chuyên khoa
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">
                    Trạng thái
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">
                    Ngày tạo
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Không tìm thấy tài khoản nào
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((account) => (
                    <tr key={account.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                        {account.fullName || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {account.phone}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[account.role]}`}
                        >
                          {ROLE_LABELS[account.role]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {account.specialty || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold ${
                            account.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${account.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`}
                          />
                          {account.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                        {new Date(account.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-4 py-3">
                        {account.role !== 'OWNER' && (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleToggleLock(account.id)}
                              title={account.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-500 hover:text-amber-600"
                            >
                              <span className="material-symbols-outlined text-lg">
                                {account.status === 'ACTIVE' ? 'lock' : 'lock_open'}
                              </span>
                            </button>
                            <button
                              onClick={() =>
                                setResetModal({ userId: account.id, phone: account.phone })
                              }
                              title="Đặt lại mật khẩu"
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-500 hover:text-blue-600"
                            >
                              <span className="material-symbols-outlined text-lg">key</span>
                            </button>
                            <button
                              onClick={() => handleDelete(account.id, account.phone)}
                              title="Xóa"
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-500 hover:text-red-600"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Account Modal */}
      {showCreateModal && (
        <CreateAccountModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(account) => {
            setAccounts((prev) => [...prev, account]);
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Reset Password Modal */}
      {resetModal && (
        <ResetPasswordModal
          userId={resetModal.userId}
          phone={resetModal.phone}
          onClose={() => setResetModal(null)}
        />
      )}
    </div>
  );
}

// ----------- Create Account Modal -----------

function CreateAccountModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (account: AccountInfo) => void;
}) {
  const [form, setForm] = useState<CreateAccountData>({
    fullName: '',
    phone: '',
    password: '',
    role: 'DOCTOR',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const account = await ownerApi.createAccount(form);
      onCreated(account);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tạo tài khoản');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tạo tài khoản mới</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Vai trò
            </label>
            <select
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as CreateAccountData['role'] })
              }
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {CREATABLE_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Họ tên
            </label>
            <input
              type="text"
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Nguyễn Văn A"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Số điện thoại
            </label>
            <input
              type="tel"
              required
              pattern="^0[0-9]{9}$"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="0912345678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Mật khẩu
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Tối thiểu 6 ký tự"
            />
          </div>

          {form.role === 'DOCTOR' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Chuyên khoa
              </label>
              <input
                type="text"
                value={form.specialty || ''}
                onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="VD: Nội khoa, Tim mạch, Da liễu..."
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Đang tạo...' : 'Tạo tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ----------- Reset Password Modal -----------

function ResetPasswordModal({
  userId,
  phone,
  onClose,
}: {
  userId: string;
  phone: string;
  onClose: () => void;
}) {
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await ownerApi.resetPassword(userId, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Đặt lại mật khẩu</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {success ? (
          <div className="p-6 text-center">
            <span className="material-symbols-outlined text-5xl text-green-500 mb-3">
              check_circle
            </span>
            <p className="text-slate-700 dark:text-slate-300 font-medium">
              Đã đặt lại mật khẩu cho <strong>{phone}</strong>
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark transition-colors"
            >
              Đóng
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Đặt mật khẩu mới cho tài khoản <strong>{phone}</strong>
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Mật khẩu mới
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Tối thiểu 6 ký tự"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Đang xử lý...' : 'Đặt lại'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
