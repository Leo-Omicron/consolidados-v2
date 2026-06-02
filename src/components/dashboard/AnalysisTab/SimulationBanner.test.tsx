import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SimulationBanner } from './SimulationBanner';

describe('SimulationBanner', () => {
  const mockOnExportHash = vi.fn().mockReturnValue('test-hash-123');
  const mockOnClearAll = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnExportHash.mockReturnValue('test-hash-123');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when activeCount is 0', () => {
    const { container } = render(
      <SimulationBanner
        activeCount={0}
        onExportHash={mockOnExportHash}
        onClearAll={mockOnClearAll}
      />
    );

    expect(container.innerHTML).toBe('');
    expect(screen.queryByText('Modo de Simulación Activo')).toBeNull();
  });

  it('renders the simulation banner when activeCount > 0', () => {
    render(
      <SimulationBanner
        activeCount={3}
        onExportHash={mockOnExportHash}
        onClearAll={mockOnClearAll}
      />
    );

    expect(screen.getByText('Modo de Simulación Activo')).toBeInTheDocument();
    expect(screen.getByText(/Estás viendo promedios e indicadores académicos hipotéticos/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Compartir URL/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Restaurar datos reales/ })).toBeInTheDocument();
  });

  it('calls onExportHash and copies to clipboard when share button is clicked', () => {
    const writeTextMock = vi.fn();
    Object.assign(navigator, { clipboard: { writeText: writeTextMock } });
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <SimulationBanner
        activeCount={1}
        onExportHash={mockOnExportHash}
        onClearAll={mockOnClearAll}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Compartir URL/ }));

    expect(mockOnExportHash).toHaveBeenCalledOnce();
    expect(writeTextMock).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Enlace de simulación copiado'));

    alertSpy.mockRestore();
  });

  it('calls onClearAll when restore button is clicked', () => {
    render(
      <SimulationBanner
        activeCount={2}
        onExportHash={mockOnExportHash}
        onClearAll={mockOnClearAll}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Restaurar datos reales/ }));

    expect(mockOnClearAll).toHaveBeenCalledOnce();
  });

  it('renders when activeCount is exactly 1', () => {
    render(
      <SimulationBanner
        activeCount={1}
        onExportHash={mockOnExportHash}
        onClearAll={mockOnClearAll}
      />
    );

    expect(screen.getByText('Modo de Simulación Activo')).toBeInTheDocument();
  });
});
