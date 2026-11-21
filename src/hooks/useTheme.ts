import { useCallback, useEffect, useState } from 'react';
import {
  getSavedThemePreference,
  saveThemePreference,
  type ThemeMode,
} from '../storage/ledgerStorage';

function applyThemeToDocument(theme: ThemeMode): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
  const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
  if (colorSchemeMeta) {
    colorSchemeMeta.setAttribute('content', theme);
  }
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', theme === 'dark' ? '#0B1220' : '#2196F3');
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => getSavedThemePreference());

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'daily_ledger_theme' && (e.newValue === 'light' || e.newValue === 'dark')) {
        setThemeState(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    saveThemePreference(next);
    applyThemeToDocument(next);
  }, []);

  return { theme, setTheme };
}
