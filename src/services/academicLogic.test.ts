import { describe, it, expect } from 'vitest';
import {
  roundToOneDecimal,
  getAccumulatedWeightAndProduct,
  calcularPromedioActual,
  calcularMinimoRequerido,
  calcularNotaRequeridaParaObjetivo,
  calcularAcumuladoBase,
  determinarEstado,
  getEvaluatedPeriods,
  applyAcademicLogic,
  getPresetWeights,
  inferSubjectWeights
} from './academicLogic';
import type { PeriodoNotas, PeriodConfig, Estudiante } from '../domain/types';

describe('academicLogic', () => {
  const config: PeriodConfig = { P1: 25, P2: 25, P3: 25, P4: 25 };

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

  describe('getEvaluatedPeriods', () => {
    it('detects which periods have grades', () => {
      const students: Estudiante[] = [{
        id: '1', name: 'Test', grupo: '10A', CURSO: '10A',
        areas: {
          'Area 1': {
            DEF: { P1: null, P2: null, P3: null, P4: null, A: null },
            areaStats: { promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } },
            asignaturas: {
              'Asig 1': { P1: 4.0, P2: null, P3: null, P4: null, A: null, promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } }
            }
          }
        }
      }];
      expect(getEvaluatedPeriods(students)).toEqual({ P1: true, P2: false, P3: false, P4: false });
    });
  });

  describe('getPresetWeights', () => {
    it('returns mathematics preset', () => {
      expect(getPresetWeights('MATEMATICAS', ['ESTADISTICA', 'GEOMETRIA', 'MATEMATICAS'])).toEqual({
        'ESTADISTICA': 0.30, 'GEOMETRIA': 0.20, 'MATEMATICAS': 0.50
      });
    });

    it('returns ciencias sociales 6-8 preset', () => {
      expect(getPresetWeights('CIENCIAS SOCIALES', ['CATEDRA', 'GEOGRAFIA', 'HISTORIA'])).toEqual({
        'CATEDRA': 0.25, 'GEOGRAFIA': 0.25, 'HISTORIA': 0.50
      });
    });

    it('returns ciencias sociales 9 preset', () => {
      expect(getPresetWeights('CIENCIAS SOCIALES', ['CATEDRA', 'COMPETENCIAS CIUDADANAS', 'HISTORIA'])).toEqual({
        'CATEDRA': 0.25, 'HISTORIA': 0.50, 'COMPETENCIAS CIUDADANAS': 0.25
      });
    });

    it('returns ciencias sociales 10-11 preset', () => {
      expect(getPresetWeights('CIENCIAS SOCIALES', ['ECONOMIA', 'COMPETENCIAS CIUDADANAS'])).toEqual({
        'ECONOMIA': 0.50, 'COMPETENCIAS CIUDADANAS': 0.50
      });
    });

    it('returns ciencias naturales 6-9 preset', () => {
      expect(getPresetWeights('CIENCIAS NATURALES', ['EDUCACION AMBIENTAL', 'BIOLOGIA'])).toEqual({
        'EDUCACION AMBIENTAL': 0.50, 'BIOLOGIA': 0.50
      });
    });

    it('returns ciencias naturales 10-11 preset', () => {
      expect(getPresetWeights('CIENCIAS NATURALES', ['QUIMICA', 'FISICA'])).toEqual({
        'QUIMICA': 0.50, 'FISICA': 0.50
      });
    });

    it('returns humanidades preset', () => {
      expect(getPresetWeights('HUMANIDADES', ['COMPRENSION LECTORA', 'ESPAÑOL'])).toEqual({
        'COMPRENSION LECTORA': 0.40, 'ESPAÑOL': 0.60
      });
    });

    it('returns null for unknown', () => {
      expect(getPresetWeights('ARTES', ['DIBUJO', 'PINTURA'])).toBeNull();
    });
  });

  describe('inferSubjectWeights', () => {
    it('returns equal weights if 0 or 1 subject', () => {
      expect(inferSubjectWeights([], 'ARTES')).toEqual({ 'ARTES': 1.0 });
    });

    it('returns equal weights if too many subjects', () => {
      const students: Estudiante[] = [{
        id: '1', name: 'Test', grupo: '10A', CURSO: '10A',
        areas: {
          'ARTES': {
            DEF: { P1: 4.0, P2: null, P3: null, P4: null, A: null },
            areaStats: { promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } },
            asignaturas: {
              'A1': { P1: 4.0, P2: null, P3: null, P4: null, A: null, promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } },
              'A2': { P1: 4.0, P2: null, P3: null, P4: null, A: null, promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } },
              'A3': { P1: 4.0, P2: null, P3: null, P4: null, A: null, promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } },
              'A4': { P1: 4.0, P2: null, P3: null, P4: null, A: null, promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } },
            }
          }
        }
      }];
      expect(inferSubjectWeights(students, 'ARTES')).toEqual({
        'A1': 0.25, 'A2': 0.25, 'A3': 0.25, 'A4': 0.25
      });
    });

    it('infers weights via grid search for 2 subjects', () => {
      const students: Estudiante[] = [{
        id: '1', name: 'Test', grupo: '10A', CURSO: '10A',
        areas: {
          'ARTES': {
            DEF: { P1: 4.2, P2: null, P3: null, P4: null, A: null },
            areaStats: { promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } },
            asignaturas: {
              'A1': { P1: 5.0, P2: null, P3: null, P4: null, A: null, promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } }, // 5.0 * 0.2 = 1.0
              'A2': { P1: 4.0, P2: null, P3: null, P4: null, A: null, promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } }, // 4.0 * 0.8 = 3.2, 1.0+3.2=4.2
            }
          }
        }
      }];
      const inferred = inferSubjectWeights(students, 'ARTES');
      expect(inferred['A1']).toBeCloseTo(0.2);
      expect(inferred['A2']).toBeCloseTo(0.8);
    });

    it('infers weights via grid search for 3 subjects', () => {
      const students: Estudiante[] = [
        {
          id: '1', name: 'Test', grupo: '10A', CURSO: '10A',
          areas: {
            'ARTES': {
              DEF: { P1: 4.4, P2: null, P3: null, P4: null, A: null },
              areaStats: { promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } },
              asignaturas: {
                'A1': { P1: 4.0, P2: null, P3: null, P4: null, A: null, promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } },
                'A2': { P1: 5.0, P2: null, P3: null, P4: null, A: null, promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } },
                'A3': { P1: 4.66, P2: null, P3: null, P4: null, A: null, promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } },
              }
            }
          }
        },
        {
          id: '2', name: 'Test 2', grupo: '10A', CURSO: '10A',
          areas: {
            'ARTES': {
              DEF: { P1: 4.3, P2: null, P3: null, P4: null, A: null },
              areaStats: { promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } },
              asignaturas: {
                'A1': { P1: 5.0, P2: null, P3: null, P4: null, A: null, promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } }, // 5.0*0.5 = 2.5
                'A2': { P1: 3.0, P2: null, P3: null, P4: null, A: null, promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } }, // 3.0*0.2 = 0.6
                'A3': { P1: 4.0, P2: null, P3: null, P4: null, A: null, promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } }, // 4.0*0.3 = 1.2 => sum = 4.3
              }
            }
          }
        }
      ];
      const inferred = inferSubjectWeights(students, 'ARTES');
      expect(inferred['A1']).toBeCloseTo(0.5, 1);
      expect(inferred['A2']).toBeCloseTo(0.2, 1);
      expect(inferred['A3']).toBeCloseTo(0.3, 1);
    });
  });

  describe('applyAcademicLogic', () => {
    it('applies simulations and calculates area DEFs and states', () => {
      const student: Estudiante = {
        id: '1', name: 'Test', grupo: '10A', CURSO: '10A',
        areas: {
          'Ciencias': {
            DEF: { P1: null, P2: null, P3: null, P4: null, A: null },
            areaStats: { promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } },
            asignaturas: {
              'Fisica': { P1: 3.0, P2: 2.0, P3: null, P4: null, A: null, promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } },
              'Quimica': { P1: 3.0, P2: 2.0, P3: null, P4: null, A: null, promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } }
            }
          }
        }
      };

      const subjectWeights = {
        '10A': {
          'Ciencias': {
            'Fisica': 0.5,
            'Quimica': 0.5
          }
        }
      };

      const activeSimulations = {
        '1_Ciencias_Fisica': { P2: 4.0 } // Simulate that they improved P2
      };

      applyAcademicLogic([student], config, subjectWeights, activeSimulations);

      const area = student.areas['Ciencias'];
      // Fisica should now be P1: 3.0, P2: 4.0
      expect(area.asignaturas['Fisica'].P2).toBe(4.0);
      expect(area.asignaturas['Fisica'].promedioActual).toBe(3.5);
      
      // Quimica should be P1: 3.0, P2: 2.0
      expect(area.asignaturas['Quimica'].P2).toBe(2.0);
      expect(area.asignaturas['Quimica'].promedioActual).toBe(2.5);

      // Area DEF: P1 = (3*0.5 + 3*0.5) = 3.0. P2 = (4*0.5 + 2*0.5) = 3.0.
      expect(area.DEF.P1).toBe(3.0);
      expect(area.DEF.P2).toBe(3.0);
      expect(area.areaStats.promedioActual).toBe(3.0);
    });

    it('falls back to uniform weights when none are provided', () => {
      const student: Estudiante = {
        id: '1', name: 'Test', grupo: '10A', CURSO: '10A',
        areas: {
          'Ciencias': {
            DEF: { P1: null, P2: null, P3: null, P4: null, A: null },
            areaStats: { promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } },
            asignaturas: {
              'Bio': { P1: 5.0, P2: null, P3: null, P4: null, A: null, promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } },
              'Qui': { P1: 3.0, P2: null, P3: null, P4: null, A: null, promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } },
              'Fis': { P1: 4.0, P2: null, P3: null, P4: null, A: null, promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } }
            }
          }
        }
      };

      applyAcademicLogic([student], config, {}, {});
      const area = student.areas['Ciencias'];
      // P1 avg = (5+3+4)/3 = 4.0
      expect(area.DEF.P1).toBe(4.0);
    });

    it('applies direct area simulations when there are no subjects', () => {
      const student: Estudiante = {
        id: '1', name: 'Test', grupo: '10A', CURSO: '10A',
        areas: {
          'Educacion Fisica': {
            DEF: { P1: 2.0, P2: 2.0, P3: null, P4: null, A: null },
            areaStats: { promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } },
            asignaturas: {} // No subjects
          }
        }
      };

      const activeSimulations = {
        '1_Educacion Fisica_Educacion Fisica': { P2: 4.0, P4: 5.0 }
      };

      applyAcademicLogic([student], config, {}, activeSimulations);
      
      expect(student.areas['Educacion Fisica'].DEF.P2).toBe(4.0);
      expect(student.areas['Educacion Fisica'].DEF.P4).toBe(5.0);
    });

    it('applies area-level overrides that overwrite DEF directly', () => {
      const student: Estudiante = {
        id: '1', name: 'Test', grupo: '10A', CURSO: '10A',
        areas: {
          'Artes': {
            DEF: { P1: 3.0, P2: 3.0, P3: null, P4: null, A: null },
            areaStats: { promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } },
            asignaturas: {
              'Musica': { P1: 3.0, P2: 3.0, P3: null, P4: null, A: null, promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } }
            }
          }
        }
      };

      const activeSimulations = {
        '1_Artes': { P2: 5.0, P4: 1.0 }
      };

      applyAcademicLogic([student], config, {}, activeSimulations);
      
      expect(student.areas['Artes'].DEF.P2).toBe(5.0);
      expect(student.areas['Artes'].DEF.P4).toBe(1.0);
    });

    it('handles evaluated but missing grades as 0.0 in area DEF', () => {
      const student: Estudiante = {
        id: '1', name: 'Test', grupo: '10A', CURSO: '10A',
        areas: {
          'Ciencias': {
            DEF: { P1: null, P2: null, P3: null, P4: null, A: null },
            areaStats: { promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } },
            asignaturas: {
              'Bio': { P1: 5.0, P2: null, P3: null, P4: null, A: null, promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } }
            }
          }
        }
      };

      const anotherStudent: Estudiante = {
        id: '2', name: 'Test 2', grupo: '10A', CURSO: '10A',
        areas: {
          'Ciencias': {
            DEF: { P1: null, P2: null, P3: null, P4: null, A: null },
            areaStats: { promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } },
            asignaturas: {
              'Bio': { P1: 5.0, P2: 4.0, P3: null, P4: null, A: null, promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } } // This establishes P2 is evaluated globally
            }
          }
        }
      };

      applyAcademicLogic([student, anotherStudent], config, {}, {});
      
      // Since P2 is evaluated, student 1's Bio missing P2 should be treated as 0.0 for area DEF
      expect(student.areas['Ciencias'].DEF.P2).toBe(0.0);
    });
  });
});
