
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PresetWeightsManager } from './PresetWeightsManager';
import { useDashboardStore } from '../../../store/useDashboardStore';
import * as academicWeights from '../../../config/academicWeights';

vi.mock('../../../store/useDashboardStore', () => ({
  useDashboardStore: vi.fn()
}));

const mockApplyPresetWeights = vi.fn();
const mockClearCustomWeights = vi.fn();

const originalConfirm = window.confirm;
const originalAlert = window.alert;

describe('PresetWeightsManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useDashboardStore as unknown as any).mockImplementation((selector: any) => {
      const state = {
        estudiantes: [
          { 
            grupo: '10A', 
            areas: {
              'HUMANIDADES': { asignaturas: { 'ESPAÑOL': 1, 'INGLES': 1 } }
            }
          }
        ],
        availableGroups: ['Todos', '10A'],
        applyPresetWeights: mockApplyPresetWeights,
        clearCustomWeights: mockClearCustomWeights
      };
      return selector ? selector(state) : state;
    });
    
    window.confirm = vi.fn(() => true);
    window.alert = vi.fn();
    
    vi.spyOn(academicWeights, 'getPresetWeights').mockReturnValue({ 'ESPAÑOL': 0.6, 'INGLES': 0.4 });
  });
  
  afterEach(() => {
    window.confirm = originalConfirm;
    window.alert = originalAlert;
    vi.restoreAllMocks();
  });

  it('lists all presets from PRESETS constant in the table', () => {
    render(<PresetWeightsManager />);
    expect(screen.getAllByText('HUMANIDADES').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('MATEMATICAS').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('1-9').length).toBeGreaterThanOrEqual(1);
  });

  it('"Previsualizar" shows weight preview without mutating store', () => {
    render(<PresetWeightsManager />);
    
    const previewButtons = screen.getAllByText('Previsualizar');
    fireEvent.click(previewButtons[0]);
    
    expect(screen.getByText(/Vista previa: HUMANIDADES/i)).toBeInTheDocument();
    expect(screen.getByText('ESPAÑOL')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
    
    expect(mockApplyPresetWeights).not.toHaveBeenCalled();
  });

  it('"Aplicar todos los presets" dispatches applyPresetWeights and shows alert', () => {
    render(<PresetWeightsManager />);
    
    const applyAllBtn = screen.getByText('Aplicar todos los presets');
    fireEvent.click(applyAllBtn);
    
    expect(window.confirm).toHaveBeenCalled();
    expect(mockApplyPresetWeights).toHaveBeenCalledTimes(1);
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Presets aplicados'));
  });
});
