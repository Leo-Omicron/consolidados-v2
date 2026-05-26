import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as XLSX from 'xlsx';
import {
  calculateColWidths,
  mapPerformanceToAOA,
  mapOutstandingToAOA,
  mapRiskToAOA,
  mapSubjectToAOA,
  mapComparisonToAOA,
  mapHeatmapToAOA,
  mapFeedbackToAOA,
  mapOfficialToAOA,
  exportConsolidadoCompleto
} from './excelExport';
import type {
  GroupPerformanceReport,
  OutstandingStudentsReport,
  AcademicRiskReport,
  SubjectAnalyticsReport,
  GroupComparisonReport,
  HeatmapReport,
  TeacherFeedbackReport,
  OfficialRecordsReport
} from '../domain/types';

// Mock XLSX to assert on workbook creation without hitting browser/file system APIs
vi.mock('xlsx', async (importOriginal) => {
  const actual = await importOriginal<typeof import('xlsx')>();
  return {
    ...actual,
    utils: {
      ...actual.utils,
      book_new: vi.fn(() => ({ SheetNames: [], Sheets: {} })),
      book_append_sheet: vi.fn((wb, ws, name) => {
        wb.SheetNames.push(name);
        wb.Sheets[name] = ws;
      }),
      aoa_to_sheet: vi.fn((aoa) => ({ '!ref': 'A1', aoa })),
    },
    write: vi.fn(() => new Uint8Array()),
  };
});

