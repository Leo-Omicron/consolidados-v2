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
  generateTeacherFeedbackReport,
  generateOfficialRecordsReport,
} from './reportEngine';
import type { PeriodConfig, PeriodoNotas, Estudiante } from '../domain/types';

describe('reportEngine Math Helpers', () => {
  describe('calculateStandardDeviation', () => {
    it('calculates standard deviation rounded to 1 decimal place', () => {
      expect(calculateStandardDeviation([3.0, 4.0, 5.0], 4.0)).toBe(0.8);
      expect(calculateStandardDeviation([1.0, 2.0, 3.0, 4.0, 5.0], 3.0)).toBe(1.4);
    });

    it('returns 0 for empty array', () => {
      expect(calculateStandardDeviation([], 4.0)).toBe(0);
    });
  });

  describe('calculatePercentileRanks', () => {
    it('calculates percentiles for [3.0, 4.0, 5.0] matching 0, 50, 100', () => {
      const percentiles = calculatePercentileRanks([3.0, 4.0, 5.0]);
      expect(percentiles).toEqual([0, 50, 100]);
    });

    it('handles a single student by returning 100', () => {
      expect(calculatePercentileRanks([4.5])).toEqual([100]);
    });

    it('returns empty array for empty input', () => {
      expect(calculatePercentileRanks([])).toEqual([]);
    });

    it('handles duplicate values correctly', () => {
      expect(calculatePercentileRanks([3.0, 3.0, 4.0])).toEqual([0, 0, 100]);
    });
  });

  describe('calculateRequiredGrade', () => {
    const config3Periods: PeriodConfig = { P1: 33.3, P2: 33.3, P3: 33.4 };

    it('calculates required grade and isImpossible correctly', () => {
      const notas: PeriodoNotas = { P1: 1.0, P2: 1.0, P3: null };
      const result = calculateRequiredGrade(notas, config3Periods);
      expect(result.required).toBe(6.84);
      expect(result.isImpossible).toBe(true);
    });

    it('returns 0 and isImpossible false if already passing', () => {
      const result = calculateRequiredGrade({ P1: 5.0, P2: 5.0, P3: null }, config3Periods);
      expect(result.required).toBe(0);
      expect(result.isImpossible).toBe(false);
    });
  });

  describe('calculateCompetitionRanking', () => {
    it('returns empty for empty input', () => {
      expect(calculateCompetitionRanking([])).toEqual([]);
    });

    it('calculates competition ranking for unsorted values, skipping tied ranks', () => {
      expect(calculateCompetitionRanking([4.5, 4.8, 4.2, 4.5])).toEqual([2, 1, 4, 2]);
    });
  });
});

