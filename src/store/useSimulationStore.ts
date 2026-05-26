import { create } from 'zustand';
import type { PeriodoNotas } from '../domain/types';

export interface SimulationState {
  activeSimulations: Record<string, Partial<PeriodoNotas>>;
  setSimulation: (rowId: string, period: keyof PeriodoNotas, value: number | null) => void;
  clearSimulation: (rowId: string) => void;
  clearAllSimulations: () => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  activeSimulations: {},
  
  setSimulation: (rowId, period, value) => {
    let sanitizedValue = value;
    if (value !== null && value !== undefined) {
      // Validar y limitar rango a [0.0, 5.0] y redondear a 2 decimales
      const parsedValue = Number(value);
      if (!isNaN(parsedValue)) {
        sanitizedValue = Math.max(0, Math.min(5, Math.round(parsedValue * 100) / 100));
      } else {
        sanitizedValue = null;
      }
    } else {
      sanitizedValue = null;
    }

    set((state) => {
      const currentOverrides = state.activeSimulations[rowId] || {};
      const newOverrides = { ...currentOverrides, [period]: sanitizedValue };

      const cleanOverrides: Partial<PeriodoNotas> = {};
      (Object.keys(newOverrides) as Array<keyof PeriodoNotas>).forEach((key) => {
        const val = newOverrides[key];
        if (val !== null && val !== undefined) {
          if (key === 'P4') {
            cleanOverrides.P4 = val;
          } else {
            cleanOverrides[key] = val;
          }
        }
      });

      const nextSimulations = { ...state.activeSimulations };
      if (Object.keys(cleanOverrides).length > 0) {
        nextSimulations[rowId] = cleanOverrides;
      } else {
        delete nextSimulations[rowId];
      }

      return { activeSimulations: nextSimulations };
    });
  },

  clearSimulation: (rowId) =>
    set((state) => {
      const nextSimulations = { ...state.activeSimulations };
      delete nextSimulations[rowId];
      return { activeSimulations: nextSimulations };
    }),

  clearAllSimulations: () => set({ activeSimulations: {} }),
}));
