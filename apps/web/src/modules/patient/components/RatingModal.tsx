import { useState } from 'react';

interface RatingModalProps {
  doctorName: string;
  bookingId: string;
  onSubmit: (stars: number, comment: string) => Promise<void>;
  onClose: () => void;
}

export function RatingModal({ doctorName, onSubmit, onClose }: RatingModalProps) {
  const [stars, setStars] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (stars === 0) { setError('Vui lòng chọn số sao'); return; }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(stars, comment);
      onClose();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setError(e.message ?? 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    /* overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 space-y-4">
        <div className="text-center">
          <p className="text-lg font-bold text-slate-800">Đánh giá bác sĩ</p>
          <p className="text-sm text-slate-500 mt-0.5">{doctorName}</p>
        </div>

        {/* Star selector */}
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setStars(s)}
              className={`text-4xl transition-transform hover:scale-110 ${
                s <= (hovered || stars) ? 'text-amber-400' : 'text-slate-200'
              }`}
            >
              ★
            </button>
          ))}
        </div>
        {stars > 0 && (
          <p className="text-center text-xs text-slate-500">
            {['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Rất tốt'][stars]}
          </p>
        )}

        {/* Comment */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Chia sẻ trải nghiệm của bạn (tuỳ chọn)..."
          rows={3}
          maxLength={500}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none resize-none"
        />

        {error && <p className="text-xs text-red-500 text-center">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Bỏ qua
          </button>
          <button
            type="button"
            disabled={submitting || stars === 0}
            onClick={handleSubmit}
            className="flex-1 rounded-lg bg-primary py-2 text-sm text-white font-semibold
              hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
          </button>
        </div>
      </div>
    </div>
  );
}
