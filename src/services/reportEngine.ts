import type {
  PeriodConfig,
  PeriodoNotas,
  Estudiante,
  GroupPerformanceReport,
  OutstandingStudentsReport,
  AcademicRiskReport,
  SubjectAnalyticsReport,
  GroupComparisonReport,
  HeatmapReport,
  TeacherFeedbackReport,
  OfficialRecordsReport,
  HeatmapCell,
  HeatmapRow,
  OfficialRecordRow,
  GroupComparisonMetrics,
  SubjectMetric,
  AcademicRiskStudent,
} from '../domain/types';
import { getAccumulatedWeightAndProduct } from './academicLogic';

export function calculateStandardDeviation(values: number[], mean: number): number {
  if (values.length === 0) return 0;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.round(Math.sqrt(variance) * 10) / 10;
}

export function calculatePercentileRanks(values: number[]): number[] {
  const N = values.length;
  if (N === 0) return [];
  if (N === 1) return [100];
  
  const indexed = values.map((val, idx) => ({ val, idx }));
  indexed.sort((a, b) => a.val - b.val);
  
  const ranks = new Array<number>(N);
  let currentRank = 1;
  
  for (let i = 0; i < N; i++) {
    if (i > 0 && indexed[i].val > indexed[i - 1].val) {
      currentRank = i + 1;
    }
    const R = currentRank;
    const P = ((R - 1) / (N - 1)) * 100;
    ranks[indexed[i].idx] = Math.round(P);
  }
  return ranks;
}

export function calculateRequiredGrade(notas: PeriodoNotas, config: PeriodConfig): { required: number; isImpossible: boolean } {
  const { sumProduct, sumWeight, totalWeight } = getAccumulatedWeightAndProduct(notas, config);
  const remainingWeight = totalWeight - sumWeight;
  
  if (remainingWeight <= 0) return { required: 0, isImpossible: false };
  
  const G_accum = sumProduct / totalWeight;
  if (G_accum >= 2.95) return { required: 0, isImpossible: false };
  
  const W_final = remainingWeight / totalWeight;
  const G_req = (2.95 - G_accum) / W_final;
  const finalVal = Math.round(G_req * 100) / 100;
  
  return {
    required: finalVal,
    isImpossible: finalVal > 5.0
  };
}

export function calculateCompetitionRanking(averages: number[]): number[] {
  const N = averages.length;
  if (N === 0) return [];
  
  const indexed = averages.map((val, idx) => ({ val, idx }));
  indexed.sort((a, b) => b.val - a.val); // descending
  
  const rankings = new Array<number>(N);
  let currentRank = 1;
  
  for (let i = 0; i < N; i++) {
    if (i > 0 && indexed[i].val < indexed[i - 1].val) {
      currentRank = i + 1;
    }
    rankings[indexed[i].idx] = currentRank;
  }
  return rankings;
}

// Private helper to calculate student overall average (mean of their areas' averages)
function getStudentAverage(student: Estudiante): number {
  const areaStatsList = Object.values(student.areas)
    .map(area => area.areaStats?.promedioActual)
    .filter((v): v is number => typeof v === 'number');
  if (areaStatsList.length === 0) return 0;
  const sum = areaStatsList.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / areaStatsList.length) * 100) / 100;
}

// Private helper to get number of failed areas
function getFailedAreasCount(student: Estudiante): number {
  let count = 0;
  Object.values(student.areas).forEach(area => {
    if (area.areaStats && area.areaStats.promedioActual < 3.0) {
      count++;
    }
  });
  return count;
}

// Private helper to get failed area names
function getFailedAreasNames(student: Estudiante): string[] {
  const failed: string[] = [];
  Object.entries(student.areas).forEach(([areaName, area]) => {
    if (area.areaStats && area.areaStats.promedioActual < 3.0) {
      failed.push(areaName);
    }
  });
  return failed.sort();
}

