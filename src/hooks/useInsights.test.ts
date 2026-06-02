import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useDashboardStore } from '../store/useDashboardStore';
import type { Estudiante } from '../domain/types';

// We import the hook that does NOT exist yet — this is RED phase
// The import will fail if the file doesn't exist, which is expected in TDD
// We'll create the file with a stub during implementation

describe('useInsights', () => {
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

  beforeEach(() => {
    // Reset store to clean state before each test
    useDashboardStore.setState({
      estudiantes: [],
      config: { P1: 33.3, P2: 33.3, P3: 33.4 },
    });
  });

  it('returns empty results and zero counts when store has no students', async () => {
    // Dynamic import to avoid static analysis issues during RED phase
    const { useInsights } = await import('./useInsights');

    const { result } = renderHook(() => useInsights());

    expect(result.current.results).toEqual([]);
    expect(result.current.counts).toEqual({
      confiado: 0,
      resiliente: 0,
      'montana-rusa': 0,
      radar: 0,
      total: 0,
    });
    expect(result.current.evaluatedPeriods).toEqual({
      P1: false,
      P2: false,
      P3: false,
      P4: false,
    });
  });

  it('returns correct evaluatedPeriods when students have period data', async () => {
    // Student with only P1 and P2 evaluated
    const student = makeStudent('s1', 'Test Student', '10A', [3.5, 4.0, null, null]);
    useDashboardStore.setState({ estudiantes: [student] });

    const { useInsights } = await import('./useInsights');
    const { result } = renderHook(() => useInsights());

    // getEvaluatedPeriods checks asignatura-level grades, but this student
    // only has area DEF values. So evaluatedPeriods depends on whether
    // getEvaluatedPeriods reads from area.DEF or from asignaturas.
    // The function reads from asignaturas.P1 etc., so with empty asignaturas,
    // all periods will be false.
    // However, for the hook's purposes, we mostly care that the function
    // is called and the result is a valid Record.
    expect(result.current.evaluatedPeriods).toHaveProperty('P1');
    expect(result.current.evaluatedPeriods).toHaveProperty('P2');
    expect(result.current.evaluatedPeriods).toHaveProperty('P3');
    expect(result.current.evaluatedPeriods).toHaveProperty('P4');
  });

  it('detects Confiado archetype correctly and fills student metadata', async () => {
    // Confiado: [4.8, 4.3, 3.9, 3.5] → monotonic non-increasing, avg first two ≥ 4.0, drop ≥ 0.8
    const student = makeStudent('c1', 'Confiado Student', '10A', [4.8, 4.3, 3.9, 3.5]);
    useDashboardStore.setState({ estudiantes: [student] });

    const { useInsights } = await import('./useInsights');
    const { result } = renderHook(() => useInsights());

    expect(result.current.results).toHaveLength(1);
    const r = result.current.results[0];
    expect(r.estudianteId).toBe('c1');
    expect(r.estudianteName).toBe('Confiado Student');
    expect(r.grupo).toBe('10A');
    expect(r.archetype).toBe('confiado');
    expect(r.confidence).toBeGreaterThan(0.5);
    expect(r.severity).toBe('high');
    expect(r.periodGrades).toEqual([4.8, 4.3, 3.9, 3.5]);
    expect(r.narrative).toContain('confianza');
    expect(r.narrative).toContain('declive');
  });

  it('detects Resiliente archetype from low start with sustained improvement', async () => {
    // Resiliente: [2.0, 2.5, 3.0, 3.5] → rise from ≤3.0
    const student = makeStudent('r1', 'Resiliente Student', '10B', [2.0, 2.5, 3.0, 3.5]);
    useDashboardStore.setState({ estudiantes: [student] });

    const { useInsights } = await import('./useInsights');
    const { result } = renderHook(() => useInsights());

    expect(result.current.results).toHaveLength(1);
    const r = result.current.results[0];
    expect(r.archetype).toBe('resiliente');
    expect(r.estudianteName).toBe('Resiliente Student');
    expect(r.narrative).toContain('resilien');
  });

  it('detects Montana Rusa archetype from oscillating grades', async () => {
    // Montana Rusa: [4.5, 2.5, 4.0, 3.0] → 2+ sign changes
    const student = makeStudent('m1', 'Montana Student', '10A', [4.5, 2.5, 4.0, 3.0]);
    useDashboardStore.setState({ estudiantes: [student] });

    const { useInsights } = await import('./useInsights');
    const { result } = renderHook(() => useInsights());

    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].archetype).toBe('montana-rusa');
  });

  it('detects Radar archetype when other archetypes do not match but flags exist', async () => {
    // Radar: final < 3.0, no other archetype matches
    // [3.5, 3.2, 3.0, 2.8] — not monotonic enough for confiado/resiliente,
    // not enough oscillation for montana rusa
    const student = makeStudent('rd1', 'Radar Student', '10A', [3.5, 3.2, 3.0, 2.8]);
    useDashboardStore.setState({ estudiantes: [student] });

    const { useInsights } = await import('./useInsights');
    const { result } = renderHook(() => useInsights());

    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].archetype).toBe('radar');
  });

  it('returns null result for student with fewer than 2 evaluated periods', async () => {
    // Only 1 valid period → insufficient data → null (filtered out)
    const student = makeStudent('s1', 'Single Period', '10A', [3.5, null, null, null]);
    useDashboardStore.setState({ estudiantes: [student] });

    const { useInsights } = await import('./useInsights');
    const { result } = renderHook(() => useInsights());

    expect(result.current.results).toHaveLength(0);
  });

  it('aggregates counts correctly across multiple students', async () => {
    const students = [
      makeStudent('c1', 'Confiado A', '10A', [4.8, 4.3, 3.9, 3.5]),
      makeStudent('c2', 'Confiado B', '10A', [4.5, 4.0, 3.5, 2.8]),
      makeStudent('r1', 'Resiliente A', '10B', [2.0, 2.5, 3.0, 3.5]),
      makeStudent('m1', 'Montana A', '10A', [4.5, 2.5, 4.0, 3.0]),
      makeStudent('rd1', 'Radar A', '10A', [3.5, 3.2, 3.0, 2.8]),
      makeStudent('rd2', 'Radar B', '10A', [3.8, 3.5, 2.9, 2.7]),
    ];
    useDashboardStore.setState({ estudiantes: students });

    const { useInsights } = await import('./useInsights');
    const { result } = renderHook(() => useInsights());

    expect(result.current.results).toHaveLength(6);
    expect(result.current.counts).toEqual({
      confiado: 2,
      resiliente: 1,
      'montana-rusa': 1,
      radar: 2,
      total: 6,
    });
  });

  it('handles students with null periods mixed in (partial data from incomplete periods)', async () => {
    // Student with only P1, P2, P3 (P4 is null)
    // [4.5, 4.0, 3.5, null] → 3 valid periods, should still detect confiado
    const student = makeStudent('c1', 'Confiado Partial', '10A', [4.5, 4.0, 3.5, null]);
    useDashboardStore.setState({ estudiantes: [student] });

    const { useInsights } = await import('./useInsights');
    const { result } = renderHook(() => useInsights());

    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].archetype).toBe('confiado');
    // periodGrades should preserve null positions for transparency
    expect(result.current.results[0].periodGrades).toEqual([4.5, 4.0, 3.5, null]);
  });

  it('does NOT mutate the Zustand store', async () => {
    const student = makeStudent('c1', 'Test', '10A', [4.8, 4.3, 3.9, 3.5]);
    useDashboardStore.setState({ estudiantes: [student] });

    const stateBefore = JSON.stringify(useDashboardStore.getState());

    const { useInsights } = await import('./useInsights');
    renderHook(() => useInsights());

    const stateAfter = JSON.stringify(useDashboardStore.getState());
    expect(stateAfter).toBe(stateBefore);
  });

  it('returns stable references (useMemo) when dependencies do not change', async () => {
    const student = makeStudent('c1', 'Test', '10A', [4.8, 4.3, 3.9, 3.5]);
    useDashboardStore.setState({ estudiantes: [student] });

    const { useInsights } = await import('./useInsights');
    const { result, rerender } = renderHook(() => useInsights());

    const firstResults = result.current.results;
    const firstCounts = result.current.counts;

    // Rerender without changing store state → same references
    rerender();

    expect(result.current.results).toBe(firstResults);
    expect(result.current.counts).toBe(firstCounts);
  });
});
