import { useState, useMemo, useEffect } from 'react';
import { useDashboardStore } from '../../../store/useDashboardStore';
import { useUIStore } from '../../../store/useUIStore';
import {
  generateGroupPerformanceReport,
  generateOutstandingStudentsReport,
  generateAcademicRiskReport,
  generateSubjectAnalyticsReport,
  generateGroupComparisonReport,
  generateHeatmapReport,
  generateTeacherFeedbackReportForGroup,
  generateOfficialRecordsReport,
} from '../../../services/reportEngine';
import { ExcelExportServiceImpl } from '../../../services/excelExport';

type ReportCategory =
  | 'group-performance'
  | 'outstanding'
  | 'academic-risk'
  | 'subject-analytics'
  | 'group-comparison'
  | 'heatmap'
  | 'feedback'
  | 'official';

export const useReportsLogic = () => {
  const estudiantes = useDashboardStore(state => state.estudiantes);
  const config = useDashboardStore(state => state.config);
  const selectedGrupo = useDashboardStore(state => state.selectedGrupo);
  const availableGroups = useDashboardStore(state => state.availableGroups);

  const activeTab = useUIStore(state => state.reportsActiveTab) as ReportCategory;
  const localGroup = useUIStore(state => state.reportsLocalGroup);
  const setLocalGroup = useUIStore(state => state.setReportsLocalGroup);
  const directorName = useUIStore(state => state.reportsDirectorName);
  const setDirectorName = useUIStore(state => state.setReportsDirectorName);
  const periodName = useUIStore(state => state.reportsPeriodName);
  const setPeriodName = useUIStore(state => state.setReportsPeriodName);

  const [lastDetectedPeriod, setLastDetectedPeriod] = useState<string>('');

  const detectedPeriod = useMemo(() => {
    if (estudiantes.length === 0) return 'Periodo Final';
    let hasP1 = false, hasP2 = false, hasP3 = false, hasP4 = false;
    estudiantes.forEach(student => {
      Object.values(student.areas).forEach(area => {
        if (area.DEF.P1 !== null && area.DEF.P1 !== undefined) hasP1 = true;
        if (area.DEF.P2 !== null && area.DEF.P2 !== undefined) hasP2 = true;
        if (area.DEF.P3 !== null && area.DEF.P3 !== undefined) hasP3 = true;
        if (area.DEF.P4 !== null && area.DEF.P4 !== undefined) hasP4 = true;
        Object.values(area.asignaturas).forEach(asig => {
          if (asig.P1 !== null && asig.P1 !== undefined) hasP1 = true;
          if (asig.P2 !== null && asig.P2 !== undefined) hasP2 = true;
          if (asig.P3 !== null && asig.P3 !== undefined) hasP3 = true;
          if (asig.P4 !== null && asig.P4 !== undefined) hasP4 = true;
        });
      });
    });
    if (hasP4) return 'Periodo 4';
    if (hasP3) return 'Periodo 3';
    if (hasP2) return 'Periodo 2';
    if (hasP1) return 'Periodo 1';
    return 'Periodo Final';
  }, [estudiantes]);

  useEffect(() => {
    if (detectedPeriod !== lastDetectedPeriod) {
      setPeriodName(detectedPeriod);
      setLastDetectedPeriod(detectedPeriod);
    }
  }, [detectedPeriod, lastDetectedPeriod, setPeriodName]);

  const hasP4 = config.P4 !== undefined && config.P4 > 0;

  const defaultReportGroup = useMemo(() => {
    if (selectedGrupo && selectedGrupo !== 'Todos') return selectedGrupo;
    const filtered = availableGroups.filter(g => g !== 'Todos');
    return filtered[0] || '';
  }, [selectedGrupo, availableGroups]);

  const [lastSelectedGrupo, setLastSelectedGrupo] = useState<string>('');

  useEffect(() => {
    if (selectedGrupo !== lastSelectedGrupo) {
      if (selectedGrupo && selectedGrupo !== 'Todos') {
        setLocalGroup(selectedGrupo);
        const firstStudentOfGroup = estudiantes.find(s => s.grupo === selectedGrupo);
        if (firstStudentOfGroup && firstStudentOfGroup.director) {
          setDirectorName(firstStudentOfGroup.director);
        }
      }
      setLastSelectedGrupo(selectedGrupo);
    }
  }, [selectedGrupo, lastSelectedGrupo, setLocalGroup, setDirectorName, estudiantes]);

  useEffect(() => {
    if (localGroup) {
      const firstStudentOfGroup = estudiantes.find(s => s.grupo === localGroup);
      if (firstStudentOfGroup && firstStudentOfGroup.director) {
        setDirectorName(firstStudentOfGroup.director);
      }
    }
  }, [localGroup, estudiantes, setDirectorName]);

  const activeGroupToUse = selectedGrupo === 'Todos' ? (localGroup || defaultReportGroup) : selectedGrupo;

  const groupPerformanceData = useMemo(() => {
    if (activeTab !== 'group-performance' || estudiantes.length === 0 || !activeGroupToUse) return null;
    return generateGroupPerformanceReport(estudiantes, activeGroupToUse, config);
  }, [activeTab, estudiantes, activeGroupToUse, config]);

  const outstandingStudentsData = useMemo(() => {
    if (activeTab !== 'outstanding' || estudiantes.length === 0 || !activeGroupToUse) return null;
    return generateOutstandingStudentsReport(estudiantes, activeGroupToUse, config);
  }, [activeTab, estudiantes, activeGroupToUse, config]);

  const academicRiskData = useMemo(() => {
    if (activeTab !== 'academic-risk' || estudiantes.length === 0 || !activeGroupToUse) return null;
    return generateAcademicRiskReport(estudiantes, activeGroupToUse, config);
  }, [activeTab, estudiantes, activeGroupToUse, config]);

  const subjectAnalyticsData = useMemo(() => {
    if (activeTab !== 'subject-analytics' || estudiantes.length === 0 || !activeGroupToUse) return null;
    return generateSubjectAnalyticsReport(estudiantes, activeGroupToUse, config);
  }, [activeTab, estudiantes, activeGroupToUse, config]);

  const groupComparisonData = useMemo(() => {
    if (activeTab !== 'group-comparison' || estudiantes.length === 0) return null;
    return generateGroupComparisonReport(estudiantes, config);
  }, [activeTab, estudiantes, config]);

  const heatmapData = useMemo(() => {
    if (activeTab !== 'heatmap' || estudiantes.length === 0 || !activeGroupToUse) return null;
    return generateHeatmapReport(estudiantes, activeGroupToUse);
  }, [activeTab, estudiantes, activeGroupToUse]);

  const teacherFeedbackData = useMemo(() => {
    if (activeTab !== 'feedback' || estudiantes.length === 0 || !activeGroupToUse) return [];
    return generateTeacherFeedbackReportForGroup(estudiantes, activeGroupToUse, config);
  }, [activeTab, estudiantes, activeGroupToUse, config]);

  const officialRecordsData = useMemo(() => {
    if (activeTab !== 'official' || estudiantes.length === 0 || !activeGroupToUse) return null;
    return generateOfficialRecordsReport(estudiantes, activeGroupToUse, config, periodName, directorName);
  }, [activeTab, estudiantes, activeGroupToUse, config, periodName, directorName]);

  const printLayoutClass = useMemo(() => {
    if (activeTab === 'heatmap' || activeTab === 'official' || activeTab === 'group-comparison') {
      return 'print-landscape';
    }
    return 'print-portrait';
  }, [activeTab]);

  const handlePrint = () => window.print();

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

    const exportGroupPerformanceData = generateGroupPerformanceReport(estudiantes, activeGroupToUse, config);
    const exportOutstandingStudentsData = generateOutstandingStudentsReport(estudiantes, activeGroupToUse, config);
    const exportAcademicRiskData = generateAcademicRiskReport(estudiantes, activeGroupToUse, config);
    const exportSubjectAnalyticsData = generateSubjectAnalyticsReport(estudiantes, activeGroupToUse, config);
    const exportHeatmapData = generateHeatmapReport(estudiantes, activeGroupToUse);
    const exportTeacherFeedbackData = generateTeacherFeedbackReportForGroup(estudiantes, activeGroupToUse, config);
    const exportOfficialRecordsData = generateOfficialRecordsReport(estudiantes, activeGroupToUse, config, periodName, directorName);

    await ExcelExportServiceImpl.exportConsolidadoCompleto({
      groupPerformance: exportGroupPerformanceData,
      outstandingStudents: exportOutstandingStudentsData,
      academicRisk: exportAcademicRiskData,
      subjectAnalytics: exportSubjectAnalyticsData,
      heatmap: exportHeatmapData,
      teacherFeedback: exportTeacherFeedbackData,
      officialRecords: exportOfficialRecordsData,
      grupo: activeGroupToUse
    });
  };

  return {
    estudiantes,
    selectedGrupo,
    availableGroups,
    activeTab,
    localGroup,
    setLocalGroup,
    directorName,
    setDirectorName,
    periodName,
    setPeriodName,
    hasP4,
    activeGroupToUse,
    groupPerformanceData,
    outstandingStudentsData,
    academicRiskData,
    subjectAnalyticsData,
    groupComparisonData,
    heatmapData,
    teacherFeedbackData,
    officialRecordsData,
    printLayoutClass,
    handlePrint,
    handleExportExcel,
    handleExportConsolidadoCompleto,
  };
};