// Private helper to determine promotion decision
function determinePromotionDecision(student: Estudiante): 'Aprobado' | 'Compromisos' | 'Reprobado' {
  const failedCount = getFailedAreasCount(student);
  const avg = getStudentAverage(student);
  
  if (failedCount >= 3 || avg < 3.0) {
    return 'Reprobado';
  } else if (failedCount >= 1) {
    return 'Compromisos';
  } else {
    return 'Aprobado';
  }
}

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
      if (area.areaStats && area.areaStats.promedioActual < 3.0) {
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

export function generateOutstandingStudentsReport(students: Estudiante[], grupo: string, _config: PeriodConfig): OutstandingStudentsReport {
  const groupStudents = students.filter(s => s.grupo === grupo);
  if (groupStudents.length === 0) {
    return { grupo, students: [] };
  }
  
  const studentAverages = groupStudents.map(s => getStudentAverage(s));
  const percentiles = calculatePercentileRanks(studentAverages);
  
  const mapped = groupStudents.map((s, idx) => ({
    id: s.id,
    name: s.name,
    average: studentAverages[idx],
    percentile: percentiles[idx],
  }));
  
  const outstanding = mapped
    .filter(item => item.percentile >= 90)
    .sort((a, b) => {
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
            
            if (asig.promedioActual < 3.0) {
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
        
        if (area.areaStats.promedioActual < 3.0) {
          subjectFailures[subName] = (subjectFailures[subName] || 0) + 1;
        }
      }
    });
  });
  
  const subjects: SubjectMetric[] = Object.entries(subjectGrades).map(([subName, grades]) => {
    const total = grades.length;
    const sum = grades.reduce((acc, val) => acc + val, 0);
    const average = total > 0 ? Math.round((sum / total) * 100) / 100 : 0;
    const failuresCount = subjectFailures[subName] || 0;
    const failuresRate = total > 0 ? Math.round((failuresCount / total) * 1000) / 10 : 0;
    
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

export function generateGroupComparisonReport(students: Estudiante[], _config: PeriodConfig): GroupComparisonReport {
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
    const average = totalStudents > 0 ? Math.round((sumAvg / totalStudents) * 100) / 100 : 0;
    
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

export function generateHeatmapReport(students: Estudiante[], grupo: string): HeatmapReport {
  const groupStudents = students.filter(s => s.grupo === grupo);
  
  const areasSet = new Set<string>();
  groupStudents.forEach(student => {
    Object.keys(student.areas).forEach(area => areasSet.add(area));
  });
  
  const areasList = Array.from(areasSet).sort();
  
  const rows: HeatmapRow[] = groupStudents.map(student => {
    const grades: Record<string, HeatmapCell> = {};
    
    areasList.forEach(areaName => {
      const area = student.areas[areaName];
      if (area && area.areaStats) {
        grades[areaName] = {
          grade: area.areaStats.promedioActual,
          color: area.areaStats.estado.color,
        };
      } else {
        grades[areaName] = {
          grade: null,
          color: 'gray',
        };
      }
    });
    
    return {
      studentId: student.id,
      studentName: student.name,
      grades,
      promActual: getStudentAverage(student),
    };
  });
  
  rows.sort((a, b) => a.studentName.localeCompare(b.studentName));
  
  return {
    grupo,
    areasList,
    rows,
  };
}

export function generateTeacherFeedbackReportForGroup(
  students: Estudiante[],
  grupo: string,
  config: PeriodConfig
): TeacherFeedbackReport[] {
  const groupStudents = students.filter(s => s.grupo === grupo);
  const totalEstudiantesGrupo = groupStudents.length;

  if (totalEstudiantesGrupo === 0) return [];

  // Calculate averages and rankings
  const studentAverages = groupStudents.map(s => getStudentAverage(s));
  const rankings = calculateCompetitionRanking(studentAverages);

  const totalAvgSum = studentAverages.reduce((acc, val) => acc + val, 0);
  const promedioGrupo = Math.round((totalAvgSum / totalEstudiantesGrupo) * 100) / 100;

  return groupStudents.map((student, idx) => {
    const overallStatus = determinePromotionDecision(student);
    const avg = studentAverages[idx];
    
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const weaknessesDetail: Array<{ areaName: string; requiredGrade: number; isImpossible: boolean }> = [];
    
    const totalAreasCount = Object.keys(student.areas).length;
    let failedAreasCount = 0;

    Object.entries(student.areas).forEach(([areaName, area]) => {
      if (area.areaStats) {
        if (area.areaStats.promedioActual >= 4.0) {
          strengths.push(areaName);
        } else if (area.areaStats.promedioActual < 3.0) {
          weaknesses.push(areaName);
          failedAreasCount++;
          
          const gradeReq = calculateRequiredGrade(area.DEF, config);
          weaknessesDetail.push({
            areaName,
            requiredGrade: gradeReq.required,
            isImpossible: gradeReq.isImpossible
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
    
    return {
      studentId: student.id,
      studentName: student.name,
      grupo: student.grupo,
      overallStatus,
      strengths,
      weaknesses,
      adviceText,
      promedioActual: avg,
      promedioGrupo,
      puestoGrupo: rankings[idx],
      totalEstudiantesGrupo,
      totalAreasCount,
      failedAreasCount,
      weaknessesDetail
    };
  });
}

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
