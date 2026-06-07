import type { Area, PeriodConfig, PeriodoNotas, EstadoAcademico, Estudiante, SubjectWeightConfig, Trend } from '../domain/types';
import {
  createAreaRowId,
  createLegacyAreaRowId,
  createLegacySubjectRowId,
  createSubjectRowId,
} from './rowIdentity';
import { getPresetWeights } from '../config/academicWeights';

export const PASSING_GRADE = 3.0;
export const MAX_GRADE = 5.0;
export const ACADEMIC_FAILURE_AREA_THRESHOLD = 3;
export const ACADEMIC_STRENGTH_THRESHOLD = 3.5;
export type StudentAverageKey = 'DEF' | 'P1' | 'P2' | 'P3' | 'P4';
export type AcademicPeriodKey = Exclude<StudentAverageKey, 'DEF'>;

export function determineAcademicTrend(
  firstPeriod: number | null | undefined,
  secondPeriod: number | null | undefined,
  thirdPeriod: number | null | undefined
): Trend {
  const latestPeriod = typeof thirdPeriod === 'number' ? thirdPeriod : secondPeriod;

  if (typeof firstPeriod !== 'number' || typeof latestPeriod !== 'number') {
    return 'none';
  }

  if (latestPeriod > firstPeriod) return 'up';
  if (latestPeriod < firstPeriod) return 'down';
  return 'flat';
}

export function isStudentReprobado(failedAreaCount: number): boolean {
  return failedAreaCount >= ACADEMIC_FAILURE_AREA_THRESHOLD;
}

export function isAcademicStrength(grade: number): boolean {
  return grade >= ACADEMIC_STRENGTH_THRESHOLD;
}

export function isAcademicImprovementPoint(grade: number): boolean {
  return grade < ACADEMIC_STRENGTH_THRESHOLD;
}

export function getStudentAverage(student: Estudiante): number;
export function getStudentAverage(student: Estudiante, key: AcademicPeriodKey): number | null;
export function getStudentAverage(student: Estudiante, key: StudentAverageKey = 'DEF'): number | null {
  const officialAverage = student.promedios?.[key];
  if (typeof officialAverage === 'number') {
    return officialAverage;
  }

  if (key === 'DEF') {
    const areaStatsList = Object.values(student.areas)
      .map(area => area.areaStats?.promedioActual)
      .filter((value): value is number => typeof value === 'number');

    if (areaStatsList.length === 0) return 0;

    const sum = areaStatsList.reduce((acc, value) => acc + value, 0);
    return Math.round((sum / areaStatsList.length) * 100) / 100;
  }

  const periodGrades = Object.values(student.areas)
    .map(area => area.DEF[key])
    .filter((value): value is number => typeof value === 'number');

  if (periodGrades.length === 0) return null;

  const sum = periodGrades.reduce((acc, value) => acc + value, 0);
  return roundToOneDecimal(sum / periodGrades.length);
}

export function createUniformSubjectWeights(subjectNames: string[]): Record<string, number> {
  if (subjectNames.length === 0) return {};

  const uniformWeight = 1 / subjectNames.length;
  const weights: Record<string, number> = {};
  subjectNames.forEach(name => {
    weights[name] = uniformWeight;
  });
  return weights;
}

export function calculateWeightedAreaPeriodGrade(
  area: Area,
  period: AcademicPeriodKey,
  evaluated: Record<AcademicPeriodKey, boolean>,
  weights?: Record<string, number>
): number | null {
  const subjectNames = Object.keys(area.asignaturas);
  if (subjectNames.length === 0) return null;

  const effectiveWeights = weights && Object.keys(weights).length > 0
    ? weights
    : createUniformSubjectWeights(subjectNames);

  let sum = 0;
  let hasGrade = false;

  Object.entries(area.asignaturas).forEach(([subjectName, subject]) => {
    const grade = subject[period];
    const weight = effectiveWeights[subjectName] || 0;

    if (typeof grade === 'number') {
      sum += grade * weight;
      hasGrade = true;
    } else if (evaluated[period]) {
      sum += 0 * weight;
      hasGrade = true;
    }
  });

  return hasGrade ? roundToOneDecimal(sum) : null;
}

export function roundToOneDecimal(val: number): number {
  return Math.round(val * 10) / 10;
}

