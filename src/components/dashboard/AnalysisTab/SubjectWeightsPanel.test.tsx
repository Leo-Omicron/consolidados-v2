import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SubjectWeightsPanel } from './SubjectWeightsPanel';

describe('SubjectWeightsPanel', () => {
  const mockOnToggle = vi.fn();
  const flatWeights = {
    '': {
      'Ciencias': { 'Física': 0.5, 'Química': 0.5 },
    },
  };

  const nestedWeights = {
    '9A': {
      'Ciencias': { 'Física': 0.5, 'Química': 0.5 },
    },
    '9B': {
      'Ciencias': { 'Biología': 1.0 },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when weights object is empty', () => {
    const { container } = render(
      <SubjectWeightsPanel weights={{}} isExpanded={false} onToggle={mockOnToggle} />
    );

    expect(container.innerHTML).toBe('');
  });

  it('renders collapsed with "Ver Pesos" label when weights exist and isExpanded=false', () => {
    render(
      <SubjectWeightsPanel weights={flatWeights} isExpanded={false} onToggle={mockOnToggle} />
    );

    const toggleButton = screen.getByRole('button', { name: /Ver Pesos de Asignaturas Inferidos/ });
    expect(toggleButton).toBeInTheDocument();
    expect(screen.queryByText('Ciencias:')).toBeNull();
  });

  it('renders expanded with "Ocultar Pesos" label when isExpanded=true', () => {
    render(
      <SubjectWeightsPanel weights={flatWeights} isExpanded={true} onToggle={mockOnToggle} />
    );

    const toggleButton = screen.getByRole('button', { name: /Ocultar Pesos de Asignaturas Inferidos/ });
    expect(toggleButton).toBeInTheDocument();
    expect(screen.getByText('Ciencias:')).toBeInTheDocument();
  });

  it('calls onToggle when the header button is clicked', () => {
    render(
      <SubjectWeightsPanel weights={flatWeights} isExpanded={false} onToggle={mockOnToggle} />
    );

    fireEvent.click(screen.getByRole('button', { name: /Ver Pesos de Asignaturas Inferidos/ }));
    expect(mockOnToggle).toHaveBeenCalledOnce();
  });

  it('displays percentage values rounded correctly for flat weights', () => {
    render(
      <SubjectWeightsPanel weights={flatWeights} isExpanded={true} onToggle={mockOnToggle} />
    );

    expect(screen.getByText('Ciencias:')).toBeInTheDocument();
    expect(screen.getByText(/Física: 50% \| Química: 50%/)).toBeInTheDocument();
  });

  it('displays group names as labels for nested weights', () => {
    render(
      <SubjectWeightsPanel weights={nestedWeights} isExpanded={true} onToggle={mockOnToggle} />
    );

    expect(screen.getByText('Grupo 9A:')).toBeInTheDocument();
    expect(screen.getByText('Grupo 9B:')).toBeInTheDocument();
    expect(screen.getByText(/Física: 50% \| Química: 50%/)).toBeInTheDocument();
    expect(screen.getByText(/Biología: 100%/)).toBeInTheDocument();
  });

  it('displays "Sin pesos configurados" message when group has no areas', () => {
    const emptyAreaWeights: Record<string, Record<string, Record<string, number>>> = {
      '10A': {},
    };

    render(
      <SubjectWeightsPanel weights={emptyAreaWeights} isExpanded={true} onToggle={mockOnToggle} />
    );

    expect(screen.getByText('Sin pesos configurados')).toBeInTheDocument();
  });

  it('displays arrow indicator in the toggle button', () => {
    render(
      <SubjectWeightsPanel weights={flatWeights} isExpanded={false} onToggle={mockOnToggle} />
    );

    const toggleButton = screen.getByRole('button', { name: /Ver Pesos de Asignaturas Inferidos/ });
    expect(toggleButton).toBeInTheDocument();
    // Arrow character is present as part of the button
    expect(screen.getByText('▼')).toBeInTheDocument();
  });
});
