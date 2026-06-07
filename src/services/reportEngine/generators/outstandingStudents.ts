import type { Estudiante, PeriodConfig, OutstandingStudentsReport } from '../../../domain/types';
import { getStudentAverage } from '../../academicLogic';
import { calculatePercentileRanks } from '../math';

export function generateOutstandingStudentsReport(students: Estudiante[], grupo: string, _config: PeriodConfig): OutstandingStudentsReport {
  const groupStudents = students.filter(s => s.grupo === grupo);
  if (groupStudents.length === 0) {
    return { grupo, students: [] };
  }
  
  const studentAverages = groupStudents.map(s => getStudentAverage(s));
  const percentiles = calculatePercentileRanks(studentAverages);
  
  const mapped = groupStudents.map((s, idx) => {
    const officialRanking = s.rankings && typeof s.rankings['DEF'] === 'number' ? s.rankings['DEF'] : null;
    const officialAverage = s.promedios && typeof s.promedios['DEF'] === 'number' ? s.promedios['DEF'] : null;
    
    return {
      id: s.id,
      name: s.name,
      average: studentAverages[idx],
      percentile: percentiles[idx],
      officialRanking,
      officialAverage
    };
  });
  
  const outstanding = mapped
    .filter(item => {
      if (item.officialRanking !== null) {
        return item.officialRanking <= 3; // Top 3 if official ranking exists
      }
      return item.percentile >= 90; // Otherwise top 10%
    })
    .sort((a, b) => {
      if (a.officialRanking !== null && b.officialRanking !== null) {
        if (a.officialRanking !== b.officialRanking) return a.officialRanking - b.officialRanking;
      }
      if (b.average !== a.average) {
        return b.average - a.average;
      }
      return a.name.localeCompare(b.name);
    });
    
  return {
    grupo,
    students: outstanding,
  };
}