describe('reportEngine 8-Category Reports Generators', () => {
  const config3Periods: PeriodConfig = { P1: 33.3, P2: 33.3, P3: 33.4 };

  const mockStudents: Estudiante[] = [
    {
      id: '1',
      name: 'JUAN',
      CURSO: 'Sexto',
      grupo: '6A',
      areas: {
        'MATEMATICAS': {
          DEF: { P1: 4.6, P2: 4.6, P3: null },
          areaStats: { promedioActual: 4.6, p4Min: 0, estado: { text: 'Ganado', color: 'green' } },
          asignaturas: {
            'ALGEBRA': { P1: 4.6, P2: 4.6, P3: null, promedioActual: 4.6, p4Min: 0, estado: { text: 'Ganado', color: 'green' } }
          }
        },
        'HUMANIDADES': {
          DEF: { P1: 4.6, P2: 4.6, P3: null },
          areaStats: { promedioActual: 4.6, p4Min: 0, estado: { text: 'Ganado', color: 'green' } },
          asignaturas: {
            'ESPAÑOL': { P1: 4.6, P2: 4.6, P3: null, promedioActual: 4.6, p4Min: 0, estado: { text: 'Ganado', color: 'green' } }
          }
        }
      }
    },
    {
      id: '2',
      name: 'MARIA',
      CURSO: 'Sexto',
      grupo: '6A',
      areas: {
        'MATEMATICAS': {
          DEF: { P1: 3.5, P2: 3.5, P3: null },
          areaStats: { promedioActual: 3.5, p4Min: 0, estado: { text: 'Ganable', color: 'cyan' } },
          asignaturas: {
            'ALGEBRA': { P1: 3.5, P2: 3.5, P3: null, promedioActual: 3.5, p4Min: 0, estado: { text: 'Ganable', color: 'cyan' } }
          }
        },
        'HUMANIDADES': {
          DEF: { P1: 3.0, P2: 3.0, P3: null },
          areaStats: { promedioActual: 3.0, p4Min: 0, estado: { text: 'Ganable', color: 'cyan' } },
          asignaturas: {
            'ESPAÑOL': { P1: 3.0, P2: 3.0, P3: null, promedioActual: 3.0, p4Min: 0, estado: { text: 'Ganable', color: 'cyan' } }
          }
        }
      }
    },
    {
      id: '3',
      name: 'PEDRO',
      CURSO: 'Sexto',
      grupo: '6A',
      areas: {
        'MATEMATICAS': {
          DEF: { P1: 2.0, P2: 2.0, P3: null },
          areaStats: { promedioActual: 2.0, p4Min: 4.99, estado: { text: 'En riesgo', color: 'yellow' } },
          asignaturas: {
            'ALGEBRA': { P1: 2.0, P2: 2.0, P3: null, promedioActual: 2.0, p4Min: 4.99, estado: { text: 'En riesgo', color: 'yellow' } }
          }
        },
        'HUMANIDADES': {
          DEF: { P1: 1.0, P2: 1.0, P3: null },
          areaStats: { promedioActual: 1.0, p4Min: 6.84, estado: { text: 'Perdido', color: 'red' } },
          asignaturas: {
            'ESPAÑOL': { P1: 1.0, P2: 1.0, P3: null, promedioActual: 1.0, p4Min: 6.84, estado: { text: 'Perdido', color: 'red' } }
          }
        }
      }
    },
    {
      id: '4',
      name: 'LUCIA',
      CURSO: 'Sexto',
      grupo: '6B',
      areas: {
        'MATEMATICAS': {
          DEF: { P1: 4.8, P2: 4.8, P3: null },
          areaStats: { promedioActual: 4.8, p4Min: 0, estado: { text: 'Ganado', color: 'green' } },
          asignaturas: {
            'ALGEBRA': { P1: 4.8, P2: 4.8, P3: null, promedioActual: 4.8, p4Min: 0, estado: { text: 'Ganado', color: 'green' } }
          }
        }
      }
    }
  ];

  describe('generateGroupPerformanceReport', () => {
    it('generates performance metrics for a specific group', () => {
      const report = generateGroupPerformanceReport(mockStudents, '6A', config3Periods);
      expect(report.grupo).toBe('6A');
      expect(report.totalStudents).toBe(3);
      // Student averages in 6A: JUAN (4.6), MARIA (3.25), PEDRO (1.5). Mean is (4.6 + 3.25 + 1.5) / 3 = 9.35 / 3 = 3.12
      // Let's verify standard deviation for [4.6, 3.25, 1.5], mean 3.12:
      // variance = ((4.6-3.12)^2 + (3.25-3.12)^2 + (1.5-3.12)^2) / 3 = (2.1904 + 0.0169 + 2.6244) / 3 = 4.8317 / 3 = 1.6105...
      // stdDev = sqrt(1.6105) = 1.269 -> rounds to 1.3
      expect(report.average).toBeCloseTo(3.12, 1);
      expect(report.standardDeviation).toBe(1.3);
      
      // Promotion decision:
      // JUAN: 0 failed areas, average 4.6 -> Aprobado
      // MARIA: 0 failed areas, average 3.25 -> Aprobado (wait, areas are MATEMATICAS 3.5 and HUMANIDADES 3.0, so both are >= 3.0)
      // PEDRO: 2 failed areas (<3.0), average 1.5 -> Reprobado
      // Non-Reprobado: 2 out of 3 -> promotionRate: (2/3)*100 = 66.7%
      expect(report.promotionRate).toBe(66.7);

      // Critical areas: sorted by failures descending, then alphabetically.
      // MATEMATICAS: 1 failure (PEDRO)
      // HUMANIDADES: 1 failure (PEDRO)
      expect(report.criticalAreas).toEqual([
        { area: 'HUMANIDADES', failuresCount: 1 },
        { area: 'MATEMATICAS', failuresCount: 1 }
      ]);
    });
  });

  describe('generateOutstandingStudentsReport', () => {
    it('returns students with percentiles >= 90 in the group', () => {
      const report = generateOutstandingStudentsReport(mockStudents, '6A', config3Periods);
      expect(report.grupo).toBe('6A');
      expect(report.students).toHaveLength(1);
      expect(report.students[0].name).toBe('JUAN');
      expect(report.students[0].average).toBe(4.6);
      expect(report.students[0].percentile).toBe(100);
    });
  });

  describe('generateAcademicRiskReport', () => {
    it('identifies students with failed areas or mathematical impossibilities', () => {
      const report = generateAcademicRiskReport(mockStudents, '6A', config3Periods);
      expect(report.grupo).toBe('6A');
      // Only PEDRO has failed areas (MATEMATICAS and HUMANIDADES both are < 3.0)
      // PEDRO also has math impossibility in HUMANIDADES (p1: 1.0, p2: 1.0 -> required 6.84 > 5.0)
      expect(report.criticalStudents).toHaveLength(1);
      expect(report.criticalStudents[0].name).toBe('PEDRO');
      expect(report.criticalStudents[0].failedAreasCount).toBe(2);
      expect(report.criticalStudents[0].failedAreas).toContain('MATEMATICAS');
      expect(report.criticalStudents[0].failedAreas).toContain('HUMANIDADES');
      expect(report.criticalStudents[0].impossibilityMathAreas).toContain('HUMANIDADES');
    });
  });

  describe('generateSubjectAnalyticsReport', () => {
    it('aggregates metrics per individual subject', () => {
      const report = generateSubjectAnalyticsReport(mockStudents, '6A', config3Periods);
      expect(report.grupo).toBe('6A');
      expect(report.subjects).toHaveLength(2); // ALGEBRA, ESPAÑOL
      
      const algebra = report.subjects.find(s => s.asignatura === 'ALGEBRA');
      expect(algebra).toBeDefined();
      // Algebra grades: JUAN(4.6), MARIA(3.5), PEDRO(2.0). Mean = (4.6+3.5+2.0)/3 = 3.37. Failures: 1 (PEDRO). Failures rate: (1/3)*100 = 33.3%
      expect(algebra?.average).toBeCloseTo(3.37, 2);
      expect(algebra?.failuresCount).toBe(1);
      expect(algebra?.failuresRate).toBe(33.3);
    });
  });

  describe('generateGroupComparisonReport', () => {
    it('compares metrics across all groups', () => {
      const report = generateGroupComparisonReport(mockStudents, config3Periods);
      expect(report.groups).toHaveLength(2); // 6A, 6B
      
      const group6A = report.groups.find(g => g.grupo === '6A');
      expect(group6A?.totalStudents).toBe(3);
      expect(group6A?.reprobadosCount).toBe(1); // PEDRO
      
      const group6B = report.groups.find(g => g.grupo === '6B');
      expect(group6B?.totalStudents).toBe(1);
      expect(group6B?.reprobadosCount).toBe(0);
    });
  });

  describe('generateHeatmapReport', () => {
    it('creates areas grid for student visualization', () => {
      const report = generateHeatmapReport(mockStudents, '6A');
      expect(report.grupo).toBe('6A');
      expect(report.areasList).toEqual(['HUMANIDADES', 'MATEMATICAS']);
      expect(report.rows).toHaveLength(3); // JUAN, MARIA, PEDRO
      
      const juanRow = report.rows.find(r => r.studentName === 'JUAN');
      expect(juanRow?.grades['MATEMATICAS'].grade).toBe(4.6);
      expect(juanRow?.grades['MATEMATICAS'].color).toBe('green');
    });
  });

  describe('generateTeacherFeedbackReport', () => {
    it('provides personalized feedback based on performance', () => {
      const report = generateTeacherFeedbackReport(mockStudents[0], config3Periods); // JUAN (average 4.6)
      expect(report.studentName).toBe('JUAN');
      expect(report.overallStatus).toBe('Aprobado');
      expect(report.strengths).toContain('MATEMATICAS');
      expect(report.strengths).toContain('HUMANIDADES');
      expect(report.weaknesses).toHaveLength(0);
      expect(report.adviceText).toBe('Continúa con ese gran nivel y apoya a tus compañeros.');
    });
  });

  describe('generateOfficialRecordsReport', () => {
    it('builds official report with rankings and promotion decisions', () => {
      const report = generateOfficialRecordsReport(mockStudents, '6A', config3Periods, 'Tercero', 'Rector Pepe');
      expect(report.grupo).toBe('6A');
      expect(report.period).toBe('Tercero');
      expect(report.director).toBe('Rector Pepe');
      expect(report.rows).toHaveLength(3);
      
      // Sorted by ranking ascending: JUAN (1st), MARIA (2nd), PEDRO (3rd)
      expect(report.rows[0].studentName).toBe('JUAN');
      expect(report.rows[0].ranking).toBe(1);
      expect(report.rows[0].decision).toBe('Aprobado');

      expect(report.rows[2].studentName).toBe('PEDRO');
      expect(report.rows[2].ranking).toBe(3);
      expect(report.rows[2].decision).toBe('Reprobado');
    });
  });
});
