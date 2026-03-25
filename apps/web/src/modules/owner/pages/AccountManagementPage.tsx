import { useCallback, useEffect, useState } from 'react';

import { OpsPageHeader } from '../../../components/ClinicUI';
import { formatDateUtc7 } from '../../../lib/time';
import { ownerApi } from '../api';
import type { AccountInfo, AccountRole, CreateAccountData } from '../types';

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
      setError(err instanceof Error ? err.message : 'Lỗi tải danh sách tài khoản');
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
      setAccounts((prev) => prev.map((item) => (item.id === userId ? updated : item)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể đổi trạng thái tài khoản');
    }
  };

  const handleDelete = async (userId: string, phone: string) => {
    if (!confirm(`Xác nhận xóa tài khoản ${phone}?`)) return;
    try {
      await ownerApi.deleteAccount(userId);
      setAccounts((prev) => prev.filter((item) => item.id !== userId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể xóa tài khoản');
    }
  };

  const filteredAccounts = accounts.filter((item) => {
    if (filterRole !== 'ALL' && item.role !== filterRole) return false;
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      (item.fullName?.toLowerCase().includes(query) ?? false) ||
      item.phone.includes(query) ||
      item.role.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#f4f7fa] p-6" data-testid="owner-accounts-page">
      <div className="mx-auto max-w-7xl space-y-6">
        <OpsPageHeader
          eyebrow="Owner"
          title="Quản lý tài khoản hệ thống"
          description={`${accounts.length} tài khoản đang có trong hệ thống.`}
          actions={
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary px-4 py-2.5"
              data-testid="owner-create-account-open"
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              <span>Tạo tài khoản</span>
            </button>
          }
        />

        {error && <div className="surface-alert">{error}</div>}

        <section className="ops-panel">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                search
              </span>
              <input
                type="text"
                placeholder="Tìm theo tên, số điện thoại..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="input-field pl-10"
                data-testid="owner-account-search"
              />
            </div>
            <select
              value={filterRole}
              onChange={(event) => setFilterRole(event.target.value)}
              className="input-field"
              data-testid="owner-account-role-filter"
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
        </section>

        <section className="ops-panel overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="owner-accounts-table">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  <th className="px-4 py-3">Họ tên</th>
                  <th className="px-4 py-3">SĐT</th>
                  <th className="px-4 py-3">Vai trò</th>
                  <th className="px-4 py-3">Chuyên khoa</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Ngày tạo</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                      Không tìm thấy tài khoản phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((account) => (
                    <tr
                      key={account.id}
                      className="transition-colors hover:bg-slate-50"
                      data-testid={`owner-account-row-${account.id}`}
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">{account.fullName || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{account.phone}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${ROLE_COLORS[account.role]}`}
                        >
                          {ROLE_LABELS[account.role]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{account.specialty || '—'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold ${
                            account.status === 'ACTIVE' ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              account.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                          />
                          {account.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {formatDateUtc7(account.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {account.role !== 'OWNER' && (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleToggleLock(account.id)}
                              title={account.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
                              className="rounded-xl p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-amber-600"
                              data-testid={`owner-account-toggle-lock-${account.id}`}
                            >
                              <span className="material-symbols-outlined text-lg">
                                {account.status === 'ACTIVE' ? 'lock' : 'lock_open'}
                              </span>
                            </button>
                            <button
                              onClick={() => setResetModal({ userId: account.id, phone: account.phone })}
                              title="Đặt lại mật khẩu"
                              className="rounded-xl p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600"
                              data-testid={`owner-account-open-reset-${account.id}`}
                            >
                              <span className="material-symbols-outlined text-lg">key</span>
                            </button>
                            <button
                              onClick={() => handleDelete(account.id, account.phone)}
                              title="Xóa"
                              className="rounded-xl p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-red-600"
                              data-testid={`owner-account-delete-${account.id}`}
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
        </section>
      </div>

      {showCreateModal && (
        <CreateAccountModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(account) => {
            setAccounts((prev) => [...prev, account]);
            setShowCreateModal(false);
          }}
        />
      )}

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
      data-testid="owner-create-account-modal"
    >
      <div className="clinic-card w-full max-w-lg p-0">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">Tạo tài khoản mới</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6" data-testid="owner-create-account-form">
          {error && <div className="surface-alert">{error}</div>}

          <div>
            <label className="field-label">Vai trò</label>
            <select
              value={form.role}
              onChange={(event) =>
                setForm({ ...form, role: event.target.value as CreateAccountData['role'] })
              }
              className="input-field"
              data-testid="owner-create-account-role"
            >
              {CREATABLE_ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label">Họ tên</label>
            <input
              type="text"
              required
              value={form.fullName}
              onChange={(event) => setForm({ ...form, fullName: event.target.value })}
              data-testid="owner-create-account-full-name"
              className="input-field"
              placeholder="Nguyễn Văn A"
            />
          </div>

          <div>
            <label className="field-label">Số điện thoại</label>
            <input
              type="tel"
              required
              pattern="^0[0-9]{9}$"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              data-testid="owner-create-account-phone"
              className="input-field"
              placeholder="0912345678"
            />
          </div>

          <div>
            <label className="field-label">Mật khẩu</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              data-testid="owner-create-account-password"
              className="input-field"
              placeholder="Tối thiểu 6 ký tự"
            />
          </div>

          {form.role === 'DOCTOR' && (
            <div>
              <label className="field-label">Chuyên khoa</label>
              <input
                type="text"
                value={form.specialty || ''}
                onChange={(event) => setForm({ ...form, specialty: event.target.value })}
                data-testid="owner-create-account-specialty"
                className="input-field"
                placeholder="Ví dụ: Nội khoa, Tim mạch..."
              />
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              data-testid="owner-create-account-cancel"
              className="btn-secondary flex-1"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              data-testid="owner-create-account-submit"
              className="btn-primary flex-1"
            >
              {submitting ? 'Đang tạo...' : 'Tạo tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await ownerApi.resetPassword(userId, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đặt lại mật khẩu');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
      data-testid="owner-reset-password-modal"
    >
      <div className="clinic-card w-full max-w-md p-0">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">Đặt lại mật khẩu</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {success ? (
          <div className="p-6 text-center">
            <span className="material-symbols-outlined text-5xl text-emerald-500">check_circle</span>
            <p className="mt-3 text-sm font-medium text-slate-700">
              Đã đặt lại mật khẩu cho <strong>{phone}</strong>
            </p>
            <button
              onClick={onClose}
              data-testid="owner-reset-password-close"
              className="btn-primary mt-5 px-6 py-2.5"
            >
              Đóng
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            {error && <div className="surface-alert">{error}</div>}
            <p className="text-sm text-slate-600">
              Đặt mật khẩu mới cho tài khoản <strong>{phone}</strong>
            </p>
            <div>
              <label className="field-label">Mật khẩu mới</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                data-testid="owner-reset-password-input"
                className="input-field"
                placeholder="Tối thiểu 6 ký tự"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                data-testid="owner-reset-password-cancel"
                className="btn-secondary flex-1"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                data-testid="owner-reset-password-submit"
                className="btn-primary flex-1"
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
