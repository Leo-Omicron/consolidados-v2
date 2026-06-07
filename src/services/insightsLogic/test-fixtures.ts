import type { Estudiante } from '../../domain/types';

export const mockStudentSingleArea = {
  id: 's1', name: 'Test', CURSO: '10', grupo: '10A',
  areas: {
    MAT: {
      asignaturas: {},
      DEF: { P1: 4.0, P2: 3.5, P3: 3.0, P4: null },
    },
  },
} as unknown as Estudiante;

export const mockStudentMultiArea = {
  id: 's1', name: 'Test', CURSO: '10', grupo: '10A',
  areas: {
    MAT: {
      asignaturas: {},
      DEF: { P1: 4.0, P2: 4.0, P3: null, P4: null },
    },
    LEN: {
      asignaturas: {},
      DEF: { P1: 3.0, P2: 3.0, P3: null, P4: null },
    },
  },
} as unknown as Estudiante;

export const mockStudentOfficialAverages = {
  id: 's1', name: 'Test', CURSO: '10', grupo: '10A',
  promedios: { P1: 4.7 },
  areas: {
    MAT: {
      asignaturas: {},
      DEF: { P1: 2.0, P2: 4.0, P3: null, P4: null },
    },
    LEN: {
      asignaturas: {},
      DEF: { P1: 3.0, P2: 3.0, P3: null, P4: null },
    },
  },
} as unknown as Estudiante;

export const mockStudentEmptyAreas = {
  id: 's1', name: 'Test', CURSO: '10', grupo: '10A',
  areas: {
    MAT: {
      asignaturas: {},
      DEF: { P1: null, P2: null, P3: null, P4: null },
    },
  },
} as unknown as Estudiante;
