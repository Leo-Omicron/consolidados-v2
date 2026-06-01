import React, { useState, useMemo, useEffect } from 'react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useAnalysisPipeline } from '../../hooks/useAnalysisPipeline';
import type { SubjectWeightConfig, Trend, MetricasDesempeño } from '../../domain/types';
import { useUIStore } from '../../store/useUIStore';
import { useSimulationStore } from '../../store/useSimulationStore';
import { getSimulatedRows } from '../../services/simulationLogic';
import { getEvaluatedPeriods } from '../../services/academicLogic';

import { StatusBadge } from '../common/StatusBadge';
import { EditableGradeCell } from './AnalysisTab/EditableGradeCell';
import { GoalSeekCell } from './AnalysisTab/GoalSeekCell';
import { AnalysisKPIs } from './AnalysisTab/AnalysisKPIs';

export const AnalysisTab: React.FC = () => {
  const estudiantes = useDashboardStore(state => state.estudiantes);
  const rowsArea = useDashboardStore(state => state.rowsArea);
  const rowsAsignatura = useDashboardStore(state => state.rowsAsignatura);
  const viewMode = useDashboardStore(state => state.viewMode);
  const setViewMode = useDashboardStore(state => state.setViewMode);
  const config = useDashboardStore(state => state.config);
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
  
  const evaluated = useMemo(() => getEvaluatedPeriods(estudiantes || []), [estudiantes]);
  
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
      return { '': subjectWeights };
    }

    if (selectedGrupo === 'Todos') {
      return subjectWeights;
    }
    return selectedGrupo && (subjectWeights as SubjectWeightConfig)[selectedGrupo] 
      ? { [selectedGrupo]: (subjectWeights as SubjectWeightConfig)[selectedGrupo] } 
      : {};
  }, [subjectWeights, selectedGrupo]);
  
  const { kpis: originalKpis } = useAnalysisPipeline(
    (viewMode === 'area' ? rowsArea : rowsAsignatura) || [],
    selectedGrupo, filters, sortConfig, viewMode
  );

  const { groupedAndSorted: sortedGroups, kpis } = useAnalysisPipeline(
    activeRows, 
    selectedGrupo, 
    filters, 
    sortConfig, 
    viewMode
  );

  const subjectsByStudentArea = useMemo(() => {
    const map = new Map<string, typeof currentRowsAsignatura>();
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
    return Array.from(new Set(activeRows.map((r: { area?: string; asignatura?: string }) => viewMode === 'area' ? r.area : r.asignatura))).sort();
  }, [activeRows, viewMode]);
  const uniqueStatuses = useMemo(() => Array.from(new Set(activeRows.map(r => r.estado.text))).sort(), [activeRows]);

  if (activeRows.length === 0) {
    return <div className="p-8 text-center app-text-muted">No hay datos para analizar. Cargue un archivo Excel.</div>;
  }

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return '↕️';
    return sortConfig?.direction === 'desc' ? '⬇️' : '⬆️';
  };

  return (
    <div className="p-6 app-text">
      <h2 className="text-xl font-bold mb-6 app-text">Análisis Avanzado</h2>

      {Object.keys(activeSimulations).length > 0 && (
        <div className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/50 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-xl">🧪</span>
            <div>
              <h4 className="font-bold text-amber-950 dark:text-amber-200 text-sm">Modo de Simulación Activo</h4>
              <p className="text-xs text-amber-800 dark:text-amber-400">Estás viendo promedios e indicadores académicos hipotéticos. Los datos reales no se han alterado.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => {
                const hash = exportToHash();
                const url = new URL(window.location.href);
                url.hash = `sim=${hash}`;
                navigator.clipboard.writeText(url.toString());
                alert('¡Enlace de simulación copiado al portapapeles! Cualquiera con este enlace verá estas mismas simulaciones.');
              }}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-indigo-300 dark:border-indigo-800 bg-white dark:bg-neutral-900 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 transition-premium cursor-pointer shadow-sm app-focus"
              title="Copia un enlace para compartir estas simulaciones"
            >
              🔗 Compartir URL
            </button>
            <button
              onClick={clearAllSimulations}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-neutral-900 hover:bg-amber-100 dark:hover:bg-amber-950 text-amber-900 dark:text-amber-200 transition-premium cursor-pointer shadow-sm app-focus"
            >
              Restaurar datos reales
            </button>
          </div>
        </div>
      )}

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
      {Object.keys(weightsToDisplay).length > 0 && (
        <div className="mb-6 app-surface rounded-2xl border app-border shadow-premium overflow-hidden transition-all duration-300">
          <button
            onClick={() => setIsWeightsExpanded(!isWeightsExpanded)}
            className="w-full px-5 py-4 flex items-center justify-between app-surface-muted app-surface-hover transition-colors font-bold app-text text-sm border-b app-border cursor-pointer app-focus"
          >
            <span className="flex items-center gap-2">
              <span>📋</span> {isWeightsExpanded ? 'Ocultar Pesos de Asignaturas Inferidos' : 'Ver Pesos de Asignaturas Inferidos'}
            </span>
            <span className={`transform transition-transform duration-300 ${isWeightsExpanded ? 'rotate-180' : 'rotate-0'}`}>
              ▼
            </span>
          </button>
          {isWeightsExpanded && (
            <div className="p-5 border-t app-border transition-all duration-300">
              <div className="space-y-4">
                {Object.entries(weightsToDisplay).map(([grupo, areas]) => (
                  <div key={grupo} className="flex flex-col space-y-1">
                    {grupo && (
                      <span className="text-xs font-bold app-text uppercase tracking-wider">Grupo {grupo}:</span>
                    )}
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(areas).map(([area, asigs]) => (
                        <div key={area} className="app-surface-muted px-3.5 py-2 rounded-xl border app-border text-xs flex items-center">
                          <span className="font-bold app-text">{area}:</span>
                          <span className="ml-2 app-text-muted font-medium">
                            {Object.entries(asigs as Record<string, number>).map(([asig, w]) => `${asig}: ${Math.round(w * 100)}%`).join(' | ')}
                          </span>
                        </div>
                      ))}
                      {Object.keys(areas).length === 0 && (
                        <span className="text-sm app-text-muted">Sin pesos configurados</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 app-surface-muted p-4 rounded-lg border app-border">
        <div className="flex flex-col">
          <label htmlFor="analysis-group-filter" className="text-sm app-text-muted mb-1">Grupo</label>
          <select 
            id="analysis-group-filter"
            className="border app-control app-focus rounded px-3 py-1"
            value={selectedGrupo}
            onChange={e => setGrupo(e.target.value)}
          >
            {availableGroups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div className="flex flex-col">
          <label htmlFor="analysis-search-filter" className="text-sm app-text-muted mb-1">Buscar estudiante</label>
          <input 
            type="text" 
            id="analysis-search-filter"
            className="border app-control app-focus rounded px-3 py-1"
            value={filters.search}
            onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Ej: Perez"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="analysis-area-filter" className="text-sm app-text-muted mb-1">{viewMode === 'area' ? 'Área' : 'Asignatura'}</label>
          <select 
            id="analysis-area-filter"
            className="border app-control app-focus rounded px-3 py-1"
            value={filters.area}
            onChange={e => setFilters(prev => ({ ...prev, area: e.target.value }))}
          >
            <option value="">Todas</option>
            {uniqueAreas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="flex flex-col">
          <label htmlFor="analysis-status-filter" className="text-sm app-text-muted mb-1">Estado</label>
          <select 
            id="analysis-status-filter"
            className="border app-control app-focus rounded px-3 py-1"
            value={filters.status}
            onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">Todos</option>
            {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* KPIs */}
      <AnalysisKPIs 
        selectedGrupo={selectedGrupo}
        kpis={kpis}
        originalKpis={originalKpis}
        activeSimulations={activeSimulations}
        viewMode={viewMode}
      />

      {/* Grouped Table List */}
      <div className="app-surface max-h-[600px] overflow-auto shadow-sm rounded-lg border app-border transition-premium">
        <div className="sticky top-0 z-10 app-surface-muted backdrop-blur-md px-4 py-3 border-b app-border flex font-semibold text-sm app-text transition-premium shadow-sm">
          <div className="w-1/3 cursor-pointer select-none" onClick={() => handleSort('estudiante')}>
            Estudiante {getSortIcon('estudiante')}
          </div>
          <div className="flex-1 text-center">{viewMode === 'area' ? 'Áreas' : 'Asignaturas'}</div>
          <div className="w-24 text-right cursor-pointer select-none" onClick={() => handleSort('aggregates.promActual')}>
            Prom. {getSortIcon('aggregates.promActual')}
          </div>
        </div>
        
        <div className="divide-y app-divide">
          {sortedGroups.length === 0 && (
            <div className="p-8 text-center app-text-muted">No se encontraron resultados.</div>
          )}
          {sortedGroups.map(group => {
            const isGroupAtRisk = group.rows.some(r => r.estado.text === 'Perdido' || r.estado.text === 'En riesgo');
            const isExpanded = expandedGroups[group.estudiante] ?? isGroupAtRisk;
            const hasStudentSimulations = group.rows.some(row => activeSimulations[row.id] !== undefined);
            
            return (
              <div key={group.estudiante} className="flex flex-col">
                <div 
                  className="px-4 py-3 flex items-center justify-between app-surface app-surface-hover cursor-pointer transition-premium"
                  onClick={() => toggleGroup(group.estudiante)}
                >
                  <div className="w-1/3 font-semibold app-text flex items-center">
                    <span className={`mr-2.5 app-text-muted transform transition-transform duration-300 inline-block ${isExpanded ? 'rotate-90' : ''}`}>
                      ▶
                    </span>
                    {group.estudiante}
                    {group.isReprobado && (
                      <span className="ml-2 app-status-red border text-xs px-2 py-0.5 rounded-full font-bold">
                        Año Reprobado ({group.failedAreasCount} {group.failedAreasCount === 1 ? 'Área' : 'Áreas'})
                      </span>
                    )}
                    {group.rows[0]?.desempeños && (
                      <span className="ml-2 flex gap-1">
                        {group.rows[0].desempeños.BAJ > 0 && <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.5 rounded">BAJ: {group.rows[0].desempeños.BAJ}</span>}
                        {group.rows[0].desempeños.BAS > 0 && <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">BAS: {group.rows[0].desempeños.BAS}</span>}
                        {group.rows[0].desempeños.ALT > 0 && <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">ALT: {group.rows[0].desempeños.ALT}</span>}
                        {group.rows[0].desempeños.SUP > 0 && <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded">SUP: {group.rows[0].desempeños.SUP}</span>}
                      </span>
                    )}
                    {hasStudentSimulations && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          group.rows.forEach(row => clearSimulation(row.id));
                        }}
                        className="ml-3 px-2 py-0.5 text-[10px] font-bold uppercase rounded border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors cursor-pointer shadow-sm app-focus"
                        title="Restaurar notas reales de este estudiante"
                      >
                        Restaurar
                      </button>
                    )}
                  </div>
                  <div className="flex-1 text-center text-sm app-text-muted">
                    {group.rows.length} {group.rows.length === 1 ? (viewMode === 'area' ? 'área' : 'asignatura') : (viewMode === 'area' ? 'áreas' : 'asignaturas')}
                  </div>
                  <div className="w-32 text-right font-bold app-text flex flex-col">
                    <span>Calc: {group.aggregates.promActual?.toFixed(2) ?? '-'}</span>
                    {group.rows[0]?.oficialPRO !== undefined && group.rows[0]?.oficialPRO !== null && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400">PRO Ofic: {group.rows[0].oficialPRO.toFixed(2)}</span>
                    )}
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="app-surface-muted px-4 py-3 border-t border-b app-border">
                    <table className="min-w-full divide-y app-divide text-sm">
                      <thead className="sticky top-0 z-10 app-surface-muted backdrop-blur-md border-b app-border">
                        <tr className="app-text-muted text-left">
                          <th className="font-semibold pb-2 w-1/4">{viewMode === 'area' ? 'Área' : 'Asignatura'}</th>
                          <th className="font-semibold pb-2 w-1/12 text-center cursor-pointer select-none" onClick={() => handleSort(viewMode === 'area' ? 'defP1' : 'p1')}>
                            P1 {getSortIcon(viewMode === 'area' ? 'defP1' : 'p1')}
                          </th>
                          <th className="font-semibold pb-2 w-1/12 text-center cursor-pointer select-none" onClick={() => handleSort(viewMode === 'area' ? 'defP2' : 'p2')}>
                            P2 {getSortIcon(viewMode === 'area' ? 'defP2' : 'p2')}
                          </th>
                          <th className="font-semibold pb-2 w-1/12 text-center cursor-pointer select-none" onClick={() => handleSort(viewMode === 'area' ? 'defP3' : 'p3')}>
                            P3 {getSortIcon(viewMode === 'area' ? 'defP3' : 'p3')}
                          </th>
                          {hasP4 && (
                            <th className="font-semibold pb-2 w-1/12 text-center">P4</th>
                          )}
                          <th className="font-semibold pb-2 w-1/12 text-center">
                            Acum.
                          </th>
                          <th className="font-semibold pb-2 w-1/12 text-center cursor-pointer select-none" onClick={() => handleSort('tendencia')}>
                            Tendencia {getSortIcon('tendencia')}
                          </th>
                          <th className="font-semibold pb-2 w-1/12 text-center cursor-pointer select-none" onClick={() => handleSort('promActual')}>
                            Prom.Calc {getSortIcon('promActual')}
                          </th>
                          <th className="font-semibold pb-2 w-1/12 text-center cursor-pointer select-none" onClick={() => handleSort('p4Min')}>
                            {hasP4 ? 'Mín. P4' : 'Mín. P3'} {getSortIcon('p4Min')}
                          </th>
                          <th className="font-semibold pb-2 w-1/4 text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y app-divide">
                        {group.rows.map((row: {
                          id: string;
                          area: string;
                          asignatura?: string;
                          defP1?: number | null;
                          p1?: number | null;
                          defP2?: number | null;
                          p2?: number | null;
                          defP3?: number | null;
                          p3?: number | null;
                          defP4?: number | null;
                          p4?: number | null;
                          defA?: number | null;
                          a?: number | null;
                          tendencia: Trend;
                          promActual: number | null;
                          oficialPRO?: number | null;
                          oficialRAK?: number | null;
                          desempeños?: MetricasDesempeño | null;
                          p4Min: number | null;
                          estado: { text: string; color: string };
                        }, idx) => {
                          const areaKey = `${group.estudiante}_${row.area}`;
                          const isAreaExpanded = expandedAreas[areaKey];
                          const subjects = subjectsByStudentArea.get(areaKey) || [];

                          return (
                            <React.Fragment key={idx}>
                              <tr className="app-surface-hover">
                                <td className="py-2 app-text">
                                  {viewMode === 'area' && (
                                    <button
                                      className="mr-2 app-text-muted hover:app-text app-focus cursor-pointer rounded"
                                      onClick={() => toggleArea(group.estudiante, row.area)}
                                      aria-label={`Toggle subjects for ${row.area}`}
                                    >
                                      {isAreaExpanded ? '📂' : '📁'}
                                    </button>
                                  )}
                                  {viewMode === 'area' ? row.area : row.asignatura}
                                </td>
                                <td className="py-2 text-center">
                                  <EditableGradeCell
                                    rowId={row.id}
                                    period="P1"
                                    originalGrade={viewMode === 'area' ? row.defP1 : row.p1}
                                    simulatedGrade={activeSimulations[row.id]?.P1}
                                    onSave={setSimulation}
                                  />
                                </td>
                                <td className="py-2 text-center">
                                  <EditableGradeCell
                                    rowId={row.id}
                                    period="P2"
                                    originalGrade={viewMode === 'area' ? row.defP2 : row.p2}
                                    simulatedGrade={activeSimulations[row.id]?.P2}
                                    onSave={setSimulation}
                                  />
                                </td>
                                <td className="py-2 text-center">
                                  <EditableGradeCell
                                    rowId={row.id}
                                    period="P3"
                                    originalGrade={viewMode === 'area' ? row.defP3 : row.p3}
                                    simulatedGrade={activeSimulations[row.id]?.P3}
                                    onSave={setSimulation}
                                  />
                                </td>
                                {hasP4 && (
                                  <td className="py-2 text-center">
                                    <EditableGradeCell
                                      rowId={row.id}
                                      period="P4"
                                      originalGrade={viewMode === 'area' ? row.defP4 : row.p4}
                                      simulatedGrade={activeSimulations[row.id]?.P4}
                                      onSave={setSimulation}
                                    />
                                  </td>
                                )}
                                <td className="py-2 text-center font-bold app-text">
                                  {viewMode === 'area' ? row.defA?.toFixed(2) ?? '-' : row.a?.toFixed(2) ?? '-'}
                                </td>
                                <td className="py-2 text-center text-xl" title={`Tendencia: ${row.tendencia}`}>
                                  {row.tendencia === 'up' ? '↗️' : row.tendencia === 'down' ? '↘️' : row.tendencia === 'flat' ? '➡️' : '-'}
                                </td>
                                <td className="py-2 text-center font-semibold app-text">
                                  <GoalSeekCell
                                    rowId={row.id}
                                    currentValue={row.promActual}
                                    notas={viewMode === 'area' ? { P1: row.defP1 ?? null, P2: row.defP2 ?? null, P3: row.defP3 ?? null, P4: row.defP4 ?? null } : { P1: row.p1 ?? null, P2: row.p2 ?? null, P3: row.p3 ?? null, P4: row.p4 ?? null }}
                                    config={config}
                                    evaluated={evaluated}
                                    hasP4={hasP4}
                                    onGoalSet={setSimulation}
                                  />
                                </td>
                                <td className="py-2 text-center app-text-muted">
                                  {row.p4Min !== null && row.p4Min !== undefined && row.p4Min <= 5.0 ? (
                                    <span 
                                      className="cursor-pointer hover:text-amber-500 transition-colors border-b border-dashed border-amber-300 dark:border-amber-700" 
                                      title="Click para auto-completar nota mínima aprobatoria"
                                      onClick={() => setSimulation(row.id, hasP4 ? 'P4' : 'P3', row.p4Min!)}
                                    >
                                      {row.p4Min.toFixed(2)}
                                    </span>
                                  ) : '-'}
                                </td>
                                <td className="py-2 text-center">
                                  <StatusBadge text={row.estado.text} color={row.estado.color} />
                                  {row.p4Min !== null && row.p4Min !== undefined && row.p4Min > 5.0 && (
                                    <span 
                                      className="ml-2 cursor-help" 
                                      title={`Requiere ${row.p4Min} en el periodo restante para aprobar`}
                                    >
                                      ⚠️
                                    </span>
                                  )}
                                </td>
                              </tr>
                              {viewMode === 'area' && isAreaExpanded && (
                                <tr className="app-surface-muted">
                                  <td colSpan={hasP4 ? 9 : 8} className="p-3 pl-8">
                                    <div className="border app-border rounded-xl overflow-hidden app-surface shadow-sm transition-premium">
                                      <table className="min-w-full text-xs">
                                        <thead className="app-surface-muted border-b app-border">
                                          <tr className="app-text-muted text-left">
                                            <th className="font-semibold p-2 pl-4">Asignatura</th>
                                            <th className="font-semibold p-2 text-center">P1</th>
                                            <th className="font-semibold p-2 text-center">P2</th>
                                            <th className="font-semibold p-2 text-center">P3</th>
                                            {hasP4 && <th className="font-semibold p-2 text-center">P4</th>}
                                            <th className="font-semibold p-2 text-center">Acum.</th>
                                            <th className="font-semibold p-2 text-center">Tendencia</th>
                                            <th className="font-semibold p-2 text-center">Prom.Calc</th>
                                            <th className="font-semibold p-2 text-center">{hasP4 ? 'Mín. P4' : 'Mín. P3'}</th>
                                            <th className="font-semibold p-2 text-center">Estado</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y app-divide">
                                          {subjects.map((sub, sIdx) => {
                                            let subTendencia: Trend = 'none';
                                            const p1 = sub.p1;
                                            const p2 = sub.p2;
                                            const p3 = sub.p3;
                                            if (typeof p3 === 'number') {
                                              if (typeof p1 === 'number') {
                                                subTendencia = p3 > p1 ? 'up' : p3 < p1 ? 'down' : 'flat';
                                              }
                                            } else if (typeof p2 === 'number') {
                                              if (typeof p1 === 'number') {
                                                subTendencia = p2 > p1 ? 'up' : p2 < p1 ? 'down' : 'flat';
                                              }
                                            }

                                            return (
                                              <tr key={sIdx} className="app-surface-hover">
                                                <td className="p-2 pl-4 app-text font-semibold">{sub.asignatura}</td>
                                                <td className="p-2 text-center">
                                                  <EditableGradeCell
                                                    rowId={sub.id}
                                                    period="P1"
                                                    originalGrade={sub.p1}
                                                    simulatedGrade={activeSimulations[sub.id]?.P1}
                                                    onSave={setSimulation}
                                                  />
                                                </td>
                                                <td className="p-2 text-center">
                                                  <EditableGradeCell
                                                    rowId={sub.id}
                                                    period="P2"
                                                    originalGrade={sub.p2}
                                                    simulatedGrade={activeSimulations[sub.id]?.P2}
                                                    onSave={setSimulation}
                                                  />
                                                </td>
                                                <td className="p-2 text-center">
                                                  <EditableGradeCell
                                                    rowId={sub.id}
                                                    period="P3"
                                                    originalGrade={sub.p3}
                                                    simulatedGrade={activeSimulations[sub.id]?.P3}
                                                    onSave={setSimulation}
                                                  />
                                                </td>
                                                {hasP4 && (
                                                  <td className="p-2 text-center">
                                                    <EditableGradeCell
                                                      rowId={sub.id}
                                                      period="P4"
                                                      originalGrade={sub.p4}
                                                      simulatedGrade={activeSimulations[sub.id]?.P4}
                                                      onSave={setSimulation}
                                                    />
                                                  </td>
                                                )}
                                                <td className="p-2 text-center font-bold app-text">
                                                  {sub.a?.toFixed(2) ?? '-'}
                                                </td>
                                                <td className="p-2 text-center text-base" title={`Tendencia: ${subTendencia}`}>
                                                  {subTendencia === 'up' ? '↗️' : subTendencia === 'down' ? '↘️' : subTendencia === 'flat' ? '➡️' : '-'}
                                                </td>
                                                <td className="p-2 text-center font-semibold app-text">
                                                  <GoalSeekCell
                                                    rowId={sub.id}
                                                    currentValue={sub.promActual}
                                                    notas={{ P1: sub.p1 ?? null, P2: sub.p2 ?? null, P3: sub.p3 ?? null, P4: sub.p4 ?? null }}
                                                    config={config}
                                                    evaluated={evaluated}
                                                    hasP4={hasP4}
                                                    onGoalSet={setSimulation}
                                                  />
                                                </td>
                                                <td className="p-2 text-center app-text-muted">
                                                  {sub.p4Min !== null && sub.p4Min !== undefined && sub.p4Min <= 5.0 ? (
                                                    <span 
                                                      className="cursor-pointer hover:text-amber-500 transition-colors border-b border-dashed border-amber-300 dark:border-amber-700" 
                                                      title="Click para auto-completar nota mínima aprobatoria"
                                                      onClick={() => setSimulation(sub.id, hasP4 ? 'P4' : 'P3', sub.p4Min!)}
                                                    >
                                                      {sub.p4Min.toFixed(2)}
                                                    </span>
                                                  ) : '-'}
                                                </td>
                                                <td className="p-2 text-center">
                                                  <StatusBadge text={sub.estado.text} color={sub.estado.color} isMini />
                                                </td>
                                              </tr>
                                            );
                                          })}
                                          {subjects.length === 0 && (
                                            <tr>
                                              <td colSpan={hasP4 ? 9 : 8} className="p-4 text-center app-text-muted">
                                                No hay asignaturas para esta área.
                                              </td>
                                            </tr>
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
