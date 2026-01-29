import type { AnalysisReport, DiffReport, FullReport, SonarProject, DiffEntry } from '../types'

export const parseCSV = (csvContent: string): FullReport => {
  const lines = csvContent.split('\n').filter(line => line.trim())
  const analysisReports: AnalysisReport[] = []
  const diffReports: DiffReport[] = []

  let currentReport: AnalysisReport | null = null
  let currentDiff: DiffReport | null = null
  let isHeaderRow = false
  let isDiffSection = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Check for date header (e.g., "16.09.2025: h1 projects")
    const dateHeaderMatch = line.match(/^(\d{2}\.\d{2}\.\d{4}):\s*(.+)$/)
    if (dateHeaderMatch) {
      const [, date, title] = dateHeaderMatch

      // Check if it's a diff section
      if (title.toLowerCase().includes('diff')) {
        // Save current report if exists
        if (currentReport && currentReport.projects.length > 0) {
          analysisReports.push(currentReport)
          currentReport = null
        }
        if (currentDiff && currentDiff.entries.length > 0) {
          diffReports.push(currentDiff)
        }

        const comparedToMatch = title.match(/diff\s+(\d{2}\.\d{2}\.\d{4})/i)
        currentDiff = {
          date,
          comparedTo: comparedToMatch ? comparedToMatch[1] : '',
          entries: []
        }
        isDiffSection = true
        isHeaderRow = true
      } else {
        // Save current sections if exists
        if (currentReport && currentReport.projects.length > 0) {
          analysisReports.push(currentReport)
        }
        if (currentDiff && currentDiff.entries.length > 0) {
          diffReports.push(currentDiff)
          currentDiff = null
        }

        currentReport = {
          date,
          title,
          projects: []
        }
        isDiffSection = false
        isHeaderRow = true
      }
      continue
    }

    // Check for header row
    if (line.toLowerCase().startsWith('project,')) {
      isHeaderRow = false
      continue
    }

    // Skip if we're still in header
    if (isHeaderRow) continue

    // Parse data row
    if (isDiffSection && currentDiff) {
      const entry = parseDiffRow(line)
      if (entry) {
        currentDiff.entries.push(entry)
      }
    } else if (currentReport) {
      const project = parseProjectRow(line)
      if (project) {
        currentReport.projects.push(project)
      }
    }
  }

  // Add remaining reports
  if (currentReport && currentReport.projects.length > 0) {
    analysisReports.push(currentReport)
  }
  if (currentDiff && currentDiff.entries.length > 0) {
    diffReports.push(currentDiff)
  }

  return { analysisReports, diffReports }
}

const parseProjectRow = (line: string): SonarProject | null => {
  // Handle CSV with quoted fields containing commas
  const values = parseCSVLine(line)

  if (values.length < 11) return null

  return {
    project: values[0],
    lastAnalysis: values[1],
    loc: values[2],
    languages: values[3],
    status: values[4] as 'Passed' | 'Failed',
    security: values[5],
    reliability: values[6],
    maintainability: values[7],
    hotspotsReviewed: values[8],
    coverage: values[9],
    duplications: values[10]
  }
}

const parseDiffRow = (line: string): DiffEntry | null => {
  const values = parseCSVLine(line)

  if (values.length < 5) return null

  return {
    project: values[0],
    field: values[1],
    oldValue: values[2],
    newValue: values[3],
    delta: values[4],
    degradation: values[5] || '',
    remark: values[6] || ''
  }
}

const parseCSVLine = (line: string): string[] => {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  values.push(current.trim())

  return values
}

export const generateCSV = (report: FullReport): string => {
  const lines: string[] = []

  // Generate analysis reports
  for (const analysis of report.analysisReports) {
    lines.push(`${analysis.date}: ${analysis.title}`)
    lines.push('Project,Last analysis,LOC,Languages,Status,Security,Reliability,Maintainability,Hotspots Reviewed,Coverage (%),Duplications (%)')

    for (const project of analysis.projects) {
      lines.push([
        project.project,
        `"${project.lastAnalysis}"`,
        project.loc,
        `"${project.languages}"`,
        project.status,
        project.security,
        project.reliability,
        project.maintainability,
        project.hotspotsReviewed,
        project.coverage,
        project.duplications
      ].join(','))
    }
    lines.push('')
  }

  // Generate diff reports
  for (const diff of report.diffReports) {
    lines.push(`${diff.date}: Diff ${diff.comparedTo}`)
    lines.push('Project,Field,Value_' + diff.comparedTo + ',Value_' + diff.date + ',Delta,Degradation,Remark')

    for (const entry of diff.entries) {
      lines.push([
        entry.project,
        entry.field,
        entry.oldValue,
        entry.newValue,
        entry.delta,
        entry.degradation,
        entry.remark || ''
      ].join(','))
    }
    lines.push('')
  }

  return lines.join('\n')
}
