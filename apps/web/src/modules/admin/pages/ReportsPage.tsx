import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { addDaysToIsoDate, formatDateTimeUtc7, startOfMonthIsoUtc7, toIsoDateUtc7 } from '../../../lib/time';
import { adminApi } from '../api';
import type {
  AuditLogDto,
  DailyInvoiceDto,
  DoctorVisitStatsDto,
  FinanceLedgerEntryDto,
  ManualFinanceEntryRequest,
} from '../types';

type TabId = 'summary' | 'finance' | 'audit';
type ManualFlowType = 'THU' | 'CHI' | 'NHAP' | 'XUAT';

function todayStr() {
  return toIsoDateUtc7();
}

function monthStartStr() {
  return startOfMonthIsoUtc7();
}

function weekAgoStr() {
  return addDaysToIsoDate(toIsoDateUtc7(), -7);
}

function formatMoney(cents: number) {
  return `${new Intl.NumberFormat('vi-VN').format(cents)} d`;
}

function formatDateTime(value: string | null) {
  if (!value) return '-';
  return formatDateTimeUtc7(value);
}

function entryTypeLabel(value: string) {
  if (value === 'INCOME') return 'Thu';
  if (value === 'EXPENSE') return 'Chi';
  return value;
}

function financeFlowLabel(row: FinanceLedgerEntryDto) {
  const category = row.category?.toUpperCase() ?? '';
  if (category.endsWith('_PURCHASE')) return 'Nhap';
  if (category === 'MEDICATION_SALE' || category === 'MANUAL_STOCK_OUT') return 'Xuat';
  if (category === 'MANUAL_STOCK_IN') return 'Nhap';
  if (category === 'MANUAL_EXPENSE') return 'Chi';
  if (category === 'MANUAL_INCOME') return 'Thu';
  if (row.entryType === 'INCOME') return 'Thu';
  if (row.entryType === 'EXPENSE') return 'Chi';
  return '-';
}

