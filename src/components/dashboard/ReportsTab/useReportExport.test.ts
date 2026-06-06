import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReportExport } from './useReportExport';
import { ExcelExportServiceImpl } from '../../../services/excelExport';
import type { ReportCategory } from '../../../domain/types';

vi.mock('../../../services/excelExport', () => ({
  ExcelExportServiceImpl: {
    exportGroupPerformance: vi.fn().mockResolvedValue(undefined),
    exportOutstandingStudents: vi.fn().mockResolvedValue(undefined),
    exportAcademicRisk: vi.fn().mockResolvedValue(undefined),
    exportSubjectAnalytics: vi.fn().mockResolvedValue(undefined),
    exportGroupComparison: vi.fn().mockResolvedValue(undefined),
    exportHeatmap: vi.fn().mockResolvedValue(undefined),
    exportTeacherFeedback: vi.fn().mockResolvedValue(undefined),
    exportOfficialRecords: vi.fn().mockResolvedValue(undefined),
    exportConsolidadoCompleto: vi.fn().mockResolvedValue(undefined),
  },
}));

const mockGroupPerformance = { grupo: '10A', totalStudents: 30, average: 4.2, standardDeviation: 0.8, promotionRate: 85, criticalAreas: [] } as any;
const mockOutstanding = { grupo: '10A', students: [] } as any;
const mockAcademicRisk = { grupo: '10A', criticalStudents: [] } as any;
const mockSubjectAnalytics = { grupo: '10A', subjects: [] } as any;
const mockGroupComparison = { groups: [] } as any;
const mockHeatmap = { grupo: '10A', areasList: [], rows: [] } as any;
const mockTeacherFeedback = [] as any[];
const mockOfficialRecords = { grupo: '10A', rows: [], period: 'Periodo 1', director: 'Prof. Test' } as any;

const defaultInput = {
  activeTab: 'group-performance' as ReportCategory,
  groupPerformanceData: mockGroupPerformance,
  outstandingStudentsData: mockOutstanding,
  academicRiskData: mockAcademicRisk,
  subjectAnalyticsData: mockSubjectAnalytics,
  groupComparisonData: mockGroupComparison,
  heatmapData: mockHeatmap,
  teacherFeedbackData: mockTeacherFeedback,
  officialRecordsData: mockOfficialRecords,
  activeGroupToUse: '10A',
  hasStudentsInGroup: true,
};