export function getAccumulatedWeightAndProduct(
  notas: PeriodoNotas,
  config: PeriodConfig,
  evaluated = { P1: false, P2: false, P3: false, P4: false }
) {
  let sumProduct = 0;
  let sumWeight = 0;
  const totalWeight = config.P1 + config.P2 + config.P3 + (config.P4 || 0);

  const processPeriod = (grade: number | null | undefined, weight: number, isEvaluated: boolean) => {
    if (weight > 0) {
      if (grade !== null && grade !== undefined) {
        sumProduct += grade * weight;
        sumWeight += weight;
      } else if (isEvaluated) {
        // Evaluated but missing -> treat as 0.0
        sumProduct += 0 * weight;
        sumWeight += weight;
      }
    }
  };

  processPeriod(notas.P1, config.P1, evaluated.P1);
  processPeriod(notas.P2, config.P2, evaluated.P2);
  processPeriod(notas.P3, config.P3, evaluated.P3);
  processPeriod(notas.P4, config.P4 || 0, evaluated.P4);

  return { sumProduct, sumWeight, totalWeight };
}

export function calcularPromedioActual(
  notas: PeriodoNotas,
  config: PeriodConfig,
  evaluated = { P1: false, P2: false, P3: false, P4: false }
): number {
  const { sumProduct, sumWeight } = getAccumulatedWeightAndProduct(notas, config, evaluated);
  
  if (sumWeight === 0) return 0;
  
  const prom = sumProduct / sumWeight;
  return roundToOneDecimal(prom);
}

export function calcularMinimoRequerido(
  notas: PeriodoNotas,
  config: PeriodConfig,
  evaluated = { P1: false, P2: false, P3: false, P4: false }
): number {
  const { sumProduct, sumWeight, totalWeight } = getAccumulatedWeightAndProduct(notas, config, evaluated);
  
  const remainingWeight = totalWeight - sumWeight;
  
  // If no periods left, return 0
  if (remainingWeight <= 0) return 0;
  
  const neededProduct = (PASSING_GRADE * totalWeight) - sumProduct;
  
  // If already reached passing grade accumulated equivalent, return 0
  if (neededProduct <= 0) return 0;
  
  const requiredGrade = neededProduct / remainingWeight;
  
  return Math.round(requiredGrade * 100) / 100;
}

export function calcularNotaRequeridaParaObjetivo(
  notas: PeriodoNotas,
  config: PeriodConfig,
  objetivo: number,
  evaluated = { P1: false, P2: false, P3: false, P4: false }
): number | null {
  const { sumProduct, sumWeight, totalWeight } = getAccumulatedWeightAndProduct(notas, config, evaluated);
  
  const remainingWeight = totalWeight - sumWeight;
  
  // If no periods left, we can't achieve a new target by adding grades
  if (remainingWeight <= 0) return null;
  
  const neededProduct = (objetivo * totalWeight) - sumProduct;
  
  const requiredGrade = neededProduct / remainingWeight;
  
  return Math.round(requiredGrade * 100) / 100;
}

export function calcularAcumuladoBase(
  notas: PeriodoNotas,
  config: PeriodConfig,
  evaluated = { P1: false, P2: false, P3: false, P4: false }
): number | null {
  const { sumProduct, sumWeight, totalWeight } = getAccumulatedWeightAndProduct(notas, config, evaluated);
  if (sumWeight === 0) return null;
  
  const a = sumProduct / totalWeight;
  return Math.round(a * 100) / 100;
}

export function determinarEstado(
  notas: PeriodoNotas,
  config: PeriodConfig,
  evaluated = { P1: false, P2: false, P3: false, P4: false }
): EstadoAcademico {
  const { sumWeight, totalWeight, sumProduct } = getAccumulatedWeightAndProduct(notas, config, evaluated);
  const remainingWeight = totalWeight - sumWeight;
  
  const acumuladoFinalProyectadoMax = roundToOneDecimal((sumProduct + (MAX_GRADE * remainingWeight)) / totalWeight);
  const acumuladoActual = roundToOneDecimal(sumProduct / totalWeight);
  const minimoRequerido = calcularMinimoRequerido(notas, config, evaluated);

  // Ya se terminó de evaluar todo el año
  if (remainingWeight <= 0) {
    if (acumuladoActual >= PASSING_GRADE) {
      return { text: 'Ganado', color: 'green' };
    } else {
      return { text: 'Perdido', color: 'red' };
    }
  }

  // Todavía quedan periodos
  if (acumuladoActual >= PASSING_GRADE) {
    // Matemáticamente ya ganó el año aunque saque 0 en lo restante
    return { text: 'Ganado', color: 'green' };
  }

  if (acumuladoFinalProyectadoMax < PASSING_GRADE) {
    // Matemáticamente es imposible ganar, incluso sacando 5.0 en todo lo restante
    return { text: 'Perdido', color: 'red' };
  }

  // Riesgo Vital: Alerta Amarilla si el estudiante requiere sacar 3.2 o más para salvar la materia
  if (minimoRequerido >= 3.2) {
    return { text: 'En riesgo', color: 'yellow' };
  }
  
  if (minimoRequerido > PASSING_GRADE) {
    // Se requiere más de 3.0 pero está dentro de lo esperable (<= historico + 1.0)
    return { text: 'Recuperable', color: 'blue' };
  }

  // Si requiere 3.0 o menos en los cortes restantes
  return { text: 'Ganable', color: 'cyan' };
}

