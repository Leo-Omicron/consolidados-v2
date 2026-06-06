import React from 'react';
import type { SortConfig } from '../../../../domain/types';
import { getSortIcon } from './sortIcon';

export interface StudentGroupHeaderProps {
  viewMode: 'area' | 'subject';
  onSort: (key: string) => void;
  sortConfig: SortConfig | null;
}

export const StudentGroupHeader: React.FC<StudentGroupHeaderProps> = ({
  viewMode,
  onSort,
  sortConfig,
}) => {
  return (
    <div className="sticky top-0 z-10 app-surface-muted backdrop-blur-md px-4 py-3 border-b app-border flex font-semibold text-sm app-text transition-premium shadow-sm">
      <div
        className="w-1/3 cursor-pointer select-none"
        onClick={() => onSort('estudiante')}
      >
        Estudiante {getSortIcon('estudiante', sortConfig)}
      </div>
      <div className="flex-1 text-center">
        {viewMode === 'area' ? 'Áreas' : 'Asignaturas'}
      </div>
      <div
        className="w-24 text-right cursor-pointer select-none"
        onClick={() => onSort('aggregates.promActual')}
      >
        Prom. {getSortIcon('aggregates.promActual', sortConfig)}
      </div>
    </div>
  );
};
