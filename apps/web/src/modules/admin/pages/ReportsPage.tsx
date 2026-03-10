import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { adminApi } from '../api';
import type { AuditLogDto } from '../types';

type TabId = 'summary' | 'audit';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function monthStartStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}
function weekAgoStr() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

export function ReportsPage() {
  const [tab, setTab] = useState<TabId>('summary');
  const [fromDate, setFromDate] = useState(monthStartStr());
  const [toDate, setToDate] = useState(todayStr());
  const [auditFrom, setAuditFrom] = useState(weekAgoStr());
  const [auditTo, setAuditTo] = useState(todayStr());
  const [auditEntityType, setAuditEntityType] = useState('');

  // Summary query
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['admin-report-summary', fromDate, toDate],
    queryFn: () => adminApi.getReportSummary(fromDate, toDate),
    staleTime: 60_000,
  });

  // Audit log query
  const { data: auditLogs = [], isLoading: loadingAudit } = useQuery({
    queryKey: ['admin-audit-logs', auditFrom, auditTo, auditEntityType],
    queryFn: () => adminApi.getAuditLogs(auditFrom, auditTo, auditEntityType || undefined),
    staleTime: 30_000,
    enabled: tab === 'audit',
  });

  function formatMoney(cents: number) {
    return new Intl.NumberFormat('vi-VN').format(cents / 100) + ' đ';
  }

  function formatDateTime(dateStr: string | null) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('vi-VN');
  }

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'summary', label: 'Thống kê', icon: 'bar_chart' },
    { id: 'audit', label: 'Audit Log', icon: 'history' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-2xl text-blue-600">monitoring</span>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Báo cáo & Audit</h1>
          <p className="text-xs text-slate-500">Thống kê lượt khám, doanh thu, audit log</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-base">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* === Summary Tab === */}
      {tab === 'summary' && (
        <div className="space-y-4">
          {/* Date range */}
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-xs text-slate-500">Từ</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white"
            />
            <label className="text-xs text-slate-500">Đến</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white"
            />
          </div>

          {loadingSummary && (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-slate-400 mt-2">Đang tải thống kê...</p>
            </div>
          )}

          {summary && !loadingSummary && (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  icon="calendar_today"
                  label="Tổng lượt khám"
                  value={summary.totalBookings}
                  color="blue"
                />
                <StatCard
                  icon="check_circle"
                  label="Hoàn thành"
                  value={summary.completedBookings}
                  color="green"
                />
                <StatCard
                  icon="cancel"
                  label="Đã hủy"
                  value={summary.canceledBookings}
                  color="red"
                />
                <StatCard
                  icon="person_off"
                  label="Không đến"
                  value={summary.noShowBookings}
                  color="slate"
                />
              </div>

              {/* Channel Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">devices</span>
                    Kênh đặt lịch
                  </h3>
                  <div className="space-y-3">
                    <ChannelBar
                      label="Web"
                      value={summary.webBookings}
                      total={summary.totalBookings}
                      color="blue"
                    />
                    <ChannelBar
                      label="Walk-in"
                      value={summary.walkInBookings}
                      total={summary.totalBookings}
                      color="amber"
                    />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">payments</span>
                    Thanh toán
                  </h3>
                  <div className="space-y-3">
                    <ChannelBar
                      label="Đã TT"
                      value={summary.paidBookings}
                      total={summary.totalBookings}
                      color="green"
                    />
                    <ChannelBar
                      label="Chưa TT"
                      value={summary.unpaidBookings}
                      total={summary.totalBookings}
                      color="red"
                    />
                  </div>
                </div>
              </div>

              {/* Revenue */}
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">account_balance</span>
                  Doanh thu
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {formatMoney(summary.totalRevenueCents)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Tổng doanh thu</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-xl font-bold text-blue-600">
                      {formatMoney(summary.serviceRevenueCents)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Dịch vụ khám</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-xl font-bold text-purple-600">
                      {formatMoney(summary.prescriptionRevenueCents)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Thuốc</p>
                  </div>
                </div>
              </div>

              {/* Override Log */}
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-amber-500">
                    warning
                  </span>
                  Override Log
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  Số lần lễ tân nhét slot vượt quá 16 (slot OVERRIDE)
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className={`text-3xl font-bold ${summary.overrideCount > 0 ? 'text-amber-600' : 'text-green-600'}`}
                  >
                    {summary.overrideCount}
                  </div>
                  <span className="text-sm text-slate-500">
                    {summary.overrideCount === 0
                      ? 'Không có ca override trong khoảng thời gian này'
                      : `ca override — cần kiểm soát chất lượng`}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* === Audit Tab === */}
      {tab === 'audit' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-xs text-slate-500">Từ</label>
            <input
              type="date"
              value={auditFrom}
              onChange={(e) => setAuditFrom(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white"
            />
            <label className="text-xs text-slate-500">Đến</label>
            <input
              type="date"
              value={auditTo}
              onChange={(e) => setAuditTo(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white"
            />
            <select
              value={auditEntityType}
              onChange={(e) => setAuditEntityType(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white"
            >
              <option value="">Tất cả loại</option>
              <option value="BOOKING">Booking</option>
              <option value="MEDICATION">Thuốc</option>
              <option value="PRESCRIPTION">Đơn thuốc</option>
              <option value="SHIFT">Ca trực</option>
              <option value="USER">User</option>
              <option value="PATIENT">Bệnh nhân</option>
            </select>
          </div>

          {loadingAudit && (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-slate-400 mt-2">Đang tải audit log...</p>
            </div>
          )}

          {!loadingAudit && auditLogs.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="material-symbols-outlined text-4xl text-slate-300">
                playlist_remove
              </span>
              <p className="text-sm text-slate-400 mt-2">
                Không có audit log trong khoảng thời gian này
              </p>
            </div>
          )}

          {!loadingAudit && auditLogs.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-700/50 text-left">
                      <th className="px-4 py-2 font-medium text-slate-500">Thời gian</th>
                      <th className="px-4 py-2 font-medium text-slate-500">Người thực hiện</th>
                      <th className="px-4 py-2 font-medium text-slate-500">Hành động</th>
                      <th className="px-4 py-2 font-medium text-slate-500">Loại</th>
                      <th className="px-4 py-2 font-medium text-slate-500">ID</th>
                      <th className="px-4 py-2 font-medium text-slate-500">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log: AuditLogDto) => (
                      <tr
                        key={log.id}
                        className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30"
                      >
                        <td className="px-4 py-2 text-slate-500 whitespace-nowrap">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="px-4 py-2 text-slate-700 dark:text-slate-300">
                          {log.actorName || '—'}
                        </td>
                        <td className="px-4 py-2 font-medium text-slate-900 dark:text-white">
                          {log.action}
                        </td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-[10px]">
                            {log.entityType}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-slate-500 font-mono text-[10px]">
                          {log.entityId ? log.entityId.slice(0, 8) + '...' : '—'}
                        </td>
                        <td className="px-4 py-2 text-slate-500 max-w-[200px] truncate">
                          {log.metaJson || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-700/50 text-xs text-slate-500 text-right">
                {auditLogs.length} bản ghi
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Helper Components ──

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    slate: 'bg-slate-50 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <span className="material-symbols-outlined text-base">{icon}</span>
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function ChannelBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const barColor: Record<string, string> = {
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
  };

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-600 dark:text-slate-400">{label}</span>
        <span className="text-slate-900 dark:text-white font-medium">
          {value} ({pct}%)
        </span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor[color]} rounded-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
