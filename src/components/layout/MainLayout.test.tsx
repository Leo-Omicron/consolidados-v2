import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MainLayout } from './MainLayout';
import { useThemeStore } from '../../store/useThemeStore';

vi.mock('../dashboard/FileUploadArea', () => ({
  FileUploadArea: () => <div data-testid="file-upload-area" />
}));

vi.mock('../dashboard/AnalysisTab', () => ({
  AnalysisTab: () => <div data-testid="analysis-tab" />
}));

vi.mock('../dashboard/ChartsTab', () => ({
  ChartsTab: () => <div data-testid="charts-tab" />
}));

vi.mock('../dashboard/ReportsTab', () => ({
  ReportsTab: () => <div data-testid="reports-tab" />
}));

describe('MainLayout', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    useThemeStore.getState().setMode('light');
  });

  it('renders default layout structure', () => {
    render(<MainLayout />);
    expect(screen.getByText('Dashboard de Consolidados')).toBeDefined();
    expect(screen.getByTestId('file-upload-area')).toBeDefined();
    expect(screen.getByTestId('analysis-tab')).toBeDefined();
  });

  it('applies light mode to the document root by default', () => {
    render(<MainLayout />);

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(screen.getByRole('main')).toBeDefined();
  });

  it('applies the selected dark mode to the document root', () => {
    useThemeStore.getState().setMode('dark');

    render(<MainLayout />);

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(screen.getByText('Dashboard de Consolidados')).toBeDefined();
  });

  it('changes active tab when header tab is clicked', () => {
    render(<MainLayout />);
    
    fireEvent.click(screen.getByText('Charts'));
    expect(screen.getByTestId('charts-tab')).toBeDefined();
    expect(screen.queryByTestId('analysis-tab')).toBeNull();

    fireEvent.click(screen.getByText('Reports'));
    expect(screen.getByTestId('reports-tab')).toBeDefined();
  });
});
