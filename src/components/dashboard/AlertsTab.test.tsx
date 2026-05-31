import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AlertsTab } from './AlertsTab';
import { useDashboardStore } from '../../store/useDashboardStore';


// Mock react-to-print
const mockHandlePrint = vi.fn();
vi.mock('react-to-print', () => ({
  useReactToPrint: () => mockHandlePrint,
}));

// Mock FeedbackCard to avoid rendering complex component
vi.mock('./FeedbackCard', () => ({
  FeedbackCard: ({ report }: any) => <div data-testid="feedback-card">Feedback for {report.studentName}</div>
}));

describe('AlertsTab', () => {
  const testStudents = [
    {
      id: 'S1',
      name: 'Estudiante Imposible',
      CURSO: '10A',
      grupo: '10A',
      areas: {
        MATEMATICAS: { name: 'MATEMATICAS', DEF: { P1: 1.0, P2: 1.0, P3: 1.0 }, areaStats: { promedioActual: 1.0, defP1: 1.0, defP2: 1.0, defP3: 1.0, p4Min: 5.1, estado: { text: 'Perdido', color: 'red' }, faltas: 0 }, asignaturas: {} }
      }
    },
    {
      id: 'S2',
      name: 'Estudiante Severo',
      CURSO: '10A',
      grupo: '10A',
      areas: {
        MATEMATICAS: { name: 'MATEMATICAS', DEF: { P1: 2.5, P2: 2.5, P3: 2.5 }, areaStats: { promedioActual: 2.5, defP1: 2.5, defP2: 2.5, defP3: 2.5, p4Min: 4.5, estado: { text: 'En riesgo', color: 'orange' }, faltas: 0 }, asignaturas: {} },
        LENGUAJE: { name: 'LENGUAJE', DEF: { P1: 2.5, P2: 2.5, P3: 2.5 }, areaStats: { promedioActual: 2.5, defP1: 2.5, defP2: 2.5, defP3: 2.5, p4Min: 4.5, estado: { text: 'En riesgo', color: 'orange' }, faltas: 0 }, asignaturas: {} },
        CIENCIAS: { name: 'CIENCIAS', DEF: { P1: 2.5, P2: 2.5, P3: 2.5 }, areaStats: { promedioActual: 2.5, defP1: 2.5, defP2: 2.5, defP3: 2.5, p4Min: 4.5, estado: { text: 'En riesgo', color: 'orange' }, faltas: 0 }, asignaturas: {} }
      }
    },
    {
      id: 'S3',
      name: 'Estudiante Alerta',
      CURSO: '10B',
      grupo: '10B',
      areas: {
        MATEMATICAS: { name: 'MATEMATICAS', DEF: { P1: 2.5, P2: 2.5, P3: 2.5 }, areaStats: { promedioActual: 2.5, defP1: 2.5, defP2: 2.5, defP3: 2.5, p4Min: 4.5, estado: { text: 'En riesgo', color: 'orange' }, faltas: 0 }, asignaturas: {} }
      }
    },
    {
      id: 'S4',
      name: 'Estudiante Excelente',
      CURSO: '10B',
      grupo: '10B',
      areas: {
        MATEMATICAS: { name: 'MATEMATICAS', DEF: { P1: 4.5, P2: 4.5, P3: 4.5 }, areaStats: { promedioActual: 4.5, defP1: 4.5, defP2: 4.5, defP3: 4.5, p4Min: 0, estado: { text: 'Excelente', color: 'blue' }, faltas: 0 }, asignaturas: {} }
      }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useDashboardStore.setState({
      estudiantes: testStudents as any,
      config: { P1: 25, P2: 25, P3: 25, P4: 25 },
      selectedGrupo: 'Todos',
      setGrupo: (grupo: string) => useDashboardStore.setState({ selectedGrupo: grupo })
    });
  });

  it('renders correctly when there are no alerts', () => {
    useDashboardStore.setState({
      estudiantes: [],
      config: { P1: 25, P2: 25, P3: 25, P4: 25 },
      selectedGrupo: 'Todos',
      availableGroups: ['Todos']
    });
    render(<AlertsTab />);
    
    expect(screen.getByText('No hay datos cargados.')).toBeDefined();
  });

  it('has no accessibility violations when empty', async () => {
    useDashboardStore.setState({
      estudiantes: [],
      config: { P1: 25, P2: 25, P3: 25, P4: 25 },
      selectedGrupo: 'Todos',
      availableGroups: ['Todos']
    });
    const { container } = render(<AlertsTab />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders empty state when no students', () => {
    useDashboardStore.setState({ estudiantes: [] });
    render(<AlertsTab />);
    expect(screen.getByText('No hay datos cargados.')).toBeInTheDocument();
  });

  it('renders summary counts correctly for all groups', () => {
    render(<AlertsTab />);
    expect(screen.getByText('Riesgo Imposible')).toBeInTheDocument();
    expect(screen.getByText('Severo')).toBeInTheDocument();
    expect(screen.getByText('Alerta')).toBeInTheDocument();
    
    // Test the count of each group
    // Estudiante Imposible needs > 5.0 (average 1.0) -> Imposible
    // Estudiante Severo has 3 failed areas -> Severo
    // Estudiante Alerta has 1 failed area -> Alerta
    const counts = screen.getAllByText('1');
    expect(counts.length).toBeGreaterThanOrEqual(3);
  });

  it('renders student detail cards with correct styling', () => {
    render(<AlertsTab />);
    expect(screen.getByText('Estudiante Severo')).toBeInTheDocument();
    expect(screen.getByText('Estudiante Alerta')).toBeInTheDocument();
    expect(screen.getByText('Estudiante Imposible')).toBeInTheDocument();
    
    // Estudiante Imposible should show Requiere > 5.0
    expect(screen.getByText('Requiere > 5.0 en:')).toBeInTheDocument();
    expect(screen.getAllByText('MATEMATICAS').length).toBeGreaterThan(0);
    
    // Estudiante Severo should show 3 AREAS
    expect(screen.getByText('3 ÁREAS')).toBeInTheDocument();
    
    // Estudiante Alerta should show 1 ÁREAS
    expect(screen.getAllByText('1 ÁREAS').length).toBeGreaterThan(0);
  });

  it('renders excellent state when no students are at risk in a group', () => {
    const excellentStudents = [
      {
        id: 'S4',
        name: 'Estudiante Excelente',
        CURSO: '10C',
        grupo: '10C',
        areas: {
          MATEMATICAS: { name: 'MATEMATICAS', DEF: { P1: 4.5, P2: 4.5, P3: 4.5 }, areaStats: { promedioActual: 4.5, defP1: 4.5, defP2: 4.5, defP3: 4.5, p4Min: 0, estado: { text: 'Excelente', color: 'blue' }, faltas: 0 }, asignaturas: {} }
        }
      }
    ];
    useDashboardStore.setState({ estudiantes: excellentStudents as any });
    
    render(<AlertsTab />);
    expect(screen.getByText('🎉 ¡Excelente! No se detectaron estudiantes en riesgo para este grupo.')).toBeInTheDocument();
  });

  it('filters students by group', async () => {
    render(<AlertsTab />);
    
    expect(screen.getByText('Estudiante Imposible')).toBeInTheDocument();
    expect(screen.getByText('Estudiante Alerta')).toBeInTheDocument();

    const select = screen.getByLabelText(/Grupo/i);
    await userEvent.selectOptions(select, '10B');
    
    expect(screen.queryByText('Estudiante Imposible')).not.toBeInTheDocument();
    expect(screen.getByText('Estudiante Alerta')).toBeInTheDocument();
  });
  it('calls print function when print button is clicked', async () => {
    render(<AlertsTab />);
    const button = screen.getByRole('button', { name: /Imprimir Boletines/i });
    
    expect(button).not.toBeDisabled();
    
    await userEvent.click(button);
    expect(mockHandlePrint).toHaveBeenCalled();
  });

  it('disables print button when no feedback reports available', () => {
    useDashboardStore.setState({ estudiantes: [] }); // This returns early though
    
    const excellentStudents = [
      {
        id: 'S4',
        name: 'Estudiante Excelente',
        CURSO: '10C',
        grupo: '10C',
        areas: {
          MATEMATICAS: { name: 'MATEMATICAS', DEF: { P1: 4.5, P2: 4.5, P3: 4.5 }, areaStats: { promedioActual: 4.5, defP1: 4.5, defP2: 4.5, defP3: 4.5, p4Min: 0, estado: { text: 'Excelente', color: 'blue' }, faltas: 0 }, asignaturas: {} }
        }
      }
    ];
    useDashboardStore.setState({ estudiantes: excellentStudents as any });
    
    render(<AlertsTab />);
    const button = screen.getByRole('button', { name: /Imprimir Boletines/i });
    expect(button).toBeDisabled();
  });
});
