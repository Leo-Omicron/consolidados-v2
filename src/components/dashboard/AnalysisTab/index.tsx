import React from 'react';

import { useAnalysisTabState } from './useAnalysisTabState';
import { useAnalysisTabData } from './useAnalysisTabData';

import { AnalysisKPIs } from './AnalysisKPIs';
import { SimulationBanner } from './SimulationBanner';
import { SubjectWeightsPanel } from './SubjectWeightsPanel';
import { FiltersBar } from './FiltersBar';
import { StudentGroupTable } from './StudentGroupTable';
import { StudentProfileModal } from '../StudentProfileModal';

export const AnalysisTab: React.FC = () => {
  const state = useAnalysisTabState();
  const data = useAnalysisTabData(
    state.viewMode,
    state.selectedGrupo,
    state.filters,
    state.sortConfig,
    state.profileStudentId
  );

  if (data.activeRowsCount === 0) {
    return <div className="p-8 text-center app-text-muted">No hay datos para analizar. Cargue un archivo Excel.</div>;
  }

  return (
    <div className="p-6 app-text">
      <h2 className="text-xl font-bold mb-6 app-text">Análisis Avanzado</h2>

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
    </div>
  );
};
