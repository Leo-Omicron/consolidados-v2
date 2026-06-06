import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StudentGroupTable } from './StudentGroupTable';
import { StudentGroupHeader } from './StudentGroupTable/StudentGroupHeader';
import { StudentGroupRow } from './StudentGroupTable/StudentGroupRow';
import type { StudentGroup, PipelineRow, SortConfig, RowAsignatura, PeriodConfig } from '../../../domain/types';

describe('StudentGroupTable', () => {
  const mockOnToggleGroup = vi.fn();
  const mockOnToggleArea = vi.fn();
  const mockOnSort = vi.fn();
  const mockOnSetSimulation = vi.fn();
  const mockOnClearSimulation = vi.fn();

  const emptySortedGroups: StudentGroup<PipelineRow>[] = [];

  const sampleSortedGroups: StudentGroup<PipelineRow>[] = [
    {
      estudiante: 'Juan',
      grupo: '9A',
      rows: [
        {
          id: 'juan_Matemáticas',
          CURSO: '9A',
          estudiante: 'Juan',
          area: 'Matemáticas',
          grupo: '9A',
          defP1: 3.5,
          defP2: 3.0,
          defP3: null,
          promActual: 3.25,
          p4Min: 2.5,
          estado: { text: 'En riesgo', color: 'yellow' },
          CURSO_NORM: '9A',
          AREA_NORM: 'Matemáticas',
          EST_NORM: 'Juan',
          tendencia: 'flat' as const,
        } as PipelineRow,
        {
          id: 'juan_Ciencias',
          CURSO: '9A',
          estudiante: 'Juan',
          area: 'Ciencias',
          grupo: '9A',
          defP1: 4.0,
          defP2: 4.5,
          defP3: null,
          promActual: 4.25,
          p4Min: 1.5,
          estado: { text: 'Ganado', color: 'green' },
          CURSO_NORM: '9A',
          AREA_NORM: 'Ciencias',
          EST_NORM: 'Juan',
          tendencia: 'up' as const,
        } as PipelineRow,
      ],
      aggregates: { defP1: 3.75, defP2: 3.75, defP3: null, promActual: 3.75 },
    },
  ];

  const defaultProps = {
    sortedGroups: sampleSortedGroups,
    expandedGroups: {} as Record<string, boolean>,
    onToggleGroup: mockOnToggleGroup,
    expandedAreas: {} as Record<string, boolean>,
    onToggleArea: mockOnToggleArea,
    activeSimulations: {} as Record<string, Record<string, number>>,
    viewMode: 'area' as const,
    hasP4: false,
    evaluated: { P1: true, P2: true, P3: false, P4: false },
    config: { P1: 50, P2: 50, P3: 0 },
    subjectsByStudentArea: new Map(),
    onSort: mockOnSort,
    sortConfig: null as SortConfig,
    onSetSimulation: mockOnSetSimulation,
    onClearSimulation: mockOnClearSimulation,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty message when no groups', () => {
    render(<StudentGroupTable {...defaultProps} sortedGroups={emptySortedGroups} />);
    expect(screen.getByText('No se encontraron resultados.')).toBeInTheDocument();
  });

  it('renders student rows with student name', () => {
    render(<StudentGroupTable {...defaultProps} />);
    expect(screen.getByText('Juan')).toBeInTheDocument();
  });

  it('renders table header columns', () => {
    render(<StudentGroupTable {...defaultProps} />);

    expect(screen.getByText((content) => content.startsWith('Estudiante'))).toBeInTheDocument();
    expect(screen.getByText(/Áreas/)).toBeInTheDocument();
    // "Prom." appears in the sticky header; "Prom.Calc" is in the sub-table header
    const promElements = screen.getAllByText(/^Prom/);
    expect(promElements.length).toBeGreaterThanOrEqual(1);
  });

  it('expands student group on click and shows area rows', () => {
    render(<StudentGroupTable {...defaultProps} />);

    fireEvent.click(screen.getByText('Juan'));
    expect(mockOnToggleGroup).toHaveBeenCalledWith('Juan');
  });

  it('expands student group when expandedGroups has it set to true', () => {
    render(
      <StudentGroupTable
        {...defaultProps}
        expandedGroups={{ 'Juan': true }}
      />
    );

    // Area rows should be visible
    expect(screen.getByText('Matemáticas')).toBeInTheDocument();
    expect(screen.getByText('Ciencias')).toBeInTheDocument();
  });

  it('shows "Mín. P4" header when hasP4 is true', () => {
    render(
      <StudentGroupTable
        {...defaultProps}
        expandedGroups={{ 'Juan': true }}
        hasP4={true}
        config={{ P1: 25, P2: 25, P3: 25, P4: 25 }}
      />
    );

    expect(screen.getByText(/Mín. P4/)).toBeInTheDocument();
  });

  it('shows "Mín. P3" header when hasP4 is false', () => {
    render(
      <StudentGroupTable
        {...defaultProps}
        expandedGroups={{ 'Juan': true }}
        hasP4={false}
      />
    );

    expect(screen.getByText(/Mín. P3/)).toBeInTheDocument();
  });

  it('calls onSort when header is clicked', () => {
    render(<StudentGroupTable {...defaultProps} />);

    fireEvent.click(screen.getByText(/Estudiante/));
    expect(mockOnSort).toHaveBeenCalledWith('estudiante');
  });

  it('auto-expands groups with at-risk status when expandedGroups is empty', () => {
    // expandedGroups is empty, but the group has a row with "En riesgo" → should auto-expand
    render(<StudentGroupTable {...defaultProps} expandedGroups={{}} />);

    // Since the row has "En riesgo", the group should auto-expand (isGroupAtRisk = true)
    expect(screen.getByText('Matemáticas')).toBeInTheDocument();
  });

  it('displays row count for each student group', () => {
    render(<StudentGroupTable {...defaultProps} expandedGroups={{}} />);

    expect(screen.getByText(/2 áreas/)).toBeInTheDocument();
  });
});

