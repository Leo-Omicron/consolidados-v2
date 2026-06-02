import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React, { useState, useCallback } from 'react';
import { FiltersBar } from './FiltersBar';

interface FiltersState {
  search: string;
  area: string;
  status: string;
}

/** Wrapper that manages filter state to verify updater behavior */
const FiltersBarTestWrapper: React.FC<{
  initialFilters?: FiltersState;
  initialGrupo?: string;
  viewMode?: 'area' | 'subject';
}> = ({ initialFilters, initialGrupo = 'Todos', viewMode = 'area' }) => {
  const [filters, setFilters] = useState<FiltersState>(initialFilters ?? { search: '', area: '', status: '' });
  const [grupo, setGrupo] = useState(initialGrupo);
  const groupChangeHandler = useCallback((g: string) => setGrupo(g), []);
  const filtersChangeHandler = useCallback(
    (updater: (prev: FiltersState) => FiltersState) => setFilters(updater),
    []
  );

  return (
    <div>
      <FiltersBar
        selectedGrupo={grupo}
        availableGroups={['Todos', '9A', '9B']}
        onGroupChange={groupChangeHandler}
        filters={filters}
        onFiltersChange={filtersChangeHandler}
        uniqueAreas={['Matemáticas', 'Ciencias']}
        uniqueStatuses={['Ganado', 'Perdido']}
        viewMode={viewMode}
      />
      <span data-testid="search-output">{filters.search}</span>
      <span data-testid="area-output">{filters.area}</span>
      <span data-testid="status-output">{filters.status}</span>
      <span data-testid="grupo-output">{grupo}</span>
    </div>
  );
};

describe('FiltersBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all filter controls with accessible labels', () => {
    render(<FiltersBarTestWrapper />);

    expect(screen.getByLabelText('Grupo')).toBeInTheDocument();
    expect(screen.getByLabelText('Buscar estudiante')).toBeInTheDocument();
    expect(screen.getByLabelText('Área')).toBeInTheDocument();
    expect(screen.getByLabelText('Estado')).toBeInTheDocument();
  });

  it('renders group select options from availableGroups', () => {
    render(<FiltersBarTestWrapper />);

    const groupSelect = screen.getByLabelText('Grupo') as HTMLSelectElement;
    const options = Array.from(groupSelect.options).map(o => o.value);
    expect(options).toEqual(['Todos', '9A', '9B']);
  });

  it('updates group when select changes', () => {
    render(<FiltersBarTestWrapper />);

    fireEvent.change(screen.getByLabelText('Grupo'), { target: { value: '9A' } });
    expect(screen.getByTestId('grupo-output').textContent).toBe('9A');
  });

  it('updates search filter when input changes', () => {
    render(<FiltersBarTestWrapper />);

    const searchInput = screen.getByLabelText('Buscar estudiante');
    fireEvent.change(searchInput, { target: { value: 'Perez' } });
    expect(screen.getByTestId('search-output').textContent).toBe('Perez');
  });

  it('updates area filter when select changes', () => {
    render(<FiltersBarTestWrapper />);

    fireEvent.change(screen.getByLabelText('Área'), { target: { value: 'Ciencias' } });
    expect(screen.getByTestId('area-output').textContent).toBe('Ciencias');
  });

  it('updates status filter when select changes', () => {
    render(<FiltersBarTestWrapper />);

    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'Perdido' } });
    expect(screen.getByTestId('status-output').textContent).toBe('Perdido');
  });

  it('renders "Asignatura" label instead of "Área" when viewMode is subject', () => {
    render(<FiltersBarTestWrapper viewMode="subject" />);

    expect(screen.getByLabelText('Asignatura')).toBeInTheDocument();
    expect(screen.queryByLabelText('Área')).toBeNull();
  });

  it('renders area options from uniqueAreas plus "Todas"', () => {
    render(<FiltersBarTestWrapper />);

    const areaSelect = screen.getByLabelText('Área') as HTMLSelectElement;
    const options = Array.from(areaSelect.options).map(o => o.value);
    expect(options).toEqual(['', 'Matemáticas', 'Ciencias']);
  });

  it('renders status options from uniqueStatuses plus "Todos"', () => {
    render(<FiltersBarTestWrapper />);

    const statusSelect = screen.getByLabelText('Estado') as HTMLSelectElement;
    const options = Array.from(statusSelect.options).map(o => o.value);
    expect(options).toEqual(['', 'Ganado', 'Perdido']);
  });

  it('shows initial filter values when provided', () => {
    render(
      <FiltersBarTestWrapper
        initialFilters={{ search: 'Juan', area: 'Matemáticas', status: 'Ganado' }}
      />
    );

    expect((screen.getByLabelText('Buscar estudiante') as HTMLInputElement).value).toBe('Juan');
    expect((screen.getByLabelText('Área') as HTMLSelectElement).value).toBe('Matemáticas');
    expect((screen.getByLabelText('Estado') as HTMLSelectElement).value).toBe('Ganado');
  });
});
