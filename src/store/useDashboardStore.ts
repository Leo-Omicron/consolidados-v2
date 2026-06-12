import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { get, set as idbSet, del } from 'idb-keyval';
import type { Estudiante, PeriodConfig, RowArea, RowAsignatura, SubjectWeightConfig } from '../domain/types';
import { flattenRows } from '../services/rowFlattener';
import type { DiagnosticReport } from '../services/excelParser';
import { applyAcademicLogic } from '../services/academicLogic';
import { parseFileInWorker } from '../services/excelWorkerClient';

const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await idbSet(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

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
  updateSubjectWeights: (grupo: string, area: string, weights: Record<string, number>) => void;
  applyPresetWeights: (config: SubjectWeightConfig) => void;
  clearCustomWeights: () => void;
  processFiles: (files: File[]) => Promise<void>;
  clearAllData: () => void;
}

const DEFAULT_CONFIG: PeriodConfig = {
  P1: 33.3,
  P2: 33.3,
  P3: 33.4
};

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
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
        
        const newEstudiantes = structuredClone(state.estudiantes);
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

      updateSubjectWeights: (grupo: string, area: string, weights: Record<string, number>) => set((state) => {
        const updatedWeights = JSON.parse(JSON.stringify(state.subjectWeights)) as SubjectWeightConfig;
        if (!updatedWeights[grupo]) updatedWeights[grupo] = {};
        if (!updatedWeights[grupo][area]) updatedWeights[grupo][area] = {};
        
        Object.entries(weights).forEach(([asignatura, weight]) => {
          updatedWeights[grupo][area][asignatura] = weight;
        });

        const newEstudiantes = structuredClone(state.estudiantes);
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

      applyPresetWeights: (config: SubjectWeightConfig) => set((state) => {
        const updatedWeights = JSON.parse(JSON.stringify(config)) as SubjectWeightConfig;
        const newEstudiantes = structuredClone(state.estudiantes);
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

      clearCustomWeights: () => set((state) => {
        const newEstudiantes = structuredClone(state.estudiantes);
        let newRowsArea = state.rowsArea;
        let newRowsAsignatura = state.rowsAsignatura;

        if (newEstudiantes.length > 0) {
          applyAcademicLogic(newEstudiantes, state.config, {});
          const flattened = flattenRows(newEstudiantes);
          newRowsArea = flattened.rowsArea;
          newRowsAsignatura = flattened.rowsAsignatura;
        }

        return { 
          subjectWeights: {},
          estudiantes: newEstudiantes,
          rowsArea: newRowsArea,
          rowsAsignatura: newRowsAsignatura
        };
      }),
      
      setConfig: (config) => set((state) => {
        const newEstudiantes = structuredClone(state.estudiantes);
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
      
      processFiles: async (files: File[]) => {
        const { config, subjectWeights } = useDashboardStore.getState();
        set({ loading: true, error: null, diagnosticReport: null, parsingProgress: 'Leyendo archivos...' });
        
        try {
          const result = await parseFileInWorker(files, config, subjectWeights, {
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
            selectedGrupo: result.availableGroups.length === 2 ? result.availableGroups[1] : 'Todos',
            diagnosticReport: result.diagnosticReport,
            loading: false,
            parsingProgress: null
          });
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : "Error processing file";
          set({ loading: false, error: errorMessage, parsingProgress: null });
        }
      },

      clearAllData: () => {
        // Limpiar también las simulaciones activas para evitar inconsistencias
        import('./useSimulationStore').then(module => {
          module.useSimulationStore.getState().clearAllSimulations();
        });
        
        set({
          estudiantes: [],
        rowsArea: [],
        rowsAsignatura: [],
        subjectWeights: {},
        availableGroups: [],
        selectedGrupo: 'Todos',
        diagnosticReport: null,
        error: null,
        parsingProgress: null
      });
      }
    }),
    {
      name: 'dashboard-storage',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        config: state.config,
        subjectWeights: state.subjectWeights,
        selectedGrupo: state.selectedGrupo,
        availableGroups: state.availableGroups,
        viewMode: state.viewMode,
        diagnosticReport: state.diagnosticReport,
      }),
      merge: (persistedState: unknown, currentState) => {
        const merged = { ...currentState, ...(persistedState as Partial<DashboardState>) };
        if (merged.selectedGrupo !== 'Todos' && !merged.availableGroups.includes(merged.selectedGrupo)) {
          merged.selectedGrupo = 'Todos';
        }
        return merged;
      },
    }
  )
);
