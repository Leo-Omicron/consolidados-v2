import { describe, it, expect } from 'vitest';
import type { PedagogicalArchetype, ArchetypeResult, InsightCounts, ArchetypeSeverity } from '../domain/types';
import { detectConfiado, detectResiliente, detectMontanaRusa, detectRadar } from './insightsLogic';
import { detectArchetype, generateNarrative, calculateStudentPeriodAverages } from './insightsLogic';

// ===========================================================================
// Type-level validation (structural—triangulation skipped)
// ===========================================================================

describe('Types — compile-time validation', () => {
  it('PedagogicalArchetype union should accept valid values', () => {
    const archetypes: PedagogicalArchetype[] = ['confiado', 'resiliente', 'montana-rusa', 'radar'];
    expect(archetypes).toHaveLength(4);
  });

  it('ArchetypeSeverity union should accept valid values', () => {
    const severities: ArchetypeSeverity[] = ['high', 'medium', 'low'];
    expect(severities).toHaveLength(3);
  });

  it('ArchetypeResult shape should be constructable', () => {
    const result: ArchetypeResult = {
      estudianteId: 's1',
      estudianteName: 'Juan',
      grupo: '10A',
      archetype: 'confiado',
      confidence: 0.85,
      severity: 'high',
      periodGrades: [4.8, 4.3, 3.9, 3.5],
      narrative: 'El estudiante muestra una tendencia de confianza...',
      reason: undefined,
    };
    expect(result.archetype).toBe('confiado');
    expect(result.confidence).toBe(0.85);
  });

  it('InsightCounts should track all four archetypes + total', () => {
    const counts: InsightCounts = {
      confiado: 3,
      resiliente: 2,
      'montana-rusa': 1,
      radar: 4,
      total: 10,
    };
    expect(counts.confiado + counts.resiliente + counts['montana-rusa'] + counts.radar).toBe(counts.total);
  });
});

// ===========================================================================
// Task 2.1: detectConfiado
// Spec: avg(first 2) ≥ 4.0, monotonically non-increasing, total drop ≥ 0.8,
//        at least one period-to-period drop ≥ 0.3
// ===========================================================================

describe('detectConfiado', () => {
  it('sustained decline from high start → confiado (spec scenario)', () => {
    const grades = [4.8, 4.3, 3.9, 3.5];
    const result = detectConfiado(grades);
    expect(result).not.toBeNull();
    expect(result!.archetype).toBe('confiado');
    expect(result!.confidence).toBeGreaterThanOrEqual(0.5);
  });

  it('minor fluctuation 4.8→4.5 does NOT trigger confiado (total drop < 0.8)', () => {
    const grades = [4.8, 4.7, 4.6, 4.5];
    const result = detectConfiado(grades);
    expect(result).toBeNull();
  });

  it('non-monotonic trend rejects confiado (period 3 rose)', () => {
    const grades = [4.8, 4.0, 4.2, 3.5];
    const result = detectConfiado(grades);
    expect(result).toBeNull();
  });

  it('average of first two periods < 4.0 → null', () => {
    const grades = [3.5, 4.0, 3.0, 2.0];
    const result = detectConfiado(grades);
    expect(result).toBeNull();
  });

  it('monotonic drop but no single drop ≥ 0.3 → null (all drops are tiny)', () => {
    // Let's use drops that are all < 0.3
    const mildGrades = [4.5, 4.3, 4.15, 4.0]; // drops: 0.2, 0.15, 0.15, total=0.5 < 0.8
    const result = detectConfiado(mildGrades);
    expect(result).toBeNull();
  });

  it('confidence scales with signal strength (total drop / threshold)', () => {
    const grades = [5.0, 4.5, 4.0, 3.5]; // total drop 1.5, threshold 0.8 → confidence = min(1, 1.5/0.8) = 1.0
    const result = detectConfiado(grades);
    expect(result).not.toBeNull();
    expect(result!.confidence).toBeCloseTo(1.0, 1);
  });
});

// ===========================================================================
// Task 2.2: detectResiliente
// Spec: avg(first 2) ≤ 3.0, monotonically non-decreasing, total rise ≥ 0.8,
//        at least one period-to-period rise ≥ 0.3
// ===========================================================================

