import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import LZString from 'lz-string';
import { useSimulationStore } from './useSimulationStore';

describe('useSimulationStore', () => {
  beforeEach(() => {
    // Resetear el estado del store antes de cada test
    useSimulationStore.getState().clearAllSimulations();
  });

  it('starts with an empty simulations object', () => {
    expect(useSimulationStore.getState().activeSimulations).toEqual({});
  });

  it('sets a simulated grade successfully', () => {
    const rowId = 'student1_CIENCIAS_BIOLOGIA';
    useSimulationStore.getState().setSimulation(rowId, 'P3', 4.5);

    expect(useSimulationStore.getState().activeSimulations[rowId]).toEqual({
      P3: 4.5,
    });
  });

  it('clamps simulated grades to the [0.0, 5.0] range', () => {
    const rowId = 'student1_CIENCIAS_BIOLOGIA';
    
    // Test sobre el límite superior
    useSimulationStore.getState().setSimulation(rowId, 'P1', 6.5);
    expect(useSimulationStore.getState().activeSimulations[rowId]?.P1).toBe(5);

    // Test bajo el límite inferior
    useSimulationStore.getState().setSimulation(rowId, 'P2', -1.2);
    expect(useSimulationStore.getState().activeSimulations[rowId]?.P2).toBe(0);
  });

  it('rounds simulated grades to 2 decimal places', () => {
    const rowId = 'student1_CIENCIAS_BIOLOGIA';
    useSimulationStore.getState().setSimulation(rowId, 'P3', 3.33333);

    expect(useSimulationStore.getState().activeSimulations[rowId]?.P3).toBe(3.33);
  });

  it('allows multiple periods to be simulated for the same row', () => {
    const rowId = 'student1_CIENCIAS_BIOLOGIA';
    useSimulationStore.getState().setSimulation(rowId, 'P1', 3.5);
    useSimulationStore.getState().setSimulation(rowId, 'P2', 4.2);

    expect(useSimulationStore.getState().activeSimulations[rowId]).toEqual({
      P1: 3.5,
      P2: 4.2,
    });
  });

  it('clears a specific period simulation when setting to null', () => {
    const rowId = 'student1_CIENCIAS_BIOLOGIA';
    useSimulationStore.getState().setSimulation(rowId, 'P1', 3.5);
    useSimulationStore.getState().setSimulation(rowId, 'P2', 4.2);
    
    // Borrar P1
    useSimulationStore.getState().setSimulation(rowId, 'P1', null);

    expect(useSimulationStore.getState().activeSimulations[rowId]).toEqual({
      P2: 4.2,
    });
  });

  it('deletes the row key entirely if all simulated periods for that row are cleared', () => {
    const rowId = 'student1_CIENCIAS_BIOLOGIA';
    useSimulationStore.getState().setSimulation(rowId, 'P1', 3.5);
    
    // Borrar el único período
    useSimulationStore.getState().setSimulation(rowId, 'P1', null);

    expect(useSimulationStore.getState().activeSimulations[rowId]).toBeUndefined();
    expect(useSimulationStore.getState().activeSimulations).toEqual({});
  });

  it('clears a specific row completely using clearSimulation', () => {
    const rowId1 = 'student1_CIENCIAS_BIOLOGIA';
    const rowId2 = 'student1_CIENCIAS_QUIMICA';
    
    useSimulationStore.getState().setSimulation(rowId1, 'P1', 3.5);
    useSimulationStore.getState().setSimulation(rowId2, 'P1', 4.0);

    useSimulationStore.getState().clearSimulation(rowId1);

    expect(useSimulationStore.getState().activeSimulations[rowId1]).toBeUndefined();
    expect(useSimulationStore.getState().activeSimulations[rowId2]).toEqual({ P1: 4.0 });
  });

  it('clears all active simulations using clearAllSimulations', () => {
    useSimulationStore.getState().setSimulation('row1', 'P1', 3.5);
    useSimulationStore.getState().setSimulation('row2', 'P2', 4.0);

    useSimulationStore.getState().clearAllSimulations();

    expect(useSimulationStore.getState().activeSimulations).toEqual({});
  });
});

