import { describe, it, expect } from 'vitest';
import { applyAcademicLogic } from './applyAcademicLogic';
import type { Estudiante } from '../../domain/types';
import { createSubjectRowId } from '../rowIdentity';
import { config } from './test-fixtures';

describe('applyAcademicLogic', () => {
  it('applies simulations and calculates area DEFs and states', () => {
    const student: Estudiante = {
      id: '1', name: 'Test', grupo: '10A', CURSO: '10A',
      areas: {
        'Ciencias': {
          DEF: { P1: null, P2: null, P3: null, P4: null, A: null },
          areaStats: { promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } },
          asignaturas: {
            'Fisica': { P1: 3.0, P2: 2.0, P3: null, P4: null, A: null, promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } },
            'Quimica': { P1: 3.0, P2: 2.0, P3: null, P4: null, A: null, promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } }
          }
        }
      }
    };

    const subjectWeights = {
      '10A': {
        'Ciencias': {
          'Fisica': 0.5,
          'Quimica': 0.5
        }
      }
    };

    const activeSimulations = {
      [createSubjectRowId('1', 'Ciencias', 'Fisica')]: { P2: 4.0 } // Simulate that they improved P2
    };

    applyAcademicLogic([student], config, subjectWeights, activeSimulations);

    const area = student.areas['Ciencias'];
    // Fisica should now be P1: 3.0, P2: 4.0
    expect(area.asignaturas['Fisica'].P2).toBe(4.0);
    expect(area.asignaturas['Fisica'].promedioActual).toBe(3.5);
    
    // Quimica should be P1: 3.0, P2: 2.0
    expect(area.asignaturas['Quimica'].P2).toBe(2.0);
    expect(area.asignaturas['Quimica'].promedioActual).toBe(2.5);

    // Area DEF: P1 = (3*0.5 + 3*0.5) = 3.0. P2 = (4*0.5 + 2*0.5) = 3.0.
    expect(area.DEF.P1).toBe(3.0);
    expect(area.DEF.P2).toBe(3.0);
    expect(area.areaStats!.promedioActual).toBe(3.0);
  });

  it('applies simulations when row identity parts contain underscores', () => {
    const student: Estudiante = {
      id: 'student_1', name: 'Test', grupo: '10_A', CURSO: '10_A',
      areas: {
        'Ciencias_Naturales': {
          DEF: { P1: null, P2: null, P3: null, P4: null, A: null },
          areaStats: { promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } },
          asignaturas: {
            'Lab_Biologia': { P1: 3.0, P2: 2.0, P3: null, P4: null, A: null, promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } },
            'Quimica_General': { P1: 3.0, P2: 2.0, P3: null, P4: null, A: null, promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } }
          }
        }
      }
    };

    const subjectWeights = {
      '10_A': {
        'Ciencias_Naturales': {
          'Lab_Biologia': 0.5,
          'Quimica_General': 0.5
        }
      }
    };

    const activeSimulations = {
      [createSubjectRowId('student_1', 'Ciencias_Naturales', 'Lab_Biologia')]: { P2: 4.0 }
    };

    applyAcademicLogic([student], config, subjectWeights, activeSimulations);

    const area = student.areas['Ciencias_Naturales'];
    expect(area.asignaturas['Lab_Biologia'].P2).toBe(4.0);
    expect(area.asignaturas['Quimica_General'].P2).toBe(2.0);
    expect(area.DEF.P2).toBe(3.0);
    expect(area.areaStats!.promedioActual).toBe(3.0);
  });

  it('falls back to uniform weights when none are provided', () => {
    const student: Estudiante = {
      id: '1', name: 'Test', grupo: '10A', CURSO: '10A',
      areas: {
        'Ciencias': {
          DEF: { P1: null, P2: null, P3: null, P4: null, A: null },
          areaStats: { promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } },
          asignaturas: {
            'Bio': { P1: 5.0, P2: null, P3: null, P4: null, A: null, promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } },
            'Qui': { P1: 3.0, P2: null, P3: null, P4: null, A: null, promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } },
            'Fis': { P1: 4.0, P2: null, P3: null, P4: null, A: null, promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } }
          }
        }
      }
    };

    applyAcademicLogic([student], config, {}, {});
    const area = student.areas['Ciencias'];
    // P1 avg = (5+3+4)/3 = 4.0
    expect(area.DEF.P1).toBe(4.0);
  });

  it('applies direct area simulations when there are no subjects', () => {
    const student: Estudiante = {
      id: '1', name: 'Test', grupo: '10A', CURSO: '10A',
      areas: {
        'Educacion Fisica': {
          DEF: { P1: 2.0, P2: 2.0, P3: null, P4: null, A: null },
          areaStats: { promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } },
          asignaturas: {} // No subjects
        }
      }
    };

    const activeSimulations = {
      '1_Educacion Fisica_Educacion Fisica': { P2: 4.0, P4: 5.0 }
    };

    applyAcademicLogic([student], config, {}, activeSimulations);
    
    expect(student.areas['Educacion Fisica'].DEF.P2).toBe(4.0);
    expect(student.areas['Educacion Fisica'].DEF.P4).toBe(5.0);
  });

  it('applies area-level overrides that overwrite DEF directly', () => {
    const student: Estudiante = {
      id: '1', name: 'Test', grupo: '10A', CURSO: '10A',
      areas: {
        'Artes': {
          DEF: { P1: 3.0, P2: 3.0, P3: null, P4: null, A: null },
          areaStats: { promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } },
          asignaturas: {
            'Musica': { P1: 3.0, P2: 3.0, P3: null, P4: null, A: null, promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } }
          }
        }
      }
    };

    const activeSimulations = {
      '1_Artes': { P2: 5.0, P4: 1.0 }
    };

    applyAcademicLogic([student], config, {}, activeSimulations);
    
    expect(student.areas['Artes'].DEF.P2).toBe(5.0);
    expect(student.areas['Artes'].DEF.P4).toBe(1.0);
  });

  it('handles evaluated but missing grades as 0.0 in area DEF', () => {
    const student: Estudiante = {
      id: '1', name: 'Test', grupo: '10A', CURSO: '10A',
      areas: {
        'Ciencias': {
          DEF: { P1: null, P2: null, P3: null, P4: null, A: null },
          areaStats: { promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } },
          asignaturas: {
            'Bio': { P1: 5.0, P2: null, P3: null, P4: null, A: null, promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } }
          }
        }
      }
    };

    const anotherStudent: Estudiante = {
      id: '2', name: 'Test 2', grupo: '10A', CURSO: '10A',
      areas: {
        'Ciencias': {
          DEF: { P1: null, P2: null, P3: null, P4: null, A: null },
          areaStats: { promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } },
          asignaturas: {
            'Bio': { P1: 5.0, P2: 4.0, P3: null, P4: null, A: null, promedioActual: 0, p4Min: 0, estado: { text: 'Ganado', color: 'green' } } // This establishes P2 is evaluated globally
          }
        }
      }
    };

    applyAcademicLogic([student, anotherStudent], config, {}, {});
    
    // Since P2 is evaluated, student 1's Bio missing P2 should be treated as 0.0 for area DEF
    expect(student.areas['Ciencias'].DEF.P2).toBe(0.0);
  });
});
