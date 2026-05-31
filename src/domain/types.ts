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
  A?: number | null;
}

export interface MetricasDesempeño {
  BAJ: number;
  BAS: number;
  ALT: number;
  SUP: number;
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
  promedios?: Record<string, number | null>;
  rankings?: Record<string, number | null>;
  desempeños?: Record<string, MetricasDesempeño | null>;
  oficialPRO?: number | null;
  oficialRAK?: number | null;
  director?: string;
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
  defA?: number | null;
  promActual: number | null;
  p4Min: number | null;
  estado: EstadoAcademico;
  CURSO_NORM: string;
  AREA_NORM: string;
  EST_NORM: string;
  oficialPRO?: number | null;
  oficialRAK?: number | null;
  desempeños?: MetricasDesempeño | null;
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
  a?: number | null;
  promActual: number | null;
  p4Min: number | null;
  estado: EstadoAcademico;
  CURSO_NORM: string;
  AREA_NORM: string;
  ASIG_NORM: string;
  EST_NORM: string;
  oficialPRO?: number | null;
  oficialRAK?: number | null;
  desempeños?: MetricasDesempeño | null;
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
  [grupo: string]: {
    [area: string]: {
      [asignatura: string]: number;
    };
  };
}

// Sub-types for Institutional Reports
export interface CriticalAreaInfo {
  area: string;
  failuresCount: number;
}

export interface OutstandingStudent {
  id: string;
  name: string;
  average: number;
  percentile: number;
  officialRanking?: number | null;
  officialAverage?: number | null;
}

export interface AcademicRiskStudent {
  id: string;
  name: string;
  average: number;
  failedAreasCount: number;
  failedAreas: string[];
  impossibilityMathAreas: string[]; // required grade > 5.0
}

export interface SubjectMetric {
  asignatura: string;
  average: number;
  failuresCount: number;
  failuresRate: number;
}

export interface GroupComparisonMetrics {
  grupo: string;
  totalStudents: number;
  average: number;
  standardDeviation: number;
  failuresCount: number;
  reprobadosCount: number;
}

export interface HeatmapCell {
  grade: number | null;
  color: EstadoAcademicoColor;
}

export interface HeatmapRow {
  studentId: string;
  studentName: string;
  grades: Record<string, HeatmapCell>;
  promActual: number;
}

export interface OfficialRecordRow {
  studentId: string;
  studentName: string;
  grades: Record<string, number | null>;
  promActual: number;
  ranking: number;
  failedAreasCount: number;
  decision: 'Aprobado' | 'Compromisos' | 'Reprobado';
}

// 8 Core Reports
export interface GroupPerformanceReport {
  grupo: string;
  totalStudents: number;
  average: number;
  standardDeviation: number;
  promotionRate: number;
  criticalAreas: CriticalAreaInfo[];
}

export interface OutstandingStudentsReport {
  grupo: string;
  students: OutstandingStudent[];
}

export interface AcademicRiskReport {
  grupo: string;
  criticalStudents: AcademicRiskStudent[];
}

export interface SubjectAnalyticsReport {
  grupo: string;
  subjects: SubjectMetric[];
}

export interface GroupComparisonReport {
  groups: GroupComparisonMetrics[];
}

export interface HeatmapReport {
  grupo: string;
  areasList: string[];
  rows: HeatmapRow[];
}

export interface TeacherFeedbackReport {
  studentId: string;
  studentName: string;
  grupo: string;
  overallStatus: 'Aprobado' | 'Compromisos' | 'Reprobado';
  strengths: string[];
  weaknesses: string[];
  adviceText: string;
  promedioActual: number;
  promedioGrupo: number;
  puestoGrupo: number;
  totalEstudiantesGrupo: number;
  totalAreasCount: number;
  failedAreasCount: number;
  weaknessesDetail: Array<{ 
    areaName: string; 
    requiredGrade: number; 
    isImpossible: boolean;
    rescueRoute?: Array<{ asignatura: string; targetGrade: number }>;
  }>;
}

export interface OfficialRecordsReport {
  grupo: string;
  period: string;
  director: string;
  rows: OfficialRecordRow[];
}


