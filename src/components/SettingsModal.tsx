import { useState } from 'react';
import { X, Eye, EyeOff, Key, Save, Trash2 } from 'lucide-react';
import { getSettings, saveSettings, clearSettings } from '../store/settings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  // Initialize from settings on each render when open (controlled by parent)
  const [apiKey, setApiKey] = useState(() => getSettings().apiKey);

  const handleSave = () => {
    saveSettings({ apiKey });
    setSaved(true);
    setTimeout(() => onClose(), 1000);
  };

  const handleClear = () => {
    clearSettings();
    setApiKey('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button onClick={onClose} className="text-slate-400 transition-colors hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <Key className="h-4 w-4" />
              OpenAI API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Your API key is stored locally and never sent to our servers. Uses gpt-4o-mini model for screenshot
              analysis.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleClear}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-red-600 transition-colors hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </button>
            <button
              onClick={handleSave}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-white transition-opacity hover:opacity-90"
            >
              <Save className="h-4 w-4" />
              {saved ? 'Saved!' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
