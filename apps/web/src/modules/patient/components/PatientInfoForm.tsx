import { useForm } from 'react-hook-form';

import type { ClinicService } from '../types';

export interface PatientInfoFormValues {
  fullName: string;
  phone: string;
  nationalId: string;
  dateOfBirth: string;
  gender: string;
  serviceId: string;
  notes: string;
}

interface PatientInfoFormProps {
  services: ClinicService[];
  onSubmit: (values: PatientInfoFormValues) => void;
}

export function PatientInfoForm({ services, onSubmit }: PatientInfoFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientInfoFormValues>();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Full name */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Họ và tên <span className="text-red-500">*</span>
        </label>
        <input
          {...register('fullName', { required: 'Vui lòng nhập họ tên' })}
          placeholder="Nguyễn Văn A"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Số điện thoại <span className="text-red-500">*</span>
        </label>
        <input
          {...register('phone', {
            required: 'Vui lòng nhập số điện thoại',
            pattern: { value: /^(0|\+84)[0-9]{8,10}$/, message: 'SĐT không hợp lệ' },
          })}
          placeholder="0912345678"
          type="tel"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
      </div>

      {/* National ID */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">CCCD / Passport</label>
        <input
          {...register('nationalId')}
          placeholder="012345678901"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      {/* Date of birth + gender row */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">Ngày sinh</label>
          <input
            {...register('dateOfBirth')}
            type="date"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">Giới tính</label>
          <select
            {...register('gender')}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">-- Chọn --</option>
            <option value="Male">Nam</option>
            <option value="Female">Nữ</option>
            <option value="Other">Khác</option>
          </select>
        </div>
      </div>

      {/* Service */}
      {services.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Dịch vụ khám</label>
          <select
            {...register('serviceId')}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">-- Không chọn --</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} (
                {(s.priceCents / 100).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú / Triệu chứng</label>
        <textarea
          {...register('notes')}
          rows={3}
          placeholder="Mô tả triệu chứng, lý do khám..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none resize-none"
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-primary py-2.5 text-white font-semibold hover:bg-primary-dark transition-colors"
      >
        Tiếp tục →
      </button>
    </form>
  );
}
