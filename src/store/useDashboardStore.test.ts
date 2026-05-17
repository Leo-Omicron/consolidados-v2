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
  flattenRows: vi.fn(() => ({
    rowsArea: [{ areaId: 'AREA_1', notaFinal: 10, estado: 'APROBADO' }],
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
      config: { P1: 33.3, P2: 33.3, P3: 33.4 }
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
      newConfig
    );
    expect(excelParser.flattenRows).toHaveBeenCalled();
    expect(useDashboardStore.getState().rowsArea).toHaveLength(1);
    expect(useDashboardStore.getState().rowsArea[0].areaId).toBe('AREA_1');
  });
});
