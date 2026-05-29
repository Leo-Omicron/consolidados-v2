import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChartsTab } from './ChartsTab';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useThemeStore } from '../../store/useThemeStore';

// Mock react-chartjs-2 to capture props and check isolated datasets
vi.mock('react-chartjs-2', () => ({
  Bar: (props: any) => (
    <div
      data-testid="bar-chart"
      data-data={JSON.stringify(props.data)}
      data-options={JSON.stringify(props.options)}
    >
      Bar Chart: {props.data?.datasets?.[0]?.label}
    </div>
  ),
  Pie: (props: any) => (
    <div
      data-testid="pie-chart"
      data-data={JSON.stringify(props.data)}
      data-options={JSON.stringify(props.options)}
    >
      Pie Chart
    </div>
  )
}));

describe('ChartsTab', () => {
  it('renders empty state when no students', () => {
    useDashboardStore.setState({ estudiantes: [] });
    render(<ChartsTab />);
    expect(screen.getByText('No hay datos para visualizar. Cargue un archivo Excel.')).toBeTruthy();
  });

  describe('Reactive KPIs and Charts', () => {
    const testStudents = [
      { id: 'JUAN', name: 'JUAN', CURSO: '10A', grupo: '10A', areas: {} },
      { id: 'MARIA', name: 'MARIA', CURSO: '10A', grupo: '10A', areas: {} },
      { id: 'PEDRO', name: 'PEDRO', CURSO: '10B', grupo: '10B', areas: {} }
    ];

    const testRowsArea = [
      { estudiante: 'JUAN', grupo: '10A', area: 'MATEMATICAS', promActual: 3.5, estado: { text: 'Ganado', color: 'green' }, defP1: 3.5, defP2: 3.5, defP3: 3.5 },
      { estudiante: 'JUAN', grupo: '10A', area: 'HUMANIDADES', promActual: 4.0, estado: { text: 'Ganado', color: 'green' }, defP1: 4.0, defP2: 4.0, defP3: 4.0 },
      { estudiante: 'MARIA', grupo: '10A', area: 'MATEMATICAS', promActual: 2.0, estado: { text: 'Perdido', color: 'red' }, defP1: 2.0, defP2: 2.0, defP3: 2.0 },
      { estudiante: 'MARIA', grupo: '10A', area: 'HUMANIDADES', promActual: 2.5, estado: { text: 'Perdido', color: 'red' }, defP1: 2.5, defP2: 2.5, defP3: 2.5 },
      { estudiante: 'MARIA', grupo: '10A', area: 'CIENCIAS', promActual: 1.5, estado: { text: 'Perdido', color: 'red' }, defP1: 1.5, defP2: 1.5, defP3: 1.5 },
      { estudiante: 'PEDRO', grupo: '10B', area: 'MATEMATICAS', promActual: 4.5, estado: { text: 'Ganado', color: 'green' }, defP1: 4.5, defP2: 4.5, defP3: 4.5 }
    ];

    const testRowsAsignatura = [
      { estudiante: 'JUAN', grupo: '10A', asignatura: 'ALGEBRA', promActual: 3.5, estado: { text: 'Ganado', color: 'green' }, p1: 3.5, p2: 3.5, p3: 3.5 },
      { estudiante: 'JUAN', grupo: '10A', asignatura: 'LECTURA', promActual: 4.0, estado: { text: 'Ganado', color: 'green' }, p1: 4.0, p2: 4.0, p3: 4.0 },
      { estudiante: 'MARIA', grupo: '10A', asignatura: 'ALGEBRA', promActual: 2.0, estado: { text: 'Perdido', color: 'red' }, p1: 2.0, p2: 2.0, p3: 2.0 },
      { estudiante: 'MARIA', grupo: '10A', asignatura: 'LECTURA', promActual: 2.5, estado: { text: 'Perdido', color: 'red' }, p1: 2.5, p2: 2.5, p3: 2.5 },
      { estudiante: 'MARIA', grupo: '10A', asignatura: 'QUIMICA', promActual: 1.5, estado: { text: 'Perdido', color: 'red' }, p1: 1.5, p2: 1.5, p3: 1.5 },
      { estudiante: 'PEDRO', grupo: '10B', asignatura: 'ALGEBRA', promActual: 4.5, estado: { text: 'Ganado', color: 'green' }, p1: 4.5, p2: 4.5, p3: 4.5 }
    ];

    beforeEach(() => {
      useThemeStore.setState({ mode: 'light' });
      useDashboardStore.setState({
        estudiantes: testStudents as any,
        rowsArea: testRowsArea as any,
        rowsAsignatura: testRowsAsignatura as any,
        selectedGrupo: 'Todos',
        viewMode: 'area'
      });
    });

    it('renders 3 KPI cards correctly', () => {
      render(<ChartsTab />);

      expect(screen.getByText('Promedio Grupal')).toBeTruthy();
      expect(screen.getByText('Aprobados')).toBeTruthy();
      expect(screen.getByText('Alumnos Críticos')).toBeTruthy();

      // Expected values for Todos + Area mode
      // General average: 18.0 / 6 = 3.0
      // Success rate: 2 out of 3 students are >= 3.0 (JUAN and PEDRO) = 66.7%
      // Critical students: 1 student (MARIA has 3 failed areas)
      expect(screen.getByText('3.0')).toBeTruthy();
      expect(screen.getByText('66.7%')).toBeTruthy();
      expect(screen.getByText('1')).toBeTruthy();
    });

    it('reacts to selectedGrupo changes', () => {
      render(<ChartsTab />);

      // Initially 'Todos'
      expect(screen.getByText('3.0')).toBeTruthy();

      // Change store to grupo '10A'
      useDashboardStore.setState({ selectedGrupo: '10A' });
      render(<ChartsTab />);

      // Group average: (3.5 + 4.0 + 2.0 + 2.5 + 1.5) / 5 = 13.5 / 5 = 2.7
      // Success rate: 1 out of 2 students (JUAN) = 50.0%
      // Critical students: 1
      expect(screen.getAllByText('2.7').length).toBeGreaterThan(0);
      expect(screen.getAllByText('50.0%').length).toBeGreaterThan(0);
      expect(screen.getAllByText('1').length).toBeGreaterThan(0);
    });

    it('reacts to viewMode toggles', () => {
      render(<ChartsTab />);

      // Switch to subject viewMode
      useDashboardStore.setState({ viewMode: 'subject' });
      render(<ChartsTab />);

      // Subject-level calculation for 'Todos':
      // Rows total: 6. Averages: 3.5, 4.0, 2.0, 2.5, 1.5, 4.5.
      // Average: 18.0 / 6 = 3.0.
      // Success rate: 2 of 3 students are >= 3.0 (JUAN: 3.75 average, PEDRO: 4.5 average) = 66.7%
      // Critical students: 1 (MARIA) - determined by complete Areas dataset under the Regla de Oro
      expect(screen.getAllByText('3.0').length).toBeGreaterThan(0);
      expect(screen.getAllByText('66.7%').length).toBeGreaterThan(0);
      expect(screen.getAllByText('1').length).toBeGreaterThan(0);
    });

    it('feeds group-isolated data to Bar and Pie charts', () => {
      useDashboardStore.setState({ selectedGrupo: '10B' });
      render(<ChartsTab />);

      // There are now 2 Bar charts (area + group comparison), use getAllByTestId
      const barElements = screen.getAllByTestId('bar-chart');
      const pieElement = screen.getByTestId('pie-chart');

      const barData = JSON.parse(barElements[0].getAttribute('data-data') || '{}');
      const pieData = JSON.parse(pieElement.getAttribute('data-data') || '{}');

      // For 10B, only PEDRO exists. Area MATEMATICAS = 4.5
      expect(barData.labels).toContain('MATEMATICAS');
      expect(barData.datasets[0].data).toContain(4.5);

      // Pie chart status ratio: 1 Aprobado, 0 Reprobados for PEDRO
      expect(pieData.datasets[0].data).toEqual([1, 0]);
    });

    it('labels the chart panels so chart surfaces remain navigable', () => {
      render(<ChartsTab />);

      expect(screen.getByRole('region', { name: 'Promedio General por Área' })).toBeTruthy();
      expect(screen.getByRole('region', { name: 'Distribución de Estados Por Área' })).toBeTruthy();
    });

    it('passes readable light-theme text and grid colors to Chart.js options', () => {
      useThemeStore.setState({ mode: 'light' });
      render(<ChartsTab />);

      const barElements = screen.getAllByTestId('bar-chart');
      const barOptions = JSON.parse(barElements[0].getAttribute('data-options') || '{}');
      const pieOptions = JSON.parse(screen.getByTestId('pie-chart').getAttribute('data-options') || '{}');

      expect(barOptions.scales.y.ticks.color).toBe('#475569');
      expect(barOptions.scales.y.grid.color).toBe('rgba(148, 163, 184, 0.28)');
      expect(pieOptions.plugins.legend.labels.color).toBe('#475569');
    });

    it('passes readable dark-theme text and grid colors to Chart.js options', () => {
      useThemeStore.setState({ mode: 'dark' });
      render(<ChartsTab />);

      const barElements = screen.getAllByTestId('bar-chart');
      const barOptions = JSON.parse(barElements[0].getAttribute('data-options') || '{}');
      const pieOptions = JSON.parse(screen.getByTestId('pie-chart').getAttribute('data-options') || '{}');

      expect(barOptions.scales.y.ticks.color).toBe('#cbd5e1');
      expect(barOptions.scales.y.grid.color).toBe('rgba(148, 163, 184, 0.22)');
      expect(pieOptions.plugins.legend.labels.color).toBe('#cbd5e1');
    });
  });
});
