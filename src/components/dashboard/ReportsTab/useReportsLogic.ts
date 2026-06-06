import { useMemo, useState } from 'react';
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
import { getEvaluatedPeriods } from '../../../services/academicLogic';
import type { ReportCategory } from '../../../domain/types';

export const useReportsLogic = () => {
  const estudiantes = useDashboardStore(state => state.estudiantes);
  const config = useDashboardStore(state => state.config);
  const selectedGrupo = useDashboardStore(state => state.selectedGrupo);
  const availableGroups = useDashboardStore(state => state.availableGroups);

  const activeTab = useUIStore(state => state.reportsActiveTab) as ReportCategory;
  const [localGroup, setLocalGroup] = useState<string>('');

  const [customPeriodName, setCustomPeriodName] = useState<string | null>(null);
  const [customDirectorNames, setCustomDirectorNames] = useState<Record<string, string>>({});

  const hasP4 = config.P4 !== undefined && config.P4 > 0;

  const defaultReportGroup = useMemo(() => {
    if (selectedGrupo && selectedGrupo !== 'Todos') return selectedGrupo;
    const filtered = availableGroups.filter(g => g !== 'Todos');
    return filtered[0] || '';
  }, [selectedGrupo, availableGroups]);

  const activeGroupToUse = selectedGrupo === 'Todos' ? (localGroup || defaultReportGroup) : selectedGrupo;

  const defaultPeriodName = useMemo(() => {
    if (estudiantes.length === 0) return 'Periodo Final';
    const evaluated = getEvaluatedPeriods(estudiantes);
    if (evaluated.P4) return 'Periodo 4';
    if (evaluated.P3) return 'Periodo 3';
    if (evaluated.P2) return 'Periodo 2';
    if (evaluated.P1) return 'Periodo 1';
    return 'Periodo Final';
  }, [estudiantes]);

  const defaultDirectorName = useMemo(() => {
    if (activeGroupToUse && estudiantes.length > 0) {
      const firstStudentOfGroup = estudiantes.find(s => s.grupo === activeGroupToUse);
      if (firstStudentOfGroup && firstStudentOfGroup.director) {
        return firstStudentOfGroup.director;
      }
    }
    return 'Director de Curso';
  }, [activeGroupToUse, estudiantes]);

  const periodName = customPeriodName !== null ? customPeriodName : defaultPeriodName;
  const setPeriodName = setCustomPeriodName;

  const directorName = customDirectorNames[activeGroupToUse] ?? defaultDirectorName;
  const setDirectorName = (name: string) => setCustomDirectorNames(prev => ({ ...prev, [activeGroupToUse]: name }));

  const groupPerformanceData = useMemo(() => {
    if (estudiantes.length === 0 || !activeGroupToUse) return null;
    return generateGroupPerformanceReport(estudiantes, activeGroupToUse, config);
  }, [estudiantes, activeGroupToUse, config]);

  const outstandingStudentsData = useMemo(() => {
    if (estudiantes.length === 0 || !activeGroupToUse) return null;
    return generateOutstandingStudentsReport(estudiantes, activeGroupToUse, config);
  }, [estudiantes, activeGroupToUse, config]);

  const academicRiskData = useMemo(() => {
    if (estudiantes.length === 0 || !activeGroupToUse) return null;
    return generateAcademicRiskReport(estudiantes, activeGroupToUse, config);
  }, [estudiantes, activeGroupToUse, config]);

  const subjectAnalyticsData = useMemo(() => {
    if (estudiantes.length === 0 || !activeGroupToUse) return null;
    return generateSubjectAnalyticsReport(estudiantes, activeGroupToUse, config);
  }, [estudiantes, activeGroupToUse, config]);

  const groupComparisonData = useMemo(() => {
    if (estudiantes.length === 0) return null;
    return generateGroupComparisonReport(estudiantes, config);
  }, [estudiantes, config]);

  const heatmapData = useMemo(() => {
    if (estudiantes.length === 0 || !activeGroupToUse) return null;
    return generateHeatmapReport(estudiantes, activeGroupToUse);
  }, [estudiantes, activeGroupToUse]);

  const teacherFeedbackData = useMemo(() => {
    if (estudiantes.length === 0 || !activeGroupToUse) return [];
    return generateTeacherFeedbackReportForGroup(estudiantes, activeGroupToUse, config);
  }, [estudiantes, activeGroupToUse, config]);

  const officialRecordsData = useMemo(() => {
    if (estudiantes.length === 0 || !activeGroupToUse) return null;
    return generateOfficialRecordsReport(estudiantes, activeGroupToUse, config, periodName, directorName);
  }, [estudiantes, activeGroupToUse, config, periodName, directorName]);

  const printLayoutClass = useMemo(() => {
    if (activeTab === 'heatmap' || activeTab === 'official' || activeTab === 'group-comparison') {
      return 'print-landscape';
    }
    return 'print-portrait';
  }, [activeTab]);

  const handlePrint = () => window.print();

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
  };
};
