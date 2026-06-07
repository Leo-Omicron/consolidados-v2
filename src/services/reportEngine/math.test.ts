import { describe, it, expect } from 'vitest';
import {
  calculateStandardDeviation,
  calculatePercentileRanks,
  calculateRequiredGrade,
  calculateCompetitionRanking
} from './math';
import type { PeriodConfig } from '../../domain/types';

describe('math', () => {
  describe('calculateStandardDeviation', () => {
    it('returns 0 for empty array', () => {
      expect(calculateStandardDeviation([], 0)).toBe(0);
    });

    it('calculates standard deviation correctly', () => {
      expect(calculateStandardDeviation([2, 4, 4, 4, 5, 5, 7, 9], 5)).toBe(2);
    });
  });

  describe('calculatePercentileRanks', () => {
    it('returns empty array for empty input', () => {
      expect(calculatePercentileRanks([])).toEqual([]);
    });

    it('returns 100 for single element', () => {
      expect(calculatePercentileRanks([5])).toEqual([100]);
    });

    it('calculates percentiles correctly', () => {
      expect(calculatePercentileRanks([15, 20, 35, 40, 50])).toEqual([0, 25, 50, 75, 100]);
    });

    it('handles duplicate values correctly', () => {
      const res = calculatePercentileRanks([40, 15, 20, 15]);
      expect(res[1]).toBe(0); // 15
      expect(res[3]).toBe(0); // 15
      expect(res[2]).toBe(67); // 20
      expect(res[0]).toBe(100); // 40
    });
  });

  describe('calculateRequiredGrade', () => {
    const config: PeriodConfig = { P1: 0.2, P2: 0.3, P3: 0.5, P4: 0 };

    it('returns 0 if already passing', () => {
      const customConfig: PeriodConfig = { P1: 0.4, P2: 0.4, P3: 0.2, P4: 0 };
      const notas = { P1: 5.0, P2: 5.0, P3: null, P4: null, A: null };
      expect(calculateRequiredGrade(notas, customConfig)).toEqual({ required: 0, isImpossible: false });
    });

    it('returns 0 if no remaining weight', () => {
      const notas = { P1: 2.0, P2: 2.0, P3: 2.0, P4: null, A: null };
      expect(calculateRequiredGrade(notas, config)).toEqual({ required: 0, isImpossible: false });
    });

    it('calculates required grade normally', () => {
      const notas = { P1: 3.0, P2: 2.0, P3: null, P4: null, A: null };
      expect(calculateRequiredGrade(notas, config)).toEqual({ required: 3.5, isImpossible: false });
    });

    it('marks as impossible if required > 5.0', () => {
      const notasWorse = { P1: 0.0, P2: 0.0, P3: null, P4: null, A: null };
      expect(calculateRequiredGrade(notasWorse, config)).toEqual({ required: 5.9, isImpossible: true });
    });
  });

  describe('calculateCompetitionRanking', () => {
    it('returns empty array for empty input', () => {
      expect(calculateCompetitionRanking([])).toEqual([]);
    });

    it('calculates rankings correctly with ties', () => {
      const res = calculateCompetitionRanking([4.5, 5.0, 4.0, 4.5]);
      expect(res[1]).toBe(1); // 5.0
      expect(res[0]).toBe(2); // 4.5
      expect(res[3]).toBe(2); // 4.5
      expect(res[2]).toBe(4); // 4.0
    });
  });
});
