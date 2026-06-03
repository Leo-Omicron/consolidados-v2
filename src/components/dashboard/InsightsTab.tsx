import React, { useMemo, useState } from 'react';
import { useInsights } from '../../hooks/useInsights';
import { InsightsFilter, type FilterValue } from './InsightsTab/InsightsFilter';
import { ArchetypeCard } from './InsightsTab/ArchetypeCard';
import { StudentProfileModal } from './StudentProfileModal';
import { buildStudentProfileData } from '../../services/studentProfileService';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useSimulationStore } from '../../store/useSimulationStore';
import type { ArchetypeResult, PedagogicalArchetype } from '../../domain/types';

const KPI_CONFIG: { key: PedagogicalArchetype; label: string; color: string }[] = [
  { key: 'confiado', label: 'El Confiado', color: 'border-l-red-500 bg-red-50 dark:bg-red-950/20' },
  { key: 'resiliente', label: 'El Resiliente', color: 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
  { key: 'montana-rusa', label: 'Montaña Rusa', color: 'border-l-purple-500 bg-purple-50 dark:bg-purple-950/20' },
  { key: 'radar', label: 'Radar', color: 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/20' },
];

export const InsightsTab: React.FC = () => {
  const { results, counts, evaluatedPeriods } = useInsights();
  const [filter, setFilter] = useState<FilterValue>('todos');
  const [profileStudentId, setProfileStudentId] = useState<string | null>(null);

  const estudiantes = useDashboardStore(state => state.estudiantes);
  const activeSimulations = useSimulationStore(state => state.activeSimulations);

  // Profile data for modal
  const profileData = useMemo(() => {
    if (!profileStudentId) return null;
    return buildStudentProfileData(
      profileStudentId,
      estudiantes,
      results as ArchetypeResult[],
      activeSimulations,
    );
  }, [profileStudentId, estudiantes, results, activeSimulations]);

  const evaluatedCount = Object.values(evaluatedPeriods || {}).filter(Boolean).length;
  const hasSufficientData = evaluatedCount >= 2;

  const filteredResults = useMemo(() => {
    if (filter === 'todos') return results;
    return results.filter((r) => r.archetype === filter);
  }, [results, filter]);

  // Group results by archetype for grouped display
  const groupedResults = useMemo(() => {
    const groups: Record<string, ArchetypeResult[]> = {};
    for (const r of filteredResults) {
      if (!groups[r.archetype]) groups[r.archetype] = [];
      groups[r.archetype].push(r);
    }
    return groups;
  }, [filteredResults]);

  const hasResults = filteredResults.length > 0;
  const hasAnyData = results.length > 0;

  return (
    <div className="px-6 pb-6 app-text">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold app-text tracking-tight">Oracle Insights</h2>
          <p className="text-sm app-text-muted mt-1">
            Detección de arquetipos pedagógicos basada en trayectorias académicas
          </p>
        </div>

        {hasAnyData && (
          <InsightsFilter value={filter} onChange={setFilter} />
        )}
      </div>

      {/* Empty state - Insufficient data */}
      {!hasSufficientData && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold app-text mb-2">No hay datos suficientes</h3>
          <p className="text-sm app-text-muted max-w-md">
            Se requieren al menos 2 períodos evaluados por estudiante para detectar arquetipos pedagógicos.
            Cargue un archivo Excel con datos de múltiples períodos.
          </p>
        </div>
      )}

      {/* Empty state - Stable group */}
      {hasSufficientData && !hasAnyData && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-green-50 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold app-text mb-2">Grupo estable</h3>
          <p className="text-sm app-text-muted max-w-md">
            No se detectaron estudiantes con riesgo o tendencias atípicas. El grupo se encuentra estable según los criterios pedagógicos.
          </p>
        </div>
      )}

      {/* KPI Row */}
      {hasSufficientData && hasAnyData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {KPI_CONFIG.map(({ key, label, color }) => (
            <div
              key={key}
              className={`${color} border border-slate-200 dark:border-neutral-700 border-l-4 rounded-lg p-4 shadow-sm`}
            >
              <div className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                {label}
              </div>
              <div className="text-3xl font-black text-slate-800 dark:text-slate-200">
                {counts[key]}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty results after filtering */}
      {hasAnyData && !hasResults && (
        <div className="text-center py-8 app-text-muted">
          No hay estudiantes con el arquetipo seleccionado.
        </div>
      )}

      {/* Grouped Student Cards */}
      {hasResults && (
        <div className="space-y-8">
          {Object.entries(groupedResults).map(([archetype, cards]) => (
            <section key={archetype}>
              <h3 className="text-base font-bold app-text mb-3 flex items-center gap-2">
                <span>
                  {KPI_CONFIG.find((k) => k.key === archetype)?.label ?? archetype}
                </span>
                <span className="text-sm font-normal app-text-muted">
                  ({cards.length} {cards.length === 1 ? 'estudiante' : 'estudiantes'})
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cards.map((result) => (
                  <ArchetypeCard
                    key={result.estudianteId}
                    result={result}
                    onOpenStudentProfile={setProfileStudentId}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Student Profile Modal */}
      <StudentProfileModal
        profileData={profileData}
        isOpen={profileStudentId !== null}
        onClose={() => setProfileStudentId(null)}
      />
    </div>
  );
};
