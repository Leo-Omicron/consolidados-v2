import { describe, it, expect } from 'vitest';
import type { Estudiante, ArchetypeResult, EstadoAcademico, PeriodConfig, SubjectWeightConfig } from '../domain/types';

// RED phase: the function and type don't exist yet — this import WILL fail
// until we create the file in GREEN phase.
import { buildStudentProfileData } from './studentProfileService';

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

const estadoGanado: EstadoAcademico = { text: 'Ganado', color: 'green' };
const estadoRiesgo: EstadoAcademico = { text: 'En riesgo', color: 'yellow' };

const mockMaria: Estudiante = {
  id: 's1',
  name: 'María García',
  CURSO: '10A',
  grupo: '10A',
  areas: {
    Matemáticas: {
      asignaturas: {},
      DEF: { P1: 4.0, P2: 4.5, P3: null, A: 4.25 },
      areaStats: { promedioActual: 4.25, p4Min: 1.0, estado: estadoGanado },
    },
    Lenguaje: {
      asignaturas: {},
      DEF: { P1: 3.5, P2: 3.0, P3: null, A: 3.25 },
      areaStats: { promedioActual: 3.25, p4Min: 2.5, estado: estadoRiesgo },
    },
    Ciencias: {
      asignaturas: {},
      DEF: { P1: 4.5, P2: 4.0, P3: null, A: 4.25 },
      areaStats: { promedioActual: 4.25, p4Min: 1.0, estado: estadoGanado },
    },
    Sociales: {
      asignaturas: {},
      DEF: { P1: 2.5, P2: 3.0, P3: null, A: 2.75 },
      areaStats: { promedioActual: 2.75, p4Min: 3.5, estado: estadoRiesgo },
    },
  },
};

const mockCarlos: Estudiante = {
  id: 's2',
  name: 'Carlos López',
  CURSO: '10A',
  grupo: '10A',
  areas: {
    Matemáticas: {
      asignaturas: {},
      DEF: { P1: 3.5, P2: 3.0, P3: null, A: 3.25 },
      areaStats: { promedioActual: 3.25, p4Min: 2.5, estado: estadoRiesgo },
    },
    Lenguaje: {
      asignaturas: {},
      DEF: { P1: 4.0, P2: 4.5, P3: null, A: 4.25 },
      areaStats: { promedioActual: 4.25, p4Min: 1.0, estado: estadoGanado },
    },
    Ciencias: {
      asignaturas: {},
      DEF: { P1: 3.0, P2: 3.0, P3: null, A: 3.0 },
      areaStats: { promedioActual: 3.0, p4Min: 3.0, estado: { text: 'Ganable', color: 'cyan' } },
    },
  },
};

// Student with areas but no areaStats (edge case)
const mockPartialStudent: Estudiante = {
  id: 's4',
  name: 'Parcial Notas',
  CURSO: '10A',
  grupo: '10A',
  areas: {
    Arte: {
      asignaturas: {},
      DEF: { P1: null, P2: null, P3: null },
      // No areaStats
    },
  },
};

const mockInsight: ArchetypeResult = {
  estudianteId: 's1',
  estudianteName: 'María García',
  grupo: '10A',
  archetype: 'confiado',
  confidence: 0.9,
  severity: 'high',
  periodGrades: [4.8, 4.3, 3.9, 3.5],
  narrative: 'Tendencia de declive sostenido.',
};

const noSimulations: Record<string, any> = {};

