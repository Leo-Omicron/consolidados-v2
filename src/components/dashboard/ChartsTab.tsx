import React, { useState } from 'react';
import { SummaryTab } from './SummaryTab';
import { EvolutionTab } from './EvolutionTab';
import { BattleTab } from './BattleTab';

export const ChartsTab: React.FC = () => {
  const [subTab, setSubTab] = useState<'resumen' | 'evolucion' | 'batalla'>('resumen');

  return (
    <div className="flex flex-col h-full fade-in">
      {/* Sub-navigation bar */}
      <div className="mb-6 mx-6 mt-2">
        <div className="flex bg-white dark:bg-neutral-900 rounded-lg p-1 shadow-sm border app-border w-max max-w-full overflow-x-auto">
          <button
            onClick={() => setSubTab('resumen')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              subTab === 'resumen'
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Resumen General
          </button>
          <button
            onClick={() => setSubTab('evolucion')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              subTab === 'evolucion'
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Evolución
          </button>
          <button
            onClick={() => setSubTab('batalla')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              subTab === 'batalla'
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Batalla de Grupos
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1">
        {subTab === 'resumen' && <SummaryTab />}
        {subTab === 'evolucion' && <EvolutionTab />}
        {subTab === 'batalla' && <BattleTab />}
      </div>
    </div>
  );
};
