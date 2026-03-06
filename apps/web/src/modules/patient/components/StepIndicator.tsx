interface StepIndicatorProps {
  current: number; // 1-based
  steps: string[];
}

export function StepIndicator({ current, steps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      {steps.map((label, i) => {
        const step = i + 1;
        const isDone = step < current;
        const isActive = step === current;
        return (
          <div key={step} className="flex-1 flex flex-col items-center gap-1 relative">
            {/* connector line */}
            {i < steps.length - 1 && (
              <span
                className={`absolute top-4 left-1/2 w-full h-0.5 ${isDone ? 'bg-primary' : 'bg-slate-200'}`}
              />
            )}
            <div
              className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                ${isDone ? 'bg-primary text-white' : isActive ? 'bg-primary text-white ring-4 ring-primary/30' : 'bg-slate-200 text-slate-500'}`}
            >
              {isDone ? '✓' : step}
            </div>
            <span
              className={`text-xs text-center leading-tight ${isActive ? 'text-primary font-semibold' : 'text-slate-400'}`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
