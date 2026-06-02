import React, { useState, useMemo, useEffect } from 'react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useAnalysisPipeline, augmentRows, calculateKPIs } from '../../hooks/useAnalysisPipeline';
import type { SubjectWeightConfig } from '../../domain/types';
import { useUIStore } from '../../store/useUIStore';
import { useSimulationStore } from '../../store/useSimulationStore';
import { getSimulatedRows } from '../../services/simulationLogic';
import { getEvaluatedPeriods } from '../../services/academicLogic';

import { AnalysisKPIs } from './AnalysisTab/AnalysisKPIs';
import { SimulationBanner } from './AnalysisTab/SimulationBanner';
import { SubjectWeightsPanel } from './AnalysisTab/SubjectWeightsPanel';
import { FiltersBar } from './AnalysisTab/FiltersBar';
import { StudentGroupTable } from './AnalysisTab/StudentGroupTable';

export const AnalysisTab: React.FC = () => {
  const estudiantes = useDashboardStore(state => state.estudiantes);
  const rowsArea = useDashboardStore(state => state.rowsArea);
  const rowsAsignatura = useDashboardStore(state => state.rowsAsignatura);
  const viewMode = useDashboardStore(state => state.viewMode);
  const setViewMode = useDashboardStore(state => state.setViewMode);
  const config = useDashboardStore(state => state.config) as import('../../domain/types').PeriodConfig;
  const selectedGrupo = useDashboardStore(state => state.selectedGrupo);
  const setGrupo = useDashboardStore(state => state.setGrupo);
  const availableGroups = useDashboardStore(state => state.availableGroups);
  const subjectWeights = useDashboardStore(state => state.subjectWeights);
  
  const filters = useUIStore(state => state.analysisFilters);
  const setFilters = useUIStore(state => state.setAnalysisFilters);
  const sortConfig = useUIStore(state => state.analysisSortConfig);
  const setSortConfig = useUIStore(state => state.setAnalysisSortConfig);
  const [isWeightsExpanded, setIsWeightsExpanded] = useState(false);

  const activeSimulations = useSimulationStore(state => state.activeSimulations);
  const setSimulation = useSimulationStore(state => state.setSimulation);
  const clearSimulation = useSimulationStore(state => state.clearSimulation);
  const clearAllSimulations = useSimulationStore(state => state.clearAllSimulations);
  const exportToHash = useSimulationStore(state => state.exportToHash);
  const importFromHash = useSimulationStore(state => state.importFromHash);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#sim=')) {
        const success = importFromHash(hash);
        if (success) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
    };

    // Run on mount
    handleHashChange();

    // Listen for manual hash changes (pasting URL)
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [importFromHash]);


  const hasP4 = config.P4 !== undefined && config.P4 > 0;
  
  const evaluated = useMemo(() => getEvaluatedPeriods(estudiantes || []) as Record<'P1' | 'P2' | 'P3' | 'P4', boolean>, [estudiantes]);
  
  const simulatedData = useMemo(() => {
    return getSimulatedRows(estudiantes, activeSimulations, config, subjectWeights);
  }, [estudiantes, activeSimulations, config, subjectWeights]);

  const currentRowsArea = simulatedData ? simulatedData.rowsArea : rowsArea;
  const currentRowsAsignatura = simulatedData ? simulatedData.rowsAsignatura : rowsAsignatura;

  const activeRows = useMemo(() => {
    return (viewMode === 'area' ? currentRowsArea : currentRowsAsignatura) || [];
  }, [viewMode, currentRowsArea, currentRowsAsignatura]);

  const weightsToDisplay = useMemo(() => {
    const firstVal = Object.values(subjectWeights)[0];
    const isNested = firstVal && typeof firstVal === 'object' && Object.values(firstVal).some(v => v && typeof v === 'object');

    if (!isNested) {
      return { '': subjectWeights } as unknown as Record<string, Record<string, Record<string, number>>>;
    }

    if (selectedGrupo === 'Todos') {
      return subjectWeights as unknown as Record<string, Record<string, Record<string, number>>>;
    }
    return selectedGrupo && (subjectWeights as SubjectWeightConfig)[selectedGrupo] 
      ? { [selectedGrupo]: (subjectWeights as SubjectWeightConfig)[selectedGrupo] } as unknown as Record<string, Record<string, Record<string, number>>>
      : {};
  }, [subjectWeights, selectedGrupo]);
  
  const originalKpis = useMemo(() => {
    const raw = viewMode === 'area' ? rowsArea : rowsAsignatura;
    if (!raw || raw.length === 0) return { promedioGeneral: 0, statusDistribution: {} };
    return calculateKPIs(augmentRows(raw, viewMode));
  }, [rowsArea, rowsAsignatura, viewMode]);

  const { groupedAndSorted: sortedGroups, kpis } = useAnalysisPipeline(
    activeRows, 
    selectedGrupo, 
    filters, 
    sortConfig, 
    currentRowsArea || [],
    viewMode
  );

  const subjectsByStudentArea = useMemo(() => {
    const map = new Map<string, import('../../domain/types').RowAsignatura[]>();
    if (viewMode === 'subject') return map; // optimization
    for (const asig of (currentRowsAsignatura || [])) {
      const key = `${asig.estudiante}_${asig.area}`;
      let list = map.get(key);
      if (!list) {
        list = [];
        map.set(key, list);
      }
      list.push(asig);
    }
    return map;
  }, [currentRowsAsignatura, viewMode]);
  
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (estudiante: string) => {
    setExpandedGroups(prev => ({ ...prev, [estudiante]: !prev[estudiante] }));
  };

  const [expandedAreas, setExpandedAreas] = useState<Record<string, boolean>>({});

  const toggleArea = (estudiante: string, area: string) => {
    const key = `${estudiante}_${area}`;
    setExpandedAreas(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev && prev.key === key) {
        if (prev.direction === 'desc') return { key, direction: 'asc' };
        return null;
      }
      return { key, direction: 'desc' };
    });
  };

  const uniqueAreas = useMemo(() => {
    return Array.from(new Set(activeRows.map((r: { area?: string; asignatura?: string }) => viewMode === 'area' ? r.area : r.asignatura)))
      .filter((val): val is string => val !== undefined)
      .sort();
  }, [activeRows, viewMode]);
  const uniqueStatuses = useMemo(() => Array.from(new Set(activeRows.map(r => r.estado.text))).sort(), [activeRows]);

  if (activeRows.length === 0) {
    return <div className="p-8 text-center app-text-muted">No hay datos para analizar. Cargue un archivo Excel.</div>;
  }

  return (
    <div className="p-6 app-text">
      <h2 className="text-xl font-bold mb-6 app-text">Análisis Avanzado</h2>

      <SimulationBanner
        activeCount={Object.keys(activeSimulations).length}
        onExportHash={exportToHash}
        onClearAll={clearAllSimulations}
      />

      {/* View Mode Toggle */}
      <div className="flex mb-6 space-x-2">
        <button
          type="button"
          aria-pressed={viewMode === 'area'}
          className={`px-4 py-2 rounded-md font-medium text-sm border app-focus transition-premium ${viewMode === 'area' ? 'app-tab-active shadow' : 'app-tab-inactive border-transparent'}`}
          onClick={() => setViewMode('area')}
        >
          Áreas
        </button>
        <button
          type="button"
          aria-pressed={viewMode === 'subject'}
          className={`px-4 py-2 rounded-md font-medium text-sm border app-focus transition-premium ${viewMode === 'subject' ? 'app-tab-active shadow' : 'app-tab-inactive border-transparent'}`}
          onClick={() => setViewMode('subject')}
        >
          Asignaturas
        </button>
      </div>
      
      {/* Inferred Weights Collapsible Accordion */}
      <SubjectWeightsPanel
        weights={weightsToDisplay}
        isExpanded={isWeightsExpanded}
        onToggle={() => setIsWeightsExpanded(!isWeightsExpanded)}
      />

      {/* Filters */}
      <FiltersBar
        selectedGrupo={selectedGrupo}
        availableGroups={availableGroups}
        onGroupChange={setGrupo}
        filters={filters}
        onFiltersChange={setFilters}
        uniqueAreas={uniqueAreas}
        uniqueStatuses={uniqueStatuses}
        viewMode={viewMode}
      />

      {/* KPIs */}
      <AnalysisKPIs 
        selectedGrupo={selectedGrupo}
        kpis={kpis}
        originalKpis={originalKpis}
        activeSimulations={activeSimulations}
        viewMode={viewMode}
      />

      {/* Grouped Table List */}
      <StudentGroupTable
        sortedGroups={sortedGroups}
        expandedGroups={expandedGroups}
        onToggleGroup={toggleGroup}
        expandedAreas={expandedAreas}
        onToggleArea={toggleArea}
        activeSimulations={activeSimulations}
        viewMode={viewMode}
        hasP4={hasP4}
        evaluated={evaluated}
        config={config}
        subjectsByStudentArea={subjectsByStudentArea}
        onSort={handleSort}
        sortConfig={sortConfig}
        onSetSimulation={setSimulation}
        onClearSimulation={clearSimulation}
      />
    </div>
  );
};
