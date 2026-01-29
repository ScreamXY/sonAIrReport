import { useState, useCallback } from 'react';
import { QueryClient, QueryClientProvider, useMutation } from '@tanstack/react-query';
import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { ScreenshotUpload } from './components/ScreenshotUpload';
import { CSVUpload } from './components/CSVUpload';
import { AnalysisProgress } from './components/AnalysisProgress';
import { ReportDisplay } from './components/ReportDisplay';
import { analyzeScreenshot } from './utils/openai';
import { getSettings } from './store/settings';
import type { FullReport, AnalysisCost } from './types';
import { AlertCircle, FileText, Camera, CheckCircle2 } from 'lucide-react';

const queryClient = new QueryClient();

function AppContent() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [baselineReport, setBaselineReport] = useState<FullReport | null>(null);
  const [analysisResult, setAnalysisResult] = useState<FullReport | null>(null);
  const [analysisCost, setAnalysisCost] = useState<AnalysisCost | null>(null);
  const [apiKeyError, setApiKeyError] = useState(false);

  const analysisMutation = useMutation({
    mutationFn: async (images: string[]) => {
      const settings = getSettings();
      if (!settings.apiKey) {
        setApiKeyError(true);
        throw new Error('API key not configured');
      }
      setApiKeyError(false);
      return analyzeScreenshot(images, settings.apiKey, baselineReport ?? undefined);
    },
    onSuccess: (data) => {
      setAnalysisResult(data.report);
      setAnalysisCost(data.cost);
    },
  });

  const handleScreenshotUpload = useCallback(
    (images: string[]) => {
      analysisMutation.mutate(images);
    },
    [analysisMutation],
  );

  const handleCSVLoad = useCallback((loadedReport: FullReport) => {
    setBaselineReport(loadedReport);
    setAnalysisResult(null); // Clear previous analysis when new baseline is loaded
  }, []);

  const getStatus = () => {
    if (analysisMutation.isPending) return 'analyzing';
    if (analysisMutation.isSuccess) return 'success';
    if (analysisMutation.isError) return 'error';
    return 'idle';
  };

  // Get the most recent date from baseline for display
  const getBaselineDate = () => {
    if (!baselineReport || baselineReport.analysisReports.length === 0) return null;
    const reports = baselineReport.analysisReports;
    return reports[reports.length - 1].date;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header onSettingsClick={() => setSettingsOpen(true)} />

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Hero Section */}
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-3xl font-bold text-slate-800">Analyze SonarCloud Quality Reports</h2>
          <p className="mx-auto max-w-2xl text-slate-600">
            Load a previous CSV report, then upload a new screenshot to compare and analyze changes.
          </p>
        </div>

        {/* API Key Warning */}
        {apiKeyError && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">API Key Required</p>
              <p className="text-sm text-amber-600">
                Please configure your OpenAI API key in settings to analyze screenshots.
              </p>
            </div>
            <button
              onClick={() => setSettingsOpen(true)}
              className="ml-auto rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
            >
              Open Settings
            </button>
          </div>
        )}

        {/* Workflow Steps */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          {/* Step 1: Load CSV */}
          <div
            className={`rounded-2xl border bg-white p-6 shadow-sm ${baselineReport ? 'border-green-200' : 'border-slate-100'}`}
          >
            <div className="mb-4 flex items-center gap-2">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${baselineReport ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-600'}`}
              >
                {baselineReport ? <CheckCircle2 className="h-4 w-4" /> : '1'}
              </div>
              <FileText className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-slate-800">Load Previous Report (Optional)</h3>
            </div>
            <CSVUpload onLoad={handleCSVLoad} />

            {baselineReport && baselineReport.analysisReports.length > 0 && (
              <div className="mt-4 rounded-lg border border-green-100 bg-green-50 p-3">
                <p className="text-sm text-green-700">
                  <span className="font-medium">Baseline loaded:</span> {baselineReport.analysisReports.length}{' '}
                  report(s), latest from <span className="font-medium">{getBaselineDate()}</span>
                </p>
                <p className="mt-1 text-xs text-green-600">New screenshots will be compared against this data</p>
              </div>
            )}
          </div>

          {/* Step 2: Upload Screenshot */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                2
              </div>
              <Camera className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-slate-800">Upload Current Screenshot</h3>
            </div>
            <ScreenshotUpload onUpload={handleScreenshotUpload} isAnalyzing={analysisMutation.isPending} />
            {baselineReport && (
              <p className="mt-3 text-xs text-slate-500">
                AI will compare with baseline from {getBaselineDate()} and generate change remarks
              </p>
            )}
          </div>
        </div>

        {/* Analysis Progress */}
        <div className="mb-8">
          <AnalysisProgress status={getStatus()} errorMessage={analysisMutation.error?.message} />
        </div>

        {/* Analysis Results - Only show latest analysis and diff */}
        {analysisResult && (
          <ReportDisplay
            report={{
              // Only show the latest analysis (from screenshot)
              analysisReports:
                analysisResult.analysisReports.length > 0
                  ? [analysisResult.analysisReports[analysisResult.analysisReports.length - 1]]
                  : [],
              // Only show the latest diff
              diffReports:
                analysisResult.diffReports.length > 0
                  ? [analysisResult.diffReports[analysisResult.diffReports.length - 1]]
                  : [],
            }}
            fullReport={analysisResult}
            cost={analysisCost}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-slate-500">
          <p>SonAIr Report &mdash; AI-powered SonarCloud analysis</p>
        </div>
      </footer>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
