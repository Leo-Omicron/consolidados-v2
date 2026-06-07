import { describe, it, expect } from 'vitest';
import { generateOfficialRecordsReport } from './officialRecords';
import { baseConfig, getStudent } from '../test-fixtures';

describe('officialRecords', () => {
  describe('generateOfficialRecordsReport', () => {
    it('generates official records', () => {
      const students = [
        getStudent('1', '10A', { MATH: { areaStats: { promedioActual: 4.0 } }, SCI: {} }), // missing areaStats
        getStudent('2', '10A', { MATH: { areaStats: { promedioActual: 3.0 } } }) // missing SCI area completely
      ];
      const report = generateOfficialRecordsReport(students, '10A', baseConfig, 'P1', 'Director');
      expect(report.period).toBe('P1');
      expect(report.director).toBe('Director');
      expect(report.rows[0].decision).toBe('Aprobado');
      expect(report.rows[0].grades['MATH']).toBe(4.0);
      expect(report.rows[0].grades['SCI']).toBe(null);
      expect(report.rows[1].grades['SCI']).toBe(null);
    });

    it('generates without optional params', () => {
      const students = [
        getStudent('1', '10A', {})
      ];
      const report = generateOfficialRecordsReport(students, '10A', baseConfig);
      expect(report.period).toBe('N/A');
    });

    it('sorts rows by ranking then name', () => {
      const students = [
        getStudent('A', '10A', {}, { 'DEF': 4.0 }), // rank 1
        getStudent('Z', '10A', {}, { 'DEF': 4.0 }), // rank 1
        getStudent('B', '10A', {}, { 'DEF': 3.0 }), // rank 3
      ];
      const report = generateOfficialRecordsReport(students, '10A', baseConfig);
      expect(report.rows.map(r => r.studentName)).toEqual(['Student A', 'Student Z', 'Student B']);
    });
  });
});
