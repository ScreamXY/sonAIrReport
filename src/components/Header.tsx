import { Settings } from 'lucide-react'

interface HeaderProps {
  onSettingsClick: () => void
}

export function Header({ onSettingsClick }: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-xl font-bold">S</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">SonAIr Report</h1>
            <p className="text-xs text-slate-400">SonarCloud Analysis with AI</p>
          </div>
        </div>

        <button
          onClick={onSettingsClick}
          className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-6 h-6" />
        </button>
      </div>
    </header>
  )
}
