import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useAnalysisPipeline } from './useAnalysisPipeline';
import { useDashboardStore } from '../store/useDashboardStore';
import type { RowArea, RowAsignatura, SortConfig } from '../domain/types';

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
    grupo: 'mock',
  });

  const mockRows = [
    createMockRow('1', 'Alice', 'Math', 3.0, 3.5, 4.0, 3.5), // grupo: mock
    createMockRow('2', 'Alice', 'Science', null, 4.0, null, 4.0),
    createMockRow('3', 'Bob', 'Math', 4.0, 3.8, 3.0, 3.6, 'Perdido'), // let's change Bob to group B
    createMockRow('4', 'Bob', 'Science', 3.0, 3.0, null, 3.0),
    createMockRow('5', 'Charlie', 'Math', null, null, null, null, 'N/A'),
  ];
  mockRows[2].grupo = 'B';
  mockRows[3].grupo = 'B';

  it('calculates trends correctly, handling nulls', () => {
    const { result } = renderHook(() =>
      useAnalysisPipeline(mockRows, 'Todos', { search: '', area: '', status: '' }, null, 'area')
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
      useAnalysisPipeline(mockRows, 'Todos', { search: '', area: '', status: '' }, null, 'area')
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
      useAnalysisPipeline(mockRows, 'Todos', { search: '', area: '', status: '' }, sortConfig)
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
      (props) => useAnalysisPipeline(mockRows, 'Todos', props.filters, null),
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
  });

  it('filters rows by selectedGrupo', () => {
    const { result } = renderHook(() =>
      useAnalysisPipeline(mockRows, 'B', { search: '', area: '', status: '' }, null, 'area')
    );

    const rows = result.current.groupedAndSorted.flatMap(g => g.rows);
    expect(rows).toHaveLength(2);
    expect(rows.every(r => r.estudiante === 'Bob')).toBe(true);
  });

  it('calculates trends and aggregates correctly in subject mode using p1, p2, p3', () => {
    const createMockRowAsignatura = (
      id: string,
      estudiante: string,
      asignatura: string,
      p1: number | null,
      p2: number | null,
      p3: number | null,
      promActual: number | null
    ): any => ({
      id,
      CURSO: '10A',
      estudiante,
      asignatura,
      p1,
      p2,
      p3,
      promActual,
      p4Min: null,
      estado: { text: 'Ganado', color: 'green' },
      CURSO_NORM: '10a',
      ASIG_NORM: asignatura.toLowerCase(),
      EST_NORM: estudiante.toLowerCase(),
      grupo: 'mock',
    });

    const mockAsignaturas = [
      createMockRowAsignatura('1', 'Alice', 'Algebra', 3.0, 3.5, 4.0, 3.5),
      createMockRowAsignatura('2', 'Alice', 'Geometry', null, 4.0, null, 4.0),
    ];

    const { result } = renderHook(() =>
      useAnalysisPipeline(mockAsignaturas, 'Todos', { search: '', area: '', status: '' }, null, 'subject')
    );

    const aliceGroup = result.current.groupedAndSorted.find(g => g.estudiante === 'Alice');
    
    // Aggregates should read p1/p2/p3 instead of defP1/defP2/defP3
    expect(aliceGroup?.aggregates.defP1).toBe(3.0); // Wait, we map it to defP1 for the generic output, or maybe we leave it as p1? Let's check what the spec says.
    // The spec says: "Modify Step 4 (Grouping) to calculate aggregates reading the correct period keys depending on viewMode."
    // And Step 5: "Modify Step 5 (Final Sorting) to sort rows using the correct row keys (defP1 vs p1) based on viewMode."
    // Let's assume the grouped object structure `aggregates` might still use generic keys or we check the logic.
    // We will assert on the trend for Algebra: p1=3.0, p3=4.0 -> 'up'
    const algebraRow = aliceGroup?.rows.find(r => r.id === '1');
    expect(algebraRow?.tendencia).toBe('up');
    
    // Check sorting uses p1 when requested
    const sortConfig: SortConfig = { key: 'p1', direction: 'desc' };
    const { result: sortedResult } = renderHook(() =>
      useAnalysisPipeline(mockAsignaturas, 'Todos', { search: '', area: '', status: '' }, sortConfig, 'subject')
    );
    const sortedGroup = sortedResult.current.groupedAndSorted.find(g => g.estudiante === 'Alice');
    expect((sortedGroup?.rows[0] as any).asignatura).toBe('Algebra'); // Algebra (3.0) > Geometry (null)
  });

  describe('Promotion logic ("Regla de Oro")', () => {
    it('calculates failedAreasCount and isReprobado correctly from unfiltered rowsArea', () => {
      const aliceMath = createMockRow('a1', 'Alice', 'Math', 3.0, 3.0, 2.0, 2.7, 'Perdido');
      const aliceScience = createMockRow('a2', 'Alice', 'Science', 3.0, 3.0, 2.0, 2.7, 'Perdido');
      const aliceSpanish = createMockRow('a3', 'Alice', 'Spanish', 4.0, 4.0, 4.0, 4.0, 'Ganado');
      
      const bobMath = createMockRow('b1', 'Bob', 'Math', 3.0, 3.0, 2.0, 2.7, 'Perdido');
      const bobScience = createMockRow('b2', 'Bob', 'Science', 3.0, 3.0, 2.0, 2.7, 'Perdido');
      const bobSpanish = createMockRow('b3', 'Bob', 'Spanish', 3.0, 3.0, 2.0, 2.7, 'Perdido');

      const charlieMath = createMockRow('c1', 'Charlie', 'Math', 3.0, 3.0, 2.0, 2.7, 'Perdido');
      const charlieScience = createMockRow('c2', 'Charlie', 'Science', 4.0, 4.0, 4.0, 4.0, 'Ganado');

      const storeRows = [aliceMath, aliceScience, aliceSpanish, bobMath, bobScience, bobSpanish, charlieMath, charlieScience];
      useDashboardStore.setState({ rowsArea: storeRows });

      const { result } = renderHook(() =>
        useAnalysisPipeline(storeRows, 'Todos', { search: '', area: '', status: '' }, null, 'area')
      );

      const aliceGroup = result.current.groupedAndSorted.find(g => g.estudiante === 'Alice');
      expect(aliceGroup?.failedAreasCount).toBe(2);
      expect(aliceGroup?.isReprobado).toBe(false);

      const bobGroup = result.current.groupedAndSorted.find(g => g.estudiante === 'Bob');
      expect(bobGroup?.failedAreasCount).toBe(3);
      expect(bobGroup?.isReprobado).toBe(true);

      const charlieGroup = result.current.groupedAndSorted.find(g => g.estudiante === 'Charlie');
      expect(charlieGroup?.failedAreasCount).toBe(1);
      expect(charlieGroup?.isReprobado).toBe(false);
    });

    it('retains isReprobado and failedAreasCount even when active rows are filtered', () => {
      const aliceMath = createMockRow('a1', 'Alice', 'Math', 3.0, 3.0, 2.0, 2.7, 'Perdido');
      const aliceScience = createMockRow('a2', 'Alice', 'Science', 3.0, 3.0, 2.0, 2.7, 'Perdido');
      const aliceSpanish = createMockRow('a3', 'Alice', 'Spanish', 4.0, 4.0, 4.0, 4.0, 'Ganado');
      
      const bobMath = createMockRow('b1', 'Bob', 'Math', 3.0, 3.0, 2.0, 2.7, 'Perdido');
      const bobScience = createMockRow('b2', 'Bob', 'Science', 3.0, 3.0, 2.0, 2.7, 'Perdido');
      const bobSpanish = createMockRow('b3', 'Bob', 'Spanish', 3.0, 3.0, 2.0, 2.7, 'Perdido');

      const storeRows = [aliceMath, aliceScience, aliceSpanish, bobMath, bobScience, bobSpanish];
      useDashboardStore.setState({ rowsArea: storeRows });

      const filteredActiveRows = [aliceMath, bobMath];

      const { result } = renderHook(() =>
        useAnalysisPipeline(filteredActiveRows, 'Todos', { search: '', area: 'Math', status: 'Perdido' }, null, 'area')
      );

      const aliceGroup = result.current.groupedAndSorted.find(g => g.estudiante === 'Alice');
      expect(aliceGroup?.failedAreasCount).toBe(2);
      expect(aliceGroup?.isReprobado).toBe(false);

      const bobGroup = result.current.groupedAndSorted.find(g => g.estudiante === 'Bob');
      expect(bobGroup?.failedAreasCount).toBe(3);
      expect(bobGroup?.isReprobado).toBe(true);
    });

    it('does not count subject-level failures for the academic promotion status', () => {
      const aliceMath = createMockRow('a1', 'Alice', 'Math', 3.0, 3.0, 2.0, 2.7, 'Perdido');
      const aliceScience = createMockRow('a2', 'Alice', 'Science', 4.0, 4.0, 4.0, 4.0, 'Ganado');
      const storeRows = [aliceMath, aliceScience];
      useDashboardStore.setState({ rowsArea: storeRows });

      const mockAsignaturas = [
        { id: 'as1', estudiante: 'Alice', area: 'Math', asignatura: 'Algebra', estado: { text: 'Perdido' }, grupo: 'mock' },
        { id: 'as2', estudiante: 'Alice', area: 'Math', asignatura: 'Geometry', estado: { text: 'Perdido' }, grupo: 'mock' },
        { id: 'as3', estudiante: 'Alice', area: 'Math', asignatura: 'Calculus', estado: { text: 'Perdido' }, grupo: 'mock' },
        { id: 'as4', estudiante: 'Alice', area: 'Math', asignatura: 'Trig', estado: { text: 'Perdido' }, grupo: 'mock' },
      ];

      const { result } = renderHook(() =>
        useAnalysisPipeline(mockAsignaturas as RowAsignatura[], 'Todos', { search: '', area: '', status: '' }, null, 'subject')
      );

      const aliceGroup = result.current.groupedAndSorted.find(g => g.estudiante === 'Alice');
      expect(aliceGroup?.failedAreasCount).toBe(1);
      expect(aliceGroup?.isReprobado).toBe(false);
    });
  });
});