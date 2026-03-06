import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

import { adminApi } from '../api';
import type { ReceptionBooking, ShiftOverview, WalkInRequest } from '../types';

const STATUS_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  BOOKED: { label: 'Đã đặt', color: 'bg-blue-100 text-blue-700', icon: 'event_available' },
  CHECKED_IN: { label: 'Đã check-in', color: 'bg-green-100 text-green-700', icon: 'how_to_reg' },
  WAITING: { label: 'Chờ khám', color: 'bg-amber-100 text-amber-700', icon: 'hourglass_top' },
  IN_CONSULTATION: {
    label: 'Đang khám',
    color: 'bg-purple-100 text-purple-700',
    icon: 'stethoscope',
  },
  PENDING_LAB: { label: 'Chờ XN', color: 'bg-orange-100 text-orange-700', icon: 'science' },
  RESULTS_READY: { label: 'Có KQ XN', color: 'bg-teal-100 text-teal-700', icon: 'lab_research' },
  COMPLETED: {
    label: 'Hoàn thành',
    color: 'bg-emerald-100 text-emerald-700',
    icon: 'check_circle',
  },
  NO_SHOW: { label: 'Vắng mặt', color: 'bg-red-100 text-red-700', icon: 'person_off' },
  CANCELED: { label: 'Đã hủy', color: 'bg-slate-100 text-slate-500', icon: 'cancel' },
};

const POOL_LABELS: Record<string, { label: string; color: string }> = {
  COMMON: { label: 'Bể Chung', color: 'text-blue-600' },
  RESERVE: { label: 'Bể Dự Phòng', color: 'text-amber-600' },
  OVERRIDE: { label: 'Override (vượt quá)', color: 'text-red-600' },
};

type TabType = 'board' | 'checkin' | 'walkin';

