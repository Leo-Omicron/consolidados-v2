import { describe, it, expect } from 'vitest';
import { 
  calcularAcumuladoBase, 
  calcularMinimoRequerido, 
  calcularNotaRequeridaParaObjetivo, 
  calcularPromedioActual, 
  determinarEstado 
} from './periodCalculations';
import type { PeriodoNotas } from '../../domain/types';
import { config } from './test-fixtures';

describe('periodCalculations logic', () => {
  describe('calcularPromedioActual', () => {
    it('returns 0 if sumWeight is 0', () => {
      const notas: PeriodoNotas = { P1: null, P2: null, P3: null, P4: null, A: null };
      expect(calcularPromedioActual(notas, config)).toBe(0);
    });

    it('calculates average correctly', () => {
      const notas: PeriodoNotas = { P1: 4.0, P2: 3.0, P3: null, P4: null, A: null };
      expect(calcularPromedioActual(notas, config, { P1: true, P2: true, P3: false, P4: false })).toBe(3.5);
    });
  });

  describe('calcularMinimoRequerido', () => {
    it('returns 0 if remaining weight is 0', () => {
      const notas: PeriodoNotas = { P1: 3.0, P2: 3.0, P3: 3.0, P4: 3.0, A: null };
      expect(calcularMinimoRequerido(notas, config, { P1: true, P2: true, P3: true, P4: true })).toBe(0);
    });

    it('returns 0 if accumulated already passes', () => {
      const notas: PeriodoNotas = { P1: 5.0, P2: 5.0, P3: 5.0, P4: null, A: null };
      expect(calcularMinimoRequerido(notas, config, { P1: true, P2: true, P3: true, P4: false })).toBe(0);
    });

    it('calculates required grade for passing (3.0)', () => {
      const notas: PeriodoNotas = { P1: 2.0, P2: 2.0, P3: null, P4: null, A: null };
      // Accumulated is 100 out of 300 needed. 200 needed in remaining 50. Required is 4.0
      expect(calcularMinimoRequerido(notas, config, { P1: true, P2: true, P3: false, P4: false })).toBe(4.0);
    });
  });

  describe('calcularNotaRequeridaParaObjetivo', () => {
    it('returns null if no remaining weight', () => {
      const notas: PeriodoNotas = { P1: 3.0, P2: 3.0, P3: 3.0, P4: 3.0, A: null };
      expect(calcularNotaRequeridaParaObjetivo(notas, config, 4.0, { P1: true, P2: true, P3: true, P4: true })).toBeNull();
    });

    it('calculates required grade for specific objective', () => {
      const notas: PeriodoNotas = { P1: 3.0, P2: 3.0, P3: null, P4: null, A: null };
      // Aiming for 4.0. Total needed = 400. Has 150. Remaining needed = 250 in 50 weight = 5.0
      expect(calcularNotaRequeridaParaObjetivo(notas, config, 4.0, { P1: true, P2: true, P3: false, P4: false })).toBe(5.0);
    });
  });

  describe('calcularAcumuladoBase', () => {
    it('returns null if sumWeight is 0', () => {
      expect(calcularAcumuladoBase({ P1: null, P2: null, P3: null, P4: null, A: null }, config)).toBeNull();
    });

    it('calculates accumulated base', () => {
      const notas: PeriodoNotas = { P1: 4.0, P2: null, P3: null, P4: null, A: null };
      // 4 * 25 = 100. 100 / 100 = 1.0
      expect(calcularAcumuladoBase(notas, config, { P1: true, P2: false, P3: false, P4: false })).toBe(1.0);
    });
  });

  describe('determinarEstado', () => {
    it('Ganado if periods ended and >= 3.0', () => {
      const notas: PeriodoNotas = { P1: 3.0, P2: 3.0, P3: 3.0, P4: 3.0, A: null };
      expect(determinarEstado(notas, config, { P1: true, P2: true, P3: true, P4: true })).toEqual({ text: 'Ganado', color: 'green' });
    });

    it('Perdido if periods ended and < 3.0', () => {
      const notas: PeriodoNotas = { P1: 2.0, P2: 2.0, P3: 2.0, P4: 2.0, A: null };
      expect(determinarEstado(notas, config, { P1: true, P2: true, P3: true, P4: true })).toEqual({ text: 'Perdido', color: 'red' });
    });

    it('Ganado if mathematically already passes', () => {
      const notas: PeriodoNotas = { P1: 5.0, P2: 5.0, P3: 5.0, P4: null, A: null };
      expect(determinarEstado(notas, config, { P1: true, P2: true, P3: true, P4: false })).toEqual({ text: 'Ganado', color: 'green' });
    });

    it('Perdido if mathematically impossible to pass', () => {
      const notas: PeriodoNotas = { P1: 1.0, P2: 1.0, P3: 1.0, P4: null, A: null };
      // Has 75. Needs 300. Can only get max 125 from remaining 25. Max possible is 200 (2.0)
      expect(determinarEstado(notas, config, { P1: true, P2: true, P3: true, P4: false })).toEqual({ text: 'Perdido', color: 'red' });
    });

    it('En riesgo if minRequired >= 3.2', () => {
      const notas: PeriodoNotas = { P1: 2.0, P2: 2.0, P3: null, P4: null, A: null };
      expect(determinarEstado(notas, config, { P1: true, P2: true, P3: false, P4: false })).toEqual({ text: 'En riesgo', color: 'yellow' });
    });

    it('Recuperable if 3.0 < minRequired < 3.2', () => {
      const notas: PeriodoNotas = { P1: 2.9, P2: 2.9, P3: null, P4: null, A: null };
      // minRequired will be (300 - 145) / 50 = 3.1
      expect(determinarEstado(notas, config, { P1: true, P2: true, P3: false, P4: false })).toEqual({ text: 'Recuperable', color: 'blue' });
    });

    it('Ganable if minRequired <= 3.0', () => {
      const notas: PeriodoNotas = { P1: 3.1, P2: 3.1, P3: null, P4: null, A: null };
      expect(determinarEstado(notas, config, { P1: true, P2: true, P3: false, P4: false })).toEqual({ text: 'Ganable', color: 'cyan' });
    });
  });
});
