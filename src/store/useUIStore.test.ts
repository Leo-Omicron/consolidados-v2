import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from './useUIStore';

describe('useUIStore', () => {
  beforeEach(() => {
    // Reset state before each test
    useUIStore.setState({
      analysisFilters: { search: '', area: '', status: '' },
      analysisSortConfig: null,
      reportsActiveTab: 'group-performance',
      reportsLocalGroup: '',
      reportsDirectorName: 'Director de Curso',
      reportsPeriodName: '',
    });
  });

  it('should initialize with default state', () => {
    const state = useUIStore.getState();
    expect(state.analysisFilters).toEqual({ search: '', area: '', status: '' });
    expect(state.analysisSortConfig).toBeNull();
    expect(state.reportsActiveTab).toBe('group-performance');
    expect(state.reportsLocalGroup).toBe('');
    expect(state.reportsDirectorName).toBe('Director de Curso');
    expect(state.reportsPeriodName).toBe('');
  });

  it('should update analysisFilters with an object', () => {
    useUIStore.getState().setAnalysisFilters({ search: 'test', area: 'Math', status: 'Aprobado' });
    expect(useUIStore.getState().analysisFilters).toEqual({ search: 'test', area: 'Math', status: 'Aprobado' });
  });

  it('should update analysisFilters with a function', () => {
    useUIStore.getState().setAnalysisFilters({ search: 'initial', area: '', status: '' });
    useUIStore.getState().setAnalysisFilters((prev) => ({ ...prev, area: 'Math' }));
    
    expect(useUIStore.getState().analysisFilters).toEqual({ search: 'initial', area: 'Math', status: '' });
  });

  it('should update analysisSortConfig with an object', () => {
    useUIStore.getState().setAnalysisSortConfig({ key: 'name', direction: 'asc' });
    expect(useUIStore.getState().analysisSortConfig).toEqual({ key: 'name', direction: 'asc' });
  });

  it('should update analysisSortConfig with a function', () => {
    useUIStore.getState().setAnalysisSortConfig({ key: 'name', direction: 'asc' });
    useUIStore.getState().setAnalysisSortConfig((prev) => (prev ? { ...prev, direction: 'desc' } : null));
    
    expect(useUIStore.getState().analysisSortConfig).toEqual({ key: 'name', direction: 'desc' });
  });

  it('should update reportsActiveTab', () => {
    useUIStore.getState().setReportsActiveTab('academic-risk');
    expect(useUIStore.getState().reportsActiveTab).toBe('academic-risk');
  });

  it('should update reportsLocalGroup', () => {
    useUIStore.getState().setReportsLocalGroup('Grupo A');
    expect(useUIStore.getState().reportsLocalGroup).toBe('Grupo A');
  });

  it('should update reportsDirectorName', () => {
    useUIStore.getState().setReportsDirectorName('Juan Perez');
    expect(useUIStore.getState().reportsDirectorName).toBe('Juan Perez');
  });

  it('should update reportsPeriodName', () => {
    useUIStore.getState().setReportsPeriodName('Periodo 1');
    expect(useUIStore.getState().reportsPeriodName).toBe('Periodo 1');
  });
});
