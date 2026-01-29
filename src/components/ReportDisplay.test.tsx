import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportDisplay } from './ReportDisplay';
import type { FullReport, AnalysisCost } from '../types';

describe('ReportDisplay', () => {
  const mockReport: FullReport = {
    analysisReports: [
      {
        date: '16.01.2026',
        title: 'h1 projects',
        projects: [
          {
            project: 'test-project',
            lastAnalysis: '16/01/2026, 10:30',
            loc: '12k',
            languages: 'TypeScript',
            status: 'Passed',
            security: 'A (0)',
            reliability: 'A (0)',
            maintainability: 'A (150)',
            hotspotsReviewed: 'A (100%)',
            coverage: '85.0%',
            duplications: '2.1%',
          },
        ],
      },
    ],
    diffReports: [],
  };

  const mockReportWithDiff: FullReport = {
    analysisReports: mockReport.analysisReports,
    diffReports: [
      {
        date: '16.01.2026',
        comparedTo: '15.01.2026',
        entries: [
          {
            project: 'test-project',
            field: 'Coverage (%)',
            oldValue: '82.0%',
            newValue: '85.0%',
            delta: '+3.0 pp',
            degradation: 'No',
            remark: 'Coverage improved',
          },
        ],
      },
    ],
  };

  const mockCost: AnalysisCost = {
    extraction: {
      model: 'gpt-5.2',
      inputTokens: 2000,
      outputTokens: 800,
      cost: 0.015,
    },
    comparison: {
      model: 'gpt-5-mini',
      inputTokens: 1500,
      outputTokens: 500,
      cost: 0.006,
    },
    totalCost: 0.021,
  };

  it('should render analysis results heading', () => {
    render(<ReportDisplay report={mockReport} />);

    expect(screen.getByText('Analysis Results')).toBeInTheDocument();
  });

  it('should render project data', () => {
    render(<ReportDisplay report={mockReport} />);

    expect(screen.getByText('test-project')).toBeInTheDocument();
    expect(screen.getByText('12k')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Passed')).toBeInTheDocument();
    expect(screen.getByText('85.0%')).toBeInTheDocument();
  });

  it('should render diff report when available', () => {
    render(<ReportDisplay report={mockReportWithDiff} />);

    expect(screen.getByText(/Changes: 16.01.2026 vs 15.01.2026/)).toBeInTheDocument();
    expect(screen.getByText('Coverage (%)')).toBeInTheDocument();
    expect(screen.getByText('82.0%')).toBeInTheDocument();
    expect(screen.getByText('+3.0 pp')).toBeInTheDocument();
    expect(screen.getByText('Coverage improved')).toBeInTheDocument();
  });

  it('should render cost information when provided', () => {
    render(<ReportDisplay report={mockReport} cost={mockCost} />);

    expect(screen.getByText(/Est. Cost:/)).toBeInTheDocument();
    expect(screen.getByText(/\$0.021/)).toBeInTheDocument();
  });

  it('should render download button', () => {
    render(<ReportDisplay report={mockReport} />);

    expect(screen.getByText(/Download Full CSV/)).toBeInTheDocument();
  });

  it('should show report count when fullReport is provided', () => {
    render(<ReportDisplay report={mockReport} fullReport={mockReport} />);

    expect(screen.getByText('(1 reports)')).toBeInTheDocument();
  });

  it('should not render when analysisReports is empty', () => {
    const emptyReport: FullReport = {
      analysisReports: [],
      diffReports: [],
    };

    const { container } = render(<ReportDisplay report={emptyReport} />);

    expect(container.firstChild).toBeNull();
  });

  it('should show "No changes detected" when diff has no entries', () => {
    const reportWithEmptyDiff: FullReport = {
      analysisReports: mockReport.analysisReports,
      diffReports: [
        {
          date: '16.01.2026',
          comparedTo: '15.01.2026',
          entries: [],
        },
      ],
    };

    render(<ReportDisplay report={reportWithEmptyDiff} />);

    expect(screen.getByText('No changes detected between the two reports')).toBeInTheDocument();
  });
});