export function ReceptionPage() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);

  const [activeTab, setActiveTab] = useState<TabType>('board');
  const [selectedShiftId, setSelectedShiftId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Check-in state
  const [searchPhone, setSearchPhone] = useState('');
  const [searchResults, setSearchResults] = useState<ReceptionBooking[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Walk-in state
  const [walkInForm, setWalkInForm] = useState<WalkInRequest>({
    patientName: '',
    patientPhone: '',
    shiftId: '',
  });
  const [walkInResult, setWalkInResult] = useState<{
    poolUsed: string;
    isOverride: boolean;
    queueNumber: number;
  } | null>(null);

  // Fetch shifts for today
  const { data: shifts = [] } = useQuery({
    queryKey: ['admin', 'shifts', today],
    queryFn: () => adminApi.getTodayShifts(today),
    refetchInterval: 30000,
  });

  // Fetch bookings for board
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['admin', 'reception', 'bookings', today, selectedShiftId],
    queryFn: () => adminApi.getReceptionBookings(today, selectedShiftId || undefined),
    refetchInterval: 10000,
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: (bookingId: string) => adminApi.checkIn(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reception'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'shifts'] });
      setSearchResults([]);
      setSearchPhone('');
    },
  });

  // Walk-in mutation
  const walkInMutation = useMutation({
    mutationFn: (data: WalkInRequest) => adminApi.walkIn(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reception'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'shifts'] });
      setWalkInResult({
        poolUsed: data.poolUsed,
        isOverride: data.isOverride,
        queueNumber: data.queueNumber,
      });
      setWalkInForm({ patientName: '', patientPhone: '', shiftId: '' });
    },
  });

  // No-show mutation
  const noShowMutation = useMutation({
    mutationFn: (bookingId: string) => adminApi.markNoShow(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reception'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'shifts'] });
    },
  });

  // Search handler
  const handleSearch = useCallback(async () => {
    if (!searchPhone.trim()) return;
    setIsSearching(true);
    try {
      const results = await adminApi.searchBookingsByPhone(searchPhone.trim(), today);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchPhone, today]);

  // Auto-set shift for walk-in form
  useEffect(() => {
    if (shifts.length > 0 && !walkInForm.shiftId) {
      const openShift = shifts.find((s: ShiftOverview) => s.status === 'OPEN');
      if (openShift) {
        setWalkInForm((prev) => ({ ...prev, shiftId: openShift.id }));
      }
    }
  }, [shifts, walkInForm.shiftId]);

  // Filter bookings
  const filteredBookings = filterStatus
    ? bookings.filter((b: ReceptionBooking) => b.status === filterStatus)
    : bookings;

  // Count by status
  const statusCounts = bookings.reduce(
    (acc: Record<string, number>, b: ReceptionBooking) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {(
          ['BOOKED', 'CHECKED_IN', 'WAITING', 'IN_CONSULTATION', 'COMPLETED', 'NO_SHOW'] as const
        ).map((status) => {
          const info = STATUS_LABELS[status] ?? {
            label: status,
            color: 'bg-slate-100 text-slate-700',
            icon: 'help',
          };
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(filterStatus === status ? '' : status)}
              className={`rounded-lg border p-3 text-left transition-all ${
                filterStatus === status
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-lg ${info.color.split(' ')[1]}`}>
                  {info.icon}
                </span>
                <span className="text-2xl font-bold text-slate-900">
                  {statusCounts[status] || 0}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{info.label}</p>
            </button>
          );
        })}
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
        {(
          [
            { key: 'board' as TabType, label: 'Bảng theo dõi', icon: 'dashboard' },
            { key: 'checkin' as TabType, label: 'Check-in Web', icon: 'qr_code_scanner' },
            { key: 'walkin' as TabType, label: 'Khách vãng lai', icon: 'person_add' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Board Tab */}
      {activeTab === 'board' && (
        <div className="space-y-4">
          {/* Shift filter */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-slate-700">Lọc theo ca:</label>
            <select
              value={selectedShiftId}
              onChange={(e) => setSelectedShiftId(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Tất cả ca</option>
              {shifts.map((s: ShiftOverview) => (
                <option key={s.id} value={s.id}>
                  {s.doctorName} — {s.type === 'MORNING' ? 'Sáng' : 'Chiều'} ({s.bookedSlots}/
                  {s.totalSlots})
                </option>
              ))}
            </select>
            {filterStatus && (
              <button
                onClick={() => setFilterStatus('')}
                className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
              >
                {STATUS_LABELS[filterStatus]?.label}
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
            <span className="text-sm text-slate-500">({filteredBookings.length} lịch khám)</span>
          </div>

          {/* Booking table */}
          {bookingsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 py-16 text-center">
              <span className="material-symbols-outlined text-5xl text-slate-300">event_busy</span>
              <p className="mt-2 text-sm text-slate-500">Chưa có lịch khám nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-slate-600">STT</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Bệnh nhân</th>
                    <th className="px-4 py-3 font-medium text-slate-600">SĐT</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Bác sĩ</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Ca</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Kênh</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Trạng thái</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBookings.map((b: ReceptionBooking) => {
                    const statusInfo = STATUS_LABELS[b.status] || {
                      label: b.status,
                      color: 'bg-slate-100 text-slate-600',
                      icon: 'help',
                    };
                    return (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          {b.queueNumber ?? '—'}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">{b.patientName}</td>
                        <td className="px-4 py-3 text-slate-600">{b.patientPhone}</td>
                        <td className="px-4 py-3 text-slate-600">{b.doctorName}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              b.shiftType === 'MORNING'
                                ? 'bg-yellow-50 text-yellow-700'
                                : 'bg-indigo-50 text-indigo-700'
                            }`}
                          >
                            {b.shiftType === 'MORNING' ? 'Sáng' : 'Chiều'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium ${
                              b.channel === 'WEB' ? 'text-blue-600' : 'text-amber-600'
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm">
                              {b.channel === 'WEB' ? 'language' : 'directions_walk'}
                            </span>
                            {b.channel === 'WEB' ? 'Web' : 'Vãng lai'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusInfo.color}`}
                          >
                            <span className="material-symbols-outlined text-sm">
                              {statusInfo.icon}
                            </span>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {b.status === 'BOOKED' && (
                              <button
                                onClick={() => checkInMutation.mutate(b.id)}
                                disabled={checkInMutation.isPending}
                                className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                              >
                                Check-in
                              </button>
                            )}
                            {(b.status === 'BOOKED' || b.status === 'CHECKED_IN') && (
                              <button
                                onClick={() => {
                                  if (window.confirm(`Đánh dấu ${b.patientName} là vắng mặt?`)) {
                                    noShowMutation.mutate(b.id);
                                  }
                                }}
                                disabled={noShowMutation.isPending}
                                className="rounded-md bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                              >
                                No-show
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Check-in Tab */}
      {activeTab === 'checkin' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <span className="material-symbols-outlined text-blue-600">qr_code_scanner</span>
              Check-in Khách Đặt Web
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Nhập SĐT để tìm lịch khám đã đặt Web hôm nay → Bấm Check-in
            </p>

            <div className="mt-4 flex gap-3">
              <input
                type="tel"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Nhập số điện thoại (VD: 0901234567)"
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchPhone.trim()}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSearching ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <span className="material-symbols-outlined text-lg">search</span>
                )}
                Tìm kiếm
              </button>
            </div>

            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="mt-4 space-y-3">
                <p className="text-sm font-medium text-slate-700">
                  Tìm thấy {searchResults.length} lịch khám:
                </p>
                {searchResults.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-slate-900">{b.patientName}</p>
                      <p className="text-sm text-slate-500">
                        BS. {b.doctorName} — {b.shiftType === 'MORNING' ? 'Ca sáng' : 'Ca chiều'}
                        {b.serviceName && ` — ${b.serviceName}`}
                      </p>
                    </div>
                    <button
                      onClick={() => checkInMutation.mutate(b.id)}
                      disabled={checkInMutation.isPending}
                      className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-lg">how_to_reg</span>
                      Check-in
                    </button>
                  </div>
                ))}
              </div>
            )}

            {searchResults.length === 0 && searchPhone && !isSearching && (
              <div className="mt-4 rounded-lg border border-dashed border-slate-300 py-8 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-300">
                  search_off
                </span>
                <p className="mt-2 text-sm text-slate-500">
                  Không tìm thấy lịch khám đã đặt Web cho SĐT này
                </p>
              </div>
            )}

            {checkInMutation.isSuccess && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4">
                <span className="material-symbols-outlined text-green-600">check_circle</span>
                <p className="text-sm font-medium text-green-700">Check-in thành công!</p>
              </div>
            )}

            {checkInMutation.isError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4">
                <span className="material-symbols-outlined text-red-600">error</span>
                <p className="text-sm font-medium text-red-700">
                  {checkInMutation.error instanceof Error
                    ? checkInMutation.error.message
                    : 'Check-in thất bại'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Walk-in Tab */}
      {activeTab === 'walkin' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <span className="material-symbols-outlined text-amber-600">person_add</span>
              Tạo Phiếu Khách Vãng Lai
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Nhập thông tin → Hệ thống tự phân bổ slot (Bể Chung → Bể Dự Phòng → Override)
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Tên bệnh nhân <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={walkInForm.patientName}
                  onChange={(e) =>
                    setWalkInForm((prev) => ({ ...prev, patientName: e.target.value }))
                  }
                  placeholder="Nguyễn Văn A"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={walkInForm.patientPhone}
                  onChange={(e) =>
                    setWalkInForm((prev) => ({ ...prev, patientPhone: e.target.value }))
                  }
                  placeholder="09xxxxxxxx"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Chọn ca khám <span className="text-red-500">*</span>
                </label>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {shifts
                    .filter((s: ShiftOverview) => s.status === 'OPEN')
                    .map((s: ShiftOverview) => {
                      const isSelected = walkInForm.shiftId === s.id;
                      const totalAvailable = s.commonAvailable + s.reserveAvailable;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setWalkInForm((prev) => ({ ...prev, shiftId: s.id }))}
                          className={`rounded-lg border-2 p-3 text-left transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <p className="font-medium text-slate-900">BS. {s.doctorName}</p>
                          <p className="text-sm text-slate-500">
                            {s.type === 'MORNING' ? 'Ca sáng' : 'Ca chiều'}
                          </p>
                          <div className="mt-2 flex gap-3 text-xs">
                            <span className="text-blue-600">
                              Chung: {s.commonAvailable}/{12}
                            </span>
                            <span className="text-amber-600">
                              Dự phòng: {s.reserveAvailable}/{4}
                            </span>
                          </div>
                          {totalAvailable === 0 && (
                            <p className="mt-1 text-xs font-medium text-red-600">
                              ⚠ Hết slot — sẽ Override
                            </p>
                          )}
                        </button>
                      );
                    })}
                </div>
                {shifts.filter((s: ShiftOverview) => s.status === 'OPEN').length === 0 && (
                  <p className="mt-2 text-sm text-amber-600">
                    Không có ca khám nào đang mở hôm nay
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => walkInMutation.mutate(walkInForm)}
              disabled={
                walkInMutation.isPending ||
                !walkInForm.patientName.trim() ||
                !walkInForm.patientPhone.trim() ||
                !walkInForm.shiftId
              }
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-6 py-3 font-medium text-white hover:bg-amber-700 disabled:opacity-50 sm:w-auto"
            >
              {walkInMutation.isPending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <span className="material-symbols-outlined">add_circle</span>
              )}
              Tạo phiếu khám
            </button>

            {/* Walk-in result */}
            {walkInResult && (
              <div
                className={`mt-4 rounded-lg border p-4 ${
                  walkInResult.isOverride
                    ? 'border-red-200 bg-red-50'
                    : 'border-green-200 bg-green-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`material-symbols-outlined ${
                      walkInResult.isOverride ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {walkInResult.isOverride ? 'warning' : 'check_circle'}
                  </span>
                  <div>
                    <p
                      className={`font-medium ${
                        walkInResult.isOverride ? 'text-red-700' : 'text-green-700'
                      }`}
                    >
                      Tạo phiếu thành công — STT #{walkInResult.queueNumber}
                    </p>
                    <p className={`text-sm ${POOL_LABELS[walkInResult.poolUsed]?.color || ''}`}>
                      Slot: {POOL_LABELS[walkInResult.poolUsed]?.label || walkInResult.poolUsed}
                      {walkInResult.isOverride && ' — Vượt quá số lượng slot cho phép!'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setWalkInResult(null)}
                  className="mt-2 text-xs text-slate-500 underline hover:text-slate-700"
                >
                  Đóng
                </button>
              </div>
            )}

            {walkInMutation.isError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4">
                <span className="material-symbols-outlined text-red-600">error</span>
                <p className="text-sm font-medium text-red-700">
                  {walkInMutation.error instanceof Error
                    ? walkInMutation.error.message
                    : 'Tạo phiếu thất bại'}
                </p>
              </div>
            )}
          </div>

          {/* Shift slot overview */}
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <span className="material-symbols-outlined text-slate-400">grid_view</span>
              Tổng quan Slot hôm nay
            </h4>
            <div className="mt-3 space-y-2">
              {shifts.map((s: ShiftOverview) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2"
                >
                  <div>
                    <span className="font-medium text-slate-900">BS. {s.doctorName}</span>
                    <span className="ml-2 text-sm text-slate-500">
                      ({s.type === 'MORNING' ? 'Sáng' : 'Chiều'})
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span>
                      Đã đặt: <strong>{s.bookedSlots}</strong>/{s.totalSlots}
                    </span>
                    <span className="text-blue-600">Chung: {s.commonAvailable}</span>
                    <span className="text-amber-600">Dự phòng: {s.reserveAvailable}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 font-medium ${
                        s.status === 'OPEN'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {s.status === 'OPEN' ? 'Mở' : 'Đóng'}
                    </span>
                  </div>
                </div>
              ))}
              {shifts.length === 0 && (
                <p className="py-4 text-center text-sm text-slate-500">
                  Chưa có ca khám nào hôm nay
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
