import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'vitest-axe';
import 'vitest-axe/extend-expect';
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
      setGrupo: vi.fn(),
      clearAllData: vi.fn(),
      estudiantes: []
    });
  });
  it('renders all group names and the title', () => {
    render(<Header activeTab="analysis" setActiveTab={() => {}} />);
    expect(screen.getByText('Dashboard de Consolidados')).toBeDefined();
    expect(screen.getByRole('button', { name: /General/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /Desempeño/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /Seguimiento/ })).toBeDefined();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Header activeTab="analysis" setActiveTab={() => {}} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('highlights the active group', () => {
    render(<Header activeTab="analysis" setActiveTab={() => {}} />);

    const generalGroupBtn = screen.getByRole('button', { name: /General/ });
    expect(generalGroupBtn.className).toContain('app-tab-active');
    
    const desempenoGroupBtn = screen.getByRole('button', { name: /Desempeño/ });
    expect(desempenoGroupBtn.className).not.toContain('app-tab-active');
  });

  it('calls setActiveTab when a tab is clicked', () => {
    const setActiveTab = vi.fn();
    render(<Header activeTab="analysis" setActiveTab={setActiveTab} />);
    
    // First open the group
    fireEvent.click(screen.getByRole('button', { name: /Desempeño/ }));
    
    // Then click the tab inside
    fireEvent.click(screen.getByText('Estadísticas'));
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
      setGrupo: vi.fn(),
      clearAllData: vi.fn(),
      estudiantes: []
    });
    render(<Header activeTab="analysis" setActiveTab={() => {}} />);
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('renders group selector if availableGroups > 1 and calls setGrupo', () => {
    const setGrupoMock = vi.fn();
    (useDashboardStore as any).mockReturnValue({
      availableGroups: ['Todos', 'A', 'B'],
      selectedGrupo: 'Todos',
      setGrupo: setGrupoMock,
      clearAllData: vi.fn(),
      estudiantes: []
    });
    render(<Header activeTab="analysis" setActiveTab={() => {}} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toBeDefined();
    
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    
    fireEvent.change(select, { target: { value: 'A' } });
    expect(setGrupoMock).toHaveBeenCalledWith('A');
  });

  it('renders Cerrar Archivo button when data is present and calls clearAllData on confirm', () => {
    const clearAllDataMock = vi.fn();
    (useDashboardStore as any).mockReturnValue({
      availableGroups: ['Todos'],
      selectedGrupo: 'Todos',
      setGrupo: vi.fn(),
      clearAllData: clearAllDataMock,
      estudiantes: [{ id: 1 }] // hasData becomes true
    });
    
    const confirmSpy = vi.spyOn(window, 'confirm');
    
    // Test confirm = true
    confirmSpy.mockReturnValueOnce(true);
    render(<Header activeTab="analysis" setActiveTab={() => {}} />);
    
    const closeBtn = screen.getByText('Cerrar Archivo');
    expect(closeBtn).toBeDefined();
    
    fireEvent.click(closeBtn);
    expect(confirmSpy).toHaveBeenCalledWith('¿Estás seguro de que deseas cerrar el archivo actual y limpiar los datos locales?');
    expect(clearAllDataMock).toHaveBeenCalledTimes(1);
    
    // Test confirm = false
    confirmSpy.mockReturnValueOnce(false);
    fireEvent.click(closeBtn);
    expect(clearAllDataMock).toHaveBeenCalledTimes(1); // not called again
    
    confirmSpy.mockRestore();
  });
});
