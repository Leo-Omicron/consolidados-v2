import type { WorkBook } from 'xlsx';
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

/**
 * Main service interface to handle exporting reports.
 */
export interface ExcelExportService {
  exportGroupPerformance(report: GroupPerformanceReport): Promise<void>;
  exportOutstandingStudents(report: OutstandingStudentsReport): Promise<void>;
  exportAcademicRisk(report: AcademicRiskReport): Promise<void>;
  exportSubjectAnalytics(report: SubjectAnalyticsReport): Promise<void>;
  exportGroupComparison(report: GroupComparisonReport): Promise<void>;
  exportHeatmap(report: HeatmapReport): Promise<void>;
  exportTeacherFeedback(reports: TeacherFeedbackReport[]): Promise<void>;
  exportOfficialRecords(report: OfficialRecordsReport): Promise<void>;

  exportConsolidadoCompleto(params: {
    groupPerformance: GroupPerformanceReport;
    outstandingStudents: OutstandingStudentsReport;
    academicRisk: AcademicRiskReport;
    subjectAnalytics: SubjectAnalyticsReport;
    heatmap: HeatmapReport;
    teacherFeedback: TeacherFeedbackReport[];
    officialRecords: OfficialRecordsReport;
    grupo: string;
  }): Promise<void>;
}

/**
 * Helper to dynamically calculate column widths in characters.
 * Calculates character length of each cell, uses standard Math.max(char_len, minWidth) + padding.
 * Padding is strictly 3 characters, default minWidth is 10.
 */
export function calculateColWidths(aoa: unknown[][]): { wch: number }[] {
  if (aoa.length === 0) return [];
  const colCount = Math.max(...aoa.map(row => row.length));
  const widths: { wch: number }[] = [];

  for (let colIdx = 0; colIdx < colCount; colIdx++) {
    let maxLen = 0;
    for (let rowIdx = 0; rowIdx < aoa.length; rowIdx++) {
      const val = aoa[rowIdx][colIdx];
      let strVal = '';
      if (val !== null && val !== undefined) {
        if (typeof val === 'object') {
          strVal = JSON.stringify(val);
        } else {
          strVal = String(val);
        }
      }
      if (strVal.length > maxLen) {
        maxLen = strVal.length;
      }
    }
    const minWidth = 10;
    const padding = 3;
    widths.push({ wch: Math.max(maxLen, minWidth) + padding });
  }

  return widths;
}

/**
 * Pure mapping function converting GroupPerformanceReport to AOA.
 */
export function mapPerformanceToAOA(report: GroupPerformanceReport): unknown[][] {
  const aoa: unknown[][] = [
    ["REPORTE DE RENDIMIENTO DEL GRUPO", report.grupo],
    [],
    ["MÉTRICA", "VALOR"],
    ["TOTAL ESTUDIANTES", report.totalStudents],
    ["PROMEDIO GENERAL", report.average],
    ["DESVIACIÓN ESTÁNDAR", report.standardDeviation],
    ["TASA DE PROMOCIÓN (%)", report.promotionRate],
    [],
    ["ÁREAS CRÍTICAS", "CANTIDAD DE PERDIDOS"]
  ];

  report.criticalAreas.forEach(area => {
    aoa.push([area.area.toUpperCase(), area.failuresCount]);
  });

  return aoa;
}

/**
 * Pure mapping function converting OutstandingStudentsReport to AOA.
 */
export function mapOutstandingToAOA(report: OutstandingStudentsReport): unknown[][] {
  const aoa: unknown[][] = [
    ["ESTUDIANTES DESTACADOS - GRUPO", report.grupo],
    [],
    ["ID", "NOMBRE", "PROMEDIO", "PERCENTIL"]
  ];

  report.students.forEach(st => {
    aoa.push([st.id, st.name.toUpperCase(), st.average, st.percentile]);
  });

  return aoa;
}

/**
 * Pure mapping function converting AcademicRiskReport to AOA.
 */
