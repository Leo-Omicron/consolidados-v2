import { useMemo } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { getEvaluatedPeriods } from '../services/academicLogic';
import {
  detectArchetype,
  calculateStudentPeriodAverages,
} from '../services/insightsLogic';
import type { ArchetypeResult, InsightCounts } from '../domain/types';

const EMPTY_COUNTS: InsightCounts = {
  confiado: 0,
  resiliente: 0,
  'montana-rusa': 0,
  radar: 0,
  total: 0,
};

export function useInsights() {
  const estudiantes = useDashboardStore((s) => s.estudiantes);

  return useMemo(() => {
    if (estudiantes.length === 0) {
      return {
        results: [] as ArchetypeResult[],
        counts: EMPTY_COUNTS,
        evaluatedPeriods: { P1: false, P2: false, P3: false, P4: false },
      };
    }

    const evaluatedPeriods = getEvaluatedPeriods(estudiantes);

    const results: ArchetypeResult[] = [];
    const counts: InsightCounts = {
      confiado: 0,
      resiliente: 0,
      'montana-rusa': 0,
      radar: 0,
      total: 0,
    };

    for (const estudiante of estudiantes) {
      const periodGrades = calculateStudentPeriodAverages(estudiante);
      const detection = detectArchetype(periodGrades);

      if (detection) {
        const result: ArchetypeResult = {
          ...detection,
          estudianteId: estudiante.id,
          estudianteName: estudiante.name,
          grupo: estudiante.grupo,
        };
        results.push(result);
        counts[result.archetype as keyof InsightCounts]++;
        counts.total++;
      }
    }

    return { results, counts, evaluatedPeriods };
  }, [estudiantes]);
}
