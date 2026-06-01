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

vi.mock('../dashboard/AlertsTab', () => ({
  AlertsTab: () => <div data-testid="alerts-tab" />
}));

vi.mock('../dashboard/TutorsTab', () => ({
  TutorsTab: () => <div data-testid="tutors-tab" />
}));

vi.mock('../dashboard/VolatilityTab', () => ({
  VolatilityTab: () => <div data-testid="volatility-tab" />
}));

vi.mock('../dashboard/HeatmapTab', () => ({
  HeatmapTab: () => <div data-testid="heatmap-tab" />
}));

describe('MainLayout', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    useThemeStore.getState().setMode('light');
  });

  it('renders default layout structure', async () => {
    render(<MainLayout />);
    expect(screen.getByText('Dashboard de Consolidados')).toBeDefined();
    expect(screen.getByTestId('file-upload-area')).toBeDefined();
    expect(await screen.findByTestId('analysis-tab')).toBeDefined();
  });

  it('applies light mode to the document root by default', async () => {
    render(<MainLayout />);

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(screen.getByRole('main')).toBeDefined();
    expect(await screen.findByTestId('analysis-tab')).toBeDefined();
  });

  it('applies the selected dark mode to the document root', async () => {
    useThemeStore.getState().setMode('dark');

    render(<MainLayout />);

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(screen.getByText('Dashboard de Consolidados')).toBeDefined();
    expect(await screen.findByTestId('analysis-tab')).toBeDefined();
  });

  it('changes active tab when header tab is clicked', async () => {
    render(<MainLayout />);

    fireEvent.click(screen.getByRole('button', { name: /Desempeño/ }));
    fireEvent.click(screen.getByText('Estadísticas'));
    expect(await screen.findByTestId('charts-tab')).toBeDefined();
    expect(screen.queryByTestId('analysis-tab')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /General/ }));
    fireEvent.click(screen.getByText('Reportes y PDF'));
    expect(await screen.findByTestId('reports-tab')).toBeDefined();
  });

  it('changes active tab to all available options', async () => {
    render(<MainLayout />);

    fireEvent.click(screen.getByRole('button', { name: /Seguimiento/ }));
    fireEvent.click(screen.getByText('Alertas Tempranas'));
    expect(await screen.findByTestId('alerts-tab')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /Seguimiento/ }));
    fireEvent.click(screen.getByText('Mentores'));
    expect(await screen.findByTestId('tutors-tab')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /Seguimiento/ }));
    fireEvent.click(screen.getByText('Volatilidad'));
    expect(await screen.findByTestId('volatility-tab')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /Desempeño/ }));
    fireEvent.click(screen.getByText('Mapa de Calor'));
    expect(await screen.findByTestId('heatmap-tab')).toBeDefined();
  });
});
