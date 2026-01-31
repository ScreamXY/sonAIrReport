interface AnalysisProgressProps {
  status: 'idle' | 'analyzing' | 'success' | 'error';
  errorMessage?: string;
}

export function AnalysisProgress({ status, errorMessage }: AnalysisProgressProps) {
  if (status === 'idle') return null;

  return (
    <div
      className={`card relative overflow-hidden p-4 ${
        status === 'analyzing' ? 'border-teal-200 dark:border-teal-500/30' : ''
      } ${status === 'success' ? 'border-success-200 dark:border-success-500/30' : ''} ${
        status === 'error' ? 'border-error-200 dark:border-error-500/30' : ''
      }`}
    >
      {/* Animated progress bar for analyzing state */}
      {status === 'analyzing' && (
        <div className="absolute inset-x-0 top-0 h-1 overflow-hidden">
          <div className="animate-shimmer h-full w-full" />
        </div>
      )}

      <div className="flex items-center gap-4">
        {status === 'analyzing' && (
          <>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-500/20">
              <i className="ri-loader-4-line ri-lg animate-spin text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="font-medium text-[var(--card-foreground)]">Analyzing Screenshot...</p>
              <p className="text-sm text-[var(--foreground-muted)]">AI is extracting quality metrics</p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="bg-success-100 dark:bg-success-500/20 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
              <i className="ri-checkbox-circle-fill ri-lg text-success-600 dark:text-success-400" />
            </div>
            <div>
              <p className="font-medium text-[var(--card-foreground)]">Analysis Complete!</p>
              <p className="text-sm text-[var(--foreground-muted)]">Your report is ready</p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="bg-error-100 dark:bg-error-500/20 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
              <i className="ri-error-warning-fill ri-lg text-error-600 dark:text-error-400" />
            </div>
            <div>
              <p className="font-medium text-[var(--card-foreground)]">Analysis Failed</p>
              <p className="text-error-600 dark:text-error-400 text-sm">
                {errorMessage || 'An error occurred during analysis'}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
