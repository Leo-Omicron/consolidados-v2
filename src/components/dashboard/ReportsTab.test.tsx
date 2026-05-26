import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReportsTab } from './ReportsTab';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useUIStore } from '../../store/useUIStore';

vi.mock('../../store/useDashboardStore', () => ({
  useDashboardStore: vi.fn()
}));

const mockStudents = [
  {
    id: 'student-1',
    name: 'Ana Perez',
    grupo: '10A',
    areas: {
      'Matemáticas': {
        areaStats: { promedioActual: 4.8, estado: { text: 'Ganado', color: 'green' } },
        DEF: { P1: 5.0, P2: 4.5, P3: 4.9 },
        asignaturas: {
          'Álgebra': { promedioActual: 4.8 }
        }
      },
      'Ciencias': {
        areaStats: { promedioActual: 2.5, estado: { text: 'Perdido', color: 'red' } },
        DEF: { P1: 2.0, P2: 3.0, P3: 2.5 },
        asignaturas: {
          'Química': { promedioActual: 2.5 }
        }
      }
    }
  },
  {
    id: 'student-2',
    name: 'Carlos Gomez',
    grupo: '10A',
    areas: {
      'Matemáticas': {
        areaStats: { promedioActual: 3.2, estado: { text: 'Ganado', color: 'green' } },
        DEF: { P1: 3.0, P2: 3.5, P3: 3.1 },
        asignaturas: {
          'Álgebra': { promedioActual: 3.2 }
        }
      },
      'Ciencias': {
        areaStats: { promedioActual: 4.0, estado: { text: 'Ganado', color: 'green' } },
        DEF: { P1: 4.0, P2: 4.0, P3: 4.0 },
        asignaturas: {
          'Química': { promedioActual: 4.0 }
        }
      }
    }
  }
];

