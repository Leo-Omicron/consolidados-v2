import { describe, it, expect } from 'vitest';
import { generateHeatmapReport } from './heatmap';
import { getStudent } from '../test-fixtures';

describe('heatmap', () => {
  describe('generateHeatmapReport', () => {
    it('generates heatmap rows', () => {
      const students = [
        getStudent('1', '10A', {
          MATH: { areaStats: { promedioActual: 4.0, estado: { color: 'green' } } }
        }),
        getStudent('2', '10A', {
          SCI: { areaStats: { promedioActual: 2.0, estado: { color: 'red' } } }
        })
      ];
      const report = generateHeatmapReport(students, '10A');
      expect(report.areasList).toEqual(['MATH', 'SCI']);
      const s1 = report.rows.find(r => r.studentId === '1');
      expect(s1?.grades['MATH']?.grade).toBe(4.0);
      expect(s1?.grades['SCI']?.grade).toBe(null); // missing area
    });
  });
});
