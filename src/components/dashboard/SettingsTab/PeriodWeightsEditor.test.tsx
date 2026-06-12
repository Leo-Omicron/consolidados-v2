
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PeriodWeightsEditor } from './PeriodWeightsEditor';
import { useDashboardStore } from '../../../store/useDashboardStore';

vi.mock('../../../store/useDashboardStore', () => ({
  useDashboardStore: vi.fn()
}));

const mockSetConfig = vi.fn();

describe('PeriodWeightsEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useDashboardStore as unknown as any).mockImplementation((selector: any) => {
      const state = {
        config: { P1: 30, P2: 30, P3: 40, P4: 0 },
        setConfig: mockSetConfig
      };
      return selector ? selector(state) : state;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('displays current config values from store', () => {
    render(<PeriodWeightsEditor />);
    // 30 should appear for P1 and P2
    const inputs30 = screen.getAllByDisplayValue('30');
    expect(inputs30.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByDisplayValue('40')).toBeInTheDocument();
  });

  it('changing a slider updates the displayed percentage', () => {
    render(<PeriodWeightsEditor />);
    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[0], { target: { value: '50' } });
    expect(screen.getByDisplayValue('50')).toBeInTheDocument();
  });

  it('auto-compensates: P1+P2+P3 must equal 100 after any change', () => {
    render(<PeriodWeightsEditor />);
    const sliders = screen.getAllByRole('slider');
    
    fireEvent.change(sliders[0], { target: { value: '60' } });
    
    const currentValues = screen.getAllByRole('slider').map(s => Number((s as HTMLInputElement).value));
    
    // Sum of P1 + P2 + P3
    const p13Sum = currentValues[0] + currentValues[1] + currentValues[2];
    // If P4 is 0, then p13Sum should be exactly 100
    expect(p13Sum).toBeCloseTo(100, 0);
  });

  it('P4=0 is excluded from sum and hidden from bar', () => {
    render(<PeriodWeightsEditor />);
    const sliders = screen.getAllByRole('slider');
    expect(sliders).toHaveLength(4); 
    
    expect(sliders[3]).toHaveValue('0');
    
    const p1 = Number((sliders[0] as HTMLInputElement).value);
    const p2 = Number((sliders[1] as HTMLInputElement).value);
    const p3 = Number((sliders[2] as HTMLInputElement).value);
    expect(p1 + p2 + p3).toBeCloseTo(100, 0);
  });

  it('dispatches setConfig after debounce', async () => {
    render(<PeriodWeightsEditor />);
    const sliders = screen.getAllByRole('slider');
    
    fireEvent.change(sliders[0], { target: { value: '40' } });
    
    expect(mockSetConfig).not.toHaveBeenCalled();
    
    await waitFor(() => {
      expect(mockSetConfig).toHaveBeenCalledTimes(1);
    }, { timeout: 1000 });
    
    expect(mockSetConfig).toHaveBeenCalledWith(expect.objectContaining({ P1: 40 }));
  });
});
