import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { FileUploadArea } from './FileUploadArea';
import { useDashboardStore } from '../../store/useDashboardStore';

vi.mock('../../store/useDashboardStore', () => ({
  useDashboardStore: vi.fn()
}));

describe('FileUploadArea', () => {
  let processFilesMock: any;
  let setConfigMock: any;

  beforeEach(() => {
    processFilesMock = vi.fn();
    setConfigMock = vi.fn();
    
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        processFiles: processFilesMock,
        setConfig: setConfigMock,
        loading: false,
        error: null,
        diagnosticReport: null
      };
      return selector(state);
    });
  });

  it('renders the upload surface as an accessible dashboard region', () => {
    render(<FileUploadArea />);
    expect(screen.getByRole('region', { name: /Cargar Datos de Estudiantes/i })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Cargar Excel' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Cargar Configuración' })).toBeDefined();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<FileUploadArea />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('shows loading state', () => {
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        processFiles: processFilesMock,
        setConfig: setConfigMock,
        loading: true,
        error: null,
        parsingProgress: null
      };
      return selector(state);
    });

    render(<FileUploadArea />);
    expect(screen.getByText('Procesando...')).toBeDefined();
    expect((screen.getByText('Procesando...').closest('button') as HTMLButtonElement)?.disabled).toBe(true);
  });

  it('shows parsing progress text from store when available', () => {
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        processFiles: processFilesMock,
        setConfig: setConfigMock,
        loading: true,
        error: null,
        parsingProgress: 'Extrayendo estudiantes...'
      };
      return selector(state);
    });

    render(<FileUploadArea />);
    expect(screen.getByText('Extrayendo estudiantes...')).toBeDefined();
    // "Procesando..." should NOT be rendered when progress text is available
    expect(screen.queryByText('Procesando...')).toBeNull();
    // Button should still be disabled during loading
    expect((screen.getByText('Extrayendo estudiantes...').closest('button') as HTMLButtonElement)?.disabled).toBe(true);
  });

  it('falls back to "Procesando..." when loading but no parsingProgress', () => {
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        processFiles: processFilesMock,
        setConfig: setConfigMock,
        loading: true,
        error: null,
        parsingProgress: null
      };
      return selector(state);
    });

    render(<FileUploadArea />);
    expect(screen.getByText('Procesando...')).toBeDefined();
  });

  it('shows error state', () => {
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        processFiles: processFilesMock,
        setConfig: setConfigMock,
        loading: false,
        error: 'Test error message'
      };
      return selector(state);
    });

    render(<FileUploadArea />);
    expect(screen.getByRole('alert').textContent).toContain('Test error message');
  });

  it('keeps upload instructions available while drag state changes', () => {
    render(<FileUploadArea />);
    const container = screen.getByTestId('file-upload-area-container');

    fireEvent.dragOver(container);
    expect(screen.getByText('Cargar Datos de Estudiantes')).toBeDefined();
    expect((screen.getByRole('button', { name: 'Cargar Excel' }) as HTMLButtonElement).disabled).toBe(false);

    fireEvent.dragLeave(container);
    expect(screen.getByText(/Arrastr/)).toBeDefined();
  });

  it('handles drop event, processes excel files, and resets drag state', () => {
    render(<FileUploadArea />);
    const container = screen.getByTestId('file-upload-area-container');
    
    const file = new File(['dummy xlsx'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    fireEvent.drop(container, {
      dataTransfer: {
        files: [file]
      }
    });

    expect(processFilesMock).toHaveBeenCalledWith([file]);
    expect((screen.getByRole('button', { name: 'Cargar Excel' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('handles drop event for JSON config and triggers setConfig', async () => {
    render(<FileUploadArea />);
    const container = screen.getByTestId('file-upload-area-container');
    
    const configData = { periods: [] };
    const file = new File([JSON.stringify(configData)], 'config.json', { type: 'application/json' });
    
    fireEvent.drop(container, {
      dataTransfer: {
        files: [file]
      }
    });

    await new Promise(resolve => setTimeout(resolve, 50));
    expect(setConfigMock).toHaveBeenCalledWith(configData);
    expect(screen.getByText(/Arrastr/)).toBeDefined();
  });

  it('calls processFile when excel file is selected', () => {
    render(<FileUploadArea />);
    
    const fileInput = document.querySelector('input[accept=".xlsx,.xls"]') as HTMLInputElement;
    const file = new File(['dummy content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    expect(processFilesMock).toHaveBeenCalledWith([file]);
  });

  it('calls setConfig when valid json file is selected', async () => {
    render(<FileUploadArea />);
    
    const configInput = document.querySelector('input[accept=".json"]') as HTMLInputElement;
    const configData = { periods: [] };
    const file = new File([JSON.stringify(configData)], 'config.json', { type: 'application/json' });
    
    fireEvent.change(configInput, { target: { files: [file] } });
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(setConfigMock).toHaveBeenCalledWith(configData);
  });

  it('renders the premium diagnostic accordion with sheet grouping, cell coordinates, and recommended actions', () => {
    const mockReport = {
      isValid: true,
      totalSheetsProcessed: 1,
      issues: [
        {
          code: 'EMPTY_GRADE',
          severity: 'WARNING',
          sheet: '6A',
          row: 4,
          col: 'C',
          message: 'Calificación vacía en C4',
          action: 'Ingrese nota de P1'
        },
        {
          code: 'EMPTY_SHEET',
          severity: 'SUGGESTION',
          sheet: 'Grupo Inactivo',
          message: 'La hoja está vacía',
          action: 'Verifique si debe eliminarse'
        }
      ]
    };

    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        processFiles: processFilesMock,
        setConfig: setConfigMock,
        loading: false,
        error: null,
        diagnosticReport: mockReport
      };
      return selector(state);
    });

    render(<FileUploadArea />);

    // Show the report by clicking the restore button since it is hidden by default
    const restoreBtn = screen.getByTestId('restore-diagnostic-btn');
    fireEvent.click(restoreBtn);

    // Assert main header is rendered
    expect(screen.getByText('Resultados del Diagnóstico de Calidad')).toBeDefined();
    expect(screen.getByText('2 advertencias / sugerencias')).toBeDefined();

    // Assert sheet groups are rendered
    expect(screen.getByText('Hoja: 6A')).toBeDefined();
    expect(screen.getByText('Hoja: Grupo Inactivo')).toBeDefined();

    // Assert messages and severity labels
    expect(screen.getAllByText('Calificación vacía en C4')[0]).toBeDefined();
    expect(screen.getAllByText('La hoja está vacía')[0]).toBeDefined();

    // Assert coordinates are displayed nicely
    expect(screen.getByText('C4')).toBeDefined();

    // Assert recommended actions
    expect(screen.getByText('Ingrese nota de P1')).toBeDefined();
    expect(screen.getByText('Verifique si debe eliminarse')).toBeDefined();
  });

  it('allows collapsing, expanding, dismissing, and restoring the diagnostic report', () => {
    const mockReport = {
      isValid: true,
      totalSheetsProcessed: 1,
      issues: [
        {
          code: 'EMPTY_GRADE',
          severity: 'WARNING',
          sheet: '6A',
          row: 4,
          col: 'C',
          message: 'Calificación vacía en C4',
          action: 'Ingrese nota de P1'
        }
      ]
    };

    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        processFiles: processFilesMock,
        setConfig: setConfigMock,
        loading: false,
        error: null,
        diagnosticReport: mockReport
      };
      return selector(state);
    });

    render(<FileUploadArea />);

    // Initially, the report is hidden/dismissed by default
    expect(screen.queryByText('Resultados del Diagnóstico de Calidad')).toBeNull();
    expect(screen.queryByText('Calificación vacía en C4')).toBeNull();

    // Show it
    const initialRestoreBtn = screen.getByTestId('restore-diagnostic-btn');
    fireEvent.click(initialRestoreBtn);

    // Now, the report and its contents are visible
    expect(screen.getByText('Resultados del Diagnóstico de Calidad')).toBeDefined();
    expect(screen.getAllByText('Calificación vacía en C4')[0]).toBeDefined();
    
    // Collapse the report
    const collapseBtn = screen.getByTestId('toggle-diagnostic-collapse-btn');
    fireEvent.click(collapseBtn);

    // The header is still there, but content (issues) is hidden
    expect(screen.getByText('Resultados del Diagnóstico de Calidad')).toBeDefined();
    expect(screen.queryByText('Calificación vacía en C4')).toBeNull();

    // Expand the report again
    fireEvent.click(collapseBtn);
    expect(screen.getAllByText('Calificación vacía en C4')[0]).toBeDefined();

    // Dismiss the report
    const dismissBtn = screen.getByTestId('dismiss-diagnostic-btn');
    fireEvent.click(dismissBtn);

    // Now, the report header and content are completely hidden
    expect(screen.queryByText('Resultados del Diagnóstico de Calidad')).toBeNull();
    expect(screen.queryByText('Calificación vacía en C4')).toBeNull();

    // But we have the restore button
    const restoreBtn = screen.getByTestId('restore-diagnostic-btn');
    expect(restoreBtn).toBeDefined();
    expect(restoreBtn.textContent).toContain('Mostrar resultados del diagnóstico (1)');

    // Click restore to show it again
    fireEvent.click(restoreBtn);
    expect(screen.getByText('Resultados del Diagnóstico de Calidad')).toBeDefined();
    expect(screen.getAllByText('Calificación vacía en C4')[0]).toBeDefined();
  });
});
