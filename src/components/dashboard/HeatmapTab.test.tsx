import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { HeatmapTab } from './HeatmapTab';
import { useDashboardStore } from '../../store/useDashboardStore';

describe('HeatmapTab', () => {
  const testRowsAsignatura = [
    // H1 has 3 failing grades -> Hundido
    { estudiante: 'H1', grupo: '10A', asignatura: 'ALG', promActual: 1.5, estado: { text: 'Perdido', color: 'red' } },
    { estudiante: 'H1', grupo: '10A', asignatura: 'FIS', promActual: 2.5, estado: { text: 'Perdido', color: 'red' } },
    { estudiante: 'H1', grupo: '10A', asignatura: 'QUI', promActual: 2.9, estado: { text: 'En riesgo', color: 'orange' } },
    // H2 is average
    { estudiante: 'H2', grupo: '10A', asignatura: 'ALG', promActual: 3.5, estado: { text: 'Aprobado', color: 'green' } },
    { estudiante: 'H2', grupo: '10A', asignatura: 'FIS', promActual: 3.9, estado: { text: 'Aprobado', color: 'green' } },
    // H3 is excellent
    { estudiante: 'H3', grupo: '10A', asignatura: 'ALG', promActual: 4.8, estado: { text: 'Excelente', color: 'blue' } },
    { estudiante: 'H3', grupo: '10A', asignatura: 'FIS', promActual: 4.2, estado: { text: 'Excelente', color: 'blue' } },
    // H4 has null value
    { estudiante: 'H4', grupo: '10B', asignatura: 'FIS', promActual: null, estado: { text: '', color: '' } },
  ];

  beforeEach(() => {
    useDashboardStore.setState({
      rowsAsignatura: testRowsAsignatura as any,
      selectedGrupo: 'Todos',
      availableGroups: ['Todos', '10A', '10B'],
      setGrupo: (g: string) => useDashboardStore.setState({ selectedGrupo: g })
    });
  });

  it('renders empty state when no data', () => {
    useDashboardStore.setState({ rowsAsignatura: [] });
    render(<HeatmapTab />);
    expect(screen.getByText('No hay datos para mostrar el Mapa de Calor.')).toBeInTheDocument();
  });

  it('has no accessibility violations when empty', async () => {
    useDashboardStore.setState({ rowsAsignatura: [] });
    const { container } = render(<HeatmapTab />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations with data', async () => {
    const { container } = render(<HeatmapTab />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders heatmap with data and handles "hundido" logic', () => {
    render(<HeatmapTab />);
    
    // Check students are rendered
    expect(screen.getByText('H1')).toBeInTheDocument();
    expect(screen.getByText('H2')).toBeInTheDocument();
    expect(screen.getByText('H3')).toBeInTheDocument();
    
    // H1 should have "3 rojas" badge
    expect(screen.getByText('3 rojas')).toBeInTheDocument();
    
    // Check subject columns
    expect(screen.getByText('ALG')).toBeInTheDocument();
    expect(screen.getByText('FIS')).toBeInTheDocument();
    expect(screen.getByText('QUI')).toBeInTheDocument();
    
    // Check cell values
    expect(screen.getByText('1.5')).toBeInTheDocument();
    expect(screen.getByText('2.5')).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();
    
    // Check mortality row (ALG: 1 fail out of 3 = 33%, FIS: 1 fail out of 3 = 33%, QUI: 1 fail out of 1 = 100%)
    expect(screen.getAllByText('33%').length).toBe(2);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('toggles color modes (heatmap vs status)', async () => {
    render(<HeatmapTab />);
    
    const heatmapBtn = screen.getByText('🔥 Calor Numérico');
    const statusBtn = screen.getByText('🚦 Estado');
    
    // In heatmap mode by default, wait, I can check classes of a cell if I want but text testing is easier
    // We can just verify the buttons work
    await userEvent.click(statusBtn);
    expect(statusBtn).toHaveClass('bg-white'); // Active class
    
    await userEvent.click(heatmapBtn);
    expect(heatmapBtn).toHaveClass('bg-white');
  });

  it('filters by group', async () => {
    render(<HeatmapTab />);
    
    expect(screen.getByText('H1')).toBeInTheDocument(); // 10A
    expect(screen.getByText('H4')).toBeInTheDocument(); // 10B
    
    const select = screen.getByRole('combobox');
    await userEvent.selectOptions(select, '10B');
    
    expect(screen.queryByText('H1')).not.toBeInTheDocument();
    expect(screen.getByText('H4')).toBeInTheDocument();
  });
});
