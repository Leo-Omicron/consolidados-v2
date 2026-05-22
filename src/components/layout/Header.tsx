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
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900">Dashboard de Consolidados</h1>
            
            {availableGroups.length > 1 && (
              <select
                value={selectedGrupo}
                onChange={(e) => setGrupo(e.target.value)}
                className="ml-4 block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                {availableGroups.map(grupo => (
                  <option key={grupo} value={grupo}>
                    {grupo === 'Todos' ? 'Todos los grupos' : `Grupo ${grupo}`}
                  </option>
                ))}
              </select>
            )}
          </div>
          <nav className="flex space-x-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
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
