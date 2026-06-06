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

const VALID_PERIODS = new Set(['P1', 'P2', 'P3', 'P4']);

/** Runtime schema validation for imported simulation data.
 *  Accepts only: `{ [rowId]: { P1?: number, P2?: number, P3?: number, P4?: number } }`
 *  Returns the validated data or `null` if invalid. */
function validateSimulationData(raw: unknown): Record<string, Partial<PeriodoNotas>> | null {
  // Must be a plain non-array object
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    console.error('importFromHash: schema validation failed — payload must be a plain object, got', typeof raw);
    return null;
  }

  const data = raw as Record<string, unknown>;
  const validated: Record<string, Partial<PeriodoNotas>> = {};

  for (const [rowId, periods] of Object.entries(data)) {
    // Each value must be a plain object
    if (periods === null || typeof periods !== 'object' || Array.isArray(periods)) {
      console.error('importFromHash: schema validation failed — row "%s" value must be a plain object', rowId);
      return null;
    }

    const entry = periods as Record<string, unknown>;
    const validatedEntry: Partial<PeriodoNotas> = {};
    let hasValidPeriod = false;

    for (const [period, grade] of Object.entries(entry)) {
      // Only P1-P4 are valid period keys
      if (!VALID_PERIODS.has(period)) {
        console.error('importFromHash: schema validation failed — invalid period key "%s" in row "%s"', period, rowId);
        return null;
      }

      // Grade must be a finite number in [0, 5]
      if (grade === null || grade === undefined || typeof grade !== 'number') {
        console.error('importFromHash: schema validation failed — period "%s" in row "%s" must be a number, got %s', period, rowId, typeof grade);
        return null;
      }

      if (!Number.isFinite(grade)) {
        console.error('importFromHash: schema validation failed — period "%s" in row "%s" is not a finite number: %d', period, rowId, grade);
        return null;
      }

      if (grade < 0 || grade > 5) {
        console.error('importFromHash: schema validation failed — period "%s" in row "%s" is out of range [0,5]: %d', period, rowId, grade);
        return null;
      }

      (validatedEntry as Record<string, number>)[period] = grade;
      hasValidPeriod = true;
    }

    // Row must have at least one valid period
    if (!hasValidPeriod) {
      console.error('importFromHash: schema validation failed — row "%s" has no valid period entries', rowId);
      return null;
    }

    validated[rowId] = validatedEntry;
  }

  return validated;
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

    const data = tryParseJson<unknown>(decompressed);
    if (data === null) {
      console.error('importFromHash: decompressed data is not valid JSON');
      return false;
    }

    const validated = validateSimulationData(data);
    if (validated === null) {
      return false;
    }

    set({ activeSimulations: validated });
    return true;
  }
}));