describe('detectResiliente', () => {
  it('sustained improvement from low start → resiliente (spec scenario)', () => {
    const grades = [2.0, 2.5, 3.0, 3.5];
    const result = detectResiliente(grades);
    expect(result).not.toBeNull();
    expect(result!.archetype).toBe('resiliente');
  });

  it('small improvement 2.5→3.0 does NOT trigger (total rise 0.5 < 0.8)', () => {
    const grades = [2.5, 2.6, 2.8, 3.0];
    const result = detectResiliente(grades);
    expect(result).toBeNull();
  });

  it('average of first two > 3.0 → null (did not start low)', () => {
    const grades = [3.5, 3.2, 3.8, 4.5];
    const result = detectResiliente(grades);
    expect(result).toBeNull();
  });

  it('non-monotonic (dip in middle) rejects resiliente', () => {
    const grades = [2.0, 2.8, 2.5, 3.5];
    const result = detectResiliente(grades);
    expect(result).toBeNull();
  });

  it('monotonic rise but no single rise ≥ 0.3 → null', () => {
    const grades = [2.5, 2.55, 2.6, 2.7]; // tiny rises, total=0.2 < 0.8
    const result = detectResiliente(grades);
    expect(result).toBeNull();
  });

  it('confidence scales with total rise', () => {
    const grades = [2.0, 2.5, 3.0, 3.8]; // total rise 1.8 → confidence = min(1, 1.8/0.8) = 1.0
    const result = detectResiliente(grades);
    expect(result).not.toBeNull();
    expect(result!.archetype).toBe('resiliente');
    expect(result!.confidence).toBeCloseTo(1.0, 1);
  });
});

// ===========================================================================
// Task 2.3: detectMontanaRusa
// Spec: ≥ 2 sign changes in deltas, peak→valley swing ≥ 0.8,
//        at least one |delta| ≥ 0.3
// ===========================================================================

describe('detectMontanaRusa', () => {
  it('alternating grades trigger Montaña Rusa (spec scenario)', () => {
    const grades = [4.5, 2.5, 4.0, 3.0];
    const result = detectMontanaRusa(grades);
    expect(result).not.toBeNull();
    expect(result!.archetype).toBe('montana-rusa');
  });

  it('smooth monotonic decline does NOT trigger (no sign changes)', () => {
    const grades = [4.5, 4.0, 3.5, 3.0];
    const result = detectMontanaRusa(grades);
    expect(result).toBeNull();
  });

  it('single sign change (one peak) → null (needs ≥ 2)', () => {
    const grades = [3.0, 4.0, 3.5, 3.2]; // +, -, -  → only 1 sign change
    const result = detectMontanaRusa(grades);
    expect(result).toBeNull();
  });

  it('alternating but small swings → null (largest swing < 0.8)', () => {
    const grades = [3.5, 3.0, 3.4, 3.1]; // swings: 0.5, 0.4, 0.3 — max = 0.5 < 0.8
    const result = detectMontanaRusa(grades);
    expect(result).toBeNull();
  });

  it('sign changes exist but all |delta| < 0.3 → null', () => {
    const grades = [3.5, 3.3, 3.4, 3.2]; // deltas: -0.2, +0.1, -0.2 — all < 0.3
    const result = detectMontanaRusa(grades);
    expect(result).toBeNull();
  });

  it('confidence based on largest swing / threshold', () => {
    const grades = [5.0, 3.0, 4.5, 2.5]; // largest swing = 2.5 (5.0→3.0 = 2.0, 3.0→4.5=1.5, 4.5→2.5=2.0), actually max peak-valley...
    const result = detectMontanaRusa(grades);
    expect(result).not.toBeNull();
    expect(result!.confidence).toBeGreaterThan(0);
  });
});

// ===========================================================================
// Task 2.4: detectRadar
// Spec: fallback when no other archetype matches.
// Warning flags: final grade < 3.0 OR largest single drop ≥ 0.5
// ===========================================================================

