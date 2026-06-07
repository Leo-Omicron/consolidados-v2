import { describe, it, expect } from 'vitest';
import { generateAcademicRiskReport } from './academicRisk';
import { baseConfig, getStudent } from '../test-fixtures';

describe('academicRisk', () => {
  describe('generateAcademicRiskReport', () => {
    it('includes critical students', () => {
      const students = [
        getStudent('1', '10A', {
          MATH: { areaStats: { promedioActual: 2.0 }, DEF: { P1: 0.0, P2: 0.0, P3: 0.0, P4: null, A: null } }, // impossible
        }),
        getStudent('2', '10A', {
          MATH: { areaStats: { promedioActual: 4.0 }, DEF: { P1: 4.0, P2: 4.0, P3: null, P4: null, A: null } },
        }),
        getStudent('3', '10A', {
          MATH: { areaStats: { promedioActual: 2.0 }, DEF: { P1: 0.0, P2: 0.0, P3: 0.0, P4: null, A: null } }, // impossible
          SCI: { areaStats: { promedioActual: 2.0 }, DEF: { P1: 0.0, P2: 0.0, P3: 0.0, P4: null, A: null } },
        }, { 'DEF': 2.0 }),
        getStudent('4', '10A', {
          MATH: { areaStats: { promedioActual: 2.0 }, DEF: { P1: 0.0, P2: 0.0, P3: 0.0, P4: null, A: null } }, // impossible
        }, { 'DEF': 1.0 }),
        getStudent('5', '10A', {
          MATH: { areaStats: { promedioActual: 2.0 }, DEF: { P1: 0.0, P2: 0.0, P3: 0.0, P4: null, A: null } }, // impossible
        }, { 'DEF': 2.0 }),
      ];
      const report = generateAcademicRiskReport(students, '10A', baseConfig);
      expect(report.criticalStudents).toHaveLength(4);
      expect(report.criticalStudents.map(s => s.id)).toEqual(['3', '4', '1', '5']);
    });
  });
});
