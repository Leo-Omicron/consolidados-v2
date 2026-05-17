import { PeriodConfig, PeriodoNotas, EstadoAcademico } from '../domain/types';

export const PASSING_GRADE = 3.0;
export const MAX_GRADE = 5.0;

export function getAccumulatedWeightAndProduct(notas: PeriodoNotas, config: PeriodConfig) {
  let sumProduct = 0;
  let sumWeight = 0;
  const totalWeight = config.P1 + config.P2 + config.P3 + (config.P4 || 0);

  if (notas.P1 !== null && notas.P1 !== undefined && config.P1) {
    sumProduct += notas.P1 * config.P1;
    sumWeight += config.P1;
  }
  if (notas.P2 !== null && notas.P2 !== undefined && config.P2) {
    sumProduct += notas.P2 * config.P2;
    sumWeight += config.P2;
  }
  if (notas.P3 !== null && notas.P3 !== undefined && config.P3) {
    sumProduct += notas.P3 * config.P3;
    sumWeight += config.P3;
  }
  if (notas.P4 !== null && notas.P4 !== undefined && config.P4) {
    sumProduct += notas.P4 * config.P4;
    sumWeight += config.P4;
  }

  return { sumProduct, sumWeight, totalWeight };
}

export function calcularPromedioActual(notas: PeriodoNotas, config: PeriodConfig): number {
  const { sumProduct, sumWeight } = getAccumulatedWeightAndProduct(notas, config);
  
  if (sumWeight === 0) return 0;
  
  // Format to 2 decimal places
  const prom = sumProduct / sumWeight;
  return Math.round(prom * 100) / 100;
}

export function calcularMinimoRequerido(notas: PeriodoNotas, config: PeriodConfig): number {
  const { sumProduct, sumWeight, totalWeight } = getAccumulatedWeightAndProduct(notas, config);
  
  const remainingWeight = totalWeight - sumWeight;
  
  // If no periods left, return 0
  if (remainingWeight <= 0) return 0;
  
  const neededProduct = (PASSING_GRADE * totalWeight) - sumProduct;
  
  // If already reached passing grade accumulated equivalent, return 0
  if (neededProduct <= 0) return 0;
  
  const requiredGrade = neededProduct / remainingWeight;
  
  return Math.round(requiredGrade * 100) / 100;
}

export function determinarEstado(notas: PeriodoNotas, config: PeriodConfig): EstadoAcademico {
  const { sumWeight, totalWeight, sumProduct } = getAccumulatedWeightAndProduct(notas, config);
  const remainingWeight = totalWeight - sumWeight;
  
  const acumuladoFinalProyectadoMax = (sumProduct + (MAX_GRADE * remainingWeight)) / totalWeight;
  const acumuladoActual = sumProduct / totalWeight;
  const minimoRequerido = calcularMinimoRequerido(notas, config);

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

  if (minimoRequerido > 4.0) {
    // Se requiere un promedio en los cortes restantes mayor a 4.0 (difícil)
    return { text: 'En riesgo', color: 'yellow' };
  }
  
  if (minimoRequerido > PASSING_GRADE) {
    // Se requiere más de 3.0 pero menos de 4.0
    return { text: 'Recuperable', color: 'blue' };
  }

  // Si requiere 3.0 o menos en los cortes restantes
  return { text: 'Ganable', color: 'cyan' };
}
