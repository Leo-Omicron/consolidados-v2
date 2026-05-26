import { describe, it, expect, beforeEach } from 'vitest';
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
