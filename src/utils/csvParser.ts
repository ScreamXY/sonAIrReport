import type { AnalysisReport, DiffEntry, DiffReport, FullReport, SonarProject } from '../types';

const SECTION_HEADER = /^(\d{2}\.\d{2}\.\d{4}):\s*(.+)$/;
const DIFF_COMPARED_TO = /diff\s+(\d{2}\.\d{2}\.\d{4})/i;
const PROJECT_COLUMNS =
  'Project,Last analysis,LOC,Languages,Status,Security,Reliability,Maintainability,Hotspots Reviewed,Coverage (%),Duplications (%)';

interface Section {
  date: string;
  title: string;
  rows: string[];
}

const isDiffSection = (section: Section): boolean => section.title.toLowerCase().includes('diff');

const isPresent = <T>(value: T | null): value is T => value !== null;

/** Splits the file into "DD.MM.YYYY: title" sections. Rows count only after the column header row. */
const splitSections = (csvContent: string): Section[] => {
  const sections: Section[] = [];
  let columnHeaderSeen = false;

  for (const line of csvContent.split('\n').map((raw) => raw.trim())) {
    if (line === '') {
      continue;
    }
    const header = SECTION_HEADER.exec(line);
    if (header) {
      sections.push({ date: header[1], title: header[2], rows: [] });
      columnHeaderSeen = false;
    } else if (line.toLowerCase().startsWith('project,')) {
      columnHeaderSeen = true;
    } else if (columnHeaderSeen) {
      sections.at(-1)?.rows.push(line);
    }
  }

  return sections;
};

const parseCSVLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"' && inQuotes && line[i + 1] === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());

  return values;
};

const parseProjectRow = (line: string): SonarProject | null => {
  const values = parseCSVLine(line);
  if (values.length < 11) {
    return null;
  }

  const [
    project,
    lastAnalysis,
    loc,
    languages,
    status,
    security,
    reliability,
    maintainability,
    hotspotsReviewed,
    coverage,
    duplications,
  ] = values;
  return {
    project,
    lastAnalysis,
    loc,
    languages,
    status: status as SonarProject['status'],
    security,
    reliability,
    maintainability,
    hotspotsReviewed,
    coverage,
    duplications,
  };
};

const parseDiffRow = (line: string): DiffEntry | null => {
  const values = parseCSVLine(line);
  if (values.length < 5) {
    return null;
  }

  const [project, field, oldValue, newValue, delta, degradation = '', remark = ''] = values;
  return { project, field, oldValue, newValue, delta, degradation, remark };
};

export const parseCSV = (csvContent: string): FullReport => {
  const sections = splitSections(csvContent);

  const analysisReports: AnalysisReport[] = sections
    .filter((section) => !isDiffSection(section))
    .map(({ date, title, rows }) => ({ date, title, projects: rows.map(parseProjectRow).filter(isPresent) }))
    .filter((report) => report.projects.length > 0);

  const diffReports: DiffReport[] = sections
    .filter(isDiffSection)
    .map(({ date, title, rows }) => ({
      date,
      comparedTo: DIFF_COMPARED_TO.exec(title)?.[1] ?? '',
      entries: rows.map(parseDiffRow).filter(isPresent),
    }))
    .filter((diff) => diff.entries.length > 0);

  return { analysisReports, diffReports };
};

/** Quotes a value when it contains a comma, quote or line break (RFC 4180). */
const toCsvField = (value: string): string => (/[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value);

const toCsvRow = (values: string[]): string => values.map(toCsvField).join(',');

export const generateCSV = (report: FullReport): string => {
  const analysisLines = report.analysisReports.flatMap((analysis) => [
    `${analysis.date}: ${analysis.title}`,
    PROJECT_COLUMNS,
    ...analysis.projects.map((project) =>
      toCsvRow([
        project.project,
        project.lastAnalysis,
        project.loc,
        project.languages,
        project.status,
        project.security,
        project.reliability,
        project.maintainability,
        project.hotspotsReviewed,
        project.coverage,
        project.duplications,
      ]),
    ),
    '',
  ]);

  const diffLines = report.diffReports.flatMap((diff) => [
    `${diff.date}: Diff ${diff.comparedTo}`,
    `Project,Field,Value_${diff.comparedTo},Value_${diff.date},Delta,Degradation,Remark`,
    ...diff.entries.map((entry) =>
      toCsvRow([
        entry.project,
        entry.field,
        entry.oldValue,
        entry.newValue,
        entry.delta,
        entry.degradation,
        entry.remark ?? '',
      ]),
    ),
    '',
  ]);

  return [...analysisLines, ...diffLines].join('\n');
};
