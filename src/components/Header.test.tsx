import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from './Header';

describe('Header', () => {
  it('should render the app title', () => {
    render(<Header onSettingsClick={() => {}} />);

    expect(screen.getByText('SonAIr Report')).toBeInTheDocument();
    expect(screen.getByText('SonarCloud Analysis with AI')).toBeInTheDocument();
  });

  it('should render the settings button', () => {
    render(<Header onSettingsClick={() => {}} />);

    const settingsButton = screen.getByRole('button', { name: /settings/i });
    expect(settingsButton).toBeInTheDocument();
  });

  it('should call onSettingsClick when settings button is clicked', () => {
    const handleClick = vi.fn();
    render(<Header onSettingsClick={handleClick} />);

    const settingsButton = screen.getByRole('button', { name: /settings/i });
    fireEvent.click(settingsButton);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
