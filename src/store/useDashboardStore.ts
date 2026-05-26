import { create } from 'zustand';
import type { Estudiante, PeriodConfig, RowArea, RowAsignatura, SubjectWeightConfig } from '../domain/types';
import { flattenRows } from '../services/excelParser';
import type { DiagnosticReport } from '../services/excelParser';
import { applyAcademicLogic } from '../services/academicLogic';
import { parseFileInWorker } from '../services/excelWorkerClient';

export interface DashboardState {
  estudiantes: Estudiante[];
  rowsArea: RowArea[];
  rowsAsignatura: RowAsignatura[];
  loading: boolean;
  error: string | null;
  config: PeriodConfig;
  subjectWeights: SubjectWeightConfig;
  selectedGrupo: string;
  availableGroups: string[];
  viewMode: 'area' | 'subject';
  diagnosticReport: DiagnosticReport | null;
  parsingProgress: string | null;
  setConfig: (config: PeriodConfig) => void;
  setGrupo: (grupo: string) => void;
  setViewMode: (mode: 'area' | 'subject') => void;
  updateSubjectWeight: (grupo: string, area: string, asignatura: string, weight: number) => void;
  processFile: (file: File) => Promise<void>;
}

const DEFAULT_CONFIG: PeriodConfig = {
  P1: 33.3,
  P2: 33.3,
  P3: 33.4
};

export const useDashboardStore = create<DashboardState>((set) => ({
  estudiantes: [],
  rowsArea: [],
  rowsAsignatura: [],
  loading: false,
  error: null,
  config: DEFAULT_CONFIG,
  subjectWeights: {},
  selectedGrupo: 'Todos',
  availableGroups: [],
  viewMode: 'area',
  diagnosticReport: null,
  parsingProgress: null,
  
  setGrupo: (grupo: string) => set({ selectedGrupo: grupo }),
  
  setViewMode: (mode: 'area' | 'subject') => set({ viewMode: mode }),
  
  updateSubjectWeight: (grupo: string, area: string, asignatura: string, weight: number) => set((state) => {
    const updatedWeights = JSON.parse(JSON.stringify(state.subjectWeights)) as SubjectWeightConfig;
    if (!updatedWeights[grupo]) updatedWeights[grupo] = {};
    if (!updatedWeights[grupo][area]) updatedWeights[grupo][area] = {};
    updatedWeights[grupo][area][asignatura] = weight;
    
    // Re-apply logic with new weights
    const newEstudiantes = [...state.estudiantes];
    let newRowsArea = state.rowsArea;
    let newRowsAsignatura = state.rowsAsignatura;

    if (newEstudiantes.length > 0) {
      applyAcademicLogic(newEstudiantes, state.config, updatedWeights);
      const flattened = flattenRows(newEstudiantes);
      newRowsArea = flattened.rowsArea;
      newRowsAsignatura = flattened.rowsAsignatura;
    }

    return { 
      subjectWeights: updatedWeights,
      estudiantes: newEstudiantes,
      rowsArea: newRowsArea,
      rowsAsignatura: newRowsAsignatura
    };
  }),
  
  setConfig: (config) => set((state) => {
    const newEstudiantes = [...state.estudiantes];
    let newRowsArea = state.rowsArea;
    let newRowsAsignatura = state.rowsAsignatura;

    if (newEstudiantes.length > 0) {
      applyAcademicLogic(newEstudiantes, config, state.subjectWeights);
      const flattened = flattenRows(newEstudiantes);
      newRowsArea = flattened.rowsArea;
      newRowsAsignatura = flattened.rowsAsignatura;
    }

    return { 
      config,
      estudiantes: newEstudiantes,
      rowsArea: newRowsArea,
      rowsAsignatura: newRowsAsignatura
    };
  }),
  
  processFile: async (file: File) => {
    set({ loading: true, error: null, diagnosticReport: null, parsingProgress: 'Leyendo archivo...' });
    
    try {
      const result = await parseFileInWorker(file, {
        onProgress: (_phase, message) => {
          set({ parsingProgress: message });
        },
        onDiagnostic: (report) => {
          set({ diagnosticReport: report });
        }
      });
      
      set({ 
        estudiantes: result.estudiantes,
        rowsArea: result.rowsArea,
        rowsAsignatura: result.rowsAsignatura,
        subjectWeights: result.subjectWeights,
        availableGroups: result.availableGroups,
        selectedGrupo: 'Todos',
        diagnosticReport: result.diagnosticReport,
        loading: false,
        parsingProgress: null
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error processing file";
      set({ loading: false, error: errorMessage, parsingProgress: null });
    }
  }
}));
