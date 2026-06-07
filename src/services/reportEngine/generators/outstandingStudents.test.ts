import { describe, it, expect } from 'vitest';
import { generateOutstandingStudentsReport } from './outstandingStudents';
import { baseConfig, getStudent } from '../test-fixtures';

describe('outstandingStudents', () => {
  describe('generateOutstandingStudentsReport', () => {
    it('handles empty group', () => {
      expect(generateOutstandingStudentsReport([], '10A', baseConfig).students).toEqual([]);
    });

    it('identifies top students', () => {
      const students = [
        getStudent('1', '10A', {}, { 'DEF': 4.0 }), // P: 0
        getStudent('2', '10A', {}, { 'DEF': 4.5 }), // P: 50
        getStudent('3', '10A', {}, { 'DEF': 5.0 }), // P: 100 -> outstanding
      ];
      const report = generateOutstandingStudentsReport(students, '10A', baseConfig);
      expect(report.students).toHaveLength(1);
      expect(report.students[0].id).toBe('3');
    });

    it('uses official ranking if present', () => {
      const students = [
        getStudent('1', '10A', {}, { 'DEF': 3.0 }, { 'DEF': 2 }), // rank 2
        getStudent('2', '10A', {}, { 'DEF': 4.0 }, { 'DEF': 4 }), // not top 3
        getStudent('3', '10A', {}, {}, { 'DEF': 1 }), // rank 1, empty promedios object
        getStudent('4', '10A', {}, null, { 'DEF': 3 }), // rank 3, null promedios
        getStudent('5', '10A', {}, null, { 'DEF': 2 }), // rank 2, tie with student 1, needs average tiebreak
        getStudent('6', '10A', { MATH: { areaStats: { promedioActual: 5.0 } } }, null, null), // outstanding by percentile
      ];
      const report = generateOutstandingStudentsReport(students, '10A', baseConfig);
      expect(report.students).toHaveLength(5);
      expect(report.students[0].id).toBe('6'); // avg 5.0
      expect(report.students[1].id).toBe('3'); // rank 1
      expect(report.students[2].id).toBe('1'); // rank 2, name "Student 1"
      expect(report.students[3].id).toBe('5'); // rank 2, name "Student 5"
      expect(report.students[4].id).toBe('4'); // rank 3
    });

    it('sorts correctly with tied official ranking', () => {
      const students = [
        getStudent('1', '10A', {}, { 'DEF': 4.0 }, { 'DEF': 1 }),
        getStudent('2', '10A', {}, { 'DEF': 5.0 }, { 'DEF': 1 }),
        getStudent('3', '10A', {}, { 'DEF': 4.0 }, { 'DEF': 1 }),
      ];
      const report = generateOutstandingStudentsReport(students, '10A', baseConfig);
      // Sort: rank(asc) -> average(desc) -> name
      expect(report.students.map(s => s.id)).toEqual(['2', '1', '3']);
    });
  });
});
