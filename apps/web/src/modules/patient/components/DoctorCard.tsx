import type { DoctorSummary } from '../types';

interface DoctorCardProps {
  doctor: DoctorSummary;
  selected: boolean;
  onSelect: () => void;
}

function StarRating({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-xs text-slate-400">Chưa có đánh giá</span>;
  }

  const full = Math.round(value);

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          className={`material-symbols-outlined text-sm ${
            index < full ? 'text-amber-500' : 'text-slate-300'
          }`}
        >
          star
        </span>
      ))}
      <span className="ml-1 text-xs text-slate-500">{value.toFixed(1)} / 5</span>
    </div>
  );
}

function getInitials(name: string) {
  return name
    .replace('BS.', '')
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function DoctorCard({ doctor, selected, onSelect }: DoctorCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      data-testid={`patient-booking-doctor-card-${doctor.id}`}
      className={`w-full overflow-hidden rounded-[28px] border text-left transition-all ${
        selected
          ? 'border-primary bg-primary/5 shadow-soft'
          : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-soft'
      }`}
    >
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 text-lg font-bold text-primary shadow-soft">
            {doctor.avatarUrl ? (
              <img
                src={doctor.avatarUrl}
                alt={doctor.displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              getInitials(doctor.displayName)
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-semibold text-slate-950">{doctor.displayName}</p>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {doctor.specialty ?? 'Đa khoa'}
              </span>
            </div>
            <div className="mt-3">
              <StarRating value={doctor.averageStars} />
            </div>
            <p className="mt-4 text-sm text-slate-500">Chọn bác sĩ để xem các ca khám còn trống.</p>
          </div>
        </div>

        <div
          data-testid={`patient-booking-doctor-state-${doctor.id}`}
          className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full px-3 text-xs font-semibold ${
            selected ? 'bg-primary text-white' : 'border border-slate-200 bg-white text-slate-500'
          }`}
        >
          {selected ? 'Đã chọn' : 'Chọn'}
        </div>
      </div>
    </button>
  );
}
