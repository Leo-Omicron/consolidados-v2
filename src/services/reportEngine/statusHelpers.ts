import type { Estudiante } from '../../domain/types';
import { getStudentAverage, isStudentReprobado, PASSING_GRADE } from '../academicLogic';

export function getFailedAreasCount(student: Estudiante): number {
  let count = 0;
  Object.values(student.areas).forEach(area => {
    if (area.areaStats && area.areaStats.promedioActual < PASSING_GRADE) {
      count++;
    }
  });
  return count;
}

export function getFailedAreasNames(student: Estudiante): string[] {
  const failed: string[] = [];
  Object.entries(student.areas).forEach(([areaName, area]) => {
    if (area.areaStats && area.areaStats.promedioActual < PASSING_GRADE) {
      failed.push(areaName);
    }
  });
  return failed.sort();
}

export function determinePromotionDecision(student: Estudiante): 'Aprobado' | 'Compromisos' | 'Reprobado' {
  const failedCount = getFailedAreasCount(student);
  const avg = getStudentAverage(student);
  
  if (isStudentReprobado(failedCount) || avg < PASSING_GRADE) {
    return 'Reprobado';
  } else if (failedCount >= 1) {
    return 'Compromisos';
  } else {
    return 'Aprobado';
  }
}
