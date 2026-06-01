import React from 'react';
import type { PeriodoNotas } from '../../../domain/types';

export interface AnalysisKPIsData {
  promedioGeneral: number;
  statusDistribution: Record<string, number>;
}

interface AnalysisKPIsProps {
  selectedGrupo: string;
  kpis: AnalysisKPIsData;
  originalKpis: AnalysisKPIsData;
  activeSimulations: Record<string, Partial<PeriodoNotas>>;
  viewMode: 'area' | 'subject';
}

export const AnalysisKPIs: React.FC<AnalysisKPIsProps> = ({
  selectedGrupo,
  kpis,
  originalKpis,
  activeSimulations,
  viewMode
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="app-surface p-4 rounded-lg shadow border app-border flex flex-col justify-center items-center">
        <div className="app-text-muted text-sm font-medium uppercase mb-1">Grupo Activo</div>
        <div className="text-2xl font-bold app-text">{selectedGrupo === 'Todos' ? 'Todos los grupos' : `Grupo ${selectedGrupo}`}</div>
      </div>
      <div className="app-surface p-4 rounded-lg shadow border app-border flex flex-col justify-center items-center relative overflow-hidden">
        <div className="app-text-muted text-sm font-medium uppercase mb-1">Promedio General</div>
        <div className="text-3xl font-bold app-text flex items-center gap-2">
          <span className="transition-all duration-500 ease-in-out">{kpis.promedioGeneral.toFixed(2)}</span>
          {Object.keys(activeSimulations).length > 0 && Math.abs(kpis.promedioGeneral - originalKpis.promedioGeneral) > 0.001 && (
            <span className={`text-lg font-bold transition-all duration-500 animate-fade-in ${kpis.promedioGeneral > originalKpis.promedioGeneral ? 'text-emerald-500' : 'text-rose-500'}`}>
              {kpis.promedioGeneral > originalKpis.promedioGeneral ? '▲' : '▼'} {Math.abs(kpis.promedioGeneral - originalKpis.promedioGeneral).toFixed(2)}
            </span>
          )}
        </div>
      </div>
      <div className="app-surface p-4 rounded-lg shadow border app-border">
        <div className="app-text-muted text-sm font-medium uppercase mb-2 text-center">Distribución de Estados</div>
        {Object.keys(activeSimulations).length > 0 && (
          <div className="mb-3 flex justify-center animate-fade-in">
            {(() => {
              const origRisk = (originalKpis.statusDistribution['Perdido'] || 0) + (originalKpis.statusDistribution['En riesgo'] || 0);
              const currRisk = (kpis.statusDistribution['Perdido'] || 0) + (kpis.statusDistribution['En riesgo'] || 0);
              const diff = origRisk - currRisk;
              if (diff > 0) {
                const label = viewMode === 'area' ? (diff === 1 ? 'área salió' : 'áreas salieron') : (diff === 1 ? 'asignatura salió' : 'asignaturas salieron');
                return <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200 dark:border-emerald-800">🎉 {diff} {label} de riesgo vital</span>;
              }
              if (diff < 0) {
                const abs = Math.abs(diff);
                const label = viewMode === 'area' ? (abs === 1 ? 'área cayó' : 'áreas cayeron') : (abs === 1 ? 'asignatura cayó' : 'asignaturas cayeron');
                return <span className="bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 px-3 py-1 rounded-full text-xs font-bold border border-rose-200 dark:border-rose-800">⚠️ {abs} {label} en riesgo vital</span>;
              }
              return null;
            })()}
          </div>
        )}
        <div className="flex flex-wrap gap-2 justify-center">
          {Object.entries(kpis.statusDistribution).map(([status, count]) => (
            <div key={status} className="app-surface-muted px-3 py-1 rounded text-sm transition-all duration-300">
              <span className="font-semibold">{status}:</span> {count as number}
            </div>
          ))}
          {Object.keys(kpis.statusDistribution).length === 0 && (
            <div className="app-text-muted text-sm">No hay datos</div>
          )}
        </div>
      </div>
    </div>
  );
};
