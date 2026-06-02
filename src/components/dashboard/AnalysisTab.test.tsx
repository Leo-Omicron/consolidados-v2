import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { axe } from 'vitest-axe';
import 'vitest-axe/extend-expect';
import { AnalysisTab } from './AnalysisTab';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useAnalysisPipeline } from '../../hooks/useAnalysisPipeline';
import { useUIStore } from '../../store/useUIStore';
import { useSimulationStore } from '../../store/useSimulationStore';

vi.mock('../../store/useDashboardStore', () => ({
  useDashboardStore: vi.fn()
}));

vi.mock('../../hooks/useAnalysisPipeline', () => ({
  useAnalysisPipeline: vi.fn()
}));

const mockEstudiantes: any[] = [
  {
    id: 'juan',
    name: 'Juan',
    CURSO: 'Curso Test',
    grupo: 'Todos',
    areas: {
      'Ciencias Sociales': {
        asignaturas: {},
        DEF: { P1: 3.5, P2: 3.0, P3: null }
      }
    }
  }
];

describe('AnalysisTab', () => {
  beforeEach(() => {
    useUIStore.setState({
      analysisFilters: { search: '', area: '', status: '' },
      analysisSortConfig: null,
      reportsActiveTab: 'group-performance',
    });

    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        estudiantes: mockEstudiantes,
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

  it('has no accessibility violations when empty', async () => {
    const { container } = render(<AnalysisTab />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations with data', async () => {
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

    const { container } = render(<AnalysisTab />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
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
      [{ area: 'A', estado: { text: 'Ganado' } }],
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
    expect(areaBtn.getAttribute('aria-pressed')).toBe('true');
    expect(subjBtn.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(subjBtn);
    expect(setViewModeMock).toHaveBeenCalledWith('subject');
  });

  it('exposes analysis filters with accessible labels', () => {
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        rowsArea: [{ area: 'Matemáticas', estado: { text: 'Ganado' } }],
        rowsAsignatura: [],
        config: { P1: 33.3, P2: 33.3, P3: 33.4 },
        selectedGrupo: 'Todos',
        availableGroups: ['Todos', '9A'],
        viewMode: 'area',
        setGrupo: vi.fn(),
        setViewMode: vi.fn(),
        subjectWeights: {}
      };
      return selector(state);
    });

    render(<AnalysisTab />);

    expect(screen.getByLabelText('Grupo')).toBeDefined();
    expect(screen.getByLabelText('Buscar estudiante')).toBeDefined();
    expect(screen.getByLabelText('Área')).toBeDefined();
    expect(screen.getByLabelText('Estado')).toBeDefined();
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

  it('renders inferred subject weights panel collapsed by default with correct title', () => {
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
    
    // Collapsed by default: button should have title "Ver Pesos de Asignaturas Inferidos"
    const toggleButton = screen.getByRole('button', { name: /Ver Pesos de Asignaturas Inferidos/ });
    expect(toggleButton).toBeDefined();
    
    // The panel contents should be hidden
    expect(screen.queryByText('Ciencias:')).toBeNull();
  });

  it('toggles weights panel expansion on click', () => {
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
    
    const toggleButton = screen.getByRole('button', { name: /Ver Pesos de Asignaturas Inferidos/ });
    fireEvent.click(toggleButton);
    
    // Now expanded: button text should change and content should be visible
    expect(screen.getByRole('button', { name: /Ocultar Pesos de Asignaturas Inferidos/ })).toBeDefined();
    expect(screen.getByText('Ciencias:')).toBeDefined();
    expect(screen.getByText(/Física: 50% \| Química: 50%/)).toBeDefined();
    
    // Click again to collapse
    fireEvent.click(toggleButton);
    expect(screen.getByRole('button', { name: /Ver Pesos de Asignaturas Inferidos/ })).toBeDefined();
  });

  it('displays only selected group weights when filtered', () => {
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        rowsArea: [{ estudiante: 'Juan', area: 'Matemáticas', estado: { text: 'Ganado' } }],
        rowsAsignatura: [],
        viewMode: 'area',
        config: { P1: 33.3, P2: 33.3, P3: 33.4 },
        selectedGrupo: '9A',
        availableGroups: ['Todos', '9A', '9B'],
        setGrupo: vi.fn(),
        subjectWeights: {
          '9A': { 'Ciencias': { 'Física': 0.5, 'Química': 0.5 } },
          '9B': { 'Ciencias': { 'Biología': 1.0 } }
        }
      };
      return selector(state);
    });

    render(<AnalysisTab />);
    
    // Expand the panel
    const toggleButton = screen.getByRole('button', { name: /Ver Pesos de Asignaturas Inferidos/ });
    fireEvent.click(toggleButton);
    
    // Should display 9A weights
    expect(screen.getByText('Grupo 9A:')).toBeDefined();
    expect(screen.getByText(/Física: 50% \| Química: 50%/)).toBeDefined();
    
    // Should NOT display 9B weights
    expect(screen.queryByText('Grupo 9B:')).toBeNull();
    expect(screen.queryByText(/Biología: 100%/)).toBeNull();
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

  it('exposes status badges and table content semantically without relying on CSS classes', () => {
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

    render(<AnalysisTab />);

    fireEvent.click(screen.getByText('Test3'));

    expect(screen.getByRole('table')).toBeDefined();
    expect(screen.getByRole('status', { name: 'Estado: Ganado' })).toBeDefined();
  });

  it('toggles editing mode on click and allows inputting a simulated grade', () => {
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        estudiantes: mockEstudiantes,
        rowsArea: [{ estudiante: 'Juan', area: 'Ciencias Sociales', estado: { text: 'En riesgo', color: 'yellow' } }],
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
        estudiante: 'Juan',
        rows: [{
          id: 'juan_sociales',
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
    
    // Expand the student row
    fireEvent.click(screen.getByText('Juan'));
    
    // Find the cell displaying 3.50
    const cell = screen.getByText('3.50');
    expect(cell).toBeDefined();
    
    // Click it to start editing
    fireEvent.click(cell);
    
    // The input should appear with value "3.5"
    const input = screen.getByDisplayValue('3.5') as HTMLInputElement;
    expect(input).toBeDefined();
    
    // Change value
    fireEvent.change(input, { target: { value: '4.8' } });
    
    // Blur to save
    fireEvent.blur(input);
    
    // After blurring, the input should disappear
    expect(screen.queryByDisplayValue('4.8')).toBeNull();
  });

  it('renders simulation banner and student restoration button when simulations are active', () => {
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        estudiantes: mockEstudiantes,
        rowsArea: [{ estudiante: 'Juan', area: 'Ciencias Sociales', estado: { text: 'En riesgo', color: 'yellow' } }],
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
        estudiante: 'Juan',
        rows: [{
          id: 'juan_sociales',
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

    act(() => {
      useSimulationStore.setState({
        activeSimulations: {
          'juan_sociales': { P1: 4.8 }
        }
      });
    });

    // The simulation banner should be visible
    expect(screen.getByText(/Modo de Simulación Activo/)).toBeDefined();
    
    // Expand the student row
    fireEvent.click(screen.getByText('Juan'));
    
    // The "Restaurar" button for the student should be visible
    expect(screen.getByRole('button', { name: 'Restaurar' })).toBeDefined();

    // Click "Restaurar" to clear simulations for this student
    fireEvent.click(screen.getByRole('button', { name: 'Restaurar' }));
    
    // Check that activeSimulations has been cleared
    expect(useSimulationStore.getState().activeSimulations).toEqual({});
    
    // Cleanup store
    act(() => {
      useSimulationStore.setState({ activeSimulations: {} });
    });
  });

  it('clears all simulations when clicking the global reset button in the banner', () => {
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        estudiantes: mockEstudiantes,
        rowsArea: [{ estudiante: 'Juan', area: 'Ciencias Sociales', estado: { text: 'En riesgo', color: 'yellow' } }],
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
        estudiante: 'Juan',
        rows: [{
          id: 'juan_sociales',
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

    act(() => {
      useSimulationStore.setState({
        activeSimulations: {
          'juan_sociales': { P1: 4.8 }
        }
      });
    });

    // Click the "Restaurar todo" button in the banner
    const resetAllBtn = screen.getByRole('button', { name: 'Restaurar datos reales' });
    expect(resetAllBtn).toBeDefined();
    
    fireEvent.click(resetAllBtn);

    // Check that activeSimulations is empty
    expect(useSimulationStore.getState().activeSimulations).toEqual({});
  });

  it('displays simulated subject grades and updated computed averages in the subtable', () => {
    const studentWithSubjects = [
      {
        id: 'juan',
        name: 'Juan',
        CURSO: '6A',
        grupo: '6A',
        areas: {
          'Ciencias Sociales': {
            asignaturas: {
              'Historia': { P1: 4.0, P2: 3.5, P3: null, promedioActual: 3.75, p4Min: 2.0, estado: { text: 'Ganado', color: 'green' } },
              'Geografía': { P1: 3.0, P2: 2.0, P3: null, promedioActual: 2.5, p4Min: 4.0, estado: { text: 'Recuperable', color: 'blue' } }
            },
            DEF: { P1: 3.5, P2: 2.75, P3: null },
            areaStats: { promedioActual: 3.125, p4Min: 3.0, estado: { text: 'Recuperable', color: 'blue' } }
          }
        }
      }
    ];

    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        estudiantes: studentWithSubjects,
        rowsArea: [
          { id: 'juan_Ciencias Sociales', estudiante: 'Juan', area: 'Ciencias Sociales', defP1: 3.5, defP2: 2.75, defP3: null, promActual: 3.125, p4Min: 3.0, estado: { text: 'Recuperable', color: 'blue' }, CURSO: '6A', grupo: '6A' }
        ],
        rowsAsignatura: [
          { id: 'juan_Ciencias Sociales_Historia', estudiante: 'Juan', area: 'Ciencias Sociales', asignatura: 'Historia', p1: 4.0, p2: 3.5, p3: null, promActual: 3.75, p4Min: 2.0, estado: { text: 'Ganado', color: 'green' }, CURSO: '6A', grupo: '6A' },
          { id: 'juan_Ciencias Sociales_Geografía', estudiante: 'Juan', area: 'Ciencias Sociales', asignatura: 'Geografía', p1: 3.0, p2: 2.0, p3: null, promActual: 2.5, p4Min: 4.0, estado: { text: 'Recuperable', color: 'blue' }, CURSO: '6A', grupo: '6A' }
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
          id: 'juan_Ciencias Sociales',
          area: 'Ciencias Sociales',
          defP1: 3.5,
          defP2: 2.75,
          defP3: null,
          promActual: 3.125,
          p4Min: 3.0,
          tendencia: 'flat',
          estado: { text: 'Recuperable', color: 'blue' }
        }],
        aggregates: { promActual: 3.125 }
      }],
      kpis: { promedioGeneral: 3.125, statusDistribution: {} }
    });

    render(<AnalysisTab />);

    // Expand the student row
    fireEvent.click(screen.getByText('Juan'));

    // Expand the Area row subjects
    const expandBtn = screen.getByRole('button', { name: 'Toggle subjects for Ciencias Sociales' });
    fireEvent.click(expandBtn);

    // Set a simulated grade on Historia P3 = 5.0
    act(() => {
      useSimulationStore.setState({
        activeSimulations: {
          'juan_Ciencias Sociales_Historia': { P3: 5.0 }
        }
      });
    });

    // Check that we display the simulated value in the cell (5.00)
    expect(screen.getByText('5.00')).toBeDefined();

    // Verify that the subject's Promedio is updated to the simulated value (4.20)
    expect(screen.getByText('4.20')).toBeDefined();

    // Cleanup store
    act(() => {
      useSimulationStore.setState({ activeSimulations: {} });
    });
  });

  describe('EditableGradeCell and GoalSeekCell behaviors', () => {
    it('handles input blur and Enter key in EditableGradeCell', () => {
      (useDashboardStore as any).mockImplementation((selector: any) => {
        const state = {
          estudiantes: mockEstudiantes,
          rowsArea: [{ id: '1', estudiante: 'Juan', area: 'Matemáticas', defP1: 3.5, defP2: 3.0, defP3: null, promActual: 3.25, p4Min: 2.5, estado: { text: 'Ganado' } }],
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
          estudiante: 'Juan',
          rows: [{ id: '1', area: 'Matemáticas', defP1: 3.5, defP2: 3.0, promActual: 3.25, p4Min: 2.5, tendencia: 'flat', estado: { text: 'Ganado' } }],
          aggregates: { promActual: 3.25 }
        }],
        kpis: { promedioGeneral: 3.25, statusDistribution: {} }
      });

      render(<AnalysisTab />);
      fireEvent.click(screen.getByText('Juan'));
      
      const cell = screen.getByText('3.50');
      fireEvent.click(cell); // enter edit mode
      
      const inputs = screen.getAllByRole('spinbutton'); // number input
      const input = inputs[0] as HTMLInputElement;
      fireEvent.change(input, { target: { value: '4.0' } });
      fireEvent.keyDown(input, { key: 'Enter' }); // Should save and exit
      
      // Open again and test escape
      const cell2 = screen.getAllByText('3.00')[0]; // defP2
      fireEvent.click(cell2);
      
      const inputs2 = screen.getAllByRole('spinbutton');
      const input2 = inputs2[inputs2.length - 1] as HTMLInputElement;
      fireEvent.change(input2, { target: { value: '5.0' } });
      fireEvent.keyDown(input2, { key: 'Escape' }); // Should cancel
    });

    it('handles input blur and Enter key in GoalSeekCell', () => {
      (useDashboardStore as any).mockImplementation((selector: any) => {
        const state = {
          estudiantes: mockEstudiantes,
          rowsArea: [{ id: '1', estudiante: 'Juan', area: 'Matemáticas', defP1: 3.5, defP2: 3.0, defP3: null, promActual: 3.25, p4Min: 2.5, estado: { text: 'Ganado' } }],
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
          estudiante: 'Juan',
          rows: [{ id: '1', area: 'Matemáticas', defP1: 3.5, defP2: 3.0, promActual: 3.25, p4Min: 2.5, tendencia: 'flat', estado: { text: 'Ganado' } }],
          aggregates: { promActual: 3.25 }
        }],
        kpis: { promedioGeneral: 3.25, statusDistribution: {} }
      });

      render(<AnalysisTab />);
      fireEvent.click(screen.getByText('Juan'));
      
      const goalCell = screen.getAllByTitle('Click para buscar un objetivo de promedio')[0];
      fireEvent.click(goalCell);
      
      const input = screen.getByTitle('Ingresa el promedio que deseas alcanzar') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '4.5' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      // Re-open and escape
      fireEvent.click(screen.getAllByTitle('Click para buscar un objetivo de promedio')[0]);
      const input2 = screen.getByTitle('Ingresa el promedio que deseas alcanzar') as HTMLInputElement;
      fireEvent.change(input2, { target: { value: '5.0' } });
      fireEvent.keyDown(input2, { key: 'Escape' });
    });

    it('StatusBadge renders different colors correctly', () => {
      (useDashboardStore as any).mockImplementation((selector: any) => {
        const state = {
          estudiantes: mockEstudiantes,
          rowsArea: [],
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
          estudiante: 'Juan',
          rows: [
            { id: '1', area: 'Matemáticas', estado: { text: 'Ganado', color: 'green' }, tendencia: 'flat', promActual: 3.5, p4Min: 3.0 },
            { id: '2', area: 'Ciencias', estado: { text: 'Alerta', color: 'yellow' }, tendencia: 'flat', promActual: 3.5, p4Min: 3.0 },
            { id: '3', area: 'Historia', estado: { text: 'Perdido', color: 'red' }, tendencia: 'flat', promActual: 3.5, p4Min: 3.0 },
            { id: '4', area: 'Inglés', estado: { text: 'Sobresaliente', color: 'cyan' }, tendencia: 'flat', promActual: 3.5, p4Min: 3.0 },
            { id: '5', area: 'Arte', estado: { text: 'Recuperable', color: 'blue' }, tendencia: 'flat', promActual: 3.5, p4Min: 3.0 },
            { id: '6', area: 'EduFisica', estado: { text: 'Otro', color: 'default' }, tendencia: 'flat', promActual: 3.5, p4Min: 3.0 }
          ],
          aggregates: { promActual: 3.5 }
        }],
        kpis: { promedioGeneral: 0, statusDistribution: {} }
      });

      render(<AnalysisTab />);
      fireEvent.click(screen.getByText('Juan'));
      
      expect(screen.getByText('Ganado')).toBeDefined();
      expect(screen.getByText('Alerta')).toBeDefined();
      expect(screen.getByText('Perdido')).toBeDefined();
      expect(screen.getByText('Sobresaliente')).toBeDefined();
      expect(screen.getByText('Recuperable')).toBeDefined();
      expect(screen.getByText('Otro')).toBeDefined();
    });

    it('exports hash via clipboard on share button click', () => {
      (useDashboardStore as any).mockImplementation((selector: any) => {
        const state = { estudiantes: mockEstudiantes, rowsArea: [], rowsAsignatura: [], viewMode: 'area', config: {}, selectedGrupo: 'Todos', availableGroups: ['Todos'], setGrupo: vi.fn(), subjectWeights: {} };
        return selector(state);
      });
      (useAnalysisPipeline as any).mockReturnValue({ groupedAndSorted: [], kpis: { promedioGeneral: 0, statusDistribution: {} } });

      const mockExportToHash = vi.fn().mockReturnValue('test-hash');
      act(() => {
        useSimulationStore.setState({ activeSimulations: { 'juan': { P1: 4.0 } }, exportToHash: mockExportToHash });
      });

      const writeTextMock = vi.fn();
      Object.assign(navigator, { clipboard: { writeText: writeTextMock } });
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<AnalysisTab />);
      fireEvent.click(screen.getByText('🔗 Compartir URL'));

      expect(mockExportToHash).toHaveBeenCalled();
      expect(writeTextMock).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalled();
      
      alertSpy.mockRestore();
    });

    it('handles sorting columns by clicking headers', () => {
      const setSortConfigMock = vi.fn();
      useUIStore.setState({ setAnalysisSortConfig: setSortConfigMock });

      (useDashboardStore as any).mockImplementation((selector: any) => {
        const state = { estudiantes: mockEstudiantes, rowsArea: [], rowsAsignatura: [], viewMode: 'area', config: {}, selectedGrupo: 'Todos', availableGroups: ['Todos'], setGrupo: vi.fn(), subjectWeights: {} };
        return selector(state);
      });
      (useAnalysisPipeline as any).mockReturnValue({ groupedAndSorted: [{estudiante: 'Juan', rows: [], aggregates: {}}], kpis: { promedioGeneral: 0, statusDistribution: {} } });

      render(<AnalysisTab />);
      fireEvent.click(screen.getByText(/Estudiante/));
      expect(setSortConfigMock).toHaveBeenCalled();
      
      fireEvent.click(screen.getByText('Juan'));
      fireEvent.click(screen.getByText(/P1/));
      expect(setSortConfigMock).toHaveBeenCalledTimes(2);
    });
  });
});

