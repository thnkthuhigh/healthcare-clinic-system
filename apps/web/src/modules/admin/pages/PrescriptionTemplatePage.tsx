import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { adminApi } from '../api';
import type {
  AdminMedicationDto,
  AdminPrescriptionTemplateDto,
  SavePrescriptionTemplateItemRequest,
  SavePrescriptionTemplateRequest,
} from '../types';

// ── Template Modal ────────────────────────────────────────────────────────────

interface TemplateModalProps {
  initial?: AdminPrescriptionTemplateDto | undefined;
  medications: AdminMedicationDto[];
  onClose: () => void;
  onSaved: () => void;
}

interface DraftItem {
  medicationId: string;
  medicationName: string;
  unit: string;
  qty: number;
  dosage: string;
  note: string;
}

function TemplateModal({ initial, medications, onClose, onSaved }: TemplateModalProps) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [items, setItems] = useState<DraftItem[]>(() =>
    (initial?.items ?? []).map((it) => ({
      medicationId: it.medicationId,
      medicationName: it.medicationName,
      unit: it.unit,
      qty: it.qty,
      dosage: it.dosage ?? '',
      note: it.note ?? '',
    })),
  );
  const [pickerMedId, setPickerMedId] = useState('');
  const [error, setError] = useState('');

  const activeMeds = medications.filter((m) => m.active);
  const usedIds = new Set(items.map((i) => i.medicationId));
  const pickerOptions = activeMeds.filter((m) => !usedIds.has(m.id));

  const addItem = () => {
    const med = activeMeds.find((m) => m.id === pickerMedId);
    if (!med) return;
    setItems([
      ...items,
      {
        medicationId: med.id,
        medicationName: med.name,
        unit: med.unit,
        qty: 1,
        dosage: med.defaultDose ?? '',
        note: '',
      },
    ]);
    setPickerMedId('');
  };

  const updateItem = (idx: number, patch: Partial<DraftItem>) => {
    setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const createMutation = useMutation({
    mutationFn: (data: SavePrescriptionTemplateRequest) =>
      adminApi.createPrescriptionTemplate(data),
    onSuccess: () => {
      onSaved();
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SavePrescriptionTemplateRequest }) =>
      adminApi.updatePrescriptionTemplate(id, data),
    onSuccess: () => {
      onSaved();
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Tên toa mẫu không được để trống');
      return;
    }
    if (items.length === 0) {
      setError('Vui lòng thêm ít nhất 1 thuốc');
      return;
    }
    for (const it of items) {
      if (it.qty < 1) {
        setError(`Số lượng của ${it.medicationName} phải ≥ 1`);
        return;
      }
    }

    const payload: SavePrescriptionTemplateRequest = {
      name: name.trim(),
      ...(note ? { note } : {}),
      items: items.map(
        (it): SavePrescriptionTemplateItemRequest => ({
          medicationId: it.medicationId,
          qty: it.qty,
          ...(it.dosage ? { dosage: it.dosage } : {}),
          ...(it.note ? { note: it.note } : {}),
        }),
      ),
    };

    if (isEdit) {
      updateMutation.mutate({ id: initial!.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-card-dark rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            {isEdit ? 'Sửa toa mẫu' : 'Tạo toa thuốc mẫu'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-4 space-y-3 overflow-y-auto flex-1">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Tên toa mẫu <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Cảm cúm thông thường"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600
                  bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Ghi chú
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Chỉ định, lưu ý khi dùng..."
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600
                  bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-sm resize-none"
              />
            </div>

            {/* Medication list */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Danh sách thuốc ({items.length})
                </label>
              </div>

              {items.length > 0 && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden mb-2">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium text-slate-500">Thuốc</th>
                        <th className="text-center px-2 py-2 font-medium text-slate-500 w-20">
                          SL
                        </th>
                        <th className="text-left px-2 py-2 font-medium text-slate-500">
                          Liều dùng
                        </th>
                        <th className="w-8" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {items.map((it, idx) => (
                        <tr key={it.medicationId}>
                          <td className="px-3 py-2">
                            <p className="font-medium text-slate-900 dark:text-white">
                              {it.medicationName}
                            </p>
                            <p className="text-slate-400">{it.unit}</p>
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min={1}
                              value={it.qty}
                              onChange={(e) =>
                                updateItem(idx, { qty: parseInt(e.target.value, 10) || 1 })
                              }
                              className="w-full text-center rounded border border-slate-300 dark:border-slate-600
                                bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-1 py-1"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={it.dosage}
                              onChange={(e) => updateItem(idx, { dosage: e.target.value })}
                              placeholder="1 viên/lần x 3..."
                              className="w-full rounded border border-slate-300 dark:border-slate-600
                                bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-2 py-1"
                            />
                          </td>
                          <td className="px-2 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="text-red-400 hover:text-red-600 p-0.5"
                            >
                              <span className="material-symbols-outlined text-sm">
                                remove_circle
                              </span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Medication picker */}
              {pickerOptions.length > 0 && (
                <div className="flex gap-2">
                  <select
                    value={pickerMedId}
                    onChange={(e) => setPickerMedId(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600
                      bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-sm"
                  >
                    <option value="">-- Chọn thuốc để thêm --</option>
                    {pickerOptions.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.unit})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={addItem}
                    disabled={!pickerMedId}
                    className="px-3 py-2 rounded-lg bg-sky-600 text-white text-sm hover:bg-sky-700
                      disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
              )}
              {pickerOptions.length === 0 && items.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">
                  Không có thuốc khả dụng để thêm
                </p>
              )}
            </div>
          </div>
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600
                text-slate-600 dark:text-slate-400 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-sm rounded-lg bg-sky-600 text-white hover:bg-sky-700
                disabled:opacity-50 font-medium"
            >
              {isPending ? 'Đang lưu...' : isEdit ? 'Lưu' : 'Tạo toa mẫu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Confirm Delete Dialog ─────────────────────────────────────────────────────

function ConfirmDelete({
  name,
  onConfirm,
  onCancel,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-card-dark rounded-xl shadow-xl w-full max-w-sm p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Xóa toa mẫu</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Bạn có chắc muốn xóa toa mẫu <span className="font-medium">"{name}"</span>? Hành động này
          không thể hoàn tác.
        </p>
        <div className="mt-4 flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600
              text-slate-600 dark:text-slate-400 hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Template Card ──────────────────────────────────────────────────────────────

interface TemplateCardProps {
  template: AdminPrescriptionTemplateDto;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}

function TemplateCard({ template, onEdit, onToggle, onDelete }: TemplateCardProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className={`bg-white dark:bg-card-dark rounded-xl border overflow-hidden transition-all
        ${
          template.active
            ? 'border-slate-200 dark:border-slate-700'
            : 'border-slate-200 dark:border-slate-700 opacity-60'
        }`}
    >
      <div
        className="flex items-start gap-3 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="material-symbols-outlined text-sky-500 mt-0.5">description</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-slate-900 dark:text-white">{template.name}</p>
            {!template.active && (
              <span className="px-1.5 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-800 text-slate-500">
                Tắt
              </span>
            )}
            <span className="text-xs text-slate-400">{template.itemCount} thuốc</span>
          </div>
          {template.note && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">{template.note}</p>
          )}
        </div>
        <span className="material-symbols-outlined text-slate-400 text-sm flex-shrink-0">
          {expanded ? 'expand_less' : 'expand_more'}
        </span>
      </div>

      {expanded && template.items.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-800 px-4 pb-3">
          <table className="w-full text-xs mt-2">
            <thead>
              <tr>
                <th className="text-left py-1.5 text-slate-500 font-medium">Thuốc</th>
                <th className="text-center py-1.5 text-slate-500 font-medium w-16">SL</th>
                <th className="text-left py-1.5 text-slate-500 font-medium">Liều dùng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {template.items.map((it) => (
                <tr key={it.id}>
                  <td className="py-1.5 text-slate-900 dark:text-white font-medium">
                    {it.medicationName}
                  </td>
                  <td className="py-1.5 text-center text-slate-600 dark:text-slate-400">
                    {it.qty} {it.unit}
                  </td>
                  <td className="py-1.5 text-slate-500">{it.dosage ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-end gap-1 px-4 py-2 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={onToggle}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors
            ${
              template.active
                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800'
            }`}
        >
          {template.active ? 'Đang dùng' : 'Kích hoạt'}
        </button>
        <button
          onClick={onEdit}
          className="p-1.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Sửa"
        >
          <span className="material-symbols-outlined text-sm">edit</span>
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Xóa"
        >
          <span className="material-symbols-outlined text-sm">delete</span>
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function PrescriptionTemplatePage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminPrescriptionTemplateDto | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<AdminPrescriptionTemplateDto | undefined>();
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['admin-prescription-templates'],
    queryFn: adminApi.getPrescriptionTemplates,
  });

  const { data: medications = [] } = useQuery({
    queryKey: ['admin-medications'],
    queryFn: () => adminApi.getMedications(),
  });

  const toggleMutation = useMutation({
    mutationFn: adminApi.togglePrescriptionTemplate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-prescription-templates'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deletePrescriptionTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-prescription-templates'] });
      setDeleteTarget(undefined);
    },
  });

  const handleSaved = () =>
    queryClient.invalidateQueries({ queryKey: ['admin-prescription-templates'] });

  const openEdit = async (t: AdminPrescriptionTemplateDto) => {
    const full = await adminApi.getPrescriptionTemplate(t.id);
    setEditTarget(full);
    setShowModal(true);
  };

  const displayed = templates.filter((t) => {
    if (filterActive === 'active') return t.active;
    if (filterActive === 'inactive') return !t.active;
    return true;
  });

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-background-dark">
      {/* Header */}
      <div className="px-6 py-4 bg-white dark:bg-card-dark border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Toa thuốc mẫu</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {templates.filter((t) => t.active).length}/{templates.length} đang hoạt động
            </p>
          </div>
          <div className="flex-1" />
          <button
            onClick={() => {
              setEditTarget(undefined);
              setShowModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700
              text-white text-sm font-medium rounded-lg"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Tạo toa mẫu
          </button>
        </div>

        <div className="flex gap-1 mt-3">
          {(
            [
              { key: 'all', label: `Tất cả (${templates.length})` },
              { key: 'active', label: `Đang dùng (${templates.filter((t) => t.active).length})` },
              { key: 'inactive', label: `Tắt (${templates.filter((t) => !t.active).length})` },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterActive(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${
                  filterActive === key
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto p-6">
        {templatesLoading ? (
          <div className="flex items-center justify-center h-40 gap-2 text-slate-400">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            Đang tải...
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center text-slate-400">
            <span className="material-symbols-outlined text-5xl mb-2">description</span>
            <p className="text-sm">Chưa có toa thuốc mẫu nào</p>
            <button
              onClick={() => {
                setEditTarget(undefined);
                setShowModal(true);
              }}
              className="mt-3 px-4 py-2 text-sm bg-sky-600 text-white rounded-lg hover:bg-sky-700"
            >
              Tạo toa mẫu đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {displayed.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                onEdit={() => openEdit(t)}
                onToggle={() => toggleMutation.mutate(t.id)}
                onDelete={() => setDeleteTarget(t)}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <TemplateModal
          initial={editTarget}
          medications={medications}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <ConfirmDelete
          name={deleteTarget.name}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(undefined)}
        />
      )}
    </div>
  );
}
