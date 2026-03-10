import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { adminApi } from '../api';
import type { DepartmentDto } from '../types';

function EditRow({ dept, onDone }: { dept: DepartmentDto; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(dept.name);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (n: string) => adminApi.renameDepartment(dept.id, n),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-departments'] });
      onDone();
    },
    onError: (e: Error) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    mutation.mutate(name.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 rounded-lg border border-sky-400 px-3 py-1.5 text-sm
          bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
      <button
        type="submit"
        disabled={mutation.isPending || !name.trim()}
        className="px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-medium
          hover:bg-sky-700 disabled:opacity-50"
      >
        Lưu
      </button>
      <button
        type="button"
        onClick={onDone}
        className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600
          text-slate-600 dark:text-slate-400 text-xs hover:bg-slate-50"
      >
        Hủy
      </button>
    </form>
  );
}

export function DepartmentManagementPage() {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['admin-departments'],
    queryFn: adminApi.getDepartments,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => adminApi.createDepartment(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-departments'] });
      setNewName('');
      setAddError('');
    },
    onError: (e: Error) => setAddError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-departments'] });
      setConfirmDeleteId(null);
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    if (!newName.trim()) return;
    createMutation.mutate(newName.trim());
  };

  const confirmDelete = departments.find((d) => d.id === confirmDeleteId);

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-background-dark">
      {/* Header */}
      <div className="px-6 py-4 bg-white dark:bg-card-dark border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">Quản lý Khoa</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {departments.length} khoa · Dùng để chọn chuyên khoa khi tạo bác sĩ
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-xl mx-auto space-y-4">
          {/* Add form */}
          <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Thêm khoa mới
            </h2>
            <form onSubmit={handleAdd} className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Tên khoa / chuyên khoa"
                className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600
                  bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-sm
                  focus:border-sky-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={createMutation.isPending || !newName.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700
                  text-white text-sm font-medium rounded-lg disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Thêm
              </button>
            </form>
            {addError && <p className="text-xs text-red-500 mt-2">{addError}</p>}
          </div>

          {/* List */}
          <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
                <span className="material-symbols-outlined animate-spin text-sm">
                  progress_activity
                </span>
                Đang tải...
              </div>
            ) : departments.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-2 block">domain</span>
                <p className="text-sm">Chưa có khoa nào</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {departments.map((dept, idx) => (
                  <li
                    key={dept.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  >
                    <span className="text-xs text-slate-400 w-6 text-right flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="material-symbols-outlined text-slate-400 text-sm flex-shrink-0">
                      domain
                    </span>
                    <div className="flex-1 min-w-0">
                      {editingId === dept.id ? (
                        <EditRow dept={dept} onDone={() => setEditingId(null)} />
                      ) : (
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {dept.name}
                        </span>
                      )}
                    </div>
                    {editingId !== dept.id && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => setEditingId(dept.id)}
                          title="Đổi tên"
                          className="p-1.5 rounded text-slate-400 hover:text-slate-600
                            hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(dept.id)}
                          title="Xóa"
                          className="p-1.5 rounded text-slate-400 hover:text-red-500
                            hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Confirm delete dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-card-dark rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Xóa khoa</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Xóa khoa <span className="font-medium">"{confirmDelete.name}"</span>? Bác sĩ đã được
              gán khoa này sẽ không bị ảnh hưởng.
            </p>
            <div className="mt-4 flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600
                  text-slate-600 dark:text-slate-400 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={() => deleteMutation.mutate(confirmDelete.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700
                  font-medium disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
