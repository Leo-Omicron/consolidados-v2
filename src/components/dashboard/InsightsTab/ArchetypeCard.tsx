import React from 'react';
import type { ArchetypeResult, PedagogicalArchetype } from '../../../domain/types';

const ARCHETYPE_LABELS: Record<PedagogicalArchetype, string> = {
  confiado: 'El Confiado',
  resiliente: 'El Resiliente',
  'montana-rusa': 'Montaña Rusa',
  radar: 'Radar',
};

const SEVERITY_LABELS: Record<string, string> = {
  high: 'Alerta',
  medium: 'Moderado',
  low: 'Bajo',
};

const SEVERITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  low: 'bg-blue-100 text-blue-800 border-blue-200',
};

const ARCHETYPE_CARD_COLORS: Record<PedagogicalArchetype, string> = {
  confiado: 'border-l-red-500',
  resiliente: 'border-l-emerald-500',
  'montana-rusa': 'border-l-purple-500',
  radar: 'border-l-amber-500',
};

interface Props {
  result: ArchetypeResult;
}

export const ArchetypeCard: React.FC<Props> = ({ result }) => {
  const { estudianteName, grupo, archetype, confidence, severity, periodGrades, narrative } = result;

  return (
    <div
      className={`bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 border-l-4 ${ARCHETYPE_CARD_COLORS[archetype]} rounded-lg p-5 shadow-sm`}
    >
      {/* Header: Name + Archetype Badge */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">{estudianteName}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Grupo {grupo}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 text-xs font-bold uppercase rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-neutral-600">
            {ARCHETYPE_LABELS[archetype]}
          </span>
          <span
            className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${SEVERITY_COLORS[severity]}`}
          >
            {SEVERITY_LABELS[severity]}
          </span>
        </div>
      </div>

      {/* Period Grade Pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {periodGrades.map((grade, i) => (
          <span
            key={i}
            className={`px-2 py-1 text-xs font-mono font-semibold rounded-md border ${
              grade !== null
                ? 'bg-slate-50 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-neutral-600'
                : 'bg-transparent text-slate-400 dark:text-slate-500 border-dashed border-slate-300 dark:border-neutral-600'
            }`}
          >
            P{i + 1}: {grade !== null ? grade.toFixed(1) : '—'}
          </span>
        ))}
      </div>

      {/* Narrative */}
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-3">{narrative}</p>

      {/* Confidence */}
      <div className="text-xs text-slate-500 dark:text-slate-400">
        Confianza del diagnóstico:{' '}
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          {Math.round(confidence * 100)}%
        </span>
      </div>
    </div>
  );
};
