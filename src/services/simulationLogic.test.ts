import { describe, it, expect } from 'vitest';
import type { Estudiante, PeriodConfig, SubjectWeightConfig, PeriodoNotas } from '../domain/types';
import { getSimulatedRows } from './simulationLogic';
import { createAreaRowId, createSubjectRowId } from './rowIdentity';

// Datos de prueba simulados
const mockConfig: PeriodConfig = { P1: 25, P2: 25, P3: 25, P4: 25 };

const mockSubjectWeights: SubjectWeightConfig = {
  '10A': {
    'CIENCIAS': {
      'BIOLOGIA': 0.6,
      'QUIMICA': 0.4,
    },
  },
};

const mockStudents: Estudiante[] = [
  {
    id: 'student1',
    name: 'Carlos Perez',
    CURSO: '10',
    grupo: '10A',
    areas: {
      'CIENCIAS': {
        DEF: { P1: 3.0, P2: 3.0, P3: 3.0, P4: null },
        areaStats: {
          promedioActual: 3.0,
          p4Min: 3.0,
          estado: { text: 'Recuperable', color: 'blue' },
        },
        asignaturas: {
          'BIOLOGIA': {
            P1: 3.0,
            P2: 3.0,
            P3: 3.0,
            P4: null,
            promedioActual: 3.0,
            p4Min: 3.0,
            estado: { text: 'Recuperable', color: 'blue' },
          },
          'QUIMICA': {
            P1: 3.0,
            P2: 3.0,
            P3: 3.0,
            P4: null,
            promedioActual: 3.0,
            p4Min: 3.0,
            estado: { text: 'Recuperable', color: 'blue' },
          },
        },
      },
    },
  },
];

