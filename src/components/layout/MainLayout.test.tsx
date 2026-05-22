import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MainLayout } from './MainLayout';

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
  it('renders default layout structure', () => {
    render(<MainLayout />);
    expect(screen.getByText('Dashboard de Consolidados')).toBeDefined();
    expect(screen.getByTestId('file-upload-area')).toBeDefined();
    expect(screen.getByTestId('analysis-tab')).toBeDefined();
  });

  it('applies premium layout styling and container classes', () => {
    const { container } = render(<MainLayout />);
    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv.className).toContain('bg-slate-50/50');
    
    const cardContainer = container.querySelector('.print-card-flat');
    expect(cardContainer?.className).toContain('rounded-xl');
    expect(cardContainer?.className).toContain('border-slate-200/50');
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
