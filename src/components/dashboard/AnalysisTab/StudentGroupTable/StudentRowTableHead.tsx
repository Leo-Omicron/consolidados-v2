import React from 'react';
import type { SortConfig } from '../../../../domain/types';
import { getSortIcon } from './sortIcon';

export interface StudentRowTableHeadProps {
  viewMode: 'area' | 'subject';
  hasP4: boolean;
  onSort: (key: string) => void;
  sortConfig: SortConfig | null;
}

export const StudentRowTableHead: React.FC<StudentRowTableHeadProps> = ({
  viewMode,
  hasP4,
  onSort,
  sortConfig,
}) => {
  return (
    <thead className="sticky top-0 z-10 app-surface-muted backdrop-blur-md border-b app-border">
      <tr className="app-text-muted text-left">
        <th className="font-semibold pb-2 w-1/4">
          {viewMode === 'area' ? 'Área' : 'Asignatura'}
        </th>
        <th
          className="font-semibold pb-2 w-1/12 text-center cursor-pointer select-none"
          onClick={() => onSort(viewMode === 'area' ? 'defP1' : 'p1')}
        >
          P1 {getSortIcon(viewMode === 'area' ? 'defP1' : 'p1', sortConfig)}
        </th>
        <th
          className="font-semibold pb-2 w-1/12 text-center cursor-pointer select-none"
          onClick={() => onSort(viewMode === 'area' ? 'defP2' : 'p2')}
        >
          P2 {getSortIcon(viewMode === 'area' ? 'defP2' : 'p2', sortConfig)}
        </th>
        <th
          className="font-semibold pb-2 w-1/12 text-center cursor-pointer select-none"
          onClick={() => onSort(viewMode === 'area' ? 'defP3' : 'p3')}
        >
          P3 {getSortIcon(viewMode === 'area' ? 'defP3' : 'p3', sortConfig)}
        </th>
        {hasP4 && (
          <th
            className="font-semibold pb-2 w-1/12 text-center cursor-pointer select-none"
            onClick={() => onSort(viewMode === 'area' ? 'defP4' : 'p4')}
          >
            P4 {getSortIcon(viewMode === 'area' ? 'defP4' : 'p4', sortConfig)}
          </th>
        )}
        <th className="font-semibold pb-2 w-1/12 text-center">Acum.</th>
        <th
          className="font-semibold pb-2 w-1/12 text-center cursor-pointer select-none"
          onClick={() => onSort('tendencia')}
        >
          Tendencia {getSortIcon('tendencia', sortConfig)}
        </th>
        <th
          className="font-semibold pb-2 w-1/12 text-center cursor-pointer select-none"
          onClick={() => onSort('promActual')}
        >
          Prom.Calc {getSortIcon('promActual', sortConfig)}
        </th>
        <th
          className="font-semibold pb-2 w-1/12 text-center cursor-pointer select-none"
          onClick={() => onSort('p4Min')}
        >
          {hasP4 ? 'Mín. P4' : 'Mín. P3'}{' '}
          {getSortIcon('p4Min', sortConfig)}
        </th>
        <th className="font-semibold pb-2 w-1/4 text-center">Estado</th>
      </tr>
    </thead>
  );
};
