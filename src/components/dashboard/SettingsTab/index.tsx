import React, { useState } from 'react';
import { PeriodWeightsEditor } from './PeriodWeightsEditor';
import { SubjectWeightsEditor } from './SubjectWeightsEditor';
import { PresetWeightsManager } from './PresetWeightsManager';

export const SettingsTab: React.FC = () => {
  const [subTab, setSubTab] = useState<'periods' | 'subjects' | 'presets'>('periods');

  return (
    <div className="flex flex-col h-full fade-in">
      <div className="mb-6 mx-6 mt-2">
        <h2 className="text-2xl font-bold app-text tracking-premium mb-4">Configuración de Pesos</h2>
        <div className="flex bg-white dark:bg-neutral-900 rounded-lg p-1 shadow-sm border app-border w-max max-w-full overflow-x-auto">
          <button
            onClick={() => setSubTab('periods')}
            aria-pressed={subTab === 'periods'}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all app-focus ${
              subTab === 'periods'
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Pesos por Período
          </button>
          <button
            onClick={() => setSubTab('subjects')}
            aria-pressed={subTab === 'subjects'}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all app-focus ${
              subTab === 'subjects'
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Pesos por Asignatura
          </button>
          <button
            onClick={() => setSubTab('presets')}
            aria-pressed={subTab === 'presets'}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all app-focus ${
              subTab === 'presets'
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Presets Institucionales
          </button>
        </div>
      </div>

      <div className="flex-1 px-6 pb-6 overflow-y-auto">
        {subTab === 'periods' && <PeriodWeightsEditor />}
        {subTab === 'subjects' && <SubjectWeightsEditor />}
        {subTab === 'presets' && <PresetWeightsManager />}
      </div>
    </div>
  );
};
