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

  it('renders "Mín. P3" header when P4 is not active', () => {
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        rowsArea: [{ estudiante: 'Juan', area: 'Matemáticas', estado: { text: 'Ganado' } }],
        rowsAsignatura: [],
        viewMode: 'area',
        config: { P1: 33.3, P2: 33.3, P3: 33.4 },
        selectedGrupo: 'Todos',
        availableGroups: ['Todos'],
        setGrupo: vi.fn(),
        subjectWeights: {}
      };
      return selector(state);
    });

    (useAnalysisPipeline as any).mockReturnValue({
      groupedAndSorted: [{
        estudiante: 'TestJuan',
        rows: [{
          area: 'Math',
          promActual: 3.5,
          p4Min: 4.0,
          tendencia: 'up',
          estado: { text: 'Ganado', color: 'green' }
        }],
        aggregates: { promActual: 3.5 }
      }],
      kpis: { promedioGeneral: 3.5, statusDistribution: {} }
    });

    render(<AnalysisTab />);
    fireEvent.click(screen.getByText('TestJuan'));
    expect(screen.getByText(/Mín. P3/)).toBeDefined();
  });

  it('renders "Mín. P4" header when P4 is active', () => {
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        rowsArea: [{ estudiante: 'Juan', area: 'Matemáticas', estado: { text: 'Ganado' } }],
        rowsAsignatura: [],
        viewMode: 'area',
        config: { P1: 25, P2: 25, P3: 25, P4: 25 },
        selectedGrupo: 'Todos',
        availableGroups: ['Todos'],
        setGrupo: vi.fn(),
        subjectWeights: {}
      };
      return selector(state);
    });

    (useAnalysisPipeline as any).mockReturnValue({
      groupedAndSorted: [{
        estudiante: 'TestJuan',
        rows: [{
          area: 'Math',
          promActual: 3.5,
          p4Min: 4.0,
          tendencia: 'up',
          estado: { text: 'Ganado', color: 'green' }
        }],
        aggregates: { promActual: 3.5 }
      }],
      kpis: { promedioGeneral: 3.5, statusDistribution: {} }
    });

    render(<AnalysisTab />);
    fireEvent.click(screen.getByText('TestJuan'));
    expect(screen.getByText(/Mín. P4/)).toBeDefined();
  });

  it('renders achievable grade as value and impossible as "-"', () => {
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        rowsArea: [{ estudiante: 'Juan', area: 'Matemáticas', estado: { text: 'Ganado' } }],
        rowsAsignatura: [],
        viewMode: 'area',
        config: { P1: 25, P2: 25, P3: 25, P4: 25 },
        selectedGrupo: 'Todos',
        availableGroups: ['Todos'],
        setGrupo: vi.fn(),
        subjectWeights: {}
      };
      return selector(state);
    });

    (useAnalysisPipeline as any).mockReturnValue({
      groupedAndSorted: [{
        estudiante: 'TestGrades',
        rows: [
          {
            area: 'Math',
            promActual: 3.5,
            p4Min: 4.20,
            tendencia: 'up',
            estado: { text: 'Ganado', color: 'green' }
          },
          {
            area: 'Science',
            promActual: 1.5,
            p4Min: 5.50,
            tendencia: 'down',
            estado: { text: 'Perdido', color: 'red' }
          }
        ],
        aggregates: { promActual: 2.5 }
      }],
      kpis: { promedioGeneral: 2.5, statusDistribution: {} }
    });

    render(<AnalysisTab />);
    fireEvent.click(screen.getByText('TestGrades'));
    expect(screen.getByText('4.20')).toBeDefined();
    expect(screen.getAllByText('-').length).toBeGreaterThan(0); // Science cell has - or is rendered correctly
  });

  it('renders "Año Reprobado" badge when student is reprobado', () => {
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        rowsArea: [{ estudiante: 'Juan', area: 'Matemáticas', estado: { text: 'Ganado' } }],
        rowsAsignatura: [],
        viewMode: 'area',
        config: { P1: 33.3, P2: 33.3, P3: 33.4 },
        selectedGrupo: 'Todos',
        availableGroups: ['Todos'],
        setGrupo: vi.fn(),
        subjectWeights: {}
      };
      return selector(state);
    });

    (useAnalysisPipeline as any).mockReturnValue({
      groupedAndSorted: [{
        estudiante: 'Juan Reprobado',
        rows: [],
        aggregates: { promActual: 2.0 },
        failedAreasCount: 3,
        isReprobado: true
      }],
      kpis: { promedioGeneral: 2.0, statusDistribution: {} }
    });

    render(<AnalysisTab />);
    expect(screen.getByText(/Año Reprobado \(3 Áreas\)/)).toBeDefined();
  });

  it('allows expanding an Area row and rendering the nested sub-table with subjects', () => {
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        rowsArea: [{ estudiante: 'Juan', area: 'Ciencias Sociales', estado: { text: 'En riesgo' }, defP1: 3.5, defP2: 3.0, defP3: null, promActual: 3.25, p4Min: 2.5, CURSO: '6A', grupo: '6A' }],
        rowsAsignatura: [
          { estudiante: 'Juan', area: 'Ciencias Sociales', asignatura: 'Historia', p1: 4.0, p2: 3.5, p3: null, promActual: 3.75, p4Min: 2.0, estado: { text: 'Ganado', color: 'green' }, CURSO: '6A', grupo: '6A', tendencia: 'up' },
          { estudiante: 'Juan', area: 'Ciencias Sociales', asignatura: 'Geografía', p1: 3.0, p2: 2.5, p3: null, promActual: 2.75, p4Min: 3.5, estado: { text: 'Recuperable', color: 'blue' }, CURSO: '6A', grupo: '6A', tendencia: 'flat' }
        ],
        viewMode: 'area',
        config: { P1: 33.3, P2: 33.3, P3: 33.4 },
        selectedGrupo: 'Todos',
        availableGroups: ['Todos'],
        setGrupo: vi.fn(),
        subjectWeights: {}
      };
      return selector(state);
    });

    (useAnalysisPipeline as any).mockReturnValue({
      groupedAndSorted: [{
        estudiante: 'Juan',
        rows: [{
          area: 'Ciencias Sociales',
          defP1: 3.5,
          defP2: 3.0,
          defP3: null,
          promActual: 3.25,
          p4Min: 2.5,
          tendencia: 'flat',
          estado: { text: 'En riesgo', color: 'yellow' }
        }],
        aggregates: { promActual: 3.25 }
      }],
      kpis: { promedioGeneral: 3.25, statusDistribution: {} }
    });

    render(<AnalysisTab />);
    
    // First, expand the student group 'Juan' to see the Area row
    fireEvent.click(screen.getByText('Juan'));
    
    // Now we should see the Area row for 'Ciencias Sociales'
    expect(screen.getByRole('cell', { name: /Ciencias Sociales/ })).toBeDefined();
    
    // The subject 'Historia' should NOT be visible yet before expansion
    expect(screen.queryByText('Historia')).toBeNull();
    
    // Find the folder icon/expander button next to the Area
    const expandBtn = screen.getByRole('button', { name: 'Toggle subjects for Ciencias Sociales' });
    expect(expandBtn).toBeDefined();
    
    // Click to expand the Area subjects
    fireEvent.click(expandBtn);
    
    // Now the sub-table should be visible, displaying 'Historia' and 'Geografía'
    expect(screen.getByText('Historia')).toBeDefined();
    expect(screen.getByText('Geografía')).toBeDefined();
    
    // The expander button should now show '📂'
    expect(expandBtn.textContent).toBe('📂');
  });

  it('applies premium styling, sticky blur-headers, and soft badges', () => {
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        rowsArea: [{ estudiante: 'Juan', area: 'Matemáticas', estado: { text: 'Ganado', color: 'green' } }],
        rowsAsignatura: [],
        viewMode: 'area',
        config: { P1: 33.3, P2: 33.3, P3: 33.4 },
        selectedGrupo: 'Todos',
        availableGroups: ['Todos'],
        setGrupo: vi.fn(),
        subjectWeights: {}
      };
      return selector(state);
    });

    (useAnalysisPipeline as any).mockReturnValue({
      groupedAndSorted: [{
        estudiante: 'Test3',
        rows: [{
          area: 'Math',
          promActual: 3.5,
          tendencia: 'up',
          estado: { text: 'Ganado', color: 'green' }
        }],
        aggregates: { promActual: 3.5 }
      }],
      kpis: { promedioGeneral: 3.5, statusDistribution: {} }
    });

    const { container } = render(<AnalysisTab />);
    
    const tableWrapper = container.querySelector('.max-h-\\[600px\\]');
    expect(tableWrapper?.className).toContain('overflow-auto');
    expect(tableWrapper?.className).toContain('rounded-lg');
    expect(tableWrapper?.className).toContain('border-slate-200/50');

    const header = container.querySelector('.sticky');
    expect(header?.className).toContain('backdrop-blur-md');
    expect(header?.className).toContain('bg-slate-50/90');

    fireEvent.click(screen.getByText('Test3'));
    
    const badge = container.querySelector('.rounded-full');
    expect(badge?.className).toContain('bg-emerald-50');
    expect(badge?.className).toContain('text-emerald-700');
    expect(badge?.className).toContain('border-emerald-200/50');
  });
});
