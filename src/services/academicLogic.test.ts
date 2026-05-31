import { describe, it, expect } from 'vitest';
import { calcularPromedioActual, calcularMinimoRequerido, calcularNotaRequeridaParaObjetivo, determinarEstado, applyAcademicLogic, inferSubjectWeights, roundToOneDecimal } from './academicLogic';
import type { PeriodConfig, PeriodoNotas, Estudiante } from '../domain/types';

describe('academicLogic', () => {
  const config3Periods: PeriodConfig = { P1: 33.3, P2: 33.3, P3: 33.4 };
  const config4Periods: PeriodConfig = { P1: 25, P2: 25, P3: 25, P4: 25 };

  describe('roundToOneDecimal', () => {
    it('applies standard mathematical half-up rounding', () => {
      expect(roundToOneDecimal(2.95)).toBe(3.0);
      expect(roundToOneDecimal(2.94)).toBe(2.9);
      expect(roundToOneDecimal(3.45)).toBe(3.5);
      expect(roundToOneDecimal(3.44)).toBe(3.4);
      expect(roundToOneDecimal(4.05)).toBe(4.1);
    });
  });

  describe('calcularPromedioActual', () => {
    it('calculates average for 3 periods correctly with weights', () => {
      const notas: PeriodoNotas = { P1: 4.0, P2: 3.0, P3: null };
      // (4 * 33.3 + 3 * 33.3) / 66.6 = 3.5
      expect(calcularPromedioActual(notas, config3Periods)).toBe(3.5);
    });

    it('treats missing/null grade in an evaluated period as 0.0', () => {
      const notas: PeriodoNotas = { P1: 4.0, P2: null, P3: null };
      const evaluated = { P1: true, P2: true, P3: false, P4: false };
      // P1 (4.0) is evaluated, P2 (null) is evaluated -> counts as 0.0. P3 is future.
      // Weighted product: 4.0 * 33.3 + 0 * 33.3 = 133.2
      // Weighted weight: 33.3 + 33.3 = 66.6
      // Average: 133.2 / 66.6 = 2.0
      expect(calcularPromedioActual(notas, config3Periods, evaluated)).toBe(2.0);
    });

    it('calculates average for 4 periods correctly', () => {
      const notas: PeriodoNotas = { P1: 4.0, P2: 2.0, P3: 5.0, P4: null };
      // (4*25 + 2*25 + 5*25) / 75 = 11*25 / 75 = 11/3 = 3.666... which rounds to 3.7
      expect(calcularPromedioActual(notas, config4Periods)).toBe(3.7);
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

  describe('calcularNotaRequeridaParaObjetivo', () => {
    it('calculates the exact grade needed to reach a specific target average', () => {
      const notas: PeriodoNotas = { P1: 2.0, P2: 3.0, P3: null };
      // Goal: 4.0
      // Current: 2*33.3 + 3*33.3 = 66.6 + 99.9 = 166.5
      // Target: 4.0 * 100 = 400
      // Needed: 400 - 166.5 = 233.5
      // Remaining weight: 33.4
      // Required grade: 233.5 / 33.4 = 6.99
      expect(calcularNotaRequeridaParaObjetivo(notas, config3Periods, 4.0)).toBe(6.99);

      // Goal: 3.0
      // Target: 300
      // Needed: 300 - 166.5 = 133.5
      // Required grade: 133.5 / 33.4 = 3.997...
      expect(calcularNotaRequeridaParaObjetivo(notas, config3Periods, 3.0)).toBe(4.0);
    });

    it('returns a negative grade if the target is already surpassed by a lot', () => {
      const notas: PeriodoNotas = { P1: 5.0, P2: 5.0, P3: null };
      // Goal: 3.0
      // Target: 300
      // Current: 5*33.3 + 5*33.3 = 333
      // Needed: 300 - 333 = -33
      // Required: -33 / 33.4 = -0.99
      expect(calcularNotaRequeridaParaObjetivo(notas, config3Periods, 3.0)).toBe(-0.99);
    });

    it('returns null if no periods are left', () => {
      const notas: PeriodoNotas = { P1: 3.0, P2: 3.0, P3: 3.0 };
      expect(calcularNotaRequeridaParaObjetivo(notas, config3Periods, 4.0)).toBe(null);
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

    it('returns En riesgo if required grade exceeds historical average by more than 1.0', () => {
      const notas: PeriodoNotas = { P1: 2.0, P2: 2.0, P3: null };
      // Historical average is 2.0. Required is 4.99. 4.99 > 2.0 + 1.0 => En riesgo.
      expect(determinarEstado(notas, config3Periods).text).toBe('En riesgo');
    });

    it('returns Recuperable if required grade is < 3.2', () => {
      const notas: PeriodoNotas = { P1: 3.0, P2: 2.0, P3: null };
      // Historical average: 2.5
      // Product: 3*33.3 + 2*33.3 = 166.5. Required: (300 - 166.5) / 33.4 = 133.5 / 33.4 = ~3.99.
      // 4.0 >= 3.2 => En riesgo.
      expect(determinarEstado(notas, config3Periods).text).toBe('En riesgo');

      const notasRec: PeriodoNotas = { P1: 3.0, P2: 2.9, P3: null };
      // Historical average: 2.95
      // Product: 99.9 + 96.57 = 196.47. Required: (300 - 196.47) / 33.4 = 103.53 / 33.4 = ~3.09.
      // 3.1 < 3.2, so Recuperable.
      expect(determinarEstado(notasRec, config3Periods).text).toBe('Recuperable');
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

    it('returns Ganado for an average of 2.95 after half-up rounding, and Perdido for 2.94', () => {
      const notasPassing: PeriodoNotas = { P1: 2.95, P2: 2.95, P3: 2.95, P4: 2.95 };
      expect(determinarEstado(notasPassing, config4Periods).text).toBe('Ganado');

      const notasFailing: PeriodoNotas = { P1: 2.94, P2: 2.94, P3: 2.94, P4: 2.94 };
      expect(determinarEstado(notasFailing, config4Periods).text).toBe('Perdido');
    });
  });

  describe('applyAcademicLogic', () => {
    it('mutates the students array to add academic logic', () => {
      const student: Estudiante = {
        id: '1', name: 'JUAN', CURSO: '10A', grupo: '10A',
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

    it('dynamically recalculates Area DEF based on subject weights', () => {
      const student: Estudiante = {
        id: '1', name: 'JUAN', CURSO: '10A', grupo: '10A',
        areas: {
          'CIENCIAS': {
            DEF: { P1: null, P2: null, P3: null, P4: null },
            asignaturas: {
              'FISICA': { P1: 4.0, P2: null, P3: null, P4: null, promedioActual: 0, p4Min: 0, estado: { text: 'N/A', color: 'gray' } },
              'QUIMICA': { P1: 2.0, P2: null, P3: null, P4: null, promedioActual: 0, p4Min: 0, estado: { text: 'N/A', color: 'gray' } }
            }
          }
        }
      };

      applyAcademicLogic([student], config3Periods, { 'CIENCIAS': { 'FISICA': 0.7, 'QUIMICA': 0.3 } } as any);

      // 4.0 * 0.7 + 2.0 * 0.3 = 2.8 + 0.6 = 3.4
      expect(student.areas['CIENCIAS'].DEF.P1).toBe(3.4);
      expect(student.areas['CIENCIAS'].areaStats?.promedioActual).toBe(3.4);
    });

    it('group-aware applyAcademicLogic: dynamically recalculates Area DEF using weights of the student\'s group', () => {
      const student6: Estudiante = {
        id: '1', name: 'JUAN', CURSO: 'Sexto', grupo: '6A',
        areas: {
          'CIENCIAS': {
            DEF: { P1: null, P2: null, P3: null, P4: null },
            asignaturas: {
              'FISICA': { P1: 4.0, P2: null, P3: null, P4: null, promedioActual: 0, p4Min: 0, estado: { text: 'N/A', color: 'gray' } },
              'QUIMICA': { P1: 2.0, P2: null, P3: null, P4: null, promedioActual: 0, p4Min: 0, estado: { text: 'N/A', color: 'gray' } }
            }
          }
        }
      };

      const student10: Estudiante = {
        id: '2', name: 'PEDRO', CURSO: 'Decimo', grupo: '10A',
        areas: {
          'CIENCIAS': {
            DEF: { P1: null, P2: null, P3: null, P4: null },
            asignaturas: {
              'FISICA': { P1: 4.0, P2: null, P3: null, P4: null, promedioActual: 0, p4Min: 0, estado: { text: 'N/A', color: 'gray' } },
              'QUIMICA': { P1: 2.0, P2: null, P3: null, P4: null, promedioActual: 0, p4Min: 0, estado: { text: 'N/A', color: 'gray' } }
            }
          }
        }
      };

      const weights: any = {
        '6A': {
          'CIENCIAS': { 'FISICA': 0.8, 'QUIMICA': 0.2 }
        },
        '10A': {
          'CIENCIAS': { 'FISICA': 0.5, 'QUIMICA': 0.5 }
        }
      };

      applyAcademicLogic([student6, student10], config3Periods, weights);

      // Student 6: 4.0 * 0.8 + 2.0 * 0.2 = 3.2 + 0.4 = 3.6
      expect(student6.areas['CIENCIAS'].DEF.P1).toBe(3.6);

      // Student 10: 4.0 * 0.5 + 2.0 * 0.5 = 2.0 + 1.0 = 3.0
      expect(student10.areas['CIENCIAS'].DEF.P1).toBe(3.0);
    });

    it('rounds subject-level averages, period Area DEF averages, and final averages to exactly 1 decimal place', () => {
      const student: Estudiante = {
        id: '1', name: 'JUAN', CURSO: '10A', grupo: '10A',
        areas: {
          'MATEMATICAS': {
            DEF: { P1: null, P2: null, P3: null, P4: null },
            asignaturas: {
              'ALGEBRA': { 
                P1: 2.95, P2: null, P3: null, P4: null,
                promedioActual: 0, p4Min: 0, estado: { text: 'N/A', color: 'gray' }
              }
            }
          }
        }
      };

      applyAcademicLogic([student], config3Periods);
      const asig = student.areas['MATEMATICAS'].asignaturas['ALGEBRA'];
      expect(asig.promedioActual).toBe(3.0);

      const student2: Estudiante = {
        id: '2', name: 'PEDRO', CURSO: '10A', grupo: '10A',
        areas: {
          'CIENCIAS': {
            DEF: { P1: null, P2: null, P3: null, P4: null },
            asignaturas: {
              'FISICA': { P1: 2.9, P2: null, P3: null, P4: null, promedioActual: 0, p4Min: 0, estado: { text: 'N/A', color: 'gray' } },
              'QUIMICA': { P1: 3.0, P2: null, P3: null, P4: null, promedioActual: 0, p4Min: 0, estado: { text: 'N/A', color: 'gray' } }
            }
          }
        }
      };

      const weights = { 'CIENCIAS': { 'FISICA': 0.5, 'QUIMICA': 0.5 } };
      applyAcademicLogic([student2], config3Periods, weights as any);

      expect(student2.areas['CIENCIAS'].DEF.P1).toBe(3.0);
      expect(student2.areas['CIENCIAS'].areaStats?.promedioActual).toBe(3.0);
    });
  });

  describe('inferSubjectWeights', () => {
    it('infers exact weights for 2 subjects', () => {
      // W_m = 0.6, W_g = 0.4
      // Math: 4.0, Geo: 3.0 -> DEF: 4.0 * 0.6 + 3.0 * 0.4 = 2.4 + 1.2 = 3.6
      // Math: 2.0, Geo: 4.0 -> DEF: 2.0 * 0.6 + 4.0 * 0.4 = 1.2 + 1.6 = 2.8
      const students: Estudiante[] = [
        {
          id: '1', name: 'A', CURSO: '6A', grupo: '6A',
          areas: {
            'CIENCIAS': {
              DEF: { P1: 3.6, P2: null, P3: null, P4: null },
              asignaturas: {
                'MATEMATICAS': { P1: 4.0, P2: null, P3: null, P4: null, promedioActual: 0, p4Min: 0, estado: { text: 'N/A', color: 'gray' } },
                'GEOMETRIA': { P1: 3.0, P2: null, P3: null, P4: null, promedioActual: 0, p4Min: 0, estado: { text: 'N/A', color: 'gray' } }
              }
            }
          }
        },
        {
          id: '2', name: 'B', CURSO: '6A', grupo: '6A',
          areas: {
            'CIENCIAS': {
              DEF: { P1: 2.8, P2: null, P3: null, P4: null },
              asignaturas: {
                'MATEMATICAS': { P1: 2.0, P2: null, P3: null, P4: null, promedioActual: 0, p4Min: 0, estado: { text: 'N/A', color: 'gray' } },
                'GEOMETRIA': { P1: 4.0, P2: null, P3: null, P4: null, promedioActual: 0, p4Min: 0, estado: { text: 'N/A', color: 'gray' } }
              }
            }
          }
        }
      ];

      const weights = inferSubjectWeights(students, 'CIENCIAS');
      expect(weights['MATEMATICAS']).toBeCloseTo(0.6, 2);
      expect(weights['GEOMETRIA']).toBeCloseTo(0.4, 2);
    });

    it('falls back to equal weights (1/N) when data is inconsistent or sparse', () => {
      // Data that makes no sense: Math 4.0, Geo 4.0, DEF 3.0
      const students: Estudiante[] = [
        {
          id: '1', name: 'A', CURSO: '6A', grupo: '6A',
          areas: {
            'CIENCIAS': {
              DEF: { P1: 3.0, P2: null, P3: null, P4: null },
              asignaturas: {
                'MATEMATICAS': { P1: 4.0, P2: null, P3: null, P4: null, promedioActual: 0, p4Min: 0, estado: { text: 'N/A', color: 'gray' } },
                'GEOMETRIA': { P1: 4.0, P2: null, P3: null, P4: null, promedioActual: 0, p4Min: 0, estado: { text: 'N/A', color: 'gray' } }
              }
            }
          }
        }
      ];

      const weights = inferSubjectWeights(students, 'CIENCIAS');
      expect(weights['MATEMATICAS']).toBe(0.5);
      expect(weights['GEOMETRIA']).toBe(0.5);
    });

    it('returns 30%, 20%, 50% for MATEMATICAS (Estadistica, Geometria, Matematica)', () => {
      const students: Estudiante[] = [
        {
          id: '1', name: 'A', CURSO: '6A', grupo: '6A',
          areas: {
            'MATEMATICAS': {
              DEF: { P1: null, P2: null, P3: null, P4: null },
              asignaturas: {
                'ESTADISTICA': { P1: null, P2: null, P3: null, P4: null, promedioActual: 0, p4Min: 0, estado: { text: 'N/A', color: 'gray' } },
                'GEOMETRIA': { P1: null, P2: null, P3: null, P4: null, promedioActual: 0, p4Min: 0, estado: { text: 'N/A', color: 'gray' } },
                'MATEMATICAS': { P1: null, P2: null, P3: null, P4: null, promedioActual: 0, p4Min: 0, estado: { text: 'N/A', color: 'gray' } }
              }
            }
          }
        }
      ];

      const weights = inferSubjectWeights(students, 'MATEMATICAS');
      expect(weights['ESTADISTICA']).toBe(0.3);
      expect(weights['GEOMETRIA']).toBe(0.2);
      expect(weights['MATEMATICAS']).toBe(0.5);
    });

    it('returns 25%, 25%, 50% for CIENCIAS SOCIALES (Catedra, Geografia, Historia)', () => {
      const students: Estudiante[] = [
        {
          id: '1', name: 'A', CURSO: '6A', grupo: '6A',
          areas: {
            'CIENCIAS SOCIALES': {
              DEF: { P1: null, P2: null, P3: null, P4: null },
              asignaturas: {
                'CÁTEDRA PARA LA PAZ': { P1: null, P2: null, P3: null, P4: null, promedioActual: 0, p4Min: 0, estado: { text: 'N/A', color: 'gray' } },
                'GEOGRAFÍA': { P1: null, P2: null, P3: null, P4: null, promedioActual: 0, p4Min: 0, estado: { text: 'N/A', color: 'gray' } },
                'HISTORIA': { P1: null, P2: null, P3: null, P4: null, promedioActual: 0, p4Min: 0, estado: { text: 'N/A', color: 'gray' } }
              }
            }
          }
        }
      ];

      const weights = inferSubjectWeights(students, 'CIENCIAS SOCIALES');
      expect(weights['CÁTEDRA PARA LA PAZ']).toBe(0.25);
      expect(weights['GEOGRAFÍA']).toBe(0.25);
      expect(weights['HISTORIA']).toBe(0.5);
    });

    it('returns 40%, 60% for HUMANIDADES Y LENGUA CASTELLANA (Comprension, Español)', () => {
      const students: Estudiante[] = [
        {
          id: '1', name: 'A', CURSO: '6A', grupo: '6A',
          areas: {
            'HUMANIDADES Y LENGUA CASTELLANA': {
              DEF: { P1: null, P2: null, P3: null, P4: null },
              asignaturas: {
                'COMPRENSIÓN LECTORA': { P1: null, P2: null, P3: null, P4: null, promedioActual: 0, p4Min: 0, estado: { text: 'N/A', color: 'gray' } },
                'ESPAÑOL': { P1: null, P2: null, P3: null, P4: null, promedioActual: 0, p4Min: 0, estado: { text: 'N/A', color: 'gray' } }
              }
            }
          }
        }
      ];

      const weights = inferSubjectWeights(students, 'HUMANIDADES Y LENGUA CASTELLANA');
      expect(weights['COMPRENSIÓN LECTORA']).toBe(0.4);
      expect(weights['ESPAÑOL']).toBe(0.6);
    });
  });
});

