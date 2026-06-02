import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { ReportsTab } from './ReportsTab';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useUIStore } from '../../store/useUIStore';
import type { Estudiante } from '../../domain/types';

// Helper to create a student with period grades
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
        asignaturas: {} as Record<string, any>,
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

describe('ReportsTab — Insights Wiring (PR 3)', () => {
  beforeEach(() => {
    useDashboardStore.setState({
      estudiantes: [],
      config: { P1: 33.3, P2: 33.3, P3: 33.4 },
      selectedGrupo: 'Todos',
      availableGroups: ['Todos', '10A'],
    });
    useUIStore.setState({
      analysisFilters: { search: '', area: '', status: '' },
      analysisSortConfig: null,
      reportsActiveTab: 'group-performance',
    });
  });

  describe('Menu item presence', () => {
    it('shows the "Oracle Insights" menu item when students are present', () => {
      const students = [
        makeStudent('c1', 'Confiado A', '10A', [4.8, 4.3, 3.9, 3.5]),
      ];
      useDashboardStore.setState({ estudiantes: students });

      render(<ReportsTab />);

      // The Oracle Insights menu item should be visible in the sidebar
      const insightsButton = screen.getByRole('button', { name: /Oracle Insights/i });
      expect(insightsButton).toBeInTheDocument();
    });

    it('hides the "Oracle Insights" menu item when no students are present', () => {
      useDashboardStore.setState({ estudiantes: [] });

      render(<ReportsTab />);

      // When there are no students, ReportsTab shows the empty-data message
      // and the sidebar with menu items is not rendered at all
      expect(screen.getByText('No hay datos para generar reportes. Cargue un archivo Excel.')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Oracle Insights/i })).not.toBeInTheDocument();
    });
  });

  describe('Tab navigation', () => {
    it('switches to the insights tab when clicking "Oracle Insights"', async () => {
      const students = [
        makeStudent('c1', 'Confiado A', '10A', [4.8, 4.3, 3.9, 3.5]),
      ];
      useDashboardStore.setState({ estudiantes: students });

      render(<ReportsTab />);

      // Initially, "Oracle Insights" should NOT be pressed
      const insightsButton = screen.getByRole('button', { name: /Oracle Insights/i });
      expect(insightsButton.getAttribute('aria-pressed')).toBe('false');

      // Click "Oracle Insights"
      await userEvent.click(insightsButton);

      // After clicking, "Oracle Insights" should be the pressed/active tab
      expect(insightsButton.getAttribute('aria-pressed')).toBe('true');

      // The store should now reflect the insights tab
      expect(useUIStore.getState().reportsActiveTab).toBe('insights');
    });

    it('renders InsightsTab content within ReportsTab when insights tab is active', async () => {
      const students = [
        makeStudent('c1', 'Ana Pérez', '10A', [4.8, 4.3, 3.9, 3.5]),
        makeStudent('r1', 'Luis Gómez', '10A', [2.0, 2.5, 3.0, 3.5]),
      ];
      useDashboardStore.setState({ estudiantes: students });

      render(<ReportsTab />);

      // Click "Oracle Insights"
      const insightsButton = screen.getByRole('button', { name: /Oracle Insights/i });
      await userEvent.click(insightsButton);

      // The InsightsTab should now be rendered — look for its heading (use async for lazy load)
      expect(await screen.findByRole('heading', { name: 'Oracle Insights' })).toBeInTheDocument();

      // KPI cards should appear (these come from InsightsTab)
      const confiadoElements = await screen.findAllByText('El Confiado');
      expect(confiadoElements.length).toBeGreaterThanOrEqual(1);

      const resilienteElements = await screen.findAllByText('El Resiliente');
      expect(resilienteElements.length).toBeGreaterThanOrEqual(1);
    });

    it('shows InsightsTab empty state when no archetypes are detected', async () => {
      // Students with only 1 period → insufficient data → empty state
      const students = [
        makeStudent('s1', 'Single Period', '10A', [3.5, null, null, null]),
      ];
      useDashboardStore.setState({ estudiantes: students });

      render(<ReportsTab />);

      // Click "Oracle Insights"
      const insightsButton = screen.getByRole('button', { name: /Oracle Insights/i });
      await userEvent.click(insightsButton);

      // The InsightsTab empty state should render
      expect(await screen.findByRole('heading', { name: 'Oracle Insights' })).toBeInTheDocument();
      expect(screen.getByText(/No hay datos suficientes/i)).toBeInTheDocument();
    });
  });

  describe('Store immutability', () => {
    it('does NOT mutate the Zustand store when InsightsTab renders via ReportsTab', async () => {
      const students = [
        makeStudent('c1', 'Test Student', '10A', [4.8, 4.3, 3.9, 3.5]),
      ];
      useDashboardStore.setState({ estudiantes: students });

      const stateBefore = JSON.stringify(useDashboardStore.getState());

      render(<ReportsTab />);

      // Navigate to insights tab
      const insightsButton = screen.getByRole('button', { name: /Oracle Insights/i });
      await userEvent.click(insightsButton);

      // Store should be unchanged
      const stateAfter = JSON.stringify(useDashboardStore.getState());
      expect(stateAfter).toBe(stateBefore);
    });
  });
});
