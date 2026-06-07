import type { Estudiante, PeriodConfig, OfficialRecordsReport, OfficialRecordRow } from '../../../domain/types';
import { getStudentAverage } from '../../academicLogic';
import { calculateCompetitionRanking } from '../math';
import { getFailedAreasCount, determinePromotionDecision } from '../statusHelpers';

export function generateOfficialRecordsReport(
  students: Estudiante[],
  grupo: string,
  _config: PeriodConfig,
  periodName?: string,
  directorName?: string
): OfficialRecordsReport {
  const groupStudents = students.filter(s => s.grupo === grupo);
  
  const areasSet = new Set<string>();
  groupStudents.forEach(student => {
    Object.keys(student.areas).forEach(area => areasSet.add(area));
  });
  const areasList = Array.from(areasSet).sort();
  
  const studentAverages = groupStudents.map(s => getStudentAverage(s));
  const rankings = calculateCompetitionRanking(studentAverages);
  
  const rows: OfficialRecordRow[] = groupStudents.map((student, idx) => {
    const grades: Record<string, number | null> = {};
    
    areasList.forEach(areaName => {
      const area = student.areas[areaName];
      grades[areaName] = area?.areaStats?.promedioActual ?? null;
    });
    
    return {
      studentId: student.id,
      studentName: student.name,
      grades,
      promActual: studentAverages[idx],
      ranking: rankings[idx],
      failedAreasCount: getFailedAreasCount(student),
      decision: determinePromotionDecision(student),
    };
  });
  
  rows.sort((a, b) => {
    if (a.ranking !== b.ranking) {
      return a.ranking - b.ranking;
    }
    return a.studentName.localeCompare(b.studentName);
  });
  
  return {
    grupo,
    period: periodName || 'N/A',
    director: directorName || 'N/A',
    rows,
  };
}