describe('useReportExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  // --- API Surface ---

  it('returns exactly 3 members: handleExportExcel, handleExportConsolidadoCompleto, canExportConsolidadoCompleto', () => {
    const { result } = renderHook(() => useReportExport(defaultInput));
    const keys = Object.keys(result.current).sort();
    expect(keys).toEqual(['canExportConsolidadoCompleto', 'handleExportConsolidadoCompleto', 'handleExportExcel']);
  });

  // --- canExportConsolidadoCompleto ---

  it('canExportConsolidadoCompleto is false when activeTab is group-comparison', () => {
    const { result } = renderHook(() => useReportExport({ ...defaultInput, activeTab: 'group-comparison' }));
    expect(result.current.canExportConsolidadoCompleto).toBe(false);
  });

  it('canExportConsolidadoCompleto is false when activeGroupToUse is empty', () => {
    const { result } = renderHook(() => useReportExport({ ...defaultInput, activeGroupToUse: '' }));
    expect(result.current.canExportConsolidadoCompleto).toBe(false);
  });

  it('canExportConsolidadoCompleto is true with valid group and non-comparison tab', () => {
    const { result } = renderHook(() => useReportExport(defaultInput));
    expect(result.current.canExportConsolidadoCompleto).toBe(true);
  });

  it('canExportConsolidadoCompleto is false when hasStudentsInGroup is false', () => {
    const { result } = renderHook(() => useReportExport({ ...defaultInput, hasStudentsInGroup: false }));
    expect(result.current.canExportConsolidadoCompleto).toBe(false);
  });

  // --- handleExportExcel — tab dispatch ---

  it('handleExportExcel calls exportGroupPerformance when activeTab is group-performance', async () => {
    const { result } = renderHook(() => useReportExport({ ...defaultInput, activeTab: 'group-performance' }));
    await act(() => result.current.handleExportExcel());
    expect(ExcelExportServiceImpl.exportGroupPerformance).toHaveBeenCalledWith(mockGroupPerformance);
  });

  it('handleExportExcel calls exportOutstandingStudents when activeTab is outstanding', async () => {
    const { result } = renderHook(() => useReportExport({ ...defaultInput, activeTab: 'outstanding' }));
    await act(() => result.current.handleExportExcel());
    expect(ExcelExportServiceImpl.exportOutstandingStudents).toHaveBeenCalledWith(mockOutstanding);
  });

  it('handleExportExcel calls exportAcademicRisk when activeTab is academic-risk', async () => {
    const { result } = renderHook(() => useReportExport({ ...defaultInput, activeTab: 'academic-risk' }));
    await act(() => result.current.handleExportExcel());
    expect(ExcelExportServiceImpl.exportAcademicRisk).toHaveBeenCalledWith(mockAcademicRisk);
  });

  it('handleExportExcel calls exportSubjectAnalytics when activeTab is subject-analytics', async () => {
    const { result } = renderHook(() => useReportExport({ ...defaultInput, activeTab: 'subject-analytics' }));
    await act(() => result.current.handleExportExcel());
    expect(ExcelExportServiceImpl.exportSubjectAnalytics).toHaveBeenCalledWith(mockSubjectAnalytics);
  });

  it('handleExportExcel calls exportGroupComparison when activeTab is group-comparison', async () => {
    const { result } = renderHook(() => useReportExport({ ...defaultInput, activeTab: 'group-comparison' }));
    await act(() => result.current.handleExportExcel());
    expect(ExcelExportServiceImpl.exportGroupComparison).toHaveBeenCalledWith(mockGroupComparison);
  });

  it('handleExportExcel calls exportHeatmap when activeTab is heatmap', async () => {
    const { result } = renderHook(() => useReportExport({ ...defaultInput, activeTab: 'heatmap' }));
    await act(() => result.current.handleExportExcel());
    expect(ExcelExportServiceImpl.exportHeatmap).toHaveBeenCalledWith(mockHeatmap);
  });

  it('handleExportExcel calls exportTeacherFeedback when activeTab is feedback', async () => {
    const feedbackData = [{ grupo: '10A', studentId: '1', studentName: 'Test' }] as any[];
    const { result } = renderHook(() => useReportExport({ ...defaultInput, activeTab: 'feedback', teacherFeedbackData: feedbackData }));
    await act(() => result.current.handleExportExcel());
    expect(ExcelExportServiceImpl.exportTeacherFeedback).toHaveBeenCalledWith(feedbackData);
  });

  it('handleExportExcel calls exportOfficialRecords when activeTab is official', async () => {
    const { result } = renderHook(() => useReportExport({ ...defaultInput, activeTab: 'official' }));
    await act(() => result.current.handleExportExcel());
    expect(ExcelExportServiceImpl.exportOfficialRecords).toHaveBeenCalledWith(mockOfficialRecords);
  });

  // --- handleExportExcel — alert fallback when data is null ---

  it('handleExportExcel alerts when groupPerformanceData is null on group-performance tab', async () => {
    const { result } = renderHook(() => useReportExport({ ...defaultInput, activeTab: 'group-performance', groupPerformanceData: null }));
    await act(() => result.current.handleExportExcel());
    expect(window.alert).toHaveBeenCalledWith('No hay datos de Rendimiento Grupal disponibles para exportar.');
  });

  it('handleExportExcel alerts when outstandingStudentsData is null on outstanding tab', async () => {
    const { result } = renderHook(() => useReportExport({ ...defaultInput, activeTab: 'outstanding', outstandingStudentsData: null }));
    await act(() => result.current.handleExportExcel());
    expect(window.alert).toHaveBeenCalledWith('No hay datos de Estudiantes Destacados disponibles para exportar.');
  });

  it('handleExportExcel alerts when academicRiskData is null on academic-risk tab', async () => {
    const { result } = renderHook(() => useReportExport({ ...defaultInput, activeTab: 'academic-risk', academicRiskData: null }));
    await act(() => result.current.handleExportExcel());
    expect(window.alert).toHaveBeenCalledWith('No hay datos de Riesgo Académico disponibles para exportar.');
  });

  // --- handleExportConsolidadoCompleto ---

  it('handleExportConsolidadoCompleto returns early when activeTab is group-comparison', async () => {
    const { result } = renderHook(() => useReportExport({ ...defaultInput, activeTab: 'group-comparison' }));
    await act(() => result.current.handleExportConsolidadoCompleto());
    expect(ExcelExportServiceImpl.exportConsolidadoCompleto).not.toHaveBeenCalled();
  });

  it('handleExportConsolidadoCompleto alerts when activeGroupToUse is empty', async () => {
    const { result } = renderHook(() => useReportExport({ ...defaultInput, activeGroupToUse: '' }));
    await act(() => result.current.handleExportConsolidadoCompleto());
    expect(window.alert).toHaveBeenCalledWith('Por favor, seleccione un grupo válido.');
    expect(ExcelExportServiceImpl.exportConsolidadoCompleto).not.toHaveBeenCalled();
  });

  it('handleExportConsolidadoCompleto alerts when required data is missing', async () => {
    const { result } = renderHook(() => useReportExport({
      ...defaultInput,
      groupPerformanceData: null,
    }));
    await act(() => result.current.handleExportConsolidadoCompleto());
    expect(window.alert).toHaveBeenCalledWith('No hay datos suficientes para generar el Consolidado Completo.');
    expect(ExcelExportServiceImpl.exportConsolidadoCompleto).not.toHaveBeenCalled();
  });

  it('handleExportConsolidadoCompleto calls exportConsolidadoCompleto with correct payload when all conditions met', async () => {
    const { result } = renderHook(() => useReportExport(defaultInput));
    await act(() => result.current.handleExportConsolidadoCompleto());
    expect(ExcelExportServiceImpl.exportConsolidadoCompleto).toHaveBeenCalledTimes(1);
    expect(ExcelExportServiceImpl.exportConsolidadoCompleto).toHaveBeenCalledWith({
      groupPerformance: mockGroupPerformance,
      outstandingStudents: mockOutstanding,
      academicRisk: mockAcademicRisk,
      subjectAnalytics: mockSubjectAnalytics,
      heatmap: mockHeatmap,
      teacherFeedback: mockTeacherFeedback,
      officialRecords: mockOfficialRecords,
      grupo: '10A',
    });
  });
});
