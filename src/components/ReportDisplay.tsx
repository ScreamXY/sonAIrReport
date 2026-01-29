import { Download, FileSpreadsheet, TrendingUp, TrendingDown, Minus, GitCompare } from 'lucide-react'
import type { FullReport } from '../types'
import { generateCSV } from '../utils/csvParser'

interface ReportDisplayProps {
  report: FullReport
  fullReport?: FullReport // Full report with all historical data for CSV download
}

export function ReportDisplay({ report, fullReport }: ReportDisplayProps) {
  const downloadReport = fullReport ?? report

  const handleDownload = () => {
    const csv = generateCSV(downloadReport)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    const date = new Date().toISOString().split('T')[0]
    link.setAttribute('href', url)
    link.setAttribute('download', `sonar-analysis-${date}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getStatusColor = (status: string) => {
    return status === 'Passed'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800'
  }

  const getGradeColor = (grade: string) => {
    const letter = grade.charAt(0).toUpperCase()
    switch (letter) {
      case 'A': return 'text-green-600'
      case 'B': return 'text-blue-600'
      case 'C': return 'text-yellow-600'
      case 'D': return 'text-orange-600'
      case 'E': return 'text-red-600'
      default: return 'text-slate-600'
    }
  }

  const getDeltaIcon = (degradation: string) => {
    const lower = degradation.toLowerCase()
    if (lower.includes('ja') || lower.includes('yes')) {
      return <TrendingDown className="w-4 h-4 text-red-500" />
    }
    if (lower.includes('nein') || lower.includes('no') || lower.includes('verbesserung')) {
      return <TrendingUp className="w-4 h-4 text-green-500" />
    }
    return <Minus className="w-4 h-4 text-slate-400" />
  }

  if (report.analysisReports.length === 0) return null

  return (
    <div className="space-y-6">
      {/* Download Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Analysis Results</h2>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity shadow-md"
        >
          <Download className="w-4 h-4" />
          Download Full CSV
          {fullReport && (
            <span className="text-xs opacity-75">
              ({fullReport.analysisReports.length} reports)
            </span>
          )}
        </button>
      </div>

      {/* Diff Reports - Show first if available */}
      {report.diffReports.map((diff, index) => (
        <div key={index} className="bg-white rounded-2xl shadow-sm border border-amber-200 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-amber-100">
            <div className="flex items-center gap-3">
              <GitCompare className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-semibold text-slate-800">Changes: {diff.date} vs {diff.comparedTo}</h3>
                <p className="text-sm text-slate-500">{diff.entries.length} changes detected</p>
              </div>
            </div>
          </div>

          {diff.entries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Project</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Field</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-600">Previous</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-600">Current</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-600">Delta</th>
                    <th className="px-4 py-3 text-center font-medium text-slate-600">Trend</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {diff.entries.map((entry, eIndex) => (
                    <tr key={eIndex} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">{entry.project}</td>
                      <td className="px-4 py-3 text-slate-600">{entry.field}</td>
                      <td className="px-4 py-3 text-right text-slate-500">{entry.oldValue}</td>
                      <td className="px-4 py-3 text-right text-slate-800 font-medium">{entry.newValue}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{entry.delta}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {getDeltaIcon(entry.degradation)}
                          <span className="text-xs text-slate-500">{entry.degradation}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{entry.remark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-500">
              No changes detected between the two reports
            </div>
          )}
        </div>
      ))}

      {/* Current Analysis Report */}
      {report.analysisReports.map((analysis, index) => (
        <div key={index} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-slate-500" />
              <div>
                <h3 className="font-semibold text-slate-800">Current Data: {analysis.date}</h3>
                <p className="text-sm text-slate-500">{analysis.projects.length} projects extracted from screenshot</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Project</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Last Analysis</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">LOC</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Languages</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">Status</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">Security</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">Reliability</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">Maintainability</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">Hotspots</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">Coverage</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">Duplication</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analysis.projects.map((project, pIndex) => (
                  <tr key={pIndex} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{project.project}</td>
                    <td className="px-4 py-3 text-slate-600">{project.lastAnalysis}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{project.loc}</td>
                    <td className="px-4 py-3 text-slate-600">{project.languages}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-center font-medium ${getGradeColor(project.security)}`}>
                      {project.security}
                    </td>
                    <td className={`px-4 py-3 text-center font-medium ${getGradeColor(project.reliability)}`}>
                      {project.reliability}
                    </td>
                    <td className={`px-4 py-3 text-center font-medium ${getGradeColor(project.maintainability)}`}>
                      {project.maintainability}
                    </td>
                    <td className={`px-4 py-3 text-center font-medium ${getGradeColor(project.hotspotsReviewed)}`}>
                      {project.hotspotsReviewed}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{project.coverage}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{project.duplications}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
