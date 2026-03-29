import { useState } from 'react';

interface RatingModalProps {
  doctorName: string;
  bookingId: string;
  onSubmit: (stars: number, comment: string) => Promise<void>;
  onClose: () => void;
}

const RATING_LABELS = [
  '',
  'Rất chưa hài lòng',
  'Chưa hài lòng',
  'Bình thường',
  'Hài lòng',
  'Rất hài lòng',
];

export function RatingModal({ doctorName, onSubmit, onClose }: RatingModalProps) {
  const [stars, setStars] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (stars === 0) {
      setError('Vui lòng chọn số sao.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit(stars, comment);
      onClose();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Có lỗi xảy ra.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="clinic-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="clinic-modal-panel w-full max-w-md rounded-[24px] bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-bold text-slate-900">Đánh giá buổi khám</p>
            <p className="mt-1 text-sm text-slate-500">{doctorName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <div className="mt-6 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onMouseEnter={() => setHovered(rating)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setStars(rating)}
              className="text-4xl text-slate-200 transition-transform hover:scale-110"
            >
              <span
                className={`material-symbols-outlined text-4xl ${
                  rating <= (hovered || stars) ? 'text-amber-400' : 'text-slate-200'
                }`}
              >
                star
              </span>
            </button>
          ))}
        </div>

        <p className="mt-3 text-center text-xs text-slate-500">
          {stars > 0 ? RATING_LABELS[stars] : 'Chọn số sao phù hợp với trải nghiệm của bạn'}
        </p>

        <div className="mt-5">
          <label className="field-label">Nhận xét thêm</label>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Chia sẻ ngắn về trải nghiệm của bạn (không bắt buộc)"
            rows={4}
            maxLength={500}
            className="input-field resize-none"
          />
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Bỏ qua
          </button>
          <button
            type="button"
            disabled={submitting || stars === 0}
            onClick={handleSubmit}
            className="btn-primary flex-1"
          >
            {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
          </button>
        </div>
      </div>
    </div>
  );
}
