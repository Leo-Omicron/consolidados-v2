import { useMemo } from 'react';
import { RowArea, AugmentedRowArea, StudentGroup, SortConfig, Trend } from '../domain/types';

export interface AnalysisFilters {
  search: string;
  area: string;
  status: string;
}

export function useAnalysisPipeline(
  rows: RowArea[],
  filters: AnalysisFilters,
  sortConfig: SortConfig
) {
  // 1. Augmentation
  const augmentedRows = useMemo(() => {
    return rows.map((row) => {
      let tendencia: Trend = 'none';
      
      const p1 = row.defP1;
      const p2 = row.defP2;
      const p3 = row.defP3;
      
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
  }, [rows]);

  // 2. Filtering
  const filteredRows = useMemo(() => {
    return augmentedRows.filter(row => {
      if (filters.search && !row.estudiante.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.area && row.area !== filters.area) {
        return false;
      }
      if (filters.status && row.estado.text !== filters.status) {
        return false;
      }
      return true;
    });
  }, [augmentedRows, filters]);

  // 3. KPIs
  const kpis = useMemo(() => {
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
  }, [filteredRows]);

  // 4. Grouping
  const grouped = useMemo(() => {
    const groups: Record<string, StudentGroup> = {};

    filteredRows.forEach(row => {
      if (!groups[row.estudiante]) {
        groups[row.estudiante] = {
          estudiante: row.estudiante,
          rows: [],
          aggregates: { defP1: null, defP2: null, defP3: null, promActual: null }
        };
      }
      groups[row.estudiante].rows.push(row);
    });

    // Calculate aggregates safe for nulls
    return Object.values(groups).map(group => {
      const calcAvg = (key: keyof Pick<AugmentedRowArea, 'defP1' | 'defP2' | 'defP3' | 'promActual'>) => {
        let s = 0;
        let c = 0;
        group.rows.forEach(r => {
          const val = r[key];
          if (typeof val === 'number') {
            s += val;
            c++;
          }
        });
        return c > 0 ? s / c : null;
      };

      group.aggregates = {
        defP1: calcAvg('defP1'),
        defP2: calcAvg('defP2'),
        defP3: calcAvg('defP3'),
        promActual: calcAvg('promActual')
      };
      
      return group;
    });
  }, [filteredRows]);

  // 5. Final Sorting
  const groupedAndSorted = useMemo(() => {
    if (!sortConfig) return grouped;

    const { key, direction } = sortConfig;
    const isDesc = direction === 'desc';
    const modifier = isDesc ? -1 : 1;

    const sortedGroups = [...grouped].sort((a, b) => {
      let valA: any, valB: any;
      
      const groupKey = key === 'aggregates.promActual' ? 'promActual' : key;
      
      if (['defP1', 'defP2', 'defP3', 'promActual'].includes(groupKey)) {
        valA = (a.aggregates as any)[groupKey];
        valB = (b.aggregates as any)[groupKey];
      } else {
        valA = a.estudiante;
        valB = b.estudiante;
      }

      if (valA === valB) return 0;
      if (valA === null) return 1;
      if (valB === null) return -1;
      if (valA < valB) return -1 * modifier;
      if (valA > valB) return 1 * modifier;
      return 0;
    });

    // Now sort rows inside each group
    sortedGroups.forEach(group => {
      group.rows.sort((a, b) => {
        const rowKey = key === 'aggregates.promActual' ? 'promActual' : key;
        const valA = a[rowKey as keyof AugmentedRowArea];
        const valB = b[rowKey as keyof AugmentedRowArea];

        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        if (valA < valB) return -1 * modifier;
        if (valA > valB) return 1 * modifier;
        return 0;
      });
    });

    return sortedGroups;
  }, [grouped, sortConfig]);

  return { groupedAndSorted, kpis };
}
