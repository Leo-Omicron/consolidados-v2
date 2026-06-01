import React, { useState, useRef, useEffect } from 'react';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useThemeStore } from '../../store/useThemeStore';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

interface TabItem {
  id: string;
  label: string;
}

interface TabGroupType {
  name: string;
  tabs: TabItem[];
}

const tabGroups = [
  {
    name: 'General',
    tabs: [
      { id: 'analysis', label: 'Dashboard Principal' },
      { id: 'reports', label: 'Reportes y PDF' },
    ]
  },
  {
    name: 'Desempeño',
    tabs: [
      { id: 'charts', label: 'Estadísticas' },
      { id: 'heatmap', label: 'Mapa de Calor' },
    ]
  },
  {
    name: 'Seguimiento',
    tabs: [
      { id: 'alerts', label: 'Alertas Tempranas' },
      { id: 'volatility', label: 'Volatilidad' },
      { id: 'tutors', label: 'Mentores' },
    ]
  }
];

const NavGroup = ({ group, activeTab, setActiveTab }: { group: TabGroupType, activeTab: string, setActiveTab: (id: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isActiveGroup = group.tabs.some((t: TabItem) => t.id === activeTab);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-sm font-semibold tracking-premium transition-premium border app-focus ${
          isActiveGroup
            ? 'app-tab-active shadow-sm border-blue-500/30 bg-blue-500/10'
            : 'app-tab-inactive border-transparent opacity-80 hover:opacity-100'
        }`}
      >
        {group.name}
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 sm:left-0 mt-2 w-48 rounded-xl shadow-xl border app-border app-bg py-1.5 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
          {group.tabs.map((tab: TabItem) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                  isActive 
                    ? 'app-text font-bold bg-black/5 dark:bg-white/10' 
                    : 'opacity-75 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                )}
                <span className={isActive ? '' : 'pl-3'}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {

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
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
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
              {tabGroups.map((group) => (
                <NavGroup 
                  key={group.name} 
                  group={group} 
                  activeTab={activeTab} 
                  setActiveTab={setActiveTab} 
                />
              ))}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};
