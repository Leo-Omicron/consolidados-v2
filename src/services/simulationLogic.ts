import type { Estudiante, PeriodConfig, SubjectWeightConfig, PeriodoNotas, RowArea, RowAsignatura } from '../domain/types';
import { applyAcademicLogic } from './academicLogic';
import { flattenRows } from './rowFlattener';

export function getSimulatedRows(
  estudiantes: Estudiante[],
  activeSimulations: Record<string, Partial<PeriodoNotas>>,
  config: PeriodConfig,
  subjectWeights: SubjectWeightConfig
): { rowsArea: RowArea[]; rowsAsignatura: RowAsignatura[] } | null {
  if (Object.keys(activeSimulations).length === 0) {
    return null;
  }

  // Clonar los estudiantes profundamente para no mutar el estado original del store
  const clonedStudents: Estudiante[] = JSON.parse(JSON.stringify(estudiantes));

  // Aplicar lógica académica completa (incluyendo simulaciones) sobre el clon
  applyAcademicLogic(clonedStudents, config, subjectWeights, activeSimulations);

  // Aplanar la estructura del árbol de estudiantes clonado en filas planas para la UI
  return flattenRows(clonedStudents);
}
