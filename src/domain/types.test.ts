import {
  PeriodConfig,
  PeriodoNotas,
  EstadoAcademicoText,
  EstadoAcademicoColor,
  EstadoAcademico,
  EvaluacionStats,
  Asignatura,
  Area,
  Estudiante,
  RowArea,
  RowAsignatura
} from './types';

// Static type tests (these will fail compilation if types are wrong)

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

// 8. RowArea and RowAsignatura flattened validity
const rowArea: RowArea = {
  id: '123_Ciencias_Exactas',
  CURSO: '10A',
  estudiante: 'Juan Perez',
  area: 'Ciencias Exactas',
  defP1: 3.5,
  defP2: null,
  defP3: 4.0,
  promActual: 3.75,
  p4Min: 3.0,
  estado: validStatus,
  CURSO_NORM: '10A',
  AREA_NORM: 'CIENCIAS EXACTAS',
  EST_NORM: 'JUAN PEREZ'
};

const rowAsig: RowAsignatura = {
  id: '123_Matematicas',
  CURSO: '10A',
  estudiante: 'Juan Perez',
  area: 'Ciencias Exactas',
  asignatura: 'Matemáticas',
  p1: 3.5,
  p2: null,
  p3: 4.0,
  promActual: 3.75,
  p4Min: 3.0,
  estado: validStatus,
  CURSO_NORM: '10A',
  AREA_NORM: 'CIENCIAS EXACTAS',
  ASIG_NORM: 'MATEMATICAS',
  EST_NORM: 'JUAN PEREZ'
};

// Export something to make this a module
export const testObjects = {
  config3Periods,
  config4Periods,
  asignatura3P,
  asignatura4P,
  estudianteData,
  rowArea,
  rowAsig
};
