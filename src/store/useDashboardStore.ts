import { create } from 'zustand';
import * as XLSX from 'xlsx';
import type { Estudiante, PeriodConfig, RowArea, RowAsignatura } from '../domain/types';
import { parseHeaders, extractStudents, flattenRows } from '../services/excelParser';
import { applyAcademicLogic } from '../services/academicLogic';

export interface DashboardState {
  estudiantes: Estudiante[];
  rowsArea: RowArea[];
  rowsAsignatura: RowAsignatura[];
  loading: boolean;
  error: string | null;
  config: PeriodConfig;
  setConfig: (config: PeriodConfig) => void;
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
  
  setConfig: (config) => set((state) => {
    let newEstudiantes = state.estudiantes;
    let newRowsArea = state.rowsArea;
    let newRowsAsignatura = state.rowsAsignatura;

    if (newEstudiantes.length > 0) {
      applyAcademicLogic(newEstudiantes, config);
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
    set({ loading: true, error: null });
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      // Assume first sheet for now
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (rows.length < 4) {
        throw new Error("El archivo no tiene suficientes filas para ser procesado.");
      }

      // Headers are usually in the first 3 rows
      const headerRows = rows.slice(0, 3);
      const dataRows = rows.slice(3);
      
      const { headers } = parseHeaders(headerRows);
      
      // Use filename as curso for now, stripping extension
      const curso = file.name.replace(/\.[^/.]+$/, "");
      
      const students = extractStudents(dataRows, headers, curso);
      
      // Call logic with current config
      applyAcademicLogic(students, get().config);
      
      const { rowsArea, rowsAsignatura } = flattenRows(students);
      
      set({ 
        estudiantes: students,
        rowsArea,
        rowsAsignatura,
        loading: false
      });
    } catch (err: any) {
      set({ loading: false, error: err.message || "Error processing file" });
    }
  }
}));
