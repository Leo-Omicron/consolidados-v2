import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDashboardStore } from './useDashboardStore';
import * as academicLogic from '../services/academicLogic';
import * as excelParser from '../services/excelParser';

vi.mock('../services/academicLogic', () => ({
  applyAcademicLogic: vi.fn()
}));

vi.mock('../services/excelParser', () => ({
  parseHeaders: vi.fn(),
  extractStudents: vi.fn(),
  parseWorkbook: vi.fn(),
  flattenRows: vi.fn(() => ({
    rowsArea: [{ area: 'AREA_1', promActual: 10, estado: { text: 'Ganado', color: 'green' } }],
    rowsAsignatura: []
  }))
}));

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
      availableGroups: []
    });
    vi.clearAllMocks();
  });

  it('setConfig should only update config if no students', () => {
    const newConfig = { P1: 40, P2: 30, P3: 30 };
    useDashboardStore.getState().setConfig(newConfig);

    expect(useDashboardStore.getState().config).toEqual(newConfig);
    expect(academicLogic.applyAcademicLogic).not.toHaveBeenCalled();
  });

  it('setConfig should trigger recalculation if students exist', () => {
    // Inject mock students
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
    expect(excelParser.flattenRows).toHaveBeenCalled();
    expect(useDashboardStore.getState().rowsArea).toHaveLength(1);
    expect(useDashboardStore.getState().rowsArea[0].area).toBe('AREA_1');
  });

  it('provides default subjectWeights and updates them via updateSubjectWeight', () => {
    expect(useDashboardStore.getState().subjectWeights).toEqual({});

    useDashboardStore.getState().updateSubjectWeight('Matemáticas', 'Álgebra', 0.6);
    useDashboardStore.getState().updateSubjectWeight('Matemáticas', 'Geometría', 0.4);

    const state = useDashboardStore.getState();
    expect(state.subjectWeights).toEqual({
      'Matemáticas': {
        'Álgebra': 0.6,
        'Geometría': 0.4
      }
    });

    // Update existing
    useDashboardStore.getState().updateSubjectWeight('Matemáticas', 'Álgebra', 0.5);
    expect(useDashboardStore.getState().subjectWeights['Matemáticas']['Álgebra']).toBe(0.5);
  });

  it('provides setGrupo to update selectedGrupo', () => {
    expect(useDashboardStore.getState().selectedGrupo).toBe('Todos');
    useDashboardStore.getState().setGrupo('A');
    expect(useDashboardStore.getState().selectedGrupo).toBe('A');
  });

  it('processFile extracts unique groups and sets selectedGrupo to Todos', async () => {
    // We mock excelParser.parseWorkbook to return students with groups
    vi.spyOn(excelParser, 'parseWorkbook' as any).mockReturnValue([
      { id: '1', nombre: 'Test1', grupo: 'A', areas: {} },
      { id: '2', nombre: 'Test2', grupo: 'B', areas: {} },
      { id: '3', nombre: 'Test3', grupo: 'A', areas: {} },
    ]);
    
    // Create a dummy file
    const file = new File([''], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Set a different initial state to ensure it resets
    useDashboardStore.getState().setGrupo('X');
    
    await useDashboardStore.getState().processFile(file);
    
    const state = useDashboardStore.getState();
    expect(state.availableGroups).toEqual(['Todos', 'A', 'B']);
    expect(state.selectedGrupo).toBe('Todos');
  });

  it('provides viewMode with default "area" and updates via setViewMode', () => {
    const state = useDashboardStore.getState();
    expect(state.viewMode).toBe('area');

    state.setViewMode('subject');
    expect(useDashboardStore.getState().viewMode).toBe('subject');

    state.setViewMode('area');
    expect(useDashboardStore.getState().viewMode).toBe('area');
  });
});
