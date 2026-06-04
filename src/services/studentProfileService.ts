import type { Estudiante, ArchetypeResult, PeriodoNotas, PeriodConfig, SubjectWeightConfig } from '../domain/types';
import { applyAcademicLogic } from './academicLogic';
import { createLegacyAreaRowId, createLegacySubjectRowId, parseRowId } from './rowIdentity';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Umbral mínimo para que un área sea considerada "fortaleza" */
const FORTALEZA_THRESHOLD = 3.5;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StudentProfileData {
  studentId: string;
  studentName: string;
  grupo: string;
  /** Promedio actual por área para el estudiante */
  areaGrades: Record<string, number>;
  /** Promedio grupal anónimo por área */
  groupAverages: Record<string, number>;
  /** Top 2 áreas con definitiva >= 3.5 (orden descendente por nota) */
  fortalezas: string[];
  /** Bottom 2 áreas con definitiva < 3.5 (orden ascendente por nota) */
  puntosMejora: string[];
  /** Texto narrativo del insight si existe */
  insight: string | null;
  /** Etiqueta legible del arquetipo pedagógico detectado (ej. "El Confiado") */
  arquetipo: string | null;
  /** Indica si hay simulaciones activas para este estudiante */
  isSimulated: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ARCHETYPE_LABELS: Record<string, string> = {
  confiado: 'El Confiado',
  resiliente: 'El Resiliente',
  'montana-rusa': 'Montaña Rusa',
  radar: 'Radar',
};

/**
 * Checks whether any simulation key targets the given student.
 */
function hasActiveSimulations(
  student: Estudiante,
  activeSimulations: Record<string, Partial<PeriodoNotas>>,
): boolean {
  return Object.keys(activeSimulations).some((key) => {
    const parsed = parseRowId(key);
    if (parsed) return parsed.studentId === student.id;

    return Object.entries(student.areas).some(([areaName, area]) => {
      if (key === createLegacyAreaRowId(student.id, areaName)) return true;

      const subjectNames = Object.keys(area.asignaturas);
      const legacySubjectNames = subjectNames.length > 0 ? subjectNames : [areaName];
      return legacySubjectNames.some((subjectName) =>
        key === createLegacySubjectRowId(student.id, areaName, subjectName)
      );
    });
  });
}

/**
 * Deep-clones the student, then delegates ALL calculations to the canonical
 * `applyAcademicLogic` pipeline — including subject→area DEF cascade,
 * period-weight config, and subject weight config.
 *
 * Only areas touched by simulations are recalculated; non-touched areas
 * retain their original `areaStats` to preserve existing precision.
 *
 * Pure — does not mutate the original student array.
 */
function buildSimulatedStudent(
  student: Estudiante,
  config: PeriodConfig,
  subjectWeights: SubjectWeightConfig,
  activeSimulations: Record<string, Partial<PeriodoNotas>>,
): Estudiante {
  // Determine which areas are touched by any simulation key for this student
  const touchedAreas = new Set<string>();
  for (const key of Object.keys(activeSimulations)) {
    const parsed = parseRowId(key);
    if (parsed) {
      if (parsed.studentId === student.id) {
        touchedAreas.add(parsed.areaName);
      }
      continue;
    }

    for (const [areaName, area] of Object.entries(student.areas)) {
      if (key === createLegacyAreaRowId(student.id, areaName)) {
        touchedAreas.add(areaName);
        continue;
      }

      const subjectNames = Object.keys(area.asignaturas);
      const legacySubjectNames = subjectNames.length > 0 ? subjectNames : [areaName];
      if (legacySubjectNames.some((subjectName) =>
        key === createLegacySubjectRowId(student.id, areaName, subjectName)
      )) {
        touchedAreas.add(areaName);
      }
    }
  }

  // Preserve original areaStats for non-touched areas
  const untouchedAreaStats: Record<string, NonNullable<typeof student.areas[string]['areaStats']>> = {};
  for (const [areaName, area] of Object.entries(student.areas)) {
    if (!touchedAreas.has(areaName) && area.areaStats) {
      untouchedAreaStats[areaName] = { ...area.areaStats };
    }
  }

  const cloned = structuredClone(student);
  applyAcademicLogic([cloned], config, subjectWeights, activeSimulations);

  // Restore areaStats for areas that were NOT touched by any simulation
  for (const [areaName, stats] of Object.entries(untouchedAreaStats)) {
    if (cloned.areas[areaName]) {
      cloned.areas[areaName].areaStats = stats;
    }
  }

  return cloned;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Construye los datos de perfil para la ficha imprimible del estudiante.
 *
 * Pura — no muta los parámetros de entrada ni accede a stores globales.
 *
 * @param config       Period weights (e.g. { P1: 25, P2: 25, P3: 25, P4: 25 })
 * @param subjectWeights Per-group per-area per-subject weight overrides
 * @returns StudentProfileData con toda la información necesaria para el modal,
 *          o `null` si el estudiante no existe.
 */
export function buildStudentProfileData(
  studentId: string,
  estudiantes: Estudiante[],
  insights: ArchetypeResult[],
  activeSimulations: Record<string, Partial<PeriodoNotas>>,
  config: PeriodConfig,
  subjectWeights: SubjectWeightConfig = {},
): StudentProfileData | null {
  const student = estudiantes.find((e) => e.id === studentId);
  if (!student) return null;

  // 0. Resolve simulation state and get the effective student object
  const isSimulated = hasActiveSimulations(student, activeSimulations);
  const effectiveStudent = isSimulated
    ? buildSimulatedStudent(student, config, subjectWeights, activeSimulations)
    : student;

  // 1. Build area grades from areaStats.promedioActual
  const areaGrades: Record<string, number> = {};
  const studentAreas: string[] = [];

  for (const [areaName, areaData] of Object.entries(effectiveStudent.areas)) {
    if (areaData.areaStats) {
      areaGrades[areaName] = areaData.areaStats.promedioActual;
      studentAreas.push(areaName);
    }
  }

  // 2. Compute anonymous group averages using original peers plus the
  //    simulated student's values so the group stats reflect the What-If
  const groupAverages: Record<string, number> = {};
  const studentsInGroup = estudiantes.filter((e) => e.grupo === effectiveStudent.grupo);

  for (const areaName of studentAreas) {
    let sum = 0;
    let count = 0;
    for (const peer of studentsInGroup) {
      // Use the effective student for the target, original for peers
      const source = peer.id === studentId ? effectiveStudent : peer;
      const peerArea = source.areas[areaName];
      if (peerArea?.areaStats) {
        sum += peerArea.areaStats.promedioActual;
        count++;
      }
    }
    if (count > 0) {
      groupAverages[areaName] = Math.round((sum / count) * 1000) / 1000;
    }
  }

  // 3. Rank areas → fortalezas (>= FORTALEZA_THRESHOLD, top 2 by desc grade)
  const ranking = [...studentAreas]
    .map((name) => ({ name, grade: areaGrades[name] }))
    .sort((a, b) => b.grade - a.grade);

  const fortalezas = ranking
    .filter((r) => r.grade >= FORTALEZA_THRESHOLD)
    .slice(0, 2)
    .map((r) => r.name);

  // 4. puntosMejora (< FORTALEZA_THRESHOLD, bottom 2 by asc grade)
  const puntosMejora = [...ranking]
    .reverse()
    .filter((r) => r.grade < FORTALEZA_THRESHOLD)
    .slice(0, 2)
    .map((r) => r.name);

  // 5. Look up insight
  const insight = insights.find((i) => i.estudianteId === studentId);
  const insightText = insight?.narrative ?? null;
  const arquetipo = insight ? (ARCHETYPE_LABELS[insight.archetype] ?? null) : null;

  return {
    studentId: effectiveStudent.id,
    studentName: effectiveStudent.name,
    grupo: effectiveStudent.grupo,
    areaGrades,
    groupAverages,
    fortalezas,
    puntosMejora,
    insight: insightText,
    arquetipo,
    isSimulated,
  };
}
