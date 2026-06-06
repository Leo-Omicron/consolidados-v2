import React from 'react';
import type { StudentGroup, PipelineRow, SortConfig, RowAsignatura } from '../../../domain/types';
import type { PeriodoNotas, PeriodConfig } from '../../../domain/types';
import { StudentGroupHeader } from './StudentGroupTable/StudentGroupHeader';
import { StudentGroupRow } from './StudentGroupTable/StudentGroupRow';

export interface StudentGroupTableProps {
  sortedGroups: StudentGroup<PipelineRow>[];
  expandedGroups: Record<string, boolean>;
  onToggleGroup: (estudiante: string) => void;
  expandedAreas: Record<string, boolean>;
  onToggleArea: (estudiante: string, area: string) => void;
  activeSimulations: Record<string, Partial<PeriodoNotas>>;
  viewMode: 'area' | 'subject';
  hasP4: boolean;
  evaluated: Record<'P1' | 'P2' | 'P3' | 'P4', boolean>;
  config: PeriodConfig;
  subjectsByStudentArea: Map<string, RowAsignatura[]>;
  onSort: (key: string) => void;
  sortConfig: SortConfig;
  onSetSimulation: (rowId: string, period: 'P1' | 'P2' | 'P3' | 'P4', value: number | null) => void;
  onClearSimulation: (rowId: string) => void;
  /** Callback opcional para abrir la ficha de perfil del estudiante */
  onOpenStudentProfile?: (studentId: string) => void;
}

export const StudentGroupTable: React.FC<StudentGroupTableProps> = ({
  sortedGroups,
  expandedGroups,
  onToggleGroup,
  expandedAreas,
  onToggleArea,
  activeSimulations,
  viewMode,
  hasP4,
  evaluated,
  config,
  subjectsByStudentArea,
  onSort,
  sortConfig,
  onSetSimulation,
  onClearSimulation,
  onOpenStudentProfile,
}) => {
  return (
    <div className="app-surface max-h-[600px] overflow-auto shadow-sm rounded-lg border app-border transition-premium">
      <StudentGroupHeader
        viewMode={viewMode}
        hasP4={hasP4}
        onSort={onSort}
        sortConfig={sortConfig}
      />

      <div className="divide-y app-divide">
        {sortedGroups.length === 0 && (
          <div className="p-8 text-center app-text-muted">
            No se encontraron resultados.
          </div>
        )}
        {sortedGroups.map((group) => (
          <StudentGroupRow
            key={group.estudiante}
            group={group}
            expandedGroups={expandedGroups}
            onToggleGroup={onToggleGroup}
            expandedAreas={expandedAreas}
            onToggleArea={onToggleArea}
            activeSimulations={activeSimulations}
            viewMode={viewMode}
            hasP4={hasP4}
            evaluated={evaluated}
            config={config}
            subjectsByStudentArea={subjectsByStudentArea}
            onSort={onSort}
            sortConfig={sortConfig}
            onSetSimulation={onSetSimulation}
            onClearSimulation={onClearSimulation}
            onOpenStudentProfile={onOpenStudentProfile}
          />
        ))}
      </div>
    </div>
  );
};