export function mapRiskToAOA(report: AcademicRiskReport): unknown[][] {
  const aoa: unknown[][] = [
    ["ESTUDIANTES EN RIESGO ACADÉMICO - GRUPO", report.grupo],
    [],
    ["ID", "NOMBRE", "PROMEDIO", "ÁREAS PERDIDAS", "ÁREAS REPROBADAS DETALLE", "ÁREAS MATEMÁTICAMENTE IMPOSIBLES"]
  ];

  report.criticalStudents.forEach(st => {
    aoa.push([
      st.id,
      st.name.toUpperCase(),
      st.average,
      st.failedAreasCount,
      st.failedAreas.join(', ').toUpperCase(),
      st.impossibilityMathAreas.join(', ').toUpperCase()
    ]);
  });

  return aoa;
}

/**
 * Pure mapping function converting SubjectAnalyticsReport to AOA.
 */
export function mapSubjectToAOA(report: SubjectAnalyticsReport): unknown[][] {
  const aoa: unknown[][] = [
    ["ANÁLISIS DE ASIGNATURAS - GRUPO", report.grupo],
    [],
    ["ASIGNATURA", "PROMEDIO", "CANTIDAD DE PERDIDOS", "TASA DE REPROBACIÓN (%)"]
  ];

  report.subjects.forEach(sub => {
    aoa.push([
      sub.asignatura.toUpperCase(),
      sub.average,
      sub.failuresCount,
      sub.failuresRate
    ]);
  });

  return aoa;
}

/**
 * Pure mapping function converting GroupComparisonReport to AOA.
 */
export function mapComparisonToAOA(report: GroupComparisonReport): unknown[][] {
  const aoa: unknown[][] = [
    ["COMPARATIVA DE GRUPOS INSTITUCIONAL"],
    [],
    ["GRUPO", "ESTUDIANTES", "PROMEDIO", "DESVIACIÓN ESTÁNDAR", "ÁREAS PERDIDAS", "REPROBADOS"]
  ];

  report.groups.forEach(g => {
    aoa.push([
      g.grupo,
      g.totalStudents,
      g.average,
      g.standardDeviation,
      g.failuresCount,
      g.reprobadosCount
    ]);
  });

  return aoa;
}

/**
 * Pure mapping function converting HeatmapReport to AOA.
 */
export function mapHeatmapToAOA(report: HeatmapReport): unknown[][] {
  const uppercaseAreas = report.areasList.map(area => area.toUpperCase());
  const headers = ["ID", "ESTUDIANTE", ...uppercaseAreas, "PROMEDIO ACTUAL"];

  const aoa: unknown[][] = [
    ["MAPA DE CALOR - GRUPO", report.grupo],
    [],
    headers
  ];

  report.rows.forEach(row => {
    const rowData: unknown[] = [
      row.studentId,
      row.studentName.toUpperCase()
    ];
    report.areasList.forEach(areaName => {
      rowData.push(row.grades[areaName]?.grade ?? null);
    });
    rowData.push(row.promActual);
    aoa.push(rowData);
  });

  return aoa;
}

/**
 * Pure mapping function converting TeacherFeedbackReport[] to AOA.
 */
export function mapFeedbackToAOA(reports: TeacherFeedbackReport[]): unknown[][] {
  const grupo = reports[0]?.grupo ?? "N/A";
  const aoa: unknown[][] = [
    ["RETROALIMENTACIÓN DE DOCENTES - GRUPO", grupo],
    [],
    ["ID", "ESTUDIANTE", "ESTADO GENERAL", "FORTALEZAS", "DEBILIDADES", "RECOMENDACIÓN"]
  ];

  reports.forEach(rep => {
    aoa.push([
      rep.studentId,
      rep.studentName.toUpperCase(),
      rep.overallStatus.toUpperCase(),
      rep.strengths.join(', ').toUpperCase(),
      rep.weaknesses.join(', ').toUpperCase(),
      rep.adviceText
    ]);
  });

  return aoa;
}