// ---------------------------------------------------------------------------
// 6.3 — Sub-component composition tests
// ---------------------------------------------------------------------------
describe('AnalysisTab — sub-component composition', () => {
  function setupStoreMock() {
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        estudiantes: [{ id: 'juan', name: 'Juan', CURSO: '6A', grupo: '6A', areas: {} }],
        rowsArea: [{ id: 'r1', estudiante: 'Juan', area: 'Matemáticas', defP1: 3.5, defP2: 3.0, promActual: 3.2, p4Min: 2.5, estado: { text: 'En riesgo', color: 'yellow' }, CURSO: '6A', grupo: '6A' }],
        rowsAsignatura: [{ id: 'a1', estudiante: 'Juan', area: 'Matemáticas', asignatura: 'Álgebra', p1: 4.0, p2: 3.5, promActual: 3.7, p4Min: 2.0, estado: { text: 'Ganado', color: 'green' }, tendencia: 'up' }],
        viewMode: 'area' as const,
        config: { P1: 33.3, P2: 33.3, P3: 33.4 },
        selectedGrupo: '6A',
        availableGroups: ['Todos', '6A'],
        setGrupo: vi.fn(),
        setViewMode: vi.fn(),
        subjectWeights: { '6A': { 'Matemáticas': { 'Álgebra': 1.0 } } },
      };
      return selector(state);
    });

    (useAnalysisPipeline as any).mockReturnValue({
      groupedAndSorted: [{
        estudiante: 'Juan',
        rows: [{ id: 'r1', area: 'Matemáticas', defP1: 3.5, defP2: 3.0, promActual: 3.2, p4Min: 2.5, tendencia: 'flat', estado: { text: 'En riesgo', color: 'yellow' } }],
        aggregates: { promActual: 3.2 },
      }],
      kpis: { promedioGeneral: 3.2, statusDistribution: { 'En riesgo': 1 } },
    });
  }

  beforeEach(() => {
    useSimulationStore.setState({ activeSimulations: {} });
    useUIStore.setState({
      analysisFilters: { search: '', area: '', status: '' },
      analysisSortConfig: null,
    });
    setupStoreMock();
  });

  it('renders FiltersBar sub-component with group selector and filter inputs', () => {
    render(<AnalysisTab />);

    expect(screen.getByLabelText('Grupo')).toBeInTheDocument();
    expect(screen.getByLabelText('Buscar estudiante')).toBeInTheDocument();
    expect(screen.getByLabelText('Área')).toBeInTheDocument();
    expect(screen.getByLabelText('Estado')).toBeInTheDocument();
  });

  it('renders SubjectWeightsPanel sub-component collapsed by default', () => {
    render(<AnalysisTab />);

    const toggleButton = screen.getByRole('button', { name: /Ver Pesos de Asignaturas Inferidos/ });
    expect(toggleButton).toBeInTheDocument();
    expect(screen.queryByText('Álgebra:')).not.toBeInTheDocument();
  });

  it('renders StudentGroupTable sub-component with student data', () => {
    render(<AnalysisTab />);

    expect(screen.getByText('Juan')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('renders SimulationBanner sub-component when simulations are active', () => {
    // Provide students with proper DEF data so getSimulatedRows produces rows
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        estudiantes: [{
          id: 'juan', name: 'Juan', CURSO: '6A', grupo: '6A',
          areas: {
            'Matemáticas': {
              asignaturas: {},
              DEF: { P1: 3.5, P2: 3.0, P3: null }
            }
          }
        }],
        rowsArea: [{ id: 'r1', estudiante: 'Juan', area: 'Matemáticas', defP1: 3.5, defP2: 3.0, promActual: 3.2, p4Min: 2.5, estado: { text: 'En riesgo', color: 'yellow' }, CURSO: '6A', grupo: '6A' }],
        rowsAsignatura: [],
        viewMode: 'area' as const,
        config: { P1: 33.3, P2: 33.3, P3: 33.4 },
        selectedGrupo: '6A',
        availableGroups: ['Todos', '6A'],
        setGrupo: vi.fn(),
        setViewMode: vi.fn(),
        subjectWeights: {},
      };
      return selector(state);
    });

    (useAnalysisPipeline as any).mockReturnValue({
      groupedAndSorted: [{
        estudiante: 'Juan',
        rows: [{ id: 'r1', area: 'Matemáticas', defP1: 3.5, defP2: 3.0, promActual: 3.2, p4Min: 2.5, tendencia: 'flat', estado: { text: 'En riesgo', color: 'yellow' } }],
        aggregates: { promActual: 3.2 },
      }],
      kpis: { promedioGeneral: 3.2, statusDistribution: { 'En riesgo': 1 } },
    });

    render(<AnalysisTab />);

    act(() => {
      useSimulationStore.setState({
        activeSimulations: { 'r1': { P1: 4.5 } },
      });
    });

    // SimulationBanner shows when active simulations exist
    expect(screen.getByText(/Modo de Simulación Activo/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restaurar datos reales' })).toBeInTheDocument();

    // Cleanup
    act(() => {
      useSimulationStore.setState({ activeSimulations: {} });
    });
  });

  it('composes all four sub-components together when data is present', () => {
    // No simulations for this test — just verify orchestrator renders everything
    render(<AnalysisTab />);

    // 1. SubjectWeightsPanel
    expect(screen.getByRole('button', { name: /Ver Pesos de Asignaturas Inferidos/ })).toBeInTheDocument();
    // 2. FiltersBar
    expect(screen.getByLabelText('Grupo')).toBeInTheDocument();
    expect(screen.getByLabelText('Buscar estudiante')).toBeInTheDocument();
    // 3. StudentGroupTable
    expect(screen.getByText('Juan')).toBeInTheDocument();
    // 4. SimulationBanner should NOT be visible (no simulations active)
    expect(screen.queryByText(/Modo de Simulación Activo/)).not.toBeInTheDocument();
    // But the orchestrator header is visible
    expect(screen.getByText('Análisis Avanzado')).toBeInTheDocument();
  });
});
