import { describe, it, expect } from 'vitest';
import { roundToOneDecimal, getAccumulatedWeightAndProduct } from './math';
import type { PeriodoNotas } from '../../domain/types';
import { config } from './test-fixtures';

describe('math logic', () => {
  describe('roundToOneDecimal', () => {
    it('rounds numbers correctly', () => {
      expect(roundToOneDecimal(3.45)).toBe(3.5);
      expect(roundToOneDecimal(3.44)).toBe(3.4);
      expect(roundToOneDecimal(0)).toBe(0);
    });
  });

  describe('getAccumulatedWeightAndProduct', () => {
    it('calculates sumProduct and sumWeight based on grades', () => {
      const notas: PeriodoNotas = { P1: 4.0, P2: 3.0, P3: null, P4: null, A: null };
      const res = getAccumulatedWeightAndProduct(notas, config, { P1: true, P2: true, P3: false, P4: false });
      expect(res.sumProduct).toBe((4.0 * 25) + (3.0 * 25));
      expect(res.sumWeight).toBe(50);
      expect(res.totalWeight).toBe(100);
    });

    it('treats evaluated but missing periods as 0', () => {
      const notas: PeriodoNotas = { P1: 4.0, P2: null, P3: null, P4: null, A: null };
      // P2 is evaluated but missing, so it counts as 0.0 with weight 25
      const res = getAccumulatedWeightAndProduct(notas, config, { P1: true, P2: true, P3: false, P4: false });
      expect(res.sumProduct).toBe(4.0 * 25);
      expect(res.sumWeight).toBe(50);
    });

    it('ignores non-evaluated periods with no grades', () => {
      const notas: PeriodoNotas = { P1: null, P2: null, P3: null, P4: null, A: null };
      const res = getAccumulatedWeightAndProduct(notas, config, { P1: false, P2: false, P3: false, P4: false });
      expect(res.sumProduct).toBe(0);
      expect(res.sumWeight).toBe(0);
    });
  });
});
