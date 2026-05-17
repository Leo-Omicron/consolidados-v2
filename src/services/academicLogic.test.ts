import { describe, it, expect } from 'vitest';
import { calcularPromedioActual, calcularMinimoRequerido, determinarEstado, applyAcademicLogic } from './academicLogic';
import { PeriodConfig, PeriodoNotas, Estudiante } from '../domain/types';

describe('academicLogic', () => {
  const config3Periods: PeriodConfig = { P1: 33.3, P2: 33.3, P3: 33.4 };
  const config4Periods: PeriodConfig = { P1: 25, P2: 25, P3: 25, P4: 25 };

  describe('calcularPromedioActual', () => {
    it('calculates average for 3 periods correctly with weights', () => {
      const notas: PeriodoNotas = { P1: 4.0, P2: 3.0, P3: null };
      // (4 * 33.3 + 3 * 33.3) / 66.6 = 3.5
      expect(calcularPromedioActual(notas, config3Periods)).toBe(3.5);
    });

    it('calculates average for 4 periods correctly', () => {
      const notas: PeriodoNotas = { P1: 4.0, P2: 2.0, P3: 5.0, P4: null };
      // (4*25 + 2*25 + 5*25) / 75 = 11*25 / 75 = 11/3 = 3.67
      expect(calcularPromedioActual(notas, config4Periods)).toBeCloseTo(3.67, 2);
    });

    it('returns 0 if no grades are present', () => {
      const notas: PeriodoNotas = { P1: null, P2: null, P3: null, P4: null };
      expect(calcularPromedioActual(notas, config3Periods)).toBe(0);
    });
  });

  describe('calcularMinimoRequerido', () => {
    it('calculates next period minimum needed to pass (3 periods)', () => {
      const notas: PeriodoNotas = { P1: 2.0, P2: 2.0, P3: null };
      // To pass: need 3.0 accumulated.
      // Current product: 2 * 33.3 + 2 * 33.3 = 133.2
      // Target: 3.0 * 100 = 300
      // Needed: 300 - 133.2 = 166.8
      // Remaining weight: 33.4
      // Required grade: 166.8 / 33.4 = 4.994...
      expect(calcularMinimoRequerido(notas, config3Periods)).toBe(4.99);
    });

    it('returns 0 if already passing in remaining (4 periods)', () => {
      const notas: PeriodoNotas = { P1: 5.0, P2: 5.0, P3: 4.0, P4: null };
      // Accumulated product: 5*25 + 5*25 + 4*25 = 350
      // Target: 300
      // Already above target
      expect(calcularMinimoRequerido(notas, config4Periods)).toBe(0);
    });

    it('returns 0 if no periods are left', () => {
      const notas: PeriodoNotas = { P1: 3.0, P2: 3.0, P3: 3.0 };
      expect(calcularMinimoRequerido(notas, config3Periods)).toBe(0);
    });
  });

  describe('determinarEstado', () => {
    it('returns Ganado if accumulated is already enough to pass without remaining periods', () => {
      const notas: PeriodoNotas = { P1: 5.0, P2: 5.0, P3: null }; // 10 * 33.3 = 333 > 300
      expect(determinarEstado(notas, config3Periods).text).toBe('Ganado');
    });

    it('returns Perdido if mathematically impossible to pass', () => {
      const notas: PeriodoNotas = { P1: 1.0, P2: 1.0, P3: null };
      // Product = 66.6. Remaining = 33.4. If getting 5.0 -> 33.4*5 = 167. 
      // Total = 233.6 < 300
      expect(determinarEstado(notas, config3Periods).text).toBe('Perdido');
    });

    it('returns En riesgo if required grade > 4.0', () => {
      const notas: PeriodoNotas = { P1: 2.0, P2: 2.0, P3: null };
      // Requires ~4.99
      expect(determinarEstado(notas, config3Periods).text).toBe('En riesgo');
    });

    it('returns Recuperable if required grade > 3.0 but <= 4.0', () => {
      const notas: PeriodoNotas = { P1: 2.5, P2: 2.5, P3: null };
      // Product = 166.5. Needed = 133.5. Remaining weight = 33.4. Required = 133.5/33.4 ~ 3.99
      expect(determinarEstado(notas, config3Periods).text).toBe('Recuperable');
    });

    it('returns Ganable if required grade <= 3.0', () => {
      const notas: PeriodoNotas = { P1: 3.0, P2: 3.0, P3: null };
      // Requires exactly 3.0
      expect(determinarEstado(notas, config3Periods).text).toBe('Ganable');
    });

    it('returns correctly when all periods are finished (Ganado)', () => {
      const notas: PeriodoNotas = { P1: 3.0, P2: 3.0, P3: 3.0 };
      expect(determinarEstado(notas, config3Periods).text).toBe('Ganado');
    });

    it('returns correctly when all periods are finished (Perdido)', () => {
      const notas: PeriodoNotas = { P1: 2.9, P2: 2.9, P3: 2.9 };
      expect(determinarEstado(notas, config3Periods).text).toBe('Perdido');
    });
  });

  describe('applyAcademicLogic', () => {
    it('mutates the students array to add academic logic', () => {
      const student: Estudiante = {
        id: '1', name: 'JUAN', CURSO: '10A',
        areas: {
          'MATEMATICAS': {
            DEF: { P1: 3.0, P2: null, P3: null, P4: null },
            asignaturas: {
              'ALGEBRA': { 
                P1: 3.0, P2: null, P3: null, P4: null,
                promedioActual: 0, p4Min: 0, estado: { text: 'N/A', color: 'gray' }
              }
            }
          }
        }
      };

      applyAcademicLogic([student], config3Periods);
      
      const asig = student.areas['MATEMATICAS'].asignaturas['ALGEBRA'];
      expect(asig.promedioActual).toBe(3.0);
      expect(asig.estado.text).toBe('Ganable');

      const def = student.areas['MATEMATICAS'].areaStats;
      expect(def).toBeDefined();
      expect(def?.promedioActual).toBe(3.0);
      expect(def?.estado.text).toBe('Ganable');
    });
  });
});