// ── StudentGroupHeader interaction tests ──

describe('StudentGroupHeader', () => {
  it('renders "Estudiante" header and calls onSort on click', () => {
    const onSort = vi.fn();
    render(
      <StudentGroupHeader
        viewMode="area"
        onSort={onSort}
        sortConfig={null}
      />
    );

    fireEvent.click(screen.getByText(/Estudiante/));
    expect(onSort).toHaveBeenCalledWith('estudiante');
  });

  it('renders "Prom." header and calls onSort on click', () => {
    const onSort = vi.fn();
    render(
      <StudentGroupHeader
        viewMode="area"
        onSort={onSort}
        sortConfig={null}
      />
    );

    fireEvent.click(screen.getByText(/Prom/));
    expect(onSort).toHaveBeenCalledWith('aggregates.promActual');
  });

  it('shows ⬆️ when sort direction is asc for the active column', () => {
    render(
      <StudentGroupHeader
        viewMode="area"
        onSort={vi.fn()}
        sortConfig={{ key: 'estudiante', direction: 'asc' }}
      />
    );

    expect(screen.getByText(/⬆️/)).toBeInTheDocument();
  });

  it('shows ⬇️ when sort direction is desc for the active column', () => {
    render(
      <StudentGroupHeader
        viewMode="area"
        onSort={vi.fn()}
        sortConfig={{ key: 'estudiante', direction: 'desc' }}
      />
    );

    expect(screen.getByText(/⬇️/)).toBeInTheDocument();
  });

  it('shows ↕️ for columns that are not the active sort', () => {
    render(
      <StudentGroupHeader
        viewMode="area"
        onSort={vi.fn()}
        sortConfig={{ key: 'aggregates.promActual', direction: 'asc' }}
      />
    );

    // Estudiante column is not active → should show ↕️
    const estudianteCell = screen.getByText(/Estudiante/);
    expect(estudianteCell.textContent).toContain('↕️');
  });

  it('shows "Áreas" when viewMode is area', () => {
    render(
      <StudentGroupHeader
        viewMode="area"
        onSort={vi.fn()}
        sortConfig={null}
      />
    );

    expect(screen.getByText(/Áreas/)).toBeInTheDocument();
  });

  it('shows "Asignaturas" when viewMode is subject', () => {
    render(
      <StudentGroupHeader
        viewMode="subject"
        onSort={vi.fn()}
        sortConfig={null}
      />
    );

    expect(screen.getByText(/Asignaturas/)).toBeInTheDocument();
  });
});

// ── StudentGroupRow interaction tests ──

