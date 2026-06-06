import React from 'react';
import type { RowAsignatura, PeriodoNotas, PeriodConfig } from '../../../../domain/types';
import { StatusBadge } from '../../../common/StatusBadge';
import { EditableGradeCell } from '../EditableGradeCell';
import { GoalSeekCell } from '../GoalSeekCell';
import { determineAcademicTrend } from '../../../../services/academicLogic';

export interface StudentAreaSubtableProps {
  subjects: RowAsignatura[];
  hasP4: boolean;
  activeSimulations: Record<string, Partial<PeriodoNotas>>;
  onSetSimulation: (rowId: string, period: 'P1' | 'P2' | 'P3' | 'P4', value: number | null) => void;
  config: PeriodConfig;
  evaluated: Record<'P1' | 'P2' | 'P3' | 'P4', boolean>;
}

export const StudentAreaSubtable: React.FC<StudentAreaSubtableProps> = ({
  subjects,
  hasP4,
  activeSimulations,
  onSetSimulation,
  config,
  evaluated,
}) => {
  const colSpan = hasP4 ? 10 : 9;

  return (
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
                colSpan={colSpan}
                className="p-4 text-center app-text-muted"
              >
                No hay asignaturas para esta área.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
