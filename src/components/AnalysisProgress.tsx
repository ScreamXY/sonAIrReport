import { Loader2, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';

interface AnalysisProgressProps {
  status: 'idle' | 'analyzing' | 'success' | 'error';
  errorMessage?: string;
}

export function AnalysisProgress({ status, errorMessage }: AnalysisProgressProps) {
  if (status === 'idle') return null;

  return (
    <div
      className={`flex items-center gap-4 rounded-xl p-4 ${status === 'analyzing' ? 'border border-blue-100 bg-blue-50' : ''} ${status === 'success' ? 'border border-green-100 bg-green-50' : ''} ${status === 'error' ? 'border border-red-100 bg-red-50' : ''} `}
    >
      {status === 'analyzing' && (
        <>
          <div className="relative">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-purple-500" />
          </div>
          <div>
            <p className="font-medium text-blue-800">Analyzing Screenshot...</p>
            <p className="text-sm text-blue-600">AI is extracting quality metrics from your screenshot</p>
          </div>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-green-800">Analysis Complete!</p>
            <p className="text-sm text-green-600">Your report is ready for download</p>
          </div>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="font-medium text-red-800">Analysis Failed</p>
            <p className="text-sm text-red-600">{errorMessage || 'An error occurred during analysis'}</p>
          </div>
        </>
      )}
    </div>
  );
}
