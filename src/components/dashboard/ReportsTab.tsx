import React, { useState, useMemo } from 'react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useUIStore } from '../../store/useUIStore';
import {
  generateGroupPerformanceReport,
  generateOutstandingStudentsReport,
  generateAcademicRiskReport,
  generateSubjectAnalyticsReport,
  generateGroupComparisonReport,
  generateHeatmapReport,
  generateTeacherFeedbackReport,
  generateOfficialRecordsReport,
} from '../../services/reportEngine';
import { ExcelExportServiceImpl } from '../../services/excelExport';

type ReportCategory =
  | 'group-performance'
  | 'outstanding'
  | 'academic-risk'
  | 'subject-analytics'
  | 'group-comparison'
  | 'heatmap'
  | 'feedback'
  | 'official';

export const ReportsTab: React.FC = () => {
  const estudiantes = useDashboardStore(state => state.estudiantes);
  const config = useDashboardStore(state => state.config);
  const selectedGrupo = useDashboardStore(state => state.selectedGrupo);
  const availableGroups = useDashboardStore(state => state.availableGroups);

  const activeTab = useUIStore(state => state.reportsActiveTab) as ReportCategory;
  const setActiveTab = useUIStore(state => state.setReportsActiveTab);
  const localGroup = useUIStore(state => state.reportsLocalGroup);
  const setLocalGroup = useUIStore(state => state.setReportsLocalGroup);
  const directorName = useUIStore(state => state.reportsDirectorName);
  const setDirectorName = useUIStore(state => state.setReportsDirectorName);
  const periodName = useUIStore(state => state.reportsPeriodName);
  const setPeriodName = useUIStore(state => state.setReportsPeriodName);

  const [lastDetectedPeriod, setLastDetectedPeriod] = useState<string>('');

  // Dynamically detect the highest period with active grades across the loaded dataset
  const detectedPeriod = useMemo(() => {
    if (estudiantes.length === 0) return 'Periodo Final';
    
    let hasP1 = false;
    let hasP2 = false;
    let hasP3 = false;
    let hasP4 = false;

    estudiantes.forEach(student => {
      Object.values(student.areas).forEach(area => {
        // Check Area-level DEF grades
        if (area.DEF.P1 !== null && area.DEF.P1 !== undefined) hasP1 = true;
        if (area.DEF.P2 !== null && area.DEF.P2 !== undefined) hasP2 = true;
        if (area.DEF.P3 !== null && area.DEF.P3 !== undefined) hasP3 = true;
        if (area.DEF.P4 !== null && area.DEF.P4 !== undefined) hasP4 = true;

        // Check Subject-level grades
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

  if (detectedPeriod !== lastDetectedPeriod) {
    setPeriodName(detectedPeriod);
    setLastDetectedPeriod(detectedPeriod);
  }

  const hasP4 = config.P4 !== undefined && config.P4 > 0;

  // Filter out 'Todos' for individual group reports, fallback to first available or empty
  const defaultReportGroup = useMemo(() => {
    if (selectedGrupo && selectedGrupo !== 'Todos') {
      return selectedGrupo;
    }
    const filtered = availableGroups.filter(g => g !== 'Todos');
    return filtered[0] || '';
  }, [selectedGrupo, availableGroups]);

  const [lastSelectedGrupo, setLastSelectedGrupo] = useState<string>('');

  if (selectedGrupo !== lastSelectedGrupo) {
    if (selectedGrupo && selectedGrupo !== 'Todos') {
      setLocalGroup(selectedGrupo);
    }
    setLastSelectedGrupo(selectedGrupo);
  }

  const activeGroupToUse = selectedGrupo === 'Todos' ? (localGroup || defaultReportGroup) : selectedGrupo;

  // 1. Group Performance
  const groupPerformanceData = useMemo(() => {
    if (estudiantes.length === 0 || !activeGroupToUse) return null;
    return generateGroupPerformanceReport(estudiantes, activeGroupToUse, config);
  }, [estudiantes, activeGroupToUse, config]);

  // 2. Outstanding Students
  const outstandingStudentsData = useMemo(() => {
    if (estudiantes.length === 0 || !activeGroupToUse) return null;
    return generateOutstandingStudentsReport(estudiantes, activeGroupToUse, config);
  }, [estudiantes, activeGroupToUse, config]);

  // 3. Academic Risk
  const academicRiskData = useMemo(() => {
    if (estudiantes.length === 0 || !activeGroupToUse) return null;
    return generateAcademicRiskReport(estudiantes, activeGroupToUse, config);
  }, [estudiantes, activeGroupToUse, config]);

  // 4. Subject Analytics
  const subjectAnalyticsData = useMemo(() => {
    if (estudiantes.length === 0 || !activeGroupToUse) return null;
    return generateSubjectAnalyticsReport(estudiantes, activeGroupToUse, config);
  }, [estudiantes, activeGroupToUse, config]);

  // 5. Group Comparison
  const groupComparisonData = useMemo(() => {
    if (estudiantes.length === 0) return null;
    return generateGroupComparisonReport(estudiantes, config);
  }, [estudiantes, config]);

  // 6. Heatmap
  const heatmapData = useMemo(() => {
    if (estudiantes.length === 0 || !activeGroupToUse) return null;
    return generateHeatmapReport(estudiantes, activeGroupToUse);
  }, [estudiantes, activeGroupToUse]);

  // 7. Teacher Feedback (Iterate all students in activeGroupToUse)
  const teacherFeedbackData = useMemo(() => {
    if (estudiantes.length === 0 || !activeGroupToUse) return [];
    const groupStudents = estudiantes.filter(s => s.grupo === activeGroupToUse);
    return groupStudents.map(s => generateTeacherFeedbackReport(s, config));
  }, [estudiantes, activeGroupToUse, config]);

  // 8. Official Records Ledger
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

  if (estudiantes.length === 0) {
    return <div className="p-8 text-center app-text-muted">No hay datos para generar reportes. Cargue un archivo Excel.</div>;
  }

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    switch (activeTab) {
      case 'group-performance':
        if (groupPerformanceData) {
          ExcelExportServiceImpl.exportGroupPerformance(groupPerformanceData);
        } else {
          alert('No hay datos de Rendimiento Grupal disponibles para exportar.');
        }
        break;
      case 'outstanding':
        if (outstandingStudentsData) {
          ExcelExportServiceImpl.exportOutstandingStudents(outstandingStudentsData);
        } else {
          alert('No hay datos de Estudiantes Destacados disponibles para exportar.');
        }
        break;
      case 'academic-risk':
        if (academicRiskData) {
          ExcelExportServiceImpl.exportAcademicRisk(academicRiskData);
        } else {
          alert('No hay datos de Riesgo Académico disponibles para exportar.');
        }
        break;
      case 'subject-analytics':
        if (subjectAnalyticsData) {
          ExcelExportServiceImpl.exportSubjectAnalytics(subjectAnalyticsData);
        } else {
          alert('No hay datos de Análisis de Asignaturas disponibles para exportar.');
        }
        break;
      case 'group-comparison':
        if (groupComparisonData) {
          ExcelExportServiceImpl.exportGroupComparison(groupComparisonData);
        } else {
          alert('No hay datos de Comparativa de Grupos disponibles para exportar.');
        }
        break;
      case 'heatmap':
        if (heatmapData) {
          ExcelExportServiceImpl.exportHeatmap(heatmapData);
        } else {
          alert('No hay datos de Mapa de Calor disponibles para exportar.');
        }
        break;
      case 'feedback':
        if (teacherFeedbackData && teacherFeedbackData.length > 0) {
          ExcelExportServiceImpl.exportTeacherFeedback(teacherFeedbackData);
        } else {
          alert('No hay datos de Retroalimentación disponibles para exportar.');
        }
        break;
      case 'official':
        if (officialRecordsData) {
          ExcelExportServiceImpl.exportOfficialRecords(officialRecordsData);
        } else {
          alert('No hay datos de Registro Oficial disponibles para exportar.');
        }
        break;
      default:
        break;
    }
  };

  const handleExportConsolidadoCompleto = () => {
    if (activeTab === 'group-comparison') return;

    if (
      !groupPerformanceData ||
      !outstandingStudentsData ||
      !academicRiskData ||
      !subjectAnalyticsData ||
      !heatmapData ||
      !teacherFeedbackData ||
      !officialRecordsData ||
      !activeGroupToUse
    ) {
      alert("Por favor, espere a que se carguen los datos de todos los reportes para este grupo.");
      return;
    }

    ExcelExportServiceImpl.exportConsolidadoCompleto({
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

  const menuItems = [
    { id: 'group-performance', label: 'Rendimiento Grupal', icon: '📈' },
    { id: 'outstanding', label: 'Estudiantes Destacados', icon: '✨' },
    { id: 'academic-risk', label: 'Riesgo Académico', icon: '⚠️' },
    { id: 'subject-analytics', label: 'Análisis de Asignaturas', icon: '📊' },
    { id: 'group-comparison', label: 'Comparativa de Grupos', icon: '⚖️' },
    { id: 'heatmap', label: 'Mapa de Calor', icon: '🌡️' },
    { id: 'feedback', label: 'Retroalimentación', icon: '💬' },
    { id: 'official', label: 'Registro Oficial', icon: '📋' },
  ] as const;

  return (
    <div className={`p-6 transition-premium max-w-7xl mx-auto app-text print:p-0 ${printLayoutClass}`}>
      {/* Top action bar: hidden when printing */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 no-print print:hidden">
        <div>
          <h2 className="text-2xl font-bold app-text tracking-tight">Reportes Institucionales de Calificaciones</h2>
          <p className="text-sm app-text-muted mt-1">Análisis robustos, listados de riesgo y plantillas listas para impresión física.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {selectedGrupo === 'Todos' && activeTab !== 'group-comparison' && (
            <div className="flex items-center gap-2">
              <label htmlFor="reports-group-filter" className="text-xs font-bold app-text-muted uppercase">Filtrar Grupo:</label>
              <select
                id="reports-group-filter"
                value={activeGroupToUse}
                onChange={e => setLocalGroup(e.target.value)}
                className="border app-control app-focus rounded-xl px-3 py-2 text-sm"
              >
                {availableGroups.filter(g => g !== 'Todos').map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          )}
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
          >
            📊 Exportar Excel
          </button>
          <button 
            onClick={handleExportConsolidadoCompleto}
            disabled={activeTab === 'group-comparison' || !activeGroupToUse || !groupPerformanceData}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:hover:bg-blue-600 text-white font-semibold text-sm rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title={activeTab === 'group-comparison' ? "Consolidado Completo no disponible para Comparativa de Grupos" : "Descarga los 7 reportes del grupo en un único archivo de Excel"}
          >
            📦 Consolidado Completo
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
          >
            🖨️ Imprimir Reporte
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 print:block">
        {/* Left Interactive Sidebar: hidden when printing */}
        <div className="w-full lg:w-64 shrink-0 no-print print:hidden">
          <div className="app-surface border app-border rounded-2xl p-4 shadow-sm">
            <h3 className="text-xs font-bold app-text-muted uppercase tracking-wider mb-3 px-2">Categorías de Reporte</h3>
            <nav className="flex flex-col gap-1">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  aria-pressed={activeTab === item.id}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                    activeTab === item.id
                      ? 'app-tab-active border-l-4'
                      : 'app-tab-inactive border-l-4 border-transparent'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <section
          className="flex-1 app-surface border app-border rounded-2xl p-6 shadow-sm print:border-none print:shadow-none print:p-0 print:bg-white"
          role="region"
          aria-label="Vista previa del reporte"
          data-report-preview
        >
          
          {/* Header for Printed Paper */}
          <div
            className="hidden print:block text-center border-b border-slate-300 pb-4 mb-6"
            role="region"
            aria-label="Encabezado imprimible"
          >
            <h1 className="text-2xl font-bold uppercase tracking-wide text-slate-950">
              IEEC - Consolidado Institucional {periodName && `(${periodName.toUpperCase()})`}
            </h1>
            <p className="text-sm text-slate-600 mt-1">Soporte de Calificaciones Académicas y Comités de Evaluación</p>
            <div className="flex justify-between items-center text-xs text-slate-500 mt-3 px-2">
              <span>Grupo: {activeTab === 'group-comparison' ? 'Todos los grupos' : activeGroupToUse}</span>
              <span>Reporte: {menuItems.find(m => m.id === activeTab)?.label}</span>
              <span>Emisión: {new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* 1. Rendimiento Grupal */}
          {activeTab === 'group-performance' && groupPerformanceData && (
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 print:text-black">
                Reporte de Rendimiento Grupal - Grupo {groupPerformanceData.grupo}
              </h3>
              
              {/* SaaS Metrics Cards: hidden when printing */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 no-print print:hidden">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Estudiantes</span>
                  <span className="text-2xl font-extrabold text-slate-800">{groupPerformanceData.totalStudents}</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Promedio Grupal</span>
                  <span className="text-2xl font-extrabold text-indigo-600">{groupPerformanceData.average.toFixed(2)}</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Desviación Estándar</span>
                  <span className="text-2xl font-extrabold text-slate-800">{groupPerformanceData.standardDeviation.toFixed(1)}</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Tasa de Promoción</span>
                  <span className="text-2xl font-extrabold text-emerald-600">{groupPerformanceData.promotionRate.toFixed(1)}%</span>
                </div>
              </div>

              {/* Print-specific compact layout */}
              <table className="hidden print:table w-full text-sm border-collapse mb-6">
                <tbody>
                  <tr className="border-t border-b border-slate-300">
                    <td className="py-2 font-bold text-slate-700">Total Estudiantes:</td>
                    <td className="py-2 text-right">{groupPerformanceData.totalStudents}</td>
                    <td className="py-2 pl-8 font-bold text-slate-700">Promedio General:</td>
                    <td className="py-2 text-right">{groupPerformanceData.average.toFixed(2)}</td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="py-2 font-bold text-slate-700">Desviación Estándar:</td>
                    <td className="py-2 text-right">{groupPerformanceData.standardDeviation.toFixed(1)}</td>
                    <td className="py-2 pl-8 font-bold text-slate-700">Porcentaje Promoción:</td>
                    <td className="py-2 text-right">{groupPerformanceData.promotionRate.toFixed(1)}%</td>
                  </tr>
                </tbody>
              </table>

              <h4 className="font-bold text-slate-800 text-sm mb-3 uppercase tracking-wider">⚠️ Áreas Críticas con Reprobación</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden text-sm">
                  <thead className="bg-slate-50 print:bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-slate-600">Área</th>
                      <th className="px-4 py-3 text-center font-bold text-slate-600 w-32">Nº Pérdidas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {groupPerformanceData.criticalAreas.map((area, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/40">
                        <td className="px-4 py-2.5 font-medium text-slate-800">{area.area}</td>
                        <td className="px-4 py-2.5 text-center font-bold text-rose-600">{area.failuresCount}</td>
                      </tr>
                    ))}
                    {groupPerformanceData.criticalAreas.length === 0 && (
                      <tr>
                        <td colSpan={2} className="px-4 py-8 text-center text-slate-400">Excelente. No se registran áreas reprobadas en este grupo.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. Estudiantes Destacados */}
          {activeTab === 'outstanding' && outstandingStudentsData && (
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 print:text-black">
                Estudiantes Destacados - Grupo {outstandingStudentsData.grupo}
              </h3>
              <p className="text-xs text-slate-500 mb-4 no-print print:hidden">Cuadro de Honor de Estudiantes con Percentil Académico superior o igual a 90% dentro de su cohorte.</p>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden text-sm">
                  <thead className="bg-slate-50 print:bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-slate-600 w-16">Puesto</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-600">Estudiante</th>
                      <th className="px-4 py-3 text-center font-bold text-slate-600 w-32">Promedio</th>
                      <th className="px-4 py-3 text-center font-bold text-slate-600 w-32">Percentil</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {outstandingStudentsData.students.map((student, idx) => (
                      <tr key={student.id} className="hover:bg-slate-50/40">
                        <td className="px-4 py-2.5 text-slate-500 font-bold">{idx + 1}</td>
                        <td className="px-4 py-2.5 font-bold text-indigo-700 print:text-black">{student.name}</td>
                        <td className="px-4 py-2.5 text-center font-extrabold text-slate-800">{student.average.toFixed(2)}</td>
                        <td className="px-4 py-2.5 text-center font-semibold text-emerald-600 print:text-black">{student.percentile}%</td>
                      </tr>
                    ))}
                    {outstandingStudentsData.students.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-400">No se registran estudiantes por encima del percentil 90% en este grupo.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. Riesgo Académico */}
          {activeTab === 'academic-risk' && academicRiskData && (
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 print:text-black">
                Estudiantes en Riesgo Académico - Grupo {academicRiskData.grupo}
              </h3>
              <p className="text-xs text-slate-500 mb-4 no-print print:hidden">Visualización de estudiantes con asignaturas perdidas o que presentan imposibilidad matemática de aprobar en la proyección restante.</p>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden text-sm">
                  <thead className="bg-slate-50 print:bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-slate-600">Estudiante</th>
                      <th className="px-4 py-3 text-center font-bold text-slate-600 w-24">Promedio</th>
                      <th className="px-4 py-3 text-center font-bold text-slate-600 w-24">Áreas Perdidas</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-600">Detalle de Alerta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {academicRiskData.criticalStudents.map(student => (
                      <tr key={student.id} className="hover:bg-slate-50/40">
                        <td className="px-4 py-3 font-semibold text-slate-800">{student.name}</td>
                        <td className="px-4 py-3 text-center font-bold text-slate-700">{student.average.toFixed(2)}</td>
                        <td className="px-4 py-3 text-center font-bold text-rose-600">{student.failedAreasCount}</td>
                        <td className="px-4 py-3 text-xs space-y-1">
                          {student.failedAreas.length > 0 && (
                            <div>
                              <span className="font-bold text-rose-700 uppercase tracking-wide">Reprueba: </span>
                              <span className="text-slate-600 font-medium">{student.failedAreas.join(', ')}</span>
                            </div>
                          )}
                          {student.impossibilityMathAreas.length > 0 && (
                            <div className="mt-1">
                              <span className="font-bold text-amber-700 uppercase tracking-wide">⚠️ Imposibilidad P3/P4: </span>
                              <span className="text-slate-600 font-medium">{student.impossibilityMathAreas.join(', ')}</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {academicRiskData.criticalStudents.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-400">¡Excelente! Cero estudiantes en situación de riesgo en este grupo.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. Análisis de Asignaturas */}
          {activeTab === 'subject-analytics' && subjectAnalyticsData && (
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 print:text-black">
                Análisis por Asignaturas - Grupo {subjectAnalyticsData.grupo}
              </h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden text-sm">
                  <thead className="bg-slate-50 print:bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-slate-600">Asignatura</th>
                      <th className="px-4 py-3 text-center font-bold text-slate-600 w-32">Promedio General</th>
                      <th className="px-4 py-3 text-center font-bold text-slate-600 w-32">Cant. Reprobados</th>
                      <th className="px-4 py-3 text-center font-bold text-slate-600 w-32">Porcentaje Reprobación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subjectAnalyticsData.subjects.map((sub, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/40">
                        <td className="px-4 py-2.5 font-semibold text-slate-800">{sub.asignatura}</td>
                        <td className="px-4 py-2.5 text-center font-extrabold text-slate-800">{sub.average.toFixed(2)}</td>
                        <td className="px-4 py-2.5 text-center font-bold text-rose-600">{sub.failuresCount}</td>
                        <td className="px-4 py-2.5 text-center font-semibold text-rose-500">{sub.failuresRate}%</td>
                      </tr>
                    ))}
                    {subjectAnalyticsData.subjects.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-400">Sin datos de asignaturas cargados.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. Comparativa de Grupos */}
          {activeTab === 'group-comparison' && groupComparisonData && (
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 print:text-black">
                Análisis Comparativo Inter-Grupos
              </h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden text-sm">
                  <thead className="bg-slate-50 print:bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-slate-600">Grupo</th>
                      <th 
                        className="px-4 py-3 text-center font-bold text-slate-600 w-24 cursor-help" 
                        title="Cantidad total de estudiantes activos evaluados en este grupo."
                      >
                        Estudiantes ℹ️
                      </th>
                      <th 
                        className="px-4 py-3 text-center font-bold text-slate-600 w-28 cursor-help" 
                        title="Rendimiento promedio de todo el grupo (suma de promedios de estudiantes dividida por la cantidad de estudiantes)."
                      >
                        Promedio General ℹ️
                      </th>
                      <th 
                        className="px-4 py-3 text-center font-bold text-slate-600 w-28 cursor-help" 
                        title="DESVIACIÓN ESTÁNDAR&#10;&#10;Mide qué tan dispersos están los promedios de los alumnos en comparación con el promedio general del grupo.&#10;&#10;• Desviación ALTA (&gt; 1.0): Grupo HETEROGÉNEO. Coexisten alumnos con rendimiento sobresaliente y otros con graves dificultades. Requiere apoyo diferenciado.&#10;• Desviación BAJA (&lt; 0.5): Grupo HOMOGÉNEO. Los niveles de rendimiento de los alumnos son muy uniformes y parejos.&#10;&#10;No es 'buena' ni 'mala' de por sí, pero una desviación alta alerta al docente sobre una gran brecha de aprendizaje en el salón de clases."
                      >
                        Desv. Estándar ℹ️
                      </th>
                      <th 
                        className="px-4 py-3 text-center font-bold text-slate-600 w-28 cursor-help" 
                        title="Suma acumulada de todas las áreas reprobadas (calificación menor a 3.0) por todos los estudiantes del grupo."
                      >
                        Total Pérdidas ℹ️
                      </th>
                      <th 
                        className="px-4 py-3 text-center font-bold text-slate-600 w-28 cursor-help" 
                        title="Cantidad de estudiantes que reprueban la promoción del año bajo la Regla de Oro (tienen 3 o más áreas con promedio reprobatorio)."
                      >
                        Estudiantes Reprobados ℹ️
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {groupComparisonData.groups.map(group => (
                      <tr key={group.grupo} className="hover:bg-slate-50/40">
                        <td className="px-4 py-2.5 font-bold text-indigo-700 print:text-black">{group.grupo}</td>
                        <td className="px-4 py-2.5 text-center font-medium text-slate-700">{group.totalStudents}</td>
                        <td className="px-4 py-2.5 text-center font-extrabold text-slate-800">{group.average.toFixed(2)}</td>
                        <td className="px-4 py-2.5 text-center font-semibold text-slate-600">{group.standardDeviation.toFixed(1)}</td>
                        <td className="px-4 py-2.5 text-center font-bold text-rose-500">{group.failuresCount}</td>
                        <td className="px-4 py-2.5 text-center font-extrabold text-rose-600">{group.reprobadosCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. Mapa de Calor */}
          {activeTab === 'heatmap' && heatmapData && (
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 print:text-black">
                Mapa de Calor - Grupo {heatmapData.grupo}
              </h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden text-xs print:table-layout-fixed">
                  <thead className="bg-slate-50 print:bg-slate-100">
                    <tr>
                      <th className="px-3 py-3 text-left font-bold text-slate-600 sticky left-0 bg-slate-50 print:bg-slate-100 z-10 w-48 print:w-[120px] print:min-w-0 print:text-[8px] print:px-1">Estudiante</th>
                      {heatmapData.areasList.map(area => (
                        <th key={area} className="px-2 py-3 text-center font-bold text-slate-600 min-w-[100px] max-w-[140px] print:min-w-0 print:w-auto print:text-[7.5px] print:px-1" title={area}>
                          {area.length > 15 ? `${area.substring(0, 15)}.` : area}
                        </th>
                      ))}
                      <th className="px-3 py-3 text-center font-bold text-slate-700 w-24 print:w-[45px] print:min-w-0 print:text-[8px] print:px-1">Prom.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {heatmapData.rows.map(row => (
                      <tr key={row.studentId} className="hover:bg-slate-50/40">
                        <td className="px-3 py-2 font-bold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-100 print:w-[120px] print:min-w-0 print:text-[8px] print:px-1">{row.studentName}</td>
                        {heatmapData.areasList.map(areaName => {
                          const cell = row.grades[areaName];
                          let cellClass = 'bg-slate-50 text-slate-400';
                          if (cell && cell.grade !== null) {
                            if (cell.color === 'green') cellClass = 'bg-emerald-50 text-emerald-800 font-semibold';
                            else if (cell.color === 'yellow') cellClass = 'bg-amber-50 text-amber-800 font-semibold';
                            else if (cell.color === 'red') cellClass = 'bg-rose-50 text-rose-800 font-bold';
                            else if (cell.color === 'cyan') cellClass = 'bg-cyan-50 text-cyan-800 font-semibold';
                            else if (cell.color === 'blue') cellClass = 'bg-blue-50 text-blue-800 font-semibold';
                          }
                          return (
                            <td key={areaName} className={`px-2 py-2 text-center border-r border-slate-100/60 print:min-w-0 print:w-auto print:text-[8px] print:px-1 ${cellClass}`}>
                              {cell?.grade?.toFixed(1) ?? '-'}
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 text-center font-extrabold text-slate-900 bg-slate-50/40 print:w-[45px] print:min-w-0 print:text-[8px] print:px-1">{row.promActual.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 7. Fichas de Retroalimentación */}
          {activeTab === 'feedback' && teacherFeedbackData.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 no-print print:hidden">
                Fichas de Retroalimentación de Alumnos - Grupo {activeGroupToUse}
              </h3>
              
              <div className="space-y-6 print:space-y-12">
                {teacherFeedbackData.map(student => (
                  <div key={student.studentId} className="border border-slate-200/80 rounded-2xl p-6 bg-white shadow-sm break-inside-avoid print:border print:border-slate-400 print:p-6 print:rounded-2xl">
                    <div className="flex justify-between items-start border-b border-slate-100 print:border-slate-300 pb-3 mb-4">
                      <div>
                        <h4 className="text-lg font-bold text-slate-900 print:text-black">{student.studentName}</h4>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Identificación: {student.studentId}</span>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${
                          student.overallStatus === 'Aprobado'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : student.overallStatus === 'Compromisos'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {student.overallStatus}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-emerald-50/30 dark:bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-100/40 dark:border-emerald-900/30 print:bg-white print:border-slate-300">
                        <span className="block text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">💪 Áreas de Fortaleza (Refuerzo Positivo)</span>
                        {student.strengths.length > 0 ? (
                          <ul className="list-disc pl-5 text-sm text-slate-700 dark:text-slate-300 space-y-0.5">
                            {student.strengths.map(area => <li key={area}>{area}</li>)}
                          </ul>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-400 italic">No se listan fortalezas con nota superior a 4.0</span>
                        )}
                      </div>

                      <div className="bg-rose-50/30 dark:bg-rose-950/20 p-3.5 rounded-xl border border-rose-100/40 dark:border-rose-900/30 print:bg-white print:border-slate-300">
                        <span className="block text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider mb-1">🎯 Áreas de Debilidad (Plan de Atención)</span>
                        {student.weaknesses.length > 0 ? (
                          <ul className="list-disc pl-5 text-sm text-slate-700 space-y-0.5">
                            {student.weaknesses.map(area => <li key={area} className="font-semibold text-rose-800 dark:text-rose-300 print:text-black">{area}</li>)}
                          </ul>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-400 italic">¡Ninguna! Felicitaciones, no presenta áreas con reprobación.</span>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800/40 print:bg-white print:border-slate-300">
                      <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">📝 Recomendaciones y Tutoría del Docente</span>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-300 italic leading-relaxed print:text-black">"{student.adviceText}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. Registro Oficial */}
          {activeTab === 'official' && officialRecordsData && (
            <div>
              <div className="flex justify-between items-center mb-4 no-print print:hidden">
                <h3 className="text-lg font-bold text-slate-900">
                  Registro de Calificaciones Oficial - Grupo {officialRecordsData.grupo}
                </h3>
              </div>

              {/* Input details for Director/Period: hidden when printing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/60 no-print print:hidden">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                    👤 Nombre del Director de Curso:
                  </label>
                  <input
                    type="text"
                    value={directorName}
                    onChange={e => setDirectorName(e.target.value)}
                    placeholder="Ej. Prof. María Clara Gómez"
                    className="border border-slate-200 hover:border-slate-300 bg-white rounded-xl px-4 py-2.5 text-sm text-slate-800 font-medium shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                    📅 Nombre del Periodo Académico:
                  </label>
                  <input
                    type="text"
                    value={periodName}
                    onChange={e => setPeriodName(e.target.value)}
                    placeholder="Ej. Periodo 1, Primer Trimestre"
                    className="border border-slate-200 hover:border-slate-300 bg-white rounded-xl px-4 py-2.5 text-sm text-slate-800 font-medium shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden text-xs print:table-layout-fixed">
                  <thead className="bg-slate-50 print:bg-slate-100">
                    <tr>
                      <th className="px-2 py-3 text-center font-bold text-slate-600 w-12 print:w-[35px] print:min-w-0 print:text-[8px] print:px-1">Puesto</th>
                      <th className="px-3 py-3 text-left font-bold text-slate-600 w-44 print:w-[110px] print:min-w-0 print:text-[8px] print:px-1">Estudiante</th>
                      {Object.keys(officialRecordsData.rows[0]?.grades || {}).map(area => (
                        <th key={area} className="px-2 py-3 text-center font-bold text-slate-600 max-w-[120px] print:min-w-0 print:w-auto print:text-[7.5px] print:px-1" title={area}>
                          {area.length > 15 ? `${area.substring(0, 15)}.` : area}
                        </th>
                      ))}
                      <th className="px-2 py-3 text-center font-bold text-slate-700 w-16 print:w-[45px] print:min-w-0 print:text-[8px] print:px-1">Promedio</th>
                      {hasP4 && (
                        <th className="px-2 py-3 text-center font-bold text-slate-600 w-12">P4</th>
                      )}
                      <th className="px-2 py-3 text-center font-bold text-slate-600 w-16 print:w-[35px] print:min-w-0 print:text-[8px] print:px-1">Fallas</th>
                      <th className="px-3 py-3 text-center font-bold text-slate-700 w-24 print:w-[50px] print:min-w-0 print:text-[8px] print:px-1">Decisión</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {officialRecordsData.rows.map(row => (
                      <tr key={row.studentId} className="hover:bg-slate-50/40">
                        <td className="px-2 py-2 text-center font-bold text-slate-500 print:w-[35px] print:min-w-0 print:text-[8px] print:px-1">{row.ranking}</td>
                        <td className="px-3 py-2 font-bold text-slate-800 print:w-[110px] print:min-w-0 print:text-[8px] print:px-1">{row.studentName}</td>
                        {Object.entries(row.grades).map(([areaName, grade]) => {
                          const isFailed = grade !== null && grade < 3.0;
                          return (
                            <td key={areaName} className={`px-2 py-2 text-center print:min-w-0 print:w-auto print:text-[8px] print:px-1 ${isFailed ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                              {grade?.toFixed(1) ?? '-'}
                            </td>
                          );
                        })}
                        <td className="px-2 py-2 text-center font-extrabold text-slate-900 bg-slate-50/30 print:w-[45px] print:min-w-0 print:text-[8px] print:px-1">{row.promActual.toFixed(2)}</td>
                        {hasP4 && (
                          <td className="px-2 py-2 text-center text-slate-500">P4</td>
                        )}
                        <td className="px-2 py-2 text-center font-bold text-slate-600 print:w-[35px] print:min-w-0 print:text-[8px] print:px-1">{row.failedAreasCount}</td>
                        <td className="px-3 py-2 text-center print:w-[50px] print:min-w-0 print:text-[8px] print:px-1">
                          <span className={`px-2 py-0.5 inline-flex text-[10px] leading-5 font-bold rounded-full ${
                            row.decision === 'Aprobado'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : row.decision === 'Compromisos'
                              ? 'bg-blue-50 text-blue-700 border border-blue-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            {row.decision}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signature layout for printed page */}
              <div className="hidden print:flex justify-between items-center mt-16 px-12 pt-8">
                <div className="text-center w-64 border-t border-slate-400 pt-2">
                  <p className="text-sm font-bold text-slate-800">{officialRecordsData.director}</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Director de Grupo</p>
                </div>
                <div className="text-center w-64 border-t border-slate-400 pt-2">
                  <p className="text-sm font-bold text-slate-800">Comité de Evaluación</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Firma de Coordinación</p>
                </div>
              </div>
            </div>
          )}

        </section>
      </div>
    </div>
  );
};
