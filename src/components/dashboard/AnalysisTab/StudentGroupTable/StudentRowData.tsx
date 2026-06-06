import React from 'react';
import type { PipelineRow, PeriodoNotas, PeriodConfig } from '../../../../domain/types';
import { StatusBadge } from '../../../common/StatusBadge';
import { EditableGradeCell } from '../EditableGradeCell';
import { GoalSeekCell } from '../GoalSeekCell';

export interface StudentRowDataProps {
  row: PipelineRow;
  groupEstudiante: string;
  viewMode: 'area' | 'subject';
  hasP4: boolean;
  activeSimulations: Record<string, Partial<PeriodoNotas>>;
  onSetSimulation: (rowId: string, period: 'P1' | 'P2' | 'P3' | 'P4', value: number | null) => void;
  expandedAreas: Record<string, boolean>;
  onToggleArea: (estudiante: string, area: string) => void;
  config: PeriodConfig;
  evaluated: Record<'P1' | 'P2' | 'P3' | 'P4', boolean>;
}

export const StudentRowData: React.FC<StudentRowDataProps> = ({
  row,
  groupEstudiante,
  viewMode,
  hasP4,
  activeSimulations,
  onSetSimulation,
  expandedAreas,
  onToggleArea,
  config,
  evaluated,
}) => {
  const rowAny = row as import('../../../../domain/types').AugmentedRowArea &
    import('../../../../domain/types').AugmentedRowAsignatura;
  
  const areaKey = `${groupEstudiante}_${row.area}`;
  const isAreaExpanded = expandedAreas[areaKey];

  return (
    <tr className="app-surface-hover">
      <td className="py-2 app-text">
        {viewMode === 'area' && (
          <button
            className="mr-2 app-text-muted hover:app-text app-focus cursor-pointer rounded"
            onClick={() => onToggleArea(groupEstudiante, row.area)}
            aria-label={`Toggle subjects for ${row.area}`}
          >
            {isAreaExpanded ? '📂' : '📁'}
          </button>
        )}
        {viewMode === 'area' ? rowAny.area : rowAny.asignatura}
      </td>
      <td className="py-2 text-center">
        <EditableGradeCell
          rowId={row.id}
          period="P1"
          originalGrade={viewMode === 'area' ? rowAny.defP1 : rowAny.p1}
          simulatedGrade={activeSimulations[row.id]?.P1}
          onSave={onSetSimulation}
        />
      </td>
      <td className="py-2 text-center">
        <EditableGradeCell
          rowId={row.id}
          period="P2"
          originalGrade={viewMode === 'area' ? rowAny.defP2 : rowAny.p2}
          simulatedGrade={activeSimulations[row.id]?.P2}
          onSave={onSetSimulation}
        />
      </td>
      <td className="py-2 text-center">
        <EditableGradeCell
          rowId={row.id}
          period="P3"
          originalGrade={viewMode === 'area' ? rowAny.defP3 : rowAny.p3}
          simulatedGrade={activeSimulations[row.id]?.P3}
          onSave={onSetSimulation}
        />
      </td>
      {hasP4 && (
        <td className="py-2 text-center">
          <EditableGradeCell
            rowId={row.id}
            period="P4"
            originalGrade={viewMode === 'area' ? rowAny.defP4 : rowAny.p4}
            simulatedGrade={activeSimulations[row.id]?.P4}
            onSave={onSetSimulation}
          />
        </td>
      )}
      <td className="py-2 text-center font-bold app-text">
        {viewMode === 'area'
          ? rowAny.defA?.toFixed(2) ?? '-'
          : rowAny.a?.toFixed(2) ?? '-'}
      </td>
      <td
        className="py-2 text-center text-xl"
        title={`Tendencia: ${rowAny.tendencia}`}
      >
        {rowAny.tendencia === 'up'
          ? '↗️'
          : rowAny.tendencia === 'down'
            ? '↘️'
            : rowAny.tendencia === 'flat'
              ? '➡️'
              : '-'}
      </td>
      <td className="py-2 text-center font-semibold app-text">
        <GoalSeekCell
          rowId={row.id}
          currentValue={rowAny.promActual}
          notas={
            viewMode === 'area'
              ? {
                  P1: rowAny.defP1 ?? null,
                  P2: rowAny.defP2 ?? null,
                  P3: rowAny.defP3 ?? null,
                  P4: rowAny.defP4 ?? null,
                }
              : {
                  P1: rowAny.p1 ?? null,
                  P2: rowAny.p2 ?? null,
                  P3: rowAny.p3 ?? null,
                  P4: rowAny.p4 ?? null,
                }
          }
          config={config}
          evaluated={evaluated}
          hasP4={hasP4}
          onGoalSet={onSetSimulation}
        />
      </td>
      <td className="py-2 text-center app-text-muted">
        {rowAny.p4Min !== null &&
        rowAny.p4Min !== undefined &&
        rowAny.p4Min <= 5.0 ? (
          <span
            className="cursor-pointer hover:text-amber-500 transition-colors border-b border-dashed border-amber-300 dark:border-amber-700"
            title="Click para auto-completar nota mínima aprobatoria"
            onClick={() =>
              onSetSimulation(
                row.id,
                hasP4 ? 'P4' : 'P3',
                rowAny.p4Min!,
              )
            }
          >
            {rowAny.p4Min.toFixed(2)}
          </span>
        ) : (
          '-'
        )}
      </td>
      <td className="py-2 text-center">
        <StatusBadge
          text={rowAny.estado.text}
          color={rowAny.estado.color}
        />
        {rowAny.p4Min !== null &&
          rowAny.p4Min !== undefined &&
          rowAny.p4Min > 5.0 && (
            <span
              className="ml-2 cursor-help"
              title={`Requiere ${rowAny.p4Min} en el periodo restante para aprobar`}
            >
              ⚠️
            </span>
          )}
      </td>
    </tr>
  );
};
