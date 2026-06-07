import type { Estudiante, PeriodConfig, AcademicRiskReport, AcademicRiskStudent } from '../../../domain/types';
import { getStudentAverage } from '../../academicLogic';
import { getFailedAreasNames } from '../statusHelpers';
import { calculateRequiredGrade } from '../math';

export function generateAcademicRiskReport(students: Estudiante[], grupo: string, config: PeriodConfig): AcademicRiskReport {
  const groupStudents = students.filter(s => s.grupo === grupo);
  const criticalStudents: AcademicRiskStudent[] = [];
  
  groupStudents.forEach(student => {
    const failedAreas = getFailedAreasNames(student);
    const impossibilityMathAreas: string[] = [];
    
    Object.entries(student.areas).forEach(([areaName, area]) => {
      const mathRisk = calculateRequiredGrade(area.DEF, config);
      if (mathRisk.isImpossible) {
        impossibilityMathAreas.push(areaName);
      }
    });
    
    if (failedAreas.length > 0 || impossibilityMathAreas.length > 0) {
      criticalStudents.push({
        id: student.id,
        name: student.name,
        average: getStudentAverage(student),
        failedAreasCount: failedAreas.length,
        failedAreas,
        impossibilityMathAreas: impossibilityMathAreas.sort(),
      });
    }
  });
  
  criticalStudents.sort((a, b) => {
    if (b.failedAreasCount !== a.failedAreasCount) {
      return b.failedAreasCount - a.failedAreasCount;
    }
    if (a.average !== b.average) {
      return a.average - b.average;
    }
    return a.name.localeCompare(b.name);
  });
  
  return {
    grupo,
    criticalStudents,
  };
}
