import { describe, it, expect, vi, beforeEach } from 'vitest';
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
  triggerDownload,
  exportGroupPerformance,
  exportOutstandingStudents,
  exportAcademicRisk,
  exportSubjectAnalytics,
  exportGroupComparison,
  exportHeatmap,
  exportTeacherFeedback,
  exportOfficialRecords,
  exportConsolidadoCompleto,
  ExcelExportServiceImpl
} from './excelExport';
import type { WorkBook } from 'xlsx';

vi.mock('xlsx', () => {
  return {
    utils: {
      aoa_to_sheet: vi.fn().mockReturnValue({}),
      book_new: vi.fn().mockReturnValue({}),
      book_append_sheet: vi.fn(),
    },
    write: vi.fn().mockReturnValue(new Uint8Array()),
  };
});

describe('excelExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateColWidths', () => {
    it('returns empty array for empty aoa', () => {
      expect(calculateColWidths([])).toEqual([]);
    });

    it('calculates column widths based on maximum length in each column', () => {
      const aoa = [
        ['Short', 'Very long string indeed'],
        ['A', { object: true }], // String({object: true}) -> [object Object] or JSON string
        [null, undefined]
      ];
      const widths = calculateColWidths(aoa);
      // Col 0: "Short" (5) vs "A" (1). minWidth=10, padding=3 -> 13
      expect(widths[0]).toEqual({ wch: 13 });
      // Col 1: "Very long string indeed" (23). 23 + 3 = 26.
      expect(widths[1]).toEqual({ wch: 26 });
    });
  });

  describe('Mapping functions', () => {
    it('mapPerformanceToAOA maps correctly', () => {
      const aoa = mapPerformanceToAOA({
        grupo: '10A',
        totalStudents: 30,
        average: 4.2,
        standardDeviation: 0.5,
        promotionRate: 90,
        criticalAreas: [{ area: 'Matemáticas', failuresCount: 5 }]
      });
      expect(aoa.length).toBeGreaterThan(0);
      expect(aoa[0]).toContain('10A');
      expect(aoa[aoa.length - 1]).toContain('MATEMÁTICAS');
    });

    it('mapOutstandingToAOA maps correctly', () => {
      const aoa = mapOutstandingToAOA({
        grupo: '10A',
        students: [{ id: '1', name: 'Ana', average: 4.8, percentile: 99 }]
      });
      expect(aoa[3]).toEqual(['1', 'ANA', 4.8, 99]);
    });

    it('mapRiskToAOA maps correctly', () => {
      const aoa = mapRiskToAOA({
        grupo: '10A',
        criticalStudents: [{
          id: '1', name: 'Ana', average: 2.8,
          failedAreasCount: 2, failedAreas: ['Math', 'Science'], impossibilityMathAreas: ['Math']
        }]
      });
      expect(aoa[3]).toEqual(['1', 'ANA', 2.8, 2, 'MATH, SCIENCE', 'MATH']);
    });

    it('mapSubjectToAOA maps correctly', () => {
      const aoa = mapSubjectToAOA({
        grupo: '10A',
        subjects: [{ asignatura: 'Math', average: 3.5, failuresCount: 2, failuresRate: 10 }]
      });
      expect(aoa[3]).toEqual(['MATH', 3.5, 2, 10]);
    });

    it('mapComparisonToAOA maps correctly', () => {
      const aoa = mapComparisonToAOA({
        groups: [{ grupo: '10A', totalStudents: 30, average: 4.0, standardDeviation: 0.5, failuresCount: 5, reprobadosCount: 2 }]
      });
      expect(aoa[3]).toEqual(['10A', 30, 4.0, 0.5, 5, 2]);
    });

    it('mapHeatmapToAOA maps correctly', () => {
      const aoa = mapHeatmapToAOA({
        grupo: '10A',
        areasList: ['Math'],
        rows: [{ studentId: '1', studentName: 'Ana', grades: { 'Math': { grade: 4.0, color: 'green' } }, promActual: 4.0 }]
      });
      expect(aoa[2]).toContain('MATH');
      expect(aoa[3]).toEqual(['1', 'ANA', 4.0, 4.0]);
    });

    it('mapHeatmapToAOA handles missing grades', () => {
      const aoa = mapHeatmapToAOA({
        grupo: '10A',
        areasList: ['Math', 'Science'],
        rows: [{ studentId: '1', studentName: 'Ana', grades: { 'Math': { grade: 4.0, color: 'green' } }, promActual: 4.0 }]
      });
      expect(aoa[3]).toEqual(['1', 'ANA', 4.0, null, 4.0]);
    });

    it('mapFeedbackToAOA maps correctly', () => {
      const aoa = mapFeedbackToAOA([{
        grupo: '10A', studentId: '1', studentName: 'Ana', puestoGrupo: 1, promedioActual: 4.5, promedioGrupo: 3.8,
        overallStatus: 'Aprobado', strengths: ['Math'], weaknessesDetail: [{ areaName: 'Science', requiredGrade: 4.0, isImpossible: false }, { areaName: 'Art', requiredGrade: 0, isImpossible: true }], adviceText: 'Keep going'
      }]);
      expect(aoa[0]).toContain('10A');
      expect(aoa[3]).toEqual([1, '1', 'ANA', 4.5, 3.8, 'APROBADO', 'MATH', 'SCIENCE (REQ: 4.00), ART (IRRECUPERABLE)', 'Keep going']);
    });

    it('mapFeedbackToAOA handles empty list', () => {
      const aoa = mapFeedbackToAOA([]);
      expect(aoa[0]).toContain('N/A');
    });

    it('mapOfficialToAOA maps correctly', () => {
      const aoa = mapOfficialToAOA({
        grupo: '10A', period: 'P1', director: 'Profe',
        rows: [
          { ranking: 1, studentId: '1', studentName: 'Ana', grades: { 'Math': 4.0 }, promActual: 4.0, failedAreasCount: 0, decision: 'Aprobado' },
          { ranking: 2, studentId: '2', studentName: 'Bob', grades: { 'Science': 3.5 }, promActual: 3.5, failedAreasCount: 0, decision: 'Aprobado' }
        ]
      });
      // Areas should be Math, Science
      expect(aoa[3]).toContain('MATH');
      expect(aoa[3]).toContain('SCIENCE');
      // Ana has no Science -> null
      expect(aoa[4]).toEqual([1, '1', 'ANA', 4.0, null, 4.0, 0, 'APROBADO']);
      // Bob has no Math -> null
      expect(aoa[5]).toEqual([2, '2', 'BOB', null, 3.5, 3.5, 0, 'APROBADO']);
    });
  });

  describe('triggerDownload', () => {
    it('creates object URL and triggers download in browser', async () => {
      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock');
      const mockRevokeObjectURL = vi.fn();
      window.URL.createObjectURL = mockCreateObjectURL;
      window.URL.revokeObjectURL = mockRevokeObjectURL;

      const mockClick = vi.fn();
      const mockSetAttribute = vi.fn();
      const mockAppendChild = vi.fn();
      const mockRemoveChild = vi.fn();

      vi.spyOn(document, 'createElement').mockReturnValue({
        href: '',
        setAttribute: mockSetAttribute,
        click: mockClick,
      } as any);

      vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild as any);
      vi.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild as any);

      await triggerDownload({} as WorkBook, 'test.xlsx');

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockSetAttribute).toHaveBeenCalledWith('download', 'test.xlsx');
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });

    it('handles errors gracefully', async () => {
      window.URL.createObjectURL = () => { throw new Error('Mock error'); };
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await triggerDownload({} as WorkBook, 'test.xlsx');
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('does nothing if window is undefined', async () => {
      const originalWindow = window;
      // @ts-expect-error - we need to delete window for test
      delete (globalThis as any).window;
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await triggerDownload({} as WorkBook, 'test.xlsx');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
      // @ts-expect-error - restore window for test
      (globalThis as any).window = originalWindow;
    });
  });

  describe('Export triggers', () => {
    beforeEach(() => {
      window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock');
      window.URL.revokeObjectURL = vi.fn();
      vi.spyOn(document, 'createElement').mockReturnValue({ setAttribute: vi.fn(), click: vi.fn() } as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(vi.fn() as any);
      vi.spyOn(document.body, 'removeChild').mockImplementation(vi.fn() as any);
    });

    it('exports all simple reports', async () => {
      await exportGroupPerformance({ grupo: '10A', totalStudents: 0, average: 0, standardDeviation: 0, promotionRate: 0, criticalAreas: [] });
      await exportOutstandingStudents({ grupo: '10A', students: [] });
      await exportAcademicRisk({ grupo: '10A', criticalStudents: [] });
      await exportSubjectAnalytics({ grupo: '10A', subjects: [] });
      await exportGroupComparison({ groups: [] });
      await exportHeatmap({ grupo: '10A', areasList: [], rows: [] });
      await exportTeacherFeedback([]);
      await exportOfficialRecords({ grupo: '10A', period: '', director: '', rows: [] });
      expect(window.URL.createObjectURL).toHaveBeenCalledTimes(8);
    });

    it('exports consolidado completo', async () => {
      await exportConsolidadoCompleto({
        grupo: '10A',
        groupPerformance: { grupo: '10A', totalStudents: 0, average: 0, standardDeviation: 0, promotionRate: 0, criticalAreas: [] },
        outstandingStudents: { grupo: '10A', students: [] },
        academicRisk: { grupo: '10A', criticalStudents: [] },
        subjectAnalytics: { grupo: '10A', subjects: [] },
        heatmap: { grupo: '10A', areasList: [], rows: [] },
        teacherFeedback: [],
        officialRecords: { grupo: '10A', period: '', director: '', rows: [] }
      });
      expect(window.URL.createObjectURL).toHaveBeenCalledTimes(1);
    });
  });

  describe('ExcelExportServiceImpl', () => {
    it('is configured correctly', () => {
      expect(ExcelExportServiceImpl.exportGroupPerformance).toBe(exportGroupPerformance);
    });
  });
});
