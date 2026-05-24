import { beforeEach, describe, expect, it, vi } from 'vitest';

const importFreshThemeStore = async () => {
  vi.resetModules();
  return import('./useThemeStore');
};

describe('useThemeStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to light mode when no preference is stored', async () => {
    const { useThemeStore } = await importFreshThemeStore();

    expect(useThemeStore.getState().mode).toBe('light');
  });

  it('falls back to light mode when the stored preference is invalid', async () => {
    localStorage.setItem('consolidados-theme-mode', 'system');

    const { useThemeStore } = await importFreshThemeStore();

    expect(useThemeStore.getState().mode).toBe('light');
  });

  it('sets and persists an explicit dark mode preference', async () => {
    const { THEME_STORAGE_KEY, useThemeStore } = await importFreshThemeStore();

    useThemeStore.getState().setMode('dark');

    expect(useThemeStore.getState().mode).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('toggles between light and dark mode and persists the selected mode', async () => {
    const { THEME_STORAGE_KEY, useThemeStore } = await importFreshThemeStore();

    useThemeStore.getState().toggleMode();
    expect(useThemeStore.getState().mode).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    useThemeStore.getState().toggleMode();
    expect(useThemeStore.getState().mode).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });
});
