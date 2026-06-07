import type { Estudiante } from '../../domain/types';
import { roundToOneDecimal } from './math';
import { 
  ACADEMIC_FAILURE_AREA_THRESHOLD, 
  ACADEMIC_STRENGTH_THRESHOLD, 
  type AcademicPeriodKey, 
  type StudentAverageKey 
} from './constants';

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