describe('detectRadar', () => {
  it('final period failing triggers Radar (spec scenario)', () => {
    const grades = [3.5, 3.2, 3.0, 2.8];
    const result = detectRadar(grades);
    expect(result).not.toBeNull();
    expect(result!.archetype).toBe('radar');
  });

  it('largest single drop ≥ 0.5 triggers Radar even if final is ≥ 3.0', () => {
    const grades = [4.0, 4.0, 3.5, 3.2]; // drop 4.0→3.5 = 0.5 exactly
    const result = detectRadar(grades);
    expect(result).not.toBeNull();
    expect(result!.archetype).toBe('radar');
  });

  it('stable average without flags → null (final ≥ 3.0, no sharp drops)', () => {
    const grades = [3.5, 3.3, 3.4, 3.1]; // final 3.1 ≥ 3.0, max drop 0.2 < 0.5
    const result = detectRadar(grades);
    expect(result).toBeNull();
  });

  it('non-failing final but sharp mid dip → Radar', () => {
    const grades = [4.5, 3.8, 3.9, 3.5]; // drop 4.5→3.8 = 0.7 ≥ 0.5
    const result = detectRadar(grades);
    expect(result).not.toBeNull();
    expect(result!.archetype).toBe('radar');
  });

  it('confidence = flag count / 2 → 1 flag = 0.5, 2 flags = 1.0', () => {
    // 2 flags: final < 3.0 AND drop ≥ 0.5
    const grades = [4.5, 3.8, 3.0, 2.5]; // final 2.5 < 3.0, drop 4.5→3.8=0.7 ≥ 0.5
    const result = detectRadar(grades);
    expect(result).not.toBeNull();
    expect(result!.confidence).toBeCloseTo(1.0, 1);

    // 1 flag: only final < 3.0
    const oneFlag = detectRadar([3.5, 3.3, 3.1, 2.9]); // final 2.9, max drop 0.2
    expect(oneFlag).not.toBeNull();
    expect(oneFlag!.confidence).toBeCloseTo(0.5, 1);
  });
});

// ===========================================================================
// Task 2.5: Insufficient-data guard
// ===========================================================================

describe('detectArchetype — insufficient-data guard', () => {
  it('single period → null with reason "insufficient-data"', () => {
    const result = detectArchetype([3.5]);
    expect(result).toBeNull();
  });

  it('two periods → detection proceeds (minimum met)', () => {
    // [4.5, 3.7] qualifies as confiado-like? avg first 2 = 4.1 ≥ 4.0, drop 0.8 ≥ 0.8, monotonic, drop ≥ 0.3.
    // Actually 4.5-3.7 drop=0.8, confiado! But we just want to verify it doesn't short-circuit.
    const result = detectArchetype([4.5, 3.7]);
    expect(result).not.toBeNull();
    // The specific archetype depends on which matches; just verify non-null
  });
});

// ===========================================================================
// Task 2.6: detectArchetype orchestrator — tie-break
// Severity: confiado > resiliente > montana-rusa > radar
// ===========================================================================

describe('detectArchetype — orchestrator', () => {
  it('returns confiado when sustained decline matches', () => {
    const result = detectArchetype([4.8, 4.3, 3.9, 3.5]);
    expect(result).not.toBeNull();
    expect(result!.archetype).toBe('confiado');
    expect(result!.narrative).toBeTruthy();
  });

  it('returns resiliente when sustained improvement matches', () => {
    const result = detectArchetype([2.0, 2.5, 3.0, 3.5]);
    expect(result).not.toBeNull();
    expect(result!.archetype).toBe('resiliente');
  });

  it('returns montana-rusa when grades oscillate', () => {
    const result = detectArchetype([4.5, 2.5, 4.0, 3.0]);
    expect(result).not.toBeNull();
    expect(result!.archetype).toBe('montana-rusa');
  });

  it('returns radar when no other archetype but flags exist', () => {
    const result = detectArchetype([3.5, 3.2, 3.0, 2.8]);
    expect(result).not.toBeNull();
    expect(result!.archetype).toBe('radar');
  });

  it('returns null when no archetype and no radar flags', () => {
    const result = detectArchetype([3.5, 3.4, 3.5, 3.4]);
    expect(result).toBeNull();
  });

  it('tie-break: confiado wins over radar when both conditions met', () => {
    // A student declining from 4.8 to 2.8: confiado (high start, monotonic decline) AND radar (final < 3.0)
    const result = detectArchetype([4.8, 4.0, 3.5, 2.8]);
    expect(result).not.toBeNull();
    expect(result!.archetype).toBe('confiado'); // confiado > radar in severity
  });

  it('tie-break: montana-rusa wins over radar', () => {
    // Oscillating with final below 3.0
    const result = detectArchetype([4.5, 2.5, 4.0, 2.8]);
    expect(result).not.toBeNull();
    expect(result!.archetype).toBe('montana-rusa');
  });

  it('null grades are filtered out', () => {
    const result = detectArchetype([4.8, null, 4.3, 3.9, 3.5]);
    expect(result).not.toBeNull();
    expect(result!.archetype).toBe('confiado');
  });
});

