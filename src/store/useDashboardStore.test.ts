import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDashboardStore } from './useDashboardStore';
import * as academicLogic from '../services/academicLogic';
import * as rowFlattener from '../services/rowFlattener';
import * as excelWorkerClient from '../services/excelWorkerClient';
import type { ParsedExcelData, ParseCallbacks } from '../services/excelWorkerClient';

// ---------------------------------------------------------------------------
// Mock academicLogic (used by setConfig / updateSubjectWeight — unchanged)
// ---------------------------------------------------------------------------
vi.mock('../services/academicLogic', () => ({
  applyAcademicLogic: vi.fn(),
  inferSubjectWeights: vi.fn()
}));

// ---------------------------------------------------------------------------
// Mock rowFlattener.flattenRows (still used by setConfig / updateSubjectWeight)
// ---------------------------------------------------------------------------
vi.mock('../services/rowFlattener', () => ({
  flattenRows: vi.fn(() => ({
    rowsArea: [{ area: 'AREA_1', promActual: 10, estado: { text: 'Ganado', color: 'green' } }],
    rowsAsignatura: []
  }))
}));

// ---------------------------------------------------------------------------
// Mock excelWorkerClient (used by processFiles)
// ---------------------------------------------------------------------------
vi.mock('../services/excelWorkerClient', () => ({
  parseFileInWorker: vi.fn(),
  terminateWorker: vi.fn()
}));

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------
const mockParsedResult: ParsedExcelData = {
  estudiantes: [{ id: '1', name: 'Alice', CURSO: 'test', grupo: '10A', areas: {} }],
  rowsArea: [{ id: '1_AREA', CURSO: 'test', estudiante: 'Alice', area: 'CIENCIAS', grupo: '10A', defP1: 4.0, defP2: 3.5, defP3: null, promActual: 3.7, p4Min: 2.1, estado: { text: 'Recuperable', color: 'blue' }, CURSO_NORM: 'TEST', AREA_NORM: 'CIENCIAS', EST_NORM: 'ALICE' }],
  rowsAsignatura: [],
  subjectWeights: { '10A': { 'CIENCIAS': { 'BIOLOGIA': 0.5, 'QUIMICA': 0.5 } } },
  availableGroups: ['Todos', '10A'],
  diagnosticReport: { isValid: true, totalSheetsProcessed: 1, issues: [] }
};