/**
 * Pure mapping function converting OfficialRecordsReport to AOA.
 */
export function mapOfficialToAOA(report: OfficialRecordsReport): unknown[][] {
  const areasSet = new Set<string>();
  report.rows.forEach(row => {
    Object.keys(row.grades).forEach(area => areasSet.add(area));
  });
  const areasList = Array.from(areasSet).sort();

  const uppercaseAreas = areasList.map(area => area.toUpperCase());
  const headers = [
    "PUESTO",
    "ID",
    "ESTUDIANTE",
    ...uppercaseAreas,
    "PROMEDIO ACTUAL",
    "ÁREAS PERDIDAS",
    "DECISIÓN"
  ];

  const aoa: unknown[][] = [
    ["LIBRO OFICIAL DE CALIFICACIONES"],
    ["GRUPO:", report.grupo, "PERIODO:", report.period, "DIRECTOR DE GRUPO:", report.director],
    [],
    headers
  ];

  report.rows.forEach(row => {
    const rowData: unknown[] = [
      row.ranking,
      row.studentId,
      row.studentName.toUpperCase()
    ];
    areasList.forEach(areaName => {
      rowData.push(row.grades[areaName] ?? null);
    });
    rowData.push(row.promActual);
    rowData.push(row.failedAreasCount);
    rowData.push(row.decision.toUpperCase());
    aoa.push(rowData);
  });

  return aoa;
}

/**
 * Generates browser download of compiled SheetJS workbook.
 */
export async function triggerDownload(wb: WorkBook, fileName: string): Promise<void> {
  const XLSX = await import('xlsx');
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to trigger download in browser:', error);
    }
  }
}

