import { useEffect, useRef } from 'react';

const OTP_LENGTH = 6;

interface OtpCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  testId?: string;
}

export function OtpCodeInput({
  value,
  onChange,
  disabled = false,
  autoFocus = false,
  testId,
}: OtpCodeInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: OTP_LENGTH }, (_, index) => value[index] ?? '');

  useEffect(() => {
    if (autoFocus && !disabled) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus, disabled]);

  const focusInput = (index: number) => {
    queueMicrotask(() => {
      inputRefs.current[index]?.focus();
      inputRefs.current[index]?.select();
    });
  };

  const commitDigits = (nextDigits: string[]) => {
    onChange(nextDigits.join('').replace(/\D/g, '').slice(0, OTP_LENGTH));
  };

  const applyChunk = (startIndex: number, rawValue: string) => {
    const chunk = rawValue.replace(/\D/g, '').slice(0, OTP_LENGTH - startIndex);
    if (!chunk) {
      const nextDigits = [...digits];
      nextDigits[startIndex] = '';
      commitDigits(nextDigits);
      return;
    }

    const nextDigits = [...digits];
    chunk.split('').forEach((digit, offset) => {
      nextDigits[startIndex + offset] = digit;
    });
    commitDigits(nextDigits);

    const nextIndex = Math.min(startIndex + chunk.length, OTP_LENGTH - 1);
    focusInput(nextIndex);
  };

  const handleChange = (index: number, rawValue: string) => {
    const cleaned = rawValue.replace(/\D/g, '');
    if (cleaned.length > 1) {
      applyChunk(index, cleaned);
      return;
    }

    const nextDigits = [...digits];
    nextDigits[index] = cleaned;
    commitDigits(nextDigits);

    if (cleaned && index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      if (digits[index]) {
        const nextDigits = [...digits];
        nextDigits[index] = '';
        commitDigits(nextDigits);
        return;
      }
      if (index > 0) {
        const nextDigits = [...digits];
        nextDigits[index - 1] = '';
        commitDigits(nextDigits);
        focusInput(index - 1);
      }
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      focusInput(index - 1);
      return;
    }

    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      event.preventDefault();
      focusInput(index + 1);
    }
  };

  const handlePaste = (index: number, event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    applyChunk(index, event.clipboardData.getData('text'));
  };

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-3">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            inputRefs.current[index] = node;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          pattern="\d*"
          maxLength={OTP_LENGTH}
          value={digit}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={(event) => handlePaste(index, event)}
          disabled={disabled}
          aria-label={`OTP digit ${index + 1}`}
          data-testid={index === 0 ? testId : testId ? `${testId}-${index}` : undefined}
          className="h-14 w-12 rounded-2xl border border-slate-200 bg-slate-50 text-center text-2xl font-semibold text-slate-900 shadow-sm transition focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60 sm:h-16 sm:w-14"
        />
      ))}
    </div>
  );
}
