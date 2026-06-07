import { useState, useEffect } from 'react';
import { useDashboardStore } from '../../../store/useDashboardStore';
import { useUIStore } from '../../../store/useUIStore';
import { useSimulationStore } from '../../../store/useSimulationStore';

export const useAnalysisTabState = () => {
  const viewMode = useDashboardStore(state => state.viewMode);
  const setViewMode = useDashboardStore(state => state.setViewMode);
  const selectedGrupo = useDashboardStore(state => state.selectedGrupo);
  const setGrupo = useDashboardStore(state => state.setGrupo);
  const availableGroups = useDashboardStore(state => state.availableGroups);
  
  const filters = useUIStore(state => state.analysisFilters);
  const setFilters = useUIStore(state => state.setAnalysisFilters);
  const sortConfig = useUIStore(state => state.analysisSortConfig);
  const setSortConfig = useUIStore(state => state.setAnalysisSortConfig);
  
  const [isWeightsExpanded, setIsWeightsExpanded] = useState(false);
  const [profileStudentId, setProfileStudentId] = useState<string | null>(null);

  const setSimulation = useSimulationStore(state => state.setSimulation);
  const clearSimulation = useSimulationStore(state => state.clearSimulation);
  const clearAllSimulations = useSimulationStore(state => state.clearAllSimulations);
  const exportToHash = useSimulationStore(state => state.exportToHash);
  const importFromHash = useSimulationStore(state => state.importFromHash);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#sim=')) {
        const success = importFromHash(hash);
        if (success) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [importFromHash]);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const toggleGroup = (estudiante: string) => {
    setExpandedGroups(prev => ({ ...prev, [estudiante]: !prev[estudiante] }));
  };

  const [expandedAreas, setExpandedAreas] = useState<Record<string, boolean>>({});
  const toggleArea = (estudiante: string, area: string) => {
    const key = `${estudiante}_${area}`;
    setExpandedAreas(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev && prev.key === key) {
        if (prev.direction === 'desc') return { key, direction: 'asc' };
        return null;
      }
      return { key, direction: 'desc' };
    });
  };

  return {
    viewMode,
    setViewMode,
    selectedGrupo,
    setGrupo,
    availableGroups,
    filters,
    setFilters,
    sortConfig,
    handleSort,
    isWeightsExpanded,
    setIsWeightsExpanded,
    profileStudentId,
    setProfileStudentId,
    setSimulation,
    clearSimulation,
    clearAllSimulations,
    exportToHash,
    expandedGroups,
    toggleGroup,
    expandedAreas,
    toggleArea
  };
};