function parseMeta(metaJson: string | null): Record<string, unknown> | null {
  if (!metaJson) return null;
  try {
    const parsed = JSON.parse(metaJson) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

const FINANCE_CATEGORIES = [
  'MEDICATION_SALE',
  'MEDICATION_PURCHASE',
  'SUPPLY_PURCHASE',
  'ASSET_PURCHASE',
  'CONSULTATION_FEE',
  'LAB_FEE',
  'OVERRIDE',
  'MANUAL_EXPENSE',
  'MANUAL_INCOME',
  'MANUAL_STOCK_IN',
  'MANUAL_STOCK_OUT',
] as const;

const AUDIT_ACTIONS = [
  'OVERRIDE_SLOT',
  'STOCK_EDIT',
  'CANCEL_BOOKING',
  'RESET_PASSWORD',
  'LOCK_ACCOUNT',
  'UNLOCK_ACCOUNT',
  'REMOVE_PRESCRIPTION_ITEM',
  'MANUAL_FINANCE_ENTRY',
] as const;

export function ReportsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<TabId>('summary');

  const [summaryFrom, setSummaryFrom] = useState(monthStartStr());
  const [summaryTo, setSummaryTo] = useState(todayStr());

  const [dailyInvoiceDate, setDailyInvoiceDate] = useState(todayStr());
  const [visitFrom, setVisitFrom] = useState(monthStartStr());
  const [visitTo, setVisitTo] = useState(todayStr());

  const [financeFrom, setFinanceFrom] = useState(monthStartStr());
  const [financeTo, setFinanceTo] = useState(todayStr());
  const [financeType, setFinanceType] = useState('');
  const [financeCategory, setFinanceCategory] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualFlowType, setManualFlowType] = useState<ManualFlowType>('CHI');
  const [manualEntryDate, setManualEntryDate] = useState(todayStr());
  const [manualDescription, setManualDescription] = useState('');
  const [manualQty, setManualQty] = useState('');
  const [manualUnit, setManualUnit] = useState('');
  const [manualAmount, setManualAmount] = useState('');

  const [auditFrom, setAuditFrom] = useState(weekAgoStr());
  const [auditTo, setAuditTo] = useState(todayStr());
  const [auditEntityType, setAuditEntityType] = useState('');
  const [auditAction, setAuditAction] = useState('');

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['admin-report-summary', summaryFrom, summaryTo],
    queryFn: () => adminApi.getReportSummary(summaryFrom, summaryTo),
    staleTime: 60_000,
    enabled: tab === 'summary',
  });

  const { data: dailyInvoices = [], isLoading: loadingDailyInvoices } = useQuery({
    queryKey: ['admin-daily-invoices', dailyInvoiceDate],
    queryFn: () => adminApi.getDailyInvoices(dailyInvoiceDate),
    staleTime: 30_000,
    enabled: tab === 'summary',
  });

  const { data: doctorVisitRows = [], isLoading: loadingDoctorVisits } = useQuery({
    queryKey: ['admin-visits-by-doctor', visitFrom, visitTo],
    queryFn: () => adminApi.getVisitsByDoctor(visitFrom, visitTo),
    staleTime: 30_000,
    enabled: tab === 'summary',
  });

  const { data: financeRows = [], isLoading: loadingFinanceRows } = useQuery({
    queryKey: ['admin-report-finance', financeFrom, financeTo, financeType, financeCategory],
    queryFn: () =>
      adminApi.getFinanceLedger(
        financeFrom,
        financeTo,
        financeCategory || undefined,
        financeType || undefined,
      ),
    staleTime: 30_000,
    enabled: tab === 'finance',
  });

  const { data: financeSummary, isLoading: loadingFinanceSummary } = useQuery({
    queryKey: ['admin-report-finance-summary', financeFrom, financeTo],
    queryFn: () => adminApi.getFinanceSummary(financeFrom, financeTo),
    staleTime: 30_000,
    enabled: tab === 'finance',
  });

  const manualFinanceMutation = useMutation({
    mutationFn: () => {
      const amountCents = Number.parseInt(manualAmount, 10);
      if (Number.isNaN(amountCents) || amountCents <= 0) {
        throw new Error('So tien phai > 0');
      }

      const payload: ManualFinanceEntryRequest = {
        entryDate: manualEntryDate,
        flowType: manualFlowType,
        description: manualDescription.trim(),
        amountCents,
        ...(manualQty.trim() ? { qty: Number(manualQty) } : {}),
        ...(manualUnit.trim() ? { unit: manualUnit.trim() } : {}),
      };

      if (!payload.description) {
        throw new Error('Noi dung phieu la bat buoc');
      }

      return adminApi.createManualFinanceEntry(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-report-finance'] });
      queryClient.invalidateQueries({ queryKey: ['admin-report-finance-summary'] });
      setManualDescription('');
      setManualQty('');
      setManualUnit('');
      setManualAmount('');
      setManualFlowType('CHI');
      setManualEntryDate(todayStr());
      setShowManualForm(false);
    },
  });

  const { data: auditLogs = [], isLoading: loadingAudit } = useQuery({
    queryKey: ['admin-audit-logs', auditFrom, auditTo, auditEntityType, auditAction],
    queryFn: () =>
      adminApi.getAuditLogs(
        auditFrom,
        auditTo,
        auditEntityType || undefined,
        auditAction || undefined,
      ),
    staleTime: 30_000,
    enabled: tab === 'audit',
  });

  const doctorVisitTotal = useMemo(
    () => doctorVisitRows.reduce((sum, row) => sum + row.totalVisits, 0),
    [doctorVisitRows],
  );

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'summary', label: 'Thong ke', icon: 'bar_chart' },
    { id: 'finance', label: 'Thu Chi', icon: 'account_balance_wallet' },
    { id: 'audit', label: 'Audit Log', icon: 'history' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-2xl text-blue-600">monitoring</span>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Bao cao admin</h1>
          <p className="text-xs text-slate-500">
            Tong hop thong ke, hoa don, luot kham, thu chi va audit log
          </p>
        </div>
      </div>

      <div className="flex w-fit gap-1 rounded-lg bg-slate-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-base">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'summary' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs text-slate-500">Tu ngay</label>
            <input
              type="date"
              value={summaryFrom}
              onChange={(e) => setSummaryFrom(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
            <label className="text-xs text-slate-500">Den ngay</label>
            <input
              type="date"
              value={summaryTo}
              onChange={(e) => setSummaryTo(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
          </div>

          {loadingSummary && (
            <div className="py-8 text-center text-sm text-slate-500">Dang tai thong ke...</div>
          )}

          {summary && !loadingSummary && (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <SummaryCard
                  label="Tong luot kham"
                  value={summary.totalBookings}
                  icon="calendar_today"
                />
                <SummaryCard
                  label="Hoan thanh"
                  value={summary.completedBookings}
                  icon="check_circle"
                />
                <SummaryCard label="Da huy" value={summary.canceledBookings} icon="cancel" />
                <SummaryCard label="Vang mat" value={summary.noShowBookings} icon="person_off" />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <h3 className="text-sm font-semibold text-slate-900">Kenh dat lich</h3>
                  <div className="mt-2 space-y-2 text-sm text-slate-600">
                    <div className="flex justify-between">
                      <span>Web</span>
                      <strong>{summary.webBookings}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Vang lai</span>
                      <strong>{summary.walkInBookings}</strong>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <h3 className="text-sm font-semibold text-slate-900">Thanh toan</h3>
                  <div className="mt-2 space-y-2 text-sm text-slate-600">
                    <div className="flex justify-between">
                      <span>Da thanh toan</span>
                      <strong>{summary.paidBookings}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Chua thanh toan</span>
                      <strong>{summary.unpaidBookings}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <MoneyCard label="Tong doanh thu" amount={summary.totalRevenueCents} tone="green" />
                <MoneyCard
                  label="Doanh thu dich vu"
                  amount={summary.serviceRevenueCents}
                  tone="blue"
                />
                <MoneyCard
                  label="Doanh thu thuoc"
                  amount={summary.prescriptionRevenueCents}
                  tone="purple"
                />
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
                So lan override slot trong ky: <strong>{summary.overrideCount}</strong>
              </div>
            </>
          )}

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">Hoa don ngay</h3>
              <input
                type="date"
                value={dailyInvoiceDate}
                onChange={(e) => setDailyInvoiceDate(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2 text-left">Thoi gian</th>
                    <th className="px-3 py-2 text-left">Benh nhan</th>
                    <th className="px-3 py-2 text-left">Bac si</th>
                    <th className="px-3 py-2 text-left">Dich vu</th>
                    <th className="px-3 py-2 text-right">Tien dich vu</th>
                    <th className="px-3 py-2 text-right">Tien thuoc</th>
                    <th className="px-3 py-2 text-right">Tong</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingDailyInvoices && (
                    <tr>
                      <td colSpan={7} className="px-3 py-10 text-center text-slate-500">
                        Dang tai hoa don...
                      </td>
                    </tr>
                  )}
                  {!loadingDailyInvoices && dailyInvoices.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-10 text-center text-slate-500">
                        Khong co hoa don nao
                      </td>
                    </tr>
                  )}
                  {!loadingDailyInvoices &&
                    dailyInvoices.map((invoice) => (
                      <DailyInvoiceRow key={invoice.bookingId} row={invoice} />
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">Luot kham theo bac si</h3>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={visitFrom}
                  onChange={(e) => setVisitFrom(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                />
                <input
                  type="date"
                  value={visitTo}
                  onChange={(e) => setVisitTo(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                />
              </div>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2 text-left">Bac si</th>
                    <th className="px-3 py-2 text-left">Chuyen mon</th>
                    <th className="px-3 py-2 text-right">Sang</th>
                    <th className="px-3 py-2 text-right">Chieu</th>
                    <th className="px-3 py-2 text-right">Tong</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingDoctorVisits && (
                    <tr>
                      <td colSpan={5} className="px-3 py-10 text-center text-slate-500">
                        Dang tai luot kham...
                      </td>
                    </tr>
                  )}
                  {!loadingDoctorVisits && doctorVisitRows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-10 text-center text-slate-500">
                        Khong co du lieu luot kham
                      </td>
                    </tr>
                  )}
                  {!loadingDoctorVisits &&
                    doctorVisitRows.map((row) => <DoctorVisitRow key={row.doctorId} row={row} />)}
                </tbody>
                {!loadingDoctorVisits && doctorVisitRows.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700">
                      <td colSpan={4} className="px-3 py-2 text-right">
                        Tong luot
                      </td>
                      <td className="px-3 py-2 text-right">{doctorVisitTotal}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'finance' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs text-slate-500">Tu ngay</label>
              <input
                type="date"
                value={financeFrom}
                onChange={(e) => setFinanceFrom(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
              <label className="text-xs text-slate-500">Den ngay</label>
              <input
                type="date"
                value={financeTo}
                onChange={(e) => setFinanceTo(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              />
              <select
                value={financeType}
                onChange={(e) => setFinanceType(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              >
                <option value="">Tat ca loai</option>
                <option value="INCOME">INCOME</option>
                <option value="EXPENSE">EXPENSE</option>
              </select>
              <select
                value={financeCategory}
                onChange={(e) => setFinanceCategory(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              >
                <option value="">Tat ca danh muc</option>
                {FINANCE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => navigate('/admin/cashier?tab=retail')}
                className="rounded-lg border border-blue-300 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
              >
                Tao hoa don ban le
              </button>
              <button
                onClick={() => setShowManualForm((prev) => !prev)}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                {showManualForm ? 'Dong phieu thu chi' : 'Tao phieu thu/chi'}
              </button>
            </div>
          </div>

          {showManualForm && (
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Phieu thu / chi / nhap / xuat
              </h3>
              <div className="mt-3 grid gap-3 md:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs text-slate-600">Loai phieu</label>
                  <select
                    value={manualFlowType}
                    onChange={(e) => setManualFlowType(e.target.value as ManualFlowType)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="CHI">Chi</option>
                    <option value="THU">Thu</option>
                    <option value="NHAP">Nhap kho</option>
                    <option value="XUAT">Xuat kho</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-600">Ngay</label>
                  <input
                    type="date"
                    value={manualEntryDate}
                    onChange={(e) => setManualEntryDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-600">So luong (optional)</label>
                  <input
                    value={manualQty}
                    onChange={(e) => setManualQty(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Vi du: 5"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-600">Don vi (optional)</label>
                  <input
                    value={manualUnit}
                    onChange={(e) => setManualUnit(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="hop/chai/thung"
                  />
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-[1fr_220px]">
                <div>
                  <label className="mb-1 block text-xs text-slate-600">Noi dung</label>
                  <textarea
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                    className="h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Chi gi? Thu tu dau? Nhap/xuat mat hang nao?..."
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-600">So tien (cents)</label>
                  <input
                    type="number"
                    min={1}
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="200000"
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => manualFinanceMutation.mutate()}
                  disabled={manualFinanceMutation.isPending}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {manualFinanceMutation.isPending ? 'Dang luu...' : 'Luu phieu'}
                </button>
                <button
                  onClick={() => setShowManualForm(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Huy
                </button>
              </div>

              {manualFinanceMutation.isError && (
                <p className="mt-2 text-sm text-red-600">
                  {manualFinanceMutation.error instanceof Error
                    ? manualFinanceMutation.error.message
                    : 'Tao phieu that bai'}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <MoneyCard
              label="Tong thu"
              amount={financeSummary?.totalIncomeCents ?? 0}
              tone="green"
              loading={loadingFinanceSummary}
            />
            <MoneyCard
              label="Tong chi"
              amount={financeSummary?.totalExpenseCents ?? 0}
              tone="red"
              loading={loadingFinanceSummary}
            />
            <MoneyCard
              label="Chenh lech"
              amount={financeSummary?.balanceCents ?? 0}
              tone={(financeSummary?.balanceCents ?? 0) >= 0 ? 'blue' : 'red'}
              loading={loadingFinanceSummary}
            />
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2 text-left">Ngay</th>
                    <th className="px-3 py-2 text-left">Nhap/Xuat</th>
                    <th className="px-3 py-2 text-left">Loai</th>
                    <th className="px-3 py-2 text-left">Danh muc</th>
                    <th className="px-3 py-2 text-left">Mo ta</th>
                    <th className="px-3 py-2 text-right">So luong</th>
                    <th className="px-3 py-2 text-left">Don vi</th>
                    <th className="px-3 py-2 text-right">So tien</th>
                    <th className="px-3 py-2 text-left">Nguoi thuc hien</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingFinanceRows && (
                    <tr>
                      <td colSpan={9} className="px-3 py-10 text-center text-slate-500">
                        Dang tai du lieu thu chi...
                      </td>
                    </tr>
                  )}
                  {!loadingFinanceRows && financeRows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-3 py-10 text-center text-slate-500">
                        Khong co but toan nao trong khoang nay
                      </td>
                    </tr>
                  )}
                  {!loadingFinanceRows &&
                    financeRows.map((row) => <FinanceRow key={row.id} row={row} />)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs text-slate-500">Tu ngay</label>
            <input
              type="date"
              value={auditFrom}
              onChange={(e) => setAuditFrom(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
            <label className="text-xs text-slate-500">Den ngay</label>
            <input
              type="date"
              value={auditTo}
              onChange={(e) => setAuditTo(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            />
            <select
              value={auditEntityType}
              onChange={(e) => setAuditEntityType(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            >
              <option value="">Tat ca entity</option>
              <option value="BOOKING">BOOKING</option>
              <option value="MEDICATION">MEDICATION</option>
              <option value="SUPPLY">SUPPLY</option>
              <option value="PRESCRIPTION">PRESCRIPTION</option>
              <option value="SHIFT">SHIFT</option>
              <option value="USER">USER</option>
              <option value="PATIENT">PATIENT</option>
              <option value="FINANCE_LEDGER">FINANCE_LEDGER</option>
            </select>
            <select
              value={auditAction}
              onChange={(e) => setAuditAction(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            >
              <option value="">Tat ca action</option>
              {AUDIT_ACTIONS.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500">
                    <th className="px-3 py-2 text-left">Thoi gian</th>
                    <th className="px-3 py-2 text-left">Nguoi</th>
                    <th className="px-3 py-2 text-left">Action</th>
                    <th className="px-3 py-2 text-left">Entity</th>
                    <th className="px-3 py-2 text-left">Chi tiet</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingAudit && (
                    <tr>
                      <td colSpan={5} className="px-3 py-10 text-center text-slate-500">
                        Dang tai audit log...
                      </td>
                    </tr>
                  )}
                  {!loadingAudit && auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-10 text-center text-slate-500">
                        Khong co audit log
                      </td>
                    </tr>
                  )}
                  {!loadingAudit && auditLogs.map((log) => <AuditRow key={log.id} log={log} />)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="material-symbols-outlined text-blue-600">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function MoneyCard({
  label,
  amount,
  tone,
  loading,
}: {
  label: string;
  amount: number;
  tone: 'green' | 'red' | 'blue' | 'purple';
  loading?: boolean;
}) {
  const toneMap: Record<string, string> = {
    green: 'text-green-600 bg-green-50',
    red: 'text-red-600 bg-red-50',
    blue: 'text-blue-600 bg-blue-50',
    purple: 'text-purple-600 bg-purple-50',
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <div className={`mt-2 rounded-lg px-3 py-2 ${toneMap[tone]}`}>
        <p className="text-lg font-bold">{loading ? '...' : formatMoney(amount)}</p>
      </div>
    </div>
  );
}

function DailyInvoiceRow({ row }: { row: DailyInvoiceDto }) {
  return (
    <tr className="border-t border-slate-100 hover:bg-slate-50">
      <td className="px-3 py-2 text-slate-600">{formatDateTime(row.invoiceAt)}</td>
      <td className="px-3 py-2 text-slate-700">
        <div className="font-medium">{row.patientName}</div>
        <div className="text-xs text-slate-500">{row.patientPhone}</div>
      </td>
      <td className="px-3 py-2 text-slate-700">{row.doctorName}</td>
      <td className="px-3 py-2 text-slate-700">{row.serviceName ?? '-'}</td>
      <td className="px-3 py-2 text-right font-medium text-slate-700">
        {formatMoney(row.serviceAmountCents)}
      </td>
      <td className="px-3 py-2 text-right font-medium text-slate-700">
        {formatMoney(row.medicationAmountCents)}
      </td>
      <td className="px-3 py-2 text-right font-semibold text-slate-900">
        {formatMoney(row.totalAmountCents)}
      </td>
    </tr>
  );
}

function DoctorVisitRow({ row }: { row: DoctorVisitStatsDto }) {
  return (
    <tr className="border-t border-slate-100 hover:bg-slate-50">
      <td className="px-3 py-2 font-medium text-slate-800">{row.doctorName}</td>
      <td className="px-3 py-2 text-slate-600">{row.specialty ?? '-'}</td>
      <td className="px-3 py-2 text-right text-slate-700">{row.morningVisits}</td>
      <td className="px-3 py-2 text-right text-slate-700">{row.afternoonVisits}</td>
      <td className="px-3 py-2 text-right font-semibold text-slate-900">{row.totalVisits}</td>
    </tr>
  );
}

function FinanceRow({ row }: { row: FinanceLedgerEntryDto }) {
  const typeClass =
    row.entryType === 'INCOME'
      ? 'bg-green-100 text-green-700'
      : row.entryType === 'EXPENSE'
        ? 'bg-red-100 text-red-700'
        : 'bg-slate-100 text-slate-700';

  return (
    <tr className="border-t border-slate-100 hover:bg-slate-50">
      <td className="px-3 py-2 text-slate-600">{row.entryDate}</td>
      <td className="px-3 py-2 text-slate-700">{financeFlowLabel(row)}</td>
      <td className="px-3 py-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeClass}`}>
          {entryTypeLabel(row.entryType)}
        </span>
      </td>
      <td className="px-3 py-2 text-slate-700">{row.category}</td>
      <td className="px-3 py-2 text-slate-700">{row.description}</td>
      <td className="px-3 py-2 text-right text-slate-600">{row.qty ?? '-'}</td>
      <td className="px-3 py-2 text-slate-600">{row.unit ?? '-'}</td>
      <td className="px-3 py-2 text-right font-semibold text-slate-900">
        {formatMoney(row.amountCents)}
      </td>
      <td className="px-3 py-2 text-slate-600">{row.actorName ?? '-'}</td>
    </tr>
  );
}

function AuditRow({ log }: { log: AuditLogDto }) {
  const meta = parseMeta(log.metaJson);

  return (
    <tr className="border-t border-slate-100 align-top hover:bg-slate-50">
      <td className="px-3 py-2 text-slate-500">{formatDateTime(log.createdAt)}</td>
      <td className="px-3 py-2 text-slate-700">{log.actorName ?? '-'}</td>
      <td className="px-3 py-2 font-medium text-slate-900">{log.action}</td>
      <td className="px-3 py-2 text-slate-700">
        <div>{log.entityType}</div>
        <div className="font-mono text-[10px] text-slate-400">{log.entityId ?? '-'}</div>
      </td>
      <td className="px-3 py-2 text-slate-600">
        {!meta ? (
          <span>{log.metaJson ?? '-'}</span>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(meta).map(([key, value]) => (
              <span key={key} className="rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-700">
                {key}: {String(value)}
              </span>
            ))}
          </div>
        )}
      </td>
    </tr>
  );
}
