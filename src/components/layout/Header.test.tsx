import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from './Header';
import { useDashboardStore } from '../../store/useDashboardStore';

vi.mock('../../store/useDashboardStore', () => ({
  useDashboardStore: vi.fn()
}));

describe('Header', () => {
  beforeEach(() => {
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

  it('calls setActiveTab when a tab is clicked', () => {
    const setActiveTab = vi.fn();
    render(<Header activeTab="analysis" setActiveTab={setActiveTab} />);
    
    fireEvent.click(screen.getByText('Charts'));
    expect(setActiveTab).toHaveBeenCalledWith('charts');
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
