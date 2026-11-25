import { createContext, useContext } from 'react';

export const SUPPORTED_THEMES = ['light', 'dark'] as const;
export type ThemeMode = (typeof SUPPORTED_THEMES)[number];

export const THEME_STORAGE_KEY = 'algomiri.theme';
export const DEFAULT_THEME: ThemeMode = 'light';

export interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (next: ThemeMode) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  setTheme: () => undefined,
  toggleTheme: () => undefined,
});

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark';
}

function getBrowserStorage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

export function readStoredTheme(
  storage?: Pick<Storage, 'getItem'>,
): ThemeMode {
  const safeStorage = storage ?? getBrowserStorage();
  if (!safeStorage) return DEFAULT_THEME;
  try {
    const stored = safeStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function persistTheme(
  theme: ThemeMode,
  storage?: Pick<Storage, 'setItem'>,
) {
  const safeStorage = storage ?? getBrowserStorage();
  if (!safeStorage) return;
  try {
    safeStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Theme switching still works in memory when storage is unavailable or blocked.
  }
}

export function applyDocumentTheme(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
}