describe('StudentGroupRow', () => {
  const mockOnToggleGroup = vi.fn();
  const mockOnToggleArea = vi.fn();
  const mockOnSort = vi.fn();
  const mockOnSetSimulation = vi.fn();
  const mockOnClearSimulation = vi.fn();
  const mockOnOpenStudentProfile = vi.fn();

  const sampleGroup: StudentGroup<PipelineRow> = {
    estudiante: 'Juan',
    grupo: '9A',
    rows: [
      {
        id: 'juan_Matemáticas',
        CURSO: '9A',
        estudiante: 'Juan',
        area: 'Matemáticas',
        grupo: '9A',
        defP1: 3.5,
        defP2: 3.0,
        defP3: null,
        defP4: null,
        promActual: 3.25,
        p4Min: 2.5,
        estado: { text: 'En riesgo', color: 'yellow' },
        CURSO_NORM: '9A',
        AREA_NORM: 'Matemáticas',
        EST_NORM: 'Juan',
        tendencia: 'flat' as const,
      } as PipelineRow,
      {
        id: 'juan_Ciencias',
        CURSO: '9A',
        estudiante: 'Juan',
        area: 'Ciencias',
        grupo: '9A',
        defP1: 4.0,
        defP2: 4.5,
        defP3: null,
        defP4: null,
        promActual: 4.25,
        p4Min: 1.5,
        estado: { text: 'Ganado', color: 'green' },
        CURSO_NORM: '9A',
        AREA_NORM: 'Ciencias',
        EST_NORM: 'Juan',
        tendencia: 'up' as const,
      } as PipelineRow,
    ],
    aggregates: { defP1: 3.75, defP2: 3.75, defP3: null, promActual: 3.75 },
  };

  const mockConfig: PeriodConfig = { P1: 50, P2: 50, P3: 0 };

  const defaultRowProps = {
    group: sampleGroup,
    expandedGroups: {} as Record<string, boolean>,
    onToggleGroup: mockOnToggleGroup,
    expandedAreas: {} as Record<string, boolean>,
    onToggleArea: mockOnToggleArea,
    activeSimulations: {} as Record<string, Record<string, number>>,
    viewMode: 'area' as const,
    hasP4: false,
    evaluated: { P1: true, P2: true, P3: false, P4: false } as Record<'P1' | 'P2' | 'P3' | 'P4', boolean>,
    config: mockConfig,
    subjectsByStudentArea: new Map<string, RowAsignatura[]>(),
    onSort: mockOnSort,
    sortConfig: null as SortConfig,
    onSetSimulation: mockOnSetSimulation,
    onClearSimulation: mockOnClearSimulation,
    onOpenStudentProfile: mockOnOpenStudentProfile,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders student name and calls onToggleGroup on header click', () => {
    render(<StudentGroupRow {...defaultRowProps} />);

    const studentName = screen.getByText('Juan');
    expect(studentName).toBeInTheDocument();
    fireEvent.click(studentName);
    expect(mockOnToggleGroup).toHaveBeenCalledWith('Juan');
  });

  it('expands area rows when expandedGroups has the student set to true', () => {
    render(
      <StudentGroupRow
        {...defaultRowProps}
        expandedGroups={{ 'Juan': true }}
      />
    );

    expect(screen.getByText('Matemáticas')).toBeInTheDocument();
    expect(screen.getByText('Ciencias')).toBeInTheDocument();
  });

  it('calls onToggleArea when area folder button is clicked', () => {
    render(
      <StudentGroupRow
        {...defaultRowProps}
        expandedGroups={{ 'Juan': true }}
      />
    );

    // The first area row has a folder toggle button
    const toggleButton = screen.getByLabelText('Toggle subjects for Matemáticas');
    fireEvent.click(toggleButton);
    expect(mockOnToggleArea).toHaveBeenCalledWith('Juan', 'Matemáticas');
  });

  it('shows sub-table sortable P1 header and calls onSort on click', () => {
    render(
      <StudentGroupRow
        {...defaultRowProps}
        expandedGroups={{ 'Juan': true }}
      />
    );

    // P1 header inside the expanded sub-table
    const p1Headers = screen.getAllByText(/^P1/);
    expect(p1Headers.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(p1Headers[0]);
    expect(mockOnSort).toHaveBeenCalledWith('defP1');
  });

  it('calls onSetSimulation when min-grade value is clicked', () => {
    render(
      <StudentGroupRow
        {...defaultRowProps}
        expandedGroups={{ 'Juan': true }}
      />
    );

    // The min-grade cell for Matemáticas has p4Min=2.5 (≤5.0 → clickable)
    const minGrade = screen.getByText('2.50');
    fireEvent.click(minGrade);
    expect(mockOnSetSimulation).toHaveBeenCalledWith('juan_Matemáticas', 'P3', 2.5);
  });

  it('shows "Mín. P4" header when hasP4 is true', () => {
    render(
      <StudentGroupRow
        {...defaultRowProps}
        expandedGroups={{ 'Juan': true }}
        hasP4={true}
        config={{ P1: 25, P2: 25, P3: 25, P4: 25 }}
      />
    );

    expect(screen.getByText(/Mín. P4/)).toBeInTheDocument();
  });

  it('shows "Mín. P3" header when hasP4 is false', () => {
    render(
      <StudentGroupRow
        {...defaultRowProps}
        expandedGroups={{ 'Juan': true }}
        hasP4={false}
      />
    );

    expect(screen.getByText(/Mín. P3/)).toBeInTheDocument();
  });

  it('renders area name in expanded view with folder icon', () => {
    render(
      <StudentGroupRow
        {...defaultRowProps}
        expandedGroups={{ 'Juan': true }}
      />
    );

    // In expanded view, the area name column shows "Matemáticas"
    expect(screen.getByText('Matemáticas')).toBeInTheDocument();
  });

  it('calls onClearSimulation when Restaurar button is shown and clicked', () => {
    render(
      <StudentGroupRow
        {...defaultRowProps}
        activeSimulations={{ 'juan_Matemáticas': { P1: 3.0 } }}
      />
    );

    const restaurarBtn = screen.getByText('Restaurar');
    expect(restaurarBtn).toBeInTheDocument();
    fireEvent.click(restaurarBtn);
    // Should call onClearSimulation for each row in the group
    expect(mockOnClearSimulation).toHaveBeenCalledWith('juan_Matemáticas');
    expect(mockOnClearSimulation).toHaveBeenCalledWith('juan_Ciencias');
  });

  it('calls onOpenStudentProfile when Ficha button is clicked', () => {
    render(
      <StudentGroupRow
        {...defaultRowProps}
        onOpenStudentProfile={mockOnOpenStudentProfile}
      />
    );

    const fichaBtn = screen.getByText('Ficha');
    expect(fichaBtn).toBeInTheDocument();
    fireEvent.click(fichaBtn);
    expect(mockOnOpenStudentProfile).toHaveBeenCalledWith('Juan');
  });

  // ── Restaurar with child subjects ──

  it('shows Restaurar button when only a child subject has simulations', () => {
    const subjectsMap = new Map<string, RowAsignatura[]>();
    subjectsMap.set('Juan_Matemáticas', [
      {
        id: 'juan_Matematicas_ALGEBRA',
        estudiante: 'Juan',
        area: 'Matemáticas',
        asignatura: 'Álgebra',
        p1: 3.5,
        p2: 3.0,
        p3: null,
        p4: null,
        a: 0,
        promActual: 3.25,
        p4Min: null,
        estado: { text: 'Ganado', color: 'green' },
        CURSO: '9A',
        CURSO_NORM: '9A',
        AREA_NORM: 'Matemáticas',
        EST_NORM: 'Juan',
        grupo: '9A',
      } as RowAsignatura,
    ]);

    render(
      <StudentGroupRow
        {...defaultRowProps}
        subjectsByStudentArea={subjectsMap}
        activeSimulations={{ 'juan_Matematicas_ALGEBRA': { P1: 3.0 } }}
      />
    );

    // Restaurar should appear because child subject has simulation
    expect(screen.getByText('Restaurar')).toBeInTheDocument();
  });

  it('calls onClearSimulation for area rows AND child subjects when Restaurar is clicked', () => {
    const subjectsMap = new Map<string, RowAsignatura[]>();
    const childRow: RowAsignatura = {
      id: 'juan_Matematicas_ALGEBRA',
      estudiante: 'Juan',
      area: 'Matemáticas',
      asignatura: 'Álgebra',
      p1: 3.5,
      p2: 3.0,
      p3: null,
      p4: null,
      a: 0,
      promActual: 3.25,
      p4Min: null,
      estado: { text: 'Ganado', color: 'green' },
      CURSO: '9A',
      CURSO_NORM: '9A',
      AREA_NORM: 'Matemáticas',
      EST_NORM: 'Juan',
      grupo: '9A',
    } as RowAsignatura;
    subjectsMap.set('Juan_Matemáticas', [childRow]);

    render(
      <StudentGroupRow
        {...defaultRowProps}
        expandedGroups={{ 'Juan': true }}
        expandedAreas={{ 'Juan_Matemáticas': true }}
        subjectsByStudentArea={subjectsMap}
        activeSimulations={{ 'juan_Matemáticas': { P1: 3.0 } }}
      />
    );

    const restaurarBtn = screen.getByText('Restaurar');
    fireEvent.click(restaurarBtn);

    // Must clear area rows
    expect(mockOnClearSimulation).toHaveBeenCalledWith('juan_Matemáticas');
    expect(mockOnClearSimulation).toHaveBeenCalledWith('juan_Ciencias');
    // Must also clear child subjects
    expect(mockOnClearSimulation).toHaveBeenCalledWith('juan_Matematicas_ALGEBRA');
  });

  // ── colSpan tests ──

  it('uses colSpan=9 for expanded area wrapper without P4', () => {
    const subjectsMap = new Map<string, RowAsignatura[]>();
    subjectsMap.set('Juan_Matemáticas', [
      {
        id: 'juan_Matematicas_ALGEBRA',
        estudiante: 'Juan',
        area: 'Matemáticas',
        asignatura: 'Álgebra',
        p1: 3.5,
        p2: 3.0,
        p3: null,
        p4: null,
        a: 0,
        promActual: 3.25,
        p4Min: null,
        estado: { text: 'Ganado', color: 'green' },
        CURSO: '9A',
        CURSO_NORM: '9A',
        AREA_NORM: 'Matemáticas',
        EST_NORM: 'Juan',
        grupo: '9A',
      } as RowAsignatura,
    ]);

    render(
      <StudentGroupRow
        {...defaultRowProps}
        expandedGroups={{ 'Juan': true }}
        expandedAreas={{ 'Juan_Matemáticas': true }}
        subjectsByStudentArea={subjectsMap}
        hasP4={false}
      />
    );

    // Find the td that wraps the nested subject table (it has the p-3 pl-8 classes)
    const wrapperCells = document.querySelectorAll('td.p-3.pl-8');
    expect(wrapperCells.length).toBeGreaterThanOrEqual(1);
    expect(wrapperCells[0]).toHaveAttribute('colspan', '9');
  });

  it('uses colSpan=10 for expanded area wrapper with P4', () => {
    const subjectsMap = new Map<string, RowAsignatura[]>();
    subjectsMap.set('Juan_Matemáticas', [
      {
        id: 'juan_Matematicas_ALGEBRA',
        estudiante: 'Juan',
        area: 'Matemáticas',
        asignatura: 'Álgebra',
        p1: 3.5,
        p2: 3.0,
        p3: null,
        p4: 2.0,
        a: 0,
        promActual: 3.25,
        p4Min: null,
        estado: { text: 'Ganado', color: 'green' },
        CURSO: '9A',
        CURSO_NORM: '9A',
        AREA_NORM: 'Matemáticas',
        EST_NORM: 'Juan',
        grupo: '9A',
      } as RowAsignatura,
    ]);

    render(
      <StudentGroupRow
        {...defaultRowProps}
        expandedGroups={{ 'Juan': true }}
        expandedAreas={{ 'Juan_Matemáticas': true }}
        subjectsByStudentArea={subjectsMap}
        hasP4={true}
        config={{ P1: 25, P2: 25, P3: 25, P4: 25 }}
      />
    );

    const wrapperCells = document.querySelectorAll('td.p-3.pl-8');
    expect(wrapperCells.length).toBeGreaterThanOrEqual(1);
    expect(wrapperCells[0]).toHaveAttribute('colspan', '10');
  });

  it('uses colSpan=9 for empty subjects row without P4', () => {
    // No subjects in the map → empty state
    const emptyMap = new Map<string, RowAsignatura[]>();

    render(
      <StudentGroupRow
        {...defaultRowProps}
        expandedGroups={{ 'Juan': true }}
        expandedAreas={{ 'Juan_Matemáticas': true }}
        subjectsByStudentArea={emptyMap}
        hasP4={false}
      />
    );

    // The empty-state message td has p-4 text-center classes
    const emptyCells = screen.getAllByText('No hay asignaturas para esta área.');
    expect(emptyCells.length).toBeGreaterThanOrEqual(1);
    expect(emptyCells[0]).toHaveAttribute('colspan', '9');
  });

  it('uses colSpan=10 for empty subjects row with P4', () => {
    const emptyMap = new Map<string, RowAsignatura[]>();

    render(
      <StudentGroupRow
        {...defaultRowProps}
        expandedGroups={{ 'Juan': true }}
        expandedAreas={{ 'Juan_Matemáticas': true }}
        subjectsByStudentArea={emptyMap}
        hasP4={true}
        config={{ P1: 25, P2: 25, P3: 25, P4: 25 }}
      />
    );

    const emptyCells = screen.getAllByText('No hay asignaturas para esta área.');
    expect(emptyCells.length).toBeGreaterThanOrEqual(1);
    expect(emptyCells[0]).toHaveAttribute('colspan', '10');
  });
});
