import { create } from 'zustand';
import * as XLSX from 'xlsx';
import type { Estudiante, PeriodConfig, RowArea, RowAsignatura, SubjectWeightConfig } from '../domain/types';
import { flattenRows, parseWorkbook, validateWorkbook } from '../services/excelParser';
import type { DiagnosticReport } from '../services/excelParser';
import { applyAcademicLogic, inferSubjectWeights } from '../services/academicLogic';

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

export const useDashboardStore = create<DashboardState>((set, get) => ({
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
    set({ loading: true, error: null, diagnosticReport: null });
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      const report = validateWorkbook(workbook);
      set({ diagnosticReport: report });

      if (!report.isValid) {
        const firstCritical = report.issues.find(i => i.severity === 'CRITICAL');
        const errorMessage = firstCritical ? firstCritical.message : "El archivo Excel no cumple con el esquema requerido.";
        set({ loading: false, error: errorMessage });
        return;
      }

      // Use filename as curso for now, stripping extension
      const curso = file.name.replace(/\.[^/.]+$/, "");
      
      const students = parseWorkbook(workbook, curso);
      
      if (students.length === 0) {
        throw new Error("No se encontraron estudiantes válidos en el archivo.");
      }

      const uniqueGroupsSet = new Set<string>();
      students.forEach(s => {
        if (s.grupo) uniqueGroupsSet.add(s.grupo);
      });
      const availableGroups = ['Todos', ...Array.from(uniqueGroupsSet).sort()];

      // Infer subject weights isolated per group
      const groups = Array.from(uniqueGroupsSet);
      const inferredWeights: SubjectWeightConfig = {};

      groups.forEach(grupo => {
        inferredWeights[grupo] = {};
        const groupStudents = students.filter(s => s.grupo === grupo);
        
        // Find all unique areas for students of this group
        const groupAreas = new Set<string>();
        groupStudents.forEach(s => Object.keys(s.areas).forEach(a => groupAreas.add(a)));
        
        groupAreas.forEach(areaName => {
          inferredWeights[grupo][areaName] = inferSubjectWeights(groupStudents, areaName);
        });
      });

      // Call logic with current config and inferred weights
      applyAcademicLogic(students, get().config, inferredWeights);
      
      const { rowsArea, rowsAsignatura } = flattenRows(students);
      
      set({ 
        estudiantes: students,
        rowsArea,
        rowsAsignatura,
        subjectWeights: inferredWeights,
        availableGroups,
        selectedGrupo: 'Todos',
        loading: false
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error processing file";
      set({ loading: false, error: errorMessage });
    }
  }
}));
