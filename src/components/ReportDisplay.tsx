import type { AnalysisCost, FullReport } from '../types';
import { generateCSV } from '../utils/csvParser';

interface ReportDisplayProps {
  report: FullReport;
  cost?: AnalysisCost;
}

type Align = 'left' | 'right' | 'center';

const ALIGN_CLASSES: Record<Align, string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

const DIFF_COLUMNS: [string, Align][] = [
  ['Project', 'left'],
  ['Field', 'left'],
  ['Previous', 'right'],
  ['Current', 'right'],
  ['Delta', 'right'],
  ['Trend', 'center'],
  ['Remark', 'left'],
];

const PROJECT_COLUMNS: [string, Align][] = [
  ['Project', 'left'],
  ['Last Analysis', 'left'],
  ['LOC', 'right'],
  ['Languages', 'left'],
  ['Status', 'center'],
  ['Security', 'center'],
  ['Reliability', 'center'],
  ['Maintain.', 'center'],
  ['Hotspots', 'center'],
  ['Coverage', 'right'],
  ['Duplication', 'right'],
];

const formatCost = (amount: number): string => `$${amount.toFixed(amount < 0.01 ? 4 : 3)}`;

const formatTokens = (tokens: number): string =>
  tokens >= 1000 ? `${(tokens / 1000).toFixed(1)}k` : tokens.toString();

const statusColor = (status: string): string =>
  status === 'Passed'
    ? 'bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-400'
    : 'bg-error-100 text-error-700 dark:bg-error-500/20 dark:text-error-400';

const gradeColor = (grade: string): string => {
  switch (grade.charAt(0).toUpperCase()) {
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

// "Yes" = quality got worse, "No" = better or same, anything else (e.g. "Note") is neutral.
function TrendIcon({ degradation }: { degradation: string }) {
  if (/\byes\b/i.test(degradation)) {
    return <i className="ri-arrow-down-line text-error-500" />;
  }
  if (/\bno\b/i.test(degradation)) {
    return <i className="ri-arrow-up-line text-success-500" />;
  }
  return <i className="ri-subtract-line text-[var(--foreground-muted)]" />;
}

function GradeBadge({ grade }: { grade: string }) {
  return (
    <span className={`inline-flex rounded px-1.5 py-0.5 text-xs font-semibold ${gradeColor(grade)}`}>{grade}</span>
  );
}

function TableHead({ columns }: { columns: [string, Align][] }) {
  return (
    <thead className="border-b border-[var(--border)] bg-[var(--background-secondary)]">
      <tr>
        {columns.map(([label, align]) => (
          <th
            key={label}
            className={`px-4 py-3 text-xs font-medium tracking-wide text-[var(--foreground-muted)] uppercase ${ALIGN_CLASSES[align]}`}
          >
            {label}
          </th>
        ))}
      </tr>
    </thead>
  );
}

/** Shows the latest analysis and diff of `report`; the CSV download contains the full history. */
export function ReportDisplay({ report, cost }: ReportDisplayProps) {
  const analysis = report.analysisReports.at(-1);
  const diff = report.diffReports.at(-1);

  const handleDownload = () => {
    const blob = new Blob([generateCSV(report)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sonar-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (analysis === undefined) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-[var(--foreground)]">Analysis Results</h2>
        <div className="flex items-center gap-3">
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

      {diff && (
        <div className="card overflow-hidden">
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
                <TableHead columns={DIFF_COLUMNS} />
                <tbody className="divide-y divide-[var(--border)]">
                  {diff.entries.map((entry, index) => (
                    <tr key={index} className="hover:bg-[var(--background-secondary)]/50">
                      <td className="px-4 py-3 font-medium text-[var(--card-foreground)]">{entry.project}</td>
                      <td className="px-4 py-3 text-[var(--foreground-muted)]">{entry.field}</td>
                      <td className="px-4 py-3 text-right text-[var(--foreground-muted)]">{entry.oldValue}</td>
                      <td className="px-4 py-3 text-right font-medium text-[var(--card-foreground)]">
                        {entry.newValue}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[var(--foreground-muted)]">{entry.delta}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <TrendIcon degradation={entry.degradation} />
                        </div>
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
      )}

      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--background-secondary)] px-4 py-3">
          <i className="ri-file-list-3-line text-[var(--foreground-muted)]" />
          <div>
            <h3 className="font-medium text-[var(--card-foreground)]">Current Data: {analysis.date}</h3>
            <p className="text-xs text-[var(--foreground-muted)]">{analysis.projects.length} projects extracted</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <TableHead columns={PROJECT_COLUMNS} />
            <tbody className="divide-y divide-[var(--border)]">
              {analysis.projects.map((project, index) => (
                <tr key={index} className="hover:bg-[var(--background-secondary)]/50">
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
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(project.status)}`}
                    >
                      {project.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <GradeBadge grade={project.security} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <GradeBadge grade={project.reliability} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <GradeBadge grade={project.maintainability} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <GradeBadge grade={project.hotspotsReviewed} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[var(--foreground-muted)]">{project.coverage}</td>
                  <td className="px-4 py-3 text-right font-mono text-[var(--foreground-muted)]">
                    {project.duplications}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
