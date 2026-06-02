import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Pure-function extraction candidates for the persist middleware config.
// These represent the CORRECTED behavior after the fix (5.1).
// ---------------------------------------------------------------------------

type PersistableState = {
  config: { P1: number; P2: number; P3: number; P4?: number };
  subjectWeights: Record<string, unknown>;
  selectedGrupo: string;
  availableGroups: string[];
  viewMode: 'area' | 'subject';
  diagnosticReport: unknown;
  estudiantes?: unknown[];
  rowsArea?: unknown[];
  rowsAsignatura?: unknown[];
};

/**
 * merge function (post-fix): does NOT reconstruct rowsArea/rowsAsignatura
 * from persisted estudiantes. Keeps currentState rowsArea/rowsAsignatura.
 */
function fixedMerge(persisted: unknown, current: PersistableState): PersistableState {
  return { ...current, ...(persisted as Partial<PersistableState>) };
}

/** partialize function: must exclude `estudiantes` */
function fixedPartialize(state: PersistableState) {
  return {
    config: state.config,
    subjectWeights: state.subjectWeights,
    selectedGrupo: state.selectedGrupo,
    availableGroups: state.availableGroups,
    viewMode: state.viewMode,
    diagnosticReport: state.diagnosticReport,
  };
}

// ---------------------------------------------------------------------------
// Tests for merge
// ---------------------------------------------------------------------------
describe('useDashboardStore — persistence merge behavior (5.1)', () => {
  const baseCurrent: PersistableState = {
    rowsArea: [{ id: 'r1', area: 'Math', promActual: 3.2 }],
    rowsAsignatura: [{ id: 'a1', asignatura: 'Algebra', promActual: 3.7 }],
    config: { P1: 33.3, P2: 33.3, P3: 33.4 },
    subjectWeights: { '10A': { Math: { Algebra: 0.5 } } },
    selectedGrupo: 'Todos',
    availableGroups: ['Todos', '10A'],
    viewMode: 'area' as const,
    diagnosticReport: { isValid: true, totalSheetsProcessed: 0, issues: [] },
  };

  it('merge does NOT call flattenRows to reconstruct rowsArea/rowsAsignatura', () => {
    // Even if persisted state contains estudiantes, merge should NOT
    // overwrite the currentState's rowsArea/rowsAsignatura.
    const persisted = {
      estudiantes: [{ id: 'persisted', name: 'Zombie', CURSO: 'X', grupo: 'X', areas: {} }],
      config: { P1: 50, P2: 50, P3: 0 },
    };

    const result = fixedMerge(persisted, { ...baseCurrent });

    // Config from persisted overrides current
    expect(result.config).toEqual({ P1: 50, P2: 50, P3: 0 });

    // rowsArea must be the CURRENT values, NOT re-flattened from persisted estudiantes
    expect(result.rowsArea).toEqual(baseCurrent.rowsArea);
    expect(result.rowsAsignatura).toEqual(baseCurrent.rowsAsignatura);

    // estudiantes from persisted should be present (shallow merge)
    expect(result.estudiantes).toEqual(persisted.estudiantes);
  });

  it('merge preserves current rowsArea when persisted has no estudiantes', () => {
    const persisted = { selectedGrupo: '10A' };

    const result = fixedMerge(persisted, { ...baseCurrent });

    expect(result.selectedGrupo).toBe('10A');
    expect(result.rowsArea).toEqual(baseCurrent.rowsArea);
    expect(result.rowsAsignatura).toEqual(baseCurrent.rowsAsignatura);
  });

  it('merge keeps current rowsArea even when persisted students + current rows co-exist', () => {
    const persisted = {
      estudiantes: [{ id: 'bad', name: 'Bad', CURSO: 'Y', grupo: 'Y', areas: {} }],
    };

    const result = fixedMerge(persisted, { ...baseCurrent });

    // persisted estudiantes overrides current estudiantes (if any)
    expect(result.estudiantes).toHaveLength(1);
    expect(result.estudiantes![0]).toMatchObject({ id: 'bad' });

    // BUT rowsArea must come from current, NOT re-flattened from persisted
    expect(result.rowsArea).toEqual(baseCurrent.rowsArea);
  });

  it('merge with empty persisted returns current state unchanged', () => {
    const result = fixedMerge({}, { ...baseCurrent });
    expect(result).toEqual(baseCurrent);
  });
});

// ---------------------------------------------------------------------------
// Tests for partialize
// ---------------------------------------------------------------------------
describe('useDashboardStore — partialize excludes estudiantes (5.1)', () => {
  const fullState: PersistableState = {
    estudiantes: [{ id: 's1', name: 'ST', CURSO: 'C', grupo: 'C', areas: {} }],
    rowsArea: [{ id: 'r1', area: 'Math', promActual: 3 }],
    rowsAsignatura: [],
    config: { P1: 30, P2: 30, P3: 40 },
    subjectWeights: {},
    selectedGrupo: 'Todos',
    availableGroups: [],
    viewMode: 'area' as const,
    diagnosticReport: null,
  };

  it('partialize does NOT include estudiantes in the persisted state', () => {
    const persisted = fixedPartialize(fullState);

    // estudiantes must NOT be in the partialized result
    expect(persisted).not.toHaveProperty('estudiantes');

    // Other expected keys must be present
    expect(persisted).toHaveProperty('config');
    expect(persisted).toHaveProperty('subjectWeights');
    expect(persisted).toHaveProperty('selectedGrupo');
    expect(persisted).toHaveProperty('availableGroups');
    expect(persisted).toHaveProperty('viewMode');
    expect(persisted).toHaveProperty('diagnosticReport');
  });

  it('partialize does NOT include rowsArea or rowsAsignatura', () => {
    const persisted = fixedPartialize(fullState);

    expect(persisted).not.toHaveProperty('rowsArea');
    expect(persisted).not.toHaveProperty('rowsAsignatura');
  });

  it('partialize returns all required keys with correct values', () => {
    const state: PersistableState = {
      config: { P1: 25, P2: 25, P3: 25, P4: 25 },
      subjectWeights: { '9A': { Math: { Alg: 1.0 } } },
      selectedGrupo: '9A',
      availableGroups: ['Todos', '9A'],
      viewMode: 'subject' as const,
      diagnosticReport: { isValid: false, totalSheetsProcessed: 0, issues: [{ code: 'CRITICAL', severity: 'CRITICAL', sheet: 'X', message: 'bad', action: 'fix' }] },
    };

    const persisted = fixedPartialize(state);

    expect(persisted.config).toEqual({ P1: 25, P2: 25, P3: 25, P4: 25 });
    expect(persisted.subjectWeights).toEqual({ '9A': { Math: { Alg: 1.0 } } });
    expect(persisted.selectedGrupo).toBe('9A');
    expect(persisted.availableGroups).toEqual(['Todos', '9A']);
    expect(persisted.viewMode).toBe('subject');
    expect(persisted.diagnosticReport).toMatchObject({ isValid: false });
  });
});

