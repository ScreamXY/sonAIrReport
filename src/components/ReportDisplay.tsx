import type { FullReport, AnalysisCost } from '../types';
import { generateCSV } from '../utils/csvParser';

interface ReportDisplayProps {
  report: FullReport;
  fullReport?: FullReport;
  cost?: AnalysisCost | null;
}

export function ReportDisplay({ report, fullReport, cost }: ReportDisplayProps) {
  const downloadReport = fullReport ?? report;

  const formatCost = (amount: number) => {
    return amount < 0.01 ? `$${amount.toFixed(4)}` : `$${amount.toFixed(3)}`;
  };

  const formatTokens = (tokens: number) => {
    return tokens >= 1000 ? `${(tokens / 1000).toFixed(1)}k` : tokens.toString();
  };

  const handleDownload = () => {
    const csv = generateCSV(downloadReport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `sonar-analysis-${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    return status === 'Passed'
      ? 'bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-400'
      : 'bg-error-100 text-error-700 dark:bg-error-500/20 dark:text-error-400';
  };

  const getGradeColor = (grade: string) => {
    const letter = grade.charAt(0).toUpperCase();
    switch (letter) {
      case 'A':
        return 'text-success-600 bg-success-50 dark:bg-success-500/10 dark:text-success-400';
      case 'B':
        return 'text-teal-600 bg-teal-50 dark:bg-teal-500/10 dark:text-teal-400';
      case 'C':
        return 'text-warning-600 bg-warning-50 dark:bg-warning-500/10 dark:text-warning-400';
      case 'D':
        return 'text-warning-700 bg-warning-100 dark:bg-warning-500/20 dark:text-warning-300';
      case 'E':
        return 'text-error-600 bg-error-50 dark:bg-error-500/10 dark:text-error-400';
      default:
        return 'text-[var(--foreground-muted)] bg-[var(--background-secondary)]';
    }
  };

  const getDeltaIcon = (degradation: string) => {
    const lower = degradation.toLowerCase();
    if (lower.includes('ja') || lower.includes('yes')) {
      return <i className="ri-arrow-down-line text-error-500" />;
    }
    if (lower.includes('nein') || lower.includes('no') || lower.includes('verbesserung')) {
      return <i className="ri-arrow-up-line text-success-500" />;
    }
    return <i className="ri-subtract-line text-[var(--foreground-muted)]" />;
  };

  if (report.analysisReports.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Header with Download Button and Cost */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-[var(--foreground)]">Analysis Results</h2>
        <div className="flex items-center gap-3">
          {/* Cost Display */}
          {cost && (
            <div className="card flex items-center gap-2 px-3 py-2 text-sm">
              <i className="ri-money-dollar-circle-line text-success-500" />
              <span className="font-medium text-[var(--card-foreground)]">{formatCost(cost.totalCost)}</span>
              <span className="text-[var(--foreground-muted)]">
                ({formatTokens(cost.extraction.inputTokens + (cost.comparison?.inputTokens ?? 0))} tokens)
              </span>
            </div>
          )}
          <button
            onClick={handleDownload}
            className="focus-ring flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400"
          >
            <i className="ri-download-2-line" />
            Download CSV
          </button>
        </div>
      </div>

      {/* Diff Reports */}
      {report.diffReports.map((diff, index) => (
        <div key={index} className="card overflow-hidden">
          <div className="bg-warning-50/50 dark:bg-warning-500/5 flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
            <i className="ri-git-commit-line text-warning-600 dark:text-warning-400" />
            <div>
              <h3 className="font-medium text-[var(--card-foreground)]">
                Changes: {diff.date} vs {diff.comparedTo}
              </h3>
              <p className="text-xs text-[var(--foreground-muted)]">{diff.entries.length} changes detected</p>
            </div>
          </div>

          {diff.entries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[var(--border)] bg-[var(--background-secondary)]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-[var(--foreground-muted)] uppercase">
                      Project
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-[var(--foreground-muted)] uppercase">
                      Field
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium tracking-wide text-[var(--foreground-muted)] uppercase">
                      Previous
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium tracking-wide text-[var(--foreground-muted)] uppercase">
                      Current
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium tracking-wide text-[var(--foreground-muted)] uppercase">
                      Delta
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium tracking-wide text-[var(--foreground-muted)] uppercase">
                      Trend
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-[var(--foreground-muted)] uppercase">
                      Remark
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {diff.entries.map((entry, eIndex) => (
                    <tr key={eIndex} className="hover:bg-[var(--background-secondary)]/50">
                      <td className="px-4 py-3 font-medium text-[var(--card-foreground)]">{entry.project}</td>
                      <td className="px-4 py-3 text-[var(--foreground-muted)]">{entry.field}</td>
                      <td className="px-4 py-3 text-right text-[var(--foreground-muted)]">{entry.oldValue}</td>
                      <td className="px-4 py-3 text-right font-medium text-[var(--card-foreground)]">
                        {entry.newValue}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[var(--foreground-muted)]">{entry.delta}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">{getDeltaIcon(entry.degradation)}</div>
                      </td>
                      <td
                        className="max-w-[200px] truncate px-4 py-3 text-[var(--foreground-muted)]"
                        title={entry.remark}
                      >
                        {entry.remark}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-[var(--foreground-muted)]">
              <i className="ri-checkbox-circle-line ri-2xl text-success-400 mb-2" />
              <p>No changes detected</p>
            </div>
          )}
        </div>
      ))}

      {/* Current Analysis Report */}
      {report.analysisReports.map((analysis, index) => (
        <div key={index} className="card overflow-hidden">
          <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--background-secondary)] px-4 py-3">
            <i className="ri-file-list-3-line text-[var(--foreground-muted)]" />
            <div>
              <h3 className="font-medium text-[var(--card-foreground)]">Current Data: {analysis.date}</h3>
              <p className="text-xs text-[var(--foreground-muted)]">{analysis.projects.length} projects extracted</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--background-secondary)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-[var(--foreground-muted)] uppercase">
                    Project
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-[var(--foreground-muted)] uppercase">
                    Last Analysis
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium tracking-wide text-[var(--foreground-muted)] uppercase">
                    LOC
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-[var(--foreground-muted)] uppercase">
                    Languages
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium tracking-wide text-[var(--foreground-muted)] uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium tracking-wide text-[var(--foreground-muted)] uppercase">
                    Security
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium tracking-wide text-[var(--foreground-muted)] uppercase">
                    Reliability
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium tracking-wide text-[var(--foreground-muted)] uppercase">
                    Maintain.
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium tracking-wide text-[var(--foreground-muted)] uppercase">
                    Hotspots
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium tracking-wide text-[var(--foreground-muted)] uppercase">
                    Coverage
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium tracking-wide text-[var(--foreground-muted)] uppercase">
                    Duplication
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {analysis.projects.map((project, pIndex) => (
                  <tr key={pIndex} className="hover:bg-[var(--background-secondary)]/50">
                    <td className="px-4 py-3 font-medium text-[var(--card-foreground)]">{project.project}</td>
                    <td className="px-4 py-3 text-[var(--foreground-muted)]">{project.lastAnalysis}</td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--foreground-muted)]">{project.loc}</td>
                    <td
                      className="max-w-[100px] truncate px-4 py-3 text-[var(--foreground-muted)]"
                      title={project.languages}
                    >
                      {project.languages}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(project.status)}`}
                      >
                        {project.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex rounded px-1.5 py-0.5 text-xs font-semibold ${getGradeColor(project.security)}`}
                      >
                        {project.security}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex rounded px-1.5 py-0.5 text-xs font-semibold ${getGradeColor(project.reliability)}`}
                      >
                        {project.reliability}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex rounded px-1.5 py-0.5 text-xs font-semibold ${getGradeColor(project.maintainability)}`}
                      >
                        {project.maintainability}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex rounded px-1.5 py-0.5 text-xs font-semibold ${getGradeColor(project.hotspotsReviewed)}`}
                      >
                        {project.hotspotsReviewed}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--foreground-muted)]">
                      {project.coverage}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--foreground-muted)]">
                      {project.duplications}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
