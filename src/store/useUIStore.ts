import { create } from 'zustand';
import type { ReportCategory } from '../domain/types';

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
  
  reportsActiveTab: ReportCategory;
  setReportsActiveTab: (tab: ReportCategory) => void;
}

export const useUIStore = create<UIState>((set) => ({
  analysisFilters: { search: '', area: '', status: '' },
  analysisSortConfig: null,
  
  reportsActiveTab: 'group-performance',
  
  setAnalysisFilters: (filters) => set((state) => ({
    analysisFilters: typeof filters === 'function' ? filters(state.analysisFilters) : filters
  })),
  setAnalysisSortConfig: (sortConfig) => set((state) => ({
    analysisSortConfig: typeof sortConfig === 'function' ? sortConfig(state.analysisSortConfig) : sortConfig
  })),
  
  setReportsActiveTab: (tab) => set({ reportsActiveTab: tab }),
}));
