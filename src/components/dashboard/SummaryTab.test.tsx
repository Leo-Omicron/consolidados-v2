import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SummaryTab, thresholdLinePlugin } from './SummaryTab';
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

describe('SummaryTab', () => {
  it('renders an empty state when there are no students', () => {
    useDashboardStore.setState({
      estudiantes: [],
      config: { P1: 25, P2: 25, P3: 25, P4: 25 },
    });
    render(<SummaryTab />);
    expect(screen.getByText('No hay datos para visualizar. Cargue un archivo Excel.')).toBeDefined();
  });

  it('has no accessibility violations when empty', async () => {
    useDashboardStore.setState({
      estudiantes: [],
      config: { P1: 25, P2: 25, P3: 25, P4: 25 },
    });
    const { container } = render(<SummaryTab />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations with data', async () => {
    useDashboardStore.setState({
      estudiantes: [
        {
          id: '1', nombre: 'Ana', grupo: '10A', areas: {
            'Matemáticas': { DEF: { P1: 3.5, P2: null, P3: null, P4: null, A: null }, areaStats: { promedioActual: 3.5, p4Min: 0, estado: { text: 'Ganado', color: 'green' } }, asignaturas: {} }
          }
        }
      ],
      config: { P1: 100, P2: 0, P3: 0, P4: 0 },
    });
    const { container } = render(<SummaryTab />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  describe('Reactive KPIs and Charts', () => {
    const testStudents = [
      { id: 'JUAN', name: 'JUAN', CURSO: '10A', grupo: '10A', areas: {
        MATEMATICAS: { name: 'MATEMATICAS', areaStats: { promedioActual: 3.5 } },
        HUMANIDADES: { name: 'HUMANIDADES', areaStats: { promedioActual: 4.0 } }
      }},
      { id: 'MARIA', name: 'MARIA', CURSO: '10A', grupo: '10A', areas: {
        MATEMATICAS: { name: 'MATEMATICAS', areaStats: { promedioActual: 2.0 } },
        HUMANIDADES: { name: 'HUMANIDADES', areaStats: { promedioActual: 2.5 } },
        CIENCIAS: { name: 'CIENCIAS', areaStats: { promedioActual: 1.5 } }
      }},
      { id: 'PEDRO', name: 'PEDRO', CURSO: '10B', grupo: '10B', areas: {
        MATEMATICAS: { name: 'MATEMATICAS', areaStats: { promedioActual: 4.5 } }
      }}
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
      render(<SummaryTab />);

      expect(screen.getByText('Promedio Grupal')).toBeTruthy();
      expect(screen.getByText('Aprobados')).toBeTruthy();
      expect(screen.getByText('Alumnos Críticos')).toBeTruthy();

      expect(screen.getByText('3.0')).toBeTruthy();
      expect(screen.getByText('66.7%')).toBeTruthy();
      expect(screen.getByText('1')).toBeTruthy();
    });

    it('reacts to selectedGrupo changes', () => {
      render(<SummaryTab />);

      expect(screen.getByText('3.0')).toBeTruthy();

      act(() => {
        useDashboardStore.setState({ selectedGrupo: '10A' });
      });

      expect(screen.getAllByText('2.7').length).toBeGreaterThan(0);
      expect(screen.getAllByText('50.0%').length).toBeGreaterThan(0);
      expect(screen.getAllByText('1').length).toBeGreaterThan(0);
    });

    it('reacts to viewMode toggles', () => {
      render(<SummaryTab />);

      act(() => {
        useDashboardStore.setState({ viewMode: 'subject' });
      });

      expect(screen.getAllByText('3.0').length).toBeGreaterThan(0);
      expect(screen.getAllByText('66.7%').length).toBeGreaterThan(0);
      expect(screen.getAllByText('1').length).toBeGreaterThan(0);
    });

    it('feeds group-isolated data to Bar and Pie charts', () => {
      useDashboardStore.setState({ selectedGrupo: '10B' });
      render(<SummaryTab />);

      const barElements = screen.getAllByTestId('bar-chart');
      const pieElement = screen.getByTestId('pie-chart');

      const barData = JSON.parse(barElements[0].getAttribute('data-data') || '{}');
      const pieData = JSON.parse(pieElement.getAttribute('data-data') || '{}');

      expect(barData.labels).toContain('MATEMATICAS');
      expect(barData.datasets[0].data).toContain(4.5);

      expect(pieData.datasets[0].data).toEqual([1, 0]);
    });

    it('labels the chart panels so chart surfaces remain navigable', () => {
      render(<SummaryTab />);

      expect(screen.getByRole('region', { name: 'Promedio General por Área' })).toBeTruthy();
      expect(screen.getByRole('region', { name: 'Distribución de Estados Por Área' })).toBeTruthy();
    });

    it('passes readable light-theme text and grid colors to Chart.js options', () => {
      useThemeStore.setState({ mode: 'light' });
      render(<SummaryTab />);

      const barElements = screen.getAllByTestId('bar-chart');
      const barOptions = JSON.parse(barElements[0].getAttribute('data-options') || '{}');
      const pieOptions = JSON.parse(screen.getByTestId('pie-chart').getAttribute('data-options') || '{}');

      expect(barOptions.scales.y.ticks.color).toBe('#475569');
      expect(barOptions.scales.y.grid.color).toBe('rgba(148, 163, 184, 0.28)');
      expect(pieOptions.plugins.legend.labels.color).toBe('#475569');
    });

    it('passes readable dark-theme text and grid colors to Chart.js options', () => {
      useThemeStore.setState({ mode: 'dark' });
      render(<SummaryTab />);

      const barElements = screen.getAllByTestId('bar-chart');
      const barOptions = JSON.parse(barElements[0].getAttribute('data-options') || '{}');
      const pieOptions = JSON.parse(screen.getByTestId('pie-chart').getAttribute('data-options') || '{}');

      expect(barOptions.scales.y.ticks.color).toBe('#cbd5e1');
      expect(barOptions.scales.y.grid.color).toBe('rgba(148, 163, 184, 0.22)');
      expect(pieOptions.plugins.legend.labels.color).toBe('#cbd5e1');
    });
  });

  describe('thresholdLinePlugin', () => {
    it('draws a threshold line at 3.0', () => {
      const mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        setLineDash: vi.fn(),
        fillText: vi.fn(),
      };
      
      const mockChart = {
        ctx: mockCtx,
        chartArea: { left: 10, right: 100 },
        scales: {
          y: {
            getPixelForValue: vi.fn().mockReturnValue(50)
          }
        }
      };

      thresholdLinePlugin.afterDraw(mockChart as any);

      expect(mockChart.scales.y.getPixelForValue).toHaveBeenCalledWith(3.0);
      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.moveTo).toHaveBeenCalledWith(10, 50);
      expect(mockCtx.lineTo).toHaveBeenCalledWith(100, 50);
      expect(mockCtx.stroke).toHaveBeenCalled();
      expect(mockCtx.fillText).toHaveBeenCalledWith('Mínimo: 3.0', 18, 44);
      expect(mockCtx.restore).toHaveBeenCalled();
    });
  });
});
