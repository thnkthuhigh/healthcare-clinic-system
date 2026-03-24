import { useEffect } from 'react';
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
  initialValues?: Partial<PatientInfoFormValues> | undefined;
}

export function PatientInfoForm({ services, onSubmit, initialValues }: PatientInfoFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PatientInfoFormValues>({
    defaultValues: {
      fullName: '',
      phone: '',
      nationalId: '',
      dateOfBirth: '',
      gender: '',
      serviceId: '',
      notes: '',
      ...initialValues,
    },
  });

  useEffect(() => {
    if (!initialValues) return;
    reset((currentValues) => ({
      ...currentValues,
      ...initialValues,
    }));
  }, [initialValues, reset]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
      data-testid="patient-booking-patient-form"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="field-label">
            Họ và tên <span className="text-red-500">*</span>
          </label>
          <input
            {...register('fullName', { required: 'Vui lòng nhập họ và tên.' })}
            placeholder="Nguyễn Văn A"
            className="input-field"
            data-testid="patient-booking-full-name"
          />
          {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
        </div>

        <div>
          <label className="field-label">
            Số điện thoại <span className="text-red-500">*</span>
          </label>
          <input
            {...register('phone', {
              required: 'Vui lòng nhập số điện thoại.',
              pattern: {
                value: /^(0|\+84)[0-9]{8,10}$/,
                message: 'Số điện thoại không hợp lệ.',
              },
            })}
            placeholder="0912345678"
            type="tel"
            className="input-field"
            data-testid="patient-booking-phone"
          />
          {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
        </div>

        <div>
          <label className="field-label">CCCD / Hộ chiếu</label>
          <input
            {...register('nationalId')}
            placeholder="012345678901"
            className="input-field"
            data-testid="patient-booking-national-id"
          />
        </div>

        <div>
          <label className="field-label">Ngày sinh</label>
          <input
            {...register('dateOfBirth')}
            type="date"
            className="input-field"
            data-testid="patient-booking-date-of-birth"
          />
        </div>

        <div>
          <label className="field-label">Giới tính</label>
          <select {...register('gender')} className="input-field" data-testid="patient-booking-gender">
            <option value="">Chưa chọn</option>
            <option value="Male">Nam</option>
            <option value="Female">Nữ</option>
            <option value="Other">Khác</option>
          </select>
        </div>

        {services.length > 0 && (
          <div>
            <label className="field-label">Dịch vụ khám</label>
            <select
              {...register('serviceId')}
              className="input-field"
              data-testid="patient-booking-service"
            >
              <option value="">Chọn sau tại quầy</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}{' '}
                  ({
                    (service.priceCents / 100).toLocaleString('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    })
                  })
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <label className="field-label">Triệu chứng hoặc ghi chú</label>
        <textarea
          {...register('notes')}
          rows={4}
          placeholder="Mô tả lý do khám, triệu chứng chính hoặc lưu ý để bác sĩ nắm trước."
          className="input-field resize-none"
          data-testid="patient-booking-notes"
        />
      </div>

      <button type="submit" className="btn-primary w-full" data-testid="patient-booking-submit-info">
        <span className="material-symbols-outlined text-base">arrow_forward</span>
        <span>Tiếp tục xác nhận lịch hẹn</span>
      </button>
    </form>
  );
}
