import type { Estudiante, HeatmapReport, HeatmapRow, HeatmapCell } from '../../../domain/types';
import { getStudentAverage } from '../../academicLogic';

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
