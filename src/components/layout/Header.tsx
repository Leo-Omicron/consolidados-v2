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
    { id: 'charts', label: 'Charts' },
    { id: 'reports', label: 'Reports' },
  ];

  const { availableGroups, selectedGrupo, setGrupo } = useDashboardStore();
  const { mode, toggleMode } = useThemeStore();
  const isDarkMode = mode === 'dark';

  return (
    <header className="sticky top-0 z-50 app-bg backdrop-blur-md border-b app-border transition-premium">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center space-x-4">
            <h1 className="text-xl font-bold app-text tracking-premium">Dashboard de Consolidados</h1>
            
            {availableGroups.length > 1 && (
              <select
                value={selectedGrupo}
                onChange={(e) => setGrupo(e.target.value)}
                className="ml-4 block w-48 pl-3 pr-10 py-2 text-sm border app-control app-focus backdrop-blur-sm rounded-lg shadow-sm transition-premium"
              >
                {availableGroups.map(grupo => (
                  <option key={grupo} value={grupo}>
                    {grupo === 'Todos' ? 'Todos los grupos' : `Grupo ${grupo}`}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-pressed={isDarkMode}
              onClick={toggleMode}
              className="px-3 py-2 rounded-lg text-sm font-semibold tracking-premium border app-control app-control-hover app-focus transition-premium"
            >
              {isDarkMode ? '🌙 Dark' : '☀️ Light'}
            </button>
            <nav className="flex space-x-2" aria-label="Dashboard sections">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3.5 py-2 rounded-lg text-sm font-semibold tracking-premium transition-premium border app-focus ${
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
