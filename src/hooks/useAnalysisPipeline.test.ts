import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useAnalysisPipeline } from './useAnalysisPipeline';
import type { RowArea, SortConfig } from '../domain/types';

describe('useAnalysisPipeline', () => {
  const createMockRow = (
    id: string,
    estudiante: string,
    area: string,
    defP1: number | null,
    defP2: number | null,
    defP3: number | null,
    promActual: number | null,
    estadoText: 'Ganado' | 'Perdido' | 'N/A' = 'Ganado'
  ): RowArea => ({
    id,
    CURSO: '10A',
    estudiante,
    area,
    defP1,
    defP2,
    defP3,
    promActual,
    p4Min: null,
    estado: { text: estadoText, color: 'green' as any },
    CURSO_NORM: '10a',
    AREA_NORM: area.toLowerCase(),
    EST_NORM: estudiante.toLowerCase(),
  });

  const mockRows = [
    createMockRow('1', 'Alice', 'Math', 3.0, 3.5, 4.0, 3.5),
    createMockRow('2', 'Alice', 'Science', null, 4.0, null, 4.0),
    createMockRow('3', 'Bob', 'Math', 4.0, 3.8, 3.0, 3.6, 'Perdido'),
    createMockRow('4', 'Bob', 'Science', 3.0, 3.0, null, 3.0),
    createMockRow('5', 'Charlie', 'Math', null, null, null, null, 'N/A'),
  ];

  it('calculates trends correctly, handling nulls', () => {
    const { result } = renderHook(() =>
      useAnalysisPipeline(mockRows, { search: '', area: '', status: '' }, null)
    );

    const rows = result.current.groupedAndSorted.flatMap(g => g.rows);
    
    // Alice Math: p1=3.0, p3=4.0 -> 'up'
    const aliceMath = rows.find(r => r.id === '1');
    expect(aliceMath?.tendencia).toBe('up');

    // Alice Science: p1=null, p2=4.0, p3=null -> 'none' (cannot compare without p1)
    const aliceScience = rows.find(r => r.id === '2');
    expect(aliceScience?.tendencia).toBe('none');

    // Bob Math: p1=4.0, p3=3.0 -> 'down'
    const bobMath = rows.find(r => r.id === '3');
    expect(bobMath?.tendencia).toBe('down');

    // Bob Science: p1=3.0, p2=3.0, p3=null -> compares p2 and p1 -> 'flat'
    const bobScience = rows.find(r => r.id === '4');
    expect(bobScience?.tendencia).toBe('flat');

    // Charlie Math: all nulls -> 'none'
    const charlieMath = rows.find(r => r.id === '5');
    expect(charlieMath?.tendencia).toBe('none');
  });

  it('calculates group averages safely excluding nulls', () => {
    const { result } = renderHook(() =>
      useAnalysisPipeline(mockRows, { search: '', area: '', status: '' }, null)
    );

    const aliceGroup = result.current.groupedAndSorted.find(g => g.estudiante === 'Alice');
    // Alice promActual: Math(3.5) and Science(4.0) -> (3.5 + 4.0) / 2 = 3.75
    expect(aliceGroup?.aggregates.promActual).toBeCloseTo(3.75);
    // Alice defP1: Math(3.0), Science(null) -> 3.0
    expect(aliceGroup?.aggregates.defP1).toBe(3.0);
    // Alice defP3: Math(4.0), Science(null) -> 4.0
    expect(aliceGroup?.aggregates.defP3).toBe(4.0);

    const charlieGroup = result.current.groupedAndSorted.find(g => g.estudiante === 'Charlie');
    // Charlie: all nulls -> should be null
    expect(charlieGroup?.aggregates.promActual).toBeNull();
  });

  it('sorts groups and rows within groups correctly', () => {
    // We want to sort by promActual DESC
    const sortConfig: SortConfig = { key: 'aggregates.promActual', direction: 'desc' };

    const { result } = renderHook(() =>
      useAnalysisPipeline(mockRows, { search: '', area: '', status: '' }, sortConfig)
    );

    const groups = result.current.groupedAndSorted;
    
    // Check group sorting: Alice (3.75) > Bob (3.3) > Charlie (null)
    expect(groups[0].estudiante).toBe('Alice');
    expect(groups[1].estudiante).toBe('Bob');
    expect(groups[2].estudiante).toBe('Charlie');

    // Check row sorting within Alice's group: Science (4.0) > Math (3.5)
    expect(groups[0].rows[0].area).toBe('Science');
    expect(groups[0].rows[1].area).toBe('Math');
  });

  it('updates KPIs correctly when filters are applied', () => {
    const { result, rerender } = renderHook(
      (props) => useAnalysisPipeline(mockRows, props.filters, null),
      { initialProps: { filters: { search: '', area: '', status: '' } } }
    );

    // Initial KPIs: sum of promActual for all valid rows: 3.5 + 4.0 + 3.6 + 3.0 = 14.1
    // Average = 14.1 / 4 = 3.525
    expect(result.current.kpis.promedioGeneral).toBeCloseTo(3.525);
    expect(result.current.kpis.statusDistribution['Ganado']).toBe(3);
    expect(result.current.kpis.statusDistribution['Perdido']).toBe(1);

    // Filter by area: 'Math'
    rerender({ filters: { search: '', area: 'Math', status: '' } });
    
    // Math rows: Alice(3.5), Bob(3.6), Charlie(null)
    // Avg: (3.5 + 3.6) / 2 = 3.55
    expect(result.current.kpis.promedioGeneral).toBeCloseTo(3.55);
    expect(result.current.kpis.statusDistribution['Ganado']).toBe(1); // Alice
    expect(result.current.kpis.statusDistribution['Perdido']).toBe(1); // Bob
    expect(result.current.kpis.statusDistribution['N/A']).toBe(1); // Charlie
  });
});