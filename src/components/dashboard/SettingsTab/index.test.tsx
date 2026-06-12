
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SettingsTab } from './index';

// Mock sub-components
vi.mock('./PeriodWeightsEditor', () => ({
  PeriodWeightsEditor: () => <div data-testid="period-weights-editor" />
}));

vi.mock('./SubjectWeightsEditor', () => ({
  SubjectWeightsEditor: () => <div data-testid="subject-weights-editor" />
}));

vi.mock('./PresetWeightsManager', () => ({
  PresetWeightsManager: () => <div data-testid="preset-weights-manager" />
}));

describe('SettingsTab', () => {
  it('renders with "periods" sub-tab selected by default', () => {
    render(<SettingsTab />);
    expect(screen.getByTestId('period-weights-editor')).toBeInTheDocument();
    expect(screen.queryByTestId('subject-weights-editor')).not.toBeInTheDocument();
    expect(screen.queryByTestId('preset-weights-manager')).not.toBeInTheDocument();
  });

  it('clicking "Pesos por Asignatura" switches to SubjectWeightsEditor', () => {
    render(<SettingsTab />);
    const subjectsTab = screen.getByText('Pesos por Asignatura');
    fireEvent.click(subjectsTab);
    expect(screen.getByTestId('subject-weights-editor')).toBeInTheDocument();
    expect(screen.queryByTestId('period-weights-editor')).not.toBeInTheDocument();
  });

  it('clicking "Presets Institucionales" switches to PresetWeightsManager', () => {
    render(<SettingsTab />);
    const presetsTab = screen.getByText('Presets Institucionales');
    fireEvent.click(presetsTab);
    expect(screen.getByTestId('preset-weights-manager')).toBeInTheDocument();
    expect(screen.queryByTestId('period-weights-editor')).not.toBeInTheDocument();
  });
});