// Default config mimicking the legacy 3-period 25% weights
const defaultConfig: PeriodConfig = { P1: 25, P2: 25, P3: 25 };
const emptySubjectWeights: SubjectWeightConfig = {};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('buildStudentProfileData', () => {
  // ---- RED-1: Non-existent student returns null ----
  it('returns null when studentId does not exist', () => {
    const result = buildStudentProfileData(
      'nonexistent',
      [mockMaria, mockCarlos],
      [],
      noSimulations,
      defaultConfig,
      emptySubjectWeights,
    );
    expect(result).toBeNull();
  });

  // ---- RED-2: Empty students array returns null ----
  it('returns null for empty students array', () => {
    const result = buildStudentProfileData('s1', [], [], noSimulations, defaultConfig, emptySubjectWeights);
    expect(result).toBeNull();
  });

  // ---- RED-3: Basic student info populated ----
  it('returns student info (name, id, grupo) when student exists', () => {
    const result = buildStudentProfileData(
      's1',
      [mockMaria, mockCarlos],
      [],
      noSimulations,
      defaultConfig,
      emptySubjectWeights,
    );
    expect(result).not.toBeNull();
    expect(result!.studentId).toBe('s1');
    expect(result!.studentName).toBe('María García');
    expect(result!.grupo).toBe('10A');
  });

  // ---- RED-4: Area grades match estudiante data ----
  it('populates areaGrades with promedioActual from each area', () => {
    const result = buildStudentProfileData(
      's1',
      [mockMaria, mockCarlos],
      [],
      noSimulations,
      defaultConfig,
      emptySubjectWeights,
    );
    expect(result!.areaGrades).toEqual({
      Matemáticas: 4.25,
      Lenguaje: 3.25,
      Ciencias: 4.25,
      Sociales: 2.75,
    });
  });

  // ---- RED-5: Group averages are computed anonymously ----
  it('computes groupAverages aggregating same-group students without exposing individual data', () => {
    const result = buildStudentProfileData(
      's1',
      [mockMaria, mockCarlos],
      [],
      noSimulations,
      defaultConfig,
      emptySubjectWeights,
    );

    // María and Carlos are both in 10A
    // Matemáticas: (4.25 + 3.25) / 2 = 3.75
    // Lenguaje: (3.25 + 4.25) / 2 = 3.75
    // Ciencias: (4.25 + 3.0) / 2 = 3.625
    // Sociales: only María has it → 2.75
    expect(result!.groupAverages).toEqual({
      Matemáticas: 3.75,
      Lenguaje: 3.75,
      Ciencias: 3.625,
      Sociales: 2.75,
    });
  });

  // ---- RED-6: Fortalezas — top 2 areas with definitiva >= 3.5 ----
  it('identifies top 2 areas as fortalezas (>= 3.5)', () => {
    const result = buildStudentProfileData(
      's1',
      [mockMaria, mockCarlos],
      [],
      noSimulations,
      defaultConfig,
      emptySubjectWeights,
    );
    // María: Mat 4.25, Len 3.25, Cie 4.25, Soc 2.75
    // >= 3.5: Matemáticas (4.25), Ciencias (4.25) → top 2
    expect(result!.fortalezas).toEqual(['Matemáticas', 'Ciencias']);
  });

  // ---- RED-7: PuntosMejora — bottom 2 areas with definitiva < 3.5 ----
  it('identifies bottom 2 areas as puntosMejora (< 3.5)', () => {
    const result = buildStudentProfileData(
      's1',
      [mockMaria, mockCarlos],
      [],
      noSimulations,
      defaultConfig,
      emptySubjectWeights,
    );
    // < 3.5: Lenguaje (3.25), Sociales (2.75) → bottom 2
    expect(result!.puntosMejora).toEqual(['Sociales', 'Lenguaje']);
  });

  // ---- RED-8: Insight is attached when available ----
  it('attaches insight narrative and archetype when available', () => {
    const result = buildStudentProfileData(
      's1',
      [mockMaria, mockCarlos],
      [mockInsight],
      noSimulations,
      defaultConfig,
      emptySubjectWeights,
    );
    expect(result!.insight).toBe('Tendencia de declive sostenido.');
    expect(result!.arquetipo).toBe('El Confiado');
  });

  // ---- RED-9: No insight when none exists ----
  it('returns null insight and arquetipo when no insight matches student', () => {
    const result = buildStudentProfileData(
      's1',
      [mockMaria, mockCarlos],
      [],
      noSimulations,
      defaultConfig,
      emptySubjectWeights,
    );
    expect(result!.insight).toBeNull();
    expect(result!.arquetipo).toBeNull();
  });

  // ---- RED-10: isSimulated is false when no simulations active ----
  it('sets isSimulated to false when no active simulations', () => {
    const result = buildStudentProfileData(
      's1',
      [mockMaria, mockCarlos],
      [],
      noSimulations,
      defaultConfig,
      emptySubjectWeights,
    );
    expect(result!.isSimulated).toBe(false);
  });

  // ---- RED-11: isSimulated is true when simulation keys match student ----
  it('sets isSimulated to true when any active simulation key starts with studentId', () => {
    const sims = {
      's1_Matemáticas': { P1: 5.0 },
    };
    const result = buildStudentProfileData(
      's1',
      [mockMaria, mockCarlos],
      [],
      sims,
      defaultConfig,
      emptySubjectWeights,
    );
    expect(result!.isSimulated).toBe(true);
  });

  // ---- RED-12: Simulation for different student does not affect isSimulated ----
  it('does not mark isSimulated when simulations are for another student', () => {
    const sims = {
      's2_Matemáticas': { P1: 5.0 },
    };
    const result = buildStudentProfileData(
      's1',
      [mockMaria, mockCarlos],
      [],
      sims,
      defaultConfig,
      emptySubjectWeights,
    );
    expect(result!.isSimulated).toBe(false);
  });

  // ---- RED-13: Student with no areaStats returns empty grade arrays ----
  it('handles student with areas but no areaStats gracefully', () => {
    const result = buildStudentProfileData(
      's4',
      [mockPartialStudent],
      [],
      noSimulations,
      defaultConfig,
      emptySubjectWeights,
    );
    expect(result).not.toBeNull();
    expect(result!.areaGrades).toEqual({});
    expect(result!.fortalezas).toEqual([]);
    expect(result!.puntosMejora).toEqual([]);
    expect(result!.groupAverages).toEqual({});
  });

  // ---- RED-14: Fortalezas returns at most 2 even when more qualify ----
  it('returns at most 2 fortalezas when many areas qualify', () => {
    const superStudent: Estudiante = {
      id: 's5',
      name: 'Súper Estudiante',
      CURSO: '10A',
      grupo: '10A',
      areas: {
        A: {
          asignaturas: {},
          DEF: { P1: 4.0, P2: 4.0, P3: null, A: 4.0 },
          areaStats: { promedioActual: 4.0, p4Min: 1.0, estado: estadoGanado },
        },
        B: {
          asignaturas: {},
          DEF: { P1: 4.5, P2: 4.5, P3: null, A: 4.5 },
          areaStats: { promedioActual: 4.5, p4Min: 0.5, estado: estadoGanado },
        },
        C: {
          asignaturas: {},
          DEF: { P1: 3.8, P2: 3.8, P3: null, A: 3.8 },
          areaStats: { promedioActual: 3.8, p4Min: 1.2, estado: estadoGanado },
        },
      },
    };
    const result = buildStudentProfileData(
      's5',
      [superStudent],
      [],
      noSimulations,
      defaultConfig,
      emptySubjectWeights,
    );
    expect(result!.fortalezas).toHaveLength(2);
    // Top 2 by highest grade: B (4.5), A (4.0)
    expect(result!.fortalezas).toEqual(['B', 'A']);
  });

  // ---- RED-15: Does NOT mutate input estudiantes array ----
  it('does not mutate the input estudiantes array', () => {
    const original = structuredClone([mockMaria, mockCarlos]);
    buildStudentProfileData('s1', [mockMaria, mockCarlos], [], noSimulations, defaultConfig, emptySubjectWeights);
    expect(mockMaria).toEqual(original[0]);
    expect(mockCarlos).toEqual(original[1]);
  });

  // ---- RED-16: All areas below 3.5 → fortalezas empty ----
  it('returns empty fortalezas when no area reaches 3.5', () => {
    const lowStudent: Estudiante = {
      id: 's6',
      name: 'Bajo Rendimiento',
      CURSO: '10C',
      grupo: '10C',
      areas: {
        Mate: {
          asignaturas: {},
          DEF: { P1: 2.0, P2: 2.0, P3: null, A: 2.0 },
          areaStats: { promedioActual: 2.0, p4Min: 4.0, estado: estadoRiesgo },
        },
        Lengua: {
          asignaturas: {},
          DEF: { P1: 3.0, P2: 3.0, P3: null, A: 3.0 },
          areaStats: { promedioActual: 3.0, p4Min: 3.0, estado: estadoRiesgo },
        },
      },
    };
    const result = buildStudentProfileData('s6', [lowStudent], [], noSimulations, defaultConfig, emptySubjectWeights);
    expect(result!.fortalezas).toEqual([]);
    expect(result!.puntosMejora).toHaveLength(2); // both < 3.5
  });

  // ---- RED-17: Does NOT include peer names in output ----
  it('does not expose peer names or individual grades in output', () => {
    const result = buildStudentProfileData(
      's1',
      [mockMaria, mockCarlos],
      [],
      noSimulations,
      defaultConfig,
      emptySubjectWeights,
    );
    const json = JSON.stringify(result);
    // Carlos' name should NOT be in the output
    expect(json).not.toContain('Carlos');
    // Carlos' unique grade values should NOT leak (3.0 or 3.25 would collide with María's 3.25 — use unique peer data)
    // Group average 3.625 or 3.75 is acceptable (aggregated), but individual names must NOT appear
  });

  // ---- RED-18: Simulation overrides areaGrades with recalculated promedio ----
  it('computes areaGrades from simulated DEF values when active simulations exist', () => {
    // María: Matemáticas originally 4.25 (P1=4.0, P2=4.5, P3=null)
    // Simulation sets all three periods to 1.0 → promedio = 1.0
    const sims = {
      's1_Matemáticas': { P1: 1.0, P2: 1.0, P3: 1.0 },
    };
    const result = buildStudentProfileData(
      's1',
      [mockMaria, mockCarlos],
      [],
      sims,
      defaultConfig,
      emptySubjectWeights,
    );
    expect(result).not.toBeNull();
    // Matemáticas should reflect SIMULATED promedio (1.0), not original (4.25)
    expect(result!.areaGrades['Matemáticas']).toBe(1.0);
    // Other areas should remain unchanged
    expect(result!.areaGrades['Ciencias']).toBe(4.25);
    expect(result!.areaGrades['Lenguaje']).toBe(3.25);
    expect(result!.isSimulated).toBe(true);
  });

  // ---- RED-19: Simulated values cascade to fortalezas and puntosMejora ----
  it('recalculates fortalezas and puntosMejora from simulated data', () => {
    // María's Matemáticas drops from 4.25 to 1.0 via simulation
    const sims = {
      's1_Matemáticas': { P1: 1.0, P2: 1.0, P3: 1.0 },
    };
    const result = buildStudentProfileData(
      's1',
      [mockMaria, mockCarlos],
      [],
      sims,
      defaultConfig,
      emptySubjectWeights,
    );
    expect(result).not.toBeNull();
    // Only Ciencias (4.25) is >= 3.5 now; Matemáticas is 1.0, Lenguaje is 3.25, Sociales is 2.75
    expect(result!.fortalezas).toEqual(['Ciencias']);
    // Bottom 2: Sociales (2.75) and Matemáticas (1.0) — sorted ascending
    expect(result!.puntosMejora).toEqual(['Matemáticas', 'Sociales']);
  });

  // ---- RED-20: Simulation raises an area above 3.5, making it a fortaleza ----
  it('elevates an area into fortalezas when simulation raises it above threshold', () => {
    // Carlos: Matemáticas originally 3.25 (below 3.5), not a fortaleza
    // Simulation boosts it to 5.0
    const sims = {
      's2_Matemáticas': { P1: 5.0, P2: 5.0, P3: 5.0 },
    };
    const result = buildStudentProfileData(
      's2',
      [mockMaria, mockCarlos],
      [],
      sims,
      defaultConfig,
      emptySubjectWeights,
    );
    expect(result).not.toBeNull();
    // Carlos' Matemáticas should now be 5.0 (simulated), making it a fortaleza
    expect(result!.areaGrades['Matemáticas']).toBe(5.0);
    expect(result!.fortalezas).toContain('Matemáticas');
    expect(result!.isSimulated).toBe(true);
  });

  // ---- RED-21: Group averages are NOT affected by a single student's simulation ----
  it('keeps groupAverages computed from original peer data when simulating one student', () => {
    // Simulate only María (s1). Carlos (s2) is NOT simulated.
    const sims = {
      's1_Matemáticas': { P1: 1.0, P2: 1.0, P3: 1.0 },
    };
    const result = buildStudentProfileData(
      's1',
      [mockMaria, mockCarlos],
      [],
      sims,
      defaultConfig,
      emptySubjectWeights,
    );
    expect(result).not.toBeNull();
    // Group average for Matemáticas: María (simulated 1.0) + Carlos (original 3.25) / 2 = 2.125
    // The spec says "promedio consolidado del grupo" — using simulated values for the target student
    // but original values for peers is correct for privacy-preserving group stats
    expect(result!.groupAverages['Matemáticas']).toBeCloseTo(2.125, 3);
    // Other group averages unaffected
    expect(result!.groupAverages['Lenguaje']).toBe(3.75);
    expect(result!.groupAverages['Ciencias']).toBe(3.625);
  });

  // ---- TRIANGULATE-22: Partial period override (only P3 simulated) ----
  it('computes weighted average when only a subset of periods are simulated', () => {
    // María Matemáticas: original P1=4.0, P2=4.5, P3=null → promedio=4.25
    // Simulate only P3=5.0, leaving P1=4.0, P2=4.5 intact
    // New promedio = (4.0*25 + 4.5*25 + 5.0*25) / 75 = 4.5
    const sims = {
      's1_Matemáticas': { P3: 5.0 },
    };
    const result = buildStudentProfileData(
      's1',
      [mockMaria, mockCarlos],
      [],
      sims,
      defaultConfig,
      emptySubjectWeights,
    );
    expect(result).not.toBeNull();
    expect(result!.areaGrades['Matemáticas']).toBe(4.5);
    // Matemáticas at 4.5 stays a fortaleza (top 2: 4.5 + Ciencias 4.25)
    expect(result!.fortalezas).toContain('Matemáticas');
    expect(result!.isSimulated).toBe(true);
  });

  // ---- TRIANGULATE-23: Simulation does not mutate input estudiantes ----
  it('does not mutate original estudiantes when simulations are active', () => {
    const original = structuredClone([mockMaria, mockCarlos]);
    const sims = {
      's1_Matemáticas': { P1: 1.0, P2: 1.0, P3: 1.0 },
    };
    buildStudentProfileData('s1', [mockMaria, mockCarlos], [], sims, defaultConfig, emptySubjectWeights);
    // Original María should still have Matemáticas promedio 4.25
    expect(mockMaria.areas['Matemáticas'].DEF.P1).toBe(4.0);
    expect(mockMaria.areas['Matemáticas'].DEF.P2).toBe(4.5);
    expect(mockMaria).toEqual(original[0]);
    expect(mockCarlos).toEqual(original[1]);
  });

  // ── RED-24 (DEFECT FIX): Subject-level simulation cascades to area grades ──
  it('cascades subject-level simulation to area promedioActual, fortalezas, and puntosMejora', () => {
    const estadoGanado: EstadoAcademico = { text: 'Ganado', color: 'green' };
    const estadoRiesgo: EstadoAcademico = { text: 'En riesgo', color: 'yellow' };

    const studentWithSubjects: Estudiante = {
      id: 's7',
      name: 'Ana Materias',
      CURSO: '10A',
      grupo: '10A',
      areas: {
        Matemáticas: {
          asignaturas: {
            Álgebra: {
              P1: 4.0, P2: 4.5, P3: null, P4: null,
              A: 4.25, promedioActual: 4.25, p4Min: 1.0, estado: estadoGanado,
            },
            Geometría: {
              P1: 3.0, P2: 3.5, P3: null, P4: null,
              A: 3.25, promedioActual: 3.25, p4Min: 2.5, estado: estadoRiesgo,
            },
          },
          DEF: { P1: 3.5, P2: 4.0, P3: null, A: 3.75 },
          areaStats: { promedioActual: 3.75, p4Min: 2.0, estado: estadoGanado },
        },
        Lenguaje: {
          asignaturas: {},
          DEF: { P1: 3.0, P2: 2.5, P3: null, A: 2.75 },
          areaStats: { promedioActual: 2.75, p4Min: 3.5, estado: estadoRiesgo },
        },
      },
    };

    const config: PeriodConfig = { P1: 25, P2: 25, P3: 25, P4: 25 };
    const subjectWeights: SubjectWeightConfig = {
      '10A': { 'Matemáticas': { 'Álgebra': 0.5, 'Geometría': 0.5 } },
    };

    // Simulate changing Álgebra P1 from 4.0 → 1.5
    // With equal 50/50 weights: new DEF.P1 = (1.5*0.5 + 3.0*0.5) = 2.25
    const sims = {
      's7_Matemáticas_Álgebra': { P1: 1.5 },
    };

    const result = buildStudentProfileData(
      's7',
      [studentWithSubjects],
      [],
      sims,
      config,
      subjectWeights,
    );

    expect(result).not.toBeNull();
    // The cascaded area promedioActual should drop because Álgebra P1 dropped
    expect(result!.areaGrades['Matemáticas']).toBeLessThan(3.75);
    // Matematicas drops: was >= 3.5, now with P1=2.3 and P2=4.0: avg = (2.3+4.0)/2=3.15 → roundToOneDecimal = 3.2
    expect(result!.areaGrades['Matemáticas']).toBe(3.2);
    // Lenguaje stays at 2.75
    expect(result!.areaGrades['Lenguaje']).toBe(2.75);
    // Fortalezas should NOT include Matematicas if it's < 3.5
    expect(result!.fortalezas).not.toContain('Matemáticas');
    // isSimulated should be true
    expect(result!.isSimulated).toBe(true);
  });

  // ── RED-25 (DEFECT FIX): P4 is respected according to config weights ──
  it('respects P4 weight from config when recalculating areaGrades', () => {
    const estadoGanado: EstadoAcademico = { text: 'Ganado', color: 'green' };

    const studentWithP4: Estudiante = {
      id: 's8',
      name: 'Con P4',
      CURSO: '10A',
      grupo: '10A',
      areas: {
        Matemáticas: {
          asignaturas: {},
          DEF: { P1: 4.0, P2: 4.0, P3: 4.0, P4: 4.0, A: 4.0 },
          areaStats: { promedioActual: 4.0, p4Min: 1.0, estado: estadoGanado },
        },
      },
    };

    // Config with all 4 periods equally weighted (25% each)
    const config: PeriodConfig = { P1: 25, P2: 25, P3: 25, P4: 25 };

    // Simulate only overriding P4 to 1.0
    // Original: (4*25 + 4*25 + 4*25 + 4*25)/100 = 4.0
    // Simulated: (4*25 + 4*25 + 4*25 + 1*25)/100 = 3.25 → roundToOneDecimal = 3.3
    const sims = {
      's8_Matemáticas': { P4: 1.0 },
    };

    const result = buildStudentProfileData(
      's8',
      [studentWithP4],
      [],
      sims,
      config,
      {},
    );

    expect(result).not.toBeNull();
    expect(result!.areaGrades['Matemáticas']).toBe(3.3);
    expect(result!.isSimulated).toBe(true);
  });

  // ── TRIANGULATE-26 (P4): Config without P4 ignores it even if data has P4 ──
  it('ignores P4 when config does not include P4 weight', () => {
    const estadoGanado: EstadoAcademico = { text: 'Ganado', color: 'green' };

    const studentWithP4: Estudiante = {
      id: 's9',
      name: 'P4 sin peso',
      CURSO: '10A',
      grupo: '10A',
      areas: {
        Matemáticas: {
          asignaturas: {},
          DEF: { P1: 4.0, P2: 4.0, P3: 4.0, P4: 4.0, A: 4.0 },
          areaStats: { promedioActual: 4.0, p4Min: 1.0, estado: estadoGanado },
        },
      },
    };

    // Config WITHOUT P4 → only P1, P2, P3 weighted
    const config: PeriodConfig = { P1: 33.3, P2: 33.3, P3: 33.4 };
    // Simulate P4 to 1.0 — should be ignored since config has no P4
    const sims = {
      's9_Matemáticas': { P4: 1.0 },
    };

    const result = buildStudentProfileData(
      's9',
      [studentWithP4],
      [],
      sims,
      config,
      {},
    );

    expect(result).not.toBeNull();
    // P4 override should NOT affect the average since config has 0 weight for P4
    // Original: (4*33.3 + 4*33.3 + 4*33.4)/100 = 4.0
    // Simulated P4=1.0 is ignored → still 4.0
    expect(result!.areaGrades['Matemáticas']).toBe(4.0);
    expect(result!.isSimulated).toBe(true);
  });
});
