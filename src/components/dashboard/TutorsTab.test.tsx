import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import 'vitest-axe/extend-expect';
import 'vitest-axe/extend-expect';
import { TutorsTab } from './TutorsTab';
import { useDashboardStore } from '../../store/useDashboardStore';

describe('TutorsTab', () => {
  const testStudents = [
    {
      id: 'T1', name: 'Tutor 1', CURSO: '10A', grupo: '10A', areas: {
        MATEMATICAS: { name: 'MATEMATICAS', areaStats: { promedioActual: 4.5, defP1: 4.5, defP2: 4.5, defP3: 4.5, faltas: 0 } }
      }
    },
    {
      id: 'T2', name: 'Tutor 2', CURSO: '10A', grupo: '10A', areas: {
        MATEMATICAS: { name: 'MATEMATICAS', areaStats: { promedioActual: 4.2, defP1: 4.2, defP2: 4.2, defP3: 4.2, faltas: 0 } }
      }
    },
    {
      id: 'M1', name: 'Mentee 1', CURSO: '10A', grupo: '10A', areas: {
        MATEMATICAS: { name: 'MATEMATICAS', areaStats: { promedioActual: 2.0, defP1: 2.0, defP2: 2.0, defP3: 2.0, faltas: 0 } }
      }
    },
    {
      id: 'M2', name: 'Mentee 2', CURSO: '10A', grupo: '10A', areas: {
        MATEMATICAS: { name: 'MATEMATICAS', areaStats: { promedioActual: 2.1, defP1: 2.1, defP2: 2.1, defP3: 2.1, faltas: 0 } }
      }
    },
    {
      id: 'M3', name: 'Mentee 3', CURSO: '10A', grupo: '10A', areas: {
        MATEMATICAS: { name: 'MATEMATICAS', areaStats: { promedioActual: 2.2, defP1: 2.2, defP2: 2.2, defP3: 2.2, faltas: 0 } }
      }
    },
    {
      id: 'M4', name: 'Mentee 4', CURSO: '10A', grupo: '10A', areas: {
        MATEMATICAS: { name: 'MATEMATICAS', areaStats: { promedioActual: 2.3, defP1: 2.3, defP2: 2.3, defP3: 2.3, faltas: 0 } }
      }
    },
    {
      id: 'M5', name: 'Mentee 5', CURSO: '10A', grupo: '10A', areas: {
        MATEMATICAS: { name: 'MATEMATICAS', areaStats: { promedioActual: 2.4, defP1: 2.4, defP2: 2.4, defP3: 2.4, faltas: 0 } }
      }
    },
    {
      id: 'M6', name: 'Mentee 6', CURSO: '10A', grupo: '10A', areas: {
        MATEMATICAS: { name: 'MATEMATICAS', areaStats: { promedioActual: 2.5, defP1: 2.5, defP2: 2.5, defP3: 2.5, faltas: 0 } }
      }
    },
    {
      id: 'M7', name: 'Mentee 7 (Unassigned)', CURSO: '10A', grupo: '10A', areas: {
        MATEMATICAS: { name: 'MATEMATICAS', areaStats: { promedioActual: 2.6, defP1: 2.6, defP2: 2.6, defP3: 2.6, faltas: 0 } }
      }
    },
    // Another group to test filtering
    {
      id: 'T3', name: 'Tutor 3', CURSO: '10B', grupo: '10B', areas: {
        CIENCIAS: { name: 'CIENCIAS', areaStats: { promedioActual: 4.8, defP1: 4.8, defP2: 4.8, defP3: 4.8, faltas: 0 } }
      }
    }
  ];

  beforeEach(() => {
    useDashboardStore.setState({
      estudiantes: testStudents as any,
      selectedGrupo: 'Todos',
      setGrupo: (g: string) => useDashboardStore.setState({ selectedGrupo: g })
    });
  });

  it('renders empty state when no students', () => {
    useDashboardStore.setState({ estudiantes: [] });
    render(<TutorsTab />);
    expect(screen.getByText('No hay datos cargados.')).toBeInTheDocument();
  });

  it('has no accessibility violations when empty', async () => {
    useDashboardStore.setState({ estudiantes: [] });
    const { container } = render(<TutorsTab />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations with data', async () => {
    const { container } = render(<TutorsTab />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders matching logic correctly for group 10A (tutors, mentees, unassigned)', () => {
    render(<TutorsTab />);

    // Group 10A should be selected by default because selectedGrupo was 'Todos' and it falls back to groups[0] -> 10A
    expect(screen.getByText('Mentores Disponibles')).toBeInTheDocument();
    expect(screen.getAllByText('2').length).toBeGreaterThan(0); // 2 tutors
    expect(screen.getByText('Estudiantes en Riesgo')).toBeInTheDocument();
    expect(screen.getAllByText('7').length).toBeGreaterThan(0); // 7 mentees
    expect(screen.getByText('Emparejamientos Exitosos')).toBeInTheDocument();
    expect(screen.getAllByText('2').length).toBeGreaterThan(0); // 2 capacity

    // Tutors are rendered
    expect(screen.getByText('Tutor 1')).toBeInTheDocument();
    expect(screen.getByText('Tutor 2')).toBeInTheDocument();

    // Mentees are distributed (3 max per tutor) -> Mentee 7 is unassigned
    expect(screen.getByText('Mentee 7 (Unassigned)')).toBeInTheDocument();
    expect(screen.getByText('Estudiantes sin mentor (1)')).toBeInTheDocument();
  });

  it('shows no matches necessary when no tutors or mentees in group/area', async () => {
    // Select group 10B which only has Tutor 3 and no mentees
    useDashboardStore.setState({ selectedGrupo: '10B' });
    render(<TutorsTab />);

    expect(screen.getByText('No hay emparejamientos necesarios')).toBeInTheDocument();
  });

  it('changes group and area successfully', async () => {
    render(<TutorsTab />);

    expect(screen.getByText('Mentee 1')).toBeInTheDocument(); // From 10A

    const groupSelect = screen.getByDisplayValue('Grupo 10A');
    await userEvent.selectOptions(groupSelect, '10B');

    expect(screen.getByText('No hay emparejamientos necesarios')).toBeInTheDocument();

    const areaSelect = screen.getByDisplayValue('CIENCIAS');
    expect(areaSelect).toBeInTheDocument();
  });

  it('does NOT call setGrupo during mount when a specific group is already selected', () => {
    const setGrupoSpy = vi.fn();
    useDashboardStore.setState({
      estudiantes: testStudents as any,
      selectedGrupo: '10A',
      setGrupo: setGrupoSpy,
    });

    render(<TutorsTab />);

    // setGrupo MUST NOT be called inside useEffect during mount
    expect(setGrupoSpy).not.toHaveBeenCalled();
  });

  it('renders correctly even when selectedGrupo is "Todos" without mutating global store', () => {
    const setGrupoSpy = vi.fn();
    useDashboardStore.setState({
      estudiantes: testStudents as any,
      selectedGrupo: 'Todos',
      setGrupo: setGrupoSpy,
    });

    render(<TutorsTab />);

    // Should show group 10A without calling setGrupo
    const groupSelect = screen.getByDisplayValue('Grupo 10A');
    expect(groupSelect).toBeInTheDocument();
    expect(setGrupoSpy).not.toHaveBeenCalled();
  });
});
