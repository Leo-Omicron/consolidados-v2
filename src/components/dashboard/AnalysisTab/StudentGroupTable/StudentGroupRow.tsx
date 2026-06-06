import React from 'react';
import type { StudentGroup, PipelineRow, SortConfig, RowAsignatura, PeriodoNotas, PeriodConfig } from '../../../../domain/types';
import { StatusBadge } from '../../../common/StatusBadge';
import { EditableGradeCell } from '../EditableGradeCell';
import { GoalSeekCell } from '../GoalSeekCell';
import { determineAcademicTrend } from '../../../../services/academicLogic';
import { parseRowId } from '../../../../services/rowIdentity';
import { getSortIcon } from './sortIcon';

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
  const studentId =
    parseRowId(group.rows[0]?.id ?? '')?.studentId ?? group.estudiante;

  return (
    <div className="flex flex-col">
      <div
        className="px-4 py-3 flex items-center justify-between app-surface app-surface-hover cursor-pointer transition-premium"
        onClick={() => onToggleGroup(group.estudiante)}
      >
        <div className="w-1/3 font-semibold app-text flex items-center">
          <span
            className={`mr-2.5 app-text-muted transform transition-transform duration-300 inline-block ${
              isExpanded ? 'rotate-90' : ''
            }`}
          >
            ▶
          </span>
          {group.estudiante}
          {group.isReprobado && (
            <span className="ml-2 app-status-red border text-xs px-2 py-0.5 rounded-full font-bold">
              Año Reprobado ({group.failedAreasCount}{' '}
              {group.failedAreasCount === 1 ? 'Área' : 'Áreas'})
            </span>
          )}
          {group.rows[0]?.desempeños && (
            <span className="ml-2 flex gap-1">
              {group.rows[0].desempeños.BAJ > 0 && (
                <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  BAJ: {group.rows[0].desempeños.BAJ}
                </span>
              )}
              {group.rows[0].desempeños.BAS > 0 && (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  BAS: {group.rows[0].desempeños.BAS}
                </span>
              )}
              {group.rows[0].desempeños.ALT > 0 && (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  ALT: {group.rows[0].desempeños.ALT}
                </span>
              )}
              {group.rows[0].desempeños.SUP > 0 && (
                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  SUP: {group.rows[0].desempeños.SUP}
                </span>
              )}
            </span>
          )}
          {hasStudentSimulations && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                group.rows.forEach((row) => {
                  onClearSimulation(row.id);
                  const areaKey = `${group.estudiante}_${row.area}`;
                  const subjects = subjectsByStudentArea.get(areaKey) || [];
                  subjects.forEach((sub) => onClearSimulation(sub.id));
                });
              }}
              className="ml-3 px-2 py-0.5 text-[10px] font-bold uppercase rounded border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors cursor-pointer shadow-sm app-focus"
              title="Restaurar notas reales de este estudiante"
            >
              Restaurar
            </button>
          )}
          {onOpenStudentProfile && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenStudentProfile(studentId);
              }}
              className="ml-2 px-2 py-0.5 text-[10px] font-bold uppercase rounded border border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors cursor-pointer shadow-sm app-focus"
              title="Ver ficha del estudiante"
            >
              Ficha
            </button>
          )}
        </div>
        <div className="flex-1 text-center text-sm app-text-muted">
          {group.rows.length}{' '}
          {group.rows.length === 1
            ? viewMode === 'area'
              ? 'área'
              : 'asignatura'
            : viewMode === 'area'
              ? 'áreas'
              : 'asignaturas'}
        </div>
        <div className="w-32 text-right font-bold app-text flex flex-col">
          <span>
            Calc: {group.aggregates.promActual?.toFixed(2) ?? '-'}
          </span>
          {group.rows[0]?.oficialPRO !== undefined &&
            group.rows[0]?.oficialPRO !== null && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400">
                PRO Ofic: {group.rows[0].oficialPRO.toFixed(2)}
              </span>
            )}
        </div>
      </div>

      {isExpanded && (
        <div className="app-surface-muted px-4 py-3 border-t border-b app-border">
          <table className="min-w-full divide-y app-divide text-sm">
            <thead className="sticky top-0 z-10 app-surface-muted backdrop-blur-md border-b app-border">
              <tr className="app-text-muted text-left">
                <th className="font-semibold pb-2 w-1/4">
                  {viewMode === 'area' ? 'Área' : 'Asignatura'}
                </th>
                <th
                  className="font-semibold pb-2 w-1/12 text-center cursor-pointer select-none"
                  onClick={() =>
                    onSort(viewMode === 'area' ? 'defP1' : 'p1')
                  }
                >
                  P1{' '}
                  {getSortIcon(viewMode === 'area' ? 'defP1' : 'p1', sortConfig)}
                </th>
                <th
                  className="font-semibold pb-2 w-1/12 text-center cursor-pointer select-none"
                  onClick={() =>
                    onSort(viewMode === 'area' ? 'defP2' : 'p2')
                  }
                >
                  P2{' '}
                  {getSortIcon(viewMode === 'area' ? 'defP2' : 'p2', sortConfig)}
                </th>
                <th
                  className="font-semibold pb-2 w-1/12 text-center cursor-pointer select-none"
                  onClick={() =>
                    onSort(viewMode === 'area' ? 'defP3' : 'p3')
                  }
                >
                  P3{' '}
                  {getSortIcon(viewMode === 'area' ? 'defP3' : 'p3', sortConfig)}
                </th>
                {hasP4 && (
                  <th className="font-semibold pb-2 w-1/12 text-center">
                    P4
                  </th>
                )}
                <th className="font-semibold pb-2 w-1/12 text-center">
                  Acum.
                </th>
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
                <th className="font-semibold pb-2 w-1/4 text-center">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y app-divide">
              {group.rows.map((row: PipelineRow, idx) => {
                const areaKey = `${group.estudiante}_${row.area}`;
                const isAreaExpanded = expandedAreas[areaKey];
                const subjects = subjectsByStudentArea.get(areaKey) || [];

                const rowAny = row as import('../../../../domain/types').AugmentedRowArea &
                  import('../../../../domain/types').AugmentedRowAsignatura;

                return (
                  <React.Fragment key={idx}>
                    <tr className="app-surface-hover">
                      <td className="py-2 app-text">
                        {viewMode === 'area' && (
                          <button
                            className="mr-2 app-text-muted hover:app-text app-focus cursor-pointer rounded"
                            onClick={() =>
                              onToggleArea(group.estudiante, row.area)
                            }
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
                          originalGrade={
                            viewMode === 'area' ? rowAny.defP1 : rowAny.p1
                          }
                          simulatedGrade={activeSimulations[row.id]?.P1}
                          onSave={onSetSimulation}
                        />
                      </td>
                      <td className="py-2 text-center">
                        <EditableGradeCell
                          rowId={row.id}
                          period="P2"
                          originalGrade={
                            viewMode === 'area' ? rowAny.defP2 : rowAny.p2
                          }
                          simulatedGrade={activeSimulations[row.id]?.P2}
                          onSave={onSetSimulation}
                        />
                      </td>
                      <td className="py-2 text-center">
                        <EditableGradeCell
                          rowId={row.id}
                          period="P3"
                          originalGrade={
                            viewMode === 'area' ? rowAny.defP3 : rowAny.p3
                          }
                          simulatedGrade={activeSimulations[row.id]?.P3}
                          onSave={onSetSimulation}
                        />
                      </td>
                      {hasP4 && (
                        <td className="py-2 text-center">
                          <EditableGradeCell
                            rowId={row.id}
                            period="P4"
                            originalGrade={
                              viewMode === 'area' ? rowAny.defP4 : rowAny.p4
                            }
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
                    {viewMode === 'area' && isAreaExpanded && (
                      <tr className="app-surface-muted">
                        <td
                          colSpan={hasP4 ? 10 : 9}
                          className="p-3 pl-8"
                        >
                          <div className="border app-border rounded-xl overflow-hidden app-surface shadow-sm transition-premium">
                            <table className="min-w-full text-xs">
                              <thead className="app-surface-muted border-b app-border">
                                <tr className="app-text-muted text-left">
                                  <th className="font-semibold p-2 pl-4">
                                    Asignatura
                                  </th>
                                  <th className="font-semibold p-2 text-center">
                                    P1
                                  </th>
                                  <th className="font-semibold p-2 text-center">
                                    P2
                                  </th>
                                  <th className="font-semibold p-2 text-center">
                                    P3
                                  </th>
                                  {hasP4 && (
                                    <th className="font-semibold p-2 text-center">
                                      P4
                                    </th>
                                  )}
                                  <th className="font-semibold p-2 text-center">
                                    Acum.
                                  </th>
                                  <th className="font-semibold p-2 text-center">
                                    Tendencia
                                  </th>
                                  <th className="font-semibold p-2 text-center">
                                    Prom.Calc
                                  </th>
                                  <th className="font-semibold p-2 text-center">
                                    {hasP4 ? 'Mín. P4' : 'Mín. P3'}
                                  </th>
                                  <th className="font-semibold p-2 text-center">
                                    Estado
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y app-divide">
                                {subjects.map(
                                  (sub: RowAsignatura, sIdx: number) => {
                                    const p1 = sub.p1;
                                    const p2 = sub.p2;
                                    const p3 = sub.p3;
                                    const subTendencia = determineAcademicTrend(
                                      p1,
                                      p2,
                                      p3,
                                    );

                                    return (
                                      <tr
                                        key={sIdx}
                                        className="app-surface-hover"
                                      >
                                        <td className="p-2 pl-4 app-text font-semibold">
                                          {sub.asignatura}
                                        </td>
                                        <td className="p-2 text-center">
                                          <EditableGradeCell
                                            rowId={sub.id}
                                            period="P1"
                                            originalGrade={sub.p1}
                                            simulatedGrade={
                                              activeSimulations[sub.id]?.P1
                                            }
                                            onSave={onSetSimulation}
                                          />
                                        </td>
                                        <td className="p-2 text-center">
                                          <EditableGradeCell
                                            rowId={sub.id}
                                            period="P2"
                                            originalGrade={sub.p2}
                                            simulatedGrade={
                                              activeSimulations[sub.id]?.P2
                                            }
                                            onSave={onSetSimulation}
                                          />
                                        </td>
                                        <td className="p-2 text-center">
                                          <EditableGradeCell
                                            rowId={sub.id}
                                            period="P3"
                                            originalGrade={sub.p3}
                                            simulatedGrade={
                                              activeSimulations[sub.id]?.P3
                                            }
                                            onSave={onSetSimulation}
                                          />
                                        </td>
                                        {hasP4 && (
                                          <td className="p-2 text-center">
                                            <EditableGradeCell
                                              rowId={sub.id}
                                              period="P4"
                                              originalGrade={sub.p4}
                                              simulatedGrade={
                                                activeSimulations[sub.id]?.P4
                                              }
                                              onSave={onSetSimulation}
                                            />
                                          </td>
                                        )}
                                        <td className="p-2 text-center font-bold app-text">
                                          {sub.a?.toFixed(2) ?? '-'}
                                        </td>
                                        <td
                                          className="p-2 text-center text-base"
                                          title={`Tendencia: ${subTendencia}`}
                                        >
                                          {subTendencia === 'up'
                                            ? '↗️'
                                            : subTendencia === 'down'
                                              ? '↘️'
                                              : subTendencia === 'flat'
                                                ? '➡️'
                                                : '-'}
                                        </td>
                                        <td className="p-2 text-center font-semibold app-text">
                                          <GoalSeekCell
                                            rowId={sub.id}
                                            currentValue={sub.promActual}
                                            notas={{
                                              P1: sub.p1 ?? null,
                                              P2: sub.p2 ?? null,
                                              P3: sub.p3 ?? null,
                                              P4: sub.p4 ?? null,
                                            }}
                                            config={config}
                                            evaluated={evaluated}
                                            hasP4={hasP4}
                                            onGoalSet={onSetSimulation}
                                          />
                                        </td>
                                        <td className="p-2 text-center app-text-muted">
                                          {sub.p4Min !== null &&
                                          sub.p4Min !== undefined &&
                                          sub.p4Min <= 5.0 ? (
                                            <span
                                              className="cursor-pointer hover:text-amber-500 transition-colors border-b border-dashed border-amber-300 dark:border-amber-700"
                                              title="Click para auto-completar nota mínima aprobatoria"
                                              onClick={() =>
                                                onSetSimulation(
                                                  sub.id,
                                                  hasP4 ? 'P4' : 'P3',
                                                  sub.p4Min!,
                                                )
                                              }
                                            >
                                              {sub.p4Min.toFixed(2)}
                                            </span>
                                          ) : (
                                            '-'
                                          )}
                                        </td>
                                        <td className="p-2 text-center">
                                          <StatusBadge
                                            text={sub.estado.text}
                                            color={sub.estado.color}
                                            isMini
                                          />
                                        </td>
                                      </tr>
                                    );
                                  },
                                )}
                                {subjects.length === 0 && (
                                  <tr>
                                    <td
                                      colSpan={hasP4 ? 10 : 9}
                                      className="p-4 text-center app-text-muted"
                                    >
                                      No hay asignaturas para esta área.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
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
