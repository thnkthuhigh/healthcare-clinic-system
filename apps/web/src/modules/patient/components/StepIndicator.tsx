interface StepIndicatorProps {
  current: number;
  steps: string[];
}

export function StepIndicator({ current, steps }: StepIndicatorProps) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-3 sm:p-4">
      <div className="flex items-start gap-3 overflow-x-auto pb-1">
        {steps.map((label, i) => {
          const step = i + 1;
          const isDone = step < current;
          const isActive = step === current;

          return (
            <div
              key={step}
              className={`min-w-[134px] flex-1 rounded-[20px] border px-3 py-3 transition-colors ${
                isDone
                  ? 'border-primary/20 bg-white'
                  : isActive
                    ? 'border-primary bg-primary/10'
                    : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                    isDone
                      ? 'bg-primary text-white'
                      : isActive
                        ? 'border border-primary bg-white text-primary'
                        : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isDone ? (
                    <span className="material-symbols-outlined text-base">check</span>
                  ) : (
                    step
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Bước {step}
                  </p>
                  <p
                    className={`mt-1 text-sm leading-5 ${
                      isActive
                        ? 'font-semibold text-primary'
                        : isDone
                          ? 'font-medium text-slate-800'
                          : 'text-slate-500'
                    }`}
                  >
                    {label}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
