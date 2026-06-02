import React from 'react';
import type { PedagogicalArchetype } from '../../../domain/types';

export type FilterValue = 'todos' | PedagogicalArchetype;

const OPTIONS: { value: FilterValue; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'confiado', label: 'El Confiado' },
  { value: 'resiliente', label: 'El Resiliente' },
  { value: 'montana-rusa', label: 'Montaña Rusa' },
  { value: 'radar', label: 'Radar' },
];

interface Props {
  value: FilterValue;
  onChange: (value: FilterValue) => void;
}

export const InsightsFilter: React.FC<Props> = ({ value, onChange }) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as FilterValue)}
      className="px-4 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-sm font-medium shadow-sm transition-premium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
      aria-label="Filtrar por arquetipo"
    >
      {OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};
