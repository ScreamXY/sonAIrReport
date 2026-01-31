import { useState, useLayoutEffect } from 'react';
import { getTheme, toggleTheme, applyTheme } from '../store/theme';

interface HeaderProps {
  onSettingsClick: () => void;
}

export function Header({ onSettingsClick }: HeaderProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>(getTheme);

  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleToggleTheme = () => {
    const newTheme = toggleTheme();
    setTheme(newTheme);
  };

  return (
    <header className="border-b border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          {/* Logo mark with teal accent */}
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 shadow-md shadow-teal-500/20">
            <i className="ri-radar-line ri-lg text-white" />
          </div>

          <div>
            <h1 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">SonAIr Report</h1>
            <p className="text-xs text-[var(--foreground-muted)]">SonarCloud Analysis with AI</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={handleToggleTheme}
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg text-[var(--foreground-muted)] transition-colors hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <i className="ri-sun-line ri-lg" /> : <i className="ri-moon-line ri-lg" />}
          </button>

          {/* Settings */}
          <button
            onClick={onSettingsClick}
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg text-[var(--foreground-muted)] transition-colors hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]"
            aria-label="Settings"
          >
            <i className="ri-settings-3-line ri-lg" />
          </button>
        </div>
      </div>
    </header>
  );
}