export function getEvaluatedPeriods(students: Estudiante[]) {
  let hasP1 = false;
  let hasP2 = false;
  let hasP3 = false;
  let hasP4 = false;

  students.forEach(student => {
    Object.values(student.areas).forEach(area => {
      // Only check Subject-level grades because the platform exports fake 0.0s for future periods in the Area DEF column
      Object.values(area.asignaturas).forEach(asig => {
        if (asig.P1 !== null && asig.P1 !== undefined) hasP1 = true;
        if (asig.P2 !== null && asig.P2 !== undefined) hasP2 = true;
        if (asig.P3 !== null && asig.P3 !== undefined) hasP3 = true;
        if (asig.P4 !== null && asig.P4 !== undefined) hasP4 = true;
      });
    });
  });

  return { P1: hasP1, P2: hasP2, P3: hasP3, P4: hasP4 };
}

export function applyAcademicLogic(
  students: Estudiante[],
  config: PeriodConfig,
  subjectWeights: SubjectWeightConfig = {},
  activeSimulations: Record<string, Partial<PeriodoNotas>> = {}
): void {
  const evaluated = getEvaluatedPeriods(students);
  const getOverrides = (rowId: string, legacyRowId: string): Partial<PeriodoNotas> | undefined =>
    activeSimulations[rowId] ?? activeSimulations[legacyRowId];

  students.forEach(student => {
    Object.entries(student.areas).forEach(([areaName, area]) => {
      // Calculate each asignatura
      Object.entries(area.asignaturas).forEach(([asigName, asig]) => {
        const asigRowId = createSubjectRowId(student.id, areaName, asigName);
        const legacyAsigRowId = createLegacySubjectRowId(student.id, areaName, asigName);
        const overrides = getOverrides(asigRowId, legacyAsigRowId);
        if (overrides) {
          (Object.keys(overrides) as Array<keyof PeriodoNotas>).forEach((period) => {
            const val = overrides[period];
            if (val !== undefined) {
              if (period === 'P4') {
                asig.P4 = val;
              } else {
                asig[period] = val;
              }
            }
          });
        }

        asig.A = calcularAcumuladoBase(asig, config, evaluated);
        asig.promedioActual = calcularPromedioActual(asig, config, evaluated);
        asig.p4Min = calcularMinimoRequerido(asig, config, evaluated);
        asig.estado = determinarEstado(asig, config, evaluated);
      });

      // Dynamically calculate Area DEF if weights are provided (or fallback to uniform weights if there are multiple subjects)
      const groupWeights = (subjectWeights as unknown as Record<string, Record<string, Record<string, number>>>)[student.grupo] || {};
      let weights = groupWeights[areaName] || (subjectWeights as unknown as Record<string, Record<string, number>>)[areaName];
      
      if (Object.keys(area.asignaturas).length > 0) {
        if (!weights || Object.keys(weights).length === 0) {
          weights = createUniformSubjectWeights(Object.keys(area.asignaturas));
        }

        (['P1', 'P2', 'P3', 'P4'] as const).forEach(period => {
          area.DEF[period] = calculateWeightedAreaPeriodGrade(area, period, evaluated, weights);
        });
      }

      // Apply direct area simulations overrides to area.DEF before calculating areaStats
      const areaRowId = createAreaRowId(student.id, areaName);
      const legacyAreaRowId = createLegacyAreaRowId(student.id, areaName);
      const areaOverrides = getOverrides(areaRowId, legacyAreaRowId);
      if (areaOverrides) {
        (Object.keys(areaOverrides) as Array<keyof PeriodoNotas>).forEach((period) => {
          const val = areaOverrides[period];
          if (val !== undefined) {
            if (period === 'P4') {
              area.DEF.P4 = val;
            } else {
              area.DEF[period] = val;
            }
          }
        });
      }

      // If the area has no subjects, the UI renders a fallback subject row for the area.
      // We apply its overrides directly to area.DEF.
      if (Object.keys(area.asignaturas).length === 0) {
        const fallbackSubjectRowId = createSubjectRowId(student.id, areaName, areaName);
        const legacyFallbackSubjectRowId = createLegacySubjectRowId(student.id, areaName, areaName);
        const fallbackOverrides = getOverrides(fallbackSubjectRowId, legacyFallbackSubjectRowId);
        if (fallbackOverrides) {
          (Object.keys(fallbackOverrides) as Array<keyof PeriodoNotas>).forEach((period) => {
            const val = fallbackOverrides[period];
            if (val !== undefined) {
              if (period === 'P4') {
                area.DEF.P4 = val;
              } else {
                area.DEF[period] = val;
              }
            }
          });
        }
      }

      // Calculate area stats based on area DEF
      area.DEF.A = calcularAcumuladoBase(area.DEF, config, evaluated);
      area.areaStats = {
        promedioActual: calcularPromedioActual(area.DEF, config, evaluated),
        p4Min: calcularMinimoRequerido(area.DEF, config, evaluated),
        estado: determinarEstado(area.DEF, config, evaluated),
      };
    });
  });
}

