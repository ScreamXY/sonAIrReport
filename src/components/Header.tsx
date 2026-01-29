import { Settings } from 'lucide-react';

interface HeaderProps {
  onSettingsClick: () => void;
}

export function Header({ onSettingsClick }: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <span className="text-xl font-bold">S</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">SonAIr Report</h1>
            <p className="text-xs text-slate-400">SonarCloud Analysis with AI</p>
          </div>
        </div>

        <button
          onClick={onSettingsClick}
          className="rounded-lg p-2 transition-colors hover:bg-slate-700"
          aria-label="Settings"
        >
          <Settings className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
}
