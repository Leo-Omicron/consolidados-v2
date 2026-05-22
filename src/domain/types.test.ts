import { describe, it, expect } from 'vitest';
import type {
  PeriodConfig,
  EstadoAcademico,
  Asignatura,
  Area,
  Estudiante,
  RowArea,
  RowAsignatura,
  StudentGroup,
  SubjectWeightConfig
} from './types';

describe('domain types', () =>
 {
  it('validates types statically', () => {
    // 1. PeriodConfig - 3 periods
    const config3Periods: PeriodConfig = {
      P1: 33.3,
      P2: 33.3,
      P3: 33.4
    };

    // 2. PeriodConfig - 4 periods
    const config4Periods: PeriodConfig = {
      P1: 25,
      P2: 25,
      P3: 25,
      P4: 25
    };

    // 3. Statuses match exact literal requirements
    const validStatus: EstadoAcademico = {
      text: 'Ganable',
      color: 'blue'
    };

    // 4. Asignatura with 3 periods (P4 omitted/null)
    const asignatura3P: Asignatura = {
      P1: 3.5,
      P2: null, // missing grade
      P3: 4.0,
      promedioActual: 3.75,
      p4Min: 3.0,
      estado: validStatus
    };

    // 5. Asignatura with 4 periods
    const asignatura4P: Asignatura = {
      P1: 3.5,
      P2: 4.0,
      P3: 3.0,
      P4: 4.5,
      promedioActual: 3.75,
      p4Min: 0,
      estado: { text: 'Ganado', color: 'green' }
    };

    // 6. Area with valid nested Asignatura
    const areaData: Area = {
      asignaturas: {
        'Matemáticas': asignatura3P
      },
      DEF: {
        P1: 3.5,
        P2: null,
        P3: 4.0
      },
      areaStats: {
        promedioActual: 3.75,
        p4Min: 3.0,
        estado: validStatus
      }
    };

    // 7. Estudiante valid structure
    const estudianteData: Estudiante = {
      id: '123',
      name: 'Juan Perez',
      CURSO: '10A',
      grupo: '6A',
      areas: {
        'Ciencias Exactas': areaData
      }
    };

    // 8. RowArea and RowAsignatura valid structures
    const rowArea: RowArea = {
      id: '1', CURSO: '10A', estudiante: 'Juan', area: 'Ciencias',
      defP1: 3, defP2: 3, defP3: 3, defP4: null, promActual: 3, p4Min: 3,
      estado: validStatus, CURSO_NORM: '10A', AREA_NORM: 'CIENCIAS', EST_NORM: 'JUAN',
      grupo: '6A'
    };

    const rowAsignatura: RowAsignatura = {
      id: '2', CURSO: '10A', estudiante: 'Juan', area: 'Ciencias', asignatura: 'Mat',
      p1: 3, p2: 3, p3: 3, p4: null, promActual: 3, p4Min: 3,
      estado: validStatus, CURSO_NORM: '10A', AREA_NORM: 'CIENCIAS', ASIG_NORM: 'MAT', EST_NORM: 'JUAN',
      grupo: '6A'
    };

    // 9. StudentGroup valid structure
    const studentGroup: StudentGroup = {
      estudiante: 'Juan',
      grupo: '6A',
      rows: [], // AugmentedRowArea list
      aggregates: { defP1: 3, defP2: 3, defP3: 3, promActual: 3 }
    };

    // 10. SubjectWeightConfig valid structure
    const subjectWeightConfig: SubjectWeightConfig = {
      'Ciencias': {
        'Matemáticas': 0.5,
        'Física': 0.5
      }
    };

    expect(config3Periods).toBeDefined();
    expect(config4Periods).toBeDefined();
    expect(asignatura3P).toBeDefined();
    expect(asignatura4P).toBeDefined();
    expect(areaData).toBeDefined();
    expect(estudianteData).toBeDefined();
    expect(rowArea).toBeDefined();
    expect(rowAsignatura).toBeDefined();
    expect(studentGroup).toBeDefined();
    expect(subjectWeightConfig).toBeDefined();
  });
});
