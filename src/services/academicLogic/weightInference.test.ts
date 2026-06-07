import { describe, it, expect } from 'vitest';
import { 
  calculateWeightedAreaPeriodGrade, 
  createUniformSubjectWeights, 
  inferSubjectWeights 
} from './weightInference';
import type { Area, Estudiante } from '../../domain/types';

describe('weightInference logic', () => {
  describe('calculateWeightedAreaPeriodGrade', () => {
    it('calculates weighted area period grades from subjects', () => {
      const area: Area = {
        DEF: { P1: null, P2: null, P3: null, P4: null, A: null },
        asignaturas: {
          Biology: { P1: 4.0, P2: null, P3: null, P4: null, A: null, promedioActual: 0, p4Min: 0, estado: { text: 'Ganable', color: 'cyan' } },
          Chemistry: { P1: 2.0, P2: null, P3: null, P4: null, A: null, promedioActual: 0, p4Min: 0, estado: { text: 'Perdido', color: 'red' } },
        },
      };

      expect(calculateWeightedAreaPeriodGrade(
        area,
        'P1',
        { P1: true, P2: false, P3: false, P4: false },
        { Biology: 0.75, Chemistry: 0.25 }
      )).toBe(3.5);
    });

    it('falls back to uniform subject weights and respects evaluated missing grades', () => {
      const area: Area = {
        DEF: { P1: null, P2: null, P3: null, P4: null, A: null },
        asignaturas: {
          Biology: { P1: 5.0, P2: null, P3: null, P4: null, A: null, promedioActual: 0, p4Min: 0, estado: { text: 'Ganable', color: 'cyan' } },
          Chemistry: { P1: 3.0, P2: null, P3: null, P4: null, A: null, promedioActual: 0, p4Min: 0, estado: { text: 'Ganable', color: 'cyan' } },
        },
      };

      expect(createUniformSubjectWeights(['Biology', 'Chemistry'])).toEqual({
        Biology: 0.5,
        Chemistry: 0.5,
      });
      expect(calculateWeightedAreaPeriodGrade(
        area,
        'P1',
        { P1: true, P2: false, P3: false, P4: false },
      )).toBe(4.0);
      expect(calculateWeightedAreaPeriodGrade(
        area,
        'P2',
        { P1: true, P2: false, P3: false, P4: false },
      )).toBeNull();
      expect(calculateWeightedAreaPeriodGrade(
        area,
        'P2',
        { P1: true, P2: true, P3: false, P4: false },
      )).toBe(0);
    });
  });

  describe('inferSubjectWeights', () => {
    it('returns equal weights if 0 or 1 subject', () => {
      expect(inferSubjectWeights([], 'ARTES', '10A')).toEqual({ 'ARTES': 1.0 });
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
      expect(inferSubjectWeights(students, 'ARTES', '10A')).toEqual({
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
      const inferred = inferSubjectWeights(students, 'ARTES', '10A');
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
      const inferred = inferSubjectWeights(students, 'ARTES', '10A');
      expect(inferred['A1']).toBeCloseTo(0.5, 1);
      expect(inferred['A2']).toBeCloseTo(0.2, 1);
      expect(inferred['A3']).toBeCloseTo(0.3, 1);
    });
  });
});