describe('simulationLogic - getSimulatedRows', () => {
  it('returns null if there are no active simulations', () => {
    const activeSimulations: Record<string, Partial<PeriodoNotas>> = {};
    const result = getSimulatedRows(mockStudents, activeSimulations, mockConfig, mockSubjectWeights);
    expect(result).toBeNull();
  });

  it('updates a subject grade and recalculates its stats', () => {
    const activeSimulations: Record<string, Partial<PeriodoNotas>> = {
      [createSubjectRowId('student1', 'CIENCIAS', 'BIOLOGIA')]: { P3: 5.0 }, // Subimos P3 de 3.0 a 5.0
    };

    const result = getSimulatedRows(mockStudents, activeSimulations, mockConfig, mockSubjectWeights);
    expect(result).not.toBeNull();

    if (result) {
      const bioRow = result.rowsAsignatura.find(r => r.id === createSubjectRowId('student1', 'CIENCIAS', 'BIOLOGIA'));
      expect(bioRow).toBeDefined();
      expect(bioRow?.p3).toBe(5.0);
      // Promedio de BIOLOGIA debe cambiar: (3.0*25 + 3.0*25 + 5.0*25) / 75 = 3.66 -> redondeado a 3.7
      expect(bioRow?.promActual).toBe(3.7);
      // p4Min para BIOLOGIA: (3.0 * 100 - (3.0*25 + 3.0*25 + 5.0*25)) / 25 = (300 - 275) / 25 = 1.0
      expect(bioRow?.p4Min).toBe(1.0);
    }
  });

  it('propagates subject simulation to the parent area and recalculates area stats', () => {
    const activeSimulations: Record<string, Partial<PeriodoNotas>> = {
      // BIOLOGIA (peso 0.6) sube de 3.0 a 5.0. QUIMICA (peso 0.4) sigue en 3.0.
      // DEF P3 del área de CIENCIAS = 5.0 * 0.6 + 3.0 * 0.4 = 3.0 + 1.2 = 4.2
      [createSubjectRowId('student1', 'CIENCIAS', 'BIOLOGIA')]: { P3: 5.0 },
    };

    const result = getSimulatedRows(mockStudents, activeSimulations, mockConfig, mockSubjectWeights);
    expect(result).not.toBeNull();

    if (result) {
      const areaRow = result.rowsArea.find(r => r.id === createAreaRowId('student1', 'CIENCIAS'));
      expect(areaRow).toBeDefined();
      expect(areaRow?.defP3).toBe(4.2);
      // Promedio del área: (3.0*25 + 3.0*25 + 4.2*25) / 75 = 3.4
      expect(areaRow?.promActual).toBe(3.4);
      // p4Min del área: (3.0 * 100 - (3.0*25 + 3.0*25 + 4.2*25)) / 25 = (300 - 255) / 25 = 1.8
      expect(areaRow?.p4Min).toBe(1.8);
    }
  });

  it('allows direct area grade simulation overriding the calculated DEF', () => {
    const activeSimulations: Record<string, Partial<PeriodoNotas>> = {
      // Simulamos la nota DEF del área directamente en P3 a 1.0 (reprobando el área)
      [createAreaRowId('student1', 'CIENCIAS')]: { P3: 1.0 },
    };

    const result = getSimulatedRows(mockStudents, activeSimulations, mockConfig, mockSubjectWeights);
    expect(result).not.toBeNull();

    if (result) {
      const areaRow = result.rowsArea.find(r => r.id === createAreaRowId('student1', 'CIENCIAS'));
      expect(areaRow).toBeDefined();
      expect(areaRow?.defP3).toBe(1.0);
      // Promedio del área: (3.0*25 + 3.0*25 + 1.0*25) / 75 = 2.33 -> 2.3
      expect(areaRow?.promActual).toBe(2.3);
      // p4Min del área: (3.0 * 100 - (3.0*25 + 3.0*25 + 1.0*25)) / 25 = (300 - 175) / 25 = 5.0
      expect(areaRow?.p4Min).toBe(5.0);
      // Estado debe ser En riesgo o similar (requiere 5.0)
      expect(areaRow?.estado.text).toBe('En riesgo');
    }
  });

  it('allows fallback subject simulation overrides to route to the parent area when area has no subjects', () => {
    const mockStudentsNoSubjects: Estudiante[] = [
      {
        id: 'student2',
        name: 'Maria Lopez',
        CURSO: '10',
        grupo: '10A',
        areas: {
          'ARTISTICA': {
            DEF: { P1: 2.0, P2: 2.0, P3: null },
            areaStats: {
              promedioActual: 2.0,
              p4Min: 4.0,
              estado: { text: 'En riesgo', color: 'yellow' }
            },
            asignaturas: {} // empty!
          }
        }
      }
    ];

    const activeSimulations: Record<string, Partial<PeriodoNotas>> = {
      [createSubjectRowId('student2', 'ARTISTICA', 'ARTISTICA')]: { P2: 4.0 }
    };

    const result = getSimulatedRows(mockStudentsNoSubjects, activeSimulations, mockConfig, mockSubjectWeights);
    expect(result).not.toBeNull();

    if (result) {
      // Area DEF should have P2 = 4.0
      const areaRow = result.rowsArea.find(r => r.id === createAreaRowId('student2', 'ARTISTICA'));
      expect(areaRow).toBeDefined();
      expect(areaRow?.defP2).toBe(4.0);
      // Recalculated area promedioActual: (2.0*25 + 4.0*25) / 50 = 3.0
      expect(areaRow?.promActual).toBe(3.0);

      // Fallback subject row should also have P2 = 4.0 and recalculated promedio = 3.0
      const subRow = result.rowsAsignatura.find(r => r.id === createSubjectRowId('student2', 'ARTISTICA', 'ARTISTICA'));
      expect(subRow).toBeDefined();
      expect(subRow?.p2).toBe(4.0);
      expect(subRow?.promActual).toBe(3.0);
    }
  });

  it('propagates subject simulation using uniform weights if no subject weights are configured', () => {
    const mockStudentsMultiSubjectsNoWeights: Estudiante[] = [
      {
        id: 'student3',
        name: 'Jose Gomez',
        CURSO: '10',
        grupo: '10A',
        areas: {
          'TECNOLOGIA': {
            DEF: { P1: 3.0, P2: 3.0, P3: null },
            areaStats: {
              promedioActual: 3.0,
              p4Min: 3.0,
              estado: { text: 'Recuperable', color: 'blue' }
            },
            asignaturas: {
              'INFORMATICA': {
                P1: 3.0,
                P2: 3.0,
                P3: null,
                promedioActual: 3.0,
                p4Min: 3.0,
                estado: { text: 'Recuperable', color: 'blue' }
              },
              'PROGRAMACION': {
                P1: 3.0,
                P2: 3.0,
                P3: null,
                promedioActual: 3.0,
                p4Min: 3.0,
                estado: { text: 'Recuperable', color: 'blue' }
              }
            }
          }
        }
      }
    ];

    const activeSimulations: Record<string, Partial<PeriodoNotas>> = {
      // INFORMATICA (uniform weight 0.5) sube de 3.0 a 5.0. PROGRAMACION (0.5) sigue en 3.0.
      // DEF P2 del area de TECNOLOGIA = 5.0 * 0.5 + 3.0 * 0.5 = 4.0
      [createSubjectRowId('student3', 'TECNOLOGIA', 'INFORMATICA')]: { P2: 5.0 }
    };

    const emptyWeights: SubjectWeightConfig = {}; // No weights configured!

    const result = getSimulatedRows(mockStudentsMultiSubjectsNoWeights, activeSimulations, mockConfig, emptyWeights);
    expect(result).not.toBeNull();

    if (result) {
      const areaRow = result.rowsArea.find(r => r.id === createAreaRowId('student3', 'TECNOLOGIA'));
      expect(areaRow).toBeDefined();
      // P2 should be recalculated to 4.0 using equal weights (50/50)
      expect(areaRow?.defP2).toBe(4.0);
      // Area promedioActual: (3.0*25 + 4.0*25) / 50 = 3.5
      expect(areaRow?.promActual).toBe(3.5);
    }
  });
});
