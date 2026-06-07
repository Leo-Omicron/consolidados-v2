import { describe, it, expect } from 'vitest';
import { generateSubjectAnalyticsReport } from './subjectAnalytics';
import { baseConfig, getStudent } from '../test-fixtures';

describe('subjectAnalytics', () => {
  describe('generateSubjectAnalyticsReport', () => {
    it('handles empty group', () => {
      expect(generateSubjectAnalyticsReport([], '10A', baseConfig).subjects).toEqual([]);
    });

    it('generates analytics for subjects and fallback areas', () => {
      const students = [
        getStudent('1', '10A', {
          MATH: { asignaturas: { 'Algebra': { promedioActual: 2.0 } } },
          SCI: { asignaturas: {}, areaStats: { promedioActual: 4.0 } }, // fallback >= 3.0
          ART: { asignaturas: {}, areaStats: { promedioActual: 2.0 } }, // fallback < 3.0
          ENG: { asignaturas: { 'English': { promedioActual: 2.0 } } }, // another failure to trigger tiebreaker
          PE: { asignaturas: { 'Sports': { promedioActual: null } } }, // not a number
          MUS: { asignaturas: {}, areaStats: { promedioActual: null } } // not a number fallback
        }),
        getStudent('2', '10A', {
          MATH: { asignaturas: { 'Algebra': { promedioActual: 4.0 } } },
          SCI: { asignaturas: {}, areaStats: { promedioActual: 3.5 } },
          ART: { asignaturas: {}, areaStats: { promedioActual: 1.0 } },
          ENG: { asignaturas: { 'English': { promedioActual: 1.0 } } }
        })
      ];
      const report = generateSubjectAnalyticsReport(students, '10A', baseConfig);
      expect(report.subjects).toHaveLength(4);
      expect(report.subjects.find(s => s.asignatura === 'Algebra')?.failuresCount).toBe(1);
      expect(report.subjects.find(s => s.asignatura === 'ART')?.failuresCount).toBe(2);
      const firstTwo = report.subjects.slice(0, 3).map(s => s.asignatura);
      expect(firstTwo).toContain('ART');
      expect(firstTwo).toContain('English');
    });
  });
});
