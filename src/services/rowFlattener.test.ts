import { describe, it, expect } from 'vitest';
import { flattenRows } from './rowFlattener';
import type { Estudiante } from '../domain/types';

describe('flattenRows', () => {
  it('returns empty arrays when no students provided', () => {
    const result = flattenRows([]);
    expect(result.rowsArea).toEqual([]);
    expect(result.rowsAsignatura).toEqual([]);
  });

  it('flattens rows with areas and asignaturas correctly', () => {
    const students: Estudiante[] = [
      {
        id: '1',
        name: 'Ana',
        CURSO: '10A',
        grupo: '10A',
        areas: {
          'MATH': {
            asignaturas: {
              'Algebra': {
                P1: 4.0, P2: 4.0, P3: 4.0, P4: null, A: null,
                promedioActual: 4.0,
                p4Min: 0,
                estado: { text: 'Ganado', color: 'green' }
              }
            },
            DEF: { P1: 4.0, P2: 4.0, P3: 4.0, P4: null, A: null },
            areaStats: {
              promedioActual: 4.0,
              p4Min: 0,
              estado: { text: 'Ganado', color: 'green' }
            }
          }
        },
        promedios: { 'DEF': 4.0 },
        rankings: { 'DEF': 1 },
        desempeños: { 'DEF': { BAJ: 0, BAS: 0, ALT: 1, SUP: 0 } }
      }
    ];

    const result = flattenRows(students);
    expect(result.rowsArea).toHaveLength(1);
    expect(result.rowsAsignatura).toHaveLength(1);

    expect(result.rowsArea[0]).toMatchObject({
      id: '1_MATH',
      CURSO: '10A',
      estudiante: 'Ana',
      area: 'MATH',
      grupo: '10A',
      defP1: 4.0,
      promActual: 4.0,
      estado: { text: 'Ganado', color: 'green' },
      CURSO_NORM: '10A',
      AREA_NORM: 'MATH',
      EST_NORM: 'ANA',
      oficialPRO: 4.0,
      oficialRAK: 1,
      desempeños: { BAJ: 0, BAS: 0, ALT: 1, SUP: 0 }
    });

    expect(result.rowsAsignatura[0]).toMatchObject({
      id: '1_MATH_Algebra',
      CURSO: '10A',
      estudiante: 'Ana',
      area: 'MATH',
      asignatura: 'Algebra',
      grupo: '10A',
      p1: 4.0,
      promActual: 4.0,
      estado: { text: 'Ganado', color: 'green' },
      CURSO_NORM: '10A',
      AREA_NORM: 'MATH',
      ASIG_NORM: 'ALGEBRA',
      EST_NORM: 'ANA',
      oficialPRO: 4.0,
      oficialRAK: 1,
      desempeños: { BAJ: 0, BAS: 0, ALT: 1, SUP: 0 }
    });
  });

  it('handles areas without asignaturas correctly (fallback)', () => {
    const students: Estudiante[] = [
      {
        id: '2',
        name: 'Bob',
        CURSO: '10B',
        grupo: '10B',
        areas: {
          'SCIENCE': {
            asignaturas: {},
            DEF: { P1: 3.0, P2: 3.0, P3: 3.0, P4: null, A: null },
            areaStats: {
              promedioActual: 3.0,
              p4Min: 3.0,
              estado: { text: 'En riesgo', color: 'yellow' }
            }
          }
        }
      } // Missing promedios, rankings, desempeños
    ];

    const students2: Estudiante[] = [
      {
        id: '2b',
        name: 'Bob2',
        CURSO: '10B',
        grupo: '10B',
        areas: {
          'SCIENCE': {
            asignaturas: {
              'Physics': {
                P1: 3.0, P2: 3.0, P3: 3.0, P4: null, A: null,
                promedioActual: 3.0,
                p4Min: 3.0,
                estado: { text: 'En riesgo', color: 'yellow' }
              }
            },
            DEF: { P1: 3.0, P2: 3.0, P3: 3.0, P4: null, A: null },
            areaStats: {
              promedioActual: 3.0,
              p4Min: 3.0,
              estado: { text: 'En riesgo', color: 'yellow' }
            }
          }
        },
        promedios: {},
        rankings: {},
        desempeños: {}
      },
      {
        id: '2c',
        name: 'Bob3',
        CURSO: '10C',
        grupo: '10C',
        areas: {
          'MATH': {
            asignaturas: {
              'Algebra': {
                P1: 4.0, P2: 4.0, P3: 4.0, P4: null, A: null,
                promedioActual: 4.0,
                p4Min: 0,
                estado: { text: 'Ganado', color: 'green' }
              }
            },
            DEF: { P1: 4.0, P2: 4.0, P3: 4.0, P4: null, A: null },
            areaStats: {
              promedioActual: 4.0,
              p4Min: 0,
              estado: { text: 'Ganado', color: 'green' }
            }
          }
        } // Missing promedios, rankings, desempeños WITH asignaturas
      }
    ];

    const result = flattenRows(students);
    const result2 = flattenRows(students2);
    expect(result.rowsArea).toHaveLength(1);
    expect(result.rowsAsignatura).toHaveLength(1); // Should fallback to area level

    expect(result.rowsAsignatura[0]).toMatchObject({
      id: '2_SCIENCE_SCIENCE',
      asignatura: 'SCIENCE',
      oficialPRO: null,
      oficialRAK: null,
      desempeños: null
    });

    expect(result2.rowsAsignatura[0].oficialPRO).toBeUndefined();
    expect(result2.rowsAsignatura[0].oficialRAK).toBeUndefined();
    expect(result2.rowsAsignatura[0].desempeños).toBeNull();
    
    expect(result2.rowsAsignatura[1].oficialPRO).toBeNull();
    expect(result2.rowsAsignatura[1].oficialRAK).toBeNull();
    expect(result2.rowsAsignatura[1].desempeños).toBeNull();
  });

  it('handles areas with no areaStats', () => {
    const students: Estudiante[] = [
      {
        id: '3',
        name: 'Charlie',
        CURSO: '10C',
        grupo: '10C',
        areas: {
          'ART': {
            asignaturas: {},
            DEF: { P1: null, P2: null, P3: null, P4: null, A: null }
          }
        }
      },
      {
        id: '4',
        name: 'Dave',
        CURSO: '10D',
        grupo: '10D',
        areas: {
          'PE': {
            asignaturas: {},
            DEF: { P1: null, P2: null, P3: null, P4: null, A: null },
            areaStats: { promedioActual: 3.0, p4Min: 3.0, estado: { text: 'En riesgo', color: 'yellow' } }
          }
        },
        promedios: {},
        rankings: {},
        desempeños: {}
      },
      {
        id: '5',
        name: 'Eve',
        CURSO: '10E',
        grupo: '10E',
        areas: {
          'PE': {
            asignaturas: {},
            DEF: { P1: null, P2: null, P3: null, P4: null, A: null },
            areaStats: { promedioActual: 3.0, p4Min: 3.0, estado: { text: 'En riesgo', color: 'yellow' } }
          }
        },
        promedios: { 'DEF': 4.0 },
        rankings: { 'DEF': 1 },
        desempeños: { 'DEF': { BAJ: 0, BAS: 0, ALT: 1, SUP: 0 } }
      }
    ];

    const result = flattenRows(students);
    expect(result.rowsArea).toHaveLength(2);
    expect(result.rowsAsignatura).toHaveLength(2); // Also no asignaturas and no areaStats
  });
});
