import { useState } from 'react';
import { getSettings, saveSettings, clearSettings } from '../store/settings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [apiKey, setApiKey] = useState(() => getSettings().apiKey);

  const handleSave = () => {
    saveSettings({ apiKey });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  const handleClear = () => {
    clearSettings();
    setApiKey('');
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="card animate-in fade-in zoom-in-95 w-full max-w-md duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <h2 className="text-lg font-semibold text-[var(--card-foreground)]">Settings</h2>
          <button
            onClick={onClose}
            className="focus-ring flex h-8 w-8 items-center justify-center rounded-md text-[var(--foreground-muted)] transition-colors hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]"
          >
            <i className="ri-close-line ri-lg" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 p-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--card-foreground)]">OpenAI API Key</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="focus-ring h-10 w-full rounded-md border border-[var(--input)] bg-[var(--card)] px-3 pr-10 text-sm text-[var(--card-foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)]"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute top-1/2 right-2 -translate-y-1/2 p-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              >
                <i className={showKey ? 'ri-eye-off-line' : 'ri-eye-line'} />
              </button>
            </div>
            <p className="text-xs text-[var(--foreground-muted)]">
              Your API key is stored locally and never sent to our servers.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] px-6 py-4">
          <button
            onClick={handleClear}
            className="focus-ring h-9 rounded-md border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-medium text-[var(--card-foreground)] transition-colors hover:bg-[var(--background-secondary)]"
          >
            Clear
          </button>
          <button
            onClick={handleSave}
            disabled={saved}
            className="focus-ring h-9 rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:bg-teal-700 disabled:opacity-70 dark:hover:bg-teal-400"
          >
            {saved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
