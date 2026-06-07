import type { Estudiante, PeriodConfig, SubjectAnalyticsReport, SubjectMetric } from '../../../domain/types';
import { PASSING_GRADE } from '../../academicLogic';

export function generateSubjectAnalyticsReport(students: Estudiante[], grupo: string, _config: PeriodConfig): SubjectAnalyticsReport {
  const groupStudents = students.filter(s => s.grupo === grupo);
  if (groupStudents.length === 0) {
    return { grupo, subjects: [] };
  }
  
  const subjectGrades: Record<string, number[]> = {};
  const subjectFailures: Record<string, number> = {};
  
  groupStudents.forEach(student => {
    Object.entries(student.areas).forEach(([areaName, area]) => {
      const asigEntries = Object.entries(area.asignaturas);
      if (asigEntries.length > 0) {
        asigEntries.forEach(([subName, asig]) => {
          if (typeof asig.promedioActual === 'number') {
            if (!subjectGrades[subName]) {
              subjectGrades[subName] = [];
            }
            subjectGrades[subName].push(asig.promedioActual);
            
            if (asig.promedioActual < PASSING_GRADE) {
              subjectFailures[subName] = (subjectFailures[subName] || 0) + 1;
            }
          }
        });
      } else if (area.areaStats && typeof area.areaStats.promedioActual === 'number') {
        // Fallback for single-subject areas (the Area itself behaves as the subject)
        const subName = areaName;
        if (!subjectGrades[subName]) {
          subjectGrades[subName] = [];
        }
        subjectGrades[subName].push(area.areaStats.promedioActual);
        
        if (area.areaStats.promedioActual < PASSING_GRADE) {
          subjectFailures[subName] = (subjectFailures[subName] || 0) + 1;
        }
      }
    });
  });
  
  const subjects: SubjectMetric[] = Object.entries(subjectGrades).map(([subName, grades]) => {
    const total = grades.length;
    const sum = grades.reduce((acc, val) => acc + val, 0);
    const average = Math.round((sum / total) * 100) / 100;
    const failuresCount = subjectFailures[subName] || 0;
    const failuresRate = Math.round((failuresCount / total) * 1000) / 10;
    
    return {
      asignatura: subName,
      average,
      failuresCount,
      failuresRate,
    };
  });
  
  subjects.sort((a, b) => {
    if (b.failuresCount !== a.failuresCount) {
      return b.failuresCount - a.failuresCount;
    }
    return a.asignatura.localeCompare(b.asignatura);
  });
  
  return {
    grupo,
    subjects,
  };
}
