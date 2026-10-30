import type { Settings } from '../types';

const STORAGE_KEY = 'sonar-analyzer-settings';
const DEFAULT_SETTINGS: Settings = { apiKey: '' };

export const getSettings = (): Settings => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === null) {
    return DEFAULT_SETTINGS;
  }
  try {
    return JSON.parse(stored) as Settings;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: Settings): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};

export const clearSettings = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
