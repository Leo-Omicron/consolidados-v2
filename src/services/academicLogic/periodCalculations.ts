import type { PeriodoNotas, PeriodConfig, EstadoAcademico } from '../../domain/types';
import { getAccumulatedWeightAndProduct, roundToOneDecimal } from './math';
import { PASSING_GRADE, MAX_GRADE } from './constants';

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
