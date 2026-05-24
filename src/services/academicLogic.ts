import type { PeriodConfig, PeriodoNotas, EstadoAcademico, Estudiante, SubjectWeightConfig } from '../domain/types';

export const PASSING_GRADE = 3.0;
export const MAX_GRADE = 5.0;

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
  const promedioHistorico = calcularPromedioActual(notas, config, evaluated);

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

  // Dynamic Risk Evaluation: High Risk when required significantly exceeds historical
  // Using +1.0 as the heuristic for "significant"
  if (minimoRequerido > (promedioHistorico + 1.0) || minimoRequerido > 4.5) {
    // Se requiere un esfuerzo significativamente mayor a su rendimiento histórico
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
      // Check Area-level DEF
      if (area.DEF.P1 !== null && area.DEF.P1 !== undefined) hasP1 = true;
      if (area.DEF.P2 !== null && area.DEF.P2 !== undefined) hasP2 = true;
      if (area.DEF.P3 !== null && area.DEF.P3 !== undefined) hasP3 = true;
      if (area.DEF.P4 !== null && area.DEF.P4 !== undefined) hasP4 = true;

      // Check Subject-level grades
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

export function applyAcademicLogic(students: Estudiante[], config: PeriodConfig, subjectWeights: SubjectWeightConfig = {}): void {
  const evaluated = getEvaluatedPeriods(students);
  students.forEach(student => {
    Object.entries(student.areas).forEach(([areaName, area]) => {
      // Calculate each asignatura
      Object.values(area.asignaturas).forEach((asig) => {
        asig.promedioActual = calcularPromedioActual(asig, config, evaluated);
        asig.p4Min = calcularMinimoRequerido(asig, config, evaluated);
        asig.estado = determinarEstado(asig, config, evaluated);
      });

      // Dynamically calculate Area DEF if weights are provided
      const groupWeights = (subjectWeights as any)[student.grupo] || {};
      const weights = groupWeights[areaName] || (subjectWeights as any)[areaName];
      if (weights && Object.keys(weights).length > 0) {
        (['P1', 'P2', 'P3', 'P4'] as const).forEach(period => {
          let sum = 0;
          let hasGrade = false;
          Object.entries(area.asignaturas).forEach(([asigName, asig]) => {
            const grade = asig[period];
            if (typeof grade === 'number') {
              const w = weights[asigName] || 0;
              sum += grade * w;
              hasGrade = true;
            } else if (evaluated[period]) {
              // Evaluated but missing grade -> treat as 0.0
              const w = weights[asigName] || 0;
              sum += 0 * w;
              hasGrade = true;
            }
          });
          if (hasGrade) {
            area.DEF[period] = roundToOneDecimal(sum);
          }
        });
      }

      // Calculate area stats based on area DEF
      area.areaStats = {
        promedioActual: calcularPromedioActual(area.DEF, config, evaluated),
        p4Min: calcularMinimoRequerido(area.DEF, config, evaluated),
        estado: determinarEstado(area.DEF, config, evaluated),
      };
    });
  });
}

export function getPresetWeights(areaName: string, subjects: string[]): Record<string, number> | null {
  const normArea = areaName.toUpperCase().trim();
  const normSubjects = subjects.map(s => s.toUpperCase().trim());

  if (normArea === 'MATEMATICAS' || normArea === 'MATEMÁTICAS') {
    const hasEst = normSubjects.includes('ESTADISTICA') || normSubjects.includes('ESTADÍSTICA');
    const hasGeo = normSubjects.includes('GEOMETRIA') || normSubjects.includes('GEOMETRÍA');
    const hasMat = normSubjects.includes('MATEMATICAS') || normSubjects.includes('MATEMÁTICAS');
    if (hasEst && hasGeo && hasMat) {
      const estKey = subjects.find(s => s.toUpperCase().trim().includes('ESTADI')) || '';
      const geoKey = subjects.find(s => s.toUpperCase().trim().includes('GEOME')) || '';
      const matKey = subjects.find(s => s.toUpperCase().trim() === 'MATEMATICAS' || s.toUpperCase().trim() === 'MATEMÁTICAS') || '';
      if (estKey && geoKey && matKey) {
        return { [estKey]: 0.30, [geoKey]: 0.20, [matKey]: 0.50 };
      }
    }
  }

  if (normArea === 'CIENCIAS SOCIALES') {
    const hasCatedra = normSubjects.some(s => s.includes('CATEDRA') || s.includes('CÁTEDRA'));
    const hasGeo = normSubjects.includes('GEOGRAFIA') || normSubjects.includes('GEOGRAFÍA');
    const hasHist = normSubjects.includes('HISTORIA') || normSubjects.includes('HISTORÍA');
    if (hasCatedra && hasGeo && hasHist) {
      const catKey = subjects.find(s => s.toUpperCase().trim().includes('CATEDRA') || s.toUpperCase().trim().includes('CÁTEDRA')) || '';
      const geoKey = subjects.find(s => s.toUpperCase().trim() === 'GEOGRAFIA' || s.toUpperCase().trim() === 'GEOGRAFÍA') || '';
      const histKey = subjects.find(s => s.toUpperCase().trim() === 'HISTORIA' || s.toUpperCase().trim() === 'HISTORÍA') || '';
      if (catKey && geoKey && histKey) {
        return { [catKey]: 0.25, [geoKey]: 0.25, [histKey]: 0.50 };
      }
    }
  }

  if (normArea === 'HUMANIDADES Y LENGUA CASTELLANA' || normArea === 'HUMANIDADES') {
    const hasComp = normSubjects.some(s => s.includes('COMPRENSION') || s.includes('COMPRENSIÓN') || s.includes('LECTORA'));
    const hasEsp = normSubjects.some(s => s.includes('ESPAÑOL') || s.includes('ESPANOL'));
    if (hasComp && hasEsp) {
      const compKey = subjects.find(s => s.toUpperCase().trim().includes('COMPRENSION') || s.toUpperCase().trim().includes('COMPRENSIÓN') || s.toUpperCase().trim().includes('LECTORA')) || '';
      const espKey = subjects.find(s => s.toUpperCase().trim().includes('ESPAÑOL') || s.toUpperCase().trim().includes('ESPANOL')) || '';
      if (compKey && espKey) {
        return { [compKey]: 0.40, [espKey]: 0.60 };
      }
    }
  }

  return null;
}

export function inferSubjectWeights(students: Estudiante[], areaName: string): Record<string, number> {
  const subjects = new Set<string>();
  students.forEach(s => {
    const area = s.areas[areaName];
    if (area) {
      Object.keys(area.asignaturas).forEach(asig => subjects.add(asig));
    }
  });

  const subjectList = Array.from(subjects);
  const preset = getPresetWeights(areaName, subjectList);
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