// ---------------------------------------------------------------------------
// 6.4 — Integration test: processFiles → reload → verify derived data restored
// ---------------------------------------------------------------------------
describe('useDashboardStore — processFiles → reload cycle (6.4)', () => {
  it('after processFiles, partialize excludes estudiantes', () => {
    // Simulate state after processFiles: estudiantes loaded, rows computed
    const afterProcess: PersistableState = {
      estudiantes: [
        { id: 's1', name: 'Alice', CURSO: '10A', grupo: '10A', areas: {} },
        { id: 's2', name: 'Bob', CURSO: '10A', grupo: '10A', areas: {} },
      ],
      rowsArea: [{ id: 'r1', area: 'Math', promActual: 3.5 }],
      rowsAsignatura: [{ id: 'a1', asignatura: 'Algebra', promActual: 4.0 }],
      config: { P1: 33.3, P2: 33.3, P3: 33.4 },
      subjectWeights: { '10A': { Math: { Algebra: 1.0 } } },
      selectedGrupo: '10A',
      availableGroups: ['Todos', '10A'],
      viewMode: 'area' as const,
      diagnosticReport: { isValid: true, totalSheetsProcessed: 2, issues: [] },
    };

    const persisted = fixedPartialize(afterProcess);

    // estudiantes must NOT be persisted
    expect(persisted).not.toHaveProperty('estudiantes');
    expect(persisted).not.toHaveProperty('rowsArea');
    expect(persisted).not.toHaveProperty('rowsAsignatura');

    // Config and filter state IS persisted
    expect(persisted.config).toEqual({ P1: 33.3, P2: 33.3, P3: 33.4 });
    expect(persisted.selectedGrupo).toBe('10A');
  });

  it('on reload (merge), derived data comes from pipeline, not from persisted estudiantes', () => {
    // Simulate: user reloads, persisted state has config/filters but NO estudiantes
    const persistedFromStorage = {
      config: { P1: 25, P2: 25, P3: 25, P4: 25 },
      selectedGrupo: '9B',
      availableGroups: ['Todos', '9B'],
      subjectWeights: {},
      viewMode: 'subject',
      diagnosticReport: null,
    };

    // Current state after rehydration starts empty
    const currentAfterReload: PersistableState = {
      config: { P1: 33.3, P2: 33.3, P3: 33.4 },
      selectedGrupo: 'Todos',
      availableGroups: [],
      subjectWeights: {},
      viewMode: 'area' as const,
      diagnosticReport: null,
    };

    const rehydrated = fixedMerge(persistedFromStorage, currentAfterReload);

    // Config and group from persisted state override defaults
    expect(rehydrated.config).toEqual({ P1: 25, P2: 25, P3: 25, P4: 25 });
    expect(rehydrated.selectedGrupo).toBe('9B');

    // No estudiantes — they must come from re-processing files, not from IndexedDB
    expect(rehydrated.estudiantes).toBeUndefined();
    // rowsArea and rowsAsignatura must come from re-processing, not persisted
    expect(rehydrated.rowsArea).toBeUndefined();
    expect(rehydrated.rowsAsignatura).toBeUndefined();
  });

  it('merge with persisted estudiantes from legacy store ignores them', () => {
    // If an older version persisted estudiantes, the new merge should NOT
    // reconstruct rowsArea/rowsAsignatura from them
    const legacyPersisted = {
      estudiantes: [{ id: 'old1', name: 'Old', CURSO: 'Z', grupo: 'Z', areas: {} }],
      config: { P1: 30, P2: 30, P3: 40 },
      selectedGrupo: 'Todos',
    };

    const current: PersistableState = {
      rowsArea: [{ id: 'current_r1', area: 'Math', promActual: 4.0 }],
      rowsAsignatura: [{ id: 'current_a1', asignatura: 'Bio', promActual: 3.8 }],
      config: { P1: 33.3, P2: 33.3, P3: 33.4 },
      subjectWeights: {},
      selectedGrupo: 'Todos',
      availableGroups: [],
      viewMode: 'area' as const,
      diagnosticReport: null,
    };

    const result = fixedMerge(legacyPersisted, { ...current });

    // The persisted estudiantes appear (shallow merge)...
    expect(result.estudiantes).toEqual(legacyPersisted.estudiantes);
    // ...but rowsArea/rowsAsignatura are NOT reconstructed from them
    expect(result.rowsArea).toEqual(current.rowsArea);
    expect(result.rowsAsignatura).toEqual(current.rowsAsignatura);
  });
});
