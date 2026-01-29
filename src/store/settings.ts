import type { Settings } from '../types/index'

const STORAGE_KEY = 'sonar-analyzer-settings'

export const getSettings = (): Settings => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return { apiKey: '' }
    }
  }
  return { apiKey: '' }
}

export const saveSettings = (settings: Settings): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export const clearSettings = (): void => {
  localStorage.removeItem(STORAGE_KEY)
}
