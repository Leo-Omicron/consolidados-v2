import { describe, it, expect } from 'vitest';
import { generateGroupPerformanceReport } from './groupPerformance';
import { baseConfig, getStudent } from '../test-fixtures';

describe('groupPerformance', () => {
  describe('generateGroupPerformanceReport', () => {
    it('handles empty group', () => {
      expect(generateGroupPerformanceReport([], '10A', baseConfig).totalStudents).toBe(0);
    });

    it('generates performance report accurately', () => {
      const students = [
        getStudent('1', '10A', {
          MATH: { areaStats: { promedioActual: 4.0 } },
          SCI: { areaStats: { promedioActual: 2.5 } }
        }), // avg = 3.25
        getStudent('2', '10A', {
          MATH: { areaStats: { promedioActual: 2.0 } }, // failed
          SCI: { areaStats: { promedioActual: 2.0 } }, // failed
          ART: { areaStats: { promedioActual: 2.0 } }  // failed (reprobado because 3 failed)
        }), // avg = 2.0 -> reprobado
      ];
      const report = generateGroupPerformanceReport(students, '10A', baseConfig);
      expect(report.totalStudents).toBe(2);
      expect(report.average).toBe(2.63); // (3.25 + 2.0) / 2
      expect(report.promotionRate).toBe(50); // 1 out of 2 not reprobado
      expect(report.criticalAreas).toEqual([
        { area: 'SCI', failuresCount: 2 },
        { area: 'ART', failuresCount: 1 },
        { area: 'MATH', failuresCount: 1 }
      ]);
    });
    
    it('calculates average from official if provided', () => {
      const students = [
        getStudent('1', '10A', {}, { 'DEF': 4.5 }),
      ];
      const report = generateGroupPerformanceReport(students, '10A', baseConfig);
      expect(report.average).toBe(4.5);
    });
    
    it('student average is 0 if no areas', () => {
      const students = [getStudent('1', '10A', {})];
      const report = generateGroupPerformanceReport(students, '10A', baseConfig);
      expect(report.average).toBe(0);
    });
  });

  describe('getFailedAreasCount (via generateGroupPerformanceReport)', () => {
    it('classifies 2.9 as failed and 3.0 as passing', () => {
      const students = [
        getStudent('1', '10A', {
          MATH: { areaStats: { promedioActual: 3.0 } },  // exactly at threshold → NOT failed
          SCI: { areaStats: { promedioActual: 2.9 } },   // below threshold → failed
          ART: { areaStats: { promedioActual: 4.0 } },   // above threshold → NOT failed
        }),
      ];
      const report = generateGroupPerformanceReport(students, '10A', baseConfig);
      // SCI is the only failed area (criticalAreas only lists areas with failures)
      expect(report.criticalAreas).toEqual([
        { area: 'SCI', failuresCount: 1 },
      ]);
    });
  });
});
