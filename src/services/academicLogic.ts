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
  students.forEach(student => {
    Object.entries(student.areas).forEach(([areaName, area]) => {
      // Calculate each asignatura
      Object.entries(area.asignaturas).forEach(([asigName, asig]) => {
        const asigRowId = `${student.id}_${areaName}_${asigName}`;
        const overrides = activeSimulations[asigRowId];
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
      
      const asigNames = Object.keys(area.asignaturas);
      if (asigNames.length > 0) {
        if (!weights || Object.keys(weights).length === 0) {
          // Fallback to uniform weights (equal weights)
          const uniformWeight = 1 / asigNames.length;
          const fallbackWeights: Record<string, number> = {};
          asigNames.forEach(name => {
            fallbackWeights[name] = uniformWeight;
          });
          weights = fallbackWeights;
        }

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
          } else {
            // Overwrite any fake 0.0 exported by the platform with null since there are no grades
            area.DEF[period] = null;
          }
        });
      }

      // Apply direct area simulations overrides to area.DEF before calculating areaStats
      const areaRowId = `${student.id}_${areaName}`;
      const areaOverrides = activeSimulations[areaRowId];
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

      // If the area has no subjects, the UI renders a fallback subject with id `${student.id}_${areaName}_${areaName}`.
      // We apply its overrides directly to area.DEF.
      if (asigNames.length === 0) {
        const fallbackSubjectRowId = `${student.id}_${areaName}_${areaName}`;
        const fallbackOverrides = activeSimulations[fallbackSubjectRowId];
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
    const hasCompCiud = normSubjects.some(s => s.includes('COMPETENCIA') || s.includes('CIUDADANA'));
    const hasEco = normSubjects.some(s => s.includes('ECONOMIA') || s.includes('ECONOMÍA'));

    // Sexto a Octavo: Historia (50%), Geografía (25%), Cátedra (25%)
    if (hasCatedra && hasGeo && hasHist) {
      const catKey = subjects.find(s => s.toUpperCase().trim().includes('CATEDRA') || s.toUpperCase().trim().includes('CÁTEDRA')) || '';
      const geoKey = subjects.find(s => s.toUpperCase().trim() === 'GEOGRAFIA' || s.toUpperCase().trim() === 'GEOGRAFÍA') || '';
      const histKey = subjects.find(s => s.toUpperCase().trim() === 'HISTORIA' || s.toUpperCase().trim() === 'HISTORÍA') || '';
      if (catKey && geoKey && histKey) {
        return { [catKey]: 0.25, [geoKey]: 0.25, [histKey]: 0.50 };
      }
    }
    
    // Noveno: Historia (50%), Cátedra (25%), Competencias Ciudadanas (25%)
    if (hasCatedra && hasHist && hasCompCiud && !hasGeo) {
      const catKey = subjects.find(s => s.toUpperCase().trim().includes('CATEDRA') || s.toUpperCase().trim().includes('CÁTEDRA')) || '';
      const histKey = subjects.find(s => s.toUpperCase().trim() === 'HISTORIA' || s.toUpperCase().trim() === 'HISTORÍA') || '';
      const compKey = subjects.find(s => s.toUpperCase().trim().includes('COMPETENCIA') || s.toUpperCase().trim().includes('CIUDADANA')) || '';
      if (catKey && histKey && compKey) {
        return { [catKey]: 0.25, [histKey]: 0.50, [compKey]: 0.25 };
      }
    }

    // Décimo y Undécimo: Economía (50%), Competencias Ciudadanas (50%)
    if (hasEco && hasCompCiud) {
      const ecoKey = subjects.find(s => s.toUpperCase().trim().includes('ECONOMIA') || s.toUpperCase().trim().includes('ECONOMÍA')) || '';
      const compKey = subjects.find(s => s.toUpperCase().trim().includes('COMPETENCIA') || s.toUpperCase().trim().includes('CIUDADANA')) || '';
      if (ecoKey && compKey) {
        return { [ecoKey]: 0.50, [compKey]: 0.50 };
      }
    }
  }

  if (normArea === 'CIENCIAS NATURALES Y AMBIENTALES' || normArea === 'CIENCIAS NATURALES' || normArea === 'NATURALES') {
    const hasEduAmb = normSubjects.some(s => s.includes('AMBIENTAL'));
    const hasBio = normSubjects.includes('BIOLOGIA') || normSubjects.includes('BIOLOGÍA');
    const hasQui = normSubjects.includes('QUIMICA') || normSubjects.includes('QUÍMICA');
    const hasFis = normSubjects.includes('FISICA') || normSubjects.includes('FÍSICA');

    // Sexto a Noveno: Educación Ambiental (50%), Biología (50%)
    if (hasEduAmb && hasBio) {
      const ambKey = subjects.find(s => s.toUpperCase().trim().includes('AMBIENTAL')) || '';
      const bioKey = subjects.find(s => s.toUpperCase().trim() === 'BIOLOGIA' || s.toUpperCase().trim() === 'BIOLOGÍA') || '';
      if (ambKey && bioKey) {
        return { [ambKey]: 0.50, [bioKey]: 0.50 };
      }
    }

    // Décimo y Undécimo: Química (50%), Física (50%)
    if (hasQui && hasFis) {
      const quiKey = subjects.find(s => s.toUpperCase().trim() === 'QUIMICA' || s.toUpperCase().trim() === 'QUÍMICA') || '';
      const fisKey = subjects.find(s => s.toUpperCase().trim() === 'FISICA' || s.toUpperCase().trim() === 'FÍSICA') || '';
      if (quiKey && fisKey) {
        return { [quiKey]: 0.50, [fisKey]: 0.50 };
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

