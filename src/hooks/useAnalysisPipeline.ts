import { useMemo } from 'react';
import type { StudentGroup, SortConfig, Trend, PipelineRow, RowArea, RowAsignatura } from '../domain/types';
import { useDashboardStore } from '../store/useDashboardStore';

export interface AnalysisFilters {
  search: string;
  area: string;
  status: string;
}


// -- Pure Functions --

export function calculateFailedAreasMap(rowsArea: RowArea[]): Record<string, number> {
  const map: Record<string, number> = {};
  rowsArea.forEach(row => {
    if (row.estado && row.estado.text === 'Perdido') {
      map[row.estudiante] = (map[row.estudiante] || 0) + 1;
    }
  });
  return map;
}

export function augmentRows(rows: (RowArea | RowAsignatura)[], viewMode: 'area' | 'subject') {
  return rows.map((row) => {
    let tendencia: Trend = 'none';
    
    const p1 = viewMode === 'area' ? (row as RowArea).defP1 : (row as RowAsignatura).p1;
    const p2 = viewMode === 'area' ? (row as RowArea).defP2 : (row as RowAsignatura).p2;
    const p3 = viewMode === 'area' ? (row as RowArea).defP3 : (row as RowAsignatura).p3;
    
    if (typeof p3 === 'number') {
      if (typeof p1 === 'number') {
        tendencia = p3 > p1 ? 'up' : p3 < p1 ? 'down' : 'flat';
      }
    } else if (typeof p2 === 'number') {
      if (typeof p1 === 'number') {
        tendencia = p2 > p1 ? 'up' : p2 < p1 ? 'down' : 'flat';
      }
    }

    return {
      ...row,
      tendencia
    };
  });
}

export function filterRows(
  augmentedRows: ReturnType<typeof augmentRows>,
  filters: AnalysisFilters,
  selectedGrupo: string,
  viewMode: 'area' | 'subject'
) {
  return augmentedRows.filter(row => {
    if (selectedGrupo !== 'Todos' && row.grupo !== selectedGrupo) {
      return false;
    }
    if (filters.search && !row.estudiante.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.area) {
      const rowAreaVal = viewMode === 'area' ? (row as RowArea).area : (row as RowAsignatura).asignatura;
      if (rowAreaVal !== filters.area) {
        return false;
      }
    }
    if (filters.status && row.estado.text !== filters.status) {
      return false;
    }
    return true;
  });
}

export function calculateKPIs(filteredRows: ReturnType<typeof augmentRows>) {
  let sum = 0;
  let count = 0;
  const statusCount: Record<string, number> = {};

  filteredRows.forEach(row => {
    if (typeof row.promActual === 'number') {
      sum += row.promActual;
      count++;
    }
    const st = row.estado.text;
    statusCount[st] = (statusCount[st] || 0) + 1;
  });

  return {
    promedioGeneral: count > 0 ? sum / count : 0,
    statusDistribution: statusCount
  };
}

export function groupRows(
  filteredRows: ReturnType<typeof augmentRows>,
  viewMode: 'area' | 'subject',
  failedAreasMap: Record<string, number>
): StudentGroup<PipelineRow>[] {
  const groups: Record<string, StudentGroup<PipelineRow>> = {};

  filteredRows.forEach(row => {
    if (!groups[row.estudiante]) {
      groups[row.estudiante] = {
        estudiante: row.estudiante,
        grupo: row.grupo,
        rows: [],
        aggregates: { defP1: null, defP2: null, defP3: null, promActual: null }
      };
    }
    groups[row.estudiante].rows.push(row as PipelineRow);
  });

  return Object.values(groups).map(group => {
    const calcAvg = (keyArea: string, keySubject: string) => {
      const key = viewMode === 'area' ? keyArea : keySubject;
      let s = 0;
      let c = 0;
      group.rows.forEach((r) => {
        const val = (r as unknown as Record<string, unknown>)[key];
        if (typeof val === 'number') {
          s += val;
          c++;
        }
      });
      return c > 0 ? s / c : null;
    };

    group.aggregates = {
      defP1: calcAvg('defP1', 'p1'),
      defP2: calcAvg('defP2', 'p2'),
      defP3: calcAvg('defP3', 'p3'),
      promActual: calcAvg('promActual', 'promActual')
    };
    
    const failedCount = failedAreasMap[group.estudiante] || 0;
    group.failedAreasCount = failedCount;
    group.isReprobado = failedCount >= 3;

    return group;
  });
}

export function sortGroups(
  grouped: StudentGroup<PipelineRow>[],
  sortConfig: SortConfig | null,
  viewMode: 'area' | 'subject'
): StudentGroup<PipelineRow>[] {
  if (!sortConfig) return grouped;

  const { key, direction } = sortConfig;
  const isDesc = direction === 'desc';
  const modifier = isDesc ? -1 : 1;

  const sortedGroups = [...grouped].sort((a, b) => {
    let valA: string | number | null | undefined;
    let valB: string | number | null | undefined;
    
    const groupKey = key === 'aggregates.promActual' ? 'promActual' : key;
    
    if (['defP1', 'defP2', 'defP3', 'promActual'].includes(groupKey)) {
      valA = (a.aggregates as Record<string, number | null>)[groupKey];
      valB = (b.aggregates as Record<string, number | null>)[groupKey];
    } else {
      valA = a.estudiante;
      valB = b.estudiante;
    }

    if (valA === valB) return 0;
    if (valA === null || valA === undefined) return 1;
    if (valB === null || valB === undefined) return -1;
    if (typeof valA === 'number' && typeof valB === 'number') {
      return (valA - valB) * modifier;
    }
    return String(valA).localeCompare(String(valB)) * modifier;
  });

  sortedGroups.forEach(group => {
    group.rows.sort((a, b) => {
      let rowKey: string = key === 'aggregates.promActual' ? 'promActual' : key;
      
      if (viewMode === 'subject') {
        if (rowKey === 'defP1') rowKey = 'p1';
        if (rowKey === 'defP2') rowKey = 'p2';
        if (rowKey === 'defP3') rowKey = 'p3';
      }

      const valA = (a as unknown as Record<string, unknown>)[rowKey];
      const valB = (b as unknown as Record<string, unknown>)[rowKey];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * modifier;
      }
      return String(valA).localeCompare(String(valB)) * modifier;
    });
  });

  return sortedGroups;
}

// -- React Hook --

export function useAnalysisPipeline(
  rows: (RowArea | RowAsignatura)[],
  selectedGrupo: string,
  filters: AnalysisFilters,
  sortConfig: SortConfig | null,
  viewMode: 'area' | 'subject' = 'area'
) {
  const rowsArea = useDashboardStore(state => state.rowsArea);

  const failedAreasMap = useMemo(() => calculateFailedAreasMap(rowsArea), [rowsArea]);
  const augmentedRows = useMemo(() => augmentRows(rows, viewMode), [rows, viewMode]);
  const filteredRows = useMemo(() => filterRows(augmentedRows, filters, selectedGrupo, viewMode), [augmentedRows, filters, selectedGrupo, viewMode]);
  const kpis = useMemo(() => calculateKPIs(filteredRows), [filteredRows]);
  const grouped = useMemo(() => groupRows(filteredRows, viewMode, failedAreasMap), [filteredRows, viewMode, failedAreasMap]);
  const groupedAndSorted = useMemo(() => sortGroups(grouped, sortConfig, viewMode), [grouped, sortConfig, viewMode]);

  return { groupedAndSorted, kpis };
}

