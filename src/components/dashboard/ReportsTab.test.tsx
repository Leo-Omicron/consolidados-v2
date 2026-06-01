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
        areaStats: { promedioActual: 2.5, p4Min: 3.5, estado: { text: 'Recuperable', color: 'blue' } },
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

  it('toggles between different report types on selection', async () => {
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
    expect(await screen.findByText('Reporte de Rendimiento Grupal - Grupo 10A')).toBeDefined();

    // Click on "Estudiantes Destacados"
    fireEvent.click(screen.getByText('Estudiantes Destacados'));
    expect(await screen.findByText('Estudiantes Destacados - Grupo 10A')).toBeDefined();

    // Click on "Riesgo Académico"
    fireEvent.click(screen.getByText('Riesgo Académico'));
    expect(await screen.findByText('Estudiantes en Riesgo Académico - Grupo 10A')).toBeDefined();
  });

  it('respects P4 visibility cleanly according to config', async () => {
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
    await screen.findByText(/Registro de Calificaciones Oficial/i); // Wait for lazy load
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
    const p4Elements = await screen.findAllByText('P4');
    expect(p4Elements.length).toBeGreaterThan(0);
  });

  it('renders student feedback cards with enhanced pedagogical metrics', async () => {
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
    expect(await screen.findByText('Fichas de Retroalimentación de Alumnos - Grupo 10A')).toBeDefined();

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

  it('renders "Análisis de Asignaturas" tab', async () => {
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = { estudiantes: mockStudents, config: { P1: 33.3, P2: 33.3, P3: 33.4 }, selectedGrupo: '10A', availableGroups: ['Todos', '10A'], setGrupo: vi.fn() };
      return selector(state);
    });
    render(<ReportsTab />);
    fireEvent.click(screen.getByRole('button', { name: /Análisis de Asignaturas/i }));
    // Wait for the tab to render its content
    const elements = await screen.findAllByText(/Álgebra/i);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('renders "Comparativa de Grupos" tab', async () => {
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = { estudiantes: mockStudents, config: { P1: 33.3, P2: 33.3, P3: 33.4 }, selectedGrupo: 'Todos', availableGroups: ['Todos', '10A'], setGrupo: vi.fn() };
      return selector(state);
    });
    render(<ReportsTab />);
    fireEvent.click(screen.getByRole('button', { name: /Comparativa de Grupos/i }));
    // We expect 10A to be in the group comparison table
    const elements = await screen.findAllByText('10A');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('renders "Mapa de Calor" tab', async () => {
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = { estudiantes: mockStudents, config: { P1: 33.3, P2: 33.3, P3: 33.4 }, selectedGrupo: '10A', availableGroups: ['Todos', '10A'], setGrupo: vi.fn() };
      return selector(state);
    });
    render(<ReportsTab />);
    fireEvent.click(screen.getByRole('button', { name: /Mapa de Calor/i }));
    const elements = await screen.findAllByText('Ana Perez');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('handles printing using window.print', () => {
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = { estudiantes: mockStudents, config: { P1: 33.3, P2: 33.3, P3: 33.4 }, selectedGrupo: '10A', availableGroups: ['Todos', '10A'], setGrupo: vi.fn() };
      return selector(state);
    });
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<ReportsTab />);
    fireEvent.click(screen.getByRole('button', { name: /Imprimir Reporte/i }));
    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });

  it('handles excel export button click (alert fallback)', () => {
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = { estudiantes: [], config: {}, selectedGrupo: '10A', availableGroups: [], setGrupo: vi.fn() };
      return selector(state);
    });
    // With no students, it shouldn't export. But wait, if we mock students:
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = { estudiantes: mockStudents, config: { P1: 33.3, P2: 33.3, P3: 33.4 }, selectedGrupo: '10A', availableGroups: ['Todos', '10A'], setGrupo: vi.fn() };
      return selector(state);
    });
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<ReportsTab />);
    
    // Group performance export
    const exportBtn = screen.getByRole('button', { name: /Exportar Excel/i });
    fireEvent.click(exportBtn);
    // As it uses ExcelExportServiceImpl, we just check no crashes.
  });

  it('updates local director and period variables independently', async () => {
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = { estudiantes: mockStudents, config: { P1: 33.3, P2: 33.3, P3: 33.4 }, selectedGrupo: '10A', availableGroups: ['Todos', '10A'], setGrupo: vi.fn() };
      return selector(state);
    });
    render(<ReportsTab />);
    
    // Click on Registro Oficial since it uses Director/Period
    fireEvent.click(screen.getByText('Registro Oficial'));
    await screen.findByText(/Registro de Calificaciones Oficial/i);

    const inputDirector = screen.getByPlaceholderText('Ej. Prof. María Clara Gómez');
    const inputPeriodo = screen.getByPlaceholderText('Ej. Periodo 1, Primer Trimestre');

    fireEvent.change(inputDirector, { target: { value: 'Director Modificado' } });
    fireEvent.change(inputPeriodo, { target: { value: 'Periodo Especial' } });

    expect((inputDirector as HTMLInputElement).value).toBe('Director Modificado');
    expect((inputPeriodo as HTMLInputElement).value).toBe('Periodo Especial');
  });

  it('prevents Consolidado Completo export when condition is not met (disabled)', async () => {
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = { estudiantes: mockStudents, config: { P1: 33.3, P2: 33.3, P3: 33.4 }, selectedGrupo: 'Todos', availableGroups: ['Todos', '10A'], setGrupo: vi.fn() };
      return selector(state);
    });
    // Set tab to group-comparison to trigger the disabled state
    useUIStore.setState({ reportsActiveTab: 'group-comparison' });
    render(<ReportsTab />);

    const btn = screen.getByRole('button', { name: /Consolidado Completo/i });
    expect(btn.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(btn); // Should not do anything
  });

  it('allows Consolidado Completo export when in a specific group', async () => {
    (useDashboardStore as any).mockImplementation((selector: any) => {
      // Specific group allows it
      const state = { estudiantes: mockStudents, config: { P1: 33.3, P2: 33.3, P3: 33.4 }, selectedGrupo: '10A', availableGroups: ['Todos', '10A'], setGrupo: vi.fn() };
      return selector(state);
    });
    render(<ReportsTab />);

    const btn = screen.getByRole('button', { name: /Consolidado Completo/i });
    expect(btn.getAttribute('aria-disabled')).toBe('false');
    fireEvent.click(btn); // triggers export logic
  });
});
