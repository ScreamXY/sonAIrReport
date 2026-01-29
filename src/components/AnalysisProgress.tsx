import { Loader2, Sparkles, CheckCircle, AlertCircle } from 'lucide-react'

interface AnalysisProgressProps {
  status: 'idle' | 'analyzing' | 'success' | 'error'
  errorMessage?: string
}

export function AnalysisProgress({ status, errorMessage }: AnalysisProgressProps) {
  if (status === 'idle') return null

  return (
    <div className={`
      rounded-xl p-4 flex items-center gap-4
      ${status === 'analyzing' ? 'bg-blue-50 border border-blue-100' : ''}
      ${status === 'success' ? 'bg-green-50 border border-green-100' : ''}
      ${status === 'error' ? 'bg-red-50 border border-red-100' : ''}
    `}>
      {status === 'analyzing' && (
        <>
          <div className="relative">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <Sparkles className="w-4 h-4 text-purple-500 absolute -top-1 -right-1" />
          </div>
          <div>
            <p className="font-medium text-blue-800">Analyzing Screenshot...</p>
            <p className="text-sm text-blue-600">
              AI is extracting quality metrics from your screenshot
            </p>
          </div>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-green-800">Analysis Complete!</p>
            <p className="text-sm text-green-600">
              Your report is ready for download
            </p>
          </div>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="font-medium text-red-800">Analysis Failed</p>
            <p className="text-sm text-red-600">
              {errorMessage || 'An error occurred during analysis'}
            </p>
          </div>
        </>
      )}
    </div>
  )
}
