import { describe, it, expect } from 'vitest';
import type {
  PeriodConfig,
  EstadoAcademico,
  Asignatura,
  Area,
  Estudiante
} from './types';

describe('domain types', () => {
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
      areas: {
        'Ciencias Exactas': areaData
      }
    };

    expect(config3Periods).toBeDefined();
    expect(config4Periods).toBeDefined();
    expect(asignatura3P).toBeDefined();
    expect(asignatura4P).toBeDefined();
    expect(areaData).toBeDefined();
    expect(estudianteData).toBeDefined();
  });
});
