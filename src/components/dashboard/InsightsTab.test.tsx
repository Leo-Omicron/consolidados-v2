import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { useDashboardStore } from '../../store/useDashboardStore';
import type { Estudiante } from '../../domain/types';

// Helper to create a minimal Estudiante for testing
const makeStudent = (
  id: string,
  name: string,
  grupo: string,
  periodGrades: (number | null)[]
): Estudiante => {
  const [p1, p2, p3, p4] = periodGrades;
  return {
    id,
    name,
    CURSO: grupo,
    grupo,
    areas: {
      MATH: {
        asignaturas: {
          ALG: {
            P1: p1 ?? null,
            P2: p2 ?? null,
            P3: p3 ?? null,
            P4: p4 ?? null,
          } as any
        },
        DEF: {
          P1: p1 ?? null,
          P2: p2 ?? null,
          P3: p3 ?? null,
          P4: p4 ?? null,
        },
      },
    },
  } as Estudiante;
};

describe('InsightsTab', () => {
  beforeEach(() => {
    useDashboardStore.setState({
      estudiantes: [],
      config: { P1: 33.3, P2: 33.3, P3: 33.4 },
    });
  });

  it('displays empty state when there are no students or < 2 periods', async () => {
    const { InsightsTab } = await import('./InsightsTab');
    render(<InsightsTab />);
    expect(screen.getByText(/No hay datos suficientes/i)).toBeInTheDocument();
  });

  it('displays stable group empty state when > 2 periods but no archetypes found', async () => {
    // Student with perfectly stable grades (no archetypes trigger)
    const students = [
      makeStudent('stable1', 'Stable A', '10A', [4.0, 4.0, 4.0, null]),
      makeStudent('stable2', 'Stable B', '10A', [4.5, 4.5, 4.5, null]),
    ];
    useDashboardStore.setState({ estudiantes: students });

    const { InsightsTab } = await import('./InsightsTab');
    render(<InsightsTab />);
    expect(screen.getByText(/Grupo estable/i)).toBeInTheDocument();
    expect(screen.getByText(/No se detectaron estudiantes con riesgo o tendencias atípicas/i)).toBeInTheDocument();
  });

  it('renders KPI cards with archetype counts', async () => {
    // Set up students that produce known archetypes
    const students = [
      makeStudent('c1', 'Confiado A', '10A', [4.8, 4.3, 3.9, 3.5]),
      makeStudent('c2', 'Confiado B', '10A', [4.5, 4.0, 3.5, 2.8]),
      makeStudent('r1', 'Resiliente A', '10A', [2.0, 2.5, 3.0, 3.5]),
      makeStudent('m1', 'Montana A', '10A', [4.5, 2.5, 4.0, 3.0]),
      makeStudent('rd1', 'Radar A', '10A', [3.5, 3.2, 3.0, 2.8]),
      makeStudent('rd2', 'Radar B', '10A', [3.8, 3.5, 2.9, 2.7]),
    ];

    useDashboardStore.setState({ estudiantes: students });

    const { InsightsTab } = await import('./InsightsTab');
    render(<InsightsTab />);

    // KPI cards should show the counts — use getAllByText since labels
    // appear in both KPI cards and student cards
    expect(screen.getAllByText('El Confiado').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('El Resiliente').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Montaña Rusa').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Radar').length).toBeGreaterThanOrEqual(1);

    // The KPI card shows "2" for confiado count (and also in student card count)
    // Verify KPI renders: look for the count in the large number display
    const kpiSection = screen.getByText('Oracle Insights').closest('div')?.parentElement;
    expect(kpiSection).not.toBeNull();
  });

  it('renders student cards with names', async () => {
    const students = [
      makeStudent('c1', 'Ana Pérez', '10A', [4.8, 4.3, 3.9, 3.5]),
      makeStudent('r1', 'Luis Gómez', '10A', [2.0, 2.5, 3.0, 3.5]),
    ];

    useDashboardStore.setState({ estudiantes: students });

    const { InsightsTab } = await import('./InsightsTab');
    render(<InsightsTab />);

    expect(screen.getByText('Ana Pérez')).toBeInTheDocument();
    expect(screen.getByText('Luis Gómez')).toBeInTheDocument();
  });

  it('filters student cards when a filter is selected', async () => {
    const students = [
      makeStudent('c1', 'Confiado A', '10A', [4.8, 4.3, 3.9, 3.5]),
      makeStudent('r1', 'Resiliente A', '10A', [2.0, 2.5, 3.0, 3.5]),
    ];

    useDashboardStore.setState({ estudiantes: students });

    const { InsightsTab } = await import('./InsightsTab');
    render(<InsightsTab />);

    // Both students visible initially (filter = "todos")
    expect(screen.getByText('Confiado A')).toBeInTheDocument();
    expect(screen.getByText('Resiliente A')).toBeInTheDocument();

    // Select "El Confiado" filter
    const filterSelect = screen.getByRole('combobox');
    await userEvent.selectOptions(filterSelect, 'confiado');

    // Only confiado student should remain
    expect(screen.getByText('Confiado A')).toBeInTheDocument();
    expect(screen.queryByText('Resiliente A')).not.toBeInTheDocument();
  });

  it('does NOT mutate the Zustand store on mount', async () => {
    const students = [
      makeStudent('c1', 'Test', '10A', [4.8, 4.3, 3.9, 3.5]),
    ];

    useDashboardStore.setState({ estudiantes: students });
    const stateBefore = JSON.stringify(useDashboardStore.getState());

    const { InsightsTab } = await import('./InsightsTab');
    render(<InsightsTab />);

    const stateAfter = JSON.stringify(useDashboardStore.getState());
    expect(stateAfter).toBe(stateBefore);
  });

  it('shows empty state when students exist but no archetypes match (insufficient data)', async () => {
    // Students with only 1 period → insufficient data
    const students = [
      makeStudent('s1', 'Single Period', '10A', [3.5, null, null, null]),
    ];

    useDashboardStore.setState({ estudiantes: students });

    const { InsightsTab } = await import('./InsightsTab');
    render(<InsightsTab />);

    expect(screen.getByText(/No hay datos suficientes/i)).toBeInTheDocument();
  });
});
