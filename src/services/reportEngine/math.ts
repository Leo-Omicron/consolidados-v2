import type { PeriodConfig, PeriodoNotas } from '../../domain/types';
import { getAccumulatedWeightAndProduct } from '../academicLogic';

export function calculateStandardDeviation(values: number[], mean: number): number {
  if (values.length === 0) return 0;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.round(Math.sqrt(variance) * 10) / 10;
}

export function calculatePercentileRanks(values: number[]): number[] {
  const N = values.length;
  if (N === 0) return [];
  if (N === 1) return [100];
  
  const indexed = values.map((val, idx) => ({ val, idx }));
  indexed.sort((a, b) => a.val - b.val);
  
  const ranks = new Array<number>(N);
  let currentRank = 1;
  
  for (let i = 0; i < N; i++) {
    if (i > 0 && indexed[i].val > indexed[i - 1].val) {
      currentRank = i + 1;
    }
    const R = currentRank;
    const P = ((R - 1) / (N - 1)) * 100;
    ranks[indexed[i].idx] = Math.round(P);
  }
  return ranks;
}

export function calculateRequiredGrade(notas: PeriodoNotas, config: PeriodConfig): { required: number; isImpossible: boolean } {
  const { sumProduct, sumWeight, totalWeight } = getAccumulatedWeightAndProduct(notas, config);
  const remainingWeight = totalWeight - sumWeight;
  
  if (remainingWeight <= 0) return { required: 0, isImpossible: false };
  
  const G_accum = sumProduct / totalWeight;
  if (G_accum >= 2.95) return { required: 0, isImpossible: false };
  
  const W_final = remainingWeight / totalWeight;
  const G_req = (2.95 - G_accum) / W_final;
  const finalVal = Math.round(G_req * 100) / 100;
  
  return {
    required: finalVal,
    isImpossible: finalVal > 5.0
  };
}

export function calculateCompetitionRanking(averages: number[]): number[] {
  const N = averages.length;
  if (N === 0) return [];
  
  const indexed = averages.map((val, idx) => ({ val, idx }));
  indexed.sort((a, b) => b.val - a.val); // descending
  
  const rankings = new Array<number>(N);
  let currentRank = 1;
  
  for (let i = 0; i < N; i++) {
    if (i > 0 && indexed[i].val < indexed[i - 1].val) {
      currentRank = i + 1;
    }
    rankings[indexed[i].idx] = currentRank;
  }
  return rankings;
}
