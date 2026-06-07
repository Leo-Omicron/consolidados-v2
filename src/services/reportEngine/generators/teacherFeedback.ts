import type { Estudiante, PeriodConfig, TeacherFeedbackReport } from '../../../domain/types';
import { PASSING_GRADE, getStudentAverage } from '../../academicLogic';
import { calculateCompetitionRanking } from '../math';
import { determinePromotionDecision } from '../statusHelpers';

export function generateTeacherFeedbackReportForGroup(
  students: Estudiante[],
  grupo: string,
  _config: PeriodConfig
): TeacherFeedbackReport[] {
  const groupStudents = students.filter(s => s.grupo === grupo);
  const totalEstudiantesGrupo = groupStudents.length;

  if (totalEstudiantesGrupo === 0) return [];

  // Calculate averages and rankings
  const studentAverages = groupStudents.map(s => getStudentAverage(s));
  const calcRankings = calculateCompetitionRanking(studentAverages);

  const totalAvgSum = studentAverages.reduce((acc, val) => acc + val, 0);
  const promedioGrupo = Math.round((totalAvgSum / totalEstudiantesGrupo) * 100) / 100;

  return groupStudents.map((student, idx) => {
    const overallStatus = determinePromotionDecision(student);
    const avg = studentAverages[idx];
    
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const weaknessesDetail: Array<{ 
      areaName: string; 
      grade: number;
      requiredGrade: number; 
      isImpossible: boolean;
      rescueRoute?: Array<{ asignatura: string; targetGrade: number }>;
    }> = [];
    
    const totalAreasCount = Object.keys(student.areas).length;
    let failedAreasCount = 0;

    Object.entries(student.areas).forEach(([areaName, area]) => {
      if (area.areaStats) {
        if (area.areaStats.promedioActual >= 4.0) {
          strengths.push(areaName);
        } else if (area.areaStats.promedioActual < PASSING_GRADE) {
          weaknesses.push(areaName);
          failedAreasCount++;
          
          const isImpossible = area.areaStats.estado.text === 'Perdido' || area.areaStats.p4Min > 5.0;
          let rescueRoute: Array<{ asignatura: string; targetGrade: number }> | undefined = undefined;
          
          if (!isImpossible && Object.keys(area.asignaturas).length > 1) {
            rescueRoute = Object.keys(area.asignaturas).map(asigName => ({
              asignatura: asigName,
              targetGrade: area.areaStats!.p4Min
            }));
          }

          weaknessesDetail.push({
            areaName,
            grade: area.areaStats.promedioActual,
            requiredGrade: area.areaStats.p4Min,
            isImpossible,
            rescueRoute
          });
        }
      }
    });
    
    strengths.sort();
    weaknesses.sort();
    weaknessesDetail.sort((a, b) => a.areaName.localeCompare(b.areaName));
    
    let adviceText: string;
    if (avg >= 4.5) {
      adviceText = 'Continúa con ese gran nivel y apoya a tus compañeros.';
    } else if (avg >= 4.0) {
      adviceText = 'Excelente rendimiento. Sigue así para mantener tus resultados.';
    } else if (overallStatus === 'Aprobado') {
      adviceText = 'Buen desempeño general. Puedes esforzarte un poco más para sobresalir.';
    } else if (overallStatus === 'Compromisos') {
      adviceText = 'Tienes algunas asignaturas pendientes. Con un poco más de esfuerzo y dedicación lograrás superarlas.';
    } else {
      adviceText = 'Tu situación académica es crítica. Es indispensable establecer un plan de recuperación inmediato junto con tus profesores y acudiente.';
    }
    
    const officialRank = student.rankings && typeof student.rankings['DEF'] === 'number' ? student.rankings['DEF'] : calcRankings[idx];
    const officialAvg = student.promedios && typeof student.promedios['DEF'] === 'number' ? student.promedios['DEF'] : avg;

    return {
      studentId: student.id,
      studentName: student.name,
      grupo: student.grupo,
      overallStatus,
      strengths,
      weaknesses,
      adviceText,
      promedioActual: officialAvg,
      promedioGrupo,
      puestoGrupo: officialRank,
      totalEstudiantesGrupo,
      totalAreasCount,
      failedAreasCount,
      weaknessesDetail
    };
  });
}
