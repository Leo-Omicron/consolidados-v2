import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from './Header';
import { useDashboardStore } from '../../store/useDashboardStore';
import { THEME_STORAGE_KEY, useThemeStore } from '../../store/useThemeStore';

vi.mock('../../store/useDashboardStore', () => ({
  useDashboardStore: vi.fn()
}));

describe('Header', () => {
  beforeEach(() => {
    localStorage.clear();
    useThemeStore.getState().setMode('light');
    (useDashboardStore as any).mockReturnValue({
      availableGroups: [],
      selectedGrupo: 'Todos',
      setGrupo: vi.fn()
    });
  });
  it('renders all tabs and the title', () => {
    render(<Header activeTab="analysis" setActiveTab={() => {}} />);
    expect(screen.getByText('Dashboard de Consolidados')).toBeDefined();
    expect(screen.getByText('Analysis')).toBeDefined();
    expect(screen.getByText('Charts')).toBeDefined();
    expect(screen.getByText('Reports')).toBeDefined();
  });

  it('exposes the active tab to assistive technology', () => {
    render(<Header activeTab="analysis" setActiveTab={() => {}} />);

    expect(screen.getByRole('button', { name: 'Analysis' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('button', { name: 'Charts' }).getAttribute('aria-current')).toBeNull();
  });

  it('calls setActiveTab when a tab is clicked', () => {
    const setActiveTab = vi.fn();
    render(<Header activeTab="analysis" setActiveTab={setActiveTab} />);
    
    fireEvent.click(screen.getByText('Charts'));
    expect(setActiveTab).toHaveBeenCalledWith('charts');
  });

  it('renders a theme toggle with the current light mode state', () => {
    render(<Header activeTab="analysis" setActiveTab={() => {}} />);

    const toggle = screen.getByRole('button', { name: 'Switch to dark mode' });
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    expect(toggle.textContent).toContain('Light');
  });

  it('toggles to dark mode and persists the user preference', () => {
    render(<Header activeTab="analysis" setActiveTab={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }));

    const toggle = screen.getByRole('button', { name: 'Switch to light mode' });
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(toggle.textContent).toContain('Dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('keeps keyboard focus visible on the theme toggle', () => {
    render(<Header activeTab="analysis" setActiveTab={() => {}} />);

    const toggle = screen.getByRole('button', { name: 'Switch to dark mode' });
    toggle.focus();

    expect(document.activeElement).toBe(toggle);
    expect(toggle.className).toContain('app-focus');
  });

  it('does not render group selector if availableGroups has 1 or fewer elements', () => {
    (useDashboardStore as any).mockReturnValue({
      availableGroups: ['Todos'],
      selectedGrupo: 'Todos',
      setGrupo: vi.fn()
    });
    render(<Header activeTab="analysis" setActiveTab={() => {}} />);
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('renders group selector if availableGroups > 1 and calls setGrupo', () => {
    const setGrupoMock = vi.fn();
    (useDashboardStore as any).mockReturnValue({
      availableGroups: ['Todos', 'A', 'B'],
      selectedGrupo: 'Todos',
      setGrupo: setGrupoMock
    });
    render(<Header activeTab="analysis" setActiveTab={() => {}} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toBeDefined();
    
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    
    fireEvent.change(select, { target: { value: 'A' } });
    expect(setGrupoMock).toHaveBeenCalledWith('A');
  });
});
