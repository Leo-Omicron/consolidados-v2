import { useMemo } from 'react';
import { useDashboardStore } from '../../../store/useDashboardStore';
import { useSimulationStore } from '../../../store/useSimulationStore';
import { useInsights } from '../../../hooks/useInsights';
import { useAnalysisPipeline, augmentRows, calculateKPIs } from '../../../hooks/useAnalysisPipeline';
import { getSimulatedRows } from '../../../services/simulationLogic';
import { getEvaluatedPeriods } from '../../../services/academicLogic';
import { buildStudentProfileData } from '../../../services/studentProfileService';
import type { PeriodConfig, ArchetypeResult, SubjectWeightConfig, RowAsignatura } from '../../../domain/types';
import type { AnalysisFilters, SortConfig } from '../../../store/useUIStore';

export const useAnalysisTabData = (
  viewMode: 'area' | 'subject',
  selectedGrupo: string,
  filters: AnalysisFilters,
  sortConfig: SortConfig,
  profileStudentId: string | null
) => {
  const estudiantes = useDashboardStore(state => state.estudiantes);
  const rowsArea = useDashboardStore(state => state.rowsArea);
  const rowsAsignatura = useDashboardStore(state => state.rowsAsignatura);
  const config = useDashboardStore(state => state.config) as PeriodConfig;
  const subjectWeights = useDashboardStore(state => state.subjectWeights);
  const activeSimulations = useSimulationStore(state => state.activeSimulations);

  const hasP4 = config.P4 !== undefined && config.P4 > 0;
  
  const evaluated = useMemo(() => getEvaluatedPeriods(estudiantes || []) as Record<'P1' | 'P2' | 'P3' | 'P4', boolean>, [estudiantes]);

  const { results: insightsResults } = useInsights();

  const profileData = useMemo(() => {
    if (!profileStudentId) return null;
    return buildStudentProfileData(
      profileStudentId,
      estudiantes,
      insightsResults as ArchetypeResult[],
      activeSimulations,
      config,
      subjectWeights,
    );
  }, [profileStudentId, estudiantes, insightsResults, activeSimulations, config, subjectWeights]);
  
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
    const map = new Map<string, RowAsignatura[]>();
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

  const uniqueAreas = useMemo(() => {
    return Array.from(new Set(activeRows.map((r: { area?: string; asignatura?: string }) => viewMode === 'area' ? r.area : r.asignatura)))
      .filter((val): val is string => val !== undefined)
      .sort();
  }, [activeRows, viewMode]);

  const uniqueStatuses = useMemo(() => Array.from(new Set(activeRows.map(r => r.estado.text))).sort(), [activeRows]);

  return {
    hasP4,
    evaluated,
    profileData,
    weightsToDisplay,
    originalKpis,
    sortedGroups,
    kpis,
    subjectsByStudentArea,
    uniqueAreas,
    uniqueStatuses,
    activeRowsCount: activeRows.length,
    activeSimulations,
    config
  };
};
