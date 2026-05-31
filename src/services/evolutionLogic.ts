import type { Estudiante } from '../domain/types';

export interface EvolutionDataPoint {
  period: 'P1' | 'P2' | 'P3' | 'P4';
  average: number | null;
}

export interface AreaEvolution {
  areaName: string;
  data: EvolutionDataPoint[];
}

export interface StudentEvolution {
  estudiante: string;
  globalEvolution: EvolutionDataPoint[];
  areasEvolution: AreaEvolution[];
}

// Calculate the global average of a student for a specific period
function calculateStudentPeriodAverage(student: Estudiante, period: 'P1' | 'P2' | 'P3' | 'P4'): number | null {
  let sum = 0;
  let count = 0;

  Object.values(student.areas).forEach(area => {
    const grade = area.DEF[period];
    if (grade !== null && grade !== undefined) {
      sum += grade;
      count++;
    }
  });

  if (count === 0) return null;
  return sum / count; // Assuming areas are equally weighted for period averages, or we can use subjectWeights if provided.
}

// Calculate the evolution for a single student
export function getStudentEvolution(student: Estudiante): StudentEvolution {
  const periods: ('P1' | 'P2' | 'P3' | 'P4')[] = ['P1', 'P2', 'P3', 'P4'];
  
  const globalEvolution: EvolutionDataPoint[] = periods.map(p => ({
    period: p,
    average: calculateStudentPeriodAverage(student, p)
  }));

  const areasEvolution: AreaEvolution[] = Object.entries(student.areas).map(([areaName, area]) => {
    const data: EvolutionDataPoint[] = periods.map(p => ({
      period: p,
      average: area.DEF[p] ?? null
    }));
    return { areaName, data };
  });

  return {
    estudiante: student.name,
    globalEvolution,
    areasEvolution
  };
}

// Calculate the evolution for a group of students
export function getGroupEvolution(students: Estudiante[]): EvolutionDataPoint[] {
  const periods: ('P1' | 'P2' | 'P3' | 'P4')[] = ['P1', 'P2', 'P3', 'P4'];
  
  return periods.map(p => {
    let sum = 0;
    let count = 0;
    
    students.forEach(student => {
      const avg = calculateStudentPeriodAverage(student, p);
      if (avg !== null) {
        sum += avg;
        count++;
      }
    });

    return {
      period: p,
      average: count > 0 ? sum / count : null
    };
  });
}
