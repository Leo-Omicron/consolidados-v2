import React, { useState, useMemo } from 'react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useAnalysisPipeline } from '../../hooks/useAnalysisPipeline';
import type { AnalysisFilters } from '../../hooks/useAnalysisPipeline';
import type { SortConfig } from '../../domain/types';

export const AnalysisTab: React.FC = () => {
  const rowsArea = useDashboardStore(state => state.rowsArea);
  const rowsAsignatura = useDashboardStore(state => state.rowsAsignatura);
  const viewMode = useDashboardStore(state => state.viewMode);
  const setViewMode = useDashboardStore(state => state.setViewMode);
  const config = useDashboardStore(state => state.config);
  const selectedGrupo = useDashboardStore(state => state.selectedGrupo);
  const setGrupo = useDashboardStore(state => state.setGrupo);
  const availableGroups = useDashboardStore(state => state.availableGroups);
  const subjectWeights = useDashboardStore(state => state.subjectWeights);
  
  const [filters, setFilters] = useState<AnalysisFilters>({ search: '', area: '', status: '' });
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  
  const hasP4 = config.P4 !== undefined && config.P4 > 0;
  
  const activeRows = (viewMode === 'area' ? rowsArea : rowsAsignatura) || [];

  const weightsToDisplay = useMemo(() => {
    const firstVal = Object.values(subjectWeights)[0];
    const isNested = firstVal && typeof firstVal === 'object' && Object.values(firstVal).some(v => v && typeof v === 'object');

    if (!isNested) {
      return { '': subjectWeights };
    }

    if (selectedGrupo === 'Todos') {
      return subjectWeights;
    }
    return selectedGrupo && (subjectWeights as any)[selectedGrupo] 
      ? { [selectedGrupo]: (subjectWeights as any)[selectedGrupo] } 
      : {};
  }, [subjectWeights, selectedGrupo]);
  
  const { groupedAndSorted, kpis } = useAnalysisPipeline(activeRows, selectedGrupo, filters, sortConfig, viewMode);
  
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (estudiante: string) => {
    setExpandedGroups(prev => ({ ...prev, [estudiante]: !prev[estudiante] }));
  };

  const handleSort = (key: any) => {
    setSortConfig(prev => {
      if (prev && prev.key === key) {
        if (prev.direction === 'desc') return { key, direction: 'asc' };
        return null;
      }
      return { key, direction: 'desc' };
    });
  };

  const uniqueAreas = useMemo(() => {
    return Array.from(new Set(activeRows.map((r: any) => viewMode === 'area' ? r.area : r.asignatura))).sort();
  }, [activeRows, viewMode]);
  const uniqueStatuses = useMemo(() => Array.from(new Set(activeRows.map(r => r.estado.text))).sort(), [activeRows]);

  if (activeRows.length === 0) {
    return <div className="p-8 text-center text-gray-500">No hay datos para analizar. Cargue un archivo Excel.</div>;
  }

  const getSortIcon = (key: any) => {
    if (sortConfig?.key !== key) return '↕️';
    return sortConfig?.direction === 'desc' ? '⬇️' : '⬆️';
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-6">Análisis Avanzado</h2>

      {/* View Mode Toggle */}
      <div className="flex mb-6 space-x-2">
        <button
          className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${viewMode === 'area' ? 'bg-indigo-600 text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          onClick={() => setViewMode('area')}
        >
          Áreas
        </button>
        <button
          className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${viewMode === 'subject' ? 'bg-indigo-600 text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          onClick={() => setViewMode('subject')}
        >
          Asignaturas
        </button>
      </div>
      
      {/* Inferred Weights */}
      {Object.keys(weightsToDisplay).length > 0 && (
        <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">Pesos de Asignaturas Inferidos</h3>
          <div className="space-y-3">
            {Object.entries(weightsToDisplay).map(([grupo, areas]) => (
              <div key={grupo} className="flex flex-col space-y-1">
                {grupo && (
                  <span className="text-xs font-bold text-blue-600 uppercase">Grupo {grupo}:</span>
                )}
                <div className="flex flex-wrap gap-3">
                  {Object.entries(areas).map(([area, asigs]) => (
                    <div key={area} className="bg-white px-3 py-1.5 rounded shadow-sm text-sm border border-blue-100 flex items-center">
                      <span className="font-bold text-gray-700">{area}:</span>
                      <span className="ml-2 text-gray-600">
                        {Object.entries(asigs as Record<string, number>).map(([asig, w]) => `${asig}: ${Math.round(w * 100)}%`).join(' | ')}
                      </span>
                    </div>
                  ))}
                  {Object.keys(areas).length === 0 && (
                    <span className="text-sm text-gray-400">Sin pesos configurados</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Grupo</label>
          <select 
            className="border border-gray-300 rounded px-3 py-1 bg-white"
            value={selectedGrupo}
            onChange={e => setGrupo(e.target.value)}
          >
            {availableGroups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Buscar estudiante</label>
          <input 
            type="text" 
            className="border border-gray-300 rounded px-3 py-1"
            value={filters.search}
            onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Ej: Perez"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">{viewMode === 'area' ? 'Área' : 'Asignatura'}</label>
          <select 
            className="border border-gray-300 rounded px-3 py-1"
            value={filters.area}
            onChange={e => setFilters(prev => ({ ...prev, area: e.target.value }))}
          >
            <option value="">Todas</option>
            {uniqueAreas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Estado</label>
          <select 
            className="border border-gray-300 rounded px-3 py-1"
            value={filters.status}
            onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">Todos</option>
            {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col justify-center items-center">
          <div className="text-gray-500 text-sm font-medium uppercase mb-1">Grupo Activo</div>
          <div className="text-2xl font-bold text-indigo-600">{selectedGrupo === 'Todos' ? 'Todos los grupos' : `Grupo ${selectedGrupo}`}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col justify-center items-center">
          <div className="text-gray-500 text-sm font-medium uppercase mb-1">Promedio General</div>
          <div className="text-3xl font-bold text-blue-600">{kpis.promedioGeneral.toFixed(2)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-gray-500 text-sm font-medium uppercase mb-2 text-center">Distribución de Estados</div>
          <div className="flex flex-wrap gap-2 justify-center">
            {Object.entries(kpis.statusDistribution).map(([status, count]) => (
              <div key={status} className="bg-gray-100 px-3 py-1 rounded text-sm">
                <span className="font-semibold">{status}:</span> {count}
              </div>
            ))}
            {Object.keys(kpis.statusDistribution).length === 0 && (
              <div className="text-gray-400 text-sm">No hay datos</div>
            )}
          </div>
        </div>
      </div>

      {/* Grouped Table List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-gray-100 px-4 py-3 border-b flex font-semibold text-sm text-gray-700">
          <div className="w-1/3 cursor-pointer select-none" onClick={() => handleSort('estudiante')}>
            Estudiante {getSortIcon('estudiante')}
          </div>
          <div className="flex-1 text-center">{viewMode === 'area' ? 'Áreas' : 'Asignaturas'}</div>
          <div className="w-24 text-right cursor-pointer select-none" onClick={() => handleSort('aggregates.promActual')}>
            Prom. {getSortIcon('aggregates.promActual')}
          </div>
        </div>
        
        <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
          {groupedAndSorted.length === 0 && (
            <div className="p-8 text-center text-gray-500">No se encontraron resultados.</div>
          )}
          {groupedAndSorted.map(group => {
            const isExpanded = expandedGroups[group.estudiante];
            
            return (
              <div key={group.estudiante} className="flex flex-col">
                <div 
                  className="px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => toggleGroup(group.estudiante)}
                >
                  <div className="w-1/3 font-medium text-gray-900 flex items-center">
                    <span className="mr-2 text-gray-400">{isExpanded ? '▼' : '▶'}</span>
                    {group.estudiante}
                    {group.isReprobado && (
                      <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full font-bold">
                        Año Reprobado ({group.failedAreasCount} Áreas)
                      </span>
                    )}
                  </div>
                  <div className="flex-1 text-center text-sm text-gray-500">
                    {group.rows.length} {group.rows.length === 1 ? (viewMode === 'area' ? 'área' : 'asignatura') : (viewMode === 'area' ? 'áreas' : 'asignaturas')}
                  </div>
                  <div className="w-24 text-right font-bold text-gray-700">
                    {group.aggregates.promActual?.toFixed(2) ?? '-'}
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="bg-gray-50 px-4 py-3 border-t border-b border-gray-100">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead>
                        <tr className="text-gray-500 text-left">
                          <th className="font-medium pb-2 w-1/4">{viewMode === 'area' ? 'Área' : 'Asignatura'}</th>
                          <th className="font-medium pb-2 w-1/12 text-center cursor-pointer select-none" onClick={() => handleSort(viewMode === 'area' ? 'defP1' : 'p1')}>
                            P1 {getSortIcon(viewMode === 'area' ? 'defP1' : 'p1')}
                          </th>
                          <th className="font-medium pb-2 w-1/12 text-center cursor-pointer select-none" onClick={() => handleSort(viewMode === 'area' ? 'defP2' : 'p2')}>
                            P2 {getSortIcon(viewMode === 'area' ? 'defP2' : 'p2')}
                          </th>
                          <th className="font-medium pb-2 w-1/12 text-center cursor-pointer select-none" onClick={() => handleSort(viewMode === 'area' ? 'defP3' : 'p3')}>
                            P3 {getSortIcon(viewMode === 'area' ? 'defP3' : 'p3')}
                          </th>
                          {hasP4 && (
                            <th className="font-medium pb-2 w-1/12 text-center">P4</th>
                          )}
                          <th className="font-medium pb-2 w-1/12 text-center cursor-pointer select-none" onClick={() => handleSort('tendencia')}>
                            Tendencia {getSortIcon('tendencia')}
                          </th>
                          <th className="font-medium pb-2 w-1/12 text-center cursor-pointer select-none" onClick={() => handleSort('promActual')}>
                            Prom {getSortIcon('promActual')}
                          </th>
                          <th className="font-medium pb-2 w-1/12 text-center cursor-pointer select-none" onClick={() => handleSort('p4Min')}>
                            {hasP4 ? 'Mín. P4' : 'Mín. P3'} {getSortIcon('p4Min')}
                          </th>
                          <th className="font-medium pb-2 w-1/4 text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {group.rows.map((row: any, idx) => (
                          <tr key={idx} className="hover:bg-white">
                            <td className="py-2 text-gray-700">{viewMode === 'area' ? row.area : row.asignatura}</td>
                            <td className="py-2 text-center text-gray-600">{(viewMode === 'area' ? row.defP1 : row.p1)?.toFixed(2) ?? '-'}</td>
                            <td className="py-2 text-center text-gray-600">{(viewMode === 'area' ? row.defP2 : row.p2)?.toFixed(2) ?? '-'}</td>
                            <td className="py-2 text-center text-gray-600">{(viewMode === 'area' ? row.defP3 : row.p3)?.toFixed(2) ?? '-'}</td>
                            {hasP4 && (
                              <td className="py-2 text-center text-gray-600">{(viewMode === 'area' ? row.defP4 : row.p4)?.toFixed(2) ?? '-'}</td>
                            )}
                            <td className="py-2 text-center text-xl" title={`Tendencia: ${row.tendencia}`}>
                              {row.tendencia === 'up' ? '↗️' : row.tendencia === 'down' ? '↘️' : row.tendencia === 'flat' ? '➡️' : '-'}
                            </td>
                             <td className="py-2 text-center font-medium text-gray-900">{row.promActual?.toFixed(2) ?? '-'}</td>
                             <td className="py-2 text-center text-gray-600">
                               {row.p4Min !== null && row.p4Min !== undefined && row.p4Min <= 5.0 ? row.p4Min.toFixed(2) : '-'}
                             </td>
                             <td className="py-2 text-center">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                row.estado.color === 'green' ? 'bg-green-100 text-green-800' :
                                row.estado.color === 'red' ? 'bg-red-100 text-red-800' :
                                row.estado.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                row.estado.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                                row.estado.color === 'cyan' ? 'bg-cyan-100 text-cyan-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {row.estado.text}
                              </span>
                              {row.p4Min !== null && row.p4Min > 5.0 && (
                                <span 
                                  className="ml-2 cursor-help" 
                                  title={`Requiere ${row.p4Min} en el periodo restante para aprobar`}
                                >
                                  ⚠️
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
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
