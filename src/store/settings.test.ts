import { describe, it, expect, beforeEach } from 'vitest';
import { getSettings, saveSettings, clearSettings } from './settings';

describe('settings store', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('getSettings', () => {
    it('should return default settings when nothing is stored', () => {
      const settings = getSettings();
      expect(settings).toEqual({ apiKey: '' });
    });

    it('should return stored settings', () => {
      localStorage.setItem('sonar-analyzer-settings', JSON.stringify({ apiKey: 'sk-test-key' }));

      const settings = getSettings();
      expect(settings.apiKey).toBe('sk-test-key');
    });

    it('should return default settings when stored data is invalid JSON', () => {
      localStorage.setItem('sonar-analyzer-settings', 'invalid json');

      const settings = getSettings();
      expect(settings).toEqual({ apiKey: '' });
    });
  });

  describe('saveSettings', () => {
    it('should save settings to localStorage', () => {
      saveSettings({ apiKey: 'sk-new-key' });

      const stored = localStorage.getItem('sonar-analyzer-settings');
      expect(stored).toBe(JSON.stringify({ apiKey: 'sk-new-key' }));
    });

    it('should overwrite existing settings', () => {
      saveSettings({ apiKey: 'sk-first-key' });
      saveSettings({ apiKey: 'sk-second-key' });

      const settings = getSettings();
      expect(settings.apiKey).toBe('sk-second-key');
    });
  });

  describe('clearSettings', () => {
    it('should remove settings from localStorage', () => {
      saveSettings({ apiKey: 'sk-test-key' });
      clearSettings();

      const stored = localStorage.getItem('sonar-analyzer-settings');
      expect(stored).toBeNull();
    });

    it('should result in default settings after clearing', () => {
      saveSettings({ apiKey: 'sk-test-key' });
      clearSettings();

      const settings = getSettings();
      expect(settings).toEqual({ apiKey: '' });
    });
  });
});
