import { useState, useCallback } from 'react'
import { Upload, AlertCircle, CheckCircle, FileSpreadsheet } from 'lucide-react'
import { parseCSV } from '../utils/csvParser'
import type { FullReport } from '../types'

interface CSVUploadProps {
  onLoad: (report: FullReport) => void
}

export function CSVUpload({ onLoad }: CSVUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleFile = useCallback((file: File) => {
    setError(null)
    setSuccess(false)

    if (!file.name.endsWith('.csv') && !file.type.includes('csv') && !file.type.includes('text')) {
      setError('Please upload a CSV file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const report = parseCSV(content)

        if (report.analysisReports.length === 0) {
          setError('No valid analysis data found in the CSV')
          return
        }

        onLoad(report)
        setFileName(file.name)
        setSuccess(true)
      } catch (err) {
        setError('Failed to parse CSV file')
        console.error(err)
      }
    }
    reader.onerror = () => {
      setError('Failed to read file')
    }
    reader.readAsText(file)
  }, [onLoad])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDragEnter={handleDragEnter}
        className={`
          relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer
          ${dragActive
            ? 'border-green-500 bg-green-50 scale-[1.02]'
            : success
              ? 'border-green-300 bg-green-50'
              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }
        `}
      >
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="space-y-3">
          <div className={`
            w-12 h-12 mx-auto rounded-full flex items-center justify-center transition-all
            ${dragActive
              ? 'bg-green-100 scale-110'
              : success
                ? 'bg-green-100'
                : 'bg-slate-100'
            }
          `}>
            {success ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : dragActive ? (
              <FileSpreadsheet className="w-6 h-6 text-green-600" />
            ) : (
              <Upload className="w-6 h-6 text-slate-400" />
            )}
          </div>

          <div>
            {success ? (
              <>
                <p className="font-medium text-green-700">CSV Loaded</p>
                <p className="text-sm text-green-600">{fileName}</p>
              </>
            ) : dragActive ? (
              <>
                <p className="font-medium text-green-700">Drop CSV here</p>
                <p className="text-sm text-green-600">Release to upload</p>
              </>
            ) : (
              <>
                <p className="font-medium text-slate-700">Load Previous Analysis</p>
                <p className="text-sm text-slate-500">Drag and drop CSV or click to browse</p>
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  )
}
