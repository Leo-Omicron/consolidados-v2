import { describe, it, expect } from 'vitest';
import type { PedagogicalArchetype, ArchetypeResult, InsightCounts, ArchetypeSeverity } from '../../domain/types';
import { detectConfiado, detectResiliente, detectMontanaRusa, detectRadar, detectArchetype } from './archetypeEngine';

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
    const mildGrades = [4.5, 4.3, 4.15, 4.0];
    const result = detectConfiado(mildGrades);
    expect(result).toBeNull();
  });

  it('confidence scales with signal strength (total drop / threshold)', () => {
    const grades = [5.0, 4.5, 4.0, 3.5];
    const result = detectConfiado(grades);
    expect(result).not.toBeNull();
    expect(result!.confidence).toBeCloseTo(1.0, 1);
  });
});

// ===========================================================================
// Task 2.2: detectResiliente
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
    const grades = [2.5, 2.55, 2.6, 2.7];
    const result = detectResiliente(grades);
    expect(result).toBeNull();
  });

  it('confidence scales with total rise', () => {
    const grades = [2.0, 2.5, 3.0, 3.8];
    const result = detectResiliente(grades);
    expect(result).not.toBeNull();
    expect(result!.archetype).toBe('resiliente');
    expect(result!.confidence).toBeCloseTo(1.0, 1);
  });
});

// ===========================================================================
// Task 2.3: detectMontanaRusa
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
    const grades = [3.0, 4.0, 3.5, 3.2];
    const result = detectMontanaRusa(grades);
    expect(result).toBeNull();
  });

  it('alternating but small swings → null (largest swing < 0.8)', () => {
    const grades = [3.5, 3.0, 3.4, 3.1];
    const result = detectMontanaRusa(grades);
    expect(result).toBeNull();
  });

  it('sign changes exist but all |delta| < 0.3 → null', () => {
    const grades = [3.5, 3.3, 3.4, 3.2];
    const result = detectMontanaRusa(grades);
    expect(result).toBeNull();
  });

  it('confidence based on largest swing / threshold', () => {
    const grades = [5.0, 3.0, 4.5, 2.5];
    const result = detectMontanaRusa(grades);
    expect(result).not.toBeNull();
    expect(result!.confidence).toBeGreaterThan(0);
  });
});

// ===========================================================================
// Task 2.4: detectRadar
// ===========================================================================

describe('detectRadar', () => {
  it('final period failing triggers Radar (spec scenario)', () => {
    const grades = [3.5, 3.2, 3.0, 2.8];
    const result = detectRadar(grades);
    expect(result).not.toBeNull();
    expect(result!.archetype).toBe('radar');
  });

  it('largest single drop ≥ 0.5 triggers Radar even if final is ≥ 3.0', () => {
    const grades = [4.0, 4.0, 3.5, 3.2];
    const result = detectRadar(grades);
    expect(result).not.toBeNull();
    expect(result!.archetype).toBe('radar');
  });

  it('stable average without flags → null (final ≥ 3.0, no sharp drops)', () => {
    const grades = [3.5, 3.3, 3.4, 3.1];
    const result = detectRadar(grades);
    expect(result).toBeNull();
  });

  it('non-failing final but sharp mid dip → Radar', () => {
    const grades = [4.5, 3.8, 3.9, 3.5];
    const result = detectRadar(grades);
    expect(result).not.toBeNull();
    expect(result!.archetype).toBe('radar');
  });

  it('confidence = flag count / 2 → 1 flag = 0.5, 2 flags = 1.0', () => {
    const grades = [4.5, 3.8, 3.0, 2.5];
    const result = detectRadar(grades);
    expect(result).not.toBeNull();
    expect(result!.confidence).toBeCloseTo(1.0, 1);

    const oneFlag = detectRadar([3.5, 3.3, 3.1, 2.9]);
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
    const result = detectArchetype([4.5, 3.7]);
    expect(result).not.toBeNull();
  });
});

// ===========================================================================
// Task 2.6: detectArchetype orchestrator — tie-break
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
    const result = detectArchetype([4.8, 4.0, 3.5, 2.8]);
    expect(result).not.toBeNull();
    expect(result!.archetype).toBe('confiado');
  });

  it('tie-break: montana-rusa wins over radar', () => {
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
