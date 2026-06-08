import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

import { useAnalysisTabState } from './useAnalysisTabState';
import { useAnalysisTabData } from './useAnalysisTabData';

import { AnalysisKPIs } from './AnalysisKPIs';
import { SimulationBanner } from './SimulationBanner';
import { SubjectWeightsPanel } from './SubjectWeightsPanel';
import { FiltersBar } from './FiltersBar';
import { StudentGroupTable } from './StudentGroupTable';
import { StudentProfileModal } from '../StudentProfileModal';
import { BatchStudentProfilesPrint } from '../BatchStudentProfilesPrint';

export const AnalysisTab: React.FC = () => {
  const state = useAnalysisTabState();
  const data = useAnalysisTabData(
    state.viewMode,
    state.selectedGrupo,
    state.filters,
    state.sortConfig,
    state.profileStudentId
  );

  const batchPrintRef = useRef<HTMLDivElement>(null);
  const handlePrintBatch = useReactToPrint({
    contentRef: batchPrintRef,
    documentTitle: `Fichas_Grupo_${state.selectedGrupo}`,
    pageStyle: `
      @page { size: auto; margin: 10mm; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    `,
  });

  if (data.activeRowsCount === 0) {
    return <div className="p-8 text-center app-text-muted">No hay datos para analizar. Cargue un archivo Excel.</div>;
  }

  return (
    <div className="p-6 app-text">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold app-text">Análisis Avanzado</h2>
        <div className="relative group">
          <button
            onClick={() => handlePrintBatch()}
            disabled={state.selectedGrupo === 'Todos' || data.fullProfiles.length === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            🖨️ Exportar Fichas (PDF)
          </button>
          {state.selectedGrupo === 'Todos' && (
            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-64 bg-slate-800 text-white text-xs rounded py-1 px-2 text-center shadow-lg pointer-events-none z-10">
              Debes seleccionar un curso específico para exportar las fichas masivamente.
            </div>
          )}
        </div>
      </div>

      <SimulationBanner
        activeCount={Object.keys(data.activeSimulations).length}
        onExportHash={state.exportToHash}
        onClearAll={state.clearAllSimulations}
      />

      {/* View Mode Toggle */}
      <div className="flex mb-6 space-x-2">
        <button
          type="button"
          aria-pressed={state.viewMode === 'area'}
          className={`px-4 py-2 rounded-md font-medium text-sm border app-focus transition-premium ${state.viewMode === 'area' ? 'app-tab-active shadow' : 'app-tab-inactive border-transparent'}`}
          onClick={() => state.setViewMode('area')}
        >
          Áreas
        </button>
        <button
          type="button"
          aria-pressed={state.viewMode === 'subject'}
          className={`px-4 py-2 rounded-md font-medium text-sm border app-focus transition-premium ${state.viewMode === 'subject' ? 'app-tab-active shadow' : 'app-tab-inactive border-transparent'}`}
          onClick={() => state.setViewMode('subject')}
        >
          Asignaturas
        </button>
      </div>
      
      {/* Inferred Weights Collapsible Accordion */}
      <SubjectWeightsPanel
        weights={data.weightsToDisplay}
        isExpanded={state.isWeightsExpanded}
        onToggle={() => state.setIsWeightsExpanded(!state.isWeightsExpanded)}
      />

      {/* Filters */}
      <FiltersBar
        selectedGrupo={state.selectedGrupo}
        availableGroups={state.availableGroups}
        onGroupChange={state.setGrupo}
        filters={state.filters}
        onFiltersChange={state.setFilters}
        uniqueAreas={data.uniqueAreas}
        uniqueStatuses={data.uniqueStatuses}
        viewMode={state.viewMode}
      />

      {/* KPIs */}
      <AnalysisKPIs 
        selectedGrupo={state.selectedGrupo}
        kpis={data.kpis}
        originalKpis={data.originalKpis}
        activeSimulations={data.activeSimulations}
        viewMode={state.viewMode}
      />

      {/* Grouped Table List */}
      <StudentGroupTable
        sortedGroups={data.sortedGroups}
        expandedGroups={state.expandedGroups}
        onToggleGroup={state.toggleGroup}
        expandedAreas={state.expandedAreas}
        onToggleArea={state.toggleArea}
        activeSimulations={data.activeSimulations}
        viewMode={state.viewMode}
        hasP4={data.hasP4}
        evaluated={data.evaluated}
        config={data.config}
        subjectsByStudentArea={data.subjectsByStudentArea}
        onSort={state.handleSort}
        sortConfig={state.sortConfig}
        onSetSimulation={state.setSimulation}
        onClearSimulation={state.clearSimulation}
        onOpenStudentProfile={state.setProfileStudentId}
      />

      {/* Student Profile Modal */}
      <StudentProfileModal
        profileData={data.profileData}
        isOpen={state.profileStudentId !== null}
        onClose={() => state.setProfileStudentId(null)}
      />

      {/* Hidden Print Container for Batch Export (off-screen so Chart.js can measure it) */}
      <div className="absolute top-[-9999px] left-[-9999px] w-[1024px] opacity-0 pointer-events-none">
        <BatchStudentProfilesPrint 
          ref={batchPrintRef} 
          profiles={data.fullProfiles} 
        />
      </div>
    </div>
  );
};
