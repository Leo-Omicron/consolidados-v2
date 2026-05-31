import React from 'react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useThemeStore } from '../../store/useThemeStore';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'analysis', label: 'Analysis' },
    { id: 'alerts', label: 'Alertas' },
    { id: 'tutors', label: 'Mentores' },
    { id: 'volatility', label: 'Volatilidad' },
    { id: 'heatmap', label: 'Mapa de Calor' },
    { id: 'charts', label: 'Estadísticas' },
    { id: 'reports', label: 'Reports' },
  ];

  const { availableGroups, selectedGrupo, setGrupo, clearAllData, estudiantes } = useDashboardStore();
  const { mode, toggleMode } = useThemeStore();
  const isDarkMode = mode === 'dark';
  const hasData = estudiantes.length > 0;

  return (
    <header className="sticky top-0 z-50 app-bg backdrop-blur-md border-b app-border transition-premium">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center gap-3">
            <h1 className="text-xl font-bold app-text tracking-premium hidden lg:block">Dashboard de Consolidados</h1>
            <h1 className="text-xl font-bold app-text tracking-premium lg:hidden block">Dashboard</h1>
            
            {availableGroups.length > 1 && (
              <select
                value={selectedGrupo}
                onChange={(e) => setGrupo(e.target.value)}
                className="block w-32 sm:w-48 pl-3 pr-8 py-2 text-sm border app-control app-focus backdrop-blur-sm rounded-lg shadow-sm transition-premium truncate"
              >
                {availableGroups.map(grupo => (
                  <option key={grupo} value={grupo}>
                    {grupo === 'Todos' ? 'Todos los grupos' : `Grupo ${grupo}`}
                  </option>
                ))}
              </select>
            )}
            
            {hasData && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('¿Estás seguro de que deseas cerrar el archivo actual y limpiar los datos locales?')) {
                    clearAllData();
                  }
                }}
                className="ml-2 text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
              >
                Cerrar Archivo
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 overflow-x-auto pb-1 hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <button
              type="button"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-pressed={isDarkMode}
              onClick={toggleMode}
              className="shrink-0 px-3 py-2 rounded-lg text-sm font-semibold tracking-premium border app-control app-control-hover app-focus transition-premium"
            >
              {isDarkMode ? '🌙 Dark' : '☀️ Light'}
            </button>
            <nav className="flex space-x-2 shrink-0" aria-label="Dashboard sections">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => setActiveTab(tab.id)}
                    className={`shrink-0 px-3.5 py-2 rounded-lg text-sm font-semibold tracking-premium transition-premium border app-focus ${
                      isActive
                        ? 'app-tab-active shadow-sm'
                        : 'app-tab-inactive border-transparent'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};
