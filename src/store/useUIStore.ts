import { create } from 'zustand';

export interface AnalysisFilters {
  search: string;
  area: string;
  status: string;
}

export type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
} | null;

interface UIState {
  analysisFilters: AnalysisFilters;
  analysisSortConfig: SortConfig;
  setAnalysisFilters: (filters: AnalysisFilters | ((prev: AnalysisFilters) => AnalysisFilters)) => void;
  setAnalysisSortConfig: (sortConfig: SortConfig | ((prev: SortConfig) => SortConfig)) => void;
  
  reportsActiveTab: string;
  setReportsActiveTab: (tab: string) => void;
  reportsLocalGroup: string;
  setReportsLocalGroup: (group: string) => void;
  reportsDirectorName: string;
  setReportsDirectorName: (name: string) => void;
  reportsPeriodName: string;
  setReportsPeriodName: (name: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  analysisFilters: { search: '', area: '', status: '' },
  analysisSortConfig: null,
  
  reportsActiveTab: 'group-performance',
  reportsLocalGroup: '',
  reportsDirectorName: 'Director de Curso',
  reportsPeriodName: '',
  
  setAnalysisFilters: (filters) => set((state) => ({
    analysisFilters: typeof filters === 'function' ? filters(state.analysisFilters) : filters
  })),
  setAnalysisSortConfig: (sortConfig) => set((state) => ({
    analysisSortConfig: typeof sortConfig === 'function' ? sortConfig(state.analysisSortConfig) : sortConfig
  })),
  
  setReportsActiveTab: (tab) => set({ reportsActiveTab: tab }),
  setReportsLocalGroup: (group) => set({ reportsLocalGroup: group }),
  setReportsDirectorName: (name) => set({ reportsDirectorName: name }),
  setReportsPeriodName: (name) => set({ reportsPeriodName: name }),
}));