describe('useDashboardStore', () => {
  beforeEach(() => {
    useDashboardStore.setState({
      estudiantes: [],
      rowsArea: [],
      rowsAsignatura: [],
      loading: false,
      error: null,
      config: { P1: 33.3, P2: 33.3, P3: 33.4 },
      selectedGrupo: 'Todos',
      availableGroups: [],
      parsingProgress: null,
      diagnosticReport: null
    });
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // Existing behavior — setConfig, updateSubjectWeight, setGrupo, viewMode
  // -----------------------------------------------------------------------
  it('setConfig should only update config if no students', () => {
    const newConfig = { P1: 40, P2: 30, P3: 30 };
    useDashboardStore.getState().setConfig(newConfig);

    expect(useDashboardStore.getState().config).toEqual(newConfig);
    expect(academicLogic.applyAcademicLogic).not.toHaveBeenCalled();
  });

  it('setConfig should trigger recalculation if students exist', () => {
    useDashboardStore.setState({
      estudiantes: [{ id: '1', nombre: 'Test', notas: [] } as any]
    });

    const newConfig = { P1: 40, P2: 30, P3: 30 };
    useDashboardStore.getState().setConfig(newConfig);

    expect(academicLogic.applyAcademicLogic).toHaveBeenCalledWith(
      [{ id: '1', nombre: 'Test', notas: [] }],
      newConfig,
      {}
    );
    expect(rowFlattener.flattenRows).toHaveBeenCalled();
    expect(useDashboardStore.getState().rowsArea).toHaveLength(1);
    expect(useDashboardStore.getState().rowsArea[0].area).toBe('AREA_1');
  });

  it('provides default subjectWeights and updates them via updateSubjectWeight', () => {
    expect(useDashboardStore.getState().subjectWeights).toEqual({});

    useDashboardStore.getState().updateSubjectWeight('6A', 'Matemáticas', 'Álgebra', 0.6);
    useDashboardStore.getState().updateSubjectWeight('6A', 'Matemáticas', 'Geometría', 0.4);

    const state = useDashboardStore.getState();
    expect(state.subjectWeights).toEqual({
      '6A': {
        'Matemáticas': {
          'Álgebra': 0.6,
          'Geometría': 0.4
        }
      }
    });

    useDashboardStore.getState().updateSubjectWeight('6A', 'Matemáticas', 'Álgebra', 0.5);
    expect(useDashboardStore.getState().subjectWeights['6A']['Matemáticas']['Álgebra']).toBe(0.5);
  });

  it('provides setGrupo to update selectedGrupo', () => {
    expect(useDashboardStore.getState().selectedGrupo).toBe('Todos');
    useDashboardStore.getState().setGrupo('A');
    expect(useDashboardStore.getState().selectedGrupo).toBe('A');
  });

  it('provides viewMode with default "area" and updates via setViewMode', () => {
    const state = useDashboardStore.getState();
    expect(state.viewMode).toBe('area');

    state.setViewMode('subject');
    expect(useDashboardStore.getState().viewMode).toBe('subject');

    state.setViewMode('area');
    expect(useDashboardStore.getState().viewMode).toBe('area');
  });

  // -----------------------------------------------------------------------
  // processFiles — worker client integration
  // -----------------------------------------------------------------------
  describe('processFiles (worker integration)', () => {
    let parseFileMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      parseFileMock = excelWorkerClient.parseFileInWorker as ReturnType<typeof vi.fn>;
      parseFileMock.mockReset();
    });

    it('delegates to excelWorkerClient.parseFileInWorker', async () => {
      parseFileMock.mockResolvedValue(mockParsedResult);

      
      await useDashboardStore.getState().processFiles([]);

      expect(parseFileMock).toHaveBeenCalledTimes(1);
      expect(parseFileMock).toHaveBeenCalledWith(expect.any(Array), expect.any(Object), expect.any(Object), expect.objectContaining({
        onProgress: expect.any(Function),
        onDiagnostic: expect.any(Function)
      }));
    });

    it('sets loading=true and parsingProgress at start', () => {
      

      // Call processFiles but don't await — check intermediate state
      useDashboardStore.getState().processFiles([]);

      expect(useDashboardStore.getState().loading).toBe(true);
      expect(useDashboardStore.getState().parsingProgress).toBe('Leyendo archivos...');
    });

    it('updates parsingProgress from onProgress callback', async () => {
      // Capture the callbacks
      parseFileMock.mockImplementation(async (_file: File, _config: any, _subjectWeights: any, callbacks: ParseCallbacks) => {
        callbacks?.onProgress?.('Leyendo archivos...', '10%');
        callbacks?.onProgress?.('Extrayendo estudiantes...', '50%');
        callbacks?.onProgress?.('Calculando pesos...', '75%');
        return mockParsedResult;
      });

      
      await useDashboardStore.getState().processFiles([]);

      // After processFiles completes, parsingProgress should be null
      expect(useDashboardStore.getState().parsingProgress).toBeNull();
    });

    it('updates diagnosticReport from onDiagnostic callback', async () => {
      const warnReport = {
        isValid: true,
        totalSheetsProcessed: 1,
        issues: [{ code: 'EMPTY_GRADE' as const, severity: 'WARNING' as const, sheet: 'Sheet1', col: 'C', row: 5, message: 'empty', action: 'fix' }]
      };

      parseFileMock.mockImplementation(async (_file: File, _config: any, _subjectWeights: any, callbacks: ParseCallbacks) => {
        callbacks?.onDiagnostic?.(warnReport);
        // RESULT carries the same diagnosticReport
        return { ...mockParsedResult, diagnosticReport: warnReport };
      });

      
      await useDashboardStore.getState().processFiles([]);

      expect(useDashboardStore.getState().diagnosticReport?.isValid).toBe(true);
      expect(useDashboardStore.getState().diagnosticReport?.issues[0].code).toBe('EMPTY_GRADE');
    });

    it('populates all state fields on successful RESULT', async () => {
      parseFileMock.mockResolvedValue(mockParsedResult);

      
      useDashboardStore.getState().setGrupo('X');

      await useDashboardStore.getState().processFiles([]);

      const state = useDashboardStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.estudiantes).toHaveLength(1);
      expect(state.rowsArea).toHaveLength(1);
      expect(state.availableGroups).toEqual(['Todos', '10A']);
      expect(state.selectedGrupo).toBe('10A');
      expect(state.subjectWeights).toEqual(mockParsedResult.subjectWeights);
      expect(state.parsingProgress).toBeNull();
    });

    it('sets error and loading=false on worker rejection', async () => {
      parseFileMock.mockRejectedValue(new Error('parse failed'));

      
      await useDashboardStore.getState().processFiles([]);

      const state = useDashboardStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBe('parse failed');
      expect(state.parsingProgress).toBeNull();
    });

    it('handles worker ERROR with diagnostic attached', async () => {
      const criticalDiag = {
        isValid: false,
        totalSheetsProcessed: 0,
        issues: [{ code: 'MISSING_SCHEMA' as const, severity: 'CRITICAL' as const, sheet: 'Global', message: 'No hay hojas válidas', action: 'fix' }]
      };

      parseFileMock.mockImplementation(async (_file: File, _config: any, _subjectWeights: any, callbacks: ParseCallbacks) => {
        callbacks?.onDiagnostic?.(criticalDiag);
        throw new Error('No hay hojas válidas');
      });

      
      await useDashboardStore.getState().processFiles([]);

      const state = useDashboardStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBe('No hay hojas válidas');
      expect(state.diagnosticReport?.isValid).toBe(false);
      expect(state.estudiantes).toEqual([]);
    });
  });

  describe('merge validation', () => {
    it('resets selectedGrupo to Todos if it is not in availableGroups', () => {
      // Simulate Zustand persist merge manually using store config
      const storeConfig = (useDashboardStore as any).persist.getOptions();
      
      const persistedState = {
        selectedGrupo: '10B',
        availableGroups: ['Todos', '10A']
      };
      
      const currentState = {
        selectedGrupo: '10A',
        availableGroups: ['Todos', '10A']
      };
      
      const merged = storeConfig.merge(persistedState, currentState);
      
      expect(merged.selectedGrupo).toBe('Todos');
    });

    it('keeps selectedGrupo if it is in availableGroups', () => {
      const storeConfig = (useDashboardStore as any).persist.getOptions();
      
      const persistedState = {
        selectedGrupo: '10A',
        availableGroups: ['Todos', '10A', '10B']
      };
      
      const currentState = {
        selectedGrupo: 'Todos',
        availableGroups: ['Todos']
      };
      
      const merged = storeConfig.merge(persistedState, currentState);
      
      expect(merged.selectedGrupo).toBe('10A');
    });
  });
});
