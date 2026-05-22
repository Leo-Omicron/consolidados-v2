import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnalysisTab } from './AnalysisTab';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useAnalysisPipeline } from '../../hooks/useAnalysisPipeline';

vi.mock('../../store/useDashboardStore', () => ({
  useDashboardStore: vi.fn()
}));

vi.mock('../../hooks/useAnalysisPipeline', () => ({
  useAnalysisPipeline: vi.fn()
}));

describe('AnalysisTab', () => {
  beforeEach(() => {
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        rowsArea: [],
        rowsAsignatura: [],
        viewMode: 'area',
        config: { P4: 25 },
        selectedGrupo: 'Todos',
        availableGroups: ['Todos'],
        setGrupo: vi.fn(),
        subjectWeights: {}
      };
      return selector(state);
    });

    (useAnalysisPipeline as any).mockReturnValue({
      groupedAndSorted: [],
      kpis: { promedioGeneral: 0, statusDistribution: {} }
    });
  });

  it('renders no data message when rowsArea is empty', () => {
    render(<AnalysisTab />);
    expect(screen.getByText('No hay datos para analizar. Cargue un archivo Excel.')).toBeDefined();
  });

  it('passes selectedGrupo and viewMode to useAnalysisPipeline', () => {
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        rowsArea: [{ area: 'A', estado: { text: 'Ganado' } }],
        rowsAsignatura: [],
        config: { P1: 33.3, P2: 33.3, P3: 33.4 },
        selectedGrupo: 'Grupo A',
        availableGroups: ['Todos', 'Grupo A'],
        viewMode: 'subject',
        setGrupo: vi.fn(),
        setViewMode: vi.fn(),
        subjectWeights: {}
      };
      return selector(state);
    });

    render(<AnalysisTab />);
    expect(useAnalysisPipeline).toHaveBeenLastCalledWith(
      expect.anything(),
      'Grupo A',
      expect.anything(),
      null,
      'subject'
    );
  });

  it('renders view toggle buttons and calls setViewMode on click', () => {
    const setViewModeMock = vi.fn();
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        rowsArea: [{ area: 'A', estado: { text: 'Ganado' } }],
        rowsAsignatura: [],
        config: { P1: 33.3, P2: 33.3, P3: 33.4 },
        selectedGrupo: 'Todos',
        availableGroups: ['Todos'],
        viewMode: 'area',
        setGrupo: vi.fn(),
        setViewMode: setViewModeMock,
        subjectWeights: {}
      };
      return selector(state);
    });

    render(<AnalysisTab />);
    
    // Look for toggle buttons
    const areaBtn = screen.getByRole('button', { name: 'Áreas' });
    const subjBtn = screen.getByRole('button', { name: 'Asignaturas' });
    
    expect(areaBtn).toBeDefined();
    expect(subjBtn).toBeDefined();

    fireEvent.click(subjBtn);
    expect(setViewModeMock).toHaveBeenCalledWith('subject');
  });

  it('renders table headers according to viewMode', () => {
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        rowsArea: [{ area: 'A', estado: { text: 'Ganado' } }],
        rowsAsignatura: [{ asignatura: 'Math', p1: 3, estado: { text: 'Ganado' } }],
        config: { P1: 33.3, P2: 33.3, P3: 33.4 },
        selectedGrupo: 'Todos',
        availableGroups: ['Todos'],
        viewMode: 'subject',
        setGrupo: vi.fn(),
        setViewMode: vi.fn(),
        subjectWeights: {}
      };
      return selector(state);
    });

    (useAnalysisPipeline as any).mockReturnValue({
      groupedAndSorted: [{
        estudiante: 'Test3',
        rows: [{
          asignatura: 'Math',
          p1: 3.5,
          tendencia: 'up',
          estado: { text: 'Ganado', color: 'green' }
        }],
        aggregates: { promActual: 3.5 }
      }],
      kpis: { promedioGeneral: 3.5, statusDistribution: {} }
    });

    render(<AnalysisTab />);
    
    // The first column should be 'Asignatura' in subject view
    fireEvent.click(screen.getByText('Test3')); // expand row
    expect(screen.getAllByText('Asignatura').length).toBeGreaterThan(0);
    expect(screen.queryByText('Área')).toBeNull(); // Shouldn't have Área column here since it's subject view
    expect(screen.getAllByText('Math').length).toBeGreaterThan(0);
  });

  it('renders inferred subject weights', () => {
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        rowsArea: [{ estudiante: 'Juan', area: 'Matemáticas', estado: { text: 'Ganado' } }],
        rowsAsignatura: [],
        viewMode: 'area',
        config: { P1: 33.3, P2: 33.3, P3: 33.4 },
        selectedGrupo: 'Todos',
        availableGroups: ['Todos', '9A'],
        setGrupo: vi.fn(),
        subjectWeights: {
          'Ciencias': { 'Física': 0.5, 'Química': 0.5 }
        }
      };
      return selector(state);
    });

    render(<AnalysisTab />);
    expect(screen.getByText('Pesos de Asignaturas Inferidos')).toBeDefined();
    expect(screen.getByText('Ciencias:')).toBeDefined();
    expect(screen.getByText(/Física: 50% \| Química: 50%/)).toBeDefined();
  });

  it('renders high-risk danger icon with tooltip if p4Min > 5.0', () => {
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        rowsArea: [{ estudiante: 'Juan', area: 'Matemáticas', estado: { text: 'Ganado' } }],
        rowsAsignatura: [],
        viewMode: 'area',
        config: { P1: 33.3, P2: 33.3, P3: 33.4 },
        selectedGrupo: '9A',
        availableGroups: ['Todos', '9A'],
        setGrupo: vi.fn(),
        subjectWeights: {}
      };
      return selector(state);
    });

    (useAnalysisPipeline as any).mockReturnValue({
      groupedAndSorted: [{
        estudiante: 'Test',
        rows: [{
          area: 'Math',
          promActual: 2.0,
          p4Min: 5.5,
          tendencia: 'down',
          estado: { text: 'En riesgo', color: 'yellow' }
        }],
        aggregates: { promActual: 2.0 }
      }],
      kpis: { promedioGeneral: 2.0, statusDistribution: {} }
    });

    render(<AnalysisTab />);
    
    // Expand group to see rows
    fireEvent.click(screen.getByText('Test'));
    
    const icon = screen.getByTitle('Requiere 5.5 en el periodo restante para aprobar');
    expect(icon).toBeDefined();
    expect(icon.textContent).toBe('⚠️');
  });

  it('does not render high-risk danger icon if p4Min <= 5.0', () => {
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        rowsArea: [{ estudiante: 'Juan', area: 'Matemáticas', estado: { text: 'Ganado' } }],
        rowsAsignatura: [],
        viewMode: 'area',
        config: { P1: 33.3, P2: 33.3, P3: 33.4 },
        selectedGrupo: '9A',
        availableGroups: ['Todos', '9A'],
        setGrupo: vi.fn(),
        subjectWeights: {}
      };
      return selector(state);
    });

    (useAnalysisPipeline as any).mockReturnValue({
      groupedAndSorted: [{
        estudiante: 'Test2',
        rows: [{
          area: 'Math',
          promActual: 3.5,
          p4Min: 4.0,
          tendencia: 'up',
          estado: { text: 'En riesgo', color: 'yellow' }
        }],
        aggregates: { promActual: 3.5 }
      }],
      kpis: { promedioGeneral: 3.5, statusDistribution: {} }
    });

    render(<AnalysisTab />);
    
    // Expand group to see rows
    fireEvent.click(screen.getByText('Test2'));
    
    const icon = screen.queryByTitle(/Requiere .* en el periodo restante para aprobar/);
    expect(icon).toBeNull();
  });
});
