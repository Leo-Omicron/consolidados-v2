import { describe, it, expect } from 'vitest';
import {
  calculateStandardDeviation,
  calculatePercentileRanks,
  calculateRequiredGrade,
  calculateCompetitionRanking,
  generateGroupPerformanceReport,
  generateOutstandingStudentsReport,
  generateAcademicRiskReport,
  generateSubjectAnalyticsReport,
  generateGroupComparisonReport,
  generateHeatmapReport,
  generateTeacherFeedbackReportForGroup,
  generateOfficialRecordsReport
} from './reportEngine';
import type { Estudiante, PeriodConfig } from '../domain/types';

describe('reportEngine', () => {
  describe('calculateStandardDeviation', () => {
    it('returns 0 for empty array', () => {
      expect(calculateStandardDeviation([], 0)).toBe(0);
    });

    it('calculates standard deviation correctly', () => {
      // Data: 2, 4, 4, 4, 5, 5, 7, 9
      // Mean: 5
      // Variances: 9, 1, 1, 1, 0, 0, 4, 16 -> sum = 32
      // Pop var = 32/8 = 4 -> std dev = 2
      expect(calculateStandardDeviation([2, 4, 4, 4, 5, 5, 7, 9], 5)).toBe(2);
    });
  });

  describe('calculatePercentileRanks', () => {
    it('returns empty array for empty input', () => {
      expect(calculatePercentileRanks([])).toEqual([]);
    });

    it('returns 100 for single element', () => {
      expect(calculatePercentileRanks([5])).toEqual([100]);
    });

    it('calculates percentiles correctly', () => {
      // values: [15, 20, 35, 40, 50]
      // Ranks: 1, 2, 3, 4, 5
      // Percentiles: 0, 25, 50, 75, 100
      expect(calculatePercentileRanks([15, 20, 35, 40, 50])).toEqual([0, 25, 50, 75, 100]);
    });

    it('handles duplicate values correctly', () => {
      // values: [15, 15, 20, 40]
      // Rank of 15 is 1. P = 0
      // Rank of 20 is 3. P = (2/3)*100 = 67
      // Rank of 40 is 4. P = (3/3)*100 = 100
      const res = calculatePercentileRanks([40, 15, 20, 15]);
      expect(res[1]).toBe(0); // 15
      expect(res[3]).toBe(0); // 15
      expect(res[2]).toBe(67); // 20
      expect(res[0]).toBe(100); // 40
    });
  });

  describe('calculateRequiredGrade', () => {
    const config: PeriodConfig = { P1: 0.2, P2: 0.3, P3: 0.5, P4: 0 };

    it('returns 0 if already passing', () => {
      const customConfig: PeriodConfig = { P1: 0.4, P2: 0.4, P3: 0.2, P4: 0 };
      const notas = { P1: 5.0, P2: 5.0, P3: null, P4: null, A: null };
      expect(calculateRequiredGrade(notas, customConfig)).toEqual({ required: 0, isImpossible: false });
    });

    it('returns 0 if no remaining weight', () => {
      const notas = { P1: 2.0, P2: 2.0, P3: 2.0, P4: null, A: null };
      expect(calculateRequiredGrade(notas, config)).toEqual({ required: 0, isImpossible: false });
    });

    it('calculates required grade normally', () => {
      const notas = { P1: 3.0, P2: 2.0, P3: null, P4: null, A: null };
      // P1=3.0*0.2=0.6, P2=2.0*0.3=0.6. sumProd=1.2.
      // req = (2.95 - 1.2)/0.5 = 1.75/0.5 = 3.5
      expect(calculateRequiredGrade(notas, config)).toEqual({ required: 3.5, isImpossible: false });
    });

    it('marks as impossible if required > 5.0', () => {
      const notasWorse = { P1: 0.0, P2: 0.0, P3: null, P4: null, A: null };
      // req = 2.95/0.5 = 5.9
      expect(calculateRequiredGrade(notasWorse, config)).toEqual({ required: 5.9, isImpossible: true });
    });
  });

  describe('calculateCompetitionRanking', () => {
    it('returns empty array for empty input', () => {
      expect(calculateCompetitionRanking([])).toEqual([]);
    });

    it('calculates rankings correctly with ties', () => {
      // 5.0 (rank 1), 4.5 (rank 2), 4.5 (rank 2), 4.0 (rank 4)
      const res = calculateCompetitionRanking([4.5, 5.0, 4.0, 4.5]);
      expect(res[1]).toBe(1); // 5.0
      expect(res[0]).toBe(2); // 4.5
      expect(res[3]).toBe(2); // 4.5
      expect(res[2]).toBe(4); // 4.0
    });
  });

  const baseConfig: PeriodConfig = { P1: 0.25, P2: 0.25, P3: 0.25, P4: 0.25 };

  const getStudent = (id: string, group: string, areas: any, promedios?: any, rankings?: any): Estudiante => ({
    id, name: `Student ${id}`, CURSO: group, grupo: group, areas, promedios, rankings
  });

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
      // Failed areas for student 1: SCI
      // Failed areas for student 2: MATH, SCI, ART
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
      // Sort: failures(desc) -> avg(asc) -> name
      // S3: 2 fail, 2.0
      // S4: 1 fail, 1.0
      // S1: 1 fail, 2.0, "Student 1"
      // S5: 1 fail, 2.0, "Student 5"
      expect(report.criticalStudents.map(s => s.id)).toEqual(['3', '4', '1', '5']);
    });
  });

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

  describe('generateGroupComparisonReport', () => {
    it('compares multiple groups', () => {
      const students = [
        getStudent('1', '10A', { MATH: { areaStats: { promedioActual: 4.0 } } }),
        getStudent('2', '10B', { MATH: { areaStats: { promedioActual: 2.0 } } }),
        getStudent('3', '', { MATH: { areaStats: { promedioActual: 3.0 } } }), // empty group
      ];
      const report = generateGroupComparisonReport(students, baseConfig);
      expect(report.groups).toHaveLength(2);
      expect(report.groups.find(g => g.grupo === '10A')?.average).toBe(4.0);
      expect(report.groups.find(g => g.grupo === '10B')?.reprobadosCount).toBe(1);
    });
  });

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

  describe('generateTeacherFeedbackReportForGroup', () => {
    it('handles empty group', () => {
      expect(generateTeacherFeedbackReportForGroup([], '10A', baseConfig)).toEqual([]);
    });

    it('generates detailed feedback including rescue routes', () => {
      const students = [
        getStudent('1', '10A', {
          MATH: {
            areaStats: { promedioActual: 2.0, p4Min: 4.5, estado: { text: 'En riesgo' } },
            asignaturas: { 'Alg': {}, 'Geom': {} }
          },
          SCI: {
            areaStats: { promedioActual: 4.5 }
          }
        }), // Compromisos (1 failed)
        getStudent('2', '10A', {}, { 'DEF': 4.6 }) // Excelente
      ];
      const reports = generateTeacherFeedbackReportForGroup(students, '10A', baseConfig);
      expect(reports).toHaveLength(2);
      
      const s1 = reports.find(r => r.studentId === '1');
      expect(s1?.weaknessesDetail[0].rescueRoute).toHaveLength(2); // Alg, Geom
      expect(s1?.overallStatus).toBe('Compromisos');
      expect(s1?.adviceText).toContain('pendientes');
      
      const s2 = reports.find(r => r.studentId === '2');
      expect(s2?.adviceText).toContain('Continúa con ese gran nivel');
    });

    it('advice text conditions', () => {
      const students = [
        getStudent('1', '10A', {}, { 'DEF': 4.1 }),
        getStudent('2', '10A', {}, { 'DEF': 3.5 }), // Aprobado
        getStudent('3', '10A', {
           A: { areaStats: { promedioActual: 2.0, estado: { text: 'Perdido', color: 'red' } } },
           B: { areaStats: { promedioActual: 2.0, estado: { text: 'Perdido', color: 'red' } } },
           C: { areaStats: { promedioActual: 2.0, estado: { text: 'Perdido', color: 'red' } } }
        }, { 'DEF': 2.0 }), // Reprobado
        getStudent('4', '10A', {
          A: { areaStats: { promedioActual: 2.0, p4Min: 6.0, estado: { text: 'Perdido', color: 'red' } } } // impossible
        }, { 'DEF': 3.0 }), // Compromisos, but impossible area
        getStudent('5', '10A', {
          B: {} // missing areaStats
        }),
        getStudent('6', '10A', {
          C: { areaStats: { promedioActual: 3.5, p4Min: 3.0, estado: { text: 'Ganado', color: 'green' } } } // between 3.0 and 4.0
        }, null, { 'DEF': 2 }) // with official ranking
      ];
      const reports = generateTeacherFeedbackReportForGroup(students, '10A', baseConfig);
      expect(reports.find(r => r.studentId === '1')?.adviceText).toContain('Excelente rendimiento');
      expect(reports.find(r => r.studentId === '2')?.adviceText).toContain('Buen desempeño general');
      expect(reports.find(r => r.studentId === '3')?.adviceText).toContain('situación académica es crítica');
      expect(reports.find(r => r.studentId === '4')?.weaknessesDetail[0].isImpossible).toBe(true);
      expect(reports.find(r => r.studentId === '5')?.strengths).toEqual([]);
      expect(reports.find(r => r.studentId === '6')?.puestoGrupo).toBe(2);
    });
  });

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
