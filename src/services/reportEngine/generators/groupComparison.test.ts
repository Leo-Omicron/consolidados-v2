import { describe, it, expect } from 'vitest';
import { generateGroupComparisonReport } from './groupComparison';
import { baseConfig, getStudent } from '../test-fixtures';

describe('groupComparison', () => {
  describe('generateGroupComparisonReport', () => {
    it('compares multiple groups', () => {
      const students = [
        getStudent('1', '10A', { MATH: { areaStats: { promedioActual: 4.0 } } }),
        getStudent('2', '10B', { MATH: { areaStats: { promedioActual: 2.0 } } }),
        getStudent('3', '', { MATH: { areaStats: { promedioActual: 3.0 } } }), // empty group
      ];
      const report = generateGroupComparisonReport(students);
      expect(report.groups).toHaveLength(2);
      expect(report.groups.find(g => g.grupo === '10A')?.average).toBe(4.0);
      expect(report.groups.find(g => g.grupo === '10B')?.reprobadosCount).toBe(1);
    });
  });
});