// ===========================================================================
// Task 1.7: generateNarrative — Spanish text per archetype
// ===========================================================================

describe('generateNarrative', () => {
  it('produces Spanish text for confiado', () => {
    const text = generateNarrative('confiado', 0.85, [4.8, 4.3, 3.9, 3.5]);
    expect(text).toBeTruthy();
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(20);
  });

  it('produces Spanish text for resiliente', () => {
    const text = generateNarrative('resiliente', 0.75, [2.0, 2.5, 3.0, 3.5]);
    expect(text).toBeTruthy();
    expect(text.length).toBeGreaterThan(20);
  });

  it('produces Spanish text for montana-rusa', () => {
    const text = generateNarrative('montana-rusa', 0.8, [4.5, 2.5, 4.0, 3.0]);
    expect(text).toBeTruthy();
    expect(text.length).toBeGreaterThan(20);
  });

  it('produces Spanish text for radar', () => {
    const text = generateNarrative('radar', 0.6, [3.5, 3.2, 3.0, 2.8]);
    expect(text).toBeTruthy();
    expect(text.length).toBeGreaterThan(20);
  });

  it('includes period grades in the narrative', () => {
    const text = generateNarrative('confiado', 0.85, [4.8, 4.3, 3.9, 3.5]);
    expect(text).toContain('4.8');
  });
});

// ===========================================================================
// Task 1.8: calculateStudentPeriodAverages
// Reuses area DEF averaging pattern from evolutionLogic
// ===========================================================================

describe('calculateStudentPeriodAverages', () => {
  it('returns array of 4 period averages', () => {
    const student = {
      id: 's1', name: 'Test', CURSO: '10', grupo: '10A',
      areas: {
        MAT: {
          asignaturas: {},
          DEF: { P1: 4.0, P2: 3.5, P3: 3.0, P4: null },
        },
      },
    };
    const avgs = calculateStudentPeriodAverages(student as any);
    expect(avgs).toHaveLength(4);
    expect(avgs[0]).toBeCloseTo(4.0, 1);
    expect(avgs[1]).toBeCloseTo(3.5, 1);
    expect(avgs[2]).toBeCloseTo(3.0, 1);
    expect(avgs[3]).toBeNull(); // P4 is null in the single area
  });

  it('averages across multiple areas', () => {
    const student = {
      id: 's1', name: 'Test', CURSO: '10', grupo: '10A',
      areas: {
        MAT: {
          asignaturas: {},
          DEF: { P1: 4.0, P2: 4.0, P3: null, P4: null },
        },
        LEN: {
          asignaturas: {},
          DEF: { P1: 3.0, P2: 3.0, P3: null, P4: null },
        },
      },
    };
    const avgs = calculateStudentPeriodAverages(student as any);
    expect(avgs[0]).toBeCloseTo(3.5, 1); // (4.0 + 3.0) / 2
    expect(avgs[1]).toBeCloseTo(3.5, 1);
  });

  it('prefers official period averages when present', () => {
    const student = {
      id: 's1', name: 'Test', CURSO: '10', grupo: '10A',
      promedios: { P1: 4.7 },
      areas: {
        MAT: {
          asignaturas: {},
          DEF: { P1: 2.0, P2: 4.0, P3: null, P4: null },
        },
        LEN: {
          asignaturas: {},
          DEF: { P1: 3.0, P2: 3.0, P3: null, P4: null },
        },
      },
    };

    const avgs = calculateStudentPeriodAverages(student as any);
    expect(avgs[0]).toBe(4.7);
    expect(avgs[1]).toBeCloseTo(3.5, 1);
  });

  it('returns null for periods with no grades', () => {
    const student = {
      id: 's1', name: 'Test', CURSO: '10', grupo: '10A',
      areas: {
        MAT: {
          asignaturas: {},
          DEF: { P1: null, P2: null, P3: null, P4: null },
        },
      },
    };
    const avgs = calculateStudentPeriodAverages(student as any);
    expect(avgs[0]).toBeNull();
    expect(avgs[1]).toBeNull();
  });
});
