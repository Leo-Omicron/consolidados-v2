import { describe, it, expect } from 'vitest';
import { 
  determineAcademicTrend, 
  getEvaluatedPeriods, 
  getGradeFromGroup 
} from './gradeExtraction';
import type { Estudiante } from '../../domain/types';

describe('gradeExtraction logic', () => {
  describe('determineAcademicTrend', () => {
    it('determines trend from P1 to latest evaluated period', () => {
      expect(determineAcademicTrend(3.0, 3.5, 4.0)).toBe('up');
      expect(determineAcademicTrend(4.0, 3.5, null)).toBe('down');
      expect(determineAcademicTrend(3.5, 3.5, undefined)).toBe('flat');
      expect(determineAcademicTrend(null, 3.5, 4.0)).toBe('none');
      expect(determineAcademicTrend(3.5, null, null)).toBe('none');
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

  describe('getGradeFromGroup', () => {
    it('parses numeric groups correctly', () => {
      expect(getGradeFromGroup('10A')).toBe(10);
      expect(getGradeFromGroup('6B')).toBe(6);
      expect(getGradeFromGroup('11-2')).toBe(11);
    });

    it('parses spanish word groups correctly', () => {
      expect(getGradeFromGroup('SEXTO UNO')).toBe(6);
      expect(getGradeFromGroup('NOVENO DOS')).toBe(9);
      expect(getGradeFromGroup('PRIMERO A')).toBe(1);
      expect(getGradeFromGroup('UNDECIMO')).toBe(11);
    });

    it('returns 0 for unrecognized groups', () => {
      expect(getGradeFromGroup('KINDER')).toBe(0);
      expect(getGradeFromGroup('TRANSICION')).toBe(0);
    });
  });
});
