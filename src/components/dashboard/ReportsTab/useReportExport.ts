import { ExcelExportServiceImpl } from '../../../services/excelExport';
import type { ReportCategory } from '../../../domain/types';
import type {
  GroupPerformanceReport,
  OutstandingStudentsReport,
  AcademicRiskReport,
  SubjectAnalyticsReport,
  GroupComparisonReport,
  HeatmapReport,
  TeacherFeedbackReport,
  OfficialRecordsReport,
} from '../../../domain/types';

export interface UseReportExportInput {
  activeTab: ReportCategory;
  groupPerformanceData: GroupPerformanceReport | null;
  outstandingStudentsData: OutstandingStudentsReport | null;
  academicRiskData: AcademicRiskReport | null;
  subjectAnalyticsData: SubjectAnalyticsReport | null;
  groupComparisonData: GroupComparisonReport | null;
  heatmapData: HeatmapReport | null;
  teacherFeedbackData: TeacherFeedbackReport[];
  officialRecordsData: OfficialRecordsReport | null;
  activeGroupToUse: string;
  hasStudentsInGroup: boolean;
}

export interface UseReportExportOutput {
  handleExportExcel: () => Promise<void>;
  handleExportConsolidadoCompleto: () => Promise<void>;
  canExportConsolidadoCompleto: boolean;
}

export const useReportExport = (input: UseReportExportInput): UseReportExportOutput => {
  const {
    activeTab,
    groupPerformanceData,
    outstandingStudentsData,
    academicRiskData,
    subjectAnalyticsData,
    groupComparisonData,
    heatmapData,
    teacherFeedbackData,
    officialRecordsData,
    activeGroupToUse,
    hasStudentsInGroup,
  } = input;

  const canExportConsolidadoCompleto = Boolean(
    activeTab !== 'group-comparison' &&
    activeGroupToUse &&
    hasStudentsInGroup
  );

  const handleExportExcel = async () => {
    switch (activeTab) {
      case 'group-performance':
        if (groupPerformanceData) await ExcelExportServiceImpl.exportGroupPerformance(groupPerformanceData);
        else alert('No hay datos de Rendimiento Grupal disponibles para exportar.');
        break;
      case 'outstanding':
        if (outstandingStudentsData) await ExcelExportServiceImpl.exportOutstandingStudents(outstandingStudentsData);
        else alert('No hay datos de Estudiantes Destacados disponibles para exportar.');
        break;
      case 'academic-risk':
        if (academicRiskData) await ExcelExportServiceImpl.exportAcademicRisk(academicRiskData);
        else alert('No hay datos de Riesgo Académico disponibles para exportar.');
        break;
      case 'subject-analytics':
        if (subjectAnalyticsData) await ExcelExportServiceImpl.exportSubjectAnalytics(subjectAnalyticsData);
        else alert('No hay datos de Análisis de Asignaturas disponibles para exportar.');
        break;
      case 'group-comparison':
        if (groupComparisonData) await ExcelExportServiceImpl.exportGroupComparison(groupComparisonData);
        else alert('No hay datos de Comparativa de Grupos disponibles para exportar.');
        break;
      case 'heatmap':
        if (heatmapData) await ExcelExportServiceImpl.exportHeatmap(heatmapData);
        else alert('No hay datos de Mapa de Calor disponibles para exportar.');
        break;
      case 'feedback':
        if (teacherFeedbackData && teacherFeedbackData.length > 0) await ExcelExportServiceImpl.exportTeacherFeedback(teacherFeedbackData);
        else alert('No hay datos de Retroalimentación disponibles para exportar.');
        break;
      case 'official':
        if (officialRecordsData) await ExcelExportServiceImpl.exportOfficialRecords(officialRecordsData);
        else alert('No hay datos de Registro Oficial disponibles para exportar.');
        break;
    }
  };

  const handleExportConsolidadoCompleto = async () => {
    if (activeTab === 'group-comparison') return;

    if (!activeGroupToUse) {
      alert("Por favor, seleccione un grupo válido.");
      return;
    }

    if (!groupPerformanceData || !outstandingStudentsData || !academicRiskData ||
        !subjectAnalyticsData || !heatmapData || !teacherFeedbackData || !officialRecordsData) {
      alert("No hay datos suficientes para generar el Consolidado Completo.");
      return;
    }

    await ExcelExportServiceImpl.exportConsolidadoCompleto({
      groupPerformance: groupPerformanceData,
      outstandingStudents: outstandingStudentsData,
      academicRisk: academicRiskData,
      subjectAnalytics: subjectAnalyticsData,
      heatmap: heatmapData,
      teacherFeedback: teacherFeedbackData,
      officialRecords: officialRecordsData,
      grupo: activeGroupToUse
    });
  };

  return {
    handleExportExcel,
    handleExportConsolidadoCompleto,
    canExportConsolidadoCompleto,
  };
};
