import React from 'react';
import type { StudentGroup, PipelineRow, SortConfig, RowAsignatura, PeriodoNotas, PeriodConfig } from '../../../../domain/types';
import { StudentRowHeader } from './StudentRowHeader';
import { StudentRowTableHead } from './StudentRowTableHead';
import { StudentRowData } from './StudentRowData';
import { StudentAreaSubtable } from './StudentAreaSubtable';

export interface StudentGroupRowProps {
  group: StudentGroup<PipelineRow>;
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
  sortConfig: SortConfig | null;
  onSetSimulation: (rowId: string, period: 'P1' | 'P2' | 'P3' | 'P4', value: number | null) => void;
  onClearSimulation: (rowId: string) => void;
  onOpenStudentProfile?: (studentId: string) => void;
}

export const StudentGroupRow: React.FC<StudentGroupRowProps> = ({
  group,
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
  const isGroupAtRisk = group.rows.some(
    (r) => r.estado.text === 'Perdido' || r.estado.text === 'En riesgo'
  );
  const isExpanded = expandedGroups[group.estudiante] ?? isGroupAtRisk;
  const hasStudentSimulations = group.rows.some(
    (row) => {
      if (activeSimulations[row.id] !== undefined) return true;
      const areaKey = `${group.estudiante}_${row.area}`;
      const subjects = subjectsByStudentArea.get(areaKey) || [];
      return subjects.some((sub) => activeSimulations[sub.id] !== undefined);
    }
  );

  return (
    <div className="flex flex-col">
      <StudentRowHeader
        group={group}
        isExpanded={isExpanded}
        onToggleGroup={onToggleGroup}
        viewMode={viewMode}
        hasStudentSimulations={hasStudentSimulations}
        subjectsByStudentArea={subjectsByStudentArea}
        onClearSimulation={onClearSimulation}
        onOpenStudentProfile={onOpenStudentProfile}
      />

      {isExpanded && (
        <div className="app-surface-muted px-4 py-3 border-t border-b app-border">
          <table className="min-w-full divide-y app-divide text-sm">
            <StudentRowTableHead
              viewMode={viewMode}
              hasP4={hasP4}
              onSort={onSort}
              sortConfig={sortConfig}
            />
            <tbody className="divide-y app-divide">
              {group.rows.map((row: PipelineRow, idx) => {
                const areaKey = `${group.estudiante}_${row.area}`;
                const isAreaExpanded = expandedAreas[areaKey];
                const subjects = subjectsByStudentArea.get(areaKey) || [];

                return (
                  <React.Fragment key={idx}>
                    <StudentRowData
                      row={row}
                      groupEstudiante={group.estudiante}
                      viewMode={viewMode}
                      hasP4={hasP4}
                      activeSimulations={activeSimulations}
                      onSetSimulation={onSetSimulation}
                      expandedAreas={expandedAreas}
                      onToggleArea={onToggleArea}
                      config={config}
                      evaluated={evaluated}
                    />
                    {viewMode === 'area' && isAreaExpanded && (
                      <tr className="app-surface-muted">
                        <td colSpan={hasP4 ? 10 : 9} className="p-3 pl-8">
                          <StudentAreaSubtable
                            subjects={subjects}
                            hasP4={hasP4}
                            activeSimulations={activeSimulations}
                            onSetSimulation={onSetSimulation}
                            config={config}
                            evaluated={evaluated}
                          />
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
};
