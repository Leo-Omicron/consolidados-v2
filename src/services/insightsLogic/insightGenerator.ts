import type { PedagogicalArchetype, Estudiante } from '../../domain/types';
import { getStudentAverage } from '../academicLogic';
import { cleanGrades } from './archetypeEngine';

// ---------------------------------------------------------------------------
// Narrative generator — Spanish pedagogical text per archetype
// ---------------------------------------------------------------------------

export function generateNarrative(
  archetype: PedagogicalArchetype,
  confidence: number,
  periodGrades: (number | null)[],
): string {
  const numeric = cleanGrades(periodGrades);
  const gradesText = numeric.map((g, i) => `P${i + 1}=${g}`).join(', ');
  const pct = Math.round(confidence * 100);

  switch (archetype) {
    case 'confiado':
      return (
        `El estudiante inició con un promedio alto (${gradesText}) pero muestra una tendencia de declive sostenido. ` +
        `La caída total es significativa, lo que sugiere exceso de confianza o desmotivación progresiva. ` +
        `Confianza del diagnóstico: ${pct}%. Se recomienda intervención temprana para frenar la tendencia.`
      );
    case 'resiliente':
      return (
        `El estudiante arrancó con un promedio bajo (${gradesText}) pero evidencia una mejora constante período a período. ` +
        `Este patrón indica esfuerzo, adaptación positiva y resiliencia académica. ` +
        `Confianza del diagnóstico: ${pct}%. Se sugiere reconocer y reforzar esta trayectoria de mejora.`
      );
    case 'montana-rusa':
      return (
        `Las calificaciones del estudiante presentan alta variabilidad (${gradesText}), alternando entre períodos altos y bajos. ` +
        `Este patrón de "montaña rusa" puede reflejar inconsistencia en el esfuerzo, factores externos o dificultades específicas en ciertos cortes. ` +
        `Confianza del diagnóstico: ${pct}%. Se recomienda indagar las causas de los picos y valles.`
      );
    case 'radar':
      return (
        `Aunque el estudiante no encaja en un patrón claro de declive o mejora, sus calificaciones (${gradesText}) presentan señales de alerta: ` +
        `nota final baja o caídas puntuales pronunciadas. Esto amerita seguimiento cercano. ` +
        `Confianza del diagnóstico: ${pct}%. Se sugiere monitoreo activo en el próximo período.`
      );
  }
}

// ---------------------------------------------------------------------------
// calculateStudentPeriodAverages
// Computes the official student average per period when available, with
// area-level DEF averaging as fallback.
// ---------------------------------------------------------------------------

export function calculateStudentPeriodAverages(estudiante: Estudiante): (number | null)[] {
  const periods = ['P1', 'P2', 'P3', 'P4'] as const;

  return periods.map(period => getStudentAverage(estudiante, period));
}
