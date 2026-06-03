import type { Estudiante, ArchetypeResult, PeriodoNotas } from '../domain/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Umbral mínimo para que un área sea considerada "fortaleza" */
const FORTALEZA_THRESHOLD = 3.5;

/**
 * Period weights used when recalculating areaStats.promedioActual from
 * simulated DEF values.  All periods carry equal weight (25%) in the
 * academic consolidation model.
 */
const PERIOD_WEIGHTS = { P1: 25, P2: 25, P3: 25 } as const;

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
 * Checks whether any key in activeSimulations starts with the given studentId
 * followed by an underscore (row id convention: `{studentId}_{area}`).
 */
function hasActiveSimulations(
  studentId: string,
  activeSimulations: Record<string, Partial<PeriodoNotas>>,
): boolean {
  const prefix = `${studentId}_`;
  return Object.keys(activeSimulations).some((key) => key.startsWith(prefix));
}

/**
 * Deep-clones the student and applies What-If simulation DEF period overrides
 * from `activeSimulations`.  Then recalculates `areaStats.promedioActual` for
 * every area whose DEF values were touched.
 *
 * Pure — does not mutate the original student.
 */
function applySimulationToStudent(
  student: Estudiante,
  activeSimulations: Record<string, Partial<PeriodoNotas>>,
): Estudiante {
  const cloned = structuredClone(student);
  const prefix = `${student.id}_`;

  const touchedAreas = new Set<string>();

  for (const [key, sim] of Object.entries(activeSimulations)) {
    if (!key.startsWith(prefix)) continue;

    // Key format: studentId_areaName  or  studentId_areaName_subjectName
    const parts = key.split('_');
    const areaName = parts[1];
    const area = cloned.areas[areaName];
    if (!area) continue;

    if (parts.length === 2) {
      // Direct area simulation — override DEF periods
      Object.assign(area.DEF, sim);
      touchedAreas.add(areaName);
    }
    // For subject-level simulations (parts.length === 3) we also touch the
    // parent area because the cascade to DEF happens inside applyAcademicLogic;
    // here we let the direct DEF override cover the area-level recalc.
    // Subject-level simulations that only touch subjects without a matching
    // area key will be handled by the full pipeline in the UI.
  }

  // Recalculate promedioActual for touched areas
  for (const areaName of touchedAreas) {
    const area = cloned.areas[areaName];
    if (area?.areaStats) {
      area.areaStats.promedioActual = recalcPromedioFromDEF(area.DEF);
    }
  }

  return cloned;
}

/**
 * Recalculates `promedioActual` from a PeriodoNotas (DEF) using the
 * weighted average of non-null period values.
 *
 * Periods with null values are excluded from both numerator and denominator.
 */
function recalcPromedioFromDEF(def: PeriodoNotas): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const period of ['P1', 'P2', 'P3'] as const) {
    const value = def[period];
    if (value != null) {
      const weight = PERIOD_WEIGHTS[period];
      weightedSum += value * weight;
      totalWeight += weight;
    }
  }

  if (totalWeight === 0) return 0;
  return Math.round((weightedSum / totalWeight) * 100) / 100;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Construye los datos de perfil para la ficha imprimible del estudiante.
 *
 * Pura — no muta los parámetros de entrada ni accede a stores globales.
 *
 * @returns StudentProfileData con toda la información necesaria para el modal,
 *          o `null` si el estudiante no existe.
 */
export function buildStudentProfileData(
  studentId: string,
  estudiantes: Estudiante[],
  insights: ArchetypeResult[],
  activeSimulations: Record<string, Partial<PeriodoNotas>>,
): StudentProfileData | null {
  const student = estudiantes.find((e) => e.id === studentId);
  if (!student) return null;

  // 0. Resolve simulation state and get the effective student object
  const isSimulated = hasActiveSimulations(studentId, activeSimulations);
  const effectiveStudent = isSimulated
    ? applySimulationToStudent(student, activeSimulations)
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