const SPANISH_GRADES: Record<string, number> = {
  'PRIMERO': 1, 'SEGUNDO': 2, 'TERCERO': 3,
  'CUARTO': 4, 'QUINTO': 5, 'SEXTO': 6,
  'SEPTIMO': 7, 'OCTAVO': 8, 'NOVENO': 9,
  'DECIMO': 10, 'UNDECIMO': 11,
};

export function getGradeFromGroup(grupo: string): number {
  const match = grupo.match(/^(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  
  const upperGrupo = grupo.toUpperCase();
  // Sort by length descending to prevent "DECIMO" from matching inside "UNDECIMO"
  const sortedEntries = Object.entries(SPANISH_GRADES).sort((a, b) => b[0].length - a[0].length);
  
  for (const [word, grade] of sortedEntries) {
    if (upperGrupo.includes(word)) {
      return grade;
    }
  }
  
  return 0;
}

// old getPresetWeights was here

export function inferSubjectWeights(students: Estudiante[], areaName: string, grupo: string): Record<string, number> {
  const subjects = new Set<string>();
  students.forEach(s => {
    const area = s.areas[areaName];
    if (area) {
      Object.keys(area.asignaturas).forEach(asig => subjects.add(asig));
    }
  });

  const subjectList = Array.from(subjects);
  const grade = getGradeFromGroup(grupo);
  const preset = getPresetWeights(areaName, subjectList, grade);
  if (preset) return preset;

  if (subjectList.length === 0) return { [areaName]: 1.0 };
  if (subjectList.length === 1) return { [subjectList[0]]: 1.0 };

  const equalWeights: Record<string, number> = {};
  subjectList.forEach(s => equalWeights[s] = 1 / subjectList.length);

  // We only support inference for 2 or 3 subjects via grid search
  if (subjectList.length > 3) return equalWeights;

  const validStudents = students.filter(s => {
    const area = s.areas[areaName];
    if (!area || area.DEF.P1 === null) return false;
    for (const sub of subjectList) {
      if (area.asignaturas[sub]?.P1 == null) return false;
    }
    return true;
  });

  if (validStudents.length === 0) return equalWeights;

  let bestWeights: number[] = [];
  let minError = Infinity;

  const STEP = 0.01;

  if (subjectList.length === 2) {
    for (let w1 = 0.01; w1 < 1.0; w1 += STEP) {
      const w2 = 1 - w1;
      let error = 0;
      for (const s of validStudents) {
        const area = s.areas[areaName];
        const p1 = area.asignaturas[subjectList[0]].P1!;
        const p2 = area.asignaturas[subjectList[1]].P1!;
        const pred = p1 * w1 + p2 * w2;
        error += Math.abs(pred - area.DEF.P1!);
      }
      if (error < minError) {
        minError = error;
        bestWeights = [w1, w2];
      }
    }
  } else if (subjectList.length === 3) {
    for (let w1 = 0.01; w1 < 1.0; w1 += STEP) {
      for (let w2 = 0.01; w2 < 1.0 - w1; w2 += STEP) {
        const w3 = 1 - w1 - w2;
        if (w3 <= 0) continue;
        let error = 0;
        for (const s of validStudents) {
          const area = s.areas[areaName];
          const p1 = area.asignaturas[subjectList[0]].P1!;
          const p2 = area.asignaturas[subjectList[1]].P1!;
          const p3 = area.asignaturas[subjectList[2]].P1!;
          const pred = p1 * w1 + p2 * w2 + p3 * w3;
          error += Math.abs(pred - area.DEF.P1!);
        }
        if (error < minError) {
          minError = error;
          bestWeights = [w1, w2, w3];
        }
      }
    }
  }

  const avgError = minError / validStudents.length;

  if (avgError > 0.1) {
    return equalWeights;
  }

  const result: Record<string, number> = {};
  subjectList.forEach((sub, i) => {
    result[sub] = Math.round(bestWeights[i] * 100) / 100;
  });
  return result;
}

