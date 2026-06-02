import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StudentGroupTable } from './StudentGroupTable';
import type { StudentGroup, PipelineRow, SortConfig } from '../../../domain/types';

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
    evaluated: ['P1', 'P2'] as string[],
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
