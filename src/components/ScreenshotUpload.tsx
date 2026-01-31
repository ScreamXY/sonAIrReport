import { useState, useCallback, useEffect } from 'react';

interface ScreenshotUploadProps {
  onUpload: (images: string[]) => void;
  isAnalyzing: boolean;
}

export function ScreenshotUpload({ onUpload, isAnalyzing }: ScreenshotUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addFile = useCallback((file: File) => {
    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError('Image must be less than 20MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setScreenshots((prev) => [...prev, base64]);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsDataURL(file);
  }, []);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      Array.from(files).forEach((file) => addFile(file));
    },
    [addFile],
  );

  const removeScreenshot = useCallback((index: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearAll = useCallback(() => {
    setScreenshots([]);
  }, []);

  const handleAnalyze = useCallback(() => {
    if (screenshots.length > 0) {
      onUpload(screenshots);
    }
  }, [screenshots, onUpload]);

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      if (isAnalyzing) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            addFile(file);
          }
          return;
        }
      }
    },
    [addFile, isAnalyzing],
  );

  const handlePasteFromClipboard = useCallback(async () => {
    if (isAnalyzing) return;
    setError(null);

    try {
      const clipboardItems = await navigator.clipboard.read();

      for (const item of clipboardItems) {
        const imageType = item.types.find((type) => type.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], 'clipboard-image.png', { type: imageType });
          addFile(file);
          return;
        }
      }

      setError('No image found in clipboard. Copy a screenshot first.');
    } catch {
      setError('Could not access clipboard. Try pressing Ctrl+V / Cmd+V instead.');
    }
  }, [addFile, isAnalyzing]);

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);

      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
        e.target.value = '';
      }
    },
    [addFiles],
  );

  return (
    <div className="space-y-4">
      {/* Screenshot previews */}
      {screenshots.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium text-[var(--card-foreground)]">
              <i className="ri-gallery-line text-teal-500" />
              {screenshots.length} screenshot{screenshots.length > 1 ? 's' : ''} ready
            </span>
            <button
              onClick={clearAll}
              disabled={isAnalyzing}
              className="text-error-600 hover:text-error-700 dark:text-error-400 dark:hover:text-error-300 text-xs"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {screenshots.map((src, index) => (
              <div key={index} className="group relative">
                <img
                  src={src}
                  alt={`Screenshot ${index + 1}`}
                  className="h-16 w-auto rounded-md border border-[var(--border)] object-cover"
                />
                <button
                  onClick={() => removeScreenshot(index)}
                  disabled={isAnalyzing}
                  className="bg-error-500 absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <i className="ri-close-line text-xs" />
                </button>
                <span className="absolute bottom-0.5 left-0.5 rounded bg-gray-900/70 px-1 text-[10px] font-medium text-white">
                  {index + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-all ${
          dragActive
            ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/10'
            : 'border-[var(--border)] hover:border-teal-400 hover:bg-teal-50/50 dark:hover:bg-teal-500/5'
        } ${isAnalyzing ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleInputChange}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          disabled={isAnalyzing}
        />

        <div className="space-y-2">
          <div
            className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
              dragActive ? 'bg-teal-100 dark:bg-teal-500/20' : 'bg-[var(--background-secondary)]'
            }`}
          >
            <i
              className={`ri-xl ${dragActive ? 'ri-image-add-line text-teal-600 dark:text-teal-400' : 'ri-upload-cloud-2-line text-[var(--foreground-muted)]'}`}
            />
          </div>
          <div>
            <p className="font-medium text-[var(--card-foreground)]">
              {dragActive
                ? 'Drop screenshots here'
                : screenshots.length > 0
                  ? 'Add more screenshots'
                  : 'Drop screenshots here'}
            </p>
            <p className="text-sm text-[var(--foreground-muted)]">
              {screenshots.length > 0 ? 'Add multiple screenshots to capture the full page' : 'or click to browse'}
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={handlePasteFromClipboard}
          disabled={isAnalyzing}
          className={`focus-ring flex flex-1 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm font-medium text-[var(--card-foreground)] transition-colors hover:bg-[var(--background-secondary)] ${isAnalyzing ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          <i className="ri-clipboard-line" />
          <span>Paste</span>
          <kbd className="rounded border border-[var(--border)] bg-[var(--background-secondary)] px-1.5 py-0.5 text-xs text-[var(--foreground-muted)]">
            {navigator.platform.includes('Mac') ? '⌘V' : 'Ctrl+V'}
          </kbd>
        </button>

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || screenshots.length === 0}
          className={`focus-ring flex flex-1 items-center justify-center gap-2 rounded-md bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400 ${isAnalyzing || screenshots.length === 0 ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          {isAnalyzing ? (
            <>
              <i className="ri-loader-4-line animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <i className="ri-play-fill" />
              Analyze{screenshots.length > 0 ? ` (${screenshots.length})` : ''}
            </>
          )}
        </button>
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
