import { useState, useCallback, useEffect } from 'react';
import { Upload, Image, AlertCircle, Clipboard, X, Play, Images } from 'lucide-react';

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
        e.target.value = ''; // Reset input to allow selecting same file again
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
            <span className="text-sm font-medium text-slate-700">
              <Images className="mr-1 inline h-4 w-4" />
              {screenshots.length} screenshot{screenshots.length > 1 ? 's' : ''} ready
            </span>
            <button onClick={clearAll} disabled={isAnalyzing} className="text-xs text-red-600 hover:text-red-700">
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {screenshots.map((src, index) => (
              <div key={index} className="group relative">
                <img
                  src={src}
                  alt={`Screenshot ${index + 1}`}
                  className="h-20 w-auto rounded-lg border border-slate-200 object-cover"
                />
                <button
                  onClick={() => removeScreenshot(index)}
                  disabled={isAnalyzing}
                  className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
                <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-xs text-white">
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
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
        } ${isAnalyzing ? 'pointer-events-none opacity-50' : ''} `}
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
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100">
            {dragActive ? <Image className="h-6 w-6 text-blue-600" /> : <Upload className="h-6 w-6 text-slate-400" />}
          </div>
          <div>
            <p className="font-medium text-slate-700">
              {dragActive
                ? 'Drop screenshots here'
                : screenshots.length > 0
                  ? 'Add more screenshots'
                  : 'Add SonarCloud Screenshots'}
            </p>
            <p className="text-sm text-slate-500">
              {screenshots.length > 0
                ? 'Scroll through the page and add multiple screenshots'
                : 'Drag & drop, click to browse, or paste from clipboard'}
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handlePasteFromClipboard}
          disabled={isAnalyzing}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 ${isAnalyzing ? 'cursor-not-allowed opacity-50' : ''} `}
        >
          <Clipboard className="h-4 w-4" />
          <span>Paste</span>
          <kbd className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-xs">
            {navigator.platform.includes('Mac') ? '⌘V' : 'Ctrl+V'}
          </kbd>
        </button>

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || screenshots.length === 0}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-md transition-opacity hover:opacity-90 ${isAnalyzing || screenshots.length === 0 ? 'cursor-not-allowed opacity-50' : ''} `}
        >
          <Play className="h-4 w-4" />
          {isAnalyzing ? 'Analyzing...' : `Analyze${screenshots.length > 0 ? ` (${screenshots.length})` : ''}`}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}
