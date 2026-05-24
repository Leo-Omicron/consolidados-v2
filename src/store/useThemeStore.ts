import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'consolidados-theme-mode';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const isThemeMode = (value: string | null): value is ThemeMode => value === 'light' || value === 'dark';

const readStoredThemeMode = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  try {
    const storedMode = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(storedMode) ? storedMode : 'light';
  } catch {
    return 'light';
  }
};

const persistThemeMode = (mode: ThemeMode) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // Theme persistence should never block rendering.
  }
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: readStoredThemeMode(),

  setMode: (mode) => {
    persistThemeMode(mode);
    set({ mode });
  },

  toggleMode: () => {
    const nextMode = get().mode === 'light' ? 'dark' : 'light';
    persistThemeMode(nextMode);
    set({ mode: nextMode });
  },
}));
