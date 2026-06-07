import type { Estudiante, GroupComparisonReport, GroupComparisonMetrics } from '../../../domain/types';
import { getStudentAverage } from '../../academicLogic';
import { calculateStandardDeviation } from '../math';
import { getFailedAreasCount, determinePromotionDecision } from '../statusHelpers';

export function generateGroupComparisonReport(students: Estudiante[]): GroupComparisonReport {
  const groupsSet = new Set<string>();
  students.forEach(s => {
    if (s.grupo) groupsSet.add(s.grupo);
  });
  
  const groupList = Array.from(groupsSet).sort();
  const groups: GroupComparisonMetrics[] = groupList.map(grupo => {
    const groupStudents = students.filter(s => s.grupo === grupo);
    const totalStudents = groupStudents.length;
    
    const studentAverages = groupStudents.map(s => getStudentAverage(s));
    const sumAvg = studentAverages.reduce((acc, val) => acc + val, 0);
    const average = Math.round((sumAvg / totalStudents) * 100) / 100;
    
    const standardDeviation = calculateStandardDeviation(studentAverages, average);
    
    let totalFailures = 0;
    let reprobadosCount = 0;
    groupStudents.forEach(student => {
      totalFailures += getFailedAreasCount(student);
      if (determinePromotionDecision(student) === 'Reprobado') {
        reprobadosCount++;
      }
    });
    
    return {
      grupo,
      totalStudents,
      average,
      standardDeviation,
      failuresCount: totalFailures,
      reprobadosCount,
    };
  });
  
  return {
    groups,
  };
}