describe('importFromHash / exportToHash', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    useSimulationStore.getState().clearAllSimulations();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  // HASH-1: Empty string → false, state unchanged
  it('HASH-1: returns false for empty string without mutating state', () => {
    const s = useSimulationStore.getState();
    s.setSimulation('row1', 'P1', 3.5);

    const stateBefore = useSimulationStore.getState().activeSimulations;
    const result = s.importFromHash('');

    expect(result).toBe(false);
    expect(useSimulationStore.getState().activeSimulations).toEqual(stateBefore);
  });

  // HASH-2: Missing #sim= prefix → false, state unchanged, console.error
  it('HASH-2: returns false for hash without #sim= prefix and logs error', () => {
    const s = useSimulationStore.getState();
    s.setSimulation('row1', 'P1', 3.5);

    const stateBefore = useSimulationStore.getState().activeSimulations;
    const result = s.importFromHash('#otherKey=val');

    expect(result).toBe(false);
    expect(useSimulationStore.getState().activeSimulations).toEqual(stateBefore);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('sim')
    );
  });

  // HASH-2 triangulation: #sim= with nothing after prefix
  it('HASH-2: returns false when #sim= prefix is present but content is empty', () => {
    const s = useSimulationStore.getState();
    s.setSimulation('row1', 'P1', 3.5);

    const stateBefore = useSimulationStore.getState().activeSimulations;
    const result = s.importFromHash('#sim=');

    expect(result).toBe(false);
    expect(useSimulationStore.getState().activeSimulations).toEqual(stateBefore);
    // stripHashPrefix returns null → same error path as missing prefix
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('sim')
    );
  });

  // HASH-3: Invalid base64 → false, console.error, state unchanged
  it('HASH-3: returns false for invalid base64 and logs base64 error', () => {
    const s = useSimulationStore.getState();
    s.setSimulation('row1', 'P1', 3.5);

    const stateBefore = useSimulationStore.getState().activeSimulations;
    // Single character after #sim= is not valid LZString compressed data
    const result = s.importFromHash('#sim=x');

    expect(result).toBe(false);
    expect(useSimulationStore.getState().activeSimulations).toEqual(stateBefore);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('base64')
    );
  });

  // HASH-3 triangulation: different invalid base64 payload
  it('HASH-3: returns false for another invalid base64 variant', () => {
    const s = useSimulationStore.getState();
    s.setSimulation('row2', 'P2', 4.0);

    const stateBefore = useSimulationStore.getState().activeSimulations;
    const result = s.importFromHash('#sim=y');

    expect(result).toBe(false);
    expect(useSimulationStore.getState().activeSimulations).toEqual(stateBefore);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('base64')
    );
  });

  // HASH-3b: Valid base64 but non-JSON → false, console.error, state unchanged
  it('HASH-3b: returns false for valid base64 with non-JSON content and logs JSON error', () => {
    const s = useSimulationStore.getState();
    s.setSimulation('row1', 'P1', 3.5);

    const nonJsonHash = '#sim=' + LZString.compressToEncodedURIComponent('not-json');

    const stateBefore = useSimulationStore.getState().activeSimulations;
    const result = s.importFromHash(nonJsonHash);

    expect(result).toBe(false);
    expect(useSimulationStore.getState().activeSimulations).toEqual(stateBefore);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('JSON')
    );
  });

  // HASH-4: Valid import → true, state replaced
  it('HASH-4: returns true and replaces state for valid hash', () => {
    const s = useSimulationStore.getState();

    s.setSimulation('studentA_MATH', 'P1', 4.0);
    s.setSimulation('studentB_SCIENCE', 'P2', 3.5);

    const hash = s.exportToHash();

    s.clearAllSimulations();
    expect(useSimulationStore.getState().activeSimulations).toEqual({});

    const result = s.importFromHash(hash);

    expect(result).toBe(true);
    expect(useSimulationStore.getState().activeSimulations).toEqual({
      'studentA_MATH': { P1: 4.0 },
      'studentB_SCIENCE': { P2: 3.5 },
    });
  });

  // HASH-4 triangulation: import from export of different simulations
  it('HASH-4: roundtrip with single-period simulations', () => {
    const s = useSimulationStore.getState();

    s.setSimulation('studentX', 'P3', 2.75);

    const hash = s.exportToHash();
    s.clearAllSimulations();

    const result = s.importFromHash(hash);
    expect(result).toBe(true);
    expect(useSimulationStore.getState().activeSimulations).toEqual({
      studentX: { P3: 2.75 },
    });
  });

  // HASH-5: Roundtrip + empty export
  it('HASH-5: roundtrip preserves full state shape', () => {
    const s = useSimulationStore.getState();

    s.setSimulation('studentA_MATH', 'P1', 4.5);
    s.setSimulation('studentA_MATH', 'P2', 3.8);
    s.setSimulation('studentB_SCIENCE', 'P1', 2.5);
    s.setSimulation('studentB_SCIENCE', 'P3', 4.0);
    s.setSimulation('studentC_ART', 'P4', 5.0);

    const stateBefore = useSimulationStore.getState().activeSimulations;
    const hash = s.exportToHash();

    s.clearAllSimulations();
    s.importFromHash(hash);

    expect(useSimulationStore.getState().activeSimulations).toEqual(stateBefore);
  });

  it('HASH-5: empty simulation state exports as empty string', () => {
    const s = useSimulationStore.getState();
    s.clearAllSimulations();

    const hash = s.exportToHash();

    expect(hash).toBe('');
  });

  // ── Schema Validation Tests ──────────────────────────────────────

  // SCHEMA-1: Valid JSON but array instead of object → false, no mutation
  it('SCHEMA-1: rejects array payload without mutating state', () => {
    const s = useSimulationStore.getState();
    s.setSimulation('row1', 'P1', 3.5);
    const stateBefore = useSimulationStore.getState().activeSimulations;

    const hash = '#sim=' + LZString.compressToEncodedURIComponent(JSON.stringify([{ P1: 3.0 }]));

    const result = s.importFromHash(hash);

    expect(result).toBe(false);
    expect(useSimulationStore.getState().activeSimulations).toEqual(stateBefore);
    expect(consoleErrorSpy).toHaveBeenCalled();
    const errorMsg = consoleErrorSpy.mock.calls[0]?.join(' ') ?? '';
    expect(errorMsg).toContain('schema');
  });

  // SCHEMA-2: Invalid period key 'A' → false, no mutation
  it('SCHEMA-2: rejects invalid period key "A" without mutating state', () => {
    const s = useSimulationStore.getState();
    s.setSimulation('row1', 'P1', 3.5);
    const stateBefore = useSimulationStore.getState().activeSimulations;

    const hash = '#sim=' + LZString.compressToEncodedURIComponent(
      JSON.stringify({ row1: { A: 3.0 } })
    );

    const result = s.importFromHash(hash);

    expect(result).toBe(false);
    expect(useSimulationStore.getState().activeSimulations).toEqual(stateBefore);
    expect(consoleErrorSpy).toHaveBeenCalled();
    const errorMsg2 = consoleErrorSpy.mock.calls[0]?.join(' ') ?? '';
    expect(errorMsg2).toContain('schema');
  });

  // SCHEMA-3: Invalid period key 'P5' → false, no mutation
  it('SCHEMA-3: rejects invalid period key "P5" without mutating state', () => {
    const s = useSimulationStore.getState();
    s.setSimulation('row1', 'P1', 3.5);
    const stateBefore = useSimulationStore.getState().activeSimulations;

    const hash = '#sim=' + LZString.compressToEncodedURIComponent(
      JSON.stringify({ row1: { P5: 3.0 } })
    );

    const result = s.importFromHash(hash);

    expect(result).toBe(false);
    expect(useSimulationStore.getState().activeSimulations).toEqual(stateBefore);
    expect(consoleErrorSpy).toHaveBeenCalled();
    const errorMsg3 = consoleErrorSpy.mock.calls[0]?.join(' ') ?? '';
    expect(errorMsg3).toContain('schema');
  });

  // SCHEMA-4: Negative value → false, no mutation
  it('SCHEMA-4: rejects negative grade value without mutating state', () => {
    const s = useSimulationStore.getState();
    s.setSimulation('row1', 'P1', 3.5);
    const stateBefore = useSimulationStore.getState().activeSimulations;

    const hash = '#sim=' + LZString.compressToEncodedURIComponent(
      JSON.stringify({ row1: { P1: -1.0 } })
    );

    const result = s.importFromHash(hash);

    expect(result).toBe(false);
    expect(useSimulationStore.getState().activeSimulations).toEqual(stateBefore);
    expect(consoleErrorSpy).toHaveBeenCalled();
    const errorMsg4 = consoleErrorSpy.mock.calls[0]?.join(' ') ?? '';
    expect(errorMsg4).toContain('schema');
  });

  // SCHEMA-5: Value > 5 → false, no mutation
  it('SCHEMA-5: rejects grade value above 5 without mutating state', () => {
    const s = useSimulationStore.getState();
    s.setSimulation('row1', 'P1', 3.5);
    const stateBefore = useSimulationStore.getState().activeSimulations;

    const hash = '#sim=' + LZString.compressToEncodedURIComponent(
      JSON.stringify({ row1: { P1: 6.0 } })
    );

    const result = s.importFromHash(hash);

    expect(result).toBe(false);
    expect(useSimulationStore.getState().activeSimulations).toEqual(stateBefore);
    expect(consoleErrorSpy).toHaveBeenCalled();
    const errorMsg5 = consoleErrorSpy.mock.calls[0]?.join(' ') ?? '';
    expect(errorMsg5).toContain('schema');
  });

  // SCHEMA-6: NaN value → false, no mutation
  it('SCHEMA-6: rejects NaN grade value without mutating state', () => {
    const s = useSimulationStore.getState();
    s.setSimulation('row1', 'P1', 3.5);
    const stateBefore = useSimulationStore.getState().activeSimulations;

    // NaN cannot be JSON-serialized directly, so we simulate post-parse NaN
    const hash = '#sim=' + LZString.compressToEncodedURIComponent(
      JSON.stringify({ row1: { P1: 'not-a-number' } })
    );

    const result = s.importFromHash(hash);

    expect(result).toBe(false);
    expect(useSimulationStore.getState().activeSimulations).toEqual(stateBefore);
    expect(consoleErrorSpy).toHaveBeenCalled();
    const errorMsg6 = consoleErrorSpy.mock.calls[0]?.join(' ') ?? '';
    expect(errorMsg6).toContain('schema');
  });

  // SCHEMA-7: null value for a period → false, no mutation
  it('SCHEMA-7: rejects null grade value without mutating state', () => {
    const s = useSimulationStore.getState();
    s.setSimulation('row1', 'P1', 3.5);
    const stateBefore = useSimulationStore.getState().activeSimulations;

    const hash = '#sim=' + LZString.compressToEncodedURIComponent(
      JSON.stringify({ row1: { P1: null } })
    );

    const result = s.importFromHash(hash);

    expect(result).toBe(false);
    expect(useSimulationStore.getState().activeSimulations).toEqual(stateBefore);
    expect(consoleErrorSpy).toHaveBeenCalled();
    const errorMsg7 = consoleErrorSpy.mock.calls[0]?.join(' ') ?? '';
    expect(errorMsg7).toContain('schema');
  });

  // SCHEMA-8: Valid payload still imports correctly
  it('SCHEMA-8: valid payload imports successfully', () => {
    const s = useSimulationStore.getState();

    s.setSimulation('studentA', 'P1', 4.0);
    s.setSimulation('studentA', 'P3', 3.5);
    s.setSimulation('studentB', 'P2', 2.0);
    s.setSimulation('studentB', 'P4', 5.0);

    const stateBefore = useSimulationStore.getState().activeSimulations;
    const hash = s.exportToHash();

    s.clearAllSimulations();
    const result = s.importFromHash(hash);

    expect(result).toBe(true);
    expect(useSimulationStore.getState().activeSimulations).toEqual(stateBefore);
  });

  // SCHEMA-9: rejects empty object payload with no period keys
  it('SCHEMA-9: rejects row entry with empty periods object', () => {
    const s = useSimulationStore.getState();
    s.setSimulation('row1', 'P1', 3.5);
    const stateBefore = useSimulationStore.getState().activeSimulations;

    const hash = '#sim=' + LZString.compressToEncodedURIComponent(
      JSON.stringify({ row1: {} })
    );

    const result = s.importFromHash(hash);

    expect(result).toBe(false);
    expect(useSimulationStore.getState().activeSimulations).toEqual(stateBefore);
    expect(consoleErrorSpy).toHaveBeenCalled();
    const errorMsg9 = consoleErrorSpy.mock.calls[0]?.join(' ') ?? '';
    expect(errorMsg9).toContain('schema');
  });

  // SCHEMA-10: rejects Infinity value
  it('SCHEMA-10: rejects Infinity grade value without mutating state', () => {
    const s = useSimulationStore.getState();
    s.setSimulation('row1', 'P1', 3.5);
    const stateBefore = useSimulationStore.getState().activeSimulations;

    // JSON cannot represent Infinity, but the string "Infinity" could come from a crafted payload
    const hash = '#sim=' + LZString.compressToEncodedURIComponent(
      JSON.stringify({ row1: { P1: 'Infinity' } })
    );

    const result = s.importFromHash(hash);

    expect(result).toBe(false);
    expect(useSimulationStore.getState().activeSimulations).toEqual(stateBefore);
    expect(consoleErrorSpy).toHaveBeenCalled();
    const errorMsg10 = consoleErrorSpy.mock.calls[0]?.join(' ') ?? '';
    expect(errorMsg10).toContain('schema');
  });
});
