import React from 'react';
import { useDashboardStore } from '../../store/useDashboardStore';

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

  return (
    <header className="sticky top-0 z-50 bg-slate-50/50 backdrop-blur-md border-b border-slate-200/50 transition-premium">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center space-x-4">
            <h1 className="text-xl font-bold text-slate-900 tracking-premium">Dashboard de Consolidados</h1>
            
            {availableGroups.length > 1 && (
              <select
                value={selectedGrupo}
                onChange={(e) => setGrupo(e.target.value)}
                className="ml-4 block w-48 pl-3 pr-10 py-2 text-sm border border-slate-200/60 bg-white/80 backdrop-blur-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 rounded-lg shadow-sm transition-premium"
              >
                {availableGroups.map(grupo => (
                  <option key={grupo} value={grupo}>
                    {grupo === 'Todos' ? 'Todos los grupos' : `Grupo ${grupo}`}
                  </option>
                ))}
              </select>
            )}
          </div>
          <nav className="flex space-x-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold tracking-premium transition-premium ${
                  activeTab === tab.id
                    ? 'bg-violet-50 text-violet-700 shadow-sm border border-violet-100/50'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50/80'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};
