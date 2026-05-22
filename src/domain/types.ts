export type EstadoAcademicoText = 'Perdido' | 'En riesgo' | 'Recuperable' | 'Ganable' | 'Ganado' | 'N/A';
export type EstadoAcademicoColor = 'red' | 'yellow' | 'blue' | 'cyan' | 'green' | 'gray';

export interface EstadoAcademico {
  text: EstadoAcademicoText;
  color: EstadoAcademicoColor;
}

export interface PeriodConfig {
  P1: number;
  P2: number;
  P3: number;
  P4?: number;
}

export interface PeriodoNotas {
  P1: number | null;
  P2: number | null;
  P3: number | null;
  P4?: number | null;
}

export interface EvaluacionStats {
  promedioActual: number;
  p4Min: number;
  estado: EstadoAcademico;
}

export interface Asignatura extends PeriodoNotas, EvaluacionStats {}

export interface Area {
  asignaturas: Record<string, Asignatura>;
  DEF: PeriodoNotas;
  areaStats?: EvaluacionStats;
}

export interface Estudiante {
  id: string;
  name: string;
  CURSO: string;
  grupo: string;
  areas: Record<string, Area>;
}

export interface RowArea {
  id: string;
  CURSO: string;
  estudiante: string;
  area: string;
  grupo: string;
  defP1: number | null;
  defP2: number | null;
  defP3: number | null;
  defP4?: number | null;
  promActual: number | null;
  p4Min: number | null;
  estado: EstadoAcademico;
  CURSO_NORM: string;
  AREA_NORM: string;
  EST_NORM: string;
}

export interface RowAsignatura {
  id: string;
  CURSO: string;
  estudiante: string;
  area: string;
  asignatura: string;
  grupo: string;
  p1: number | null;
  p2: number | null;
  p3: number | null;
  p4?: number | null;
  promActual: number | null;
  p4Min: number | null;
  estado: EstadoAcademico;
  CURSO_NORM: string;
  AREA_NORM: string;
  ASIG_NORM: string;
  EST_NORM: string;
}

export type Trend = 'up' | 'down' | 'flat' | 'none';

export interface AugmentedRowArea extends RowArea {
  tendencia: Trend;
}

export interface AugmentedRowAsignatura extends RowAsignatura {
  tendencia: Trend;
}

export type PipelineRow = AugmentedRowArea | AugmentedRowAsignatura;

export interface StudentGroup<T = PipelineRow> {
  estudiante: string;
  grupo: string;
  rows: T[];
  aggregates: {
    defP1: number | null;
    defP2: number | null;
    defP3: number | null;
    promActual: number | null;
  };
  failedAreasCount?: number;
  isReprobado?: boolean;
}

export type SortConfig = {
  key: keyof AugmentedRowArea | keyof AugmentedRowAsignatura | 'aggregates.promActual' | string;
  direction: 'asc' | 'desc';
} | null;

export interface SubjectWeightConfig {
  [area: string]: {
    [asignatura: string]: number;
  };
}

