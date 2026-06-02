import React from 'react';

interface FiltersState {
  search: string;
  area: string;
  status: string;
}

export interface FiltersBarProps {
  selectedGrupo: string;
  availableGroups: string[];
  onGroupChange: (grupo: string) => void;
  filters: FiltersState;
  onFiltersChange: (updater: (prev: FiltersState) => FiltersState) => void;
  uniqueAreas: string[];
  uniqueStatuses: string[];
  viewMode: 'area' | 'subject';
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  selectedGrupo,
  availableGroups,
  onGroupChange,
  filters,
  onFiltersChange,
  uniqueAreas,
  uniqueStatuses,
  viewMode,
}) => {
  const areaLabel = viewMode === 'area' ? 'Área' : 'Asignatura';

  return (
    <div className="flex flex-wrap gap-4 mb-6 app-surface-muted p-4 rounded-lg border app-border">
      <div className="flex flex-col">
        <label htmlFor="analysis-group-filter" className="text-sm app-text-muted mb-1">Grupo</label>
        <select
          id="analysis-group-filter"
          className="border app-control app-focus rounded px-3 py-1"
          value={selectedGrupo}
          onChange={e => onGroupChange(e.target.value)}
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
          onChange={e => onFiltersChange(prev => ({ ...prev, search: e.target.value }))}
          placeholder="Ej: Perez"
        />
      </div>
      <div className="flex flex-col">
        <label htmlFor="analysis-area-filter" className="text-sm app-text-muted mb-1">{areaLabel}</label>
        <select
          id="analysis-area-filter"
          className="border app-control app-focus rounded px-3 py-1"
          value={filters.area}
          onChange={e => onFiltersChange(prev => ({ ...prev, area: e.target.value }))}
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
          onChange={e => onFiltersChange(prev => ({ ...prev, status: e.target.value }))}
        >
          <option value="">Todos</option>
          {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </div>
  );
};
