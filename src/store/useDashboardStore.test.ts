import { describe, it, expect, vi } from 'vitest';
import { useDashboardStore } from './useDashboardStore';

// Mock File API since it's not available in Node environment by default
class MockFile {
  name: string;
  constructor(public parts: BlobPart[], name: string, public options?: FilePropertyBag) {
    this.name = name;
  }
  async arrayBuffer() {
    return new ArrayBuffer(0); // We don't actually read this in the mock
  }
}

// Mock XLSX
vi.mock('xlsx', () => {
  return {
    read: vi.fn().mockReturnValue({
      SheetNames: ['Sheet1'],
      Sheets: {
        'Sheet1': {} // Mock sheet
      }
    }),
    utils: {
      sheet_to_json: vi.fn().mockReturnValue([
        ['No', 'Estudiante', 'CIENCIAS', undefined],
        ['', '', 'BIOLOGIA', 'QUIMICA'],
        ['', '', 'P1', 'P1'],
        [1, 'Juan Perez', 4.0, 3.5]
      ])
    }
  };
});

describe('useDashboardStore', () => {
  it('initializes with default state', () => {
    const state = useDashboardStore.getState();
    expect(state.estudiantes).toEqual([]);
    expect(state.rowsArea).toEqual([]);
    expect(state.rowsAsignatura).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.config.P1).toBe(33.3);
  });

  it('updates state upon successful file processing', async () => {
    const file = new MockFile([], '10A.xlsx') as unknown as File;
    
    // We get the processFile function from store
    const { processFile } = useDashboardStore.getState();
    
    await processFile(file);
    
    const state = useDashboardStore.getState();
    
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    
    expect(state.estudiantes.length).toBe(1);
    expect(state.estudiantes[0].name).toBe('JUAN PEREZ');
    
    // Check if the data was flattened
    expect(state.rowsAsignatura.length).toBe(2);
    expect(state.rowsAsignatura[0].asignatura).toBe('BIOLOGIA');
    expect(state.rowsAsignatura[0].p1).toBe(4.0);
    
    // Check if academic logic was applied
    // (4.0 * 33.3) / 33.3 = 4.0 for Biologia P1
    expect(state.rowsAsignatura[0].promActual).toBe(4.0);
  });
});
