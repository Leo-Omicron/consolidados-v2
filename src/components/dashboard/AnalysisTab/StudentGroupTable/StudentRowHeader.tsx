import React from 'react';
import type { StudentGroup, PipelineRow, RowAsignatura } from '../../../../domain/types';
import { parseRowId } from '../../../../services/rowIdentity';

export interface StudentRowHeaderProps {
  group: StudentGroup<PipelineRow>;
  isExpanded: boolean;
  onToggleGroup: (estudiante: string) => void;
  viewMode: 'area' | 'subject';
  hasStudentSimulations: boolean;
  subjectsByStudentArea: Map<string, RowAsignatura[]>;
  onClearSimulation: (rowId: string) => void;
  onOpenStudentProfile?: (studentId: string) => void;
}

export const StudentRowHeader: React.FC<StudentRowHeaderProps> = ({
  group,
  isExpanded,
  onToggleGroup,
  viewMode,
  hasStudentSimulations,
  subjectsByStudentArea,
  onClearSimulation,
  onOpenStudentProfile,
}) => {
  const studentId =
    parseRowId(group.rows[0]?.id ?? '')?.studentId ?? group.estudiante;

  return (
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
  );
};
