export const PASSING_GRADE = 3.0;
export const MAX_GRADE = 5.0;
export const ACADEMIC_FAILURE_AREA_THRESHOLD = 3;
export const ACADEMIC_STRENGTH_THRESHOLD = 3.5;
export type StudentAverageKey = 'DEF' | 'P1' | 'P2' | 'P3' | 'P4';
export type AcademicPeriodKey = Exclude<StudentAverageKey, 'DEF'>;