describe('excelExport service Unit 1 - Mapping and Calculations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateColWidths', () => {
    it('should calculate correct wch column widths with default padding of 3 and minWidth of 10', () => {
      // 25 characters column
      const aoa = [
        ["Short", "1234567890123456789012345"],
        ["Another col", "Short"]
      ];
      const widths = calculateColWidths(aoa);
      expect(widths).toHaveLength(2);
      expect(widths[0].wch).toBe(11 + 3); // "Another col" is 11 chars, Math.max(11, 10) + 3 = 14
      expect(widths[1].wch).toBe(25 + 3); // 25 chars, Math.max(25, 10) + 3 = 28
    });

    it('should handle null, undefined, numbers and objects gracefully', () => {
      const aoa = [
        [null, undefined],
        [123.45, { some: 'obj' }]
      ];
      const widths = calculateColWidths(aoa);
      expect(widths).toHaveLength(2);
      expect(widths[0].wch).toBe(10 + 3); // null is "", 123.45 is 6 chars -> minWidth 10 + 3 = 13
    });
  });

  describe('mapPerformanceToAOA', () => {
    it('should correctly map GroupPerformanceReport to AOA', () => {
      const report: GroupPerformanceReport = {
        grupo: '10A',
        totalStudents: 32,
        average: 3.82,
        standardDeviation: 0.54,
        promotionRate: 93.8,
        criticalAreas: [
          { area: 'Matemáticas', failuresCount: 5 },
          { area: 'Física', failuresCount: 3 }
        ]
      };

      const aoa = mapPerformanceToAOA(report);
      expect(aoa[0]).toEqual(["REPORTE DE RENDIMIENTO DEL GRUPO", "10A"]);
      expect(aoa[1]).toEqual([]);
      expect(aoa[2]).toEqual(["MÉTRICA", "VALOR"]);
      expect(aoa[3]).toEqual(["TOTAL ESTUDIANTES", 32]);
      expect(aoa[4]).toEqual(["PROMEDIO GENERAL", 3.82]);
      expect(aoa[5]).toEqual(["DESVIACIÓN ESTÁNDAR", 0.54]);
      expect(aoa[6]).toEqual(["TASA DE PROMOCIÓN (%)", 93.8]);
      expect(aoa[7]).toEqual([]);
      expect(aoa[8]).toEqual(["ÁREAS CRÍTICAS", "CANTIDAD DE PERDIDOS"]);
      expect(aoa[9]).toEqual(["MATEMÁTICAS", 5]);
      expect(aoa[10]).toEqual(["FÍSICA", 3]);
    });
  });

  describe('mapOutstandingToAOA', () => {
    it('should correctly map OutstandingStudentsReport to AOA', () => {
      const report: OutstandingStudentsReport = {
        grupo: '10A',
        students: [
          { id: '101', name: 'Ana Gomez', average: 4.85, percentile: 98 },
          { id: '102', name: 'Carlos Ruiz', average: 4.72, percentile: 95 }
        ]
      };

      const aoa = mapOutstandingToAOA(report);
      expect(aoa[0]).toEqual(["ESTUDIANTES DESTACADOS - GRUPO", "10A"]);
      expect(aoa[1]).toEqual([]);
      expect(aoa[2]).toEqual(["ID", "NOMBRE", "PROMEDIO", "PERCENTIL"]);
      expect(aoa[3]).toEqual(["101", "ANA GOMEZ", 4.85, 98]);
      expect(aoa[4]).toEqual(["102", "CARLOS RUIZ", 4.72, 95]);
    });
  });

  describe('mapRiskToAOA', () => {
    it('should correctly map AcademicRiskReport to AOA', () => {
      const report: AcademicRiskReport = {
        grupo: '10A',
        criticalStudents: [
          {
            id: '201',
            name: 'Pedro Perez',
            average: 2.84,
            failedAreasCount: 2,
            failedAreas: ['Matemáticas', 'Física'],
            impossibilityMathAreas: ['Matemáticas']
          }
        ]
      };

      const aoa = mapRiskToAOA(report);
      expect(aoa[0]).toEqual(["ESTUDIANTES EN RIESGO ACADÉMICO - GRUPO", "10A"]);
      expect(aoa[1]).toEqual([]);
      expect(aoa[2]).toEqual(["ID", "NOMBRE", "PROMEDIO", "ÁREAS PERDIDAS", "ÁREAS REPROBADAS DETALLE", "ÁREAS MATEMÁTICAMENTE IMPOSIBLES"]);
      expect(aoa[3]).toEqual(["201", "PEDRO PEREZ", 2.84, 2, "MATEMÁTICAS, FÍSICA", "MATEMÁTICAS"]);
    });
  });

  describe('mapSubjectToAOA', () => {
    it('should correctly map SubjectAnalyticsReport to AOA', () => {
      const report: SubjectAnalyticsReport = {
        grupo: '10A',
        subjects: [
          { asignatura: 'Cálculo', average: 3.12, failuresCount: 6, failuresRate: 18.8 }
        ]
      };

      const aoa = mapSubjectToAOA(report);
      expect(aoa[0]).toEqual(["ANÁLISIS DE ASIGNATURAS - GRUPO", "10A"]);
      expect(aoa[1]).toEqual([]);
      expect(aoa[2]).toEqual(["ASIGNATURA", "PROMEDIO", "CANTIDAD DE PERDIDOS", "TASA DE REPROBACIÓN (%)"]);
      expect(aoa[3]).toEqual(["CÁLCULO", 3.12, 6, 18.8]);
    });
  });

  describe('mapComparisonToAOA', () => {
    it('should correctly map GroupComparisonReport to AOA', () => {
      const report: GroupComparisonReport = {
        groups: [
          { grupo: '10A', totalStudents: 32, average: 3.82, standardDeviation: 0.54, failuresCount: 8, reprobadosCount: 2 }
        ]
      };

      const aoa = mapComparisonToAOA(report);
      expect(aoa[0]).toEqual(["COMPARATIVA DE GRUPOS INSTITUCIONAL"]);
      expect(aoa[1]).toEqual([]);
      expect(aoa[2]).toEqual(["GRUPO", "ESTUDIANTES", "PROMEDIO", "DESVIACIÓN ESTÁNDAR", "ÁREAS PERDIDAS", "REPROBADOS"]);
      expect(aoa[3]).toEqual(["10A", 32, 3.82, 0.54, 8, 2]);
    });
  });

  describe('mapHeatmapToAOA', () => {
    it('should dynamically map areas list to sequential columns with uppercase headers', () => {
      const report: HeatmapReport = {
        grupo: '10A',
        areasList: ['Ciencias Naturales', 'Educación Física', 'Matemáticas'],
        rows: [
          {
            studentId: '101',
            studentName: 'Ana Gomez',
            grades: {
              'Ciencias Naturales': { grade: 4.2, color: 'green' },
              'Matemáticas': { grade: 2.8, color: 'red' }
            },
            promActual: 3.5
          }
        ]
      };

      const aoa = mapHeatmapToAOA(report);
      expect(aoa[0]).toEqual(["MAPA DE CALOR - GRUPO", "10A"]);
      expect(aoa[1]).toEqual([]);
      expect(aoa[2]).toEqual(["ID", "ESTUDIANTE", "CIENCIAS NATURALES", "EDUCACIÓN FÍSICA", "MATEMÁTICAS", "PROMEDIO ACTUAL"]);
      expect(aoa[3]).toEqual(["101", "ANA GOMEZ", 4.2, null, 2.8, 3.5]);
    });
  });

  describe('mapFeedbackToAOA', () => {
    it('should correctly map TeacherFeedbackReport list to AOA', () => {
      const reports: TeacherFeedbackReport[] = [
        {
          studentId: '101',
          studentName: 'Ana Gomez',
          grupo: '10A',
          overallStatus: 'Aprobado',
          strengths: ['Ciencias', 'Español'],
          weaknesses: [],
          adviceText: 'Excelente desempeño.'
        }
      ];

      const aoa = mapFeedbackToAOA(reports);
      expect(aoa[0]).toEqual(["RETROALIMENTACIÓN DE DOCENTES - GRUPO", "10A"]);
      expect(aoa[1]).toEqual([]);
      expect(aoa[2]).toEqual(["ID", "ESTUDIANTE", "ESTADO GENERAL", "FORTALEZAS", "DEBILIDADES", "RECOMENDACIÓN"]);
      expect(aoa[3]).toEqual(["101", "ANA GOMEZ", "APROBADO", "CIENCIAS, ESPAÑOL", "", "Excelente desempeño."]);
    });
  });

  describe('mapOfficialToAOA', () => {
    it('should correctly map OfficialRecordsReport to AOA', () => {
      const report: OfficialRecordsReport = {
        grupo: '10A',
        period: 'Periodo 3',
        director: 'Prof. Gomez',
        rows: [
          {
            studentId: '101',
            studentName: 'Ana Gomez',
            grades: {
              'Ciencias': 4.5,
              'Matemáticas': 3.8
            },
            promActual: 4.15,
            ranking: 1,
            failedAreasCount: 0,
            decision: 'Aprobado'
          }
        ]
      };

      const aoa = mapOfficialToAOA(report);
      expect(aoa[0]).toEqual(["LIBRO OFICIAL DE CALIFICACIONES"]);
      expect(aoa[1]).toEqual(["GRUPO:", "10A", "PERIODO:", "Periodo 3", "DIRECTOR DE GRUPO:", "Prof. Gomez"]);
      expect(aoa[2]).toEqual([]);
      expect(aoa[3]).toEqual(["PUESTO", "ID", "ESTUDIANTE", "CIENCIAS", "MATEMÁTICAS", "PROMEDIO ACTUAL", "ÁREAS PERDIDAS", "DECISIÓN"]);
      expect(aoa[4]).toEqual([1, "101", "ANA GOMEZ", 4.5, 3.8, 4.15, 0, "APROBADO"]);
    });
  });

  describe('exportConsolidadoCompleto', () => {
    it('should compile exactly 7 sheets with appropriate names', async () => {
      const mockParams = {
        groupPerformance: {
          grupo: '10A',
          totalStudents: 1,
          average: 4.0,
          standardDeviation: 0,
          promotionRate: 100,
          criticalAreas: []
        },
        outstandingStudents: {
          grupo: '10A',
          students: []
        },
        academicRisk: {
          grupo: '10A',
          criticalStudents: []
        },
        subjectAnalytics: {
          grupo: '10A',
          subjects: []
        },
        heatmap: {
          grupo: '10A',
          areasList: [],
          rows: []
        },
        teacherFeedback: [],
        officialRecords: {
          grupo: '10A',
          period: 'P3',
          director: 'Prof. Gomez',
          rows: []
        },
        grupo: '10A'
      };

      // Call function under test
      await exportConsolidadoCompleto(mockParams);

      // Verify book_new was called
      expect(XLSX.utils.book_new).toHaveBeenCalled();

      // Verify book_append_sheet was called exactly 7 times
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(7);

      // Verify sheet names are correct
      const appendCalls = vi.mocked(XLSX.utils.book_append_sheet).mock.calls;
      const sheetNames = appendCalls.map(call => call[2]);
      expect(sheetNames).toEqual([
        'Rendimiento',
        'Destacados',
        'Riesgo',
        'Asignaturas',
        'Mapa de Calor',
        'Retroalimentación',
        'Libro Oficial'
      ]);
    });
  });
});
