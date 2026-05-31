import { create } from 'zustand';
import LZString from 'lz-string';
import type { PeriodoNotas } from '../domain/types';

export interface SimulationState {
  activeSimulations: Record<string, Partial<PeriodoNotas>>;
  setSimulation: (rowId: string, period: keyof PeriodoNotas, value: number | null) => void;
  clearSimulation: (rowId: string) => void;
  clearAllSimulations: () => void;
  exportToHash: () => string;
  importFromHash: (hash: string) => boolean;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
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

  exportToHash: () => {
    const data = get().activeSimulations;
    if (Object.keys(data).length === 0) return '';
    return LZString.compressToEncodedURIComponent(JSON.stringify(data));
  },

  importFromHash: (hash: string) => {
    try {
      if (!hash) return false;
      const cleanHash = hash.replace(/^#sim=/, '');
      if (!cleanHash) return false;
      const decompressed = LZString.decompressFromEncodedURIComponent(cleanHash);
      if (!decompressed) return false;
      const data = JSON.parse(decompressed);
      set({ activeSimulations: data });
      return true;
    } catch (e) {
      console.error('Failed to import simulations from hash', e);
      return false;
    }
  }
}));
