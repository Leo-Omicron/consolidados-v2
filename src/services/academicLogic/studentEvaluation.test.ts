import { describe, it, expect } from 'vitest';
import { 
  getStudentAverage, 
  isAcademicImprovementPoint, 
  isAcademicStrength, 
  isStudentReprobado 
} from './studentEvaluation';
import type { Estudiante } from '../../domain/types';

describe('studentEvaluation logic', () => {
  describe('read-only academic evaluation helpers', () => {
    it('centralizes student failure and strength thresholds', () => {
      expect(isStudentReprobado(2)).toBe(false);
      expect(isStudentReprobado(3)).toBe(true);
      expect(isAcademicStrength(3.49)).toBe(false);
      expect(isAcademicStrength(3.5)).toBe(true);
      expect(isAcademicImprovementPoint(3.49)).toBe(true);
      expect(isAcademicImprovementPoint(3.5)).toBe(false);
    });

    it('uses official student averages before falling back to area averages', () => {
      const student: Estudiante = {
        id: 's1',
        name: 'Student 1',
        CURSO: '10',
        grupo: '10A',
        promedios: { DEF: 4.6, P1: 4.2 },
        areas: {
          Math: {
            asignaturas: {},
            DEF: { P1: 3.0, P2: 4.0, P3: null, P4: null },
            areaStats: { promedioActual: 3.2, p4Min: 0, estado: { text: 'Ganable', color: 'cyan' } },
          },
          Science: {
            asignaturas: {},
            DEF: { P1: 5.0, P2: 3.0, P3: null, P4: null },
            areaStats: { promedioActual: 3.8, p4Min: 0, estado: { text: 'Ganable', color: 'cyan' } },
          },
        },
      };

      expect(getStudentAverage(student)).toBe(4.6);
      expect(getStudentAverage(student, 'P1')).toBe(4.2);
      expect(getStudentAverage(student, 'P2')).toBe(3.5);
      expect(getStudentAverage(student, 'P3')).toBeNull();
    });

    it('preserves DEF fallback behavior for students without official averages', () => {
      const student: Estudiante = {
        id: 's1',
        name: 'Student 1',
        CURSO: '10',
        grupo: '10A',
        areas: {
          Math: {
            asignaturas: {},
            DEF: { P1: null, P2: null, P3: null, P4: null },
            areaStats: { promedioActual: 3.25, p4Min: 0, estado: { text: 'Ganable', color: 'cyan' } },
          },
          Science: {
            asignaturas: {},
            DEF: { P1: null, P2: null, P3: null, P4: null },
            areaStats: { promedioActual: 2.0, p4Min: 0, estado: { text: 'Perdido', color: 'red' } },
          },
        },
      };

      expect(getStudentAverage(student)).toBe(2.63);
      expect(getStudentAverage({ ...student, areas: {} })).toBe(0);
    });
  });
});