describe('ReportsTab', () => {
  beforeEach(() => {
    useUIStore.setState({
      analysisFilters: { search: '', area: '', status: '' },
      analysisSortConfig: null,
      reportsActiveTab: 'group-performance',
      reportsLocalGroup: '',
      reportsDirectorName: 'Director de Curso',
      reportsPeriodName: '',
    });

    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        estudiantes: [],
        config: { P1: 33.3, P2: 33.3, P3: 33.4 },
        selectedGrupo: 'Todos',
        availableGroups: ['Todos', '10A'],
        setGrupo: vi.fn()
      };
      return selector(state);
    });
  });

  it('renders no data message when estudiantes is empty', () => {
    render(<ReportsTab />);
    expect(screen.getByText('No hay datos para generar reportes. Cargue un archivo Excel.')).toBeDefined();
  });

  it('renders report categories selector when data is present', () => {
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        estudiantes: mockStudents,
        config: { P1: 33.3, P2: 33.3, P3: 33.4 },
        selectedGrupo: '10A',
        availableGroups: ['Todos', '10A'],
        setGrupo: vi.fn()
      };
      return selector(state);
    });

    render(<ReportsTab />);

    // Verify side panel / selectors exist
    expect(screen.getByText('Categorías de Reporte')).toBeDefined();
    expect(screen.getByText('Rendimiento Grupal')).toBeDefined();
    expect(screen.getByText('Estudiantes Destacados')).toBeDefined();
    expect(screen.getByText('Riesgo Académico')).toBeDefined();
    expect(screen.getByText('Análisis de Asignaturas')).toBeDefined();
    expect(screen.getByText('Comparativa de Grupos')).toBeDefined();
    expect(screen.getByText('Mapa de Calor')).toBeDefined();
    expect(screen.getByText('Retroalimentación')).toBeDefined();
    expect(screen.getByText('Registro Oficial')).toBeDefined();
  });

  it('exposes active report navigation state without relying on visual classes', () => {
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        estudiantes: mockStudents,
        config: { P1: 33.3, P2: 33.3, P3: 33.4 },
        selectedGrupo: '10A',
        availableGroups: ['Todos', '10A'],
        setGrupo: vi.fn()
      };
      return selector(state);
    });

    render(<ReportsTab />);

    expect(screen.getByRole('button', { name: /Rendimiento Grupal/i }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: /Estudiantes Destacados/i }).getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(screen.getByRole('button', { name: /Estudiantes Destacados/i }));

    expect(screen.getByRole('button', { name: /Rendimiento Grupal/i }).getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByRole('button', { name: /Estudiantes Destacados/i }).getAttribute('aria-pressed')).toBe('true');
  });

  it('keeps a dedicated printable report header available when dark mode is active', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        estudiantes: mockStudents,
        config: { P1: 33.3, P2: 33.3, P3: 33.4 },
        selectedGrupo: '10A',
        availableGroups: ['Todos', '10A'],
        setGrupo: vi.fn()
      };
      return selector(state);
    });

    render(<ReportsTab />);

    const printableHeader = screen.getByRole('region', { name: /encabezado imprimible/i });
    expect(printableHeader.textContent).toContain('IEEC - Consolidado Institucional');
    expect(printableHeader.textContent).toContain('Grupo: 10A');
    expect(printableHeader.textContent).toContain('Reporte: Rendimiento Grupal');
  });

  it('toggles between different report types on selection', () => {
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        estudiantes: mockStudents,
        config: { P1: 33.3, P2: 33.3, P3: 33.4 },
        selectedGrupo: '10A',
        availableGroups: ['Todos', '10A'],
        setGrupo: vi.fn()
      };
      return selector(state);
    });

    render(<ReportsTab />);

    // Default should be Rendimiento Grupal
    expect(screen.getByText('Reporte de Rendimiento Grupal - Grupo 10A')).toBeDefined();

    // Click on "Estudiantes Destacados"
    fireEvent.click(screen.getByText('Estudiantes Destacados'));
    expect(screen.getByText('Estudiantes Destacados - Grupo 10A')).toBeDefined();

    // Click on "Riesgo Académico"
    fireEvent.click(screen.getByText('Riesgo Académico'));
    expect(screen.getByText('Estudiantes en Riesgo Académico - Grupo 10A')).toBeDefined();
  });

  it('respects P4 visibility cleanly according to config', () => {
    // Case 1: P4 is not present
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        estudiantes: mockStudents,
        config: { P1: 33.3, P2: 33.3, P3: 33.4 },
        selectedGrupo: '10A',
        availableGroups: ['Todos', '10A'],
        setGrupo: vi.fn()
      };
      return selector(state);
    });

    const { rerender } = render(<ReportsTab />);

    // Go to "Registro Oficial"
    fireEvent.click(screen.getByText('Registro Oficial'));
    
    // Check table headers, should NOT show P4
    expect(screen.queryByText('P4')).toBeNull();

    // Case 2: P4 is present and active
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        estudiantes: mockStudents,
        config: { P1: 25, P2: 25, P3: 25, P4: 25 },
        selectedGrupo: '10A',
        availableGroups: ['Todos', '10A'],
        setGrupo: vi.fn()
      };
      return selector(state);
    });

    rerender(<ReportsTab />);
    // "P4" should be present as header or cell
    expect(screen.getAllByText('P4').length).toBeGreaterThan(0);
  });

  it('renders student feedback cards with enhanced pedagogical metrics', () => {
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        estudiantes: mockStudents,
        config: { P1: 33.3, P2: 33.3, P3: 33.4 },
        selectedGrupo: '10A',
        availableGroups: ['Todos', '10A'],
        setGrupo: vi.fn()
      };
      return selector(state);
    });

    render(<ReportsTab />);

    // Click on "Retroalimentación"
    fireEvent.click(screen.getByText('Retroalimentación'));

    // Check header
    expect(screen.getByText('Fichas de Retroalimentación de Alumnos - Grupo 10A')).toBeDefined();

    // Check student name
    expect(screen.getByText('Ana Perez')).toBeDefined();

    // Check KPIs
    expect(screen.getAllByText('Promedio').length).toBe(2);
    expect(screen.getAllByText('Puesto').length).toBe(2);
    expect(screen.getAllByText('Media Grupal').length).toBe(2);
    expect(screen.getAllByText('Carga Académica').length).toBe(2);

    // Check that we display the average grade of the first student (Ana Perez: average of 4.8 and 2.5 is 3.65)
    expect(screen.getByText('3.65')).toBeDefined();

    // Check that the weakness is shown
    expect(screen.getAllByText('Ciencias').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Nota Req:/i).length).toBeGreaterThan(0);
  });
});
