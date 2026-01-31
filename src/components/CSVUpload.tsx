import { useState, useCallback } from 'react';
import { parseCSV } from '../utils/csvParser';
import type { FullReport } from '../types';

interface CSVUploadProps {
  onLoad: (report: FullReport) => void;
}

export function CSVUpload({ onLoad }: CSVUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      setSuccess(false);

      if (!file.name.endsWith('.csv') && !file.type.includes('csv') && !file.type.includes('text')) {
        setError('Please upload a CSV file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const report = parseCSV(content);

          if (report.analysisReports.length === 0) {
            setError('No valid analysis data found in the CSV');
            return;
          }

          onLoad(report);
          setFileName(file.name);
          setSuccess(true);
        } catch (err) {
          setError('Failed to parse CSV file');
          console.error(err);
        }
      };
      reader.onerror = () => {
        setError('Failed to read file');
      };
      reader.readAsText(file);
    },
    [onLoad],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDragEnter={handleDragEnter}
        className={`relative cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-all ${
          dragActive
            ? 'border-success-500 bg-success-50 dark:bg-success-500/10'
            : success
              ? 'border-success-300 bg-success-50/50 dark:border-success-500/50 dark:bg-success-500/5'
              : 'border-[var(--border)] hover:border-teal-400 hover:bg-teal-50/50 dark:hover:bg-teal-500/5'
        }`}
      >
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleInputChange}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />

        <div className="space-y-2">
          <div
            className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
              success
                ? 'bg-success-100 dark:bg-success-500/20'
                : dragActive
                  ? 'bg-success-100 dark:bg-success-500/20'
                  : 'bg-[var(--background-secondary)]'
            }`}
          >
            {success ? (
              <i className="ri-checkbox-circle-fill ri-xl text-success-600 dark:text-success-400" />
            ) : dragActive ? (
              <i className="ri-file-excel-2-line ri-xl text-success-600 dark:text-success-400" />
            ) : (
              <i className="ri-upload-cloud-2-line ri-xl text-[var(--foreground-muted)]" />
            )}
          </div>

          <div>
            {success ? (
              <>
                <p className="text-success-700 dark:text-success-400 font-medium">CSV Loaded</p>
                <p className="text-success-600 dark:text-success-500 text-sm">{fileName}</p>
              </>
            ) : dragActive ? (
              <>
                <p className="text-success-700 dark:text-success-400 font-medium">Drop CSV here</p>
                <p className="text-success-600 dark:text-success-500 text-sm">Release to upload</p>
              </>
            ) : (
              <>
                <p className="font-medium text-[var(--card-foreground)]">Drop CSV file here</p>
                <p className="text-sm text-[var(--foreground-muted)]">or click to browse</p>
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400 flex items-center gap-2 rounded-md px-3 py-2 text-sm">
          <i className="ri-error-warning-line" />
          {error}
        </div>
      )}
    </div>
  );
}
