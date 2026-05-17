import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChartsTab } from './ChartsTab';
import { useDashboardStore } from '../../store/useDashboardStore';

// Mock chart.js to prevent canvas errors in jsdom
vi.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="bar-chart">Bar Chart</div>,
  Pie: () => <div data-testid="pie-chart">Pie Chart</div>
}));

describe('ChartsTab', () => {
  it('renders empty state when no students', () => {
    useDashboardStore.setState({ estudiantes: [] });
    render(<ChartsTab />);
    expect(screen.getByText('No hay datos para visualizar. Cargue un archivo Excel.')).toBeTruthy();
  });

  it('renders charts when students exist', () => {
    useDashboardStore.setState({ 
      estudiantes: [{ id: '1', nombre: 'Test', notas: [] } as any],
      rowsArea: [
        { area: 'AREA_1', promActual: 10, estado: { text: 'Ganado', color: 'green' }, estudiante: '1', defP1: 10, defP2: 10 } as any
      ]
    });
    
    render(<ChartsTab />);
    expect(screen.getByText('Visualización de Rendimiento')).toBeTruthy();
    expect(screen.getByTestId('bar-chart')).toBeTruthy();
    expect(screen.getByTestId('pie-chart')).toBeTruthy();
  });
});
