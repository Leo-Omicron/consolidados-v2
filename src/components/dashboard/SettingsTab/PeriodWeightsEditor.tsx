import React, { useState, useEffect } from 'react';
import { useDashboardStore } from '../../../store/useDashboardStore';
import { useDebouncedCallback } from '../../../hooks/useDebouncedCallback';
import type { PeriodConfig } from '../../../domain/types';

export const PeriodWeightsEditor: React.FC = () => {
  const storeConfig = useDashboardStore(state => state.config);
  const setConfig = useDashboardStore(state => state.setConfig);
  const [localConfig, setLocalConfig] = useState<PeriodConfig>(storeConfig);

  const debouncedSetConfig = useDebouncedCallback((config: PeriodConfig) => {
    setConfig(config);
  }, 300);

  useEffect(() => {
    setLocalConfig(storeConfig);
  }, [storeConfig]);

  const handleSliderChange = (period: keyof PeriodConfig, valueStr: string) => {
    let newValue = parseInt(valueStr, 10);
    if (isNaN(newValue)) newValue = 0;
    
    // Prevent P4 from being edited if it's currently completely disabled (0 or undefined) and we're not allowing it.
    // Actually, let's just let them enable P4 if they want by sliding it.
    
    setLocalConfig(prev => {
      const draft = { ...prev, [period]: newValue };
      
      // Auto-compensate logic
      const periods: (keyof PeriodConfig)[] = ['P1', 'P2', 'P3'];
      if (draft.P4 !== undefined && draft.P4 > 0) {
        periods.push('P4');
      } else if (period === 'P4' && newValue === 0) {
        draft.P4 = 0;
      }

      let sum = periods.reduce((acc, p) => acc + (draft[p] || 0), 0);
      
      if (sum !== 100) {
        const diff = 100 - sum;
        // Distribute diff to the other periods
        const others = periods.filter(p => p !== period);
        if (others.length > 0) {
          // Simple distribution: add diff to the first available sibling, 
          // or distribute evenly if we want to be fancy.
          // For stability, we just adjust them proportionally or add to the largest.
          // To keep it simple and integer-based, we'll adjust the first sibling.
          let remainingDiff = diff;
          for (let i = 0; i < others.length; i++) {
            const p = others[i];
            if (i === others.length - 1) {
              draft[p] = Math.max(0, (draft[p] || 0) + remainingDiff);
            } else {
              const portion = Math.round(remainingDiff / (others.length - i));
              draft[p] = Math.max(0, (draft[p] || 0) + portion);
              remainingDiff -= portion;
            }
          }
          
          // Check final sum and fix any rounding issues
          const finalSum = periods.reduce((acc, p) => acc + (draft[p] || 0), 0);
          if (finalSum !== 100) {
            draft[others[0]] = Math.max(0, (draft[others[0]] || 0) + (100 - finalSum));
          }
        }
      }
      
      debouncedSetConfig(draft);
      return draft;
    });
  };

  const getPercentage = (val: number | undefined) => (val || 0);

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border app-border p-6 max-w-3xl">
      <h3 className="text-lg font-semibold app-text mb-6">Ponderación de Períodos</h3>
      
      {/* Visual Feedback Bar */}
      <div className="h-8 w-full flex rounded-lg overflow-hidden mb-8 border app-border">
        <div style={{ width: `${getPercentage(localConfig.P1)}%` }} className="bg-blue-500 flex items-center justify-center text-white text-xs font-bold transition-all duration-200">
          {localConfig.P1 > 5 ? `P1 ${Math.round(localConfig.P1)}%` : ''}
        </div>
        <div style={{ width: `${getPercentage(localConfig.P2)}%` }} className="bg-indigo-500 flex items-center justify-center text-white text-xs font-bold transition-all duration-200">
          {localConfig.P2 > 5 ? `P2 ${Math.round(localConfig.P2)}%` : ''}
        </div>
        <div style={{ width: `${getPercentage(localConfig.P3)}%` }} className="bg-purple-500 flex items-center justify-center text-white text-xs font-bold transition-all duration-200">
          {localConfig.P3 > 5 ? `P3 ${Math.round(localConfig.P3)}%` : ''}
        </div>
        {(localConfig.P4 || 0) > 0 && (
          <div style={{ width: `${getPercentage(localConfig.P4)}%` }} className="bg-pink-500 flex items-center justify-center text-white text-xs font-bold transition-all duration-200">
            {localConfig.P4! > 5 ? `P4 ${Math.round(localConfig.P4!)}%` : ''}
          </div>
        )}
      </div>

      <div className="space-y-6">
        {(['P1', 'P2', 'P3', 'P4'] as const).map(period => (
          <div key={period} className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label htmlFor={`slider-${period}`} className="text-sm font-medium app-text-muted">
                Período {period.replace('P', '')}
              </label>
              <span className="text-sm font-bold app-text">{Math.round(localConfig[period] || 0)}%</span>
            </div>
            <input
              id={`slider-${period}`}
              type="range"
              min="0"
              max="100"
              step="1"
              value={Math.round(localConfig[period] || 0)}
              onChange={(e) => handleSliderChange(period, e.target.value)}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500"
            />
          </div>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-lg text-sm">
        <p className="font-medium mb-1">Nota sobre la auto-compensación</p>
        <p>Los valores deben sumar exactamente 100%. Al ajustar un período, los demás se recalcularán automáticamente para mantener el balance.</p>
      </div>
    </div>
  );
};
