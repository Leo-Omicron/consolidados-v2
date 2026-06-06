import { create } from 'zustand';
import LZString from 'lz-string';
import type { PeriodoNotas } from '../domain/types';

// ── Private hash helpers ────────────────────────────────────────────

const HASH_PREFIX = '#sim=';

/** Strips the expected URL hash prefix. Returns `null` when a different
 *  `#`-prefix is detected or when the hash is empty after stripping. */
function stripHashPrefix(raw: string): string | null {
  if (!raw) return null;
  if (raw.startsWith(HASH_PREFIX)) {
    const clean = raw.slice(HASH_PREFIX.length);
    return clean || null;
  }
  if (raw.startsWith('#')) return null;
  return raw;
}

/** Attempts LZString decompression. Returns `null` on failure. */
function tryDecompress(clean: string): string | null {
  try {
    const result = LZString.decompressFromEncodedURIComponent(clean);
    return result || null;
  } catch {
    return null;
  }
}

/** Attempts JSON parsing with a typed return. Returns `null` on failure. */
function tryParseJson<T>(decompressed: string): T | null {
  try {
    return JSON.parse(decompressed) as T;
  } catch {
    return null;
  }
}

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
    if (!hash) return false;

    const clean = stripHashPrefix(hash);
    if (clean === null) {
      console.error('importFromHash: missing #sim= prefix in hash');
      return false;
    }

    const decompressed = tryDecompress(clean);
    if (decompressed === null) {
      console.error('importFromHash: invalid base64 encoding');
      return false;
    }

    const data = tryParseJson<Record<string, Partial<PeriodoNotas>>>(decompressed);
    if (data === null) {
      console.error('importFromHash: decompressed data is not valid JSON');
      return false;
    }

    set({ activeSimulations: data });
    return true;
  }
}));
