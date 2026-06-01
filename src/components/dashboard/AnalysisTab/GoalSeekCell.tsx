import React, { useState } from 'react';
import type { PeriodoNotas, PeriodConfig } from '../../../domain/types';
import { calcularNotaRequeridaParaObjetivo } from '../../../services/academicLogic';

export const GoalSeekCell: React.FC<{
  rowId: string;
  currentValue: number | null;
  notas: PeriodoNotas;
  config: PeriodConfig;
  evaluated: Record<'P1' | 'P2' | 'P3' | 'P4', boolean>;
  hasP4: boolean;
  onGoalSet: (rowId: string, period: 'P1' | 'P2' | 'P3' | 'P4', requiredGrade: number) => void;
}> = ({ rowId, currentValue, notas, config, evaluated, hasP4, onGoalSet }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState('');

  const handleBlur = () => {
    setIsEditing(false);
    if (value.trim() !== '') {
      const target = parseFloat(value);
      if (!isNaN(target)) {
        const required = calcularNotaRequeridaParaObjetivo(notas, config, target, evaluated);
        if (required !== null) {
          const nextPeriod = hasP4 ? 'P4' : 'P3';
          onGoalSet(rowId, nextPeriod, required);
        }
      }
    }
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setValue('');
    }
  };

  if (isEditing) {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        min="0"
        max="5"
        step="0.1"
        placeholder={currentValue?.toFixed(2) ?? ''}
        className="w-16 px-1 py-0.5 text-center border rounded border-indigo-500 bg-white dark:bg-neutral-900 text-indigo-900 dark:text-indigo-100 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
        autoFocus
        title="Ingresa el promedio que deseas alcanzar"
      />
    );
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      title="Click para buscar un objetivo de promedio"
      className="px-1.5 py-0.5 rounded font-medium cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors select-none"
    >
      {currentValue !== null && currentValue !== undefined ? currentValue.toFixed(2) : '-'}
    </span>
  );
};
