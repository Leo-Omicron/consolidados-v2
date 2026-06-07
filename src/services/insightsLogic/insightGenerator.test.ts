import { describe, it, expect } from 'vitest';
import { generateNarrative, calculateStudentPeriodAverages } from './insightGenerator';
import { 
  mockStudentSingleArea, 
  mockStudentMultiArea, 
  mockStudentOfficialAverages, 
  mockStudentEmptyAreas 
} from './test-fixtures';

// ===========================================================================
// generateNarrative — Spanish text per archetype
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
// calculateStudentPeriodAverages
// ===========================================================================

describe('calculateStudentPeriodAverages', () => {
  it('returns array of 4 period averages', () => {
    const avgs = calculateStudentPeriodAverages(mockStudentSingleArea);
    expect(avgs).toHaveLength(4);
    expect(avgs[0]).toBeCloseTo(4.0, 1);
    expect(avgs[1]).toBeCloseTo(3.5, 1);
    expect(avgs[2]).toBeCloseTo(3.0, 1);
    expect(avgs[3]).toBeNull();
  });

  it('averages across multiple areas', () => {
    const avgs = calculateStudentPeriodAverages(mockStudentMultiArea);
    expect(avgs[0]).toBeCloseTo(3.5, 1);
    expect(avgs[1]).toBeCloseTo(3.5, 1);
  });

  it('prefers official period averages when present', () => {
    const avgs = calculateStudentPeriodAverages(mockStudentOfficialAverages);
    expect(avgs[0]).toBe(4.7);
    expect(avgs[1]).toBeCloseTo(3.5, 1);
  });

  it('returns null for periods with no grades', () => {
    const avgs = calculateStudentPeriodAverages(mockStudentEmptyAreas);
    expect(avgs[0]).toBeNull();
    expect(avgs[1]).toBeNull();
  });
});
