import type { Estudiante } from '../domain/types';
import { getStudentAverage, PASSING_GRADE } from './academicLogic';
import { determinePromotionDecision } from './reportEngine/statusHelpers';

export interface GroupExecutiveMetrics {
  groupName: string;
  totalStudents: number;
  average: number;
  passRate: number;
  atRiskCount: number;
  statusDistribution: {
    ganado: number;
    recuperable: number;
    enRiesgo: number;
  };
}

export interface CriticalArea {
  areaName: string;
  failureCount: number;
}

export interface OutstandingGlobalStudent {
  id: string;
  name: string;
  grupo: string;
  average: number;
}

export interface ExecutiveReport {
  totalStudents: number;
  globalAverage: number;
  globalPassRate: number;
  totalAtRisk: number;
  globalStatusDistribution: {
    ganado: number;
    recuperable: number;
    enRiesgo: number;
  };
  groups: GroupExecutiveMetrics[];
  criticalAreas: CriticalArea[];
  topStudents: OutstandingGlobalStudent[];
}

export function generateExecutiveReport(estudiantes: Estudiante[]): ExecutiveReport {
  if (!estudiantes || estudiantes.length === 0) {
    return {
      totalStudents: 0,
      globalAverage: 0,
      globalPassRate: 0,
      totalAtRisk: 0,
      globalStatusDistribution: { ganado: 0, recuperable: 0, enRiesgo: 0 },
      groups: [],
      criticalAreas: [],
      topStudents: []
    };
  }

  const totalStudents = estudiantes.length;
  
  let globalSum = 0;
  let globalPassCount = 0;
  let totalAtRisk = 0;
  let globalGanado = 0;
  let globalRecuperable = 0;
  let globalEnRiesgo = 0;

  const groupMap = new Map<string, Estudiante[]>();
  const areaFailures = new Map<string, number>();
  
  // To track all students for Top 5 ranking
  const allStudentsForRanking: OutstandingGlobalStudent[] = [];

  estudiantes.forEach(est => {
    // Global metrics
    const studentAverage = getStudentAverage(est);
    globalSum += studentAverage;
    
    const decision = determinePromotionDecision(est);
    if (decision === 'Aprobado') {
      globalPassCount++;
      globalGanado++;
    } else if (decision === 'Compromisos') {
      totalAtRisk++;
      globalRecuperable++;
    } else {
      totalAtRisk++;
      globalEnRiesgo++;
    }

    allStudentsForRanking.push({
      id: est.id,
      name: est.name,
      grupo: est.grupo,
      average: studentAverage
    });

    // Group mapping
    if (!groupMap.has(est.grupo)) {
      groupMap.set(est.grupo, []);
    }
    groupMap.get(est.grupo)!.push(est);

    // Area failures
    Object.entries(est.areas).forEach(([areaName, area]) => {
      if (area.areaStats && area.areaStats.promedioActual < PASSING_GRADE) {
        areaFailures.set(areaName, (areaFailures.get(areaName) || 0) + 1);
      }
    });
  });

  const globalAverage = totalStudents > 0 ? Number((globalSum / totalStudents).toFixed(2)) : 0;
  const globalPassRate = totalStudents > 0 ? Number(((globalPassCount / totalStudents) * 100).toFixed(1)) : 0;

  const groups: GroupExecutiveMetrics[] = Array.from(groupMap.entries()).map(([groupName, groupStudents]) => {
    let groupSum = 0;
    let groupPassCount = 0;
    let groupAtRiskCount = 0;
    let ganado = 0;
    let recuperable = 0;
    let enRiesgo = 0;

    groupStudents.forEach(est => {
      const studentAverage = getStudentAverage(est);
      groupSum += studentAverage;
      
      const decision = determinePromotionDecision(est);
      if (decision === 'Aprobado') {
        groupPassCount++;
        ganado++;
      } else if (decision === 'Compromisos') {
        groupAtRiskCount++;
        recuperable++;
      } else {
        groupAtRiskCount++;
        enRiesgo++;
      }
    });

    return {
      groupName,
      totalStudents: groupStudents.length,
      average: Number((groupSum / groupStudents.length).toFixed(2)),
      passRate: Number(((groupPassCount / groupStudents.length) * 100).toFixed(1)),
      atRiskCount: groupAtRiskCount,
      statusDistribution: {
        ganado,
        recuperable,
        enRiesgo
      }
    };
  }).sort((a, b) => a.groupName.localeCompare(b.groupName));

  const criticalAreas: CriticalArea[] = Array.from(areaFailures.entries())
    .map(([areaName, failureCount]) => ({ areaName, failureCount }))
    .sort((a, b) => b.failureCount - a.failureCount); // Descending

  const topStudents = allStudentsForRanking
    .sort((a, b) => b.average - a.average || a.name.localeCompare(b.name))
    .slice(0, 5);

  return {
    totalStudents,
    globalAverage,
    globalPassRate,
    totalAtRisk,
    globalStatusDistribution: {
      ganado: globalGanado,
      recuperable: globalRecuperable,
      enRiesgo: globalEnRiesgo
    },
    groups,
    criticalAreas,
    topStudents
  };
}
