import type { PeriodConfig, PeriodoNotas } from '../../domain/types';

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
