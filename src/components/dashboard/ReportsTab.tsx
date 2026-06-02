import React, { Suspense, lazy, startTransition } from 'react';
import { useReportsLogic } from './ReportsTab/useReportsLogic';
import { useUIStore } from '../../store/useUIStore';

const GroupPerformanceView = lazy(() => import('./ReportsTab/views/GroupPerformanceView').then(m => ({ default: m.GroupPerformanceView })));
const OutstandingStudentsView = lazy(() => import('./ReportsTab/views/OutstandingStudentsView').then(m => ({ default: m.OutstandingStudentsView })));
const AcademicRiskView = lazy(() => import('./ReportsTab/views/AcademicRiskView').then(m => ({ default: m.AcademicRiskView })));
const SubjectAnalyticsView = lazy(() => import('./ReportsTab/views/SubjectAnalyticsView').then(m => ({ default: m.SubjectAnalyticsView })));
const GroupComparisonView = lazy(() => import('./ReportsTab/views/GroupComparisonView').then(m => ({ default: m.GroupComparisonView })));
const HeatmapView = lazy(() => import('./ReportsTab/views/HeatmapView').then(m => ({ default: m.HeatmapView })));
const TeacherFeedbackView = lazy(() => import('./ReportsTab/views/TeacherFeedbackView').then(m => ({ default: m.TeacherFeedbackView })));
const OfficialRecordsView = lazy(() => import('./ReportsTab/views/OfficialRecordsView').then(m => ({ default: m.OfficialRecordsView })));
const InsightsTab = lazy(() => import('./InsightsTab').then(m => ({ default: m.InsightsTab })));

const menuItems = [
  { id: 'group-performance', label: 'Rendimiento Grupal', icon: '📈' },
  { id: 'outstanding', label: 'Estudiantes Destacados', icon: '✨' },
  { id: 'academic-risk', label: 'Riesgo Académico', icon: '⚠️' },
  { id: 'subject-analytics', label: 'Análisis de Asignaturas', icon: '📊' },
  { id: 'group-comparison', label: 'Comparativa de Grupos', icon: '⚖️' },
  { id: 'heatmap', label: 'Mapa de Calor', icon: '🌡️' },
  { id: 'feedback', label: 'Retroalimentación', icon: '💬' },
  { id: 'official', label: 'Registro Oficial', icon: '📋' },
  { id: 'insights', label: 'Oracle Insights', icon: '🔮' },
] as const;

export const ReportsTab: React.FC = () => {
  const logic = useReportsLogic();
  const setActiveTab = useUIStore(state => state.setReportsActiveTab);

  if (logic.estudiantes.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        No hay datos para generar reportes. Cargue un archivo Excel.
      </div>
    );
  }

  return (
    <div className={`p-6 transition-premium max-w-7xl mx-auto app-text print:p-0 ${logic.printLayoutClass}`}>
      {/* Top action bar: hidden when printing */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 no-print print:hidden">
        <div>
          <h2 className="text-2xl font-bold app-text tracking-tight">Reportes Institucionales de Calificaciones</h2>
          <p className="text-sm app-text-muted mt-1">Análisis robustos, listados de riesgo y plantillas listas para impresión física.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {logic.selectedGrupo === 'Todos' && logic.activeTab !== 'group-comparison' && (
            <div className="flex items-center gap-2">
              <label htmlFor="reports-group-filter" className="text-xs font-bold app-text-muted uppercase">Filtrar Grupo:</label>
              <select
                id="reports-group-filter"
                value={logic.activeGroupToUse}
                onChange={e => logic.setLocalGroup(e.target.value)}
                className="border app-control app-focus rounded-xl px-3 py-2 text-sm"
              >
                {logic.availableGroups.filter((g: string) => g !== 'Todos').map((g: string) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          )}
          {logic.activeTab === 'group-comparison' && (
            <div className="flex items-center gap-2 text-sm text-slate-500 italic px-2">
               Este reporte compara todos los grupos; no requiere filtro individual.
            </div>
          )}
          <button 
            onClick={logic.handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
          >
            📊 Exportar Excel
          </button>
          <button 
            onClick={(e) => {
              if (!logic.canExportConsolidadoCompleto) {
                e.preventDefault();
                return;
              }
              logic.handleExportConsolidadoCompleto();
            }}
            aria-disabled={!logic.canExportConsolidadoCompleto}
            className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
              logic.canExportConsolidadoCompleto 
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer' 
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
            title={logic.activeTab === 'group-comparison' ? "Consolidado Completo no disponible para Comparativa de Grupos" : "Descarga los 7 reportes del grupo en un único archivo de Excel"}
          >
            📦 Consolidado Completo
          </button>
          <button 
            onClick={logic.handlePrint}
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
                  onClick={() => startTransition(() => setActiveTab(item.id))}
                  aria-pressed={logic.activeTab === item.id}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                    logic.activeTab === item.id
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
              IEEC - Consolidado Institucional {logic.periodName && `(${logic.periodName.toUpperCase()})`}
            </h1>
            <p className="text-sm text-slate-600 mt-1">Soporte de Calificaciones Académicas y Comités de Evaluación</p>
            <div className="flex justify-between items-center text-xs text-slate-500 mt-3 px-2">
              <span>Grupo: {logic.activeTab === 'group-comparison' ? 'Todos los grupos' : logic.activeGroupToUse}</span>
              <span>Reporte: {menuItems.find(m => m.id === logic.activeTab)?.label}</span>
              <span>Emisión: {new Date().toLocaleDateString()}</span>
            </div>
          </div>

          <Suspense fallback={<div className="p-8 text-center text-slate-500">Cargando reporte...</div>}>
            {logic.activeTab === 'group-performance' && <GroupPerformanceView data={logic.groupPerformanceData} />}
            {logic.activeTab === 'outstanding' && <OutstandingStudentsView data={logic.outstandingStudentsData} />}
            {logic.activeTab === 'academic-risk' && <AcademicRiskView data={logic.academicRiskData} />}
            {logic.activeTab === 'subject-analytics' && <SubjectAnalyticsView data={logic.subjectAnalyticsData} />}
            {logic.activeTab === 'group-comparison' && <GroupComparisonView data={logic.groupComparisonData} />}
            {logic.activeTab === 'heatmap' && <HeatmapView data={logic.heatmapData} />}
            {logic.activeTab === 'feedback' && <TeacherFeedbackView data={logic.teacherFeedbackData} logic={logic} />}
            {logic.activeTab === 'official' && <OfficialRecordsView data={logic.officialRecordsData} logic={logic} />}
            {logic.activeTab === 'insights' && <InsightsTab />}
          </Suspense>

        </section>
      </div>
    </div>
  );
};