// Single-sheet export triggers
export async function exportGroupPerformance(report: GroupPerformanceReport): Promise<void> {
  const XLSX = await import('xlsx');
  const aoa = mapPerformanceToAOA(report);
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = calculateColWidths(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rendimiento');
  await triggerDownload(wb, `${report.grupo}_Rendimiento.xlsx`);
}

export async function exportOutstandingStudents(report: OutstandingStudentsReport): Promise<void> {
  const XLSX = await import('xlsx');
  const aoa = mapOutstandingToAOA(report);
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = calculateColWidths(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Destacados');
  await triggerDownload(wb, `${report.grupo}_Destacados.xlsx`);
}

export async function exportAcademicRisk(report: AcademicRiskReport): Promise<void> {
  const XLSX = await import('xlsx');
  const aoa = mapRiskToAOA(report);
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = calculateColWidths(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Riesgo');
  await triggerDownload(wb, `${report.grupo}_Riesgo.xlsx`);
}

export async function exportSubjectAnalytics(report: SubjectAnalyticsReport): Promise<void> {
  const XLSX = await import('xlsx');
  const aoa = mapSubjectToAOA(report);
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = calculateColWidths(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Asignaturas');
  await triggerDownload(wb, `${report.grupo}_Asignaturas.xlsx`);
}

export async function exportGroupComparison(report: GroupComparisonReport): Promise<void> {
  const XLSX = await import('xlsx');
  const aoa = mapComparisonToAOA(report);
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = calculateColWidths(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Comparativa');
  await triggerDownload(wb, `Comparativa_Grupos.xlsx`);
}

export async function exportHeatmap(report: HeatmapReport): Promise<void> {
  const XLSX = await import('xlsx');
  const aoa = mapHeatmapToAOA(report);
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = calculateColWidths(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Mapa de Calor');
  await triggerDownload(wb, `${report.grupo}_Mapa_Calor.xlsx`);
}

export async function exportTeacherFeedback(reports: TeacherFeedbackReport[]): Promise<void> {
  const XLSX = await import('xlsx');
  const aoa = mapFeedbackToAOA(reports);
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = calculateColWidths(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Retroalimentación');
  const grupo = reports[0]?.grupo ?? 'Grupo';
  await triggerDownload(wb, `${grupo}_Retroalimentacion.xlsx`);
}

export async function exportOfficialRecords(report: OfficialRecordsReport): Promise<void> {
  const XLSX = await import('xlsx');
  const aoa = mapOfficialToAOA(report);
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = calculateColWidths(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Libro Oficial');
  await triggerDownload(wb, `${report.grupo}_Libro_Oficial.xlsx`);
}

/**
 * Compiles 7 group-specific sheets into a single workbook, excluding Group Comparison.
 */
export async function exportConsolidadoCompleto(params: {
  groupPerformance: GroupPerformanceReport;
  outstandingStudents: OutstandingStudentsReport;
  academicRisk: AcademicRiskReport;
  subjectAnalytics: SubjectAnalyticsReport;
  heatmap: HeatmapReport;
  teacherFeedback: TeacherFeedbackReport[];
  officialRecords: OfficialRecordsReport;
  grupo: string;
}): Promise<void> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  // 1. Rendimiento
  const perfAOA = mapPerformanceToAOA(params.groupPerformance);
  const perfSheet = XLSX.utils.aoa_to_sheet(perfAOA);
  perfSheet['!cols'] = calculateColWidths(perfAOA);
  XLSX.utils.book_append_sheet(wb, perfSheet, 'Rendimiento');

  // 2. Destacados
  const outAOA = mapOutstandingToAOA(params.outstandingStudents);
  const outSheet = XLSX.utils.aoa_to_sheet(outAOA);
  outSheet['!cols'] = calculateColWidths(outAOA);
  XLSX.utils.book_append_sheet(wb, outSheet, 'Destacados');

  // 3. Riesgo
  const riskAOA = mapRiskToAOA(params.academicRisk);
  const riskSheet = XLSX.utils.aoa_to_sheet(riskAOA);
  riskSheet['!cols'] = calculateColWidths(riskAOA);
  XLSX.utils.book_append_sheet(wb, riskSheet, 'Riesgo');

  // 4. Asignaturas
  const subAOA = mapSubjectToAOA(params.subjectAnalytics);
  const subSheet = XLSX.utils.aoa_to_sheet(subAOA);
  subSheet['!cols'] = calculateColWidths(subAOA);
  XLSX.utils.book_append_sheet(wb, subSheet, 'Asignaturas');

  // 5. Mapa de Calor
  const heatmapAOA = mapHeatmapToAOA(params.heatmap);
  const heatmapSheet = XLSX.utils.aoa_to_sheet(heatmapAOA);
  heatmapSheet['!cols'] = calculateColWidths(heatmapAOA);
  XLSX.utils.book_append_sheet(wb, heatmapSheet, 'Mapa de Calor');

  // 6. Retroalimentación
  const feedAOA = mapFeedbackToAOA(params.teacherFeedback);
  const feedSheet = XLSX.utils.aoa_to_sheet(feedAOA);
  feedSheet['!cols'] = calculateColWidths(feedAOA);
  XLSX.utils.book_append_sheet(wb, feedSheet, 'Retroalimentación');

  // 7. Libro Oficial
  const officialAOA = mapOfficialToAOA(params.officialRecords);
  const officialSheet = XLSX.utils.aoa_to_sheet(officialAOA);
  officialSheet['!cols'] = calculateColWidths(officialAOA);
  XLSX.utils.book_append_sheet(wb, officialSheet, 'Libro Oficial');

  // Trigger download
  const year = new Date().getFullYear();
  const fileName = `${params.grupo}_Consolidado_Completo_${year}.xlsx`;
  await triggerDownload(wb, fileName);
}

export const ExcelExportServiceImpl: ExcelExportService = {
  exportGroupPerformance,
  exportOutstandingStudents,
  exportAcademicRisk,
  exportSubjectAnalytics,
  exportGroupComparison,
  exportHeatmap,
  exportTeacherFeedback,
  exportOfficialRecords,
  exportConsolidadoCompleto
};
