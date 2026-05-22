import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileUploadArea } from './FileUploadArea';
import { useDashboardStore } from '../../store/useDashboardStore';

vi.mock('../../store/useDashboardStore', () => ({
  useDashboardStore: vi.fn()
}));

describe('FileUploadArea', () => {
  let processFileMock: any;
  let setConfigMock: any;

  beforeEach(() => {
    processFileMock = vi.fn();
    setConfigMock = vi.fn();
    
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        processFile: processFileMock,
        setConfig: setConfigMock,
        loading: false,
        error: null
      };
      return selector(state);
    });
  });

  it('renders upload buttons', () => {
    render(<FileUploadArea />);
    expect(screen.getByText('Cargar Excel')).toBeDefined();
    expect(screen.getByText('Cargar Configuración')).toBeDefined();
  });

  it('shows loading state', () => {
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        processFile: processFileMock,
        setConfig: setConfigMock,
        loading: true,
        error: null
      };
      return selector(state);
    });

    render(<FileUploadArea />);
    expect(screen.getByText('Procesando...')).toBeDefined();
    expect((screen.getByText('Procesando...').closest('button') as HTMLButtonElement)?.disabled).toBe(true);
  });

  it('shows error state', () => {
    (useDashboardStore as any).mockImplementation((selector: any) => {
      const state = {
        processFile: processFileMock,
        setConfig: setConfigMock,
        loading: false,
        error: 'Test error message'
      };
      return selector(state);
    });

    render(<FileUploadArea />);
    expect(screen.getByText('Test error message')).toBeDefined();
  });

  it('toggles isDragging state on dragOver and dragLeave', () => {
    render(<FileUploadArea />);
    const container = screen.getByTestId('file-upload-area-container');
    
    expect(container.className).toContain('border-dashed');
    expect(container.className).not.toContain('border-violet-500');

    fireEvent.dragOver(container);
    expect(container.className).toContain('border-violet-500');
    expect(container.className).toContain('bg-violet-50/40');

    fireEvent.dragLeave(container);
    expect(container.className).not.toContain('border-violet-500');
    expect(container.className).not.toContain('bg-violet-50/40');
  });

  it('handles drop event, processes excel files, and resets drag state', () => {
    render(<FileUploadArea />);
    const container = screen.getByTestId('file-upload-area-container');
    
    fireEvent.dragOver(container);
    expect(container.className).toContain('border-violet-500');

    const file = new File(['dummy xlsx'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    fireEvent.drop(container, {
      dataTransfer: {
        files: [file]
      }
    });

    expect(processFileMock).toHaveBeenCalledWith(file);
    expect(container.className).not.toContain('border-violet-500');
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
    expect(container.className).not.toContain('border-violet-500');
  });

  it('calls processFile when excel file is selected', () => {
    render(<FileUploadArea />);
    
    const fileInput = document.querySelector('input[accept=".xlsx,.xls"]') as HTMLInputElement;
    const file = new File(['dummy content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    expect(processFileMock).toHaveBeenCalledWith(file);
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
});
