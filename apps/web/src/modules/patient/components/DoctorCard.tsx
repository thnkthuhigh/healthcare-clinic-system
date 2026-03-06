import type { DoctorSummary } from '../types';

interface DoctorCardProps {
  doctor: DoctorSummary;
  selected: boolean;
  onSelect: () => void;
}

function StarRating({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-slate-400">Chưa có đánh giá</span>;
  const full = Math.round(value);
  return (
    <span className="flex items-center gap-0.5 text-xs text-amber-400">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i}>{i < full ? '★' : '☆'}</span>
      ))}
      <span className="ml-1 text-slate-500">({value.toFixed(1)})</span>
    </span>
  );
}

export function DoctorCard({ doctor, selected, onSelect }: DoctorCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-xl border-2 p-4 transition-all
        ${selected ? 'border-primary bg-primary/5 shadow-md' : 'border-slate-200 bg-white hover:border-primary/50'}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-xl font-bold text-primary overflow-hidden">
          {doctor.avatarUrl ? (
            <img src={doctor.avatarUrl} alt={doctor.displayName} className="w-full h-full object-cover" />
          ) : (
            doctor.displayName.charAt(0)
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 truncate">{doctor.displayName}</p>
          <p className="text-sm text-slate-500 truncate">{doctor.specialty ?? 'Đa khoa'}</p>
          <StarRating value={doctor.averageStars} />
        </div>
        {selected && (
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs">
            ✓
          </div>
        )}
      </div>
    </button>
  );
}
