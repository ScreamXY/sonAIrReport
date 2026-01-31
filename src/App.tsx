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
    setAnalysisResult(null);
  }, []);

  const getStatus = () => {
    if (analysisMutation.isPending) return 'analyzing';
    if (analysisMutation.isSuccess) return 'success';
    if (analysisMutation.isError) return 'error';
    return 'idle';
  };

  const getBaselineDate = () => {
    if (!baselineReport || baselineReport.analysisReports.length === 0) return null;
    const reports = baselineReport.analysisReports;
    return reports[reports.length - 1].date;
  };

  return (
    <div className="gradient-mesh relative min-h-screen">
      <Header onSettingsClick={() => setSettingsOpen(true)} />

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Hero Section */}
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Analyze SonarCloud Quality Reports
          </h2>
          <p className="mx-auto max-w-2xl text-[var(--foreground-muted)]">
            Load a previous CSV report, then upload a new screenshot to compare and analyze changes.
          </p>
        </div>

        {/* API Key Warning */}
        {apiKeyError && (
          <div className="card border-warning-200 bg-warning-50 dark:border-warning-500/30 dark:bg-warning-500/10 mb-8 flex items-center gap-4 p-4">
            <div className="bg-warning-100 dark:bg-warning-500/20 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
              <i className="ri-error-warning-line ri-lg text-warning-600" />
            </div>
            <div className="flex-1">
              <p className="text-warning-700 dark:text-warning-400 font-medium">API Key Required</p>
              <p className="text-warning-600 dark:text-warning-500 text-sm">
                Please configure your OpenAI API key in settings to analyze screenshots.
              </p>
            </div>
            <button
              onClick={() => setSettingsOpen(true)}
              className="focus-ring bg-warning-600 hover:bg-warning-700 shrink-0 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors"
            >
              Open Settings
            </button>
          </div>
        )}

        {/* Workflow Steps */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          {/* Step 1: Load CSV */}
          <div className={`card p-6 ${baselineReport ? 'ring-success-500/50 ring-2' : ''}`}>
            <div className="mb-4 flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  baselineReport
                    ? 'bg-success-500 text-white'
                    : 'bg-[var(--background-secondary)] text-[var(--foreground-muted)]'
                }`}
              >
                {baselineReport ? <i className="ri-check-line" /> : <i className="ri-file-text-line" />}
              </div>
              <div>
                <h3 className="font-semibold text-[var(--card-foreground)]">Load Previous Report</h3>
                <p className="text-xs text-[var(--foreground-muted)]">Optional baseline for comparison</p>
              </div>
            </div>

            <CSVUpload onLoad={handleCSVLoad} />

            {baselineReport && baselineReport.analysisReports.length > 0 && (
              <div className="border-success-200 bg-success-50 dark:border-success-500/30 dark:bg-success-500/10 mt-4 rounded-lg border p-3">
                <p className="text-success-700 dark:text-success-400 text-sm">
                  <span className="font-medium">Loaded:</span> {baselineReport.analysisReports.length} report(s) from{' '}
                  <span className="font-medium">{getBaselineDate()}</span>
                </p>
              </div>
            )}
          </div>

          {/* Step 2: Upload Screenshot */}
          <div className="card p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-500 text-white">
                <i className="ri-camera-line" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--card-foreground)]">Upload Screenshot</h3>
                <p className="text-xs text-[var(--foreground-muted)]">Current SonarCloud dashboard</p>
              </div>
            </div>

            <ScreenshotUpload onUpload={handleScreenshotUpload} isAnalyzing={analysisMutation.isPending} />

            {baselineReport && (
              <p className="mt-4 text-xs text-[var(--foreground-muted)]">
                <i className="ri-information-line mr-1" />
                Will compare with baseline from {getBaselineDate()}
              </p>
            )}
          </div>
        </div>

        {/* Analysis Progress */}
        <div className="mb-8">
          <AnalysisProgress status={getStatus()} errorMessage={analysisMutation.error?.message} />
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <ReportDisplay
            report={{
              analysisReports:
                analysisResult.analysisReports.length > 0
                  ? [analysisResult.analysisReports[analysisResult.analysisReports.length - 1]]
                  : [],
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
      <footer className="border-t border-[var(--border)] bg-[var(--card)]">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-6 py-5 text-sm text-[var(--foreground-muted)]">
          <i className="ri-radar-line text-teal-500" />
          <span>SonAIr Report — AI-powered SonarCloud analysis</span>
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
