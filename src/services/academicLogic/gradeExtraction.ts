import type { Estudiante, Trend } from '../../domain/types';

export function determineAcademicTrend(
  firstPeriod: number | null | undefined,
  secondPeriod: number | null | undefined,
  thirdPeriod: number | null | undefined
): Trend {
  const latestPeriod = typeof thirdPeriod === 'number' ? thirdPeriod : secondPeriod;

  if (typeof firstPeriod !== 'number' || typeof latestPeriod !== 'number') {
    return 'none';
  }

  if (latestPeriod > firstPeriod) return 'up';
  if (latestPeriod < firstPeriod) return 'down';
  return 'flat';
}

const SPANISH_GRADES: Record<string, number> = {
  'PRIMERO': 1, 'SEGUNDO': 2, 'TERCERO': 3,
  'CUARTO': 4, 'QUINTO': 5, 'SEXTO': 6,
  'SEPTIMO': 7, 'OCTAVO': 8, 'NOVENO': 9,
  'DECIMO': 10, 'UNDECIMO': 11,
};

export function getGradeFromGroup(grupo: string): number {
  const match = grupo.match(/^(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  
  const upperGrupo = grupo.toUpperCase();
  // Sort by length descending to prevent "DECIMO" from matching inside "UNDECIMO"
  const sortedEntries = Object.entries(SPANISH_GRADES).sort((a, b) => b[0].length - a[0].length);
  
  for (const [word, grade] of sortedEntries) {
    if (upperGrupo.includes(word)) {
      return grade;
    }
  }
  
  return 0;
}

export function getEvaluatedPeriods(students: Estudiante[]) {
  let hasP1 = false;
  let hasP2 = false;
  let hasP3 = false;
  let hasP4 = false;

  students.forEach(student => {
    Object.values(student.areas).forEach(area => {
      // Only check Subject-level grades because the platform exports fake 0.0s for future periods in the Area DEF column
      Object.values(area.asignaturas).forEach(asig => {
        if (asig.P1 !== null && asig.P1 !== undefined) hasP1 = true;
        if (asig.P2 !== null && asig.P2 !== undefined) hasP2 = true;
        if (asig.P3 !== null && asig.P3 !== undefined) hasP3 = true;
        if (asig.P4 !== null && asig.P4 !== undefined) hasP4 = true;
      });
    });
  });

  return { P1: hasP1, P2: hasP2, P3: hasP3, P4: hasP4 };
}
