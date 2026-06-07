import type { Estudiante, PeriodConfig, GroupPerformanceReport } from '../../../domain/types';
import { PASSING_GRADE, getStudentAverage } from '../../academicLogic';
import { calculateStandardDeviation } from '../math';
import { determinePromotionDecision } from '../statusHelpers';

export function generateGroupPerformanceReport(students: Estudiante[], grupo: string, _config: PeriodConfig): GroupPerformanceReport {
  const groupStudents = students.filter(s => s.grupo === grupo);
  const totalStudents = groupStudents.length;
  
  if (totalStudents === 0) {
    return {
      grupo,
      totalStudents: 0,
      average: 0,
      standardDeviation: 0,
      promotionRate: 0,
      criticalAreas: [],
    };
  }
  
  const studentAverages = groupStudents.map(s => getStudentAverage(s));
  const totalAvgSum = studentAverages.reduce((acc, val) => acc + val, 0);
  const average = Math.round((totalAvgSum / totalStudents) * 100) / 100;
  
  const sd = calculateStandardDeviation(studentAverages, average);
  
  const nonReprobados = groupStudents.filter(s => determinePromotionDecision(s) !== 'Reprobado').length;
  const promotionRate = Math.round((nonReprobados / totalStudents) * 1000) / 10;
  
  // Critical Areas
  const areaFailures: Record<string, number> = {};
  groupStudents.forEach(student => {
    Object.entries(student.areas).forEach(([areaName, area]) => {
      if (area.areaStats && area.areaStats.promedioActual < PASSING_GRADE) {
        areaFailures[areaName] = (areaFailures[areaName] || 0) + 1;
      }
    });
  });
  
  const criticalAreas = Object.entries(areaFailures)
    .map(([area, failuresCount]) => ({ area, failuresCount }))
    .sort((a, b) => {
      if (b.failuresCount !== a.failuresCount) {
        return b.failuresCount - a.failuresCount;
      }
      return a.area.localeCompare(b.area);
    });
    
  return {
    grupo,
    totalStudents,
    average,
    standardDeviation: sd,
    promotionRate,
    criticalAreas,
  };
}
